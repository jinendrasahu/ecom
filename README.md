# ECom E-Commerce Platform

A full-stack responsive e-commerce application built with NestJS (backend) and React (frontend). This platform allows users to browse products, manage their cart, place orders, and use discount codes. Admins can manage products, orders, and create advanced discount campaigns.

## Features

- **User Authentication**: Register, login, and secure JWT-based authentication
- **Product Management**: Browse products with pagination, search, and filtering
- **Shopping Cart**: Add, remove, and update cart items
- **Order Processing**: Complete checkout flow with discount code support
- **Discount System**: Advanced discount codes with conditions (first order, order count, minimum spend)
- **Favorites**: Save favorite products for quick access
- **Admin Dashboard**: Manage products, orders, and discounts
- **Responsive Design**: Mobile-friendly interface with hamburger menu
- **Order Tracking**: View order history and status updates

## Tech Stack

### Backend
- **NestJS** - Progressive Node.js framework
- **TypeORM** - ORM for database management
- **PostgreSQL** - Relational database
- **JWT** - Authentication tokens
- **Passport** - Authentication middleware
- **Multer** - File upload handling

### Frontend
- **React** - UI library
- **TypeScript** - Type safety
- **Vite** - Build tool
- **React Router** - Routing
- **TanStack Query** - Data fetching and caching
- **Tailwind CSS** - Styling
- **Framer Motion** - Animations
- **Axios** - HTTP client

## Prerequisites

Before you begin, make sure you have the following installed:

- **Node.js** (v18 or higher)
- **npm** or **yarn**
- **PostgreSQL** (v14 or higher)
- **Git**

## Installation

### 1. Clone the Repository

```bash
git clone  https://github.com/jinendrasahu/ecom.git
cd ecom
```

### 2. Backend Setup

Navigate to the backend directory and install dependencies:

```bash
cd backend
npm install
```

### 3. Frontend Setup

Open a new terminal and navigate to the frontend directory:

```bash
cd frontend
npm install
```

### 4. Database Setup

1. Create a PostgreSQL database:

```sql
CREATE DATABASE e-com;
```

2. Update the database connection in `backend/src/app.module.ts` or create a `.env` file (make sure to use the right credentials):

```env
DB_HOST=localhost
DB_PORT=5432
SYNCHRONIZE=true
DB_USERNAME=your_username
DB_PASSWORD=your_password
DB_DATABASE=e-com
JWT_SECRET=your-secret-key-here
PORT=3001
```

## Configuration

### Backend Environment Variables

Create a `.env` file in the `backend` directory (or update `app.module.ts` directly):

```env
DB_HOST=localhost
SYNCHRONIZE=true
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=your_password
DB_DATABASE=e-com
JWT_SECRET=super-secret-jwt-key-change-this-in-production
PORT=3001
```

### Frontend Configuration

The frontend is configured to connect to `http://localhost:3001` by default. If you need to change this, update the API base URL in `frontend/src/api/` files.

## Running the Application

### Start the Backend

```bash
cd backend
npm run start:dev
```

The backend will run on `http://localhost:3001`

### Start the Frontend

In a new terminal:

```bash
cd frontend
npm run dev
```

The frontend will run on `http://localhost:3000`

### Seed the Database (Optional)

To populate the database with sample data:

```bash
cd backend
npm run seed
```

## Usage

### For Regular Users

1. **Register/Login**: Create an account or login with existing credentials
2. **Browse Products**: View products on the home page or dashboard
3. **Add to Cart**: Click "Add to Cart" on any product
4. **View Cart**: Navigate to the cart page to review items
5. **Apply Discount**: Enter a discount code during checkout (if available)
6. **Place Order**: Complete the checkout process
7. **Track Orders**: View your order history in the "My Orders" section

### For Admins

1. **Login**: Use admin credentials to access admin features
2. **Manage Products**: Add, edit, or deactivate products
3. **Manage Orders**: Update order status and add tracking numbers
4. **Create Discounts**: Set up discount campaigns with conditions
5. **View Statistics**: Check sales and order statistics

## API Documentation

### Authentication Endpoints

