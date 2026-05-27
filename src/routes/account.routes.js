const express = require('express');
const router = express.Router();

const authMiddleware = require('../middleware/auth.middleware.js');
const accountController = require('../controllers/account.controller.js');

router.post(
    "/",
    authMiddleware.authMiddleware,
    accountController.createAccountController
);

router.get(
    "/",
    authMiddleware.authMiddleware,
    accountController.getUserAccountsController
);

router.get(
    "/:accountId/balance",
    authMiddleware.authMiddleware,
    accountController.getAccountBalanceController
);

module.exports = router;