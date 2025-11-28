import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // Create Users
  const users = await Promise.all([
    prisma.user.upsert({
      where: { pin: '1234' },
      update: {},
      create: {
        name: 'Admin User',
        pin: await bcrypt.hash('1234', 10),
        role: 'ADMIN',
      },
    }),
    prisma.user.upsert({
      where: { pin: '2345' },
      update: {},
      create: {
        name: 'Manager User',
        pin: await bcrypt.hash('2345', 10),
        role: 'MANAGER',
      },
    }),
    prisma.user.upsert({
      where: { pin: '3456' },
      update: {},
      create: {
        name: 'Cashier User',
        pin: await bcrypt.hash('3456', 10),
        role: 'CASHIER',
      },
    }),
    prisma.user.upsert({
      where: { pin: '4567' },
      update: {},
      create: {
        name: 'Waiter User',
        pin: await bcrypt.hash('4567', 10),
        role: 'WAITER',
      },
    }),
  ]);
  console.log('✅ Users created');

  // Create Categories
  const categories = await Promise.all([
    prisma.category.create({
      data: {
        name: 'Starters',
        description: 'Appetizers and starters',
        sortOrder: 1,
      },
    }),
    prisma.category.create({
      data: {
        name: 'Main Course',
        description: 'Main dishes',
        sortOrder: 2,
      },
    }),
    prisma.category.create({
      data: {
        name: 'Beverages',
        description: 'Drinks and beverages',
        sortOrder: 3,
      },
    }),
    prisma.category.create({
      data: {
        name: 'Desserts',
        description: 'Sweet dishes',
        sortOrder: 4,
      },
    }),
  ]);
  console.log('✅ Categories created');

  // Create Menu Items
  const menuItems = await Promise.all([
    // Starters
    prisma.menuItem.create({
      data: {
        name: 'Paneer Tikka',
        description: 'Grilled cottage cheese with spices',
        price: 250,
        categoryId: categories[0].id,
        isVeg: true,
        variants: {
          create: [
            { name: 'Half', price: 250 },
            { name: 'Full', price: 450 },
          ],
        },
      },
    }),
    prisma.menuItem.create({
      data: {
        name: 'Chicken Wings',
        description: 'Spicy chicken wings',
        price: 300,
        categoryId: categories[0].id,
        isVeg: false,
        variants: {
          create: [
            { name: '6 Pieces', price: 300 },
            { name: '12 Pieces', price: 550 },
          ],
        },
      },
    }),
    // Main Course
    prisma.menuItem.create({
      data: {
        name: 'Butter Chicken',
        description: 'Creamy tomato-based chicken curry',
        price: 350,
        categoryId: categories[1].id,
        isVeg: false,
      },
    }),
    prisma.menuItem.create({
      data: {
        name: 'Dal Makhani',
        description: 'Black lentils in creamy gravy',
        price: 250,
        categoryId: categories[1].id,
        isVeg: true,
      },
    }),
    prisma.menuItem.create({
      data: {
        name: 'Biryani',
        description: 'Aromatic rice dish',
        price: 300,
        categoryId: categories[1].id,
        isVeg: false,
        variants: {
          create: [
            { name: 'Veg', price: 250 },
            { name: 'Chicken', price: 300 },
            { name: 'Mutton', price: 400 },
          ],
        },
      },
    }),
    // Beverages
    prisma.menuItem.create({
      data: {
        name: 'Fresh Lime Soda',
        description: 'Refreshing lime drink',
        price: 80,
        categoryId: categories[2].id,
        isVeg: true,
        variants: {
          create: [
            { name: 'Sweet', price: 80 },
            { name: 'Salted', price: 80 },
          ],
        },
      },
    }),
    prisma.menuItem.create({
      data: {
        name: 'Mango Lassi',
        description: 'Sweet mango yogurt drink',
        price: 120,
        categoryId: categories[2].id,
        isVeg: true,
      },
    }),
    // Desserts
    prisma.menuItem.create({
      data: {
        name: 'Gulab Jamun',
        description: 'Sweet milk dumplings',
        price: 100,
        categoryId: categories[3].id,
        isVeg: true,
        variants: {
          create: [
            { name: '2 Pieces', price: 100 },
            { name: '4 Pieces', price: 180 },
          ],
        },
      },
    }),
    prisma.menuItem.create({
      data: {
        name: 'Ice Cream',
        description: 'Assorted flavors',
        price: 120,
        categoryId: categories[3].id,
        isVeg: true,
        variants: {
          create: [
            { name: 'Vanilla', price: 120 },
            { name: 'Chocolate', price: 120 },
            { name: 'Strawberry', price: 120 },
          ],
        },
      },
    }),
  ]);
  console.log('✅ Menu items created');

  // Create Tables
  const tables = await Promise.all([
    prisma.table.create({
      data: {
        number: 'T1',
        capacity: 2,
        floor: 'Ground',
        position: JSON.stringify({ x: 100, y: 100 }),
      },
    }),
    prisma.table.create({
      data: {
        number: 'T2',
        capacity: 4,
        floor: 'Ground',
        position: JSON.stringify({ x: 300, y: 100 }),
      },
    }),
    prisma.table.create({
      data: {
        number: 'T3',
        capacity: 4,
        floor: 'Ground',
        position: JSON.stringify({ x: 500, y: 100 }),
      },
    }),
    prisma.table.create({
      data: {
        number: 'T4',
        capacity: 6,
        floor: 'Ground',
        position: JSON.stringify({ x: 100, y: 300 }),
      },
    }),
    prisma.table.create({
      data: {
        number: 'T5',
        capacity: 2,
        floor: 'First',
        position: JSON.stringify({ x: 100, y: 100 }),
      },
    }),
    prisma.table.create({
      data: {
        number: 'T6',
        capacity: 8,
        floor: 'First',
        position: JSON.stringify({ x: 300, y: 100 }),
      },
    }),
  ]);
  console.log('✅ Tables created');

  // Create Inventory Items
  const inventoryItems = await Promise.all([
    prisma.inventoryItem.create({
      data: {
        name: 'Chicken (kg)',
        unit: 'kg',
        currentStock: 50,
        minStock: 10,
        maxStock: 100,
      },
    }),
    prisma.inventoryItem.create({
      data: {
        name: 'Paneer (kg)',
        unit: 'kg',
        currentStock: 30,
        minStock: 5,
        maxStock: 50,
      },
    }),
    prisma.inventoryItem.create({
      data: {
        name: 'Rice (kg)',
        unit: 'kg',
        currentStock: 100,
        minStock: 20,
        maxStock: 200,
      },
    }),
    prisma.inventoryItem.create({
      data: {
        name: 'Milk (liters)',
        unit: 'liters',
        currentStock: 40,
        minStock: 10,
        maxStock: 80,
      },
    }),
    prisma.inventoryItem.create({
      data: {
        name: 'Tomatoes (kg)',
        unit: 'kg',
        currentStock: 25,
        minStock: 5,
        maxStock: 50,
      },
    }),
  ]);
  console.log('✅ Inventory items created');

  console.log('🎉 Database seeded successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
