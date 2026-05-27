const userModel = require('../models/user.model.js');
const jwt = require('jsonwebtoken');
const emailService = require('../services/email.service.js');
const tokenBlackListModel = require('../models/blackList.model.js');

// ================= REGISTER =================
async function userRegisterController(req, res) {
    try {
        const { email, name, password } = req.body;

        if (!email || !name || !password) {
            return res.status(400).json({
                message: "All fields are required",
                status: "failed"
            });
        }

        const isExists = await userModel.findOne({ email });

        if (isExists) {
            return res.status(422).json({
                message: "Email already exists",
                status: "failed"
            });
        }

        const user = await userModel.create({
            email,
            name,
            password
        });

        const token = jwt.sign(
            { userId: user._id },
            process.env.JWT_SECRET || "secret123",
            { expiresIn: '3d' }
        );

        res.cookie("token", token, { httpOnly: true });

        // ✅ SEND EMAIL BEFORE RESPONSE (IMPORTANT)
        try {
            await emailService.sendRegistrationEmail(user.email, user.name);
            console.log("📧 Email sent successfully");
        } catch (err) {
            console.log("❌ Email failed:", err.message);
        }

        // ✅ RESPONSE AFTER EMAIL
        return res.status(201).json({
            message: "User registered successfully",
            user: {
                _id: user._id,
                email: user.email,
                name: user.name
            },
            token
        });

    } catch (error) {
        console.log("🔥 REGISTER ERROR:", error);

        return res.status(500).json({
            message: "Server error",
            status: "failed"
        });
    }
}


// ================= LOGIN =================
async function userLoginController(req, res) {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                message: "Email and password are required",
                status: "failed"
            });
        }

        const user = await userModel.findOne({ email });

        if (!user) {
            return res.status(401).json({
                message: "Email or password is INVALID",
                status: "failed"
            });
        }

        const isValidPassword = await user.comparePassword(password);

        if (!isValidPassword) {
            return res.status(401).json({
                message: "Email or password is INVALID",
                status: "failed"
            });
        }

        const token = jwt.sign(
            { userId: user._id },
            process.env.JWT_SECRET || "secret123",
            { expiresIn: '3d' }
        );

        res.cookie("token", token, { httpOnly: true });

        return res.status(200).json({
            message: "Login successful",
            user: {
                _id: user._id,
                email: user.email,
                name: user.name
            },
            token
        });

    } catch (error) {
        console.log("🔥 LOGIN ERROR:", error);

        return res.status(500).json({
            message: "Server error",
            status: "failed"
        });
    }
}

// ================= LOGOUT =================
async function userLogoutController(req, res) {
    const token = req.cookies.token || req.headers.authorization?.split(" ")[1];

    if(!token) {
        return res.status(400).json({
            message: "No token provided"
        });
    }

    res.cookie("token","")

    await tokenBlackListModel.create({
        token:token
    }); 

    res.status(200).json({
        message: "Logout successful"
    });
}

module.exports = {
    userRegisterController,
    userLoginController
};