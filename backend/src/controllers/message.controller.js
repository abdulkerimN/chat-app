import mongoose from "mongoose";

import User from "../models/user.model.js";
import Message from "../models/message.model.js";
import Friendship from "../models/friendship.model.js";

import cloudinary from "../lib/cloudinary.js";
import { getReceiverSocketId, io } from "../lib/socket.js";

// Send an event to all connected devices of a user.
const notifyUser = (userId, eventName, data) => {
    const socketIds = getReceiverSocketId(userId.toString());

    socketIds.forEach((socketId) => {
        io.to(socketId).emit(eventName, data);
    });
};


// Upload an audio buffer directly to Cloudinary.
const uploadAudioToCloudinary = (fileBuffer) => {
    return new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream({
                resource_type: "video",
                folder: "voice_messages",
            },
            (error, result) => {
                if (error) {
                    return reject(error);
                }

                resolve(result);
            }
        );

        uploadStream.end(fileBuffer);
    });
};

// Upload a general file buffer to Cloudinary.
const uploadFileToCloudinary = (file) => {
    return new Promise((resolve, reject) => {
        let resourceType = "raw";

        if (file.mimetype.startsWith("image/")) {
            resourceType = "image";
        } else if (
            file.mimetype.startsWith("audio/") ||
            file.mimetype.startsWith("video/")
        ) {
            resourceType = "video";
        }

        const uploadStream = cloudinary.uploader.upload_stream({
                resource_type: resourceType,
                folder: "chat_files",
                use_filename: true,
                unique_filename: true,
            },
            (error, result) => {
                if (error) {
                    return reject(error);
                }

                resolve(result);
            }
        );

        uploadStream.end(file.buffer);
    });
};


// Get accepted friends for the sidebar.
export const getUsersForSidebar = async(req, res) => {
    try {
        const loggedInUserId = req.user._id;

        const friendships = await Friendship.find({
            status: "accepted",
            $or: [
                { requester: loggedInUserId },
                { recipient: loggedInUserId },
            ],
        });

        const friendIds = friendships.map((friendship) => {
            if (
                friendship.requester.toString() ===
                loggedInUserId.toString()
            ) {
                return friendship.recipient;
            }

            return friendship.requester;
        });

        const users = await User.find({
            _id: { $in: friendIds },
        }).select("-password");

        res.status(200).json(users);
    } catch (error) {
        console.log("Error in getUsersForSidebar:", error.message);

        res.status(500).json({
            error: "Internal server error",
        });
    }
};

// Get messages between the logged-in user and another user.
export const getMessages = async(req, res) => {
    try {
        const { id: userToChatId } = req.params;
        const loggedInUserId = req.user._id;

        if (!mongoose.Types.ObjectId.isValid(userToChatId)) {
            return res.status(400).json({
                error: "Invalid user ID",
            });
        }

        // Check whether both users are friends.
        const friendship = await Friendship.findOne({
            status: "accepted",
            $or: [{
                    requester: loggedInUserId,
                    recipient: userToChatId,
                },
                {
                    requester: userToChatId,
                    recipient: loggedInUserId,
                },
            ],
        });

        if (!friendship) {
            return res.status(403).json({
                error: "You can only view messages with your friends",
            });
        }

        // Find incoming unread messages.
        const unreadMessages = await Message.find({
            senderId: userToChatId,
            receiverId: loggedInUserId,
            status: { $ne: "read" },
            deletedForEveryone: { $ne: true },
        });

        // Mark incoming messages as read.
        if (unreadMessages.length > 0) {
            const readAt = new Date();

            const messageIds = unreadMessages.map(
                (message) => message._id
            );

            await Message.updateMany({
                _id: { $in: messageIds },
            }, {
                $set: {
                    status: "read",
                    readAt: readAt,
                },
            });

            // Notify the original sender.
            notifyUser(userToChatId, "messagesRead", {
                messageIds: messageIds,
                readAt: readAt,
            });
        }

        // Get messages in both directions.
        // Exclude messages deleted only for the logged-in user.
        const messages = await Message.find({
            $or: [{
                    senderId: loggedInUserId,
                    receiverId: userToChatId,
                },
                {
                    senderId: userToChatId,
                    receiverId: loggedInUserId,
                },
            ],
            deletedFor: { $ne: loggedInUserId },
        }).sort({ createdAt: 1 });

        res.status(200).json(messages);
    } catch (error) {
        console.log("Error in getMessages:", error.message);

        res.status(500).json({
            error: "Internal server error",
        });
    }
};




