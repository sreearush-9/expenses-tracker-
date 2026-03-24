const { validationResult, body } = require('express-validator');
const Category = require('../models/Category');

exports.categoryValidation = [
  body('name').trim().isLength({ min: 1, max: 50 }).withMessage('Category name is required (max 50 chars)'),
  body('type').isIn(['income', 'expense']).withMessage('Type must be income or expense'),
  body('color').optional().isHexColor().withMessage('Color must be valid hex'),
];

exports.getCategories = async (req, res, next) => {
  try {
    const { type } = req.query;
    const where = { userId: req.user.id };
    if (type) where.type = type;

    const categories = await Category.findAll({
      where,
      order: [['name', 'ASC']],
    });

    res.json({ categories });
  } catch (error) {
    next(error);
  }
};

exports.createCategory = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, type, color } = req.body;

    const existing = await Category.findOne({
      where: { name, type, userId: req.user.id },
    });
    if (existing) {
      return res.status(400).json({ message: 'Category already exists' });
    }

    const category = await Category.create({
      name,
      type,
      color: color || '#6366f1',
      userId: req.user.id,
    });

    res.status(201).json({ category });
  } catch (error) {
    next(error);
  }
};

exports.updateCategory = async (req, res, next) => {
  try {
    const category = await Category.findOne({
      where: { id: req.params.id, userId: req.user.id },
    });

    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }

    const { name, type, color } = req.body;
    if (name) category.name = name;
    if (type) category.type = type;
    if (color) category.color = color;

    await category.save();
    res.json({ category });
  } catch (error) {
    next(error);
  }
};

exports.deleteCategory = async (req, res, next) => {
  try {
    const category = await Category.findOne({
      where: { id: req.params.id, userId: req.user.id },
    });

    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }

    await category.destroy();
    res.json({ message: 'Category deleted successfully' });
  } catch (error) {
    next(error);
  }
};
