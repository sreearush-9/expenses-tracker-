const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const {
  getSummary,
  getCategoryBreakdown,
  getMonthlyTrend,
} = require('../controllers/analyticsController');

router.use(auth);

router.get('/summary', getSummary);
router.get('/category-breakdown', getCategoryBreakdown);
router.get('/monthly-trend', getMonthlyTrend);

module.exports = router;
