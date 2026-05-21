# <img src="./public/lapmart-high-resolution-logo-black-transparent.png" alt="Lapmart Logo" width="50"/> Lapmart - Premium Laptop E-commerce

![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)
![Express.js](https://img.shields.io/badge/Express.js-000000?style=for-the-badge&logo=express&logoColor=white)
![MongoDB](https://img.shields.io/badge/MongoDB-47A248?style=for-the-badge&logo=mongodb&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)
![License](https://img.shields.io/badge/License-ISC-blue.svg?style=for-the-badge)

**Lapmart** is a full-featured e-commerce solution dedicated to high-performance computing. Built with the MERN-lite stack (EJS for templating), it provides a secure, scalable, and intuitive platform for both tech enthusiasts and business administrators.

---

## 🌟 Key Features

### 👤 Customer Experience
*   **Secure Authentication**: Multi-layered security with Passport.js (Local & Google OAuth 2.0).
*   **Dynamic Catalog**: Advanced search and category filtering for precise product discovery.
*   **Smart Shopping**: Real-time cart management and personalized wishlists.
*   **Financial Ecosystem**: Integrated **Wallet** system and seamless **Razorpay** checkout.
*   **Post-Purchase**: Detailed order tracking, PDF invoice downloads, and product review system.

### 🛡️ Administrative Control
*   **Analytical Dashboard**: High-level business intelligence with real-time sales metrics.
*   **Inventory Management**: Full lifecycle management of products, categories, and stock.
*   **Marketing Suite**: Powerful coupon engine and dynamic homepage banner controls.
*   **Operations**: Comprehensive user moderation and multi-format sales reporting (PDF/Excel).

---

## 💻 Tech Stack

| Layer | Technologies |
| :--- | :--- |
| **Backend** | Node.js, Express.js |
| **Database** | MongoDB with Mongoose ODM |
| **Templating** | EJS (Embedded JavaScript) |
| **Security** | Passport.js, Bcrypt, Express-session |
| **Payments** | Razorpay Integration |
| **Storage** | Cloudinary API |
| **Utilities** | PDFKit, ExcelJS, Nodemailer, Multer |

---

## 🚀 Getting Started

### Prerequisites
*   Node.js (v14.x or higher)
*   MongoDB Instance
*   Service Credentials (Cloudinary, Razorpay, Google Cloud)

### Installation

1.  **Clone & Navigate**
    ```bash
    git clone https://github.com/Vishnu-vs-git/lapmart.git
    cd lapmart
    ```

2.  **Dependencies**
    ```bash
    npm install
    ```

3.  **Environment Setup**
    Create a `.env` file in the root directory:
    ```env
    PORT=7010
    MONGOURI=your_mongodb_uri
    
    # Admin Credentials
    ADMIN_EMAIL=admin@gmail.com
    ADMIN_PASSWORD=your_password
    
    # Integrations
    GOOGLE_CLIENT_ID=your_id
    GOOGLE_CLIENT_SECRET=your_secret
    YOUR_RAZORPAY_KEY_ID=your_key
    YOUR_RAZORPAY_SECRET_KEY=your_secret
    CLOUDINARY_CLOUD_NAME=your_name
    ```

4.  **Launch**
    ```bash
    # Development mode
    npm run run

    # Production mode
    npm start
    ```

---
---

## 📸 Screenshots

### 🏠 Home Page
Explore featured laptops, offers, and categories.
<img width="1896" height="876" alt="lapmartHome" src="https://github.com/user-attachments/assets/492f0869-b6f3-494f-9ff7-b145ec8c6452" />


---



### 💻 Product Details
Detailed specifications, images, and reviews.
<img width="1901" height="875" alt="productDetail" src="https://github.com/user-attachments/assets/d6beb3ad-2faa-45d9-b58d-f3e271c333e0" />


---

### 🛒 Cart & Checkout
Seamless cart management and secure checkout.
<img width="1907" height="852" alt="cart" src="https://github.com/user-attachments/assets/782f9d91-7353-4ada-8adf-57415895e1e4" />
<img width="1907" height="842" alt="Checkout" src="https://github.com/user-attachments/assets/82439ce7-7f77-41e8-80ce-cd9607bcfbba" />


---

### 💳 Payment Integration
Razorpay payment flow with wallet support.
<img width="1890" height="857" alt="payment" src="https://github.com/user-attachments/assets/c3ea1eb6-cc04-44d1-8fe0-25aed76c15d7" />


---

### 📦 Orders & Tracking
Track orders and download invoices.
<img width="1902" height="862" alt="order" src="https://github.com/user-attachments/assets/5664eda9-a216-447f-a17b-422348940c70" />


---




## 📁 Project Architecture

```text
├── controllers/    # Business logic (Admin/User)
├── model/          # Data schemas & validation
├── routes/         # API & Page routing
├── views/          # Dynamic EJS templates
├── middleware/     # Auth & Security layers
├── services/       # Third-party integrations
└── public/         # Static assets & media
```

---
<p align="center">Built with ❤️ for the Tech Community</p>
