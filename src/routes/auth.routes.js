const express = require('express');
const router = express.Router();

const {
    userRegisterController,
    userLoginController
} = require('../controllers/auth.controller.js');

router.post('/register', userRegisterController);
router.post('/login', userLoginController);

module.exports = router;