// Send a text, image, voice, or general file message.
export const sendMessage = async(req, res) => {
    try {
        const { text, image, audioDuration, replyTo } = req.body;
        const { id: receiverId } = req.params;
        const senderId = req.user._id;

        // Multer stores uploaded files in req.files.
        const audioFiles = req.files && req.files.audio ?
            req.files.audio : [];

        const generalFiles = req.files && req.files.file ?
            req.files.file : [];

        const audioFile = audioFiles.length > 0 ?
            audioFiles[0] :
            null;

        const generalFile = generalFiles.length > 0 ?
            generalFiles[0] :
            null;

        if (!mongoose.Types.ObjectId.isValid(receiverId)) {
            return res.status(400).json({
                error: "Invalid receiver ID",
            });
        }

        // Check friendship.
        const friendship = await Friendship.findOne({
            status: "accepted",
            $or: [{
                    requester: senderId,
                    recipient: receiverId,
                },
                {
                    requester: receiverId,
                    recipient: senderId,
                },
            ],
        });

        if (!friendship) {
            return res.status(403).json({
                error: "You can only send messages to your friends",
            });
        }

        // Check message content.
        const hasText = typeof text === "string" && text.trim().length > 0;
        const hasImage = typeof image === "string" && image.length > 0;
        const hasAudio = Boolean(audioFile);
        const hasFile = Boolean(generalFile);

        if (!hasText && !hasImage && !hasAudio && !hasFile) {
            return res.status(400).json({
                error: "Message cannot be empty",
            });
        }

        // Only one uploaded file type can be sent per message.
        if (hasAudio && hasFile) {
            return res.status(400).json({
                error: "Send either a voice message or a file, not both",
            });
        }

        // Validate voice message type.
        if (hasAudio && !audioFile.mimetype.startsWith("audio/")) {
            return res.status(400).json({
                error: "Invalid audio file",
            });
        }

        // Validate voice message duration.
        let duration = 0;

        if (hasAudio) {
            duration = Number(audioDuration);

            if (!Number.isFinite(duration) ||
                duration <= 0 ||
                duration > 300
            ) {
                return res.status(400).json({
                    error: "Invalid audio duration",
                });
            }
        }

        // Validate the original message if this is a reply.
        let originalMessage = null;

        if (replyTo) {
            if (!mongoose.Types.ObjectId.isValid(replyTo)) {
                return res.status(400).json({
                    error: "Invalid reply message ID",
                });
            }

            originalMessage = await Message.findOne({
                _id: replyTo,
                $or: [{
                        senderId: senderId,
                        receiverId: receiverId,
                    },
                    {
                        senderId: receiverId,
                        receiverId: senderId,
                    },
                ],
                deletedForEveryone: { $ne: true },
                deletedFor: { $ne: senderId },
            });

            if (!originalMessage) {
                return res.status(404).json({
                    error: "Original message not found or unavailable",
                });
            }
        }

        // Upload image if one was attached as a base64 string.
        let imageUrl = "";

        if (hasImage) {
            const uploadResponse = await cloudinary.uploader.upload(image, {
                resource_type: "image",
                folder: "chat_images",
            });

            imageUrl = uploadResponse.secure_url;
        }

        // Upload voice message if one was attached.
        let audioUrl = "";

        if (hasAudio) {
            const uploadResponse = await uploadAudioToCloudinary(
                audioFile.buffer
            );

            audioUrl = uploadResponse.secure_url;
        }

        // Upload general file if one was attached.
        let fileUrl = "";
        let fileName = "";
        let fileType = "";
        let fileSize = 0;

        if (hasFile) {
            const uploadResponse = await uploadFileToCloudinary(
                generalFile
            );

            fileUrl = uploadResponse.secure_url;
            fileName = generalFile.originalname;
            fileType = generalFile.mimetype;
            fileSize = generalFile.size;
        }

        // Create the new message.
        const newMessage = new Message({
            senderId,
            receiverId,
            text: hasText ? text.trim() : "",
            image: imageUrl,
            audio: audioUrl,
            audioDuration: hasAudio ? duration : 0,
            file: fileUrl,
            fileName: fileName,
            fileType: fileType,
            fileSize: fileSize,
            replyTo: originalMessage ? originalMessage._id : null,
        });

        await newMessage.save();

        // Send the new message to all recipient devices.
        notifyUser(receiverId, "newMessage", newMessage);

        res.status(201).json(newMessage);
    } catch (error) {
        console.log("Error in sendMessage:", error);
        console.log("Error message:", error.message);
        console.log("HTTP status:", error.http_code);
        console.log("Error name:", error.name);

        res.status(500).json({
            error: "Internal server error",
        });
    }
};




