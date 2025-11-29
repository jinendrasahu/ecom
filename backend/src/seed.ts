import { DataSource } from 'typeorm';
import { Product } from './product/entities/product.entity';
import { User } from './auth/entities/user.entity';
import { Role } from './auth/entities/role.entity';
import { CartItem } from './cart/entities/cart-item.entity';
import { Order } from './order/entities/order.entity';
import { OrderItem } from './order/entities/order-item.entity';
import { DiscountCode } from './discount/entities/discount-code.entity';
import { Discount, DiscountType, DiscountConditionType } from './discount/entities/discount.entity';
import { UserDiscount } from './discount/entities/user-discount.entity';
import { Category } from './category/entities/category.entity';
import { Favorite } from './favorite/entities/favorite.entity';
import axios from 'axios';
import * as fs from 'fs';
import * as path from 'path';
import * as bcrypt from 'bcrypt';

const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT) || 5432,
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || '1234',
  database: process.env.DB_NAME || 'e-com',
  entities: [Product, User, Role, CartItem, Order, OrderItem, DiscountCode, Category, Discount, UserDiscount, Favorite],
  synchronize: true,
});

const products = [
  {
    name: 'Luxury Face Serum',
    description: 'Hydrating vitamin C serum for radiant, glowing skin. Perfect for daily use.',
    price: 49.99,
    stock: 50,
    categoryName: 'beauty', 
    imageSearch: 'face serum beauty product',
  },
  {
    name: 'Silk Lipstick - Rosewood',
    description: 'Long-lasting matte lipstick with creamy texture. Available in beautiful rosewood shade.',
    price: 24.99,
    stock: 30,
    categoryName: 'beauty',
    imageSearch: 'lipstick makeup',
  },
  {
    name: 'Anti-Aging Night Cream',
    description: 'Rich moisturizing cream with retinol and peptides. Wake up to smoother, younger-looking skin.',
    price: 79.99,
    stock: 25,
    categoryName: 'beauty',
    imageSearch: 'night cream skincare',
  },
  {
    name: 'Mascara - Volume Boost',
    description: 'Lengthening and volumizing mascara that gives you dramatic lashes without clumping.',
    price: 19.99,
    stock: 40,
    categoryName: 'beauty',
    imageSearch: 'mascara makeup',
  },
  {
    name: 'Hydrating Face Mask',
    description: 'Deeply hydrating sheet mask infused with hyaluronic acid and aloe vera.',
    price: 12.99,
    stock: 60,
    categoryName: 'beauty',
    imageSearch: 'face mask skincare',
  },
  {
    name: 'Eyeshadow Palette - Sunset',
    description: '12-shade eyeshadow palette with warm sunset tones. Highly pigmented and blendable.',
    price: 34.99,
    stock: 20,
    categoryName: 'beauty',
    imageSearch: 'eyeshadow palette makeup',
  },
  {
    name: 'Cleansing Oil',
    description: 'Gentle yet effective cleansing oil that removes makeup and impurities without stripping skin.',
    price: 29.99,
    stock: 35,
    categoryName: 'beauty',
    imageSearch: 'cleansing oil skincare',
  },
  {
    name: 'Highlighter - Golden Glow',
    description: 'Luminous highlighter that gives you a natural, sun-kissed glow.',
    price: 27.99,
    stock: 28,
    categoryName: 'beauty',
    imageSearch: 'highlighter makeup',
  },
  {
    name: 'WMX Rubber Zebra Sandal',
    description: 'Comfortable and stylish rubber sandals with unique zebra pattern. Perfect for casual wear.',
    price: 36.00,
    stock: 50,
    categoryName: 'shoes',
    imageSearch: 'sandal footwear',
  },
  {
    name: 'Super Skinny Jogger in Brown',
    description: 'Comfortable skinny jogger pants in brown. Perfect for active lifestyle and casual wear.',
    price: 89.00,
    stock: 30,
    categoryName: 'clothing',
    imageSearch: 'brown jogger pants',
  },
  {
    name: 'Classic White Sneakers',
    description: 'Timeless white sneakers that go with everything. Comfortable and durable.',
    price: 79.99,
    stock: 45,
    categoryName: 'shoes',
    imageSearch: 'white sneakers',
  },
  {
    name: 'Denim Jacket',
    description: 'Classic denim jacket with modern fit. Perfect for layering in any season.',
    price: 65.00,
    stock: 25,
    categoryName: 'clothing',
    imageSearch: 'denim jacket',
  },
];

