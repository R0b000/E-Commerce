const mongoose = require('mongoose');

const PermissionSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    module: {
      type: String,
      required: true,
      trim: true,
      default: 'General',
    },
    description: {
      type: String,
      default: '',
    },
    isSystem: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

PermissionSchema.index({ module: 1, code: 1 });

const Permission = mongoose.models.Permission || mongoose.model('Permission', PermissionSchema);

module.exports = { Permission, PermissionSchema };
