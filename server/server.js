import dotenv from 'dotenv';
dotenv.config();

import app from './src/app.js';
import connectDB from './src/config/database.js';

const PORT = Number(process.env.PORT) || 3000;

async function startServer() {
    await connectDB();

    const server = app.listen(PORT, () => {
        console.log(`Prepify Server running on port ${PORT}`);
        console.log(` API Health Check: http://localhost:${PORT}/api/health`);
    });

    // Handle termination signals gracefully
    process.on('SIGTERM', () => {
        console.log('SIGTERM received. Shutting down gracefully...');
        server.close(() => {
            console.log('Server closed.');
            process.exit(0);
        });
    });

    process.on('unhandledRejection', (reason) => {
        console.error('Unhandled Rejection at:', reason);
    });

    process.on('uncaughtException', (err) => {
        console.error('Uncaught Exception:', err);
    });
}

startServer();