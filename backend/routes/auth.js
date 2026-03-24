const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { register, login, getMe, registerValidation, loginValidation } = require('../controllers/authController');

router.post('/register', registerValidation, register);
router.post('/login', loginValidation, login);
router.get('/me', auth, getMe);

module.exports = router;