- `POST /auth/register` - Register a new user
- `POST /auth/login` - Login and get JWT token

### Product Endpoints

- `GET /products` - Get all products (paginated, public)
- `GET /products/:id` - Get product by ID (public)
- `POST /products` - Create product (admin only, multipart/form-data)
- `PUT /products/:id` - Update product (admin only)
- `PATCH /products/:id/activate` - Activate product (admin)
- `PATCH /products/:id/deactivate` - Deactivate product (admin)

### Cart Endpoints

- `POST /cart/add` - Add item to cart
- `GET /cart` - Get user's cart
- `DELETE /cart/:id` - Remove item from cart
- `PUT /cart/:id` - Update cart item quantity

### Order Endpoints

- `POST /orders/checkout` - Create order from cart
- `GET /orders` - Get user's orders (paginated)
- `GET /orders/:id` - Get order by ID
- `GET /orders/admin/all` - Get all orders (admin, paginated)
- `PUT /orders/:id/status` - Update order status (admin)

### Discount Endpoints

- `GET /discounts-v2/listed` - Get available discounts for user
- `POST /discounts-v2/validate` - Validate discount code
- `POST /discounts-v2` - Create discount (admin)
- `GET /discounts-v2` - Get all discounts (admin)
- `PUT /discounts-v2/:id` - Update discount (admin)
- `DELETE /discounts-v2/:id` - Delete discount (admin)

### Favorites Endpoints

- `POST /favorites/:productId` - Add to favorites
- `DELETE /favorites/:productId` - Remove from favorites
- `GET /favorites` - Get user's favorites
- `GET /favorites/ids` - Get favorite product IDs

### Admin Endpoints

- `GET /admin/statistics` - Get platform statistics (admin)
- `POST /admin/discount/generate` - Generate discount code (admin)

## Module Documentation

### Auth Module

Handles user authentication and authorization. Uses JWT tokens for secure access.

**Key Features:**
- User registration with email validation
- Password hashing with bcrypt
- JWT token generation
- Role-based access control (customer/admin)

**Entities:**
- `User` - Stores user information and credentials
- `Role` - Defines user roles

### Product Module

Manages product catalog with image uploads and stock management.

**Key Features:**
- Product CRUD operations
- Image upload with Multer
- Stock management
- Product activation/deactivation
- Category association

**Entities:**
- `Product` - Product information
- `Category` - Product categories

### Cart Module

Manages shopping cart functionality.

**Key Features:**
- Add/remove items
- Quantity updates
- Automatic price calculation
- User-specific carts

**Entities:**
- `CartItem` - Cart entries with product references

### Order Module

Handles order creation and management.

**Key Features:**
- Checkout process
- Discount code application
- Order status tracking
- Stock updates on order
- Order history

**Entities:**
- `Order` - Order information
- `OrderItem` - Individual order items

### Discount Module (V2)

Advanced discount system with conditional logic. This is probably the most complex module in the app.

**Key Features:**
- Multiple discount types (percentage, fixed amount)
- Conditional discounts (first order, order count, minimum spend)
- Global vs user-specific discounts
- One-time use per user enforcement (can't reuse the same code)
- Automatic assignment to eligible users based on conditions

**Discount Types:**
- `percentage` - Percentage off total
- `fixed` - Fixed amount off

**Condition Types:**
- `first_order` - Only for first-time customers
- `order_count` - Based on number of orders
- `minimum_spend` - Based on total spending
- `custom` - Custom conditions (extensible)

**Entities:**
- `Discount` - Discount configuration
- `UserDiscount` - User-discount associations

### Favorite Module

Allows users to save favorite products.

**Key Features:**
- Add/remove favorites
- Quick access to favorite products
- Favorite filtering on product list

**Entities:**
- `Favorite` - User-product favorite mapping

### Admin Module

Administrative functions and statistics.

**Key Features:**
- Platform statistics
- Manual discount code generation
- Order management tools


### Testing

Run tests with:

```bash
# Backend
cd backend
npm run test

# Frontend
cd frontend
npm run test
```

Currently I have added testcase only for one moduless limited apis due to less time bound for assignment
