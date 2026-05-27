const accountModel = require('../models/account.model.js');

async function createAccountController(req, res) {

    try {

        const userId = req.user.userId;

        const account = await accountModel.create({
            user: userId,
            status: "ACTIVE"
        });

        res.status(201).json({
            message: "Account created successfully",
            account
        });

    } catch (error) {

        console.log("🔥 ACCOUNT ERROR:", error);

        res.status(500).json({
            message: "Server error"
        });

    }

}

async function getUserAccountsController(req, res) {

    try {

        const account = await accountModel.findOne({
            user: req.user.userId
        });

        res.status(200).json({
            account
        });

    } catch (error) {

        res.status(500).json({
            message: "Server error"
        });

    }

}

async function getAccountBalanceController(req, res) {

    try {

        const { accountId } = req.params;

        const account = await accountModel.findOne({
            _id: accountId,
            user: req.user.userId
        });

        if (!account) {
            return res.status(404).json({
                message: "Account not found"
            });
        }

        const balance = await account.getBalance();

        res.status(200).json({
            accountId: account._id,
            balance: balance
        });

    } catch (error) {

        console.log(error);

        res.status(500).json({
            message: "Server error"
        });

    }

}

module.exports = {
    createAccountController,
    getUserAccountsController,
    getAccountBalanceController
};