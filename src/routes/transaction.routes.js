const { Router } = require('express');

const authMiddleware = require('../middleware/auth.middleware.js');
const transactionController = require('../controllers/transaction.controller.js');

const transactionRoutes = Router();

transactionRoutes.post(
    "/",
    authMiddleware.authMiddleware,
    transactionController.createTransactionController
);

transactionRoutes.post(
    "/system/initial-funds",
    authMiddleware.authSystemUserMiddleware,
    transactionController.createInitialFundsTransaction
);

module.exports = transactionRoutes;