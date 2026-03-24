const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const {
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  categoryValidation,
} = require('../controllers/categoryController');

router.use(auth);

router.get('/', getCategories);
router.post('/', categoryValidation, createCategory);
router.put('/:id', updateCategory);
router.delete('/:id', deleteCategory);

module.exports = router;
