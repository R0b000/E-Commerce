const mongoose = require('mongoose');

const BannerSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    subtitle: {
      type: String,
      default: '',
      trim: true,
    },
    badgeText: {
      type: String,
      default: '',
      trim: true,
    },
    imageUrl: {
      type: String,
      required: true,
      trim: true,
    },
    mobileImageUrl: {
      type: String,
      default: '',
      trim: true,
    },
    ctaText: {
      type: String,
      default: 'Shop Now',
      trim: true,
    },
    ctaLink: {
      type: String,
      default: '/#catalog',
      trim: true,
    },
    secondaryCtaText: {
      type: String,
      default: '',
      trim: true,
    },
    secondaryCtaLink: {
      type: String,
      default: '',
      trim: true,
    },
    position: {
      type: String,
      enum: ['hero_main', 'hero_secondary', 'top_announcement', 'flash_sale'],
      default: 'hero_main',
      index: true,
    },
    alignment: {
      type: String,
      enum: ['left', 'center', 'right'],
      default: 'left',
    },
    overlayOpacity: {
      type: Number,
      default: 45,
      min: 0,
      max: 100,
    },
    textColor: {
      type: String,
      default: '#ffffff',
    },
    themeColor: {
      type: String,
      default: '#0096C7',
    },
    // Scheduling Configuration
    scheduleType: {
      type: String,
      enum: ['always', 'date_range', 'recurring_daily', 'recurring_weekly'],
      default: 'always',
      index: true,
    },
    startDate: {
      type: Date,
      default: null,
    },
    endDate: {
      type: Date,
      default: null,
    },
    startHour: {
      type: Number,
      default: 0, // 0 to 23
      min: 0,
      max: 23,
    },
    endHour: {
      type: Number,
      default: 23, // 0 to 23
      min: 0,
      max: 23,
    },
    activeDays: {
      type: [Number], // 0: Sun, 1: Mon, ..., 6: Sat
      default: [0, 1, 2, 3, 4, 5, 6],
    },
    timezone: {
      type: String,
      default: 'Asia/Kathmandu',
    },
    priority: {
      type: Number,
      default: 1,
      index: true,
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    impressions: {
      type: Number,
      default: 0,
      min: 0,
    },
    clicks: {
      type: Number,
      default: 0,
      min: 0,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Helpful virtual to evaluate if banner is currently active at this instant
BannerSchema.methods.isCurrentlyActive = function (currentDate = new Date()) {
  if (!this.isActive) return false;

  if (this.scheduleType === 'always') {
    return true;
  }

  const timeMs = currentDate.getTime();

  if (this.scheduleType === 'date_range') {
    if (this.startDate && new Date(this.startDate).getTime() > timeMs) {
      return false;
    }
    if (this.endDate && new Date(this.endDate).getTime() < timeMs) {
      return false;
    }
    return true;
  }

  if (this.scheduleType === 'recurring_daily') {
    if (this.startDate && new Date(this.startDate).getTime() > timeMs) return false;
    if (this.endDate && new Date(this.endDate).getTime() < timeMs) return false;

    const currentHour = currentDate.getHours();
    if (this.startHour <= this.endHour) {
      return currentHour >= this.startHour && currentHour <= this.endHour;
    } else {
      // Overnight range, e.g., 22:00 to 05:00
      return currentHour >= this.startHour || currentHour <= this.endHour;
    }
  }

  if (this.scheduleType === 'recurring_weekly') {
    if (this.startDate && new Date(this.startDate).getTime() > timeMs) return false;
    if (this.endDate && new Date(this.endDate).getTime() < timeMs) return false;

    const currentDay = currentDate.getDay(); // 0 to 6
    if (Array.isArray(this.activeDays) && !this.activeDays.includes(currentDay)) {
      return false;
    }
    const currentHour = currentDate.getHours();
    if (this.startHour <= this.endHour) {
      return currentHour >= this.startHour && currentHour <= this.endHour;
    } else {
      return currentHour >= this.startHour || currentHour <= this.endHour;
    }
  }

  return true;
};

const Banner = mongoose.model('Banner', BannerSchema);

module.exports = { Banner };
