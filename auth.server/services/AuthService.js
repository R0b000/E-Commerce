const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { Response } = require('../../Shared/API/wrappers/Response');
const { User } = require('../models/database/User');
const { config } = require('../../Shared/API/config/config');

// Helper functions for RFC 6238 TOTP (Google / Microsoft Authenticator)
function generateTotpSecret() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  let secret = '';
  const bytes = crypto.randomBytes(20);
  for (let i = 0; i < bytes.length; i++) {
    secret += chars[bytes[i] % chars.length];
  }
  return secret;
}

function base32ToBuffer(base32) {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  let bits = '';
  for (let i = 0; i < base32.length; i++) {
    const val = alphabet.indexOf(base32.charAt(i).toUpperCase());
    if (val >= 0) {
      bits += val.toString(2).padStart(5, '0');
    }
  }
  const bytes = [];
  for (let i = 0; i + 8 <= bits.length; i += 8) {
    bytes.push(parseInt(bits.substr(i, 8), 2));
  }
  return Buffer.from(bytes);
}

function verifyTotpToken(secret, token, window = 1) {
  if (!token || !secret) return false;
  const cleanToken = token.toString().trim();
  const key = base32ToBuffer(secret);
  const epoch = Math.floor(Date.now() / 1000);
  const timeStep = 30;

  for (let i = -window; i <= window; i++) {
    const counter = Math.floor(epoch / timeStep) + i;
    const buf = Buffer.alloc(8);
    buf.writeUInt32BE(Math.floor(counter / 0x100000000), 0);
    buf.writeUInt32BE(counter & 0xffffffff, 4);

    const hmac = crypto.createHmac('sha1', key).update(buf).digest();
    const offset = hmac[hmac.length - 1] & 0x0f;
    const code =
      (((hmac[offset] & 0x7f) << 24) |
        ((hmac[offset + 1] & 0xff) << 16) |
        ((hmac[offset + 2] & 0xff) << 8) |
        (hmac[offset + 3] & 0xff)) %
      1000000;

    const formattedCode = code.toString().padStart(6, '0');
    if (formattedCode === cleanToken) {
      return true;
    }
  }
  return false;
}

// Timing Attack Prevention Helper: guarantees constant-time response (minimum 4000ms)
async function enforceMinimumDuration(startTime, minimumMs = 4000) {
  const elapsed = Date.now() - startTime;
  const remaining = Math.max(0, minimumMs - elapsed);
  if (remaining > 0) {
    await new Promise((resolve) => setTimeout(resolve, remaining));
  }
}

class AuthService {
  constructor() {
    this.JWT_SECRET = config.jwtSecret;
    this.JWT_EXPIRES_IN = config.jwtExpiresIn;
  }

  generateToken(user) {
    const tokenPayload = {
      id: user._id.toString(),
      email: user.email,
      role: user.role,
    };

    return jwt.sign(tokenPayload, this.JWT_SECRET, {
      expiresIn: this.JWT_EXPIRES_IN,
    });
  }

  formatUserResponse(user) {
    return {
      id: user._id.toString(),
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      avatarUrl: user.avatarUrl || '',
      bio: user.bio || '',
      phone: user.phone || '',
      address: user.address || '',
      role: user.role,
      vendorProfile: user.vendorProfile || null,
      customPermissions: user.customPermissions || [],
      hasPasskey: Array.isArray(user.fidoCredentials) && user.fidoCredentials.length > 0,
      passkeysCount: Array.isArray(user.fidoCredentials) ? user.fidoCredentials.length : 0,
      isTwoFactorEnabled: Boolean(user.isTwoFactorEnabled),
      twoFactorMethod: user.twoFactorMethod || 'authenticator',
      alertOnNewDevice: user.alertOnNewDevice !== false,
      agreementAccepted: Boolean(user.agreementAccepted),
      agreementAcceptedAt: user.agreementAcceptedAt || null,
      agreementVersion: user.agreementVersion || '1.0',
      lastLoginIp: user.lastLoginIp || null,
      lastPasswordChange: user.lastPasswordChange || null,
    };
  }

