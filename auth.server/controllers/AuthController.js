const { Router } = require('express');
const { AuthService } = require('../services/AuthService');
const { authMiddleware } = require('../middleware/AuthMiddleware');
const { recordUserDevice, recognizeDevice, extractClientInfo } = require('../middleware/deviceTrackerMiddleware');

const router = Router();
const authService = new AuthService();

// Lookup user identifier to check passkey availability (matching Passwordless-Authentication)
router.post('/lookup', async (req, res) => {
  try {
    const identifier = req.body.email || req.body.username || req.body.identifier;
    const response = await authService.lookupUser(identifier);
    res.status(response.statusCode || (response.success ? 200 : 404)).json(response);
  } catch (error) {
    res.status(500).json({
      success: false,
      messages: ['Lookup failed'],
      errors: [error.message],
    });
  }
});

// Check if current IP / MAC device has a recognized previous session for direct FIDO2 login
router.get('/remembered-device', async (req, res) => {
  try {
    const result = await recognizeDevice(req);
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({
      success: false,
      messages: ['Failed to recognize device'],
      errors: [error.message],
    });
  }
});

router.post('/login', async (req, res) => {
  try {
    const response = await authService.login(req.body);
    if (response.success && response.data?.user?.id) {
      await recordUserDevice(response.data.user.id, req);
    }
    res.status(response.statusCode || (response.success ? 200 : 401)).json(response);
  } catch (error) {
    res.status(500).json({
      success: false,
      messages: ['Login failed'],
      errors: [error.message],
    });
  }
});

router.post('/register', async (req, res) => {
  try {
    const response = await authService.register(req.body);
    if (response.success && response.data?.userId) {
      await recordUserDevice(response.data.userId, req);
    }
    res.status(response.statusCode || (response.success ? 201 : 400)).json(response);
  } catch (error) {
    res.status(500).json({
      success: false,
      messages: ['Registration failed'],
      errors: [error.message],
    });
  }
});

// Google OAuth Login / Signup
router.post('/google', async (req, res) => {
  try {
    const response = await authService.googleAuth(req.body);
    if (response.success && response.data?.user?.id) {
      await recordUserDevice(response.data.user.id, req);
    }
    res.status(response.statusCode || (response.success ? 200 : 400)).json(response);
  } catch (error) {
    res.status(500).json({
      success: false,
      messages: ['Google login failed'],
      errors: [error.message],
    });
  }
});

// FIDO2 / WebAuthn Passkey Registration Options
router.get('/fido2/register-options', async (req, res) => {
  try {
    const email = req.query.email;
    const response = await authService.fido2RegisterOptions(email, req.headers.host);
    res.status(response.statusCode || (response.success ? 200 : 400)).json(response);
  } catch (error) {
    res.status(500).json({
      success: false,
      messages: ['Failed to retrieve FIDO2 registration options'],
      errors: [error.message],
    });
  }
});

// FIDO2 / WebAuthn Passkey Registration Verification
router.post('/fido2/register-verify', async (req, res) => {
  try {
    const response = await authService.fido2RegisterVerify(req.body);
    res.status(response.statusCode || (response.success ? 200 : 400)).json(response);
  } catch (error) {
    res.status(500).json({
      success: false,
      messages: ['Failed to verify FIDO2 registration'],
      errors: [error.message],
    });
  }
});

// FIDO2 / WebAuthn Passkey Login Options
router.get('/fido2/login-options', async (req, res) => {
  try {
    const email = req.query.email;
    const response = await authService.fido2LoginOptions(email, req.headers.host);
    res.status(response.statusCode || (response.success ? 200 : 400)).json(response);
  } catch (error) {
    res.status(500).json({
      success: false,
      messages: ['Failed to retrieve FIDO2 login options'],
      errors: [error.message],
    });
  }
});

// Simple & Direct FIDO2 / Passkey Login API
router.post('/fido2/login', async (req, res) => {
  try {
    const response = await authService.fido2Login(req.body);
    if (response.success && response.data?.user?.id) {
      await recordUserDevice(response.data.user.id, req);
    }
    res.status(response.statusCode || (response.success ? 200 : 401)).json(response);
  } catch (error) {
    res.status(500).json({
      success: false,
      messages: ['Passkey authentication failed'],
      errors: [error.message],
    });
  }
});

// Simple & Direct FIDO2 / Passkey Registration API
router.post('/fido2/register', async (req, res) => {
  try {
    const response = await authService.fido2Register(req.body);
    res.status(response.statusCode || (response.success ? 201 : 400)).json(response);
  } catch (error) {
    res.status(500).json({
      success: false,
      messages: ['Failed to register passkey'],
      errors: [error.message],
    });
  }
});

// FIDO2 / WebAuthn Passkey Login Verification
router.post('/fido2/login-verify', async (req, res) => {
  try {
    const response = await authService.fido2LoginVerify(req.body);
    if (response.success && response.data?.user?.id) {
      await recordUserDevice(response.data.user.id, req);
    }
    res.status(response.statusCode || (response.success ? 200 : 401)).json(response);
  } catch (error) {
    res.status(500).json({
      success: false,
      messages: ['Passkey authentication failed'],
      errors: [error.message],
    });
  }
});

router.get('/profile', authMiddleware, async (req, res) => {
  try {
    const response = await authService.getUserProfile(req.user.id);
    res.status(response.statusCode || (response.success ? 200 : 404)).json(response);
  } catch (error) {
    res.status(500).json({
      success: false,
      messages: ['Failed to get profile'],
      errors: [error.message],
    });
  }
});

