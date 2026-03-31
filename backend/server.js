require('dotenv').config();

const express = require('express');
const cors = require('cors');
const sequelize = require('./config/db');
const errorHandler = require('./middleware/errorHandler');

// Import models to set up associations
const User = require('./models/User');
const Category = require('./models/Category');
const Transaction = require('./models/Transaction');
const ChatMessage = require('./models/ChatMessage');

// Import routes
const authRoutes = require('./routes/auth');
const categoryRoutes = require('./routes/categories');
const transactionRoutes = require('./routes/transactions');
const analyticsRoutes = require('./routes/analytics');
const chatRoutes = require('./routes/chat');

const app = express();

// ─── CORS Configuration ───────────────────────────────────────
const allowedOrigins = [
  process.env.CLIENT_URL,
  'https://arushexpenses-tracker.vercel.app',
  'https://expenses-tracker-bay-seven.vercel.app',
  'http://localhost:5173',
].filter(Boolean).map(o => o.replace(/\/$/, '')); // strip trailing slashes

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (e.g. mobile apps, curl)
    if (!origin) return callback(null, true);
    const normalized = origin.replace(/\/$/, '');
    if (allowedOrigins.includes(normalized)) {
      callback(null, true);
    } else {
      callback(new Error(`CORS: Origin ${origin} not allowed`));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// ─── Body Parsing ─────────────────────────────────────────────
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ─── Model Associations ──────────────────────────────────────
User.hasMany(Category, { foreignKey: 'userId', as: 'categories' });
Category.belongsTo(User, { foreignKey: 'userId', as: 'user' });

User.hasMany(Transaction, { foreignKey: 'userId', as: 'transactions' });
Transaction.belongsTo(User, { foreignKey: 'userId', as: 'user' });

Category.hasMany(Transaction, { foreignKey: 'categoryId', as: 'transactions' });
Transaction.belongsTo(Category, { foreignKey: 'categoryId', as: 'category' });

User.hasMany(ChatMessage, { foreignKey: 'userId', as: 'chatMessages' });
ChatMessage.belongsTo(User, { foreignKey: 'userId', as: 'user' });

// ─── Routes ──────────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

app.use('/api/auth', authRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/chat', chatRoutes);

// ─── Error Handler ───────────────────────────────────────────
app.use(errorHandler);

// ─── Start Server ────────────────────────────────────────────
const PORT = process.env.PORT || 5000;

const startServer = async (retries = 3) => {
  try {
    await sequelize.authenticate();
    console.log('✅ Database connected successfully');

    await sequelize.sync({ alter: true });
    console.log('✅ Models synchronized');

    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📍 Health check: http://localhost:${PORT}/api/health`);
    });
  } catch (error) {
    if (retries > 0) {
      console.warn(`⚠️  DB connection failed (${error.message}). Retrying in 5s... (${retries} attempts left)`);
      setTimeout(() => startServer(retries - 1), 5000);
    } else {
      console.error('❌ Unable to start server:', error.message);
      process.exit(1);
    }
  }
};

startServer();

