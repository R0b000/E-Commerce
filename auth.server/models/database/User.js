const mongoose = require('mongoose');

const FidoCredentialSchema = new mongoose.Schema(
  {
    credentialId: { type: String, required: true },
    publicKey: { type: String, required: true },
    deviceName: { type: String, default: 'Security Key / Biometric Passkey' },
    counter: { type: Number, default: 0 },
    transports: { type: [String], default: [] },
    createdAt: { type: Date, default: Date.now },
    lastUsedAt: { type: Date, default: null },
  },
  { _id: true }
);

const VendorProfileSchema = new mongoose.Schema(
  {
    vendorName: { type: String, trim: true, default: '' },
    businessLocation: { type: String, trim: true, default: '' },
    phone: { type: String, trim: true, default: '' },
    taxId: { type: String, trim: true, default: '' },
    businessCategory: { type: String, trim: true, default: '' },
    description: { type: String, trim: true, default: '' },
    documentUrl: { type: String, default: '' },
    isApproved: { type: Boolean, default: true },
  },
  { _id: false }
);

const DeviceLogSchema = new mongoose.Schema(
  {
    ip: { type: String, default: '' },
    macOrDevice: { type: String, default: '' },
    userAgent: { type: String, default: '' },
    lastLoginAt: { type: Date, default: Date.now },
  },
  { _id: true }
);

const UserSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
    },
    firstName: {
      type: String,
      required: true,
      trim: true,
    },
    lastName: {
      type: String,
      required: true,
      trim: true,
    },
    role: {
      type: String,
      enum: ['admin', 'seller', 'customer', 'user', 'support', 'manager'],
      default: 'customer',
      lowercase: true,
      trim: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    customPermissions: {
      type: [String],
      default: [],
    },
    vendorProfile: {
      type: VendorProfileSchema,
      default: null,
    },
    fidoCredentials: {
      type: [FidoCredentialSchema],
      default: [],
    },
    fidoCurrentChallenge: {
      type: String,
      default: null,
    },
    googleId: {
      type: String,
      default: null,
    },
    isTwoFactorEnabled: {
      type: Boolean,
      default: false,
    },
    twoFactorSecret: {
      type: String,
      default: null,
    },
    twoFactorMethod: {
      type: String,
      enum: ['authenticator', 'email', 'fido2'],
      default: 'authenticator',
    },
    twoFactorBackupCodes: {
      type: [String],
      default: [],
    },
    alertOnNewDevice: {
      type: Boolean,
      default: true,
    },
    lastPasswordChange: {
      type: Date,
      default: Date.now,
    },
    agreementAccepted: {
      type: Boolean,
      default: false,
    },
    agreementAcceptedAt: {
      type: Date,
      default: null,
    },
    agreementVersion: {
      type: String,
      default: '1.0',
    },
    lastLoginIp: {
      type: String,
      default: null,
    },
    deviceLogs: {
      type: [DeviceLogSchema],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

const User = mongoose.models.User || mongoose.model('User', UserSchema);

module.exports = { User, UserSchema };
