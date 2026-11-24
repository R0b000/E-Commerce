require('dotenv').config();
const bcrypt = require('bcryptjs');
const { connectDatabase } = require('./Shared/API/config/Database.config');
const { User } = require('./auth.server/models/database/User');
const { Category } = require('./ecommerce.server/models/database/Category');
const { Product } = require('./ecommerce.server/models/database/Product');
const { Order } = require('./ecommerce.server/models/database/Order');
const { Role } = require('./ecommerce.server/models/database/Role');
const { Permission } = require('./ecommerce.server/models/database/Permission');
const { Menu } = require('./ecommerce.server/models/database/Menu');
const { Discount } = require('./ecommerce.server/models/database/Discount');
const { Banner } = require('./ecommerce.server/models/database/Banner');

async function seedData() {
  try {
    console.log('Connecting to database...');
    await connectDatabase();

    console.log('Clearing existing collections...');
    await Category.deleteMany({});
    await Product.deleteMany({});
    await Order.deleteMany({});
    await Role.deleteMany({});
    await Permission.deleteMany({});
    await Menu.deleteMany({});
    await Discount.deleteMany({});
    await Banner.deleteMany({});

    // 1. Seed Permissions
    console.log('Seeding Permissions...');
    const permissionsData = [
      { code: 'pages:dashboard', name: 'Dashboard Page', module: 'Dashboard', description: 'Access real-time sales overview and KPIs' },
      { code: 'pages:products', name: 'Products Page', module: 'Catalog', description: 'Browse and manage inventory catalog' },
      { code: 'products:create', name: 'Create Product', module: 'Catalog', description: 'Create and list new products' },
      { code: 'products:edit', name: 'Edit Product', module: 'Catalog', description: 'Update product pricing, details and stock' },
      { code: 'products:delete', name: 'Delete Product', module: 'Catalog', description: 'Delete product listings' },
      { code: 'pages:categories', name: 'Categories Page', module: 'Catalog', description: 'Manage department classifications' },
      { code: 'pages:orders', name: 'Orders Page', module: 'Orders', description: 'Access order fulfillment and customer transactions' },
      { code: 'orders:update_status', name: 'Update Order Status', module: 'Orders', description: 'Update dispatch tracking numbers and order state' },
      { code: 'pages:customers', name: 'Customer Directory', module: 'Directory', description: 'View registered shopper profiles' },
      { code: 'pages:roles', name: 'Role Management', module: 'Access Control', description: 'Manage customer and seller role permissions' },
      { code: 'pages:permissions', name: 'Permission Management', module: 'Access Control', description: 'Grant special user permissions and create permissions' },
      { code: 'pages:menus', name: 'Menu Addition Page', module: 'Navigation', description: 'Add and configure dynamic navigation pages on the fly' },
    ];
    await Permission.insertMany(permissionsData);

    // 2. Seed Roles (Customer & Seller, plus Admin)
    console.log('Seeding Roles (Customer & Seller)...');
    const rolesData = [
      {
        name: 'seller',
        label: 'Seller / Vendor',
        description: 'Store vendors who manage their own product listings and fulfill customer orders.',
        permissions: [
          'pages:dashboard',
          'pages:products',
          'products:create',
          'products:edit',
          'products:delete',
          'pages:orders',
          'orders:update_status',
        ],
        isSystem: true,
      },
      {
        name: 'customer',
        label: 'Customer / Buyer',
        description: 'Shoppers who purchase items, track shipments, and view order receipts.',
        permissions: [
          'store:browse',
          'orders:view_own',
        ],
        isSystem: true,
      },
      {
        name: 'admin',
        label: 'System Administrator',
        description: 'Super administrator with full access to all pages, role permissions, and dynamic menus.',
        permissions: ['*', ...permissionsData.map((p) => p.code)],
        isSystem: true,
      },
    ];
    await Role.insertMany(rolesData);

    // 3. Seed Dynamic Menus
    console.log('Seeding Dynamic Navigation Menus...');
    const menusData = [
      // 1. Dashboard (Single Page Root)
      { menuId: 1, name: 'Dashboard', menuNameNepali: 'ड्यासबोर्ड', path: '/admin', icon: 'dashboard', order: 1, parentId: null, isSinglePage: true, isPrimary: true, isNotParent: true, isNotChild: true, roles: ['admin', 'seller', 'support', 'manager'], isActive: true },

      // 2. Products (Parent Menu)
      { menuId: 2, name: 'Products', menuNameNepali: 'उत्पादनहरू', path: '/admin/products', icon: 'shopping_cart', order: 2, parentId: null, isSinglePage: false, isPrimary: true, isNotParent: false, isNotChild: true, roles: ['admin', 'seller', 'manager'], isActive: true },
      { menuId: 21, name: 'All Products', menuNameNepali: 'सबै उत्पादनहरू', path: '/admin/products', icon: 'shopping_cart', order: 1, parentId: 2, isSinglePage: true, isPrimary: false, isChild: true, isNotParent: true, isNotChild: false, roles: ['admin', 'seller', 'manager'], isActive: true },
      { menuId: 22, name: 'Categories', menuNameNepali: 'कोटिहरू', path: '/admin/categories', icon: 'category', order: 2, parentId: 2, isSinglePage: true, isPrimary: false, isChild: true, isNotParent: true, isNotChild: false, roles: ['admin', 'manager'], isActive: true },
      { menuId: 24, name: 'Brands', menuNameNepali: 'ब्रान्डहरू', path: '/admin/brands', icon: 'tag', order: 3, parentId: 2, isSinglePage: true, isPrimary: false, isChild: true, isNotParent: true, isNotChild: false, roles: ['admin', 'seller', 'manager'], isActive: true },
      { menuId: 23, name: 'Stock & Inventory', menuNameNepali: 'मौज्दात तथा भण्डारण', path: '/admin/inventory', icon: 'inventory_2', order: 4, parentId: 2, isSinglePage: true, isPrimary: false, isChild: true, isNotParent: true, isNotChild: false, roles: ['admin', 'seller', 'manager'], isActive: true },

      // 3. Order (Parent Menu)
      { menuId: 11, name: 'Order', menuNameNepali: 'अर्डर', path: '/admin/orders', icon: 'receipt_long', order: 3, parentId: null, isSinglePage: false, isPrimary: true, isNotParent: false, isNotChild: true, roles: ['admin', 'seller', 'support', 'manager'], isActive: true },
      { menuId: 12, name: 'Orders', menuNameNepali: 'अर्डर सूची', path: '/admin/orders', icon: 'receipt_long', order: 1, parentId: 11, isSinglePage: true, isPrimary: false, isChild: true, isNotParent: true, isNotChild: false, roles: ['admin', 'seller', 'support', 'manager'], isActive: true },
      { menuId: 13, name: 'Billing', menuNameNepali: 'बिलिङ', path: '/admin/billing', icon: 'receipt', order: 2, parentId: 11, isSinglePage: true, isPrimary: false, isChild: true, isNotParent: true, isNotChild: false, roles: ['admin', 'seller', 'support', 'manager'], isActive: true },
      { menuId: 14, name: 'Customer Reviews', menuNameNepali: 'ग्राहक समीक्षाहरू', path: '/admin/reviews', icon: 'star', order: 3, parentId: 11, isSinglePage: true, isPrimary: false, isChild: true, isNotParent: true, isNotChild: false, roles: ['admin', 'support', 'seller'], isActive: true },

      // 4. Marketing (Parent Menu)
      { menuId: 4, name: 'Marketing', menuNameNepali: 'बजार व्यवस्थापन', path: '/admin/discounts', icon: 'tune', order: 4, parentId: null, isSinglePage: false, isPrimary: false, isNotParent: false, isNotChild: true, roles: ['admin', 'manager'], isActive: true },
      { menuId: 41, name: 'Discounts & Coupons', menuNameNepali: 'छुट र कुपन', path: '/admin/discounts', icon: 'tune', order: 1, parentId: 4, isSinglePage: true, isPrimary: false, isChild: true, isNotParent: true, isNotChild: false, roles: ['admin', 'manager'], isActive: true },
      { menuId: 42, name: 'Hero Banners', menuNameNepali: 'ब्यानरहरू', path: '/admin/banners', icon: 'photo_camera', order: 2, parentId: 4, isSinglePage: true, isPrimary: false, isChild: true, isNotParent: true, isNotChild: false, roles: ['admin', 'manager'], isActive: true },

      // 5. Accounts (Parent Menu)
      { menuId: 5, name: 'Accounts', menuNameNepali: 'खाताहरू', path: '/admin/accounts/employees', icon: 'groups', order: 5, parentId: null, isSinglePage: false, isPrimary: false, isNotParent: false, isNotChild: true, roles: ['admin', 'manager', 'support'], isActive: true },
      { menuId: 51, name: 'Employee', menuNameNepali: 'कर्मचारीहरू', path: '/admin/accounts/employees', icon: 'badge', order: 1, parentId: 5, isSinglePage: true, isPrimary: false, isChild: true, isNotParent: true, isNotChild: false, roles: ['admin', 'manager', 'support'], isActive: true },
      { menuId: 52, name: 'Client', menuNameNepali: 'ग्राहक तथा बिक्रेता', path: '/admin/accounts/clients', icon: 'groups', order: 2, parentId: 5, isSinglePage: true, isPrimary: false, isChild: true, isNotParent: true, isNotChild: false, roles: ['admin', 'manager', 'support', 'seller'], isActive: true },

      // 6. Auth (Parent Menu)
      { menuId: 10, name: 'Auth', menuNameNepali: 'प्रमाणीकरण', path: '/admin/auth', icon: 'shield', order: 6, parentId: null, isSinglePage: false, isPrimary: false, isNotParent: false, isNotChild: true, roles: ['admin'], isActive: true },
      { menuId: 101, name: 'Menu Setup', menuNameNepali: 'मेनु सेटअप', path: '/admin/menus', icon: 'menu', order: 1, parentId: 10, isSinglePage: true, isPrimary: false, isChild: true, isNotParent: true, isNotChild: false, roles: ['admin'], isActive: true },
      { menuId: 102, name: 'Menu Role Setup', menuNameNepali: 'मेनु भूमिका सेटअप', path: '/admin/roles', icon: 'admin_panel_settings', order: 2, parentId: 10, isSinglePage: true, isPrimary: false, isChild: true, isNotParent: true, isNotChild: false, roles: ['admin'], isActive: true },
      { menuId: 103, name: 'User Setup', menuNameNepali: 'प्रयोगकर्ता सेटअप', path: '/admin/customers', icon: 'person', order: 3, parentId: 10, isSinglePage: true, isPrimary: false, isChild: true, isNotParent: true, isNotChild: false, roles: ['admin'], isActive: true },
      { menuId: 104, name: 'User Role', menuNameNepali: 'प्रयोगकर्ता भूमिका', path: '/admin/permissions', icon: 'group', order: 4, parentId: 10, isSinglePage: true, isPrimary: false, isChild: true, isNotParent: true, isNotChild: false, roles: ['admin'], isActive: true },

      // 7. Security & System (Parent Menu)
      { menuId: 60, name: 'Security & System', menuNameNepali: 'सुरक्षा र प्रणाली', path: '/admin/security', icon: 'lock', order: 7, parentId: null, isSinglePage: false, isPrimary: false, isNotParent: false, isNotChild: true, roles: ['admin'], isActive: true },
      { menuId: 61, name: 'Security & Devices', menuNameNepali: 'सुरक्षा र उपकरणहरू', path: '/admin/security', icon: 'lock', order: 1, parentId: 60, isSinglePage: true, isPrimary: false, isChild: true, isNotParent: true, isNotChild: false, roles: ['admin', 'seller', 'support', 'manager', 'customer', 'user'], isActive: true },
      { menuId: 62, name: 'Audit Logs', menuNameNepali: 'अडिट लगहरू', path: '/admin/audit-logs', icon: 'analytics', order: 2, parentId: 60, isSinglePage: true, isPrimary: false, isChild: true, isNotParent: true, isNotChild: false, roles: ['admin'], isActive: true },
    ];
    await Menu.insertMany(menusData);

    // 4. Seed Users (Admin, Sellers, Customers)
    console.log('Seeding Users...');
    const adminPassword = await bcrypt.hash('admin123', 10);
    const sellerPassword = await bcrypt.hash('seller123', 10);
    const customerPassword = await bcrypt.hash('customer123', 10);

    // Ensure Admin
    let adminUser = await User.findOne({ email: 'admin@store.com' });
    if (adminUser) {
      adminUser.role = 'admin';
      adminUser.password = adminPassword;
      adminUser.customPermissions = [];
      await adminUser.save();
    } else {
      adminUser = await User.create({
        firstName: 'System',
        lastName: 'Administrator',
        email: 'admin@store.com',
        password: adminPassword,
        role: 'admin',
        isActive: true,
        customPermissions: [],
      });
    }

    // Ensure Primary Seller
    let sellerUser = await User.findOne({ email: 'seller@store.com' });
    if (sellerUser) {
      sellerUser.role = 'seller';
      sellerUser.password = sellerPassword;
      sellerUser.customPermissions = [];
      await sellerUser.save();
    } else {
      sellerUser = await User.create({
        firstName: 'Pasang',
        lastName: 'Lama',
        email: 'seller@store.com',
        password: sellerPassword,
        role: 'seller',
        isActive: true,
        customPermissions: [],
      });
    }

    // Ensure Secondary Seller
    let sellerUser2 = await User.findOne({ email: 'seller2@store.com' });
    if (sellerUser2) {
      sellerUser2.role = 'seller';
      sellerUser2.password = sellerPassword;
      sellerUser2.customPermissions = [];
      await sellerUser2.save();
    } else {
      sellerUser2 = await User.create({
        firstName: 'Tenzing',
        lastName: 'Crafts',
        email: 'seller2@store.com',
        password: sellerPassword,
        role: 'seller',
        isActive: true,
        customPermissions: [],
      });
    }

    // Ensure Primary Customer
    let primaryCustomer = await User.findOne({ email: 'customer@store.com' });
    if (primaryCustomer) {
      primaryCustomer.role = 'customer';
      primaryCustomer.password = customerPassword;
      primaryCustomer.customPermissions = [];
      await primaryCustomer.save();
    } else {
      primaryCustomer = await User.create({
        firstName: 'Dorje',
        lastName: 'Sherpa',
        email: 'customer@store.com',
        password: customerPassword,
        role: 'customer',
        isActive: true,
        customPermissions: [],
      });
    }

    const dummyCustomers = [
      { firstName: 'Sophia', lastName: 'Taylor', email: 'sophia.taylor@example.com' },
      { firstName: 'Liam', lastName: 'Johnson', email: 'liam.johnson@example.com' },
      { firstName: 'Olivia', lastName: 'Brown', email: 'olivia.brown@example.com' },
      { firstName: 'Ethan', lastName: 'Davis', email: 'ethan.davis@example.com' },
      { firstName: 'Ava', lastName: 'Wilson', email: 'ava.wilson@example.com' },
      { firstName: 'Noah', lastName: 'Martinez', email: 'noah.martinez@example.com' },
    ];

    const customerDocs = [primaryCustomer];
    for (const c of dummyCustomers) {
      let cust = await User.findOne({ email: c.email });
      if (!cust) {
        cust = await User.create({
          ...c,
          password: customerPassword,
          role: 'customer',
          isActive: true,
        });
      } else {
        cust.role = 'customer';
        await cust.save();
      }
      customerDocs.push(cust);
    }

    // 5. Seed Categories
    console.log('Seeding Categories...');
    const categoriesData = [
      {
        name: 'Electronics & Gadgets',
        slug: 'electronics-gadgets',
        description: 'Next-generation smart tech, computing essentials, and audio engineering.',
        image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=800&q=80',
        displayOrder: 1,
      },
      {
        name: 'Fashion & Apparel',
        slug: 'fashion-apparel',
        description: 'Modern minimalist streetwear, durable activewear, and timeless classics.',
        image: 'https://images.unsplash.com/photo-1445205170230-053b83016050?auto=format&fit=crop&w=800&q=80',
        displayOrder: 2,
      },
      {
        name: 'Home & Workspace',
        slug: 'home-workspace',
        description: 'Ergonomic furnishings, ambient lighting, and artisan homeware.',
        image: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=800&q=80',
        displayOrder: 3,
      },
      {
        name: 'Audio & Acoustics',
        slug: 'audio-acoustics',
        description: 'Studio-grade monitor headphones, lossless DACs, and wireless earbuds.',
        image: 'https://images.unsplash.com/photo-1546435770-a3e426bf472b?auto=format&fit=crop&w=800&q=80',
        displayOrder: 4,
      },
      {
        name: 'Fitness & Outdoors',
        slug: 'fitness-outdoors',
        description: 'Precision GPS wearables, tactical hydration gear, and performance gear.',
        image: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&w=800&q=80',
        displayOrder: 5,
      },
      {
        name: 'Beauty & Skincare',
        slug: 'beauty-skincare',
        description: 'Herbal tonics, Himalayan botanical serums, and organic facial cleansers.',
        image: 'https://images.unsplash.com/photo-1598440947619-2c35fc9aa908?auto=format&fit=crop&w=800&q=80',
        displayOrder: 6,
      },
    ];

    const insertedCategories = await Category.insertMany(categoriesData);
    const catMap = {};
    insertedCategories.forEach((cat) => {
      catMap[cat.slug] = cat._id;
    });

    // 6. Seed Products with Seller Associations
    console.log('Seeding Products...');
    const productsData = [
      {
        name: 'AeroPulse Wireless ANC Headphones',
        slug: 'aeropulse-wireless-anc-headphones',
        sku: 'AP-ANC-01',
        brand: 'AeroPulse Audio',
        description: 'Engineered with titanium 40mm acoustic drivers, active hybrid noise cancellation up to 42dB, and 50-hour battery life with ultra-fast Type-C charging.',
        shortDescription: 'Hybrid ANC headphones with 50hr battery & ultra-low latency.',
        price: 249.99,
        salePrice: 199.99,
        stock: 35,
        category: catMap['audio-acoustics'],
        seller: sellerUser._id,
        images: [
          'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=800&q=80',
          'https://images.unsplash.com/photo-1484704849700-f032a568e944?auto=format&fit=crop&w=800&q=80',
        ],
        isFeatured: true,
        status: 'active',
        rating: 4.9,
        numReviews: 128,
        tags: ['Audio', 'Wireless', 'ANC', 'Best Seller'],
      },
      {
        name: 'Apex Mechanical Keyboard (RGB Pro)',
        slug: 'apex-mechanical-keyboard-rgb-pro',
        sku: 'KB-APX-RGB',
        brand: 'Apex Tech',
        description: 'Gasket-mounted aerospace aluminum frame with hot-swappable lubed mechanical linear switches, customizable per-key RGB backlighting, and detachable braided coiled cable.',
        shortDescription: 'Hot-swappable gasket-mounted mechanical keyboard with CNC aluminum body.',
        price: 159.00,
        salePrice: 139.00,
        stock: 4,
        category: catMap['electronics-gadgets'],
        seller: sellerUser._id,
        images: [
          'https://images.unsplash.com/photo-1587829741301-dc798b83add3?auto=format&fit=crop&w=800&q=80',
          'https://images.unsplash.com/photo-1618384887929-16ec33fab9ef?auto=format&fit=crop&w=800&q=80',
        ],
        isFeatured: true,
        status: 'active',
        rating: 4.8,
        numReviews: 86,
        tags: ['Workspace', 'Gaming', 'Hot-swap'],
      },
      {
        name: 'Chronos Horizon Smartwatch v3',
        slug: 'chronos-horizon-smartwatch-v3',
        sku: 'CH-SW-V3',
        brand: 'Chronos',
        description: '1.43-inch Sapphire AMOLED display, dual-frequency GPS, biometric continuous ECG and SpO2 sensors, IP68 50M water resistance, and 14 days standby power.',
        shortDescription: 'Sapphire glass AMOLED smartwatch with multi-band GPS and ECG tracking.',
        price: 299.99,
        salePrice: null,
        stock: 22,
        category: catMap['fitness-outdoors'],
        seller: sellerUser._id,
        images: [
          'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=800&q=80',
          'https://images.unsplash.com/photo-1508685096489-7aacd43bd3b1?auto=format&fit=crop&w=800&q=80',
        ],
        isFeatured: true,
        status: 'active',
        rating: 4.7,
        numReviews: 64,
        tags: ['Wearables', 'Smartwatch', 'Fitness'],
      },
      {
        name: 'ErgoDynamic Mesh Executive Desk Chair',
        slug: 'ergodynamic-mesh-desk-chair',
        sku: 'CHR-ERG-90',
        brand: 'ErgoDynamic',
        description: 'Engineered for 12+ hours of posture support with 4D omni-adjustable armrests, adaptive lumbar support, dynamic tilt tension lock, and breathable German elastomeric mesh.',
        shortDescription: 'High-end ergonomic mesh office chair with adaptive lumbar matrix.',
        price: 449.00,
        salePrice: 389.00,
        stock: 3,
        category: catMap['home-workspace'],
        seller: sellerUser._id,
        images: [
          'https://images.unsplash.com/photo-1580481077195-c244c379a602?auto=format&fit=crop&w=800&q=80',
          'https://images.unsplash.com/photo-1505797149-43b0069ec26b?auto=format&fit=crop&w=800&q=80',
        ],
        isFeatured: true,
        status: 'active',
        rating: 4.9,
        numReviews: 92,
        tags: ['Furniture', 'Ergonomic', 'Workspace'],
      },
      {
        name: 'Minimalist Weatherproof Commuter Backpack',
        slug: 'minimalist-weatherproof-commuter-backpack',
        sku: 'BP-MIN-28L',
        brand: 'Vanguard EDC',
        description: '28-liter capacity crafted from 840D recycled ballistic nylon, YKK AquaGuard water-sealed zippers, dedicated padded 16-inch laptop chamber, and magnetic quick-access pockets.',
        shortDescription: '28L water-resistant EDC backpack with 16" laptop vault.',
        price: 119.50,
        salePrice: 99.00,
        stock: 45,
        category: catMap['fashion-apparel'],
        seller: sellerUser._id,
        images: [
          'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=800&q=80',
          'https://images.unsplash.com/photo-1622560480605-d83c853bc5c3?auto=format&fit=crop&w=800&q=80',
        ],
        isFeatured: false,
        status: 'active',
        rating: 4.6,
        numReviews: 43,
        tags: ['Bags', 'Travel', 'Everyday Carry'],
      },
      {
        name: 'Artisan Ceramic Pour-Over Kettle & Carafe Set',
        slug: 'artisan-ceramic-pour-over-set',
        sku: 'KT-ART-CER',
        brand: 'CraftHimalaya',
        description: 'Handcrafted stoneware matte-finish drip kettle with precision gooseneck spout and heat-resistant borosilicate glass carafe for specialty single-origin coffee brewing.',
        shortDescription: 'Gooseneck ceramic kettle with heat-tempered coffee decanter.',
        price: 78.00,
        salePrice: null,
        stock: 18,
        category: catMap['home-workspace'],
        seller: sellerUser._id,
        images: [
          'https://images.unsplash.com/photo-1517256064527-09c73fc73e38?auto=format&fit=crop&w=800&q=80',
          'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=800&q=80',
        ],
        isFeatured: false,
        status: 'active',
        rating: 4.8,
        numReviews: 37,
        tags: ['Kitchen', 'Coffee', 'Handcrafted'],
      },
      {
        name: 'Ultralight Trail Titanium Flask 750ml',
        slug: 'ultralight-trail-titanium-flask-750ml',
        sku: 'FLK-TI-750',
        brand: 'SummitGear',
        description: 'Medical-grade TA1 pure titanium canteen with zero metallic taste transfer, single-wall ultralight construction (115g), and paracord-wrapped leakproof cap.',
        shortDescription: '115g pure titanium outdoor trail canteen with leakproof seal.',
        price: 85.00,
        salePrice: 75.00,
        stock: 2,
        category: catMap['fitness-outdoors'],
        seller: sellerUser2._id,
        images: [
          'https://images.unsplash.com/photo-1602143407151-7111542de6e8?auto=format&fit=crop&w=800&q=80',
          'https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&w=800&q=80',
        ],
        isFeatured: true,
        status: 'active',
        rating: 4.9,
        numReviews: 51,
        tags: ['Camping', 'Titanium', 'Ultralight'],
      },
      {
        name: 'Merino Wool Alpine Thermal Base Layer',
        slug: 'merino-wool-alpine-thermal-base-layer',
        sku: 'APP-MRN-260',
        brand: 'AlpineMerino',
        description: '260g/m² 100% ultrafine Australian Merino wool. Natural temperature regulation, anti-odor antimicrobial properties, flatlock non-chafing seams, and thumb loop cuffs.',
        shortDescription: '260gsm 100% pure merino wool thermal top for extreme cold.',
        price: 135.00,
        salePrice: 115.00,
        stock: 30,
        category: catMap['fashion-apparel'],
        seller: sellerUser2._id,
        images: [
          'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=800&q=80',
          'https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?auto=format&fit=crop&w=800&q=80',
        ],
        isFeatured: false,
        status: 'active',
        rating: 4.7,
        numReviews: 29,
        tags: ['Apparel', 'Merino Wool', 'Thermal'],
      },
      {
        name: 'Lumina Studio Reference Desk Lamp',
        slug: 'lumina-studio-reference-desk-lamp',
        sku: 'LMP-LUM-CRI',
        brand: 'Lumina Studio',
        description: '98+ CRI high-fidelity LED task light with touch-stepless color temperature tuning (2700K - 6500K), built-in wireless Qi charging base, and ambient bias back-lighting.',
        shortDescription: 'CRI 98+ designer aluminum task light with wireless charging dock.',
        price: 189.00,
        salePrice: null,
        stock: 14,
        category: catMap['home-workspace'],
        seller: sellerUser2._id,
        images: [
          'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?auto=format&fit=crop&w=800&q=80',
          'https://images.unsplash.com/photo-1534349762230-e0cadf78f5da?auto=format&fit=crop&w=800&q=80',
        ],
        isFeatured: false,
        status: 'active',
        rating: 4.8,
        numReviews: 44,
        tags: ['Lighting', 'Workspace', 'Studio'],
      },
      {
        name: 'Quantum Wireless Hi-Res Audio Streamer',
        slug: 'quantum-wireless-hi-res-audio-streamer',
        sku: 'DAC-QNT-PRO',
        brand: 'Quantum Hi-Fi',
        description: 'Dual ESS Sabre ES9038Q2M DAC chips, LDAC/aptX-HD lossless Bluetooth 5.2, balanced 4.4mm and XLR outputs with ultra-clean linear power regulator stage.',
        shortDescription: 'Lossless audiophile network streamer with dual ESS Sabre DACs.',
        price: 799.00,
        salePrice: null,
        stock: 8,
        category: catMap['audio-acoustics'],
        seller: adminUser._id,
        images: [
          'https://images.unsplash.com/photo-1545454675-3531b543be5d?auto=format&fit=crop&w=800&q=80',
          'https://images.unsplash.com/photo-1511379938547-c1f69419868d?auto=format&fit=crop&w=800&q=80',
        ],
        isFeatured: true,
        status: 'active',
        rating: 5.0,
        numReviews: 19,
        tags: ['Audiophile', 'DAC', 'Hi-Res Audio'],
      },
      {
        name: 'Himalayan Herbal Glow Clarifying Serum',
        slug: 'himalayan-herbal-glow-clarifying-serum',
        sku: 'SKN-GLW-01',
        brand: 'Himalaya Herbals',
        description: 'Infused with wild seabuckthorn, organic saffron, and cold-pressed neem. Controls sebum, reduces blemishes, and balances complexions.',
        shortDescription: 'Clarifying botanical facial serum for oily and fair skin.',
        price: 34.99,
        salePrice: 29.99,
        stock: 45,
        category: catMap['beauty-skincare'],
        seller: sellerUser._id,
        images: [
          'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?auto=format&fit=crop&w=800&q=80',
        ],
        isFeatured: true,
        status: 'active',
        rating: 4.9,
        numReviews: 76,
        tags: ['Oily Skin', 'Fair Skin', 'Organic', 'Cruelty-Free', 'Best Seller'],
      },
      {
        name: 'Pure Alpine Rosewater Hydrating Toner',
        slug: 'pure-alpine-rosewater-hydrating-toner',
        sku: 'SKN-RSW-02',
        brand: 'Kama Botanicals',
        description: 'Distilled from wild Himalayan Damask roses. Calms redness, deeply hydrates dry and sensitive skin, and enhances natural radiance.',
        shortDescription: 'Gentle hydrating floral mist for sensitive, fair, and dry skin.',
        price: 24.50,
        salePrice: null,
        stock: 30,
        category: catMap['beauty-skincare'],
        seller: sellerUser._id,
        images: [
          'https://images.unsplash.com/photo-1608248597359-5f2575e9b3d1?auto=format&fit=crop&w=800&q=80',
        ],
        isFeatured: false,
        status: 'active',
        rating: 4.8,
        numReviews: 52,
        tags: ['Fair Skin', 'Dry Skin', 'Sensitive Skin', 'Hydrating'],
      },
    ];

    const insertedProducts = await Product.insertMany(productsData);

    // 7. Seed Orders with User & Seller bindings
    console.log('Seeding Orders...');
    const dummyOrders = [
      {
        orderNumber: 'ORD-8921-101',
        user: primaryCustomer._id,
        customer: { name: 'Dorje Sherpa', email: 'customer@store.com', phone: '+1 (555) 123-4567' },
        shippingAddress: { street: '742 Evergreen Terrace', city: 'Springfield', state: 'OR', zipCode: '97477', country: 'USA' },
        items: [
          {
            product: insertedProducts[0]._id,
            name: insertedProducts[0].name,
            price: 199.99,
            quantity: 1,
            image: insertedProducts[0].images[0],
            seller: insertedProducts[0].seller,
          },
          {
            product: insertedProducts[4]._id,
            name: insertedProducts[4].name,
            price: 99.00,
            quantity: 1,
            image: insertedProducts[4].images[0],
            seller: insertedProducts[4].seller,
          },
        ],
        paymentMethod: 'credit_card',
        paymentStatus: 'paid',
        orderStatus: 'delivered',
        subtotal: 298.99,
        taxAmount: 23.92,
        shippingAmount: 0.0,
        totalAmount: 322.91,
        trackingNumber: 'TRK-US-9812401',
        createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
      },
      {
        orderNumber: 'ORD-8921-102',
        user: customerDocs[1]._id,
        customer: { name: 'Sophia Taylor', email: 'sophia.taylor@example.com', phone: '+1 (555) 234-5678' },
        shippingAddress: { street: '388 Market Street', city: 'San Francisco', state: 'CA', zipCode: '94105', country: 'USA' },
        items: [
          {
            product: insertedProducts[1]._id,
            name: insertedProducts[1].name,
            price: 139.00,
            quantity: 1,
            image: insertedProducts[1].images[0],
            seller: insertedProducts[1].seller,
          },
        ],
        paymentMethod: 'paypal',
        paymentStatus: 'paid',
        orderStatus: 'delivered',
        subtotal: 139.00,
        taxAmount: 11.12,
        shippingAmount: 15.0,
        totalAmount: 165.12,
        trackingNumber: 'TRK-FD-3829104',
        createdAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000),
      },
      {
        orderNumber: 'ORD-8921-103',
        user: customerDocs[2]._id,
        customer: { name: 'Liam Johnson', email: 'liam.johnson@example.com', phone: '+1 (555) 345-6789' },
        shippingAddress: { street: '55 Ocean Avenue', city: 'Santa Monica', state: 'CA', zipCode: '90401', country: 'USA' },
        items: [
          {
            product: insertedProducts[2]._id,
            name: insertedProducts[2].name,
            price: 299.99,
            quantity: 1,
            image: insertedProducts[2].images[0],
            seller: insertedProducts[2].seller,
          },
        ],
        paymentMethod: 'credit_card',
        paymentStatus: 'paid',
        orderStatus: 'shipped',
        subtotal: 299.99,
        taxAmount: 27.00,
        shippingAmount: 0.0,
        totalAmount: 326.99,
        trackingNumber: 'TRK-UPS-8812903',
        createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      },
      {
        orderNumber: 'ORD-8921-104',
        user: customerDocs[3]._id,
        customer: { name: 'Olivia Brown', email: 'olivia.brown@example.com', phone: '+1 (555) 456-7890' },
        shippingAddress: { street: '402 Highline St', city: 'Seattle', state: 'WA', zipCode: '98101', country: 'USA' },
        items: [
          {
            product: insertedProducts[3]._id,
            name: insertedProducts[3].name,
            price: 389.00,
            quantity: 1,
            image: insertedProducts[3].images[0],
            seller: insertedProducts[3].seller,
          },
          {
            product: insertedProducts[6]._id,
            name: insertedProducts[6].name,
            price: 75.00,
            quantity: 2,
            image: insertedProducts[6].images[0],
            seller: insertedProducts[6].seller,
          },
        ],
        paymentMethod: 'stripe',
        paymentStatus: 'paid',
        orderStatus: 'processing',
        subtotal: 539.00,
        taxAmount: 43.12,
        shippingAmount: 0.0,
        totalAmount: 582.12,
        trackingNumber: '',
        createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
      },
      {
        orderNumber: 'ORD-8921-105',
        user: customerDocs[4]._id,
        customer: { name: 'Ethan Davis', email: 'ethan.davis@example.com', phone: '+1 (555) 567-8901' },
        shippingAddress: { street: '88 Grand Central Way', city: 'Austin', state: 'TX', zipCode: '78701', country: 'USA' },
        items: [
          {
            product: insertedProducts[9]._id,
            name: insertedProducts[9].name,
            price: 799.00,
            quantity: 1,
            image: insertedProducts[9].images[0],
            seller: insertedProducts[9].seller,
          },
        ],
        paymentMethod: 'credit_card',
        paymentStatus: 'pending',
        orderStatus: 'pending',
        subtotal: 799.00,
        taxAmount: 65.92,
        shippingAmount: 0.0,
        totalAmount: 864.92,
        trackingNumber: '',
        createdAt: new Date(),
      },
      {
        orderNumber: 'ORD-8921-106',
        user: customerDocs[5]._id,
        customer: { name: 'Ava Wilson', email: 'ava.wilson@example.com', phone: '+1 (555) 678-9012' },
        shippingAddress: { street: '210 Beacon Hill', city: 'Boston', state: 'MA', zipCode: '02108', country: 'USA' },
        items: [
          {
            product: insertedProducts[7]._id,
            name: insertedProducts[7].name,
            price: 115.00,
            quantity: 1,
            image: insertedProducts[7].images[0],
            seller: insertedProducts[7].seller,
          },
          {
            product: insertedProducts[5]._id,
            name: insertedProducts[5].name,
            price: 78.00,
            quantity: 1,
            image: insertedProducts[5].images[0],
            seller: insertedProducts[5].seller,
          },
        ],
        paymentMethod: 'credit_card',
        paymentStatus: 'paid',
        orderStatus: 'delivered',
        subtotal: 193.00,
        taxAmount: 15.44,
        shippingAmount: 0.0,
        totalAmount: 208.44,
        trackingNumber: 'TRK-US-4820194',
        createdAt: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000),
      },
    ];

    await Order.insertMany(dummyOrders);

    // 9. Seed Promotional Discounts
    console.log('Seeding Promotional Discounts...');
    const now = new Date();
    const in60Days = new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000);
    const in90Days = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000);
    const defaultDiscounts = [
      {
        code: 'HIMALAYA20',
        description: 'Storewide launch special - 20% off all orders over $50',
        type: 'percentage',
        value: 20,
        minPurchaseAmount: 50,
        maxDiscountAmount: 100,
        startDate: now,
        endDate: in60Days,
        usageLimit: 500,
        usedCount: 42,
        isActive: true,
      },
      {
        code: 'FESTIVE15',
        description: 'Festive season discount - $15 flat rebate on purchases $100+',
        type: 'fixed_amount',
        value: 15,
        minPurchaseAmount: 100,
        startDate: now,
        endDate: in90Days,
        usageLimit: 250,
        usedCount: 18,
        isActive: true,
      },
      {
        code: 'WELCOME10',
        description: 'New shopper greeting voucher - 10% off your entire first cart',
        type: 'percentage',
        value: 10,
        minPurchaseAmount: 20,
        maxDiscountAmount: 40,
        startDate: now,
        endDate: in90Days,
        usageLimit: 1000,
        usedCount: 112,
        isActive: true,
      },
      {
        code: 'SUPERSALE25',
        description: 'Premium member weekend flash event - 25% discount',
        type: 'percentage',
        value: 25,
        minPurchaseAmount: 150,
        maxDiscountAmount: 150,
        startDate: now,
        endDate: in60Days,
        usageLimit: 100,
        usedCount: 88,
        isActive: true,
      },
      {
        code: 'VIPBONUS25',
        description: 'Exclusive VIP loyalty gift - $25 direct price slash on $120+ cart',
        type: 'fixed_amount',
        value: 25,
        minPurchaseAmount: 120,
        startDate: now,
        endDate: in90Days,
        usageLimit: 150,
        usedCount: 35,
        isActive: true,
      },
    ];
    await Discount.insertMany(defaultDiscounts);

    console.log('Seeding completed successfully with Roles, Permissions, and Dynamic Menus!');
    console.log(`- Permissions: ${permissionsData.length}`);
    console.log(`- Roles: ${rolesData.length} (Customer, Seller, Admin)`);
    console.log(`- Menus: ${menusData.length}`);
    console.log(`- Admin:    admin@store.com / admin123`);
    console.log(`- Seller 1: seller@store.com / seller123`);
    console.log(`- Customer: customer@store.com / customer123`);

    process.exit(0);
  } catch (error) {
    console.error('Seeding error:', error);
    process.exit(1);
  }
}

seedData();
