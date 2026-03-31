const { GoogleGenerativeAI } = require('@google/generative-ai');
const Transaction = require('../models/Transaction');
const Category = require('../models/Category');
const ChatMessage = require('../models/ChatMessage');

// Build a rich system prompt using the user's expense data
const buildSystemPrompt = (transactions) => {
  const total = transactions.reduce((sum, t) => sum + parseFloat(t.amount), 0);
  const count = transactions.length;
  const avg = count > 0 ? (total / count).toFixed(2) : 0;

  // Top categories by spend
  const categoryMap = {};
  transactions.forEach((t) => {
    const name = t.category?.name || t.description || 'Uncategorized';
    categoryMap[name] = (categoryMap[name] || 0) + parseFloat(t.amount);
  });
  const topCategories = Object.entries(categoryMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([name, amt]) => `  - ${name}: ₹${amt.toFixed(2)}`)
    .join('\n');

  // Detect potential anomalies (expenses > 2× average)
  const anomalies = transactions
    .filter((t) => parseFloat(t.amount) > avg * 2)
    .map((t) => `  - ${t.description}: ₹${t.amount} on ${t.date}`)
    .slice(0, 5)
    .join('\n');

  // Recent 10 transactions for context
  const recent = transactions
    .slice(0, 10)
    .map((t) => `  - ${t.description}: ₹${t.amount} on ${t.date}`)
    .join('\n');

  return `You are an intelligent, friendly personal finance assistant for an expense tracker app.
You help users understand their spending habits, identify patterns, suggest budgets, and provide savings tips.
Always respond in a concise, friendly, and actionable tone. Use ₹ (Indian Rupee) for all amounts.

Here is a summary of the user's recent expenses (last ${count} transactions):

📊 SPENDING OVERVIEW:
- Total spent: ₹${total.toFixed(2)}
- Number of transactions: ${count}
- Average transaction: ₹${avg}

🏷️ TOP SPENDING CATEGORIES:
${topCategories || '  - No category data available'}

⚠️ UNUSUALLY LARGE EXPENSES (>2× average):
${anomalies || '  - None detected — great spending discipline!'}

🕐 RECENT TRANSACTIONS:
${recent || '  - No recent transactions'}

Based on this data, answer the user's questions with specific insights and actionable advice.
If the user asks something unrelated to finance, politely redirect them to financial topics.`;
};

// POST /api/chat — send a message and get AI response
exports.sendMessage = async (req, res, next) => {
  try {
    const { message } = req.body;
    if (!message || !message.trim()) {
      return res.status(400).json({ message: 'Message is required' });
    }

    if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === 'your_gemini_api_key_here') {
      return res.status(503).json({
        message: 'Gemini API key not configured. Please add GEMINI_API_KEY to your backend .env file. Get a free key at https://aistudio.google.com/app/apikey',
      });
    }

    // Fetch user's recent transactions with category info
    const transactions = await Transaction.findAll({
      where: { userId: req.user.id },
      include: [{ model: Category, as: 'category', attributes: ['name', 'type', 'color'] }],
      order: [['date', 'DESC'], ['createdAt', 'DESC']],
      limit: 50,
    });

    // Build conversation history (last 8 messages)
    const history = await ChatMessage.findAll({
      where: { userId: req.user.id },
      order: [['createdAt', 'DESC']],
      limit: 8,
    });
    // Gemini expects alternating user/model roles
    const conversationHistory = history.reverse().map((m) => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }],
    }));

    // Persist user message to DB
    await ChatMessage.create({
      userId: req.user.id,
      role: 'user',
      content: message.trim(),
    });

    // Call Gemini
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.0-flash',
      systemInstruction: buildSystemPrompt(transactions),
    });

    const chat = model.startChat({
      history: conversationHistory,
      generationConfig: { maxOutputTokens: 600, temperature: 0.7 },
    });

    const result = await chat.sendMessage(message.trim());
    const reply = result.response.text();

    // Persist assistant response
    await ChatMessage.create({
      userId: req.user.id,
      role: 'assistant',
      content: reply,
    });

    res.json({ reply });
  } catch (error) {
    // Handle Gemini-specific errors gracefully
    if (error.message?.includes('429') || error.message?.includes('quota') || error.message?.includes('Too Many Requests')) {
      return res.status(429).json({ message: 'AI is busy right now — please wait a moment and try again.' });
    }
    if (error.message?.includes('API_KEY') || error.message?.includes('API key')) {
      return res.status(503).json({ message: 'Gemini API key is invalid. Please check your GEMINI_API_KEY in .env' });
    }
    next(error);
  }
};

// GET /api/chat/history — fetch last 20 messages for this user
exports.getHistory = async (req, res, next) => {
  try {
    const messages = await ChatMessage.findAll({
      where: { userId: req.user.id },
      order: [['createdAt', 'ASC']],
      limit: 20,
      attributes: ['id', 'role', 'content', 'createdAt'],
    });
    res.json({ messages });
  } catch (error) {
    next(error);
  }
};