// Dummy users data
const dummyUsers = [
  {
    name: 'Jinendra',
    email: 'jinendra@gmail.com',
    password: 'password123',
    role: 'customer',
  },
  {
    name: 'Admin User',
    email: 'admin@example.com',
    password: 'admin123',
    role: 'admin',
  }
];

// Download image from multiple providers (retries, content-type validation, fallbacks)
async function downloadImage(searchTerm: string, filename: string): Promise<string> {
  const uploadsDir = path.join(__dirname, '..', 'uploads', 'products');
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }

  // If developer wants to skip external downloads (useful for CI or rate limits)
  if (process.env.SKIP_IMAGE_DOWNLOAD === 'true') {
    console.log(`SKIP_IMAGE_DOWNLOAD=true — skipping download for "${searchTerm}"`);
    return '/uploads/products/placeholder.jpg';
  }

  const providers = [
    `https://source.unsplash.com/400x400/?${encodeURIComponent(searchTerm)}`,
    `https://picsum.photos/seed/${encodeURIComponent(searchTerm)}/400/400`,
    `https://loremflickr.com/400/400/${encodeURIComponent(searchTerm)}`,
  ];

  const filePath = path.join(uploadsDir, filename);

  for (const providerUrl of providers) {
    const maxAttempts = 3;
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        const response = await axios.get(providerUrl, {
          responseType: 'arraybuffer',
          timeout: 15000,
          maxRedirects: 5,
          validateStatus: status => status >= 200 && status < 600, // let us handle non-2xx
        });

        const status = response.status || (response as any)?.status;
        const contentType = (response.headers && response.headers['content-type']) || '';

        if (status >= 500) {
          throw new Error(`Server error status ${status}`);
        }

        if (!contentType.startsWith('image/')) {
          throw new Error(`Unexpected content-type: ${contentType}`);
        }

        fs.writeFileSync(filePath, response.data);
        return `/uploads/products/${filename}`;
      } catch (error: any) {
        const status = error?.response?.status || '';
        console.error(`Attempt ${attempt} (provider ${providerUrl}) - Error downloading "${searchTerm}":`, error.message || error, status ? `(status ${status})` : '');
        if (attempt < maxAttempts) {
          await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
          continue;
        }
      }
    }
  }

  return '/uploads/products/placeholder.jpg';
}