// Delete a message for yourself or everyone.
export const deleteMessage = async(req, res) => {
    try {
        const { messageId } = req.params;
        const { deleteFor } = req.body;
        const loggedInUserId = req.user._id;

        if (!mongoose.Types.ObjectId.isValid(messageId)) {
            return res.status(400).json({
                error: "Invalid message ID",
            });
        }

        if (deleteFor !== "me" && deleteFor !== "everyone") {
            return res.status(400).json({
                error: "Invalid delete option",
            });
        }

        const message = await Message.findById(messageId);

        if (!message) {
            return res.status(404).json({
                error: "Message not found",
            });
        }

        const isSender =
            message.senderId.toString() === loggedInUserId.toString();

        const isReceiver =
            message.receiverId.toString() === loggedInUserId.toString();

        if (!isSender && !isReceiver) {
            return res.status(403).json({
                error: "You are not allowed to delete this message",
            });
        }

        // Delete only for the logged-in user.
        if (deleteFor === "me") {
            await Message.updateOne({ _id: messageId }, {
                $addToSet: {
                    deletedFor: loggedInUserId,
                },
            });

            notifyUser(loggedInUserId, "messageDeleted", {
                messageId: messageId,
                deleteFor: "me",
            });

            return res.status(200).json({
                message: "Message deleted for you",
            });
        }

        // Only the sender can delete a message for everyone.
        if (!isSender) {
            return res.status(403).json({
                error: "Only the sender can delete this message for everyone",
            });
        }

        const deletedAt = new Date();

        await Message.updateOne({ _id: messageId }, {
            $set: {
                text: "",
                image: "",
                audio: "",
                audioDuration: 0,
                file: "",
                fileName: "",
                fileType: "",
                fileSize: 0,
            },
        });

        const deletionData = {
            messageId: messageId,
            deleteFor: "everyone",
            deletedAt: deletedAt,
        };

        // Notify the sender and receiver on all their devices.
        notifyUser(message.senderId, "messageDeleted", deletionData);
        notifyUser(message.receiverId, "messageDeleted", deletionData);

        res.status(200).json({
            message: "Message deleted for everyone",
            deletedAt: deletedAt,
        });
    } catch (error) {
        console.log("Error in deleteMessage:", error.message);

        res.status(500).json({
            error: "Internal server error",
        });
    }
}; // Edit a previously sent text message.
export const editMessage = async(req, res) => {
    try {
        const { messageId } = req.params;
        const { text } = req.body;
        const loggedInUserId = req.user._id;

        // Validate message ID.
        if (!mongoose.Types.ObjectId.isValid(messageId)) {
            return res.status(400).json({
                error: "Invalid message ID",
            });
        }

        // Validate edited text.
        if (!text || !text.trim()) {
            return res.status(400).json({
                error: "Message cannot be empty",
            });
        }

        // Find the message.
        const message = await Message.findById(messageId);

        if (!message) {
            return res.status(404).json({
                error: "Message not found",
            });
        }

        // Only the original sender can edit.
        if (
            message.senderId.toString() !==
            loggedInUserId.toString()
        ) {
            return res.status(403).json({
                error: "You can only edit your own messages",
            });
        }

        // Do not allow editing deleted messages.
        if (message.deletedForEveryone) {
            return res.status(400).json({
                error: "Cannot edit a deleted message",
            });
        }

        // This feature edits text messages only.
        if (!message.text) {
            return res.status(400).json({
                error: "This message cannot be edited",
            });
        }

        const editedAt = new Date();

        // Update the message in MongoDB.
        message.text = text.trim();
        message.edited = true;
        message.editedAt = editedAt;

        await message.save();

        // Notify both users on all connected devices.
        const updatedMessage = {
            _id: message._id,
            text: message.text,
            edited: message.edited,
            editedAt: message.editedAt,
        };

        notifyUser(message.senderId, "messageEdited", updatedMessage);
        notifyUser(message.receiverId, "messageEdited", updatedMessage);

        res.status(200).json(message);

    } catch (error) {
        console.log("Error in editMessage:", error.message);

        res.status(500).json({
            error: "Internal server error",
        });
    }
};


