const { Op, fn, col, literal } = require('sequelize');
const Transaction = require('../models/Transaction');
const Category = require('../models/Category');
const sequelize = require('../config/db');

exports.getSummary = async (req, res, next) => {
  try {
    const { month, year } = req.query;
    const where = { userId: req.user.id };

    if (month && year) {
      const startDate = new Date(year, month - 1, 1);
      const endDate = new Date(year, month, 0);
      where.date = {
        [Op.between]: [
          startDate.toISOString().split('T')[0],
          endDate.toISOString().split('T')[0],
        ],
      };
    }

    const income = await Transaction.sum('amount', {
      where: { ...where, type: 'income' },
    }) || 0;

    const expense = await Transaction.sum('amount', {
      where: { ...where, type: 'expense' },
    }) || 0;

    const transactionCount = await Transaction.count({ where });

    const recentTransactions = await Transaction.findAll({
      where: { userId: req.user.id },
      include: [{ model: Category, as: 'category', attributes: ['id', 'name', 'type', 'color'] }],
      order: [['date', 'DESC'], ['createdAt', 'DESC']],
      limit: 5,
    });

    res.json({
      summary: {
        totalIncome: parseFloat(income),
        totalExpense: parseFloat(expense),
        balance: parseFloat(income) - parseFloat(expense),
        transactionCount,
      },
      recentTransactions,
    });
  } catch (error) {
    next(error);
  }
};

exports.getCategoryBreakdown = async (req, res, next) => {
  try {
    const { type = 'expense', month, year } = req.query;
    const where = { userId: req.user.id, type };

    if (month && year) {
      const startDate = new Date(year, month - 1, 1);
      const endDate = new Date(year, month, 0);
      where.date = {
        [Op.between]: [
          startDate.toISOString().split('T')[0],
          endDate.toISOString().split('T')[0],
        ],
      };
    }

    const breakdown = await Transaction.findAll({
      where,
      attributes: [
        'categoryId',
        [fn('SUM', col('amount')), 'total'],
        [fn('COUNT', col('Transaction.id')), 'count'],
      ],
      include: [{
        model: Category,
        as: 'category',
        attributes: ['name', 'color'],
      }],
      group: ['categoryId', 'category.id', 'category.name', 'category.color'],
      order: [[literal('total'), 'DESC']],
      raw: true,
      nest: true,
    });

    res.json({ breakdown });
  } catch (error) {
    next(error);
  }
};

exports.getMonthlyTrend = async (req, res, next) => {
  try {
    const { months = 6 } = req.query;
    const trends = [];

    for (let i = parseInt(months) - 1; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const year = date.getFullYear();
      const month = date.getMonth();

      const startDate = new Date(year, month, 1).toISOString().split('T')[0];
      const endDate = new Date(year, month + 1, 0).toISOString().split('T')[0];

      const income = await Transaction.sum('amount', {
        where: {
          userId: req.user.id,
          type: 'income',
          date: { [Op.between]: [startDate, endDate] },
        },
      }) || 0;

      const expense = await Transaction.sum('amount', {
        where: {
          userId: req.user.id,
          type: 'expense',
          date: { [Op.between]: [startDate, endDate] },
        },
      }) || 0;

      trends.push({
        month: date.toLocaleString('default', { month: 'short' }),
        year,
        income: parseFloat(income),
        expense: parseFloat(expense),
        balance: parseFloat(income) - parseFloat(expense),
      });
    }

    res.json({ trends });
  } catch (error) {
    next(error);
  }
};
