import mongoose from 'mongoose';

const blacklistTokenSchema = new mongoose.Schema(
    {
        token: {
            type: String,
            required: [true, 'Token is required'],
            unique: true,
            index: true
        },
        createdAt: {
            type: Date,
            default: Date.now,
            expires: 60 * 60 * 24 * 7 // Automatically remove from DB after 7 days
        }
    },
    {
        timestamps: false
    }
);

const TokenBlacklistModel = mongoose.models.TokenBlackList || mongoose.model("TokenBlackList", blacklistTokenSchema);

export default TokenBlacklistModel;