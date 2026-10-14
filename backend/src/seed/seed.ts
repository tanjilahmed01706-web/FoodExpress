/**
 * FoodExpress bootstrap seed.
 * Idempotent: safe to run on every boot. Creates RBAC roles + permissions,
 * demo accounts for every panel, and a realistic sample catalogue so every
 * panel has data on first run.
 */
const q = (uid: string) => strapi.db.query(uid as any) as any;

// bcryptjs ships no types; U&P itself uses it for password hashing.
// eslint-disable-next-line @typescript-eslint/no-require-imports
const bcrypt: { hash: (value: string, rounds: number) => Promise<string> } = require('bcryptjs');

const slugify = (s: string) =>
  String(s)
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');

const days = [
  { day: 'Sunday', open: '10:00', close: '22:30', closed: false },
  { day: 'Monday', open: '10:00', close: '22:30', closed: false },
  { day: 'Tuesday', open: '10:00', close: '22:30', closed: false },
  { day: 'Wednesday', open: '10:00', close: '22:30', closed: false },
  { day: 'Thursday', open: '10:00', close: '22:30', closed: false },
  { day: 'Friday', open: '14:00', close: '23:00', closed: false },
  { day: 'Saturday', open: '10:00', close: '23:00', closed: false },
];

// ---------------------------------------------------------------------------
// Permissions
// ---------------------------------------------------------------------------
const READ_APIS = ['cuisine', 'zone', 'restaurant', 'menu-category', 'menu-item', 'banner', 'page', 'review'];

const scope = (api: string, action: string) => `api::${api}.${api}.${action}`;

const PUBLIC_ACTIONS = [
  ...READ_APIS.map((a) => scope(a, 'find')),
  ...READ_APIS.map((a) => scope(a, 'findOne')),
  scope('app-setting', 'find'),
];

const CUSTOMER_ACTIONS = [
  ...PUBLIC_ACTIONS,
  scope('order', 'find'),
  scope('order', 'findOne'),
  scope('order', 'create'),
  scope('order', 'stats'),
  scope('order', 'changeStatus'),
  ...['find', 'findOne', 'create', 'update', 'delete'].map((a) => scope('address', a)),
  ...['create', 'update', 'delete'].map((a) => scope('review', a)),
  scope('coupon', 'validate'),
  ...['find', 'findOne', 'update', 'delete'].map((a) => scope('notification', a)),
  ...['find', 'findOne', 'create', 'update', 'delete'].map((a) => scope('ticket', a)),
  'plugin::upload.upload',
];

const RESTAURANT_ACTIONS = [
  ...['find', 'findOne', 'create', 'update'].map((a) => scope('restaurant', a)),
  ...['find', 'findOne', 'create', 'update', 'delete'].map((a) => scope('menu-category', a)),
  ...['find', 'findOne', 'create', 'update', 'delete'].map((a) => scope('menu-item', a)),
  scope('order', 'find'),
  scope('order', 'findOne'),
  scope('order', 'stats'),
  scope('order', 'changeStatus'),
  scope('review', 'find'),
  scope('review', 'findOne'),
  scope('cuisine', 'find'),
  scope('cuisine', 'findOne'),
  scope('app-setting', 'find'),
  ...['find', 'findOne', 'update', 'delete'].map((a) => scope('notification', a)),
  'plugin::upload.upload',
];

const RIDER_ACTIONS = [
  ...['find', 'findOne', 'create', 'update'].map((a) => scope('rider', a)),
  scope('order', 'find'),
  scope('order', 'findOne'),
  scope('order', 'stats'),
  scope('order', 'changeStatus'),
  scope('app-setting', 'find'),
  ...['find', 'findOne', 'update', 'delete'].map((a) => scope('notification', a)),
];

const ADMIN_ACTIONS = [
  ...['cuisine', 'zone', 'restaurant', 'menu-category', 'menu-item', 'order', 'rider', 'address', 'review', 'coupon', 'banner', 'page', 'notification', 'ticket'].flatMap((api) =>
    ['find', 'findOne', 'create', 'update', 'delete'].map((a) => scope(api, a)),
  ),
  scope('order', 'changeStatus'),
  scope('order', 'stats'),
  scope('coupon', 'validate'),
  scope('app-setting', 'find'),
  scope('app-setting', 'update'),
  'plugin::upload.upload',
  'plugin::users-permissions.user.find',
  'plugin::users-permissions.user.findOne',
  'plugin::users-permissions.user.create',
  'plugin::users-permissions.user.update',
  'plugin::users-permissions.user.delete',
];

const ensureRole = async (type: string, name: string) => {
  let role = await q('plugin::users-permissions.role').findOne({ where: { type } });
  if (!role) role = await q('plugin::users-permissions.role').create({ data: { type, name } });
  return role;
};

const ensurePermissions = async (role: any, actions: string[]) => {
  for (const action of actions) {
    const existing = await q('plugin::users-permissions.permission').findOne({
      where: { role: role.id, action },
    });
    if (!existing) {
      await q('plugin::users-permissions.permission').create({ data: { action, role: role.id } });
    }
  }
};

