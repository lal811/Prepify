import UserModel from "../models/user.model.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import TokenBlacklistModel from "../models/blacklist.model.js";

const COOKIE_NAME = "token";
const ONE_DAY_MS = 24 * 60 * 60 * 1000;

function getCookieOptions() {
    const isProd = process.env.NODE_ENV === "production";
    return {
        httpOnly: true,
        secure: isProd,
        sameSite: isProd ? "none" : "lax",
        path: "/",
        maxAge: ONE_DAY_MS
    };
}

function getJwtSecret() {
    return process.env.JWT_SECRET || "prepify_jwt_fallback_secret_32_characters";
}

// Email validator helper
function isValidEmail(email) {
    return typeof email === 'string' && /^\S+@\S+\.\S+$/.test(email.trim());
}

async function registerUserController(req, res, next) {
    try {
        let { username, email, password } = req.body;

        username = typeof username === 'string' ? username.trim() : '';
        email = typeof email === 'string' ? email.trim().toLowerCase() : '';
        password = typeof password === 'string' ? password : '';

        if (!username || !email || !password) {
            return res.status(400).json({ 
                message: "Username, email, and password are required fields." 
            });
        }

        if (username.length < 3) {
            return res.status(400).json({ 
                message: "Username must be at least 3 characters long." 
            });
        }

        if (!isValidEmail(email)) {
            return res.status(400).json({ 
                message: "Please provide a valid email address." 
            });
        }

        if (password.length < 6) {
            return res.status(400).json({ 
                message: "Password must be at least 6 characters long." 
            });
        }

        // Check for existing username or email separately for clear feedback
        const existingEmail = await UserModel.findOne({ email });
        if (existingEmail) {
            return res.status(409).json({ 
                message: "An account with this email address already exists." 
            });
        }

        const existingUsername = await UserModel.findOne({ username });
        if (existingUsername) {
            return res.status(409).json({ 
                message: "This username is already taken. Please choose another." 
            });
        }

        const hashedPassword = await bcrypt.hash(password, 12);

        const newUser = await UserModel.create({
            username,
            email,
            password: hashedPassword
        });

        const token = jwt.sign(
            { id: newUser._id.toString() }, 
            getJwtSecret(), 
            { expiresIn: "1d" }
        );

        res.cookie(COOKIE_NAME, token, getCookieOptions());

        return res.status(201).json({
            message: "Registration successful. Welcome to Prepify!",
            user: {
                id: newUser._id.toString(),
                username: newUser.username,
                email: newUser.email
            }
        });
    } catch (error) {
        next(error);
    }
}

async function loginUserController(req, res, next) {
    try {
        let { email, password } = req.body;

        email = typeof email === 'string' ? email.trim().toLowerCase() : '';
        password = typeof password === 'string' ? password : '';

        if (!email || !password) {
            return res.status(400).json({ 
                message: "Email and password are required." 
            });
        }

        const user = await UserModel.findOne({ email });
        if (!user) {
            return res.status(401).json({ 
                message: "Invalid email or password." 
            });
        }

        const isPasswordMatch = await bcrypt.compare(password, user.password);
        if (!isPasswordMatch) {
            return res.status(401).json({ 
                message: "Invalid email or password." 
            });
        }

        const token = jwt.sign(
            { id: user._id.toString() }, 
            getJwtSecret(), 
            { expiresIn: "1d" }
        );

        res.cookie(COOKIE_NAME, token, getCookieOptions());

        return res.status(200).json({
            message: "Login successful.",
            user: {
                id: user._id.toString(),
                username: user.username,
                email: user.email
            }
        });
    } catch (error) {
        next(error);
    }
}

async function logoutUserController(req, res, next) {
    try {
        const token = req.token || req.cookies?.token || req.headers?.authorization?.split(' ')[1];

        if (token) {
            try {
                await TokenBlacklistModel.updateOne(
                    { token },
                    { $setOnInsert: { token, createdAt: new Date() } },
                    { upsert: true }
                );
            } catch (blacklistErr) {
                console.error("Token blacklist record error:", blacklistErr.message);
            }
        }

        const clearOptions = { ...getCookieOptions() };
        delete clearOptions.maxAge;

        res.clearCookie(COOKIE_NAME, clearOptions);

        return res.status(200).json({ 
            message: "Logged out successfully." 
        });
    } catch (error) {
        next(error);
    }
}

async function getmeController(req, res, next) {
    try {
        if (!req.user || !req.user.id) {
            return res.status(401).json({ message: "Authentication required." });
        }

        const user = await UserModel.findById(req.user.id).select("-password");
        if (!user) {
            return res.status(404).json({ message: "User account not found." });
        }

        return res.status(200).json({
            message: "User session active.",
            user: {
                id: user._id.toString(),
                username: user.username,
                email: user.email
            }
        });
    } catch (error) {
        next(error);
    }
}

export { 
    registerUserController, 
    loginUserController, 
    logoutUserController, 
    getmeController 
};