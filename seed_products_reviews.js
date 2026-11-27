require('dotenv').config();
const { connectDatabase } = require('./Shared/API/config/Database.config');
const { Category } = require('./ecommerce.server/models/database/Category');
const { Product } = require('./ecommerce.server/models/database/Product');
const { Review } = require('./ecommerce.server/models/database/Review');
const { Banner } = require('./ecommerce.server/models/database/Banner');
const { User } = require('./auth.server/models/database/User');

async function seedProductsAndReviews() {
  try {
    console.log('Connecting to database...');
    await connectDatabase();

    const categories = await Category.find({});
    if (categories.length === 0) {
      console.error('No categories found. Please run seed.js first.');
      process.exit(1);
    }

    const catMap = {};
    categories.forEach((cat) => {
      catMap[cat.slug] = cat._id;
    });

    // Default category fallback
    const defaultCatId = categories[0]._id;

    // Get sellers or admin
    let seller = await User.findOne({ role: 'seller' });
    if (!seller) {
      seller = await User.findOne({ role: 'admin' });
    }
    const sellerId = seller ? seller._id : null;

    const dummyCustomers = [
      { name: 'Dorje Sherpa', email: 'dorje.sherpa@example.com' },
      { name: 'Ava Wilson', email: 'ava.wilson@example.com' },
      { name: 'Liam Johnson', email: 'liam.johnson@example.com' },
      { name: 'Sophia Taylor', email: 'sophia.taylor@example.com' },
      { name: 'Ethan Davis', email: 'ethan.davis@example.com' },
      { name: 'Olivia Brown', email: 'olivia.brown@example.com' },
      { name: 'Ramesh Karki', email: 'ramesh.k@example.com' },
      { name: 'Maya Tamang', email: 'maya.t@example.com' },
      { name: 'Carlos Mendez', email: 'carlos.m@example.com' },
      { name: 'Elena Rostova', email: 'elena.r@example.com' },
    ];

    console.log('Adding new rich products...');

    const newProductsData = [
      {
        name: 'Hand-Hammered Himalayan Singing Bowl (7 Metal Masterpiece)',
        slug: 'hand-hammered-himalayan-singing-bowl',
        sku: 'SB-HIM-07M',
        brand: 'Kathmandu Sound Therapy',
        description: 'Authentic 8-inch acoustic singing bowl forged by Tibetan master smiths in Patan using seven sacred planetary metals (copper, tin, lead, zinc, iron, gold, and silver). Produces deeply resonant 432Hz harmonic overtones ideal for mindfulness, meditation, chakra balancing, and acoustic relaxation. Includes a hand-turned rosewood leather mallet and brocade silk cushion ring.',
        shortDescription: 'Sacred 7-metal Tibetan 8" meditation singing bowl with wooden striker & silk ring.',
        price: 189.00,
        salePrice: 149.00,
        stock: 15,
        category: catMap['home-workspace'] || defaultCatId,
        seller: sellerId,
        images: [
          'https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&w=800&q=80',
          'https://images.unsplash.com/photo-1518241353330-0f7941c2d9b5?auto=format&fit=crop&w=800&q=80',
        ],
        isFeatured: true,
        status: 'active',
        tags: ['Meditation', 'Sound Healing', 'Handcrafted', 'Bestseller', 'Artisan'],
      },
      {
        name: 'HY310 4K Ultra HD Smart Mini Projector',
        slug: 'hy310-4k-ultra-hd-smart-mini-projector',
        sku: 'PRJ-HY310-4K',
        brand: 'VisionCraft Tech',
        description: 'Next-generation portable cinema projector featuring native 1080P resolution with 4K decoding support, ultra-bright 330 ANSI lumens, vertical auto keystone correction (±40°), Android 11 OS with built-in Netflix and YouTube, ultra-fast WiFi 6, Bluetooth 5.4, and included 2.4G Air Mouse remote control.',
        shortDescription: 'Compact 330 ANSI smart projector with auto keystone, WiFi 6 & Android 11.',
        price: 199.00,
        salePrice: 159.00,
        stock: 24,
        category: catMap['electronics-gadgets'] || defaultCatId,
        seller: sellerId,
        images: [
          'https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?auto=format&fit=crop&w=800&q=80',
          'https://images.unsplash.com/photo-1595769816263-9b910be24d5f?auto=format&fit=crop&w=800&q=80',
        ],
        isFeatured: true,
        status: 'active',
        tags: ['Smart Tech', 'Home Cinema', 'Projector', '4K Support'],
      },
      {
        name: 'Royal Himalayan Pashmina Cashmere Shawl (Grade-A Chyangra)',
        slug: 'royal-himalayan-pashmina-cashmere-shawl',
        sku: 'PSH-CHY-01',
        brand: 'Annapurna Looms',
        description: 'Spun from the finest Grade-A underfleece of high-altitude Himalayan Chyangra mountain goats grazing at over 14,000 feet. Feathery light yet extraordinarily warm, hand-loomed with classic eyelash fringes. Certified pure genuine cashmere pashmina.',
        shortDescription: 'Ultra-soft pure Grade-A Chyangra cashmere hand-loomed pashmina wrap.',
        price: 280.00,
        salePrice: 220.00,
        stock: 12,
        category: catMap['fashion-apparel'] || defaultCatId,
        seller: sellerId,
        images: [
          'https://images.unsplash.com/photo-1607083206869-4c7672e72a8a?auto=format&fit=crop&w=800&q=80',
          'https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&w=800&q=80',
        ],
        isFeatured: true,
        status: 'active',
        tags: ['Pashmina', 'Cashmere', 'Luxury', 'Handwoven', 'Fair Trade'],
      },
      {
        name: 'Organic High-Altitude Himalayan Orthodox Tea Selection (500g Tin)',
        slug: 'organic-himalayan-orthodox-tea-selection',
        sku: 'TEA-HIM-ORTHO',
        brand: 'Ilam Estate Rare Harvesters',
        description: 'First-flush hand-plucked spring harvest tea leaves grown in the misty mountain slopes of Ilam at 6,500ft altitude. Featuring delicate muscatel floral bouquet notes, rich natural antioxidants, and smooth lingering golden honey finish. Preserved in an airtight UV-shielded embossed tin.',
        shortDescription: 'First-flush high-altitude single-origin golden orthodox tea.',
        price: 48.00,
        salePrice: 38.00,
        stock: 50,
        category: catMap['home-workspace'] || defaultCatId,
        seller: sellerId,
        images: [
          'https://images.unsplash.com/photo-1576092768241-dec231879fc3?auto=format&fit=crop&w=800&q=80',
          'https://images.unsplash.com/photo-1564890369478-c89ca6d9cde9?auto=format&fit=crop&w=800&q=80',
        ],
        isFeatured: false,
        status: 'active',
        tags: ['Organic', 'Tea', 'Artisan', 'Healthy', 'Single Origin'],
      },
      {
        name: 'Acoustic Soundstage Studio Reference Monitors (Pair)',
        slug: 'acoustic-soundstage-studio-reference-monitors',
        sku: 'AUD-MON-5X',
        brand: 'Quantum Hi-Fi',
        description: 'Bi-amplified active nearfield studio monitors featuring 5.25-inch woven Kevlar woofers and 1-inch silk dome tweeters. Delivers uncolored, ruler-flat frequency response from 48Hz to 22kHz with balanced XLR and TRS inputs. Engineered for critical mastering and audio engineering.',
        shortDescription: 'Pair of bi-amplified active studio reference speakers with Kevlar cones.',
        price: 349.00,
        salePrice: 299.00,
        stock: 9,
        category: catMap['audio-acoustics'] || defaultCatId,
        seller: sellerId,
        images: [
          'https://images.unsplash.com/photo-1545454675-3531b543be5d?auto=format&fit=crop&w=800&q=80',
          'https://images.unsplash.com/photo-1511379938547-c1f69419868d?auto=format&fit=crop&w=800&q=80',
        ],
        isFeatured: true,
        status: 'active',
        tags: ['Studio', 'Audiophile', 'Monitors', 'Hi-Res Audio'],
      },
      {
        name: 'Nordic Solid Oak Ergonomic Monitor Stand & Desk Shelf',
        slug: 'nordic-solid-oak-ergonomic-monitor-stand',
        sku: 'DSK-OAK-STD',
        brand: 'Nordic Workspace',
        description: 'Handcrafted from FSC-certified solid European white oak with durable matte wax finish. Features integrated cable management channels, aluminum risers with non-slip cork pads, and underside storage clearance for full-sized mechanical keyboards.',
        shortDescription: 'Solid white oak dual monitor riser with keyboard storage clearance.',
        price: 129.00,
        salePrice: 109.00,
        stock: 20,
        category: catMap['home-workspace'] || defaultCatId,
        seller: sellerId,
        images: [
          'https://images.unsplash.com/photo-1518455027359-f3f8164ba6bd?auto=format&fit=crop&w=800&q=80',
          'https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?auto=format&fit=crop&w=800&q=80',
        ],
        isFeatured: false,
        status: 'active',
        tags: ['Desk Setup', 'Ergonomic', 'Minimalist', 'Oak Wood'],
      },
      {
        name: 'Alpine Extreme 4-Season Down Sleeping Bag (-20°C)',
        slug: 'alpine-extreme-4-season-down-sleeping-bag',
        sku: 'OUT-SLP-EXP',
        brand: 'SummitGear',
        description: 'Engineered for high-altitude mountaineering and sub-zero bivouacs. Filled with 900+ fill power RDS-certified goose down with hydrophobic nano-coating. Features a windproof 20D ripstop nylon shell, contoured anatomical footbox, and draft collar baffling.',
        shortDescription: '900FP expedition down sleeping bag rated for -20°C extremes.',
        price: 395.00,
        salePrice: 345.00,
        stock: 7,
        category: catMap['fitness-outdoors'] || defaultCatId,
        seller: sellerId,
        images: [
          'https://images.unsplash.com/photo-1510312305653-8ed496efae75?auto=format&fit=crop&w=800&q=80',
          'https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?auto=format&fit=crop&w=800&q=80',
        ],
        isFeatured: true,
        status: 'active',
        tags: ['Mountaineering', 'Camping', 'Down Gear', 'Extreme Cold'],
      },
      {
        name: 'Himalayan Shilajit Pure Mountain Resin (50g Gold Grade)',
        slug: 'himalayan-shilajit-pure-mountain-resin',
        sku: 'HLT-SHL-50G',
        brand: 'Himalaya Herbals',
        description: 'Authentic wild-harvested mineral pitch collected above 18,000 feet in the pristine Himalayas. Purified via traditional Ayurvedic triphala water decoction. Contains over 85 trace minerals and 75%+ active fulvic acid to naturally boost cellular energy, stamina, and cognitive function.',
        shortDescription: '100% pure wild-harvested Himalayan gold-grade shilajit resin with measuring spoon.',
        price: 54.00,
        salePrice: 42.00,
        stock: 40,
        category: catMap['beauty-skincare'] || defaultCatId,
        seller: sellerId,
        images: [
          'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?auto=format&fit=crop&w=800&q=80',
          'https://images.unsplash.com/photo-1546554137-f86b9593a222?auto=format&fit=crop&w=800&q=80',
        ],
        isFeatured: true,
        status: 'active',
        tags: ['Ayurveda', 'Wellness', 'Superfood', 'Energy'],
      },
      {
        name: 'Carbon Fiber Trekking Poles (Pair with Quick-Lock)',
        slug: 'carbon-fiber-trekking-poles-pair',
        sku: 'OUT-POLE-CF',
        brand: 'SummitGear',
        description: 'Ultralight 100% 3K carbon fiber trekking poles weighing only 210g each. Features ergonomic moisture-wicking cork grips, extended EVA foam sleeves, and anodized aluminum flip locks for rapid length adjustment between 65cm and 135cm.',
        shortDescription: '210g carbon fiber hiking poles with natural cork grips & quick locks.',
        price: 89.00,
        salePrice: 72.00,
        stock: 35,
        category: catMap['fitness-outdoors'] || defaultCatId,
        seller: sellerId,
        images: [
          'https://images.unsplash.com/photo-1551632811-561732d1e306?auto=format&fit=crop&w=800&q=80',
          'https://images.unsplash.com/photo-1486870591958-9b9d0d1dda99?auto=format&fit=crop&w=800&q=80',
        ],
        isFeatured: false,
        status: 'active',
        tags: ['Hiking', 'Trekking', 'Carbon Fiber', 'Ultralight'],
      },
      {
        name: 'Wireless Ergonomic Vertical Mouse (Dual 2.4G & BT)',
        slug: 'wireless-ergonomic-vertical-mouse',
        sku: 'MOU-VERT-PRO',
        brand: 'Apex Tech',
        description: 'Science-backed 57° handshake angle vertical mouse designed to eliminate forearm twist and wrist strain. Equipped with precision 4000 DPI optical sensor, whisper-quiet switches, textured thumb cradle, and dual-mode Bluetooth 5.1 / 2.4G wireless connectivity.',
        shortDescription: '57° ergonomic vertical mouse with silent clicks & USB-C rechargeable battery.',
        price: 59.00,
        salePrice: 48.00,
        stock: 28,
        category: catMap['electronics-gadgets'] || defaultCatId,
        seller: sellerId,
        images: [
          'https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?auto=format&fit=crop&w=800&q=80',
          'https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?auto=format&fit=crop&w=800&q=80',
        ],
        isFeatured: false,
        status: 'active',
        tags: ['Ergonomics', 'Mouse', 'Office', 'Productivity'],
      },
    ];

    for (const prodData of newProductsData) {
      const existing = await Product.findOne({ slug: prodData.slug });
      if (!existing) {
        await Product.create(prodData);
        console.log(`Created product: ${prodData.name}`);
      } else {
        await Product.updateOne({ _id: existing._id }, { $set: prodData });
        console.log(`Updated product: ${prodData.name}`);
      }
    }

    // Now seed reviews for ALL products in catalog
    console.log('Seeding customer reviews for all products...');
    const allProducts = await Product.find({ status: 'active' });

    const reviewTemplates = [
      {
        title: 'Outstanding quality and craftsmanship!',
        comment: 'Exceeded all expectations. The tactile feel and build quality are incredible. Delivery was prompt and packaging was immaculate. Definitely buying again!',
        rating: 5,
      },
      {
        title: 'Exceptional value for money',
        comment: 'I did a lot of research before choosing this and I am thrilled with the purchase. Works flawlessly, looks premium, and arrived within 2 days.',
        rating: 5,
      },
      {
        title: 'Genuinely authentic and beautifully made',
        comment: 'The authentic craftsmanship shows immediately. Customer service answered my questions right away via the chat button. Highly recommended.',
        rating: 5,
      },
      {
        title: 'Very satisfied with this purchase',
        comment: 'Solid performance, very well made. Minor delay with courier tracking on day 1 but the item itself is 10/10.',
        rating: 4,
      },
      {
        title: 'High quality materials & great finish',
        comment: 'Super happy with this order. Matches the description and photos exactly. Will recommend to colleagues and family.',
        rating: 5,
      },
      {
        title: 'Worth every single penny',
        comment: 'You can immediately tell that care was put into making this product. Seamless checkout and great updates throughout shipping.',
        rating: 5,
      },
    ];

    let totalReviewsCreated = 0;

    for (const prod of allProducts) {
      // Check existing reviews
      const existingReviews = await Review.find({ product: prod._id });
      if (existingReviews.length < 3) {
        const numToCreate = 3 + Math.floor(Math.random() * 3); // 3 to 5 reviews
        const createdReviews = [];

        for (let i = 0; i < numToCreate; i++) {
          const cust = dummyCustomers[(prod.name.length + i) % dummyCustomers.length];
          const tmpl = reviewTemplates[(i + prod.name.length) % reviewTemplates.length];
          const reviewDate = new Date(Date.now() - (i * 3 + 1) * 24 * 60 * 60 * 1000);

          const r = await Review.create({
            product: prod._id,
            productName: prod.name,
            userName: cust.name,
            userEmail: cust.email,
            rating: tmpl.rating,
            title: tmpl.title,
            comment: tmpl.comment,
            isVerifiedPurchase: true,
            status: 'approved',
            helpfulCount: Math.floor(Math.random() * 15) + 1,
            createdAt: reviewDate,
          });

          createdReviews.push(r);
          totalReviewsCreated++;
        }

        // Calculate avg rating
        const allProdReviews = await Review.find({ product: prod._id, status: 'approved' });
        const avgRating =
          allProdReviews.reduce((sum, rev) => sum + rev.rating, 0) / allProdReviews.length;

        prod.rating = parseFloat(avgRating.toFixed(1));
        prod.numReviews = allProdReviews.length;
        await prod.save();
      }
    }

    console.log(`Seeded ${totalReviewsCreated} new verified customer reviews across all products!`);

    // Ensure hero banners are seeded
    console.log('Checking and seeding promotional Hero Banners...');
    const bannerCount = await Banner.countDocuments({ position: 'hero_main' });
    if (bannerCount === 0) {
      await Banner.create([
        {
          title: 'Twilight Tea Connoisseur Club (Evening Special)',
          subtitle: 'Every evening from 6 PM to 11 PM: enjoy free organic lemongrass sample with any high-altitude orthodox tea purchase.',
          badgeText: 'Daily Evening Delight (18:00 - 23:00)',
          imageUrl: 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?auto=format&fit=crop&w=1600&q=80',
          ctaText: 'Shop Rare Harvests',
          ctaLink: '/#catalog',
          secondaryCtaText: 'Featured Items',
          secondaryCtaLink: '/#catalog-grid',
          position: 'hero_main',
          alignment: 'left',
          overlayOpacity: 55,
          priority: 1,
          isActive: true,
          scheduleType: 'always',
        },
        {
          title: 'Authentic Himalayan Craftsmanship, Direct to Your Door',
          subtitle: 'Explore authentic hand-hammered singing bowls, organic high-altitude teas, pure pashmina shawls, and artisan crafts certified for ethical fair trade.',
          badgeText: 'Handcrafted in Nepal • Ethically Sourced',
          imageUrl: 'https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&w=1600&q=80',
          ctaText: 'Shop All Catalog',
          ctaLink: '/#catalog-grid',
          secondaryCtaText: 'Explore Collections',
          secondaryCtaLink: '/#catalog-grid',
          position: 'hero_main',
          alignment: 'left',
          overlayOpacity: 50,
          priority: 2,
          isActive: true,
          scheduleType: 'always',
        },
      ]);
      console.log('Seeded 2 active hero promotional banners!');
    }

    console.log('Enrichment completed successfully!');
    process.exit(0);
  } catch (err) {
    console.error('Error seeding products and reviews:', err);
    process.exit(1);
  }
}

seedProductsAndReviews();
