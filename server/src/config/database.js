import mongoose from "mongoose";

const connectDB = async () => {
    const uri = process.env.MONGODB_URI;
    if (!uri) {
        console.warn("⚠️  [MONGODB] MONGODB_URI is not defined in environment variables.");
       
        return false;
    }

    try {
        await mongoose.connect(uri);
        console.log(" Connected successfully to Database");
        return true;
    } catch (error) {
        console.error("  Connection error:", error.message);
        throw error;
    }
};

export default connectDB;