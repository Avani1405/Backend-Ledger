const mongoose = require('mongoose');



const tokenBlackListSchema = new mongoose.Schema({
    token: {
        type: String,
        required: [true, "Token is required"],
        unique: [true, "Toen is already blacklisted"],
    },
    blackListedAt: {
        type: Date,
        default: Date.now,
        immutable: true
    }
}, {
    timestamps: true
});
 
tokenBlackListSchema.index({ blackKistedAt: 1 }, { expireAfterSeconds: 60 * 60 * 24 * 3 });
