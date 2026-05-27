const jwt = require('jsonwebtoken');
const userModel = require('../models/user.model.js');
const tokenBlackListModel = require('../models/blackList.model.js');

function authMiddleware(req, res, next) {

    try {

        const token = req.cookies.token;

        if (!token) {
            return res.status(401).json({
                message: "Unauthorized"
            });
        }

        const isBlackListed = tokenBlackListModel.findOne({ token });

        if (isBlackListed) {
            return res.status(401).json({
                message: "Unauthorized access, token is missing"
            });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        req.user = decoded;

        next();

    } catch (err) {

        return res.status(401).json({
            message: "Invalid token"
        });

    }

}

async function authSystemUserMiddleware(req, res, next) {

    const token =
        req.cookies.token ||
        req.headers.authorization?.split(" ")[1];

    if (!token) {
        return res.status(401).json({
            message: "Unauthorized access, token is missing"
        });
    }

    const isBlackListed = await tokenBlackListModel.findOne({ token });

    if (isBlackListed) {
        return res.status(401).json({
            message: "Unauthorized access, token is blacklisted"
        });
    }

    try {

        const decoded = jwt.verify(
            token,
            process.env.JWT_SECRET
        );

        const user = await userModel
            .findById(decoded.userId)
            .select("+systemuser");

        if (!user) {
            return res.status(404).json({
                message: "User not found"
            });
        }

        if (!user.systemuser) {
            return res.status(403).json({
                message: "Forbidden access, not a system user"
            });
        }

        req.user = user;

        return next();

    } catch (err) {

        return res.status(401).json({
            message: "Unauthorized access, token is invalid"
        });

    }

}

module.exports = {
    authMiddleware,
    authSystemUserMiddleware
};