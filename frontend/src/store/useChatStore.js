import { create } from "zustand";
import toast from "react-hot-toast";
import { axiosInstance } from "../libs/axios";
import { useAuthStore } from "./useAuthStore";

// Keep track of typing timeouts for each user.
const typingTimers = new Map();

// Keep track of the exact Socket.IO listeners registered by this store.
const socketListeners = new WeakMap();

export const useChatStore = create((set, get) => ({
    // Messaging state
    messages: [],
    users: [],
    selectedUser: null,
    replyingTo: null,
    isUsersLoading: false,
    isMessagesLoading: false,

    // Message search state
    searchMessagesResults: [],
    isSearchingMessages: false,
    searchTargetMessage: null,

    // Typing state
    typingUsers: [],

    // Friends state
    searchResults: [],
    friendRequests: [],
    isSearching: false,

    // Get accepted friends for the sidebar
    getUsers: async() => {
        set({ isUsersLoading: true });

        try {
            const res = await axiosInstance.get("/messages/users");
            set({ users: res.data });
        } catch (error) {
            toast.error(
                (error.response && error.response.data && error.response.data.error) ||
                "Failed to load contacts"
            );
        } finally {
            set({ isUsersLoading: false });
        }
    },

    // Search registered users
    searchUsers: async(query) => {
        if (!query.trim()) {
            set({ searchResults: [] });
            return;
        }

        set({ isSearching: true });

        try {
            const res = await axiosInstance.get("/friends/search", {
                params: { q: query },
            });

            set({ searchResults: res.data });
        } catch (error) {
            toast.error(
                (error.response && error.response.data && error.response.data.error) ||
                "Failed to search users"
            );
        } finally {
            set({ isSearching: false });
        }
    },

    // Send a friend request
    sendFriendRequest: async(userId) => {
        try {
            await axiosInstance.post(`/friends/request/${userId}`);

            set((state) => ({
                searchResults: state.searchResults.map((user) =>
                    user._id === userId ? {...user, relationshipStatus: "request_sent" } :
                    user
                ),
            }));

            toast.success("Friend request sent");
        } catch (error) {
            toast.error(
                (error.response && error.response.data && error.response.data.error) ||
                "Failed to send friend request"
            );
        }
    },

    // Get incoming friend requests
    getFriendRequests: async() => {
        try {
            const res = await axiosInstance.get("/friends/requests");
            set({ friendRequests: res.data });
        } catch (error) {
            toast.error(
                (error.response && error.response.data && error.response.data.error) ||
                "Failed to load friend requests"
            );
        }
    },

    // Accept a friend request
    acceptFriendRequest: async(requestId) => {
        try {
            const res = await axiosInstance.patch(
                `/friends/requests/${requestId}/accept`
            );

            toast.success(res.data.message || "Friend request accepted");

            set((state) => ({
                friendRequests: state.friendRequests.filter(
                    (request) => request._id !== requestId
                ),
            }));

            await get().getUsers();

            return true;
        } catch (error) {
            toast.error(
                (error.response && error.response.data && error.response.data.error) ||
                "Failed to accept request"
            );
            return false;
        }
    },

    // Reject a friend request
    rejectFriendRequest: async(requestId) => {
        try {
            const res = await axiosInstance.patch(
                `/friends/requests/${requestId}/reject`
            );

            toast.success(res.data.message || "Friend request rejected");

            set((state) => ({
                friendRequests: state.friendRequests.filter(
                    (request) => request._id !== requestId
                ),
            }));

            return true;
        } catch (error) {
            toast.error(
                (error.response && error.response.data && error.response.data.error) ||
                "Failed to reject request"
            );
            return false;
        }
    },

    // Remove an accepted friend
    removeFriend: async(userId) => {
        try {
            await axiosInstance.delete(`/friends/${userId}`);

            set((state) => {
                const updatedUsers = state.users.filter(
                    (user) => user._id !== userId
                );

                const selectedUser = state.selectedUser;

                const shouldClearChat =
                    selectedUser && selectedUser._id === userId;

                return {
                    users: updatedUsers,
                    selectedUser: shouldClearChat ? null : selectedUser,
                    messages: shouldClearChat ? [] : state.messages,
                    replyingTo: shouldClearChat ? null : state.replyingTo,
                    typingUsers: state.typingUsers.filter(
                        (id) => id !== userId
                    ),
                    searchMessagesResults: shouldClearChat ? [] : state.searchMessagesResults,
                    searchTargetMessage: shouldClearChat ? null : state.searchTargetMessage,
                };
            });

            toast.success("Friend removed successfully");
        } catch (error) {
            let errorMessage = "Failed to remove friend";

            if (error && error.response && error.response.data) {
                if (error.response.data.error) {
                    errorMessage = error.response.data.error;
                }
            }

            toast.error(errorMessage);
        }
    },

    // Get messages with a selected friend
    getMessages: async(userId) => {
        set({
            isMessagesLoading: true,
            messages: [],
            searchMessagesResults: [],
            searchTargetMessage: null,
        });

        try {
            const res = await axiosInstance.get(`/messages/${userId}`);
            set({ messages: res.data });
        } catch (error) {
            toast.error(
                (error.response && error.response.data && error.response.data.error) ||
                "Failed to load messages"
            );
        } finally {
            set({ isMessagesLoading: false });
        }
    },

    // Search messages in a selected conversation
    searchMessages: async(userId, query) => {
        if (!query || !query.trim()) {
            set({
                searchMessagesResults: [],
                isSearchingMessages: false,
            });

            return [];
        }

        set({ isSearchingMessages: true });

        try {
            const res = await axiosInstance.get(
                `/messages/search/${userId}`, {
                    params: {
                        q: query.trim(),
                    },
                }
            );

            set({
                searchMessagesResults: res.data,
            });

            return res.data;
        } catch (error) {
            toast.error(
                (error.response && error.response.data && error.response.data.error) ||
                "Failed to search messages"
            );

            set({ searchMessagesResults: [] });

            return [];
        } finally {
            set({ isSearchingMessages: false });
        }
    },

    // Clear message search results
    clearMessageSearch: () => {
        set({
            searchMessagesResults: [],
            isSearchingMessages: false,
        });
    },

    // Set the message that should be brought into view
    setSearchTargetMessage: (message) => {
        set({ searchTargetMessage: message });
    },

    // Clear the selected search target
    clearSearchTargetMessage: () => {
        set({ searchTargetMessage: null });
    },



    // Send a text, image, or voice message
    sendMessage: async(messageData) => {
        const { selectedUser } = get();

        if (!selectedUser) return;

        try {
            const res = await axiosInstance.post(
                `/messages/send/${selectedUser._id}`,
                messageData
            );

            // Avoid duplicate messages if Socket.IO already delivered it.
            set((state) => {
                const alreadyExists = state.messages.some(
                    (message) =>
                    String(message._id) === String(res.data._id)
                );

                if (alreadyExists) return state;

                return {
                    messages: [...state.messages, res.data],
                };
            });

            return res.data;
        } catch (error) {
            toast.error(
                (error.response && error.response.data && error.response.data.error) ||
                "Failed to send message"
            );

            throw error;
        }
    },



    // Forward a message to selected friends
    forwardMessage: async(messageId, recipientIds) => {
        try {
            const res = await axiosInstance.post(
                `/messages/forward/${messageId}`, {
                    recipientIds: recipientIds,
                }
            );

            const forwardedMessages = res.data.forwardedMessages;

            set((state) => {
                const selectedUser = state.selectedUser;

                if (!selectedUser) {
                    return state;
                }

                const messagesForCurrentChat = forwardedMessages.filter(
                    (message) =>
                    String(message.receiverId) === String(selectedUser._id)
                );

                if (messagesForCurrentChat.length === 0) {
                    return state;
                }

                return {
                    messages: [
                        ...state.messages,
                        ...messagesForCurrentChat,
                    ],
                };
            });

            toast.success("Message forwarded successfully");

            return true;
        } catch (error) {
            toast.error(
                (error.response && error.response.data && error.response.data.error) ||
                "Failed to forward message"
            );

            return false;
        }
    },

    // Edit an existing message
    editMessage: async(messageId, text) => {
        if (!text || !text.trim()) {
            toast.error("Message cannot be empty");
            return false;
        }

        try {
            const res = await axiosInstance.patch(
                `/messages/${messageId}`, {
                    text: text.trim(),
                }
            );

            const updatedMessage = res.data;

            set((state) => ({
                messages: state.messages.map((message) => {
                    if (String(message._id) === String(messageId)) {
                        return {
                            ...message,
                            ...updatedMessage,
                        };
                    }

                    return message;
                }),

                replyingTo: state.replyingTo &&
                    String(state.replyingTo._id) === String(messageId) ? {
                        ...state.replyingTo,
                        ...updatedMessage,
                    } : state.replyingTo,
            }));

            toast.success("Message edited successfully");
            return true;
        } catch (error) {
            toast.error(
                (error.response && error.response.data && error.response.data.error) ||
                "Failed to edit message"
            );

            return false;
        }
    },

    // Add, change, or remove an emoji reaction
    toggleReaction: async(messageId, emoji) => {
        try {
            const res = await axiosInstance.patch(
                `/messages/${messageId}/reaction`, { emoji: emoji }
            );

            get().updateMessageReactions(res.data);

            return true;
        } catch (error) {
            toast.error(
                (error.response && error.response.data && error.response.data.error) ||
                "Failed to update reaction"
            );

            return false;
        }
    },

    // Update reactions on a message
    updateMessageReactions: (data) => {
        if (!data || !data.messageId) return;

        set((state) => ({
            messages: state.messages.map((message) => {
                if (String(message._id) === String(data.messageId)) {
                    return {
                        ...message,
                        reactions: data.reactions,
                    };
                }

                return message;
            }),

            replyingTo: state.replyingTo &&
                String(state.replyingTo._id) === String(data.messageId) ? {
                    ...state.replyingTo,
                    reactions: data.reactions,
                } : state.replyingTo,
        }));
    },

    // Set or cancel the message being replied to
    setReplyingTo: (message) => {
        set({ replyingTo: message });
    },

    // Delete a message for yourself or everyone
    deleteMessage: async(messageId, deleteFor) => {
        try {
            const res = await axiosInstance.delete(
                `/messages/${messageId}`, {
                    data: {
                        deleteFor: deleteFor,
                    },
                }
            );

            set((state) => {
                if (deleteFor === "me") {
                    const isReplyBeingDeleted =
                        state.replyingTo &&
                        String(state.replyingTo._id) === String(messageId);

                    return {
                        messages: state.messages.filter(
                            (message) =>
                            String(message._id) !== String(messageId)
                        ),
                        replyingTo: isReplyBeingDeleted ?
                            null : state.replyingTo,
                    };
                }

                return {
                    messages: state.messages.map((message) => {
                        if (String(message._id) === String(messageId)) {
                            return {
                                ...message,
                                text: "",
                                image: "",
                                deletedForEveryone: true,
                                deletedAt: res.data.deletedAt,
                            };
                        }

                        return message;
                    }),

                    replyingTo: state.replyingTo &&
                        String(state.replyingTo._id) === String(messageId) ? {
                            ...state.replyingTo,
                            text: "",
                            image: "",
                            deletedForEveryone: true,
                            deletedAt: res.data.deletedAt,
                        } : state.replyingTo,
                };
            });

            toast.success(res.data.message);
            return true;
        } catch (error) {
            toast.error(
                (error.response && error.response.data && error.response.data.error) ||
                "Failed to delete message"
            );

            return false;
        }
    },

    // Add an incoming message if its conversation is open
    receiveMessage: (newMessage) => {
        const selectedUser = get().selectedUser;

        if (!selectedUser || !newMessage) return;

        const senderId =
            (newMessage.senderId && newMessage.senderId._id) ||
            newMessage.senderId;

        if (String(senderId) !== String(selectedUser._id)) return;

        set((state) => {
            const alreadyExists = state.messages.some(
                (message) => message._id === newMessage._id
            );

            if (alreadyExists) return state;

            return {
                messages: [...state.messages, newMessage],
            };
        });
    },

    // Update a message's status in the conversation
    updateMessageStatus: (data) => {
        if (!data || !data.messageId) return;

        set((state) => ({
            messages: state.messages.map((message) => {
                if (message._id === data.messageId) {
                    return {
                        ...message,
                        status: data.status,
                        deliveredAt: data.deliveredAt,
                        readAt: data.readAt,
                    };
                }

                return message;
            }),
        }));
    },

    // Update messages that have been read
    updateMessagesRead: (data) => {
        if (!data || !data.messageIds) return;

        set((state) => ({
            messages: state.messages.map((message) => {
                if (data.messageIds.includes(message._id)) {
                    return {
                        ...message,
                        status: "read",
                        deliveredAt: message.deliveredAt || data.readAt,
                        readAt: data.readAt,
                    };
                }

                return message;
            }),
        }));
    },

    // Add a user to the typing list
    setUserTyping: (userId) => {
        const id = String(userId);

        if (typingTimers.has(id)) {
            clearTimeout(typingTimers.get(id));
        }

        set((state) => {
            if (state.typingUsers.includes(id)) {
                return state;
            }

            return {
                typingUsers: [...state.typingUsers, id],
            };
        });

        const timeout = setTimeout(() => {
            get().setUserStoppedTyping(id);
        }, 3000);

        typingTimers.set(id, timeout);
    },

    // Remove a user from the typing list
    setUserStoppedTyping: (userId) => {
        const id = String(userId);

        if (typingTimers.has(id)) {
            clearTimeout(typingTimers.get(id));
            typingTimers.delete(id);
        }

        set((state) => ({
            typingUsers: state.typingUsers.filter(
                (user) => user !== id
            ),
        }));
    },

    // Listen for real-time typing and reaction events
    subscribeToMessages: () => {
        const socket = useAuthStore.getState().socket;

        if (!socket) {
            console.log("Cannot subscribe: Socket is not initialized");
            return;
        }

        const previousListeners = socketListeners.get(socket);

        if (previousListeners) {
            socket.off("userTyping", previousListeners.typing);
            socket.off("userStoppedTyping", previousListeners.stoppedTyping);
            socket.off("messageReactionUpdated", previousListeners.reaction);
            socket.off("newMessage", previousListeners.newMessage);
        }

        const listeners = {
            typing: (data) => {
                if (!data || !data.senderId) return;

                get().setUserTyping(data.senderId);
            },

            stoppedTyping: (data) => {
                if (!data || !data.senderId) return;

                get().setUserStoppedTyping(data.senderId);
            },

            reaction: (data) => {
                if (!data || !data.messageId) return;

                get().updateMessageReactions(data);
            },

            newMessage: (data) => {
                if (!data) return;

                get().receiveMessage(data);
            },
        };

        socket.on("userTyping", listeners.typing);
        socket.on("userStoppedTyping", listeners.stoppedTyping);
        socket.on("messageReactionUpdated", listeners.reaction);
        socket.on("newMessage", listeners.newMessage);

        socketListeners.set(socket, listeners);

        console.log("Chat Socket.IO listeners registered");
    },

    // Remove the listeners when leaving the chat component
    unsubscribeFromMessages: () => {
        const socket = useAuthStore.getState().socket;

        if (!socket) return;

        const listeners = socketListeners.get(socket);

        if (!listeners) return;

        socket.off("userTyping", listeners.typing);
        socket.off("userStoppedTyping", listeners.stoppedTyping);
        socket.off("messageReactionUpdated", listeners.reaction);
        socket.off("newMessage", listeners.newMessage);

        socketListeners.delete(socket);

        typingTimers.forEach((timeout) => {
            clearTimeout(timeout);
        });

        typingTimers.clear();

        set({ typingUsers: [] });

        console.log("Chat Socket.IO listeners removed");
    },

    // Select a conversation
    setSelectedUser: (selectedUser) => {
        typingTimers.forEach((timeout) => {
            clearTimeout(timeout);
        });

        typingTimers.clear();

        set({
            selectedUser,
            replyingTo: null,
            typingUsers: [],
            searchMessagesResults: [],
            isSearchingMessages: false,
            searchTargetMessage: null,
        });
    },
}));