const syncRolesAndPermissions = async () => {
  const publicRole = await q('plugin::users-permissions.role').findOne({ where: { type: 'public' } });
  const authenticated = await q('plugin::users-permissions.role').findOne({ where: { type: 'authenticated' } });
  const adminRole = await ensureRole('admin', 'Admin');
  const customerRole = await ensureRole('customer', 'Customer');
  const restaurantRole = await ensureRole('restaurant', 'Restaurant Partner');
  const riderRole = await ensureRole('rider', 'Rider');

  await ensurePermissions(publicRole, PUBLIC_ACTIONS);
  if (authenticated) await ensurePermissions(authenticated, CUSTOMER_ACTIONS);
  await ensurePermissions(customerRole, CUSTOMER_ACTIONS);
  await ensurePermissions(restaurantRole, RESTAURANT_ACTIONS);
  await ensurePermissions(riderRole, RIDER_ACTIONS);
  await ensurePermissions(adminRole, ADMIN_ACTIONS);

  // New registrations become Customer accounts by default.
  const pluginStore = strapi.store({ type: 'plugin', name: 'users-permissions' });
  const advanced = (await pluginStore.get({ key: 'advanced' })) || {};
  await pluginStore.set({ key: 'advanced', value: { ...advanced, default_role: 'customer' } });

  return { adminRole, customerRole, restaurantRole, riderRole };
};

