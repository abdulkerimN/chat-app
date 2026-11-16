import mongoose from "mongoose";
import User from "../models/user.model.js";
import Friendship from "../models/friendship.model.js";
import { io, getReceiverSocketId } from "../lib/socket.js";

// Send a Socket.IO event to every active connection of a user.
const notifyUser = (userId, eventName, data = {}) => {
    const socketIds = getReceiverSocketId(userId);

    socketIds.forEach((socketId) => {
        io.to(socketId).emit(eventName, data);
    });
};

// Search for registered users.
export const searchUsers = async(req, res) => {
    try {
        const { q } = req.query;

        if (!q || !q.trim()) {
            return res.status(200).json([]);
        }

        const users = await User.find({
                _id: { $ne: req.user._id },
                $or: [
                    { fullname: { $regex: q, $options: "i" } },
                    { email: { $regex: q, $options: "i" } },
                ],
            })
            .select("fullname profilePic")
            .limit(10);

        const results = await Promise.all(
            users.map(async(user) => {
                const friendship = await Friendship.findOne({
                    $or: [
                        { requester: req.user._id, recipient: user._id },
                        { requester: user._id, recipient: req.user._id },
                    ],
                });

                let relationshipStatus = "none";
                let requestId = null;

                if (friendship) {
                    if (friendship.status === "accepted") {
                        relationshipStatus = "friends";
                    } else if (friendship.status === "pending") {
                        if (
                            friendship.requester.toString() ===
                            req.user._id.toString()
                        ) {
                            relationshipStatus = "request_sent";
                        } else {
                            relationshipStatus = "request_received";
                            requestId = friendship._id;
                        }
                    }
                }

                return {
                    ...user.toObject(),
                    relationshipStatus,
                    requestId,
                };
            })
        );

        res.status(200).json(results);
    } catch (error) {
        console.log("Error in searchUsers:", error.message);
        res.status(500).json({ error: "Internal server error" });
    }
};

// Send a friend request.
export const sendFriendRequest = async(req, res) => {
    try {
        const { id: recipientId } = req.params;
        const requesterId = req.user._id;

        if (!mongoose.Types.ObjectId.isValid(recipientId)) {
            return res.status(400).json({ error: "Invalid user ID" });
        }

        if (requesterId.toString() === recipientId) {
            return res.status(400).json({
                error: "You cannot send a friend request to yourself",
            });
        }

        const recipient = await User.findById(recipientId);

        if (!recipient) {
            return res.status(404).json({ error: "User not found" });
        }

        const existingRequest = await Friendship.findOne({
            $or: [
                { requester: requesterId, recipient: recipientId },
                { requester: recipientId, recipient: requesterId },
            ],
        });

        const requestStatus = existingRequest && existingRequest.status;

        if (requestStatus === "accepted") {
            return res.status(409).json({
                error: "You are already friends",
            });
        }

        if (requestStatus === "pending") {
            return res.status(409).json({
                error: "A friend request already exists",
            });
        }

        if (requestStatus === "rejected") {
            existingRequest.requester = requesterId;
            existingRequest.recipient = recipientId;
            existingRequest.status = "pending";

            await existingRequest.save();

            notifyUser(recipientId, "newFriendRequest");

            return res.status(201).json({
                message: "Friend request sent successfully",
            });
        }

        await Friendship.create({
            requester: requesterId,
            recipient: recipientId,
        });

        // Notify the receiver immediately.
        notifyUser(recipientId, "newFriendRequest");

        res.status(201).json({
            message: "Friend request sent successfully",
        });
    } catch (error) {
        console.error("Error in sendFriendRequest:", error.message);
        res.status(500).json({ error: "Internal server error" });
    }
};

// Get incoming friend requests.
export const getFriendRequests = async(req, res) => {
    try {
        const requests = await Friendship.find({
            recipient: req.user._id,
            status: "pending",
        }).populate("requester", "fullname profilePic");

        res.status(200).json(requests);
    } catch (error) {
        console.error("Error in getFriendRequests:", error.message);
        res.status(500).json({ error: "Internal server error" });
    }
};

// Accept a friend request.

// Accept a friend request.
export const acceptFriendRequest = async(req, res) => {
    try {
        const { requestId } = req.params;

        if (!mongoose.Types.ObjectId.isValid(requestId)) {
            return res.status(400).json({
                error: "Invalid request ID",
            });
        }

        const request = await Friendship.findOne({
            _id: requestId,
            recipient: req.user._id,
            status: "pending",
        });

        if (!request) {
            return res.status(404).json({
                error: "Friend request not found",
            });
        }

        request.status = "accepted";
        await request.save();

        // Notify the person who sent the request.
        // Include the ID of the person who accepted it.
        notifyUser(request.requester, "friendRequestAccepted", {
            userId: req.user._id.toString(),
        });

        res.status(200).json({
            message: "Friend request accepted",
        });
    } catch (error) {
        console.error("Error in acceptFriendRequest:", error.message);
        res.status(500).json({
            error: "Internal server error",
        });
    }
};


// Reject a friend request.
export const rejectFriendRequest = async(req, res) => {
    try {
        const { requestId } = req.params;

        if (!mongoose.Types.ObjectId.isValid(requestId)) {
            return res.status(400).json({ error: "Invalid request ID" });
        }

        const request = await Friendship.findOne({
            _id: requestId,
            recipient: req.user._id,
            status: "pending",
        });

        if (!request) {
            return res.status(404).json({
                error: "Friend request not found",
            });
        }

        request.status = "rejected";
        await request.save();

        // Notify the original sender.
        notifyUser(request.requester, "friendRequestRejected", {
            userId: req.user._id.toString(),
        });

        res.status(200).json({
            message: "Friend request rejected",
        });
    } catch (error) {
        console.error("Error in rejectFriendRequest:", error.message);
        res.status(500).json({ error: "Internal server error" });
    }
};

// Remove an accepted friend.
export const removeFriend = async(req, res) => {
    try {
        const { id: friendId } = req.params;

        if (!mongoose.Types.ObjectId.isValid(friendId)) {
            return res.status(400).json({ error: "Invalid user ID" });
        }

        const result = await Friendship.deleteOne({
            status: "accepted",
            $or: [
                { requester: req.user._id, recipient: friendId },
                { requester: friendId, recipient: req.user._id },
            ],
        });

        if (result.deletedCount === 0) {
            return res.status(404).json({
                error: "Friendship not found",
            });
        }

        // Notify the other person that the friendship was removed.
        notifyUser(friendId, "friendRemoved", {
            userId: req.user._id.toString(),
        });

        res.status(200).json({
            message: "Friend removed successfully",
        });
    } catch (error) {
        console.error("Error in removeFriend:", error.message);
        res.status(500).json({ error: "Internal server error" });
    }
};