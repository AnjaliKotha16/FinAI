# FinAI - AI-Powered Personal Finance, Tax Management & Goal-Based Investment Assistant

> **Phase 4 Complete: Expense Categorization System**

Welcome to **FinAI**! This repository contains the complete application foundation, **Phase 1 User Authentication**, **Phase 2 Application Shell**, **Phase 3 Transaction Management**, and **Phase 4 Expense Categorization System** built using **React.js**, **Node.js**, **Express.js**, **MongoDB**, **bcrypt**, and **JWT**.

---

## 🎯 Phase 4 Completed Features

### ✅ Centralized Category Definitions
- **Supported Categories**: `Food`, `Shopping`, `Travel`, `Bills`, `Entertainment`, `Healthcare`, `Education`, `Investments`, `Rent`, `Others`.
- **Frontend Centralization ([`constants.js`](file:///c:/Users/kotha/Downloads/FinAI/client/src/utils/constants.js))**: Exported `TRANSACTION_CATEGORIES` and `CATEGORY_ICONS` mapping.
- **Backend Centralization ([`Transaction.js`](file:///c:/Users/kotha/Downloads/FinAI/server/src/models/Transaction.js))**: Exported `ALLOWED_CATEGORIES` enum list enforced in schema validation.

### ✅ Backend Validation & Data Integrity
- `POST /api/transactions` and `PUT /api/transactions/:id` validate category input against `ALLOWED_CATEGORIES`.
- Invalid category submissions (e.g. `food`, `FOOD`, `Restaurant`, `Unknown`) are rejected with `400 Bad Request` and a friendly error message: `"Invalid transaction category. Please select a valid category."`.
- User ownership check remains strict: category updates on `PUT /api/transactions/:id` require matching authenticated user ownership.

### ✅ Frontend Components & Categorization UI
- **Category Badge ([`CategoryBadge.jsx`](file:///c:/Users/kotha/Downloads/FinAI/client/src/components/CategoryBadge.jsx))**: Reusable pill component displaying category names alongside visual emojis (e.g. 🍔 Food, 🛍️ Shopping, ✈️ Travel, etc.).
- **Category Select Dropdown ([`CategorySelect.jsx`](file:///c:/Users/kotha/Downloads/FinAI/client/src/components/CategorySelect.jsx))**: Reusable form input component for selecting supported categories.
- **Category Filter Dropdown ([`CategoryFilter.jsx`](file:///c:/Users/kotha/Downloads/FinAI/client/src/components/CategoryFilter.jsx))**: Allows combined multi-criteria filtering: Type Filter (`All`, `Income`, `Expense`) + Category Filter (`All Categories`, `Food`, `Shopping`, etc.) + Live Search.
- **Category Summary Section ([`CategorySummary.jsx`](file:///c:/Users/kotha/Downloads/FinAI/client/src/components/CategorySummary.jsx))**: Displays a clear expense breakdown table/cards showing total expenses and percentage per category calculated dynamically from the user's transactions.

---

## 📁 Final Project Structure

```
FinAI/
├── client/                             # React Frontend Application
│   ├── src/
│   │   ├── components/                 # UI components
│   │   │   ├── Sidebar.jsx             # Grouped sidebar navigation
│   │   │   ├── Topbar.jsx              # Application topbar header
│   │   │   ├── PageHeader.jsx          # Reusable page title header
│   │   │   ├── CategoryBadge.jsx       # Category chip badge with icons
│   │   │   ├── CategoryBadge.css
│   │   │   ├── CategorySelect.jsx      # Centralized category select input
│   │   │   ├── CategoryFilter.jsx      # Category filter dropdown
│   │   │   ├── CategoryFilter.css
│   │   │   ├── CategorySummary.jsx     # Category expense summary breakdown
│   │   │   ├── CategorySummary.css
│   │   │   ├── TransactionModal.jsx    # Add/Edit Transaction Form Modal
│   │   │   ├── DeleteConfirmModal.jsx  # Delete confirmation dialog
│   │   │   ├── ProtectedRoute.jsx      # Auth guard
│   │   │   ├── Header.jsx              # Public header
│   │   │   └── Footer.jsx              # Public footer
│   │   ├── pages/
│   │   │   ├── HomePage.jsx            # Landing page
│   │   │   ├── LoginPage.jsx           # Sign in
│   │   │   ├── RegisterPage.jsx        # Sign up
│   │   │   ├── DashboardPage.jsx       # Dashboard view
│   │   │   ├── TransactionsPage.jsx    # Full Transaction & Category Management UI
│   │   │   ├── BudgetsPage.jsx         # Placeholder (Phase 5)
│   │   │   ├── AnalyticsPage.jsx       # Placeholder (Phase 5)
│   │   │   ├── GoalsPage.jsx           # Placeholder (Phase 5)
│   │   │   ├── InvestmentsPage.jsx     # Placeholder (Phase 5)
│   │   │   ├── TaxesPage.jsx           # Placeholder (Phase 5)
│   │   │   ├── AIAssistantPage.jsx     # Placeholder (Phase 5)
│   │   │   ├── FinancialHealthPage.jsx # Placeholder (Phase 5)
│   │   │   ├── ProfilePage.jsx         # User profile
│   │   │   └── SettingsPage.jsx        # Settings
│   │   ├── services/
│   │   │   ├── api.js                  # Fetch wrapper with Bearer token header
│   │   │   ├── authService.js          # Authentication API client
│   │   │   ├── transactionService.js   # Transaction CRUD API client
│   │   │   └── healthService.js
│   │   ├── utils/
│   │   │   └── constants.js            # Centralized categories, icons, payment methods
│   │   ├── App.jsx                     # Router & AppLayout assembly
│   │   └── main.jsx
│
├── server/                             # Node.js + Express Backend API
│   ├── src/
│   │   ├── config/
│   │   │   └── db.js                   # Mongoose MongoDB connection
│   │   ├── controllers/
│   │   │   ├── authController.js       # Register, Login, Me, Logout handlers
│   │   │   ├── transactionController.js# Transaction CRUD handlers
│   │   │   └── healthController.js
│   │   ├── middleware/
│   │   │   ├── authMiddleware.js       # JWT Authorization middleware
│   │   │   ├── errorHandler.js         # Error handler
│   │   │   └── notFoundHandler.js
│   │   ├── models/
│   │   │   ├── User.js                 # User Mongoose model
│   │   │   ├── Transaction.js          # Transaction Mongoose model with category enum
│   │   │   └── index.js
│   │   ├── routes/
│   │   │   ├── authRoutes.js           # Auth routes
│   │   │   ├── transactionRoutes.js    # Transaction REST routes
│   │   │   ├── healthRoutes.js
│   │   │   └── index.js
│   │   ├── validators/
│   │   │   ├── authValidator.js        # Auth validator
│   │   │   ├── transactionValidator.js # Transaction & category validator
│   │   │   └── index.js
│   │   └── server.js                   # Express entry point
│   ├── .env                            # Backend environment variables
│   └── .env.example
```

---

## 🚀 How to Run & Test

### 1. Start Servers
From project root:
```bash
npm run dev
```
- Backend API: `http://localhost:5000`
- Frontend App: `http://localhost:5173`

### 2. Test Category Management UI
1. Log in at `http://localhost:5173/login`.
2. Navigate to **Transactions** (`/transactions`) in the sidebar.
3. Click **"➕ Add Transaction"** and pick a category (e.g. `Food`, `Shopping`, `Travel`, `Bills`, etc.).
4. Observe the **Category Expense Summary** card displaying the expense amount and percentage breakdown for each category.
5. Filter transactions by category using the **Category** dropdown filter alongside Type and Search.
6. Click **✏️ Edit** on any transaction to change its category (e.g., `Shopping` ➔ `Education`) and verify the updated category in the database and list.