// ---------------------------------------------------------------------------
// Demo users
// ---------------------------------------------------------------------------
const upsertUser = async (data: any, roleRow: any) => {
  const existing = await q('plugin::users-permissions.user').findOne({ where: { username: data.username } });
  if (existing) return existing;
  const created = await q('plugin::users-permissions.user').create({
    data: {
      username: data.username,
      email: data.email,
      password: await bcrypt.hash(data.password, 10),
      provider: 'local',
    },
  });
  return q('plugin::users-permissions.user').update({
    where: { id: created.id },
    data: {
      confirmed: true,
      blocked: false,
      role: roleRow.id,
      panelRole: data.panelRole,
      firstName: data.firstName,
      lastName: data.lastName,
      phone: data.phone,
    },
  });
};

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
export default async () => {
  strapi.log.info('FoodExpress seed: syncing roles & permissions…');
  const roles = await syncRolesAndPermissions();

  // --- demo accounts -------------------------------------------------------
  const admin = await upsertUser(
    { username: 'admin', email: 'admin@foodexpress.com', password: 'Admin@123', panelRole: 'admin', firstName: 'Ayesha', lastName: 'Rahman', phone: '+8801711-000001' },
    roles.adminRole,
  );
  const partner = await upsertUser(
    { username: 'partner', email: 'partner@foodexpress.com', password: 'Partner@123', panelRole: 'restaurant', firstName: 'Tanvir', lastName: 'Hossain', phone: '+8801711-000002' },
    roles.restaurantRole,
  );
  const rider = await upsertUser(
    { username: 'rider', email: 'rider@foodexpress.com', password: 'Rider@123', panelRole: 'rider', firstName: 'Mizanur', lastName: 'Rahman', phone: '+8801711-000003' },
    roles.riderRole,
  );
  const customer = await upsertUser(
    { username: 'customer', email: 'customer@foodexpress.com', password: 'Customer@123', panelRole: 'customer', firstName: 'Nusrat', lastName: 'Jahan', phone: '+8801711-000004' },
    roles.customerRole,
  );

  // --- cuisines ------------------------------------------------------------
  const cuisineDefs: any[] = [
    { name: 'Bangladeshi', icon: '🍛', description: 'Traditional Bangladeshi flavour' },
    { name: 'Fast Food', icon: '🍔', description: 'Burgers, fries and more' },
    { name: 'Pizza', icon: '🍕', description: 'Hot & cheesy slices' },
    { name: 'Biryani', icon: '🍚', description: 'Aromatic rice classics' },
    { name: 'Chinese', icon: '🥡', description: 'Desi-Chinese favourites' },
    { name: 'Desserts', icon: '🍰', description: 'Sweet endings' },
    { name: 'Coffee & Tea', icon: '☕', description: 'Freshly brewed' },
    { name: 'Healthy', icon: '🥗', description: 'Light & wholesome' },
    { name: 'BBQ', icon: '🍢', description: 'Smoky grills' },
    { name: 'Seafood', icon: '🐟', description: 'Fresh from the water' },
  ];
  const cuisines: Record<string, any> = {};
  for (let i = 0; i < cuisineDefs.length; i++) {
    const def = cuisineDefs[i];
    let row = await q('api::cuisine.cuisine').findOne({ where: { slug: slugify(def.name) } });
    if (!row) row = await q('api::cuisine.cuisine').create({ data: { ...def, slug: slugify(def.name), sortOrder: i } });
    cuisines[def.name] = row;
  }

  // --- zones ---------------------------------------------------------------
  const zoneDefs = [
    {
      name: 'Brahmanbaria City',
      city: 'Brahmanbaria',
      color: '#D70F64',
      deliveryFee: 35,
      minOrder: 150,
      centerLat: 23.957,
      centerLng: 90.725,
      polygon: [
        [23.938, 90.704],
        [23.936, 90.739],
        [23.951, 90.748],
        [23.972, 90.74],
        [23.975, 90.712],
        [23.958, 90.699],
      ],
    },
    {
      name: 'Ashuganj & Industrial Area',
      city: 'Brahmanbaria',
      color: '#FF2B85',
      deliveryFee: 55,
      minOrder: 250,
      centerLat: 23.985,
      centerLng: 90.805,
      polygon: [
        [23.965, 90.78],
        [23.964, 90.83],
        [23.995, 90.845],
        [24.01, 90.8],
        [23.99, 90.775],
      ],
    },
  ];
  const zones: any[] = [];
  for (const def of zoneDefs) {
    let row = await q('api::zone.zone').findOne({ where: { name: def.name } });
    if (!row) row = await q('api::zone.zone').create({ data: { ...def, isActive: true } });
    zones.push(row);
  }

  // --- rider profiles ------------------------------------------------------
  const riderProfile = (await q('api::rider.rider').findOne({ where: { user: { id: rider.id } } })) ||
    (await q('api::rider.rider').create({
      data: {
        name: `${rider.firstName} ${rider.lastName}`,
        phone: rider.phone,
        vehicleType: 'motorbike',
        isAvailable: true,
        isApproved: true,
        currentLat: 23.957,
        currentLng: 90.725,
        rating: 4.8,
        ratingCount: 126,
        totalDeliveries: 214,
        totalEarnings: 18600,
        zone: zones[0]?.id,
        user: rider.id,
      },
    }));

  // --- restaurants ---------------------------------------------------------
  const restaurantDefs = [
    {
      name: 'Kacchi Bhai',
      tagline: 'Biryani lovers unite',
      description:
        'Slow-cooked kacchi biryani with tender mutton, fragrant chinigura rice and their signature borhani — a Brahmanbaria legend since 2015.',
      phone: '+880 1712-345678',
      email: 'hello@kacchibhai.com',
      address: 'Tilpahar, Brahmanbaria Sadar',
      lat: 23.9585,
      lng: 90.7235,
      deliveryTimeMin: 30,
      deliveryTimeMax: 45,
      deliveryFee: 35,
      minOrder: 200,
      isFeatured: true,
      rating: 4.7,
      ratingCount: 1284,
      cuisineNames: ['Biryani', 'Bangladeshi', 'BBQ'],
      ownerUser: partner,
    },
    {
      name: 'Pizza Piazza',
      tagline: 'Wood-fired happiness',
      description: 'Hand-stretched pizzas baked in a wood-fired oven, with pasta, garlic bread and coolers.',
      phone: '+880 1713-456789',
      email: 'orders@pizzapiazza.com',
      address: 'Medical College Road, Brahmanbaria',
      lat: 23.9625,
      lng: 90.7185,
      deliveryTimeMin: 25,
      deliveryTimeMax: 40,
      deliveryFee: 40,
      minOrder: 250,
      isFeatured: true,
      rating: 4.5,
      ratingCount: 863,
      cuisineNames: ['Pizza', 'Fast Food', 'Desserts'],
      ownerUser: null,
    },
    {
      name: 'Burger Barn BD',
      tagline: 'Smashed. Stacked. Devoured.',
      description: 'Smashed beef burgers, loaded fries and thick shakes made fresh to order.',
      phone: '+880 1714-567890',
      email: 'hi@burgerbarn.bd',
      address: 'Station Road, Brahmanbaria',
      lat: 23.9545,
      lng: 90.7295,
      deliveryTimeMin: 20,
      deliveryTimeMax: 35,
      deliveryFee: 30,
      minOrder: 150,
      isFeatured: false,
      rating: 4.4,
      ratingCount: 512,
      cuisineNames: ['Fast Food', 'Healthy'],
      ownerUser: null,
    },
    {
      name: 'Wok & Roll',
      tagline: 'Desi-Chinese done right',
      description: 'Sizzling hakka noodles, chilli chicken and fried rice wok-tossed to order.',
      phone: '+880 1715-678901',
      email: 'wok@wokandroll.com',
      address: 'Ranir Bazar, Brahmanbaria',
      lat: 23.9515,
      lng: 90.7155,
      deliveryTimeMin: 30,
      deliveryTimeMax: 50,
      deliveryFee: 45,
      minOrder: 200,
      isFeatured: false,
      rating: 4.3,
      ratingCount: 349,
      cuisineNames: ['Chinese', 'Seafood'],
      ownerUser: null,
    },
    {
      name: 'Sweet Bengal',
      tagline: 'Every day deserves dessert',
      description: 'Cakes, rasmalai, doi and Bengali sweets freshly made every morning.',
      phone: '+880 1716-789012',
      email: 'sweet@sweetbengal.com',
      address: 'Chand Mia Sarak, Brahmanbaria',
      lat: 23.9645,
      lng: 90.7305,
      deliveryTimeMin: 15,
      deliveryTimeMax: 30,
      deliveryFee: 25,
      minOrder: 100,
      isFeatured: false,
      rating: 4.8,
      ratingCount: 726,
      cuisineNames: ['Desserts', 'Coffee & Tea'],
      ownerUser: null,
    },
  ];

  const restaurants: any[] = [];
  for (let i = 0; i < restaurantDefs.length; i++) {
    const def = restaurantDefs[i];
    let row = await q('api::restaurant.restaurant').findOne({ where: { slug: slugify(def.name) } });
    if (!row) {
      const { cuisineNames, ownerUser, ...rest } = def;
      row = await q('api::restaurant.restaurant').create({
        data: {
          ...rest,
          slug: slugify(def.name),
          isOpen: true,
          isApproved: true,
          commissionRate: 15,
          openingHours: days,
          city: 'Brahmanbaria',
          cuisines: cuisineNames.map((n: string) => cuisines[n].id),
          owner: ownerUser ? ownerUser.id : null,
          zone: i < 3 ? zones[0]?.id : zones[1]?.id,
        },
      });
    }
    restaurants.push(row);
  }

  // --- menus ---------------------------------------------------------------
  const menuDefs: Record<string, any[]> = {
    'Kacchi Bhai': [
      {
        name: 'Signature Kacchi',
        items: [
          { name: 'Mutton Kacchi Biryani (Full)', description: 'Slow-cooked mutton kacchi with borhani', price: 380, isSpicy: true },
          { name: 'Mutton Kacchi Biryani (Half)', description: 'Half plate of the classic', price: 220, isSpicy: true },
          { name: 'Chicken Roast', description: 'Golden fried chicken roast', price: 120 },
          { name: 'Borhani', description: 'Spiced yogurt drink', price: 60, isVegetarian: true },
        ],
      },
      {
        name: 'Grill & BBQ',
        items: [
          { name: 'Beef Kebab (4 pcs)', description: 'Charcoal grilled beef kebabs', price: 180, isSpicy: true },
          { name: 'Chicken Tikka', description: 'Marinated chicken thigh tikka', price: 150, isSpicy: true },
          { name: 'Mixed Grill Platter', description: 'Kebab, tikka & roast combo', price: 320 },
        ],
      },
      {
        name: 'Drinks & Sides',
        items: [
          { name: 'Plain Rice', description: 'Steamed chinigura rice', price: 40, isVegetarian: true },
          { name: 'Salad', description: 'Fresh garden salad', price: 30, isVegetarian: true },
          { name: 'Mineral Water', description: '500ml bottle', price: 20, isVegetarian: true },
        ],
      },
    ],
    'Pizza Piazza': [
      {
        name: 'Wood-Fired Pizza',
        items: [
          { name: 'Margherita', description: 'San Marzano tomato, mozzarella, basil', price: 420, isVegetarian: true },
          { name: 'Pepperoni Feast', description: 'Loaded with beef pepperoni', price: 520, isSpicy: true },
          { name: 'BBQ Chicken Pizza', description: 'Smoky BBQ chicken & onion', price: 490 },
          { name: 'Four Cheese', description: 'Mozzarella, cheddar, parmesan, blue', price: 540, isVegetarian: true },
        ],
      },
      {
        name: 'Pasta',
        items: [
          { name: 'Chicken Alfredo', description: 'Creamy alfredo pasta', price: 360 },
          { name: 'Arrabbiata', description: 'Spicy tomato pasta', price: 300, isVegetarian: true, isSpicy: true },
        ],
      },
      {
        name: 'Sides & Coolers',
        items: [
          { name: 'Garlic Bread', description: 'With cheesy dip', price: 180, isVegetarian: true },
          { name: 'Loaded Fries', description: 'Cheese, jalapeño & sauces', price: 220, isVegetarian: true, isSpicy: true },
          { name: 'Fresh Lime', description: 'Chilled fresh lime soda', price: 90, isVegetarian: true },
        ],
      },
    ],
    'Burger Barn BD': [
      {
        name: 'Smashed Burgers',
        items: [
          { name: 'Classic Smash', description: 'Double patty, cheddar, house sauce', price: 260 },
          { name: 'Spicy Jalapeño Smash', description: 'Jalapeños, pepper jack, chipotle mayo', price: 290, isSpicy: true },
          { name: 'Crispy Chicken Burger', description: 'Buttermilk fried chicken fillet', price: 240 },
        ],
      },
      {
        name: 'Loaded Fries',
        items: [
          { name: 'Cheese Fries', description: 'Molten cheddar sauce', price: 180, isVegetarian: true },
          { name: 'Peri Peri Fries', description: 'Dusted with peri peri', price: 160, isVegetarian: true, isSpicy: true },
        ],
      },
      {
        name: 'Shakes',
        items: [
          { name: 'Oreo Thick Shake', description: 'Blended cookies & cream', price: 200, isVegetarian: true },
          { name: 'Mango Thick Shake', description: 'Seasonal mango shake', price: 190, isVegetarian: true },
        ],
      },
    ],
    'Wok & Roll': [
      {
        name: 'Noodles & Rice',
        items: [
          { name: 'Chicken Hakka Noodles', description: 'Wok-tossed street style noodles', price: 220 },
          { name: 'Beef Chowmein', description: 'Loaded with beef strips', price: 260 },
          { name: 'Garlic Fried Rice', description: 'Aromatic garlic rice', price: 180, isVegetarian: true },
        ],
      },
      {
        name: 'Chinese Mains',
        items: [
          { name: 'Chilli Chicken (Dry)', description: 'Fiery dry chilli chicken', price: 280, isSpicy: true },
          { name: 'Chicken Manchurian', description: 'Sweet & tangy manchurian', price: 260 },
          { name: 'Garlic Prawn', description: 'Prawns in garlic butter sauce', price: 420 },
        ],
      },
      {
        name: 'Soups',
        items: [
          { name: 'Hot & Sour Soup', description: 'Classic spicy soup', price: 120, isSpicy: true },
          { name: 'Chicken Corn Soup', description: 'Comfort in a bowl', price: 110 },
        ],
      },
    ],
    'Sweet Bengal': [
      {
        name: ' Bengali Sweets',
        items: [
          { name: 'Rasmalai (2 pcs)', description: 'Soft malai in saffron milk', price: 120, isVegetarian: true },
          { name: 'Kadam Palli', description: 'Seasonal classic', price: 90, isVegetarian: true },
          { name: 'Mishti Doi', description: 'Caramelized baked yogurt', price: 80, isVegetarian: true },
        ],
      },
      {
        name: 'Cakes',
        items: [
          { name: 'Chocolate Fudge Slice', description: 'Rich chocolate fudge cake', price: 160, isVegetarian: true },
          { name: 'Red Velvet Slice', description: 'Cream cheese frosting', price: 180, isVegetarian: true },
        ],
      },
      {
        name: 'Hot Drinks',
        items: [
          { name: 'Milk Tea', description: 'Desi style milk tea', price: 30, isVegetarian: true },
          { name: 'Coffee', description: 'Freshly brewed coffee', price: 90, isVegetarian: true },
        ],
      },
    ],
  };

  for (const restaurant of restaurants) {
    const defs = menuDefs[restaurant.name] || [];
    const existingCount = await q('api::menu-category.menu-category').count({ where: { restaurant: { id: restaurant.id } } });
    if (existingCount > 0) continue;
    let order = 0;
    for (const catDef of defs) {
      const cat = await q('api::menu-category.menu-category').create({
        data: { name: catDef.name, sortOrder: order++, isAvailable: true, restaurant: restaurant.id },
      });
      for (const itemDef of catDef.items) {
        await q('api::menu-item.menu-item').create({
          data: {
            ...itemDef,
            isAvailable: true,
            prepTime: 10,
            restaurant: restaurant.id,
            category: cat.id,
          },
        });
      }
    }
  }

  // --- banners -------------------------------------------------------------
  if ((await q('api::banner.banner').count()) === 0) {
    await q('api::banner.banner').create({
      data: {
        title: 'Free delivery on your first order',
        subtitle: 'Use code WELCOME10 and save 10% today',
        link: '/',
        colorFrom: '#D70F64',
        colorTo: '#FF2B85',
        isActive: true,
        sortOrder: 0,
      },
    });
    await q('api::banner.banner').create({
      data: {
        title: 'Kacchi Friday is here',
        subtitle: 'Kacchi Bhai’s signature mutton kacchi — hot & fresh',
        link: '/r/' + slugify('Kacchi Bhai'),
        colorFrom: '#7A1FA2',
        colorTo: '#D70F64',
        isActive: true,
        sortOrder: 1,
      },
    });
    await q('api::banner.banner').create({
      data: {
        title: 'Sweet treats, sweet prices',
        subtitle: 'Desserts from ৳80 at Sweet Bengal',
        link: '/r/' + slugify('Sweet Bengal'),
        colorFrom: '#FF8A00',
        colorTo: '#FF2B85',
        isActive: true,
        sortOrder: 2,
      },
    });
  }

  // --- coupons -------------------------------------------------------------
  if ((await q('api::coupon.coupon').count()) === 0) {
    await q('api::coupon.coupon').create({
      data: { code: 'WELCOME10', title: 'Welcome offer', description: '10% off your first order (max ৳80)', type: 'percent', value: 10, minOrder: 300, maxDiscount: 80, usageLimit: 0, usedCount: 0, isActive: true },
    });
    await q('api::coupon.coupon').create({
      data: { code: 'FEAST20', title: 'Feast offer', description: '20% off orders above ৳800 (max ৳150)', type: 'percent', value: 20, minOrder: 800, maxDiscount: 150, usageLimit: 0, usedCount: 0, isActive: true },
    });
    await q('api::coupon.coupon').create({
      data: { code: 'FREEDDEL', title: 'Free delivery', description: 'Free delivery on orders above ৳250', type: 'fixed', value: 40, minOrder: 250, maxDiscount: 40, usageLimit: 0, usedCount: 0, isActive: true },
    });
  }

  // --- reviews -------------------------------------------------------------
  if ((await q('api::review.review').count()) === 0) {
    const reviews = [
      { r: 0, rating: 5, comment: 'The mutton kacchi is unreal — meltingly tender and perfectly spiced. Delivery was fast too!' },
      { r: 0, rating: 4, comment: 'Great portion size. Borhani could be colder, otherwise perfect.' },
      { r: 1, rating: 5, comment: 'Crust was crisp, toppings generous. Best pizza in town.' },
      { r: 1, rating: 4, comment: 'Loved the garlic bread. Pasta was a touch salty for me.' },
      { r: 2, rating: 5, comment: 'Smash burger is juicy and the fries are addictive.' },
      { r: 3, rating: 4, comment: 'Chilli chicken had a proper kick. Will order again.' },
      { r: 4, rating: 5, comment: 'Rasmalai was fresh and light. Arrived chilled.' },
    ];
    for (const rv of reviews) {
      await q('api::review.review').create({
        data: {
          rating: rv.rating,
          comment: rv.comment,
          isApproved: true,
          restaurant: restaurants[rv.r].id,
          user: customer.id,
        },
      });
    }
  }

  // --- app settings singleton ---------------------------------------------
  const settingsRows = await q('api::app-setting.app-setting').findMany();
  if (settingsRows.length === 0) {
    await q('api::app-setting.app-setting').create({
      data: {
        siteName: 'FoodExpress',
        tagline: 'Fast • Fresh • For You',
        primaryColor: '#D70F64',
        accentColor: '#FF2B85',
        currency: 'BDT',
        currencySymbol: '৳',
        announcement: '🎉 Free delivery on orders above ৳500 — this week only!',
        heroTitle: 'What are you craving today?',
        heroSubtitle: 'Order food from the best restaurants in Brahmanbaria',
        contactEmail: 'hello@foodexpress.com',
        contactPhone: '+880 1700-000000',
        addressLine: 'Brahmanbaria, Bangladesh',
        defaultDeliveryFee: 40,
        freeDeliveryThreshold: 500,
        taxRate: 5,
        commissionRate: 15,
        footerText: 'FoodExpress — Fast • Fresh • For You. Made with 💗 in Brahmanbaria.',
        socials: { facebook: 'https://facebook.com', instagram: 'https://instagram.com', youtube: 'https://youtube.com' },
      },
    });
  }

  // --- CMS pages (block layouts) ------------------------------------------
  const pageDefs: any[] = [
    {
      title: 'Home',
      slug: 'home',
      isPublished: true,
      seoTitle: 'FoodExpress — Order food online in Brahmanbaria',
      seoDescription: 'Fast, fresh food delivery from the best restaurants near you.',
      layout: [
        { id: 'b1', type: 'hero', props: { title: 'What are you craving today?', subtitle: 'Order from the best restaurants in Brahmanbaria — delivered hot & fast.', ctaText: 'Order now', ctaLink: '#restaurants' } },
        { id: 'b2', type: 'banners', props: { title: 'Today’s deals' } },
        { id: 'b3', type: 'categories', props: { title: 'Explore by cuisine', limit: 10 } },
        { id: 'b4', type: 'featured', props: { title: 'Featured restaurants', limit: 6 } },
        { id: 'b5', type: 'restaurants', props: { title: 'All restaurants', showFilters: true } },
        { id: 'b6', type: 'features', props: { title: 'Why FoodExpress?', items: [
          { icon: '⚡', title: 'Lightning fast', text: 'Average delivery in 30 minutes across the city.' },
          { icon: '🥗', title: 'Freshly made', text: 'Every order is cooked after you place it.' },
          { icon: '🛵', title: 'Live tracking', text: 'Follow your rider on the map in real time.' },
          { icon: '💳', title: 'Easy payments', text: 'Cash on delivery or card — your choice.' },
        ] } },
        { id: 'b7', type: 'how-it-works', props: { title: 'How it works', steps: [
          { icon: '🔎', title: 'Explore', text: 'Browse restaurants and cuisines near you.' },
          { icon: '🛒', title: 'Order', text: 'Add dishes to your cart and check out in seconds.' },
          { icon: '🛵', title: 'Track', text: 'Watch your rider approach on the live map.' },
        ] } },
        { id: 'b8', type: 'map', props: { title: 'We deliver across Brahmanbaria', subtitle: 'Hover a zone to see delivery fee and minimum order.' } },
        { id: 'b9', type: 'cta', props: { title: 'Ready to eat?', subtitle: 'Your next favourite meal is a few taps away.', buttonText: 'Start ordering', buttonLink: '#restaurants' } },
      ],
    },
    { title: 'About Us', slug: 'about', isPublished: true, layout: [
      { id: 'a1', type: 'hero', props: { title: 'About FoodExpress', subtitle: 'Fast • Fresh • For You — since day one.', ctaText: '', ctaLink: '' } },
      { id: 'a2', type: 'text', props: { title: 'Our story', body: 'FoodExpress is a multi-tenant food delivery platform built for local restaurants, riders and food lovers. Restaurants manage their own stores, riders pick up and deliver, and customers track everything live — all powered by one platform.' } },
      { id: 'a3', type: 'features', props: { title: 'What we stand for', items: [
        { icon: '🤝', title: 'Fair for partners', text: 'Transparent commissions and instant order notifications.' },
        { icon: '🛵', title: 'Rider first', text: 'Fair earnings, flexible hours and route support.' },
        { icon: '💗', title: 'Customer obsessed', text: 'Live tracking, responsive support and quality checks.' },
      ] } },
    ] },
    { title: 'FAQ', slug: 'faq', isPublished: true, layout: [
      { id: 'f1', type: 'hero', props: { title: 'Frequently asked questions', subtitle: 'Everything you need to know about ordering with FoodExpress.', ctaText: '', ctaLink: '' } },
      { id: 'f2', type: 'faq', props: { title: 'Common questions', items: [
        { q: 'How do I track my order?', a: 'Open the Orders tab after checkout — you will see a live map with your rider and a status timeline.' },
        { q: 'What payment methods are supported?', a: 'Cash on delivery and card (demo). No hidden charges, ever.' },
        { q: 'How do I become a restaurant partner?', a: 'Register with a Restaurant account from the Partner page, add your store, and our team will approve it.' },
        { q: 'How do I become a rider?', a: 'Register with a Rider account, create your profile, and get approved by the admin.' },
      ] } },
    ] },
    { title: 'Contact', slug: 'contact', isPublished: true, layout: [
      { id: 'c1', type: 'hero', props: { title: 'Contact us', subtitle: 'We usually reply within a few hours.', ctaText: '', ctaLink: '' } },
      { id: 'c2', type: 'map', props: { title: 'Our delivery zones', subtitle: 'We are live across Brahmanbaria city and Ashuganj.', ctaText: '', ctaLink: '' } },
      { id: 'c3', type: 'text', props: { title: 'Get in touch', body: 'Email: hello@foodexpress.com\nPhone: +880 1700-000000\nAddress: Brahmanbaria, Bangladesh\n\nFor order issues, open a support ticket from your account — it reaches our team instantly.' } },
    ] },
  ];
  for (const def of pageDefs) {
    const existing = await q('api::page.page').findOne({ where: { slug: def.slug } });
    if (!existing) await q('api::page.page').create({ data: def });
  }

  // --- sample orders -------------------------------------------------------
  if ((await q('api::order.order').count()) === 0) {
    const kacchi = restaurants[0];
    const pizza = restaurants[1];
    const burger = restaurants[2];
    const sweets = restaurants[4];
    const customer2 = await upsertUser(
      { username: 'customer2', email: 'customer2@foodexpress.com', password: 'Customer@123', panelRole: 'customer', firstName: 'Arif', lastName: 'Hossain', phone: '+8801711-000005' },
      roles.customerRole,
    );
    const rider2User = await upsertUser(
      { username: 'rider2', email: 'rider2@foodexpress.com', password: 'Rider@123', panelRole: 'rider', firstName: 'Shamim', lastName: 'Miah', phone: '+8801711-000006' },
      roles.riderRole,
    );
    const rider2 = (await q('api::rider.rider').findOne({ where: { user: { id: rider2User.id } } })) ||
      (await q('api::rider.rider').create({
        data: {
          name: `${rider2User.firstName} ${rider2User.lastName}`,
          phone: rider2User.phone,
          vehicleType: 'bicycle',
          isAvailable: false,
          isApproved: true,
          currentLat: 23.96,
          currentLng: 90.73,
          rating: 4.6,
          ratingCount: 58,
          totalDeliveries: 74,
          totalEarnings: 5900,
          zone: zones[0]?.id,
          user: rider2User.id,
        },
      }));

    const mkOrder = async (opts: any) => {
      const timeline = opts.timeline;
      const order = await q('api::order.order').create({
        data: {
          orderNumber: opts.orderNumber,
          customer: opts.customer.id,
          restaurant: opts.restaurant.id,
          rider: opts.rider ? opts.rider.id : null,
          items: opts.items,
          subtotal: opts.subtotal,
          deliveryFee: opts.deliveryFee,
          tax: opts.tax,
          discount: opts.discount || 0,
          total: opts.total,
          couponCode: opts.couponCode || null,
          paymentMethod: 'cod',
          paymentStatus: opts.status === 'delivered' ? 'paid' : 'pending',
          status: opts.status,
          deliveryAddress: opts.deliveryAddress,
          customerNote: opts.customerNote || '',
          cancelReason: null,
          timeline,
          riderEarning: opts.status === 'delivered' ? opts.deliveryFee : 0,
          placedAt: opts.placedAt,
          deliveredAt: opts.status === 'delivered' ? opts.deliveredAt : null,
        },
      });
      return order;
    };

    const addr = { label: 'Home', line: 'House 12, Road 3, Tilpahar, Brahmanbaria', lat: 23.9566, lng: 90.7225, note: 'Call on arrival' };
    const d1 = new Date(Date.now() - 26 * 3600 * 1000);
    await mkOrder({
      orderNumber: 'FE-SEED-0001',
      customer,
      restaurant: kacchi,
      rider: riderProfile,
      status: 'delivered',
      placedAt: d1.toISOString(),
      deliveredAt: new Date(d1.getTime() + 42 * 60000).toISOString(),
      items: [
        { menuItemId: null, name: 'Mutton Kacchi Biryani (Full)', price: 380, qty: 2, subtotal: 760, note: '' },
        { menuItemId: null, name: 'Borhani', price: 60, qty: 2, subtotal: 120, note: '' },
      ],
      subtotal: 880, deliveryFee: 35, tax: 44, total: 959,
      deliveryAddress: addr,
      timeline: [
        { status: 'pending', label: 'Order placed', at: d1.toISOString() },
        { status: 'confirmed', label: 'Restaurant confirmed', at: new Date(d1.getTime() + 3 * 60000).toISOString() },
        { status: 'preparing', label: 'Preparing your food', at: new Date(d1.getTime() + 6 * 60000).toISOString() },
        { status: 'ready', label: 'Ready for pickup', at: new Date(d1.getTime() + 25 * 60000).toISOString() },
        { status: 'picked_up', label: 'Picked up by rider', at: new Date(d1.getTime() + 28 * 60000).toISOString() },
        { status: 'on_the_way', label: 'On the way', at: new Date(d1.getTime() + 30 * 60000).toISOString() },
        { status: 'delivered', label: 'Delivered', at: new Date(d1.getTime() + 42 * 60000).toISOString() },
      ],
    });

    const d2 = new Date(Date.now() - 3 * 3600 * 1000);
    await mkOrder({
      orderNumber: 'FE-SEED-0002',
      customer: customer2,
      restaurant: pizza,
      rider: null,
      status: 'preparing',
      placedAt: d2.toISOString(),
      items: [
        { menuItemId: null, name: 'Pepperoni Feast', price: 520, qty: 1, subtotal: 520, note: 'Extra crispy please' },
        { menuItemId: null, name: 'Garlic Bread', price: 180, qty: 1, subtotal: 180, note: '' },
      ],
      subtotal: 700, deliveryFee: 40, tax: 35, total: 775,
      deliveryAddress: { ...addr, line: 'BRTC Colony, Brahmanbaria', lat: 23.9602, lng: 90.7312 },
      timeline: [
        { status: 'pending', label: 'Order placed', at: d2.toISOString() },
        { status: 'confirmed', label: 'Restaurant confirmed', at: new Date(d2.getTime() + 4 * 60000).toISOString() },
        { status: 'preparing', label: 'Preparing your food', at: new Date(d2.getTime() + 8 * 60000).toISOString() },
      ],
    });

    const d3 = new Date(Date.now() - 30 * 60000);
    await mkOrder({
      orderNumber: 'FE-SEED-0003',
      customer,
      restaurant: burger,
      rider: null,
      status: 'pending',
      placedAt: d3.toISOString(),
      items: [{ menuItemId: null, name: 'Classic Smash', price: 260, qty: 1, subtotal: 260, note: 'No onions' }],
      subtotal: 260, deliveryFee: 30, tax: 13, total: 303,
      deliveryAddress: addr,
      timeline: [{ status: 'pending', label: 'Order placed', at: d3.toISOString() }],
    });

    const d4 = new Date(Date.now() - 3 * 24 * 3600 * 1000);
    await mkOrder({
      orderNumber: 'FE-SEED-0004',
      customer: customer2,
      restaurant: sweets,
      rider: rider2,
      status: 'delivered',
      placedAt: d4.toISOString(),
      deliveredAt: new Date(d4.getTime() + 30 * 60000).toISOString(),
      items: [{ menuItemId: null, name: 'Rasmalai (2 pcs)', price: 120, qty: 2, subtotal: 240, note: '' }],
      subtotal: 240, deliveryFee: 25, tax: 12, total: 277,
      deliveryAddress: { ...addr, line: 'Kandirpar, Brahmanbaria' },
      timeline: [
        { status: 'pending', label: 'Order placed', at: d4.toISOString() },
        { status: 'confirmed', label: 'Restaurant confirmed', at: new Date(d4.getTime() + 3 * 60000).toISOString() },
        { status: 'preparing', label: 'Preparing your food', at: new Date(d4.getTime() + 5 * 60000).toISOString() },
        { status: 'ready', label: 'Ready for pickup', at: new Date(d4.getTime() + 20 * 60000).toISOString() },
        { status: 'picked_up', label: 'Picked up by rider', at: new Date(d4.getTime() + 22 * 60000).toISOString() },
        { status: 'on_the_way', label: 'On the way', at: new Date(d4.getTime() + 24 * 60000).toISOString() },
        { status: 'delivered', label: 'Delivered', at: new Date(d4.getTime() + 30 * 60000).toISOString() },
      ],
    });
  }

  // --- notifications & ticket ---------------------------------------------
  if ((await q('api::notification.notification').count()) === 0) {
    await q('api::notification.notification').create({
      data: { title: 'Welcome to FoodExpress 🎉', message: 'Order anything, anytime — delivered fast.', type: 'system', isRead: false, user: customer.id },
    });
    await q('api::notification.notification').create({
      data: { title: 'New order received', message: 'FE-SEED-0002 • 775', type: 'order', isRead: false, user: partner.id },
    });
  }
  if ((await q('api::ticket.ticket').count()) === 0) {
    await q('api::ticket.ticket').create({
      data: {
        subject: 'Where is my order FE-SEED-0003?',
        message: 'It has been 20 minutes and the restaurant has not confirmed yet. Could you please check?',
        type: 'order',
        status: 'open',
        replies: [],
        user: customer.id,
      },
    });
  }

  strapi.log.info('FoodExpress seed complete ✔');
};
