const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { sendMessage, getHistory } = require('../controllers/chatController');

// All chat routes require authentication
router.post('/', auth, sendMessage);
router.get('/history', auth, getHistory);

module.exports = router;
