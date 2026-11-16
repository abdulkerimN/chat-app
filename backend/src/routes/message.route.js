import express from "express";
import { protectRoute } from "../middleware/auth.middleware.js";
import upload from "../middleware/upload.middleware.js";

import {
    getMessages,
    getUsersForSidebar,
    sendMessage,
    deleteMessage,
    editMessage,
    toggleReaction,
    forwardMessage,
    searchMessages,
} from "../controllers/message.controller.js";

const router = express.Router();

router.get("/users", protectRoute, getUsersForSidebar);

// Search must be registered before the general message route.
router.get("/search/:id", protectRoute, searchMessages);

router.get("/:id", protectRoute, getMessages);

// Accept an optional audio file or general file attachment.
router.post(
    "/send/:id",
    protectRoute,
    upload.fields([
        { name: "audio", maxCount: 1 },
        { name: "file", maxCount: 1 },
    ]),
    sendMessage
);

router.post("/forward/:messageId", protectRoute, forwardMessage);
router.delete("/:messageId", protectRoute, deleteMessage);
router.patch("/:messageId", protectRoute, editMessage);
router.patch("/:messageId/reaction", protectRoute, toggleReaction);

export default router;