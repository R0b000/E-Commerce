const { Banner } = require('../models/database/Banner');
const { Response: ApiResponse } = require('../../Shared/API/wrappers/Response');

class BannerService {
  /**
   * Auto-seed demo banners if none exist
   */
  async ensureSeedBanners() {
    try {
      const count = await Banner.countDocuments();
      if (count === 0) {
        const now = new Date();
        const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        const in30Days = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
        const in3Days = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
        const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
        const in60Days = new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000);

        const seedBanners = [
          {
            title: 'Authentic Himalayan Craftsmanship, Direct to Your Door',
            subtitle: 'Explore authentic hand-hammered singing bowls, organic high-altitude teas, pure pashmina shawls, and artisan crafts.',
            badgeText: 'Handcrafted in Nepal • Ethically Sourced',
            imageUrl: 'https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&w=1600&q=80',
            ctaText: 'Shop All Catalog',
            ctaLink: '/#catalog',
            secondaryCtaText: 'Featured Items',
            secondaryCtaLink: '/#featured',
            position: 'hero_main',
            alignment: 'left',
            overlayOpacity: 45,
            scheduleType: 'always',
            priority: 5,
            isActive: true,
            impressions: 1420,
            clicks: 184,
          },
          {
            title: 'Limited Flash Sale: 20% Off Tibetan Singing Bowls',
            subtitle: 'Hand-tuned bronze meditation bowls blessed by Kathmandu masters. Includes rosewood striker and silk ring cushion.',
            badgeText: 'Live Special Offer • Ends in 72 Hours',
            imageUrl: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=1600&q=80',
            ctaText: 'Claim 20% Off',
            ctaLink: '/#catalog',
            secondaryCtaText: 'View Sound Therapy',
            secondaryCtaLink: '/#featured',
            position: 'hero_main',
            alignment: 'left',
            overlayOpacity: 50,
            scheduleType: 'date_range',
            startDate: yesterday,
            endDate: in3Days,
            priority: 10, // Higher priority displays when active
            isActive: true,
            impressions: 890,
            clicks: 142,
          },
          {
            title: 'Upcoming Himalayan Winter Festival 2026',
            subtitle: 'Get ready for exclusive mountain teas, yak wool garments, and ritual bells. Starts next Monday!',
            badgeText: 'Scheduled Upcoming • Starting Soon',
            imageUrl: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1600&q=80',
            ctaText: 'Preview Collection',
            ctaLink: '/#catalog',
            position: 'hero_main',
            alignment: 'center',
            overlayOpacity: 40,
            scheduleType: 'date_range',
            startDate: nextWeek,
            endDate: in60Days,
            priority: 8,
            isActive: true,
            impressions: 0,
            clicks: 0,
          },
          {
            title: 'Twilight Tea Connoisseur Club (Evening Special)',
            subtitle: 'Every evening from 6 PM to 11 PM: enjoy free organic lemongrass sample with any high-altitude orthodox tea purchase.',
            badgeText: 'Daily Evening Delight (18:00 - 23:00)',
            imageUrl: 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?auto=format&fit=crop&w=1600&q=80',
            ctaText: 'Shop Rare Harvests',
            ctaLink: '/#catalog',
            position: 'hero_main',
            alignment: 'left',
            overlayOpacity: 50,
            scheduleType: 'recurring_daily',
            startDate: yesterday,
            endDate: in30Days,
            startHour: 18,
            endHour: 23,
            priority: 9,
            isActive: true,
            impressions: 340,
            clicks: 65,
          },
        ];

        await Banner.insertMany(seedBanners);
      }
    } catch (e) {
      console.warn('ensureSeedBanners error:', e.message);
    }
  }

  /**
   * Get active banners for public storefront (filtered by current date & time)
   */
  async getActiveBanners({ position = 'hero_main', clientTime = null } = {}) {
    try {
      await this.ensureSeedBanners();

      const evalTime = clientTime ? new Date(clientTime) : new Date();

      const candidateBanners = await Banner.find({
        position,
        isActive: true,
      })
        .sort({ priority: -1, createdAt: -1 })
        .lean();

      // Filter banners matching time schedule
      const activeBanners = candidateBanners.filter((b) => {
        if (b.scheduleType === 'always') return true;

        const timeMs = evalTime.getTime();

        if (b.scheduleType === 'date_range') {
          if (b.startDate && new Date(b.startDate).getTime() > timeMs) return false;
          if (b.endDate && new Date(b.endDate).getTime() < timeMs) return false;
          return true;
        }

        if (b.scheduleType === 'recurring_daily') {
          if (b.startDate && new Date(b.startDate).getTime() > timeMs) return false;
          if (b.endDate && new Date(b.endDate).getTime() < timeMs) return false;

          const hour = evalTime.getHours();
          const startH = b.startHour ?? 0;
          const endH = b.endHour ?? 23;
          if (startH <= endH) {
            return hour >= startH && hour <= endH;
          } else {
            return hour >= startH || hour <= endH;
          }
        }

        if (b.scheduleType === 'recurring_weekly') {
          if (b.startDate && new Date(b.startDate).getTime() > timeMs) return false;
          if (b.endDate && new Date(b.endDate).getTime() < timeMs) return false;

          const day = evalTime.getDay();
          if (Array.isArray(b.activeDays) && b.activeDays.length > 0 && !b.activeDays.includes(day)) {
            return false;
          }

          const hour = evalTime.getHours();
          const startH = b.startHour ?? 0;
          const endH = b.endHour ?? 23;
          if (startH <= endH) {
            return hour >= startH && hour <= endH;
          } else {
            return hour >= startH || hour <= endH;
          }
        }

        return true;
      });

      // Increment impressions asynchronously for active banners
      if (activeBanners.length > 0) {
        const ids = activeBanners.map((b) => b._id);
        Banner.updateMany({ _id: { $in: ids } }, { $inc: { impressions: 1 } }).catch(() => {});
      }

      return ApiResponse.success(activeBanners);
    } catch (error) {
      return ApiResponse.fail(error.message, [error.message], 500);
    }
  }

  /**
   * Get all banners for admin table with filters and schedule status computed
   */
  async getBanners({
    search = '',
    position = 'all',
    status = 'all',
    page = 1,
    limit = 10,
    sortBy = 'priority',
    sortOrder = 'desc',
  } = {}) {
    try {
      await this.ensureSeedBanners();

      const query = {};

      if (search && search.trim()) {
        const regex = new RegExp(search.trim(), 'i');
        query.$or = [{ title: regex }, { subtitle: regex }, { badgeText: regex }, { ctaText: regex }];
      }

      if (position && position !== 'all') {
        query.position = position;
      }

      if (status === 'inactive') {
        query.isActive = false;
      }

      const skip = (Number(page) - 1) * Number(limit);
      const sort = {};
      sort[sortBy] = sortOrder === 'asc' ? 1 : -1;
      if (sortBy !== 'createdAt') {
        sort.createdAt = -1;
      }

      let allDocs = await Banner.find(query).sort(sort).lean();
      const now = new Date();

      // Compute status for each doc: 'active_now' | 'scheduled' | 'expired' | 'inactive'
      allDocs = allDocs.map((doc) => {
        let computedStatus = 'active_now';
        if (!doc.isActive) {
          computedStatus = 'inactive';
        } else if (doc.scheduleType === 'always') {
          computedStatus = 'active_now';
        } else {
          const nowMs = now.getTime();
          if (doc.startDate && new Date(doc.startDate).getTime() > nowMs) {
            computedStatus = 'scheduled';
          } else if (doc.endDate && new Date(doc.endDate).getTime() < nowMs) {
            computedStatus = 'expired';
          } else if (doc.scheduleType === 'recurring_daily' || doc.scheduleType === 'recurring_weekly') {
            const hour = now.getHours();
            const startH = doc.startHour ?? 0;
            const endH = doc.endHour ?? 23;
            const day = now.getDay();

            const isDayMatch =
              doc.scheduleType === 'recurring_weekly'
                ? Array.isArray(doc.activeDays) && doc.activeDays.includes(day)
                : true;

            const isHourMatch =
              startH <= endH
                ? hour >= startH && hour <= endH
                : hour >= startH || hour <= endH;

            computedStatus = isDayMatch && isHourMatch ? 'active_now' : 'scheduled';
          } else {
            computedStatus = 'active_now';
          }
        }
        return {
          ...doc,
          computedStatus,
        };
      });

      // Filter by status if requested
      if (status && status !== 'all') {
        allDocs = allDocs.filter((d) => d.computedStatus === status);
      }

      const total = allDocs.length;
      const paginated = allDocs.slice(skip, skip + Number(limit));

      // Calculate KPI summary stats
      const totalDocs = await Banner.find({}).lean();
      let activeNowCount = 0;
      let scheduledCount = 0;
      let totalImpressions = 0;
      let totalClicks = 0;

      totalDocs.forEach((d) => {
        totalImpressions += d.impressions || 0;
        totalClicks += d.clicks || 0;
        if (!d.isActive) return;

        if (d.scheduleType === 'always') {
          activeNowCount++;
        } else {
          const nowMs = now.getTime();
          if (d.startDate && new Date(d.startDate).getTime() > nowMs) {
            scheduledCount++;
          } else if (d.endDate && new Date(d.endDate).getTime() < nowMs) {
            // expired
          } else {
            activeNowCount++;
          }
        }
      });

      return ApiResponse.success({
        banners: paginated,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          totalPages: Math.ceil(total / Number(limit)) || 1,
        },
        stats: {
          activeNowCount,
          scheduledCount,
          totalImpressions,
          totalClicks,
          avgCtr: totalImpressions > 0 ? ((totalClicks / totalImpressions) * 100).toFixed(1) : '0.0',
        },
      });
    } catch (error) {
      return ApiResponse.fail(error.message, [error.message], 500);
    }
  }

  /**
   * Get banner by id
   */
  async getBannerById(id) {
    try {
      const banner = await Banner.findById(id);
      if (!banner) {
        return ApiResponse.fail('Banner not found', [], 404);
      }
      return ApiResponse.success(banner);
    } catch (error) {
      return ApiResponse.fail(error.message, [error.message], 500);
    }
  }

  /**
   * Create banner
   */
  async createBanner(data, userId = null) {
    try {
      if (!data.title || !data.title.trim()) {
        return ApiResponse.fail('Banner title is required', [], 400);
      }
      if (!data.imageUrl || !data.imageUrl.trim()) {
        return ApiResponse.fail('Banner image URL is required', [], 400);
      }

      const payload = {
        ...data,
        createdBy: userId,
      };

      const banner = await Banner.create(payload);
      return ApiResponse.success(banner, [`Banner "${banner.title}" created successfully`], 201);
    } catch (error) {
      return ApiResponse.fail(error.message, [error.message], 400);
    }
  }

  /**
   * Update banner
   */
  async updateBanner(id, data) {
    try {
      const banner = await Banner.findByIdAndUpdate(id, { $set: data }, { new: true, runValidators: true });
      if (!banner) {
        return ApiResponse.fail('Banner not found', [], 404);
      }
      return ApiResponse.success(banner, [`Banner "${banner.title}" updated successfully`]);
    } catch (error) {
      return ApiResponse.fail(error.message, [error.message], 400);
    }
  }

  /**
   * Delete banner
   */
  async deleteBanner(id) {
    try {
      const banner = await Banner.findByIdAndDelete(id);
      if (!banner) {
        return ApiResponse.fail('Banner not found', [], 404);
      }
      return ApiResponse.success(null, [`Banner "${banner.title}" deleted successfully`]);
    } catch (error) {
      return ApiResponse.fail(error.message, [error.message], 500);
    }
  }

  /**
   * Record click on banner
   */
  async recordClick(id) {
    try {
      await Banner.findByIdAndUpdate(id, { $inc: { clicks: 1 } });
      return ApiResponse.success({ clicked: true });
    } catch (error) {
      return ApiResponse.fail(error.message, [error.message], 500);
    }
  }
}

module.exports = { BannerService };
