const mongoose = require('mongoose');

const MenuSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    path: {
      type: String,
      required: true,
      trim: true,
    },
    icon: {
      type: String,
      default: 'AppstoreOutlined',
    },
    order: {
      type: Number,
      default: 0,
    },
    roles: {
      type: [String],
      default: ['admin'],
    },
    requiredPermission: {
      type: String,
      default: '',
    },
    parentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Menu',
      default: null,
    },
    badgeText: {
      type: String,
      default: '',
    },
    isActive: {
      type: Boolean,
      default: true,
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

MenuSchema.index({ order: 1, isActive: 1 });

const Menu = mongoose.models.Menu || mongoose.model('Menu', MenuSchema);

module.exports = { Menu, MenuSchema };
