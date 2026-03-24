const { validationResult, body } = require('express-validator');
const { Op } = require('sequelize');
const Transaction = require('../models/Transaction');
const Category = require('../models/Category');

exports.transactionValidation = [
  body('amount').isFloat({ min: 0.01 }).withMessage('Amount must be a positive number'),
  body('type').isIn(['income', 'expense']).withMessage('Type must be income or expense'),
  body('description').trim().isLength({ min: 1 }).withMessage('Description is required'),
  body('date').isISO8601().withMessage('Valid date is required'),
  body('categoryId').optional({ nullable: true }).isInt().withMessage('Category ID must be a number'),
];

exports.getTransactions = async (req, res, next) => {
  try {
    const { type, categoryId, startDate, endDate, page = 1, limit = 20 } = req.query;
    const where = { userId: req.user.id };

    if (type) where.type = type;
    if (categoryId) where.categoryId = categoryId;
    if (startDate && endDate) {
      where.date = { [Op.between]: [startDate, endDate] };
    } else if (startDate) {
      where.date = { [Op.gte]: startDate };
    } else if (endDate) {
      where.date = { [Op.lte]: endDate };
    }

    const offset = (parseInt(page) - 1) * parseInt(limit);

    const { count, rows: transactions } = await Transaction.findAndCountAll({
      where,
      include: [{ model: Category, as: 'category', attributes: ['id', 'name', 'type', 'color'] }],
      order: [['date', 'DESC'], ['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset,
    });

    res.json({
      transactions,
      pagination: {
        total: count,
        page: parseInt(page),
        pages: Math.ceil(count / parseInt(limit)),
      },
    });
  } catch (error) {
    next(error);
  }
};

exports.getTransaction = async (req, res, next) => {
  try {
    const transaction = await Transaction.findOne({
      where: { id: req.params.id, userId: req.user.id },
      include: [{ model: Category, as: 'category', attributes: ['id', 'name', 'type', 'color'] }],
    });

    if (!transaction) {
      return res.status(404).json({ message: 'Transaction not found' });
    }

    res.json({ transaction });
  } catch (error) {
    next(error);
  }
};

exports.createTransaction = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { amount, type, description, date, categoryId } = req.body;

    const transaction = await Transaction.create({
      amount,
      type,
      description,
      date,
      categoryId: categoryId || null,
      userId: req.user.id,
    });

    const fullTransaction = await Transaction.findByPk(transaction.id, {
      include: [{ model: Category, as: 'category', attributes: ['id', 'name', 'type', 'color'] }],
    });

    res.status(201).json({ transaction: fullTransaction });
  } catch (error) {
    next(error);
  }
};

exports.updateTransaction = async (req, res, next) => {
  try {
    const transaction = await Transaction.findOne({
      where: { id: req.params.id, userId: req.user.id },
    });

    if (!transaction) {
      return res.status(404).json({ message: 'Transaction not found' });
    }

    const { amount, type, description, date, categoryId } = req.body;
    if (amount !== undefined) transaction.amount = amount;
    if (type) transaction.type = type;
    if (description) transaction.description = description;
    if (date) transaction.date = date;
    if (categoryId !== undefined) transaction.categoryId = categoryId;

    await transaction.save();

    const fullTransaction = await Transaction.findByPk(transaction.id, {
      include: [{ model: Category, as: 'category', attributes: ['id', 'name', 'type', 'color'] }],
    });

    res.json({ transaction: fullTransaction });
  } catch (error) {
    next(error);
  }
};

exports.deleteTransaction = async (req, res, next) => {
  try {
    const transaction = await Transaction.findOne({
      where: { id: req.params.id, userId: req.user.id },
    });

    if (!transaction) {
      return res.status(404).json({ message: 'Transaction not found' });
    }

    await transaction.destroy();
    res.json({ message: 'Transaction deleted successfully' });
  } catch (error) {
    next(error);
  }
};
