const mongoose = require('mongoose');

const MenuSchema = new mongoose.Schema(
  {
    menuId: {
      type: Number,
      default: null,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    menuNameNepali: {
      type: String,
      default: '',
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
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    isSinglePage: {
      type: Boolean,
      default: false,
    },
    isPrimary: {
      type: Boolean,
      default: false,
    },
    isChild: {
      type: Boolean,
      default: false,
    },
    isNotParent: {
      type: Boolean,
      default: true,
    },
    isNotChild: {
      type: Boolean,
      default: true,
    },
    childId: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    menuCode: {
      type: String,
      default: '',
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
MenuSchema.index({ menuId: 1 });

const Menu = mongoose.models.Menu || mongoose.model('Menu', MenuSchema);

module.exports = { Menu, MenuSchema };
