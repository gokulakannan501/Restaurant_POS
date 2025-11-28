# Restaurant POS System - Quick Start Guide

## ✅ System Status

**Backend Server:** Running on `http://localhost:5000`
**Frontend Server:** Running on `http://localhost:5176`
**Database:** SQLite (dev.db)

## 🚀 Application is Ready!

The application has been successfully set up with:
- ✅ Database migrated and seeded with sample data
- ✅ Backend API server running
- ✅ Frontend development server running
- ✅ Premium dark theme UI applied across all pages

## 📊 Sample Data Available

### Users (for testing - authentication is bypassed)
- Admin User (PIN: 1234)
- Manager User (PIN: 2345)
- Cashier User (PIN: 3456)
- Waiter User (PIN: 4567)

### Tables
- 6 tables created (T1-T6) across Ground and First floors

### Menu Items
- **Starters:** Paneer Tikka, Chicken Wings
- **Main Course:** Butter Chicken, Dal Makhani, Biryani
- **Beverages:** Fresh Lime Soda, Mango Lassi
- **Desserts:** Gulab Jamun, Ice Cream

### Inventory
- Chicken, Paneer, Rice, Milk, Tomatoes (all stocked)

## 🎯 How to Use

1. **Open the application:** Navigate to http://localhost:5176
2. **Dashboard:** View today's sales, orders, and quick actions
3. **Tables:** Click on a table to start a new order or view active orders
4. **Menu:** Browse items and add to cart
5. **Orders:** Manage order status (Pending → Preparing → Ready → Served)
6. **Billing:** Generate bills and process payments
7. **Inventory:** Track stock levels and restock items
8. **Reports:** View daily sales and item-wise analytics

## 🎨 Features

- **Dark Mode Toggle:** Click the theme switcher in the sidebar
- **Glassmorphism UI:** Premium design with backdrop blur effects
- **Real-time Updates:** Auto-refresh for tables and orders
- **Responsive Design:** Works on desktop and tablet devices

## 🔧 Development Commands

### Backend
```bash
cd backend
npm run dev          # Start development server
npm run prisma:studio # Open Prisma Studio (database GUI)
```

### Frontend
```bash
cd frontend
npm run dev          # Start development server
npm run build        # Build for production
```

## 📝 Notes

- Authentication is currently bypassed for easy testing
- All users are logged in as "Admin User" by default
- The database uses SQLite for simplicity (file: backend/dev.db)
- API requests are proxied through Vite to avoid CORS issues

## 🐛 Troubleshooting

If you see "Failed to load" errors:
1. Ensure both backend and frontend servers are running
2. Check that backend is on port 5000
3. Clear browser cache and reload
4. Check browser console for specific error messages

Enjoy your Restaurant POS System! 🍽️
