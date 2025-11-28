# Restaurant POS System

A complete full-stack Point of Sale system for restaurants built with Node.js, Express, PostgreSQL, React, and Vite.

## Features

### Order Management
- Dine-in, Takeaway, and Delivery orders
- Real-time order tracking
- Order status updates

### Table Management
- Visual table layout
- Table status (Available, Occupied, Reserved)
- Table assignment and management

### Menu Management
- Categories and subcategories
- Item variants (size, customization)
- Price management
- Item availability toggle

### Billing & Payments
- Multiple payment modes (Cash, Card, UPI, Wallet)
- Tax calculation (CGST, SGST)
- Discount application
- Digital and printed receipts
- WhatsApp receipt sharing

### Inventory Management
- Stock tracking
- Low stock alerts
- Ingredient management
- Stock updates

### Reports & Analytics
- Daily sales reports
- Item-wise sales analysis
- Payment mode breakdown
- Export to CSV

### Security
- PIN-based authentication
- JWT token management
- Role-based access control (Admin, Manager, Cashier, Waiter)

## Tech Stack

### Backend
- Node.js & Express
- PostgreSQL
- Prisma ORM
- JWT Authentication
- Zod Validation

### Frontend
- React 18
- Vite
- TailwindCSS
- Zustand (State Management)
- Axios
- React Router v6
- PWA Support

## Project Structure

```
restaurant-pos-system/
├── backend/
│   ├── src/
│   │   ├── config/
│   │   ├── controllers/
│   │   ├── middleware/
│   │   ├── routes/
│   │   ├── services/
│   │   ├── utils/
│   │   ├── validators/
│   │   └── server.js
│   ├── prisma/
│   │   └── schema.prisma
│   ├── package.json
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── services/
│   │   ├── store/
│   │   ├── utils/
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── public/
│   ├── package.json
│   └── vite.config.js
└── README.md
```

## Installation & Setup

### Prerequisites
- Node.js (v18 or higher)
- PostgreSQL (v14 or higher)
- npm or yarn

### Backend Setup

1. Navigate to backend directory:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Create `.env` file:
```env
DATABASE_URL="postgresql://username:password@localhost:5432/restaurant_pos"
JWT_SECRET="your-secret-key-here"
PORT=5000
NODE_ENV=development
```

4. Run Prisma migrations:
```bash
npx prisma migrate dev
```

5. Seed the database (optional):
```bash
npx prisma db seed
```

6. Start the server:
```bash
npm run dev
```

Backend will run on `http://localhost:5000`

### Frontend Setup

1. Navigate to frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Create `.env` file:
```env
VITE_API_URL=http://localhost:5000/api
```

4. Start the development server:
```bash
npm run dev
```

Frontend will run on `http://localhost:5173`

## Default Users

After seeding, you can login with:

- **Admin**: PIN `1234`
- **Manager**: PIN `2345`
- **Cashier**: PIN `3456`
- **Waiter**: PIN `4567`

## API Endpoints

### Authentication
- `POST /api/auth/login` - PIN-based login
- `POST /api/auth/logout` - Logout
- `GET /api/auth/me` - Get current user

### Menu
- `GET /api/menu` - Get all menu items
- `GET /api/menu/:id` - Get menu item by ID
- `POST /api/menu` - Create menu item (Admin/Manager)
- `PUT /api/menu/:id` - Update menu item (Admin/Manager)
- `DELETE /api/menu/:id` - Delete menu item (Admin)

### Orders
- `GET /api/orders` - Get all orders
- `GET /api/orders/:id` - Get order by ID
- `POST /api/orders` - Create new order
- `PUT /api/orders/:id` - Update order
- `PATCH /api/orders/:id/status` - Update order status

### Tables
- `GET /api/tables` - Get all tables
- `GET /api/tables/:id` - Get table by ID
- `POST /api/tables` - Create table (Admin/Manager)
- `PUT /api/tables/:id` - Update table
- `PATCH /api/tables/:id/status` - Update table status

### Billing
- `POST /api/billing/generate` - Generate bill
- `GET /api/billing/:id` - Get bill by ID
- `POST /api/billing/:id/payment` - Process payment
- `GET /api/billing/:id/receipt` - Get receipt

### Inventory
- `GET /api/inventory` - Get all inventory items
- `GET /api/inventory/:id` - Get inventory item
- `POST /api/inventory` - Add inventory item
- `PUT /api/inventory/:id` - Update inventory
- `GET /api/inventory/alerts` - Get low stock alerts

### Reports
- `GET /api/reports/daily-sales` - Daily sales report
- `GET /api/reports/item-wise` - Item-wise sales
- `GET /api/reports/payment-modes` - Payment mode breakdown
- `GET /api/reports/export/csv` - Export report to CSV

## Features in Detail

### PWA Support
- Offline functionality
- Install as desktop/mobile app
- Service worker caching

### Receipt Generation
- Print receipts
- Share via WhatsApp
- Email receipts (optional)

### Responsive Design
- Mobile-first approach
- Works on tablets and desktops
- Touch-friendly interface

## Development

### Backend Development
```bash
cd backend
npm run dev  # Uses nodemon for auto-reload
```

### Frontend Development
```bash
cd frontend
npm run dev  # Vite hot reload
```

### Build for Production

Backend:
```bash
cd backend
npm start
```

Frontend:
```bash
cd frontend
npm run build
npm run preview
```

## License

MIT

## Support

For issues and questions, please open an issue on GitHub.
