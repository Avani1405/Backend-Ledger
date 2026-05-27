const transactionModel = require('../models/transaction.model.js');
const ledgerModel = require('../models/ledger.model.js');
const emailService = require('../services/email.service.js');
const accountModel = require('../models/account.model.js');
const mongoose = require('mongoose');

async function createTransactionController(req, res) {

    try {

        const { fromAccount, toAccount, amount, idempotencyKey } = req.body;

        if (!fromAccount || !toAccount || !amount || !idempotencyKey) {
            return res.status(400).json({
                message: "All fields are required"
            });
        }

        const fromUserAccount = await accountModel.findOne({ _id: fromAccount });

        const toUserAccount = await accountModel.findOne({ _id: toAccount });

        if (!fromUserAccount || !toUserAccount) {
            return res.status(404).json({
                message: "One or both accounts not found"
            });
        }

        // Validate Idempotency Key

        const isTransationAlreadyExists = await transactionModel.findOne({
            idempotencyKey: idempotencyKey
        });

        if (isTransationAlreadyExists) {

            if (isTransationAlreadyExists.status === "COMPLETED") {
                return res.status(200).json({
                    message: "Transaction already completed",
                    transaction: isTransationAlreadyExists
                });
            }

            if (isTransationAlreadyExists.status === "PENDING") {
                return res.status(200).json({
                    message: "Transaction is still pending",
                    transaction: isTransationAlreadyExists
                });
            }

            if (isTransationAlreadyExists.status === "FAILED") {
                return res.status(200).json({
                    message: "Transaction failed",
                    transaction: isTransationAlreadyExists
                });
            }

            if (isTransationAlreadyExists.status === "REVERSED") {
                return res.status(500).json({
                    message: "Transaction was reversed",
                    transaction: isTransationAlreadyExists
                });
            }

        }

        // Check Account Status

        if (
            fromUserAccount.status !== "ACTIVE" ||
            toUserAccount.status !== "ACTIVE"
        ) {
            return res.status(400).json({
                message: "Both accounts must be active to perform a transaction"
            });
        }

        // Derive Sender balance from Ledger

        const balance = await fromUserAccount.getBalance();

        if (balance < amount) {
            return res.status(400).json({
                message: `Insufficient balance. Current balance is ${balance}. Requested amount is ${amount}`
            });
        }

        // Create Transaction

        const session = await mongoose.startSession();

        session.startTransaction();

        const transaction = await transactionModel.create([{
            fromAccount,
            toAccount,
            amount,
            idempotencyKey,
            status: "PENDING"
        }], { session });

        await ledgerModel.create([{
            account: fromAccount,
            type: "DEBIT",
            amount: amount,
            transaction: transaction[0]._id
        }], { session });

        await ledgerModel.create([{
            account: toAccount,
            type: "CREDIT",
            amount: amount,
            transaction: transaction[0]._id
        }], { session });

        transaction[0].status = "COMPLETED";

        await( () => {
            return new Promise((resolve) => setTimeout(resolve, 15*1000));
        }) ();

        await transaction[0].save({ session });

        await session.commitTransaction();

        await session.endSession();

        // Send Email Notification

        await emailService.sendEmail(
            req.user.email,
            req.user.name,
            amount,
            toUserAccount.user?.name || "User"
        );

        return res.status(200).json({
            message: "Transaction completed successfully",
            transaction: transaction[0]
        });

    } catch (error) {

        console.log(error);

        return res.status(500).json({
            message: "Internal Server Error",
            error: error.message
        });

    }

}

async function createInitialFundsTransaction(req, res) {

    try {

        const { toAccount, amount, idempotencyKey } = req.body;

        if (!toAccount || !amount || !idempotencyKey) {
            return res.status(400).json({
                message: "All fields are required"
            });
        }

        const toUserAccount = await accountModel.findOne({
            _id: toAccount
        });

        if (!toUserAccount) {
            return res.status(404).json({
                message: "User account not found"
            });
        }

        const fromUserAccount = await accountModel.findOne({
            user: req.user._id
        });

        if (!fromUserAccount) {
            return res.status(404).json({
                message: "System user account not found"
            });
        }

        const session = await mongoose.startSession();

        session.startTransaction();

        const transaction = await transactionModel.create([{
            fromAccount: fromUserAccount._id,
            toAccount,
            amount,
            idempotencyKey,
            status: "PENDING"
        }], { session });

        await ledgerModel.create([{
            account: fromUserAccount._id,
            type: "DEBIT",
            amount: amount,
            transaction: transaction[0]._id
        }], { session });

        await ledgerModel.create([{
            account: toAccount,
            type: "CREDIT",
            amount: amount,
            transaction: transaction[0]._id
        }], { session });

        transaction[0].status = "COMPLETED";

        await transaction[0].save({ session });

        await session.commitTransaction();

        await session.endSession();

        return res.status(201).json({
            message: "Initial funds transaction completed successfully",
            transaction: transaction[0]
        });

    } catch (error) {

        console.log(error);

        return res.status(500).json({
            message: "Internal Server Error",
            error: error.message
        });

    }

}

module.exports = {
    createTransactionController,
    createInitialFundsTransaction
};