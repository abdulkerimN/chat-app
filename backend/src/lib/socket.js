import { Server } from "socket.io";
import http from "http";
import express from "express";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";

import User from "../models/user.model.js";
import Friendship from "../models/friendship.model.js";
import Message from "../models/message.model.js";

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
    cors: {
        origin: "http://localhost:5173",
        credentials: true,
    },
});

// Store multiple socket connections for each user.
const userSocketMap = new Map();

// Get all active socket IDs belonging to a user.
export function getReceiverSocketId(userId) {
    return [...(userSocketMap.get(userId.toString()) || [])];
}

// Read the JWT cookie from the Socket.IO handshake.
const getTokenFromCookie = (cookieHeader) => {
    if (!cookieHeader) return null;

    const jwtCookie = cookieHeader
        .split(";")
        .map((cookie) => cookie.trim())
        .find((cookie) => cookie.startsWith("jwt="));

    return jwtCookie ?
        decodeURIComponent(jwtCookie.substring(4)) :
        null;
};

// Authenticate the socket connection.
io.use(async(socket, next) => {
    try {
        const token = getTokenFromCookie(
            socket.handshake.headers.cookie
        );

        if (!token) {
            return next(new Error("Unauthorized: No token"));
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        const user = await User.findById(decoded.userId).select("_id");

        if (!user) {
            return next(new Error("Unauthorized: User not found"));
        }

        socket.data.userId = user._id.toString();

        next();
    } catch (error) {
        console.error("Socket authentication error:", error.message);
        next(new Error("Unauthorized: Invalid or expired token"));
    }
});

// Check whether two users are accepted friends.
const areFriends = async(userId, receiverId) => {
    if (!mongoose.Types.ObjectId.isValid(receiverId)) {
        return false;
    }

    if (userId.toString() === receiverId.toString()) {
        return false;
    }

    const friendship = await Friendship.findOne({
        status: "accepted",
        $or: [{
                requester: userId,
                recipient: receiverId,
            },
            {
                requester: receiverId,
                recipient: userId,
            },
        ],
    });

    return Boolean(friendship);
};

// Send an event to every active connection of a user.
const sendToUser = (userId, eventName, data) => {
    const socketIds = getReceiverSocketId(userId);

    socketIds.forEach((socketId) => {
        io.to(socketId).emit(eventName, data);
    });
};

io.on("connection", (socket) => {
    const userId = socket.data.userId;

    console.log("A user connected:", userId, socket.id);

    const userSockets = userSocketMap.get(userId) || new Set();

    userSockets.add(socket.id);
    userSocketMap.set(userId, userSockets);

    io.emit("getOnlineUsers", [...userSocketMap.keys()]);

    // Someone started typing.
    socket.on("typing", async(data) => {
        try {
            if (!data || !data.receiverId) return;

            const receiverId = data.receiverId;
            const allowed = await areFriends(userId, receiverId);

            if (!allowed) return;

            sendToUser(receiverId, "userTyping", {
                senderId: userId,
            });
        } catch (error) {
            console.error("Typing event error:", error.message);
        }
    });

    // Someone stopped typing.
    socket.on("stopTyping", async(data) => {
        try {
            if (!data || !data.receiverId) return;

            const receiverId = data.receiverId;
            const allowed = await areFriends(userId, receiverId);

            if (!allowed) return;

            sendToUser(receiverId, "userStoppedTyping", {
                senderId: userId,
            });
        } catch (error) {
            console.error("Stop typing error:", error.message);
        }
    });

    // Recipient confirms that a message reached their device.
    socket.on("messageDelivered", async(data) => {
        try {
            if (!data || !data.messageId) return;

            if (!mongoose.Types.ObjectId.isValid(data.messageId)) {
                return;
            }

            // Only the actual recipient can confirm delivery.
            const message = await Message.findOne({
                _id: data.messageId,
                receiverId: userId,
            });

            if (!message) return;

            const allowed = await areFriends(
                userId,
                message.senderId.toString()
            );

            if (!allowed) return;

            // Never change a message that has already been read.
            if (message.status === "sent") {
                message.status = "delivered";
                message.deliveredAt = new Date();

                await message.save();
            }

            // Notify the sender of the current status.
            sendToUser(message.senderId, "messageStatusUpdated", {
                messageId: message._id.toString(),
                status: message.status,
                deliveredAt: message.deliveredAt,
                readAt: message.readAt,
            });
        } catch (error) {
            console.error("Message delivery error:", error.message);
        }
    });

    // Recipient opens a conversation and marks messages as read.
    socket.on("markMessagesAsRead", async(data) => {
        try {
            if (!data || !data.senderId) return;

            const senderId = data.senderId;

            const allowed = await areFriends(userId, senderId);

            if (!allowed) return;

            // Find unread messages sent by this friend to the current user.
            const unreadMessages = await Message.find({
                senderId: senderId,
                receiverId: userId,
                status: { $ne: "read" },
            }).select("_id");

            if (unreadMessages.length === 0) return;

            const readAt = new Date();

            await Message.updateMany({
                senderId: senderId,
                receiverId: userId,
                status: { $ne: "read" },
            }, {
                $set: {
                    status: "read",
                    deliveredAt: readAt,
                    readAt: readAt,
                },
            });

            // Notify the original sender.
            sendToUser(senderId, "messagesRead", {
                messageIds: unreadMessages.map((message) =>
                    message._id.toString()
                ),
                readAt: readAt,
            });
        } catch (error) {
            console.error("Mark messages as read error:", error.message);
        }
    });

    socket.on("disconnect", () => {
        console.log("A user disconnected:", userId, socket.id);

        const userSockets = userSocketMap.get(userId);

        if (userSockets) {
            userSockets.delete(socket.id);

            if (userSockets.size === 0) {
                userSocketMap.delete(userId);
            }
        }

        io.emit("getOnlineUsers", [...userSocketMap.keys()]);
    });
});

export { io, app, server };