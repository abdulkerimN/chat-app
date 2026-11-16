import mongoose from "mongoose";

const messageSchema = new mongoose.Schema({
    senderId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    receiverId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    text: {
        type: String,
    },
    image: {
        type: String,
    },
    // Voice message audio URL
    audio: {
        type: String,
        default: "",
    },

    // Voice message duration in seconds
    audioDuration: {
        type: Number,
        default: 0,
    },
    // General file attachment URL
    file: {
        type: String,
        default: "",
    },

    // Original uploaded filename
    fileName: {
        type: String,
        default: "",
    },

    // File MIME type (e.g. application/pdf)
    fileType: {
        type: String,
        default: "",
    },

    // File size in bytes
    fileSize: {
        type: Number,
        default: 0,
    },
    // Whether this message was forwarded from another conversation
    isForwarded: {
        type: Boolean,
        default: false,
    },

    // Reference to the message being replied to
    replyTo: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Message",
        default: null,
    },

    // Whether this message has been edited
    edited: {
        type: Boolean,
        default: false,
    },

    // When the message was last edited
    editedAt: {
        type: Date,
        default: null,
    },

    // Message delivery status
    status: {
        type: String,
        enum: ["sent", "delivered", "read"],
        default: "sent",
    },

    deliveredAt: {
        type: Date,
        default: null,
    },

    readAt: {
        type: Date,
        default: null,
    },

    // Users who deleted this message for themselves
    deletedFor: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
    }],

    // Whether the sender deleted this message for everyone
    deletedForEveryone: {
        type: Boolean,
        default: false,
    },

    deletedAt: {
        type: Date,
        default: null,
    },

    // Emoji reactions added by users
    reactions: [{
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        emoji: {
            type: String,
            required: true,
        },
    }],

}, { timestamps: true });

const Message = mongoose.model("Message", messageSchema);

export default Message;