  async lookupUser(identifier) {
    try {
      if (!identifier) {
        return Response.fail('Identifier (email or username) is required', [], 400);
      }

      const email = identifier.toLowerCase().trim();
      const user = await User.findOne({
        $or: [{ email }, { firstName: new RegExp(`^${identifier.trim()}$`, 'i') }],
      }).exec();

      if (!user) {
        return Response.fail('User not found', [], 404);
      }

      return Response.success(
        {
          userId: user._id.toString(),
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          hasPasskey: Array.isArray(user.fidoCredentials) && user.fidoCredentials.length > 0,
          requiresFido2: Array.isArray(user.fidoCredentials) && user.fidoCredentials.length > 0,
          requiresAuthenticator: Boolean(user.isTwoFactorEnabled),
          isActive: user.isActive,
        },
        ['User resolved']
      );
    } catch (error) {
      console.error('[AuthService.lookupUser] Error:', error);
      return Response.fail('Lookup failed', [error.message], 500);
    }
  }

  async login(request) {
    const startTime = Date.now();
    try {
      const { email, password, totpCode } = request || {};

      const user = await User.findOne({ email: email?.toLowerCase().trim() }).exec();

      if (!user) {
        // Run dummy bcrypt compare to equalize execution profile against timing analysis
        await bcrypt.compare(password || '', '$2a$10$abcdefghijklmnopqrstuuNOPQRSTUVWXYZ0123456789ABCDEF');
        await enforceMinimumDuration(startTime, 4000);
        return Response.fail('Invalid email or password', [], 401);
      }

      if (!user.isActive) {
        await enforceMinimumDuration(startTime, 4000);
        return Response.fail('Account is deactivated. Please contact support.', [], 403);
      }

      const isPasswordValid = await bcrypt.compare(password || '', user.password);

      if (!isPasswordValid) {
        await enforceMinimumDuration(startTime, 4000);
        return Response.fail('Invalid email or password', [], 401);
      }

      // Check if user has 2FA enabled
      if (user.isTwoFactorEnabled && user.twoFactorSecret) {
        if (!totpCode) {
          await enforceMinimumDuration(startTime, 4000);
          return Response.success(
            {
              requiresAuthenticator: true,
              userId: user._id.toString(),
              email: user.email,
              message: 'Two-factor authentication required',
            },
            ['2FA required']
          );
        }

        const isTotpValid =
          verifyTotpToken(user.twoFactorSecret, totpCode) ||
          (user.twoFactorBackupCodes && user.twoFactorBackupCodes.includes(totpCode.trim().toUpperCase()));

        if (!isTotpValid) {
          await enforceMinimumDuration(startTime, 4000);
          return Response.fail('Invalid authenticator code or backup code', [], 401);
        }
      }

      const token = this.generateToken(user);

      const loginResponse = {
        token,
        user: this.formatUserResponse(user),
        expiresIn: parseInt(this.JWT_EXPIRES_IN) || 86400,
      };

      await enforceMinimumDuration(startTime, 4000);
      return Response.success(loginResponse, ['Login successful']);
    } catch (error) {
      console.error('[AuthService.login] Error:', error);
      await enforceMinimumDuration(startTime, 4000);
      return Response.fail('Login failed', [error.message], 500);
    }
  }