router.put('/profile', authMiddleware, async (req, res) => {
  try {
    const response = await authService.updateUserProfile(req.user.id, req.body);
    res.status(response.statusCode || 200).json(response);
  } catch (error) {
    res.status(500).json({
      success: false,
      messages: ['Failed to update user profile'],
      errors: [error.message],
    });
  }
});

router.put('/vendor-profile', authMiddleware, async (req, res) => {
  try {
    const response = await authService.updateVendorProfile(req.user.id, req.body);
    res.status(response.statusCode || 200).json(response);
  } catch (error) {
    res.status(500).json({
      success: false,
      messages: ['Failed to update vendor profile'],
      errors: [error.message],
    });
  }
});

router.post('/change-password', authMiddleware, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const response = await authService.changePassword(req.user.id, currentPassword, newPassword);
    res.status(response.statusCode || 200).json(response);
  } catch (error) {
    res.status(500).json({
      success: false,
      messages: ['Failed to change password'],
      errors: [error.message],
    });
  }
});

router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    const response = await authService.forgotPassword(email);
    res.status(response.statusCode || 200).json(response);
  } catch (error) {
    res.status(500).json({
      success: false,
      messages: ['Failed to process request'],
      errors: [error.message],
    });
  }
});

router.post('/reset-password', async (req, res) => {
  try {
    const { token, newPassword } = req.body;
    const response = await authService.resetPassword(token, newPassword);
    res.status(response.statusCode || (response.success ? 200 : 400)).json(response);
  } catch (error) {
    res.status(500).json({
      success: false,
      messages: ['Failed to reset password'],
      errors: [error.message],
    });
  }
});

// ===================== Passkey Credentials Management (Passwordless-Authentication) =====================

router.get('/fido2/credentials', authMiddleware, async (req, res) => {
  try {
    const response = await authService.getPasskeys(req.user.id);
    res.status(response.statusCode || 200).json(response);
  } catch (error) {
    res.status(500).json({
      success: false,
      messages: ['Failed to retrieve registered passkeys'],
      errors: [error.message],
    });
  }
});

router.delete('/fido2/credentials/:id', authMiddleware, async (req, res) => {
  try {
    const response = await authService.deletePasskey(req.user.id, req.params.id);
    res.status(response.statusCode || 200).json(response);
  } catch (error) {
    res.status(500).json({
      success: false,
      messages: ['Failed to remove passkey'],
      errors: [error.message],
    });
  }
});

// ===================== Active Sessions & Device Management (Passwordless-Authentication) =====================

router.get('/sessions', authMiddleware, async (req, res) => {
  try {
    const clientInfo = extractClientInfo(req);
    const response = await authService.getSessions(req.user.id, clientInfo);
    res.status(response.statusCode || 200).json(response);
  } catch (error) {
    res.status(500).json({
      success: false,
      messages: ['Failed to retrieve active sessions'],
      errors: [error.message],
    });
  }
});

router.delete('/sessions/:id', authMiddleware, async (req, res) => {
  try {
    const response = await authService.revokeSession(req.user.id, req.params.id);
    res.status(response.statusCode || 200).json(response);
  } catch (error) {
    res.status(500).json({
      success: false,
      messages: ['Failed to revoke device session'],
      errors: [error.message],
    });
  }
});

router.post('/sessions/revoke-others', authMiddleware, async (req, res) => {
  try {
    const clientInfo = extractClientInfo(req);
    const response = await authService.revokeOtherSessions(req.user.id, clientInfo);
    res.status(response.statusCode || 200).json(response);
  } catch (error) {
    res.status(500).json({
      success: false,
      messages: ['Failed to revoke other sessions'],
      errors: [error.message],
    });
  }
});

// ===================== 2FA Authenticator Setup & Verification (RFC 6238) =====================

router.get('/authenticator/setup', authMiddleware, async (req, res) => {
  try {
    const response = await authService.setupAuthenticator(req.user.id);
    res.status(response.statusCode || 200).json(response);
  } catch (error) {
    res.status(500).json({
      success: false,
      messages: ['Failed to initiate authenticator setup'],
      errors: [error.message],
    });
  }
});

router.post('/authenticator/verify', authMiddleware, async (req, res) => {
  try {
    const { code } = req.body;
    const response = await authService.verifyAuthenticator(req.user.id, code);
    res.status(response.statusCode || (response.success ? 200 : 400)).json(response);
  } catch (error) {
    res.status(500).json({
      success: false,
      messages: ['Failed to verify authenticator code'],
      errors: [error.message],
    });
  }
});

router.post('/authenticator/disable', authMiddleware, async (req, res) => {
  try {
    const response = await authService.disableAuthenticator(req.user.id);
    res.status(response.statusCode || 200).json(response);
  } catch (error) {
    res.status(500).json({
      success: false,
      messages: ['Failed to disable authenticator'],
      errors: [error.message],
    });
  }
});

router.put('/security-settings', authMiddleware, async (req, res) => {
  try {
    const response = await authService.updateSecuritySettings(req.user.id, req.body);
    res.status(response.statusCode || 200).json(response);
  } catch (error) {
    res.status(500).json({
      success: false,
      messages: ['Failed to update security settings'],
      errors: [error.message],
    });
  }
});

const authRouter = router;

module.exports = { authRouter, router };