// Add, change, or remove an emoji reaction.
export const toggleReaction = async(req, res) => {
    try {
        const { messageId } = req.params;
        const { emoji } = req.body;
        const loggedInUserId = req.user._id;

        // Validate message ID.
        if (!mongoose.Types.ObjectId.isValid(messageId)) {
            return res.status(400).json({
                error: "Invalid message ID",
            });
        }

        // Validate emoji.
        if (
            typeof emoji !== "string" ||
            !emoji.trim() ||
            emoji.length > 16
        ) {
            return res.status(400).json({
                error: "Invalid emoji",
            });
        }

        // Find the message.
        const message = await Message.findById(messageId);

        if (!message) {
            return res.status(404).json({
                error: "Message not found",
            });
        }

        // Check whether the logged-in user belongs to this conversation.
        const isSender =
            message.senderId.toString() === loggedInUserId.toString();

        const isReceiver =
            message.receiverId.toString() === loggedInUserId.toString();

        if (!isSender && !isReceiver) {
            return res.status(403).json({
                error: "You are not allowed to react to this message",
            });
        }

        // Do not allow reactions on deleted messages.
        if (message.deletedForEveryone) {
            return res.status(400).json({
                error: "Cannot react to a deleted message",
            });
        }

        // Do not allow reactions if the message is hidden for this user.
        const isDeletedForUser = message.deletedFor.some(
            (userId) =>
            userId.toString() === loggedInUserId.toString()
        );

        if (isDeletedForUser) {
            return res.status(404).json({
                error: "Message not found",
            });
        }

        // Find the user's existing reaction.
        const existingReactionIndex = message.reactions.findIndex(
            (reaction) =>
            reaction.userId.toString() === loggedInUserId.toString()
        );

        if (existingReactionIndex !== -1) {
            const existingReaction =
                message.reactions[existingReactionIndex];

            // Clicking the same emoji removes the reaction.
            if (existingReaction.emoji === emoji) {
                message.reactions.splice(existingReactionIndex, 1);
            } else {
                // Selecting another emoji changes the reaction.
                existingReaction.emoji = emoji;
            }
        } else {
            // Add a new reaction.
            message.reactions.push({
                userId: loggedInUserId,
                emoji: emoji,
            });
        }

        // Save the updated message.
        await message.save();

        // Prepare reaction data for both users.
        const reactionData = {
            messageId: message._id,
            reactions: message.reactions,
        };

        // Notify both users on all connected devices.
        notifyUser(message.senderId, "messageReactionUpdated", reactionData);
        notifyUser(message.receiverId, "messageReactionUpdated", reactionData);

        res.status(200).json(reactionData);

    } catch (error) {
        console.log("Error in toggleReaction:", error.message);

        res.status(500).json({
            error: "Internal server error",
        });
    }
};