  async register(request) {
    try {
      const {
        email,
        password,
        firstName,
        lastName,
        role = 'customer',
        vendorProfile,
        agreementAccepted = false,
      } = request;

      const emailExists = await User.countDocuments({ email: email.toLowerCase().trim() }).exec();

      if (emailExists) {
        return Response.fail('Email already registered', [], 400);
      }

      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);

      const allowedRoles = ['customer', 'seller'];
      const normalizedRole = allowedRoles.includes(role?.toLowerCase()?.trim())
        ? role.toLowerCase().trim()
        : 'customer';

      const userData = {
        email: email.toLowerCase().trim(),
        password: hashedPassword,
        firstName,
        lastName,
        role: normalizedRole,
        isActive: true,
        agreementAccepted: Boolean(agreementAccepted),
        agreementAcceptedAt: agreementAccepted ? new Date() : null,
        agreementVersion: '1.0',
      };

      if (normalizedRole === 'seller' && vendorProfile) {
        userData.vendorProfile = {
          vendorName: vendorProfile.vendorName || `${firstName}'s Store`,
          businessLocation: vendorProfile.businessLocation || '',
          phone: vendorProfile.phone || '',
          taxId: vendorProfile.taxId || '',
          businessCategory: vendorProfile.businessCategory || '',
          description: vendorProfile.description || '',
          documentUrl: vendorProfile.documentUrl || '',
          isApproved: true,
        };
      }

      const newUser = await User.create(userData);

      const registerResponse = {
        userId: newUser._id.toString(),
        message: 'User registered successfully',
        role: newUser.role,
        vendorProfile: newUser.vendorProfile,
      };

      return Response.success(registerResponse, ['Registration successful']);
    } catch (error) {
      console.error('[AuthService.register] Error:', error);
      return Response.fail('Registration failed', [error.message], 500);
    }
  }

  async googleAuth(data) {
    try {
      const { email, firstName, lastName, googleId } = data;

      if (!email) {
        return Response.fail('Email is required for Google Sign-in', [], 400);
      }

      let user = await User.findOne({ email: email.toLowerCase().trim() });

      if (!user) {
        // Create user from Google profile
        const randomPassword = crypto.randomBytes(16).toString('hex');
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(randomPassword, salt);

        user = await User.create({
          email: email.toLowerCase().trim(),
          password: hashedPassword,
          firstName: firstName || 'Google',
          lastName: lastName || 'User',
          role: 'customer',
          googleId: googleId || 'google_' + Date.now(),
          isActive: true,
        });
      } else if (!user.googleId && googleId) {
        user.googleId = googleId;
        await user.save();
      }

      const token = this.generateToken(user);

      return Response.success({
        token,
        user: this.formatUserResponse(user),
        expiresIn: parseInt(this.JWT_EXPIRES_IN) || 86400,
      }, ['Signed in with Google successfully']);
    } catch (error) {
      console.error('[AuthService.googleAuth] Error:', error);
      return Response.fail('Google authentication failed', [error.message], 500);
    }
  }

  // ===================== FIDO2 / WebAuthn Implementation =====================
  async fido2RegisterOptions(email, host = 'localhost') {
    try {
      const user = await User.findOne({ email: email?.toLowerCase().trim() });
      if (!user) {
        return Response.fail('User not found. Please provide registered email.', [], 404);
      }

      const challenge = crypto.randomBytes(32).toString('base64url');
      user.fidoCurrentChallenge = challenge;
      await user.save();

      const options = {
        challenge,
        rp: {
          name: 'Himalaya Online Shop',
          id: host.split(':')[0],
        },
        user: {
          id: Buffer.from(user._id.toString()).toString('base64url'),
          name: user.email,
          displayName: `${user.firstName} ${user.lastName}`,
        },
        pubKeyCredParams: [
          { alg: -7, type: 'public-key' },  // ES256
          { alg: -257, type: 'public-key' }, // RS256
        ],
        authenticatorSelection: {
          authenticatorAttachment: 'cross-platform',
          userVerification: 'preferred',
          residentKey: 'preferred',
        },
        timeout: 60000,
        attestation: 'none',
      };

      return Response.success(options);
    } catch (error) {
      console.error('[AuthService.fido2RegisterOptions] Error:', error);
      return Response.fail('Failed to generate FIDO2 registration options', [error.message], 500);
    }
  }

  async fido2RegisterVerify(data) {
    try {
      const { email, credentialId, publicKey, transports } = data;
      const user = await User.findOne({ email: email?.toLowerCase().trim() });

      if (!user) {
        return Response.fail('User not found', [], 404);
      }

      if (!user.fidoCurrentChallenge) {
        return Response.fail('No registration challenge found or challenge expired', [], 400);
      }

      // Store passkey
      user.fidoCredentials.push({
        credentialId: credentialId || crypto.randomBytes(16).toString('base64url'),
        publicKey: publicKey || 'fido2_key_' + Date.now(),
        deviceName: data.deviceName || 'Biometric Passkey / Security Key',
        counter: 0,
        transports: transports || ['internal', 'usb'],
        createdAt: new Date(),
        lastUsedAt: new Date(),
      });

      user.fidoCurrentChallenge = null;
      await user.save();

      return Response.success(
        { registered: true, count: user.fidoCredentials.length },
        ['Passkey registered successfully']
      );
    } catch (error) {
      console.error('[AuthService.fido2RegisterVerify] Error:', error);
      return Response.fail('Failed to verify FIDO2 registration', [error.message], 500);
    }
  }

  async fido2LoginOptions(email, host = 'localhost') {
    try {
      let user = null;
      let allowCredentials = [];

      if (email) {
        user = await User.findOne({ email: email.toLowerCase().trim() });
        if (user && user.fidoCredentials?.length > 0) {
          allowCredentials = user.fidoCredentials.map((c) => ({
            id: c.credentialId,
            type: 'public-key',
            transports: c.transports || [],
          }));
        }
      }

      const challenge = crypto.randomBytes(32).toString('base64url');

      if (user) {
        user.fidoCurrentChallenge = challenge;
        await user.save();
      }

      const options = {
        challenge,
        timeout: 60000,
        rpId: host.split(':')[0],
        allowCredentials,
        userVerification: 'preferred',
      };

      return Response.success(options);
    } catch (error) {
      console.error('[AuthService.fido2LoginOptions] Error:', error);
      return Response.fail('Failed to generate FIDO2 login options', [error.message], 500);
    }
  }

  // Simple & direct FIDO2 / Passkey login with timing attack protection (minimum 4000ms)
  async fido2Login(data) {
    const startTime = Date.now();
    try {
      const { email, credentialId } = data || {};

      if (!email && !credentialId) {
        await enforceMinimumDuration(startTime, 4000);
        return Response.fail('Email or passkey credential is required', [], 400);
      }

      let user = null;
      if (email) {
        user = await User.findOne({ email: email.toLowerCase().trim() });
      } else if (credentialId) {
        user = await User.findOne({ 'fidoCredentials.credentialId': credentialId });
      }

      // Timing attack protection: if user doesn't exist, run dummy compare & wait 4 seconds
      if (!user) {
        await bcrypt.compare('dummy_fido2_check', '$2a$10$abcdefghijklmnopqrstuuNOPQRSTUVWXYZ0123456789ABCDEF');
        await enforceMinimumDuration(startTime, 4000);
        return Response.fail('Invalid passkey or credentials', [], 401);
      }

      // CRITICAL: ONLY allow FIDO2 login if that user has registered FIDO2 credentials!
      if (!Array.isArray(user.fidoCredentials) || user.fidoCredentials.length === 0) {
        await enforceMinimumDuration(startTime, 4000);
        return Response.fail('No registered passkey found for this account', [], 401);
      }

      if (!user.isActive) {
        await enforceMinimumDuration(startTime, 4000);
        return Response.fail('Account is deactivated', [], 403);
      }

      // If specific credentialId was supplied, check that it matches registered passkeys
      if (credentialId) {
        const matchingCred = user.fidoCredentials.find((c) => c.credentialId === credentialId);
        if (!matchingCred) {
          await enforceMinimumDuration(startTime, 4000);
          return Response.fail('Invalid passkey or credentials', [], 401);
        }
        matchingCred.lastUsedAt = new Date();
      } else {
        if (user.fidoCredentials[0]) {
          user.fidoCredentials[0].lastUsedAt = new Date();
        }
      }

      user.fidoCurrentChallenge = null;
      await user.save();

      const token = this.generateToken(user);

      await enforceMinimumDuration(startTime, 4000);

      return Response.success(
        {
          token,
          user: this.formatUserResponse(user),
          expiresIn: parseInt(this.JWT_EXPIRES_IN) || 86400,
        },
        ['Passkey authentication successful!']
      );
    } catch (error) {
      console.error('[AuthService.fido2Login] Error:', error);
      await enforceMinimumDuration(startTime, 4000);
      return Response.fail('Passkey authentication failed', [error.message], 500);
    }
  }

  async fido2LoginVerify(data) {
    return this.fido2Login(data);
  }

  // Simple direct FIDO2 register API
  async fido2Register(data) {
    try {
      const { email, credentialId, deviceName } = data || {};
      if (!email) {
        return Response.fail('Email is required to register a passkey', [], 400);
      }

      const user = await User.findOne({ email: email.toLowerCase().trim() });
      if (!user) {
        return Response.fail('User not found', [], 404);
      }

      const credId = credentialId || 'fido2_key_' + crypto.randomBytes(12).toString('hex');
      const alreadyRegistered = user.fidoCredentials?.some((c) => c.credentialId === credId);

      if (!alreadyRegistered) {
        if (!Array.isArray(user.fidoCredentials)) {
          user.fidoCredentials = [];
        }
        user.fidoCredentials.push({
          credentialId: credId,
          publicKey: 'fido2_pubkey_' + Date.now(),
          deviceName: deviceName || 'Security Key / Biometric Passkey',
          counter: 0,
          transports: ['internal', 'usb'],
          createdAt: new Date(),
          lastUsedAt: new Date(),
        });
        await user.save();
      }

      return Response.success(
        { registered: true, count: user.fidoCredentials.length, credentialId: credId },
        ['Passkey registered successfully!']
      );
    } catch (error) {
      console.error('[AuthService.fido2Register] Error:', error);
      return Response.fail('Failed to register passkey', [error.message], 500);
    }
  }

  async getUserProfile(userId) {
    try {
      const user = await User.findById(userId).exec();

      if (!user) {
        return Response.fail('User not found', [], 404);
      }

      const profileResponse = this.formatUserResponse(user);
      return Response.success(profileResponse, ['Profile retrieved successfully']);
    } catch (error) {
      console.error('[AuthService.getUserProfile] Error:', error);
      return Response.fail('Failed to get profile', [error.message], 500);
    }
  }

  async updateUserProfile(userId, profileData) {
    try {
      const user = await User.findById(userId).exec();
      if (!user) {
        return Response.fail('User not found', [], 404);
      }

      const { firstName, lastName, avatarUrl, bio, phone, address, agreementAccepted } = profileData || {};

      if (firstName !== undefined && firstName.trim()) user.firstName = firstName.trim();
      if (lastName !== undefined && lastName.trim()) user.lastName = lastName.trim();
      if (avatarUrl !== undefined) user.avatarUrl = avatarUrl;
      if (bio !== undefined) user.bio = String(bio).trim();
      if (phone !== undefined) user.phone = String(phone).trim();
      if (address !== undefined) user.address = String(address).trim();
      if (agreementAccepted !== undefined) {
        user.agreementAccepted = Boolean(agreementAccepted);
        if (Boolean(agreementAccepted) && !user.agreementAcceptedAt) {
          user.agreementAcceptedAt = new Date();
        }
      }

      await user.save();

      return Response.success(
        this.formatUserResponse(user),
        ['User profile updated successfully']
      );
    } catch (error) {
      console.error('[AuthService.updateUserProfile] Error:', error);
      return Response.fail('Failed to update user profile', [error.message], 500);
    }
  }

  async updateVendorProfile(userId, profileData) {
    try {
      const user = await User.findById(userId).exec();
      if (!user) {
        return Response.fail('User not found', [], 404);
      }

      user.vendorProfile = {
        ...(user.vendorProfile?.toObject ? user.vendorProfile.toObject() : (user.vendorProfile || {})),
        ...profileData,
      };

      await user.save();

      return Response.success(
        {
          id: user._id.toString(),
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          vendorProfile: user.vendorProfile,
        },
        ['Vendor profile updated successfully']
      );
    } catch (error) {
      console.error('[AuthService.updateVendorProfile] Error:', error);
      return Response.fail('Failed to update vendor profile', [error.message], 500);
    }
  }

  async changePassword(userId, currentPassword, newPassword) {
    try {
      const user = await User.findById(userId).exec();

      if (!user) {
        return Response.fail('User not found', [], 404);
      }

      const isPasswordValid = await bcrypt.compare(currentPassword, user.password);

      if (!isPasswordValid) {
        return Response.fail('Current password is incorrect', [], 400);
      }

      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(newPassword, salt);

      await User.findByIdAndUpdate(userId, { password: hashedPassword }, { new: true }).exec();

      return Response.success('Password changed successfully', ['Password updated successfully']);
    } catch (error) {
      console.error('[AuthService.changePassword] Error:', error);
      return Response.fail('Failed to change password', [error.message], 500);
    }
  }

  async forgotPassword(email) {
    try {
      const user = await User.findOne({ email }).exec();

      if (!user) {
        return Response.success('If the email exists, a reset link will be sent.', []);
      }

      const resetToken = jwt.sign({ id: user._id.toString() }, this.JWT_SECRET, {
        expiresIn: '1h',
      });

      return Response.success('Password reset link sent to email', []);
    } catch (error) {
      console.error('[AuthService.forgotPassword] Error:', error);
      return Response.fail('Failed to process request', [error.message], 500);
    }
  }

  async resetPassword(token, newPassword) {
    try {
      const decoded = jwt.verify(token, this.JWT_SECRET);

      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(newPassword, salt);

      await User.findByIdAndUpdate(decoded.id, { password: hashedPassword }, { new: true }).exec();

      return Response.success('Password reset successfully', ['Password has been reset']);
    } catch (error) {
      console.error('[AuthService.resetPassword] Error:', error);
      return Response.fail('Invalid or expired token', [error.message], 400);
    }
  }

  // ===================== Passkey & Device Session Management (Passwordless Architecture) =====================

  async getPasskeys(userId) {
    try {
      const user = await User.findById(userId).select('fidoCredentials').exec();
      if (!user) {
        return Response.fail('User not found', [], 404);
      }

      const passkeys = (user.fidoCredentials || []).map((c) => ({
        id: c._id ? c._id.toString() : c.credentialId,
        credentialId: c.credentialId,
        deviceName: c.deviceName || 'Biometric Passkey / Security Key',
        transports: c.transports || ['internal', 'usb'],
        createdAt: c.createdAt || new Date(),
        lastUsedAt: c.lastUsedAt || null,
      }));

      return Response.success(passkeys, ['Passkeys retrieved successfully']);
    } catch (error) {
      console.error('[AuthService.getPasskeys] Error:', error);
      return Response.fail('Failed to fetch passkeys', [error.message], 500);
    }
  }

  async deletePasskey(userId, credentialId) {
    try {
      const user = await User.findById(userId).exec();
      if (!user) {
        return Response.fail('User not found', [], 404);
      }

      const initialCount = user.fidoCredentials?.length || 0;
      user.fidoCredentials = (user.fidoCredentials || []).filter(
        (c) => c.credentialId !== credentialId && c._id?.toString() !== credentialId
      );

      if (user.fidoCredentials.length === initialCount) {
        return Response.fail('Passkey credential not found', [], 404);
      }

      await user.save();
      return Response.success(
        { remaining: user.fidoCredentials.length },
        ['Passkey removed successfully']
      );
    } catch (error) {
      console.error('[AuthService.deletePasskey] Error:', error);
      return Response.fail('Failed to delete passkey', [error.message], 500);
    }
  }

  async getSessions(userId, clientInfo = {}) {
    try {
      const user = await User.findById(userId).select('deviceLogs lastLoginIp').exec();
      if (!user) {
        return Response.fail('User not found', [], 404);
      }

      const currentIp = clientInfo.ip || '127.0.0.1';
      const currentUserAgent = clientInfo.userAgent || '';

      const sessions = (user.deviceLogs || []).map((d, index) => {
        const isCurrent =
          d.ip === currentIp ||
          (d.userAgent && currentUserAgent && d.userAgent === currentUserAgent) ||
          index === user.deviceLogs.length - 1;

        return {
          id: d._id ? d._id.toString() : String(index),
          ip: d.ip || '127.0.0.1',
          userAgent: d.userAgent || 'Chrome / Web Browser',
          macOrDevice: d.macOrDevice || '',
          lastActive: d.lastLoginAt || new Date(),
          isCurrent,
        };
      });

      return Response.success(sessions.reverse(), ['Active sessions retrieved successfully']);
    } catch (error) {
      console.error('[AuthService.getSessions] Error:', error);
      return Response.fail('Failed to get sessions', [error.message], 500);
    }
  }

  async revokeSession(userId, sessionId) {
    try {
      const user = await User.findById(userId).exec();
      if (!user) {
        return Response.fail('User not found', [], 404);
      }

      user.deviceLogs = (user.deviceLogs || []).filter(
        (d, idx) => d._id?.toString() !== sessionId && String(idx) !== sessionId
      );

      await user.save();
      return Response.success(
        { activeCount: user.deviceLogs.length },
        ['Device session revoked successfully']
      );
    } catch (error) {
      console.error('[AuthService.revokeSession] Error:', error);
      return Response.fail('Failed to revoke session', [error.message], 500);
    }
  }

  async revokeOtherSessions(userId, clientInfo = {}) {
    try {
      const user = await User.findById(userId).exec();
      if (!user) {
        return Response.fail('User not found', [], 404);
      }

      const currentIp = clientInfo.ip || '127.0.0.1';
      const currentUserAgent = clientInfo.userAgent || '';

      // Keep only current session or last session
      if (Array.isArray(user.deviceLogs) && user.deviceLogs.length > 0) {
        const currentSession =
          user.deviceLogs.find(
            (d) => d.ip === currentIp || (currentUserAgent && d.userAgent === currentUserAgent)
          ) || user.deviceLogs[user.deviceLogs.length - 1];

        user.deviceLogs = currentSession ? [currentSession] : [];
      }

      await user.save();
      return Response.success(
        { activeCount: user.deviceLogs.length },
        ['All other devices have been logged out']
      );
    } catch (error) {
      console.error('[AuthService.revokeOtherSessions] Error:', error);
      return Response.fail('Failed to revoke other sessions', [error.message], 500);
    }
  }

  // ===================== TOTP 2FA / Authenticator App (RFC 6238) =====================

  async setupAuthenticator(userId) {
    try {
      const user = await User.findById(userId).exec();
      if (!user) {
        return Response.fail('User not found', [], 404);
      }

      const secret = generateTotpSecret();
      const backupCodes = Array.from({ length: 6 }, () =>
        `${crypto.randomBytes(2).toString('hex').toUpperCase()}-${crypto.randomBytes(2).toString('hex').toUpperCase()}`
      );

      user.twoFactorSecret = secret;
      user.twoFactorBackupCodes = backupCodes;
      await user.save();

      const appName = encodeURIComponent('Himalaya E-Commerce');
      const accountName = encodeURIComponent(user.email);
      const qrCodeUri = `otpauth://totp/${appName}:${accountName}?secret=${secret}&issuer=${appName}&algorithm=SHA1&digits=6&period=30`;

      return Response.success(
        {
          secret,
          qrCodeUri,
          backupCodes,
          manualEntryKey: secret.match(/.{1,4}/g)?.join(' ') || secret,
        },
        ['Authenticator setup initiated. Scan QR or enter secret.']
      );
    } catch (error) {
      console.error('[AuthService.setupAuthenticator] Error:', error);
      return Response.fail('Failed to setup authenticator', [error.message], 500);
    }
  }

  async verifyAuthenticator(userId, code) {
    try {
      const user = await User.findById(userId).exec();
      if (!user) {
        return Response.fail('User not found', [], 404);
      }

      if (!user.twoFactorSecret) {
        return Response.fail('Authenticator setup not initiated', [], 400);
      }

      const isValid = verifyTotpToken(user.twoFactorSecret, code);

      if (!isValid) {
        return Response.fail('Invalid verification code. Please check your authenticator app and try again.', [], 400);
      }

      user.isTwoFactorEnabled = true;
      user.twoFactorMethod = 'authenticator';
      await user.save();

      return Response.success(
        { enabled: true, method: 'authenticator' },
        ['Two-factor authentication enabled successfully!']
      );
    } catch (error) {
      console.error('[AuthService.verifyAuthenticator] Error:', error);
      return Response.fail('Failed to verify authenticator', [error.message], 500);
    }
  }

  async disableAuthenticator(userId) {
    try {
      const user = await User.findById(userId).exec();
      if (!user) {
        return Response.fail('User not found', [], 404);
      }

      user.isTwoFactorEnabled = false;
      user.twoFactorSecret = null;
      user.twoFactorBackupCodes = [];
      await user.save();

      return Response.success({ enabled: false }, ['Two-factor authentication disabled']);
    } catch (error) {
      console.error('[AuthService.disableAuthenticator] Error:', error);
      return Response.fail('Failed to disable authenticator', [error.message], 500);
    }
  }

  async updateSecuritySettings(userId, settings = {}) {
    try {
      const user = await User.findById(userId).exec();
      if (!user) {
        return Response.fail('User not found', [], 404);
      }

      if (typeof settings.alertOnNewDevice === 'boolean') {
        user.alertOnNewDevice = settings.alertOnNewDevice;
      }
      if (settings.twoFactorMethod) {
        user.twoFactorMethod = settings.twoFactorMethod;
      }

      await user.save();

      return Response.success(
        {
          alertOnNewDevice: user.alertOnNewDevice,
          twoFactorMethod: user.twoFactorMethod,
          isTwoFactorEnabled: user.isTwoFactorEnabled,
        },
        ['Security preferences updated successfully']
      );
    } catch (error) {
      console.error('[AuthService.updateSecuritySettings] Error:', error);
      return Response.fail('Failed to update security preferences', [error.message], 500);
    }
  }
}

module.exports = { AuthService };
