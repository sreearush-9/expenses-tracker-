# Personal Expense Tracker

A full-stack web application for managing daily income and expenses with beautiful analytics and charts.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React + Vite (JavaScript) |
| Backend | Node.js + Express |
| Database | PostgreSQL (Sequelize ORM) |
| Auth | JWT (JSON Web Tokens) |
| Charts | Recharts |
| Deployment | Frontend → Vercel, Backend → Render |

## Project Structure

```
tracker/
├── backend/          # Express API server
│   ├── config/       # Database config
│   ├── controllers/  # Route handlers
│   ├── middleware/    # Auth & error handling
│   ├── models/       # Sequelize models
│   ├── routes/       # API routes
│   ├── server.js     # Entry point
│   └── .env          # Environment variables
├── frontend/         # React + Vite app
│   ├── src/
│   │   ├── api/      # Axios instance
│   │   ├── components/
│   │   ├── context/  # Auth context
│   │   └── pages/    # App pages
│   └── .env          # Frontend env vars
└── README.md
```

## Getting Started

### Prerequisites
- Node.js 18+
- PostgreSQL database

### Backend Setup
```bash
cd backend
cp .env.example .env
# Edit .env with your database credentials
npm install
npm run dev
```

### Frontend Setup
```bash
cd frontend
cp .env.example .env
# Edit .env with your backend URL
npm install
npm run dev
```

## Deployment

### Backend (Render)
1. Push code to GitHub
2. Create a new **Web Service** on Render
3. Set root directory to `backend`
4. Build command: `npm install`
5. Start command: `npm start`
6. Add environment variables: `JWT_SECRET`, `DATABASE_URL`, `CLIENT_URL`

### Frontend (Vercel)
1. Import GitHub repo on Vercel
2. Set root directory to `frontend`
3. Framework preset: Vite
4. Add environment variable: `VITE_API_URL` = your Render backend URL + `/api`

## Features
- 🔐 User Authentication (Register/Login)
- 💰 Income & Expense tracking
- 🏷️ Custom categories with colors
- 📊 Analytics with charts (Bar + Pie)
- 📅 Date-based filtering
- 📱 Responsive design
