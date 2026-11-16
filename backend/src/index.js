import express from 'express';
import authRoutes from './routes/auth.route.js';
import messageRoutes from './routes/message.route.js';
import friendRoutes from "./routes/friend.route.js";
import dotenv from 'dotenv';
import connectDB from './lib/db.js';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import { app, server } from './lib/socket.js'

// const app = express();
dotenv.config();
const PORT = process.env.PORT
    // middlewares to extract json data from request body
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ limit: "10mb", extended: true }));
app.use(cookieParser());
app.use(cors({
    origin: "http://localhost:5173",
    credentials: true
}))

// routes
app.use('/api/auth', authRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/friends', friendRoutes);

// server.listen(PORT, () => {
//     console.log('Server is running on port:' + PORT);
//     connectDB();
// })

const startServer = async() => {
    try {
        await connectDB();

        server.listen(PORT, () => {
            console.log(`Server is running on port: ${PORT}`);
        });
    } catch (error) {
        console.error("Failed to start the application:", error);
        process.exit(1);
    }
};

startServer();