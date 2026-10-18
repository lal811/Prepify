import jwt from 'jsonwebtoken';
import TokenBlacklistModel from '../models/blacklist.model.js';
import UserModel from '../models/user.model.js';

async function authUser(req, res, next) {
    try {
        let token = req.cookies?.token;

        if (!token && req.headers?.authorization) {
            const authHeader = req.headers.authorization;
            if (authHeader.startsWith('Bearer ')) {
                token = authHeader.split(' ')[1];
            }
        }

        if (!token) {
            return res.status(401).json({ 
                message: "Authentication required. Please log in to continue." 
            });
        }

        // Verify blacklist status
        try {
            const isBlacklisted = await TokenBlacklistModel.findOne({ token });
            if (isBlacklisted) {
                return res.status(401).json({ 
                    message: "Session has ended. Please log in again." 
                });
            }
        } catch (dbErr) {
            console.error("Blacklist check error:", dbErr.message);
        }

        const secret = process.env.JWT_SECRET || 'prepify_jwt_fallback_secret_32_characters';
        const decoded = jwt.verify(token, secret);

        // Fetch user from DB to ensure account still exists
        const user = await UserModel.findById(decoded.id).select('-password');
        if (!user) {
            return res.status(401).json({ 
                message: "User session is invalid. Account not found." 
            });
        }

        req.user = {
            id: user._id.toString(),
            username: user.username,
            email: user.email
        };
        req.token = token;

        next();
    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ 
                message: "Session has expired. Please log in again." 
            });
        }
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({ 
                message: "Invalid session token. Please log in again." 
            });
        }
        return res.status(401).json({ 
            message: "Authentication failed. Please log in again." 
        });
    }
}

export default authUser;