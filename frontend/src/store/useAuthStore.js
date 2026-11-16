import { create } from "zustand";
import { axiosInstance } from "../libs/axios";
import toast from "react-hot-toast";
import { io } from "socket.io-client";
import { useChatStore } from "./useChatStore";

const BASE_URL = "http://localhost:5001";

const getErrorMessage = (error, defaultMessage) => {
    if (
        error &&
        error.response &&
        error.response.data &&
        error.response.data.message
    ) {
        return error.response.data.message;
    }

    if (
        error &&
        error.response &&
        error.response.data &&
        error.response.data.error
    ) {
        return error.response.data.error;
    }

    return defaultMessage;
};

export const useAuthStore = create((set, get) => ({
    authUser: null,
    isSigningUp: false,
    isLoggingIn: false,
    isUpdatingProfile: false,
    isCheckingAuth: true,
    onlineUsers: [],
    socket: null,

    checkAuth: async() => {
        try {
            const res = await axiosInstance.get("/auth/check");

            set({ authUser: res.data });
            get().connectSocket();
        } catch (error) {
            console.log("Error in checkAuth:", error);
            set({ authUser: null });
        } finally {
            set({ isCheckingAuth: false });
        }
    },

    signup: async(data) => {
        set({ isSigningUp: true });

        try {
            const res = await axiosInstance.post("/auth/signup", data);

            set({ authUser: res.data });
            toast.success("Account created successfully");

            get().connectSocket();
        } catch (error) {
            toast.error(getErrorMessage(error, "Signup failed"));
        } finally {
            set({ isSigningUp: false });
        }
    },

    login: async(data) => {
        set({ isLoggingIn: true });

        try {
            const res = await axiosInstance.post("/auth/login", data);

            set({ authUser: res.data });
            toast.success("Logged in successfully");

            get().connectSocket();
        } catch (error) {
            toast.error(getErrorMessage(error, "Login failed"));
        } finally {
            set({ isLoggingIn: false });
        }
    },

    logout: async() => {
        try {
            await axiosInstance.post("/auth/logout");

            set({ authUser: null });
            toast.success("Logged out successfully");

            get().disconnectSocket();
        } catch (error) {
            toast.error(getErrorMessage(error, "Logout failed"));
        }
    },

    updateProfile: async(data) => {
        set({ isUpdatingProfile: true });

        try {
            const res = await axiosInstance.put(
                "/auth/update-profile",
                data
            );

            set({ authUser: res.data });
            toast.success("Profile updated successfully");
        } catch (error) {
            console.log("Error in update profile:", error);
            toast.error(getErrorMessage(error, "Profile update failed"));
        } finally {
            set({ isUpdatingProfile: false });
        }
    },

    connectSocket: () => {
        const { authUser, socket: existingSocket } = get();

        if (!authUser) return;

        // Avoid creating duplicate connections.
        if (existingSocket) {
            if (!existingSocket.connected) {
                existingSocket.connect();
            }

            return;
        }

        const socket = io(BASE_URL, {
            withCredentials: true,
        });

        set({ socket });

        socket.on("connect", () => {
            console.log("Socket connected:", socket.id);
        });

        socket.on("connect_error", (error) => {
            console.log("Socket connection error:", error.message);
        });

        // Update online users.
        socket.on("getOnlineUsers", (userIds) => {
            console.log("Online users received:", userIds);
            set({ onlineUsers: userIds });
        });

        // A new friend request has arrived.
        socket.on("newFriendRequest", () => {
            console.log("New friend request received");

            const chatStore = useChatStore.getState();
            chatStore.getFriendRequests();
        });

        // Someone accepted your friend request.
        socket.on("friendRequestAccepted", (data) => {
            console.log("Your friend request was accepted");

            if (!data || !data.userId) return;

            useChatStore.setState((state) => ({
                searchResults: state.searchResults.map((user) => {
                    if (user._id === data.userId) {
                        return {
                            ...user,
                            relationshipStatus: "friends",
                            requestId: null,
                        };
                    }

                    return user;
                }),
            }));

            const chatStore = useChatStore.getState();
            chatStore.getUsers();
        });

        // Someone rejected your friend request.
        socket.on("friendRequestRejected", (data) => {
            console.log("Your friend request was rejected");

            if (!data || !data.userId) return;

            useChatStore.setState((state) => ({
                searchResults: state.searchResults.map((user) => {
                    if (user._id === data.userId) {
                        return {
                            ...user,
                            relationshipStatus: "none",
                            requestId: null,
                        };
                    }

                    return user;
                }),
            }));
        });

        // Someone removed you as a friend.
        socket.on("friendRemoved", (data) => {
            console.log("You were removed as a friend");

            if (!data || !data.userId) return;

            const chatStore = useChatStore.getState();

            chatStore.getUsers();

            const selectedUser = chatStore.selectedUser;

            if (
                selectedUser &&
                selectedUser._id === data.userId
            ) {
                useChatStore.setState({
                    selectedUser: null,
                    messages: [],
                    replyingTo: null,
                });
            }

            useChatStore.setState((state) => ({
                searchResults: state.searchResults.map((user) => {
                    if (user._id === data.userId) {
                        return {
                            ...user,
                            relationshipStatus: "none",
                            requestId: null,
                        };
                    }

                    return user;
                }),
            }));
        });

        // A new message has arrived on this device.
        socket.on("newMessage", (newMessage) => {
            if (!newMessage || !newMessage._id) return;

            const senderId =
                (newMessage.senderId && newMessage.senderId._id) ||
                newMessage.senderId;

            const chatStore = useChatStore.getState();
            chatStore.receiveMessage(newMessage);

            // Confirm delivery to the backend.
            socket.emit("messageDelivered", {
                messageId: newMessage._id,
            });

            // If the conversation is open, mark the message as read.
            const selectedUser = useChatStore.getState().selectedUser;

            if (
                selectedUser &&
                String(selectedUser._id) === String(senderId)
            ) {
                socket.emit("markMessagesAsRead", {
                    senderId: senderId,
                });
            }
        });

        // Handle edited messages in real time.
        socket.on("messageEdited", (updatedMessage) => {
            if (!updatedMessage || !updatedMessage._id) return;

            useChatStore.setState((state) => ({
                messages: state.messages.map((message) => {
                    if (
                        String(message._id) ===
                        String(updatedMessage._id)
                    ) {
                        return {
                            ...message,
                            ...updatedMessage,
                        };
                    }

                    return message;
                }),

                // Update the reply preview if this message is being replied to.
                replyingTo: state.replyingTo &&
                    String(state.replyingTo._id) ===
                    String(updatedMessage._id) ?
                    {
                        ...state.replyingTo,
                        ...updatedMessage,
                    } :
                    state.replyingTo,
            }));
        });

        // Update a message when its delivery status changes.
        socket.on("messageStatusUpdated", (data) => {
            if (!data || !data.messageId) return;

            useChatStore.setState((state) => ({
                messages: state.messages.map((message) => {
                    if (String(message._id) === String(data.messageId)) {
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
        });

        // Update messages that the recipient has read.
        socket.on("messagesRead", (data) => {
            if (!data || !data.messageIds) return;

            const readMessageIds = data.messageIds.map((id) =>
                String(id)
            );

            useChatStore.setState((state) => ({
                messages: state.messages.map((message) => {
                    if (readMessageIds.includes(String(message._id))) {
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
        });

        // Handle message deletion events.
        socket.on("messageDeleted", (data) => {
            if (!data || !data.messageId) return;

            useChatStore.setState((state) => {
                if (data.deleteFor === "me") {
                    return {
                        messages: state.messages.filter(
                            (message) =>
                            String(message._id) !== String(data.messageId)
                        ),
                        replyingTo: state.replyingTo &&
                            String(state.replyingTo._id) === String(data.messageId) ?
                            null :
                            state.replyingTo,
                    };
                }

                if (data.deleteFor === "everyone") {
                    return {
                        messages: state.messages.map((message) => {
                            if (
                                String(message._id) ===
                                String(data.messageId)
                            ) {
                                return {
                                    ...message,
                                    text: "",
                                    image: "",
                                    deletedForEveryone: true,
                                    deletedAt: data.deletedAt,
                                };
                            }

                            return message;
                        }),

                        replyingTo: state.replyingTo &&
                            String(state.replyingTo._id) === String(data.messageId) ?
                            {
                                ...state.replyingTo,
                                text: "",
                                image: "",
                                deletedForEveryone: true,
                                deletedAt: data.deletedAt,
                            } :
                            state.replyingTo,
                    };
                }

                return state;
            });
        });
    },

    disconnectSocket: () => {
        const socket = get().socket;

        if (socket) {
            socket.disconnect();
        }

        set({
            socket: null,
            onlineUsers: [],
        });
    },
}));