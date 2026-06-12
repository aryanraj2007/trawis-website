# TraWis - Trade Intelligence Web Application

TraWis is a decision intelligence platform for oil and gas energy trading desks. This repository includes the main landing website along with an integrated **Blog Resource Center** and a secure, role-based **Admin Control Dashboard** backed by PostgreSQL.

---

## Prerequisites
Before setting up the project, make sure you have:
*   [Node.js](https://nodejs.org/) installed (v18+ recommended)
*   A running [PostgreSQL](https://www.postgresql.org/) database server

---

## First-Time Setup Instructions

### 1. Install Dependencies
In the project root directory, run:
```bash
npm install
```

### 2. Configure Environment Variables
1.  Copy the environment template file:
    ```bash
    cp .env.example .env
    ```
2.  Open [.env](file:///c:/Users/conta/OneDrive/Desktop/Professional%20Archive/BluWis%20Internship/TraWis/.env) and configure your database parameters:
    *   `DB_NAME`: The name of your database (e.g., `trawis_db`)
    *   `DB_USER`: Your PostgreSQL user (e.g., `postgres`)
    *   `DB_PASSWORD`: Your PostgreSQL user's password
    *   `DB_HOST`: Database server host (e.g., `localhost`)
    *   `DB_PORT`: Database port (e.g., `5432`)
    *   `SESSION_SECRET`: A secure random key to sign session cookies.

### 3. Create the Database
Make sure you create the database specified in your `.env` (e.g. `trawis_db`) on your PostgreSQL server:
```sql
CREATE DATABASE trawis_db;
```

### 4. Seed the Initial Admin Account
1.  Open [admin-setup.json](file:///c:/Users/conta/OneDrive/Desktop/Professional%20Archive/BluWis%20Internship/TraWis/admin-setup.json) in the project root.
2.  Set the initial username and password you want for your Super Admin account:
    ```json
    {
      "username": "admin",
      "password": "password123"
    }
    ```
3.  Run the database setup script to compile schemas, build tables, and seed the user:
    ```bash
    node scripts/setup-db.js
    ```
4.  **CRITICAL SECURITY STEP**: Once setup completes successfully, **delete** `admin-setup.json` from the root directory so credentials are not exposed:
    ```bash
    rm admin-setup.json
    ```

---

## Running the Server

Start the application locally:
```bash
# If you have nodemon installed globally
nodemon index.js

# Or standard Node
node index.js
```
The server will start running at [http://localhost:3000](http://localhost:3000).

---

## Key URLs & Directories
*   **Public Blog Grid**: `http://localhost:3000/resources/blog`
*   **Admin Login/Dashboard**: `http://localhost:3000/admin`
*   **Placeholder Navigation Pages**: The following routes map to the `coming_soon.ejs` template:
    *   FAQ: `http://localhost:3000/faq`
    *   Pricing: `http://localhost:3000/pricing`
    *   Schedule Demo: `http://localhost:3000/demo`
*   **Uploaded Media Storage**: Cover images and other media uploads are stored in `/public/uploads/` (ignored in git, except the `.gitkeep` placeholder).

