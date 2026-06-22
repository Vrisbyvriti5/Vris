# NIRVI eCommerce Backend API

Production-ready Node.js + Express + MySQL backend for the NIRVI eCommerce platform.

---

## 📁 Project Structure

```
nirvi-Backend-style/
├── config/
│   ├── db.js            # MySQL connection pool
│   ├── initDb.js        # Create database & tables
│   └── seed.js          # Seed initial data
├── controllers/
│   ├── authController.js
│   ├── cartController.js
│   ├── orderController.js
│   ├── productController.js
│   └── userController.js
├── middleware/
│   ├── auth.js          # JWT authentication & admin authorisation
│   └── upload.js        # Multer image upload config
├── models/
│   ├── cartModel.js
│   ├── orderModel.js
│   ├── productModel.js
│   └── userModel.js
├── routes/
│   ├── authRoutes.js
│   ├── cartRoutes.js
│   ├── orderRoutes.js
│   ├── productRoutes.js
│   └── userRoutes.js
├── uploads/             # Stored product images
├── utils/
│   └── helpers.js       # Response & pagination helpers
├── .env                 # Environment variables
├── .gitignore
├── package.json
└── server.js            # Entry point
```

---

## 🚀 Quick Start

### 1. Install Dependencies
```bash
cd nirvi-Backend-style
npm install
```

### 2. Configure Environment
Edit `.env` with your MySQL credentials:
```env
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=nirvi_ecommerce
JWT_SECRET=your_secret_key
RAZORPAY_KEY_ID=rzp_live_xxxxxxxxxxxx
RAZORPAY_KEY_SECRET=xxxxxxxxxxxxxxxx
EMAIL_USER=your_gmail@gmail.com
EMAIL_PASS=your_gmail_app_password
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
SESSION_SECRET=your_session_secret
```

### 3. Initialise Database
```bash
node config/initDb.js
```

### 4. Seed Data (Optional)
```bash
node config/seed.js
```
Creates an admin user and 20 products.

### 5. Start Server
```bash
# Development (with hot reload)
npm run dev

# Production
npm start
```
Server runs at `http://localhost:5000`.

---

## 🔑 Default Credentials

| Role  | Email             | Password          |
|-------|-------------------|--------------------|
| Admin | admin@nirvi.com   | NirviAdmin@2026   |
| User  | aarav.mehta@gmail.com | password123   |

---

## 📡 API Reference

### Auth
| Method | Endpoint              | Auth     | Description       |
|--------|-----------------------|----------|-------------------|
| POST   | `/api/auth/register`  | Public   | Register          |
| POST   | `/api/auth/login`     | Public   | Login (get JWT)   |
| GET    | `/api/auth/google`    | Public   | Start Google OAuth |
| GET    | `/api/auth/google/callback` | Public | Google OAuth callback |
| POST   | `/api/auth/send-otp`  | Public   | Send OTP for password reset |
| POST   | `/api/auth/verify-otp`| Public   | Verify password reset OTP |
| POST   | `/api/auth/reset-password` | Public | Reset password after OTP |
| GET    | `/api/auth/profile`   | Bearer   | Current user      |

### Products
| Method | Endpoint                    | Auth     | Description           |
|--------|-----------------------------|----------|-----------------------|
| GET    | `/api/products`             | Public   | List all (filter/search) |
| GET    | `/api/products/categories`  | Public   | Category list         |
| GET    | `/api/products/:id`         | Public   | Single product        |
| POST   | `/api/products`             | Admin    | Create (multipart)    |
| PUT    | `/api/products/:id`         | Admin    | Update (multipart)    |
| DELETE | `/api/products/:id`         | Admin    | Delete                |

**Query params:** `?category=totebags&collection=Denim&search=tote`

### Cart
| Method | Endpoint                   | Auth     | Description       |
|--------|----------------------------|----------|-------------------|
| GET    | `/api/cart`                | Bearer   | Get cart          |
| POST   | `/api/cart`                | Bearer   | Add item          |
| PUT    | `/api/cart/:productId`     | Bearer   | Update quantity   |
| DELETE | `/api/cart/:productId`     | Bearer   | Remove item       |
| DELETE | `/api/cart/clear`          | Bearer   | Clear entire cart |

### Orders
| Method | Endpoint                     | Auth     | Description           |
|--------|------------------------------|----------|-----------------------|
| POST   | `/api/orders`                | Bearer   | Place order           |
| POST   | `/api/orders/razorpay/create-order` | Bearer | Create Razorpay order |
| POST   | `/api/orders/razorpay/verify` | Bearer  | Verify Razorpay payment |
| GET    | `/api/orders/my-orders`      | Bearer   | User's orders         |
| GET    | `/api/orders/:id`            | Bearer   | Single order          |
| GET    | `/api/orders`                | Admin    | All orders            |
| PUT    | `/api/orders/:id/status`     | Admin    | Update status         |

### Razorpay Payments

Use environment variables for Razorpay credentials and keep `RAZORPAY_KEY_SECRET` on the backend only.

### User Management (Admin)
| Method | Endpoint                  | Auth     | Description       |
|--------|---------------------------|----------|-------------------|
| GET    | `/api/users`              | Admin    | All users         |
| GET    | `/api/users/:id`          | Admin    | Single user       |
| DELETE | `/api/users/:id`          | Admin    | Delete user       |
| PUT    | `/api/users/:id/role`     | Admin    | Update role       |

### Health Check
| Method | Endpoint        | Auth   | Description        |
|--------|-----------------|--------|--------------------|
| GET    | `/api/health`   | Public | Server status      |

---

## 🔐 Authentication

All protected routes require the `Authorization` header:
```
Authorization: Bearer <your_jwt_token>
```

---

## 📸 Image Uploads

Product images are uploaded via `multipart/form-data` with field name `image`.
Served statically at: `http://localhost:5000/uploads/<filename>`

---

## 📬 Sample Requests (Postman)

### Register
```json
POST /api/auth/register
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "mypassword123"
}
```

### Place Order
```json
POST /api/orders
Authorization: Bearer <token>
{
  "items": [
    { "productId": 1, "name": "THE NEON VIBE TOTE", "price": 380, "quantity": 2 }
  ],
  "totalPrice": 760,
  "deliveryCharge": 50,
  "paymentMethod": "razorpay",
  "address": {
    "fullName": "John Doe",
    "mobile": "9876543210",
    "pincode": "110001",
    "city": "New Delhi",
    "state": "Delhi",
    "fullAddress": "123 Main Street",
    "landmark": "Near Metro Station"
  }
}
```
