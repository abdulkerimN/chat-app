import express from "express";
import { protectRoute } from "../middleware/auth.middleware.js";

import {
    searchUsers,
    sendFriendRequest,
    getFriendRequests,
    acceptFriendRequest,
    rejectFriendRequest,
    removeFriend,
} from "../controllers/friend.controller.js";

const router = express.Router();

// All friend routes require authentication
router.use(protectRoute);

// Search for users
router.get("/search", searchUsers);

// Send a friend request
router.post("/request/:id", sendFriendRequest);

// Get incoming requests
router.get("/requests", getFriendRequests);

// Accept or reject a request
router.patch("/requests/:requestId/accept", acceptFriendRequest);
router.patch("/requests/:requestId/reject", rejectFriendRequest);

// Remove a friend
router.delete("/:id", removeFriend);

export default router;