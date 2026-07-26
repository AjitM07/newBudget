# Public Budget Allocation Optimization Platform

The Public Budget Allocation Optimization Platform is a full-stack web application that enables transparent, data-driven planning and visualization of public budget allocations. The platform allows administrators to manage budget distribution across various sectors and regions, while providing citizens with insightful dashboards, reports, and allocation visualizations. It combines modern web technologies with interactive analytics to improve transparency, decision-making, and public engagement in government budget planning.

---

## Project Category

**Category:** Full Stack Web Development / Government Technology (GovTech) / Budget Management System

---

## Key Features

* **Budget Allocation Management:** Create, update, and manage budget allocations across multiple sectors and administrative regions.
* **Interactive Dashboard:** Visualize budget distribution using charts, graphs, and analytical dashboards for better decision-making.
* **Role-Based Authentication:** Secure login system with role-based authorization for administrators and citizens.
* **Report Generation:** Generate and manage financial reports for budget allocation analysis.
* **Scenario Planning:** Simulate multiple allocation scenarios to compare different budget strategies.
* **Citizen Portal:** Allow citizens to view public budget allocations and promote transparency.
* **Responsive User Interface:** Modern, responsive frontend designed for desktops and mobile devices.

---

## Tech Stack & Hardware Components

### Software & Technologies

* **Frontend:** React.js, Vite
* **Styling:** Tailwind CSS
* **Backend:** Node.js, Express.js
* **Database:** MongoDB with Mongoose
* **Authentication:** JWT (JSON Web Tokens)
* **HTTP Client:** Axios
* **Data Visualization:** D3.js
* **Icons:** Lucide React
* **Email Service:** Nodemailer
* **Environment Management:** dotenv
* **Version Control:** Git & GitHub

### Target Hardware Architecture (If Applicable)

* **Client Device:** Desktop, Laptop, Tablet, or Mobile Browser
* **Application Server:** Node.js Runtime
* **Database Server:** MongoDB
* **Web Browser:** Chrome, Firefox, Edge, Safari, or any modern browser

---

## Directory Structure

```text
newBudget/
├── frontend/
│   ├── src/
│   │   ├── components/           # Reusable React components
│   │   ├── pages/                # Application pages
│   │   ├── assets/               # Images and static assets
│   │   ├── App.jsx               # Root React component
│   │   └── main.jsx              # React entry point
│   ├── public/                   # Public assets
│   ├── package.json              # Frontend dependencies
│   └── vite.config.js            # Vite configuration
│
├── backend/
│   ├── config/                   # Database and mail configuration
│   ├── controllers/              # Business logic
│   ├── middleware/               # Authentication & authorization
│   ├── models/                   # MongoDB schemas
│   ├── routes/                   # API endpoints
│   ├── server.js                 # Backend entry point
│   ├── package.json              # Backend dependencies
│   └── .env                      # Environment variables
│
├── .vscode/                      # VS Code settings
└── README.md                     # Project documentation
```

---

## How It Works (High-Level Workflow)

### 1. User Authentication Flow

1. Users access the platform through the web application.
2. The authentication system validates user credentials.
3. JWT tokens are generated for authenticated users.
4. Role-based middleware grants access according to user permissions.

### 2. Budget Allocation Workflow

1. Administrators create or update budget allocations.
2. Allocation data is stored securely in MongoDB.
3. Controllers process allocation requests.
4. Updated data is reflected on dashboards and reports.

### 3. Analytics & Reporting Workflow

1. Budget data is retrieved from the database.
2. The backend processes financial information.
3. Interactive charts and dashboards are generated using D3.js.
4. Users can analyze allocations, compare scenarios, and generate reports.

### 4. Citizen Access Workflow

1. Citizens log into the platform.
2. Public allocation information is retrieved securely.
3. Budget distributions and reports are displayed through dashboards.
4. Users can explore budget insights without modifying data.

---

## Getting Started

### Prerequisites

* Node.js (v18 or later recommended)
* npm (included with Node.js)
* MongoDB Community Server or MongoDB Atlas
* Git

### Installation & Local Setup

Clone the repository and navigate to the project directory:

```bash
git clone <repository-url>
cd newBudget
```

Install backend dependencies:

```bash
cd backend
npm install
```

Install frontend dependencies:

```bash
cd ../frontend
npm install
```

Configure environment variables:

Create a `.env` file inside the `backend` directory and configure the required environment variables such as:

```text
MONGO_URI=<your_mongodb_connection_string>
JWT_SECRET=<your_jwt_secret>
EMAIL_USER=<email_address>
EMAIL_PASSWORD=<email_password>
```

Run the backend server:

```bash
cd backend
npm start
```

Run the frontend development server:

```bash
cd frontend
npm run dev
```

*The frontend runs on the Vite development server (typically `http://localhost:5173`) while the backend runs on its configured Express server.*

Access the Application:

Open your browser and navigate to the frontend development URL. Register or log in with valid credentials to access dashboards, manage budget allocations (administrator), or view allocation insights (citizen).