// Forward a message to one or more accepted friends.
export const forwardMessage = async(req, res) => {
    try {
        const { messageId } = req.params;
        const { recipientIds } = req.body;
        const senderId = req.user._id;

        // Validate the original message ID.
        if (!mongoose.Types.ObjectId.isValid(messageId)) {
            return res.status(400).json({
                error: "Invalid message ID",
            });
        }

        // Validate recipient IDs.
        if (!Array.isArray(recipientIds) ||
            recipientIds.length === 0
        ) {
            return res.status(400).json({
                error: "Select at least one recipient",
            });
        }

        // Remove duplicate recipient IDs.
        const uniqueRecipientIds = [...new Set(recipientIds)];

        // Validate every recipient ID.
        for (const recipientId of uniqueRecipientIds) {
            if (!mongoose.Types.ObjectId.isValid(recipientId)) {
                return res.status(400).json({
                    error: "Invalid recipient ID",
                });
            }

            if (recipientId.toString() === senderId.toString()) {
                return res.status(400).json({
                    error: "You cannot forward a message to yourself",
                });
            }
        }

        // Find the original message.
        const originalMessage = await Message.findById(messageId);

        if (!originalMessage) {
            return res.status(404).json({
                error: "Original message not found",
            });
        }

        // Check whether the logged-in user belongs to the conversation.
        const isSender =
            originalMessage.senderId.toString() === senderId.toString();

        const isReceiver =
            originalMessage.receiverId.toString() === senderId.toString();

        if (!isSender && !isReceiver) {
            return res.status(403).json({
                error: "You are not allowed to forward this message",
            });
        }

        // Do not forward deleted messages.
        if (originalMessage.deletedForEveryone) {
            return res.status(400).json({
                error: "Cannot forward a deleted message",
            });
        }

        // Check whether the original message is hidden for this user.
        const isDeletedForUser = originalMessage.deletedFor.some(
            (userId) => userId.toString() === senderId.toString()
        );

        if (isDeletedForUser) {
            return res.status(404).json({
                error: "Original message not found",
            });
        }

        // Check that the original message contains text, an image, or audio.
        if (
            (!originalMessage.text || !originalMessage.text.trim()) &&
            !originalMessage.image &&
            !originalMessage.audio &&
            !originalMessage.file
        ) {
            return res.status(400).json({
                error: "This message cannot be forwarded",
            });
        }
        // Verify that every recipient is still an accepted friend.
        for (const recipientId of uniqueRecipientIds) {
            const friendship = await Friendship.findOne({
                status: "accepted",
                $or: [{
                        requester: senderId,
                        recipient: recipientId,
                    },
                    {
                        requester: recipientId,
                        recipient: senderId,
                    },
                ],
            });

            if (!friendship) {
                return res.status(403).json({
                    error: "You can only forward messages to accepted friends",
                });
            }
        }

        // Create a separate forwarded message for each recipient.
        const forwardedMessages = [];

        for (const recipientId of uniqueRecipientIds) {
            const forwardedMessage = new Message({
                senderId: senderId,
                receiverId: recipientId,
                text: originalMessage.text || "",
                image: originalMessage.image || "",
                audio: originalMessage.audio || "",
                audioDuration: originalMessage.audioDuration || 0,
                file: originalMessage.file || "",
                fileName: originalMessage.fileName || "",
                fileType: originalMessage.fileType || "",
                fileSize: originalMessage.fileSize || 0,
                isForwarded: true,
            });

            await forwardedMessage.save();

            forwardedMessages.push(forwardedMessage);

            // Notify the recipient immediately through Socket.IO.
            notifyUser(
                recipientId,
                "newMessage",
                forwardedMessage
            );
        }

        res.status(201).json({
            message: "Message forwarded successfully",
            forwardedMessages: forwardedMessages,
        });

    } catch (error) {
        console.log("Error in forwardMessage:", error.message);

        res.status(500).json({
            error: "Internal server error",
        });
    }
};


// Search messages inside a conversation.
export const searchMessages = async(req, res) => {
    try {
        const { id: userToChatId } = req.params;
        const loggedInUserId = req.user._id;
        const searchTerm = req.query.q;

        // Validate the other user's ID.
        if (!mongoose.Types.ObjectId.isValid(userToChatId)) {
            return res.status(400).json({
                error: "Invalid user ID",
            });
        }

        // Validate the search term.
        if (
            typeof searchTerm !== "string" ||
            !searchTerm.trim()
        ) {
            return res.status(400).json({
                error: "Enter a search term",
            });
        }

        if (searchTerm.trim().length > 100) {
            return res.status(400).json({
                error: "Search term is too long",
            });
        }

        // Make sure both users are accepted friends.
        const friendship = await Friendship.findOne({
            status: "accepted",
            $or: [{
                    requester: loggedInUserId,
                    recipient: userToChatId,
                },
                {
                    requester: userToChatId,
                    recipient: loggedInUserId,
                },
            ],
        });

        if (!friendship) {
            return res.status(403).json({
                error: "You can only search messages with your friends",
            });
        }

        // Escape special regular-expression characters.
        const escapedSearchTerm = searchTerm.trim().replace(
            /[.*+?^${}()|[\]\\]/g,
            "\\$&"
        );

        // Search messages in both directions.
        const messages = await Message.find({
                $or: [{
                        senderId: loggedInUserId,
                        receiverId: userToChatId,
                    },
                    {
                        senderId: userToChatId,
                        receiverId: loggedInUserId,
                    },
                ],
                text: {
                    $regex: escapedSearchTerm,
                    $options: "i",
                },
                deletedFor: { $ne: loggedInUserId },
                deletedForEveryone: { $ne: true },
            })
            .sort({ createdAt: -1 })
            .limit(50);

        res.status(200).json(messages);

    } catch (error) {
        console.log("Error in searchMessages:", error.message);

        res.status(500).json({
            error: "Internal server error",
        });
    }
};