async function seed() {
  try {
    await AppDataSource.initialize();
    console.log('Database connected');

    await new Promise(resolve => setTimeout(resolve, 1000));

    const productRepository = AppDataSource.getRepository(Product);
    const userRepository = AppDataSource.getRepository(User);
    const roleRepository = AppDataSource.getRepository(Role);
    const categoryRepository = AppDataSource.getRepository(Category);
    const discountRepository = AppDataSource.getRepository(Discount);

    console.log('Clearing existing data...');
    try {
      const tables = ['user_discounts', 'discounts', 'cart_items', 'order_items', 'orders', 'discount_codes', 'products', 'categories', 'users', 'roles', 'favorites'];
      let clearedCount = 0;
      for (const table of tables) {
        try {
          await AppDataSource.query(`TRUNCATE TABLE ${table} CASCADE`);
          clearedCount++;
        } catch (error: any) {
          if (error.code !== '42P01') {
            throw error;
          }
        }
      }
      if (clearedCount > 0) {
        console.log(`Cleared data from ${clearedCount} table(s)`);
      } else {
        console.log('Tables will be created by TypeORM synchronize');
      }
    } catch (error: any) {
      if (error.code === '42P01') {
        console.log('Tables will be created by TypeORM synchronize');
      } else {
        throw error;
      }
    }

    console.log('\nCreating roles...');
    let customerRole = await roleRepository.findOne({ where: { name: 'customer' } });
    if (!customerRole) {
      customerRole = roleRepository.create({
        name: 'customer',
        description: 'Customer role',
      });
      customerRole = await roleRepository.save(customerRole);
      console.log('Created role: customer');
    } else {
      console.log('Role already exists: customer');
    }

    let adminRole = await roleRepository.findOne({ where: { name: 'admin' } });
    if (!adminRole) {
      adminRole = roleRepository.create({
        name: 'admin',
        description: 'Administrator role',
      });
      adminRole = await roleRepository.save(adminRole);
      console.log('Created role: admin');
    } else {
      console.log('Role already exists: admin');
    }

    console.log('\nUpdating existing users without roles...');
    const usersWithoutRole = await userRepository.find({ where: { roleId: null } });
    if (usersWithoutRole.length > 0) {
      for (const user of usersWithoutRole) {
        const isAdmin = user.email.includes('admin') || user.email === 'admin@example.com';
        user.roleId = isAdmin ? adminRole.id : customerRole.id;
        await userRepository.save(user);
      }
      console.log(`Updated ${usersWithoutRole.length} user(s) with roles`);
    }

    console.log('\nCreating categories...');
    const clothesCategory = categoryRepository.create({
      name: 'Clothes',
      description: 'Clothing items',
    });
    await categoryRepository.save(clothesCategory);
    console.log('Created category: Clothes');

    const shoesCategory = categoryRepository.create({
      name: 'Shoes',
      description: 'Footwear items',
    });
    await categoryRepository.save(shoesCategory);
    console.log('Created category: Shoes');

    // Create a map for category lookup
    const categoryMap: { [key: string]: Category } = {
      'clothing': clothesCategory,
      'clothes': clothesCategory,
      'shoes': shoesCategory,
      'shoe': shoesCategory,
    };

    console.log('\nCreating dummy users...');
    for (const userData of dummyUsers) {
      const hashedPassword = await bcrypt.hash(userData.password, 10);
      const role = userData.role === 'admin' ? adminRole : customerRole;
      const user = userRepository.create({
        name: userData.name,
        email: userData.email,
        password: hashedPassword,
        roleId: role.id,
      });
      await userRepository.save(user);
      console.log(`Created user: ${userData.name} (${userData.email}) - Role: ${userData.role}`);
    }

    console.log('\nCreating products...');
    for (let i = 0; i < products.length; i++) {
      const product = products[i];
      const filename = `product-${i + 1}-${Date.now()}.jpg`;
      
      console.log(`Downloading image for: ${product.name}...`);
      const imageUrl = await downloadImage(product.imageSearch, filename);
      
      const categoryName = (product.categoryName || '').toLowerCase();
      const category = categoryMap[categoryName] || null;
      
      const newProduct = productRepository.create({
        name: product.name,
        description: product.description,
        price: product.price,
        stock: product.stock,
        imageUrl,
        isActive: true,
        categoryId: category?.id || null,
      });
      
      await productRepository.save(newProduct);
      console.log(`Created product: ${product.name}${category ? ` (${category.name})` : ''}`);
      
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    console.log('\nCreating sample discounts...');
    const sampleDiscounts = [
      {
        name: 'Welcome Bonus',
        description: '10% off for new customers',
        code: 'WELCOME10',
        type: DiscountType.PERCENTAGE,
        value: 10,
        isActive: true,
        isGlobal: true,
        isListedToUser: true,
      },
      {
        name: 'Spend & Save',
        description: 'Save $15 when you spend $150',
        code: 'SAVE15',
        type: DiscountType.FIXED,
        value: 15,
        isActive: true,
        isGlobal: false,
        isListedToUser: true,
        conditionType: DiscountConditionType.MINIMUM_SPEND,
        conditionValue: { minimumSpend: 150 },
      },
    ];

    for (const discountData of sampleDiscounts) {
      const existing = await discountRepository.findOne({
        where: { code: discountData.code },
      });
      if (!existing) {
        await discountRepository.save(
          discountRepository.create(discountData),
        );
        console.log(`Created discount: ${discountData.code}`);
      } else {
        console.log(`Discount already exists: ${discountData.code}`);
      }
    }

    console.log('Seeding completed!');
    console.log('Dummy Users Created:');
    dummyUsers.forEach(user => {
      console.log(` ${user.email} (Password: ${user.password}) - Role: ${user.role}`);
    });
    await AppDataSource.destroy();
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
}

seed();
