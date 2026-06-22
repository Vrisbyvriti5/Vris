# NIRVI Project & Resume Guide

## 1. Updated Summary
**Full-Stack + AI/ML Engineer**
A highly capable engineer bridging the gap between intelligent AI/ML systems and robust, scalable web architectures. Proven ability to design and deploy full-stack platforms from the ground up, integrating complex frontends, secure backends, and cloud infrastructure.

## 2. Massively Expanded Skills Section
- **Languages & Core Tech:** JavaScript (ES6+), Python, HTML5, CSS3/Tailwind
- **Frontend:** React.js, Context API, React Router, Vite, UI/UX Design, Framer Motion
- **Backend:** Node.js, Express.js, REST APIs, JWT (JSON Web Tokens), Google OAuth, RBAC
- **Database:** MySQL, AWS RDS, Normalized Schema Design (10+ tables), Data Seeding
- **Cloud Infrastructure & DevOps:** AWS EC2, S3, IAM, Vercel, PM2, Nginx, SSL/TLS, CI/CD Pipelines
- **Tools & Integrations:** Razorpay Payment Gateway, Postman, Git/GitHub, Multer, CDN Integration
- **AI/ML (Bonus):** YOLOv10, Computer Vision, Data Preprocessing (from previous projects)

## 3. Detailed Project Explanation (Line-by-Line Concepts)

### Architecture & Backend
- **REST APIs:** The backend (`nirvi-Backend-style`) is structured using Express.js routing to handle HTTP requests (GET, POST, PUT, DELETE) for users, products, carts, and orders.
- **JWT & Google OAuth:** Authentication is dual-layered. Users can log in traditionally (password hashed via `bcryptjs`, session managed via `jsonwebtoken`), or via Google OAuth (`passport-google-oauth20`). 
- **Cookies:** Upon successful login, the JWT is often stored in an HTTP-only **cookie** to securely maintain the user's session across browser requests without exposing it to XSS attacks.
- **Razorpay:** Integrated for secure, seamless checkout. The backend creates an order via the Razorpay API and verifies the payment signature upon success.
- **RBAC (Role-Based Access Control):** The backend middleware checks user roles (e.g., `admin` vs `customer`) before allowing access to specific routes like creating products or viewing all orders.
- **Caching:** By utilizing memory caches or HTTP cache headers, the API reduces load on the database for frequently accessed resources like the product catalog.

### Frontend
- **React Context API:** Found heavily in `nirvi-elevated-style/src/context/` (AuthContext, CartContext, CheckoutContext, etc.). This acts as a global state manager, avoiding "prop drilling" and making user data and cart items accessible from any component.
- **Admin Panel:** A dedicated section of the React app that interacts with admin-only REST APIs, allowing the store owner to add products, upload images, and manage orders.
- **Multi-step Checkout:** The UI guides the user through shipping details, payment selection (Razorpay), and order confirmation in a streamlined flow.

### Cloud Infrastructure & DevOps
- **AWS EC2:** The Node.js backend is hosted on a virtual server in the cloud (EC2), providing full control over the environment.
- **AWS RDS:** The MySQL database is hosted on Relational Database Service (RDS), ensuring high availability and automated backups.
- **AWS S3 & IAM:** User-uploaded images (like product photos) are sent to S3 via `multer-s3`. IAM (Identity and Access Management) roles securely grant the backend permission to upload these files.
- **PM2:** A production process manager used on the EC2 instance to keep the Node.js backend alive forever, restarting it automatically if it crashes.
- **Nginx & SSL:** Nginx runs on the EC2 server as a reverse proxy, routing incoming port 80/443 traffic to the Node.js app (often on port 5000). SSL certificates secure the data in transit (HTTPS).
- **Vercel CI/CD:** The React frontend is deployed on Vercel. A Continuous Integration / Continuous Deployment (CI/CD) pipeline is automatically triggered when code is pushed to GitHub, building and deploying the site in seconds.
- **CDN (Content Delivery Network):** Vercel acts as a CDN for the frontend assets, caching HTML/CSS/JS at edge nodes globally for lightning-fast load times. S3 can also be paired with CloudFront for a media CDN.

### Database Design
- **Normalized 10-table schema:** The `mysql2` database is structured to minimize redundancy (e.g., separate tables for Users, Products, Categories, Orders, OrderItems).
- **initDb & seed scripts:** Found in `nirvi-Backend-style/config/`. `initDb.js` creates the tables programmatically, and `seed.js` populates them with initial dummy data for testing.

## 4. ChatGPT Prompt for Excellent Resume Generation

Copy and paste the following prompt into ChatGPT:

```text
Act as an expert technical resume writer. I need you to write a professional, high-impact resume for me. I am repositioning myself as a "Full-Stack + AI/ML Engineer." I want to heavily emphasize my recent eCommerce project, "NIRVI," along with my AI background.

Here are my skills to prominently feature:
- Languages: JavaScript, Python, SQL, HTML/CSS
- Frontend: React, Context API, Admin Panel Development, Multi-step checkout, Tailwind CSS
- Backend: Node.js, Express, REST APIs, JWT, Google OAuth, Razorpay integration, RBAC, Caching mechanisms, Cookies for session management
- Cloud & DevOps: AWS EC2, AWS RDS, AWS S3, AWS IAM, PM2, Vercel CI/CD pipelines, Nginx, SSL, CDN optimization
- Database: MySQL, Normalized 10-table schema design, initDb & data seeding scripts, Postman testing
- AI/ML: YOLOv10, Computer Vision (from past projects)

Please structure the resume with:
1. A strong, compelling Professional Summary highlighting my dual expertise in Full-Stack web development and AI/ML.
2. A tightly packed Skills section grouped by category (Frontend, Backend, Cloud/DevOps, AI/ML).
3. A detailed Experience/Projects section for "NIRVI eCommerce Platform". Use action verbs and metric-driven bullet points. Explicitly mention how I built the CI/CD pipeline on Vercel, optimized assets via CDN, secured APIs using JWT and HTTP-only cookies, deployed the backend to AWS EC2 using PM2 and Nginx, managed a MySQL RDS instance with a 10-table normalized schema, and integrated Razorpay and Google OAuth.
4. Keep the tone highly professional, concise, and optimized for ATS (Applicant Tracking Systems).
```
