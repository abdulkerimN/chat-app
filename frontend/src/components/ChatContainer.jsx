
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

import { useChatStore } from "../store/useChatStore";
import { useAuthStore } from "../store/useAuthStore";

import ChatHeader from "./ChatHeader";
import MessageInput from "./MessageInput";
import MessageSkeleton from "./skeletons/MessageSkeleton";

import { formatMessageTime } from "../libs/utils";

import {
    Check,
    CheckCheck,
    MoreVertical,
    Reply,
    Trash2,
    Pencil,
    Save,
    X,
    Forward,
    CheckCircle2,
    File,
    Download,
} from "lucide-react";

const ChatContainer = () => {
    const {
        messages,
        getMessages,
        isMessagesLoading,
        selectedUser,
        users,
        getUsers,
        deleteMessage,
        editMessage,
        setReplyingTo,
        toggleReaction,
        forwardMessage,
        subscribeToMessages,
        unsubscribeFromMessages,

        // Message search
        searchTargetMessage,
        clearSearchTargetMessage,
    } = useChatStore();

    const { authUser, socket } = useAuthStore();

    const messageEndRef = useRef(null);

    const [activeMenuId, setActiveMenuId] = useState(null);
    const [editingMessageId, setEditingMessageId] = useState(null);
    const [editText, setEditText] = useState("");

    const [menuPosition, setMenuPosition] = useState({
        top: 0,
        left: 0,
    });

    const [menuMessage, setMenuMessage] = useState(null);

    const [activeReactionPicker, setActiveReactionPicker] = useState(null);

    // Forward message dialog state
    const [forwardingMessage, setForwardingMessage] = useState(null);
    const [selectedForwardRecipients, setSelectedForwardRecipients] = useState([]);
    const [isForwarding, setIsForwarding] = useState(false);

    const availableEmojis = ["❤️", "😂", "👍", "😮", "😢", "🔥"];

    // Convert audio duration in seconds to MM:SS.
    const formatAudioDuration = (duration) => {
        const totalSeconds = Math.floor(Number(duration) || 0);
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;

        return `${minutes}:${String(seconds).padStart(2, "0")}`;
    };

    // Format file size into a readable value.
    const formatFileSize = (size) => {
        const bytes = Number(size) || 0;

        if (bytes < 1024) {
            return `${bytes} B`;
        }

        if (bytes < 1024 * 1024) {
            return `${(bytes / 1024).toFixed(1)} KB`;
        }

        return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
    };

    // Get a file extension from its original filename.
    const getFileExtension = (fileName) => {
        if (!fileName || !fileName.includes(".")) {
            return "FILE";
        }

        return fileName.split(".").pop().toUpperCase();
    };

    const getId = (value) => {
        if (!value) return "";

        if (typeof value === "object") {
            return String(value._id);
        }

        return String(value);
    };

    // Load messages whenever the selected conversation changes.
    useEffect(() => {
        if (selectedUser && selectedUser._id) {
            getMessages(selectedUser._id);
        }
    }, [selectedUser ? selectedUser._id : null, getMessages]);

    // Register real-time typing, reaction, and message listeners.
    useEffect(() => {
        if (!socket) return;

        subscribeToMessages();

        return () => {
            unsubscribeFromMessages();
        };
    }, [socket, subscribeToMessages, unsubscribeFromMessages]);

    // Automatically scroll to the latest message.
    useEffect(() => {
        if (messageEndRef.current) {
            messageEndRef.current.scrollIntoView({
                behavior: "smooth",
            });
        }
    }, [messages]);

    // Close menus when the conversation changes.
    useEffect(() => {
        setActiveMenuId(null);
        setMenuMessage(null);
        setEditingMessageId(null);
        setEditText("");
        setActiveReactionPicker(null);
        setForwardingMessage(null);
        setSelectedForwardRecipients([]);
    }, [selectedUser ? selectedUser._id : null]);

    // Close the options menu when resizing or scrolling.
    useEffect(() => {
        const closeMenu = () => {
            setActiveMenuId(null);
            setMenuMessage(null);
        };

        window.addEventListener("resize", closeMenu);
        window.addEventListener("scroll", closeMenu, true);

        return () => {
            window.removeEventListener("resize", closeMenu);
            window.removeEventListener("scroll", closeMenu, true);
        };
    }, []);

    // Scroll to a specific message and temporarily highlight it.
    const handleScrollToMessage = (messageId) => {
        const originalMessage = document.getElementById(
            `message-${messageId}`
        );

        if (!originalMessage) return;

        originalMessage.scrollIntoView({
            behavior: "smooth",
            block: "center",
        });

        originalMessage.classList.add(
            "ring-2",
            "ring-primary",
            "ring-offset-2",
            "ring-offset-base-100"
        );

        setTimeout(() => {
            originalMessage.classList.remove(
                "ring-2",
                "ring-primary",
                "ring-offset-2",
                "ring-offset-base-100"
            );
        }, 2000);
    };

    // Navigate to a message selected from search results.
    useEffect(() => {
        if (!searchTargetMessage) return;

        handleScrollToMessage(searchTargetMessage._id);

        const timeout = setTimeout(() => {
            clearSearchTargetMessage();
        }, 2100);

        return () => {
            clearTimeout(timeout);
        };
    }, [searchTargetMessage, messages, clearSearchTargetMessage]);

    // Open the message options menu using a portal.
    const handleMenuClick = (event, message) => {
        event.stopPropagation();

        if (activeMenuId === message._id) {
            setActiveMenuId(null);
            setMenuMessage(null);
            return;
        }

        const rect = event.currentTarget.getBoundingClientRect();

        const menuWidth = 192;
        const menuHeight = 230;

        let left = rect.right - menuWidth;
        let top = rect.bottom + 5;

        if (left < 8) {
            left = 8;
        }

        if (left + menuWidth > window.innerWidth - 8) {
            left = window.innerWidth - menuWidth - 8;
        }

        if (top + menuHeight > window.innerHeight - 8) {
            top = rect.top - menuHeight - 5;
        }

        if (top < 8) {
            top = 8;
        }

        setMenuPosition({ top, left });
        setMenuMessage(message);
        setActiveMenuId(message._id);
    };

    const handleReply = (message) => {
        setReplyingTo(message);
        setActiveMenuId(null);
        setMenuMessage(null);
    };

    const handleStartEdit = (message) => {
        setEditingMessageId(message._id);
        setEditText(message.text);
        setActiveMenuId(null);
        setMenuMessage(null);
    };

    const handleCancelEdit = () => {
        setEditingMessageId(null);
        setEditText("");
    };

    const handleSaveEdit = async (messageId) => {
        if (!editText.trim()) return;

        const success = await editMessage(messageId, editText);

        if (success) {
            setEditingMessageId(null);
            setEditText("");
        }
    };

    const handleDelete = async (messageId, deleteFor) => {
        await deleteMessage(messageId, deleteFor);
        setActiveMenuId(null);
        setMenuMessage(null);
    };

    // Add, change, or remove an emoji reaction.
    const handleReaction = async (messageId, emoji) => {
        await toggleReaction(messageId, emoji);
        setActiveReactionPicker(null);
    };

    // Open the forwarding dialog.
    const handleStartForward = async (message) => {
        setActiveMenuId(null);
        setMenuMessage(null);

        setForwardingMessage(message);
        setSelectedForwardRecipients([]);

        await getUsers();
    };

    // Select or deselect a forwarding recipient.
    const handleToggleForwardRecipient = (userId) => {
        setSelectedForwardRecipients((previousRecipients) => {
            if (previousRecipients.includes(userId)) {
                return previousRecipients.filter(
                    (id) => id !== userId
                );
            }

            return [...previousRecipients, userId];
        });
    };

    // Forward the selected message.
    const handleForward = async () => {
        if (
            !forwardingMessage ||
            selectedForwardRecipients.length === 0
        ) {
            return;
        }

        setIsForwarding(true);

        const success = await forwardMessage(
            forwardingMessage._id,
            selectedForwardRecipients
        );

        setIsForwarding(false);

        if (success) {
            setForwardingMessage(null);
            setSelectedForwardRecipients([]);
        }
    };

    // Close the forwarding dialog.
    const handleCloseForwardDialog = () => {
        if (isForwarding) return;

        setForwardingMessage(null);
        setSelectedForwardRecipients([]);
    };

    const getOriginalMessage = (replyTo) => {
        const replyId = getId(replyTo);

        if (!replyId) return null;

        return messages.find(
            (message) => String(message._id) === replyId
        );
    };

    const renderReply = (message) => {
        if (!message.replyTo) return null;

        const originalMessage = getOriginalMessage(message.replyTo);

        if (!originalMessage) {
            return (
                <div className="mb-2 p-2 rounded-lg bg-base-300/50 border-l-4 border-base-content/30">
                    <p className="text-xs opacity-60">
                        Original message unavailable
                    </p>
                </div>
            );
        }

        const originalSenderId = getId(originalMessage.senderId);

        const originalSender =
            originalSenderId === getId(authUser._id)
                ? "You"
                : selectedUser.fullname;

        let originalText = originalMessage.text;

        if (originalMessage.deletedForEveryone) {
            originalText = "This message was deleted";
        } else if (!originalText && originalMessage.image) {
            originalText = "Photo";
        } else if (!originalText && originalMessage.audio) {
            originalText = "Voice message";
        } else if (!originalText && originalMessage.file) {
            originalText = originalMessage.fileName || "File attachment";
        } else if (!originalText) {
            originalText = "Message";
        }

        return (
            <div
                onClick={() => handleScrollToMessage(originalMessage._id)}
                className="mb-2 p-2 rounded-lg bg-base-300/50 border-l-4 border-primary cursor-pointer hover:bg-base-300 transition-colors"
                title="Go to original message"
            >
                <p className="text-xs font-semibold text-primary mb-1">
                    {originalSender}
                </p>

                <p className="text-sm opacity-80 truncate">
                    {originalText}
                </p>
            </div>
        );
    };

    const renderMessageStatus = (message) => {
        if (message.status === "read") {
            return <CheckCheck className="size-4 text-sky-500" />;
        }

        if (message.status === "delivered") {
            return <CheckCheck className="size-4 opacity-60" />;
        }

        return <Check className="size-4 opacity-60" />;
    };

    // Render a general file attachment.
    const renderFileAttachment = (message) => {
        if (!message.file) return null;

        const fileName = message.fileName || "Shared file";
        const extension = getFileExtension(fileName);

        return (
            <div className="mb-2 w-full min-w-0 max-w-[280px]">
                <a
                    href={message.file}
                    target="_blank"
                    rel="noopener noreferrer"
                    download={fileName}
                    className={`flex items-center gap-3 rounded-xl border p-3 transition-colors ${
                        getId(message.senderId) === getId(authUser._id)
                            ? "border-primary-content/20 bg-primary-content/10 hover:bg-primary-content/20"
                            : "border-base-300 bg-base-100 hover:bg-base-300"
                    }`}
                    title={`Open ${fileName}`}
                >
                    <div className="flex size-12 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                        <File size={25} />
                    </div>

                    <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold">
                            {fileName}
                        </p>

                        <div className="mt-1 flex flex-wrap items-center gap-2 text-xs opacity-70">
                            <span className="rounded bg-base-content/10 px-1.5 py-0.5 font-semibold">
                                {extension}
                            </span>

                            <span>
                                {formatFileSize(message.fileSize)}
                            </span>
                        </div>
                    </div>

                    <Download className="size-5 shrink-0 opacity-70" />
                </a>
            </div>
        );
    };

    // Show the emoji reaction picker vertically on the right.
    const renderReactionPicker = (message) => {
        if (activeReactionPicker !== message._id) return null;

        return (
            <div className="absolute right-0 top-0 z-50 flex flex-col gap-2 rounded-xl bg-base-200 p-2 shadow-lg border border-base-300">
                {availableEmojis.map((emoji) => (
                    <button
                        key={emoji}
                        onClick={() => handleReaction(message._id, emoji)}
                        className="flex h-9 w-9 items-center justify-center rounded-lg text-xl hover:bg-base-300 transition-colors"
                        title={`React with ${emoji}`}
                    >
                        {emoji}
                    </button>
                ))}
            </div>
        );
    };

    // Display reactions below a message bubble.
    const renderReactions = (message) => {
        if (!message.reactions || message.reactions.length === 0) {
            return null;
        }

        const groupedReactions = {};

        message.reactions.forEach((reaction) => {
            const emoji = reaction.emoji;

            if (!groupedReactions[emoji]) {
                groupedReactions[emoji] = {
                    count: 0,
                    userReacted: false,
                };
            }

            groupedReactions[emoji].count += 1;

            if (
                getId(reaction.userId) === getId(authUser._id)
            ) {
                groupedReactions[emoji].userReacted = true;
            }
        });

        return (
            <div className="flex flex-wrap gap-1 mt-1 relative z-10">
                {Object.keys(groupedReactions).map((emoji) => {
                    const reaction = groupedReactions[emoji];

                    return (
                        <button
                            key={emoji}
                            onClick={() =>
                                handleReaction(message._id, emoji)
                            }
                            className={`flex items-center gap-1 px-2 py-1 rounded-full border text-xs transition-colors ${
                                reaction.userReacted
                                    ? "border-primary bg-primary/20"
                                    : "border-base-300 bg-base-200 hover:bg-base-300"
                            }`}
                            title="Click to toggle your reaction"
                        >
                            <span>{emoji}</span>
                            <span>{reaction.count}</span>
                        </button>
                    );
                })}
            </div>
        );
    };

    if (isMessagesLoading) {
        return (
            <div className="flex-1 min-w-0 flex flex-col overflow-hidden">
                <ChatHeader />
                <MessageSkeleton />
                <MessageInput />
            </div>
        );
    }

    return (
        <div className="flex-1 min-w-0 flex flex-col overflow-hidden">
            <ChatHeader />

            {/* Messages scrolling area */}
            <div className="flex-1 min-h-0 min-w-0 overflow-y-auto overflow-x-hidden px-4 pt-4 pb-16">
                <div className="flex flex-col gap-4 pb-6">

                    {messages.map((message) => {
                        const isOwnMessage =
                            getId(message.senderId) === getId(authUser._id);

                        const isDeleted = message.deletedForEveryone;

                        const isEditing =
                            editingMessageId === message._id;

                        const messageTime =
                            message.edited && message.editedAt
                                ? message.editedAt
                                : message.createdAt;

                        return (
                            <div
                                key={message._id}
                                id={`message-${message._id}`}
                                className={`flex w-full ${
                                    isOwnMessage
                                        ? "justify-end"
                                        : "justify-start"
                                } transition-shadow duration-300 rounded-lg`}
                            >
                                <div className="relative w-fit max-w-[85%] sm:max-w-[75%] pt-2">

                                    {/* Options Button */}
                                    {!isDeleted && !isEditing && (
                                        <button
                                            onClick={(event) =>
                                                handleMenuClick(event, message)
                                            }
                                            className="absolute -top-1 right-2 z-10 btn btn-circle btn-xs opacity-100 bg-base-300 border-none shadow-md"
                                            aria-label="Message options"
                                        >
                                            <MoreVertical className="size-4" />
                                        </button>
                                    )}

                                    {/* Emoji Picker Button */}
                                    {!isDeleted && !isEditing && (
                                        <button
                                            onClick={() =>
                                                setActiveReactionPicker(
                                                    activeReactionPicker === message._id
                                                        ? null
                                                        : message._id
                                                )
                                            }
                                            className="absolute -top-1 right-10 z-10 btn btn-circle btn-xs bg-base-300 border-none shadow-md"
                                            aria-label="Add reaction"
                                            title="Add reaction"
                                        >
                                            😊
                                        </button>
                                    )}

                                    {/* Emoji Picker */}
                                    {renderReactionPicker(message)}

                                    {/* Message Bubble */}
                                    <div
                                        className={`rounded-2xl p-3 break-words ${
                                            isOwnMessage
                                                ? "bg-primary text-primary-content rounded-br-none"
                                                : "bg-base-200 rounded-bl-none"
                                        }`}
                                    >
                                        {isDeleted ? (
                                            <p className="text-sm italic opacity-70">
                                                This message was deleted
                                            </p>
                                        ) : (
                                            <>
                                                {/* Forwarded Label */}
                                                {message.isForwarded && (
                                                    <div className="flex items-center gap-1 text-xs opacity-60 italic mb-2">
                                                        <Forward className="size-3" />
                                                        Forwarded
                                                    </div>
                                                )}

                                                {renderReply(message)}

                                                {/* Image Attachment */}
                                                {message.image && (
                                                    <img
                                                        src={message.image}
                                                        alt="Message attachment"
                                                        className="max-w-full rounded-lg mb-2 max-h-64 object-contain"
                                                    />
                                                )}

                                                {/* Voice Message Player */}
                                                {message.audio && (
                                                    <div className="mb-2 min-w-[220px] max-w-[280px]">
                                                        <div className="flex items-center gap-2 mb-1">
                                                            <span className="text-sm font-medium">
                                                                <span className="mr-1">🎤</span>
                                                                Voice message
                                                            </span>

                                                            <span className="text-xs opacity-70">
                                                                {formatAudioDuration(message.audioDuration)}
                                                            </span>
                                                        </div>

                                                        <audio
                                                            controls
                                                            preload="metadata"
                                                            src={message.audio}
                                                            className="w-full h-10"
                                                        >
                                                            Your browser does not support audio playback.
                                                        </audio>
                                                    </div>
                                                )}

                                                {/* General File Attachment */}
                                                {renderFileAttachment(message)}

                                                {isEditing ? (
                                                    <div className="space-y-2">
                                                        <textarea
                                                            value={editText}
                                                            onChange={(event) =>
                                                                setEditText(event.target.value)
                                                            }
                                                            className="textarea textarea-bordered w-full min-w-48 text-base-content bg-base-100"
                                                            rows={3}
                                                            autoFocus
                                                        />

                                                        <div className="flex justify-end gap-2">
                                                            <button
                                                                onClick={handleCancelEdit}
                                                                className="btn btn-sm btn-ghost"
                                                            >
                                                                <X className="size-4" />
                                                                Cancel
                                                            </button>

                                                            <button
                                                                onClick={() =>
                                                                    handleSaveEdit(message._id)
                                                                }
                                                                disabled={!editText.trim()}
                                                                className="btn btn-sm btn-success"
                                                            >
                                                                <Save className="size-4" />
                                                                Save
                                                            </button>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    message.text && (
                                                        <p className="whitespace-pre-wrap">
                                                            {message.text}
                                                        </p>
                                                    )
                                                )}
                                            </>
                                        )}

                                        {/* Time and Status */}
                                        <div className="flex items-center justify-end gap-1 mt-1">
                                            {message.edited && !isDeleted && (
                                                <span className="text-[10px] opacity-70 italic">
                                                    Edited
                                                </span>
                                            )}

                                            <span className="text-[10px] opacity-70">
                                                {formatMessageTime(messageTime)}
                                            </span>

                                            {isOwnMessage && !isDeleted && (
                                                renderMessageStatus(message)
                                            )}
                                        </div>
                                    </div>

                                    {/* Reactions below the message bubble */}
                                    {!isDeleted && renderReactions(message)}
                                </div>
                            </div>
                        );
                    })}

                    {/* Extra space after the last message and its reactions */}
                    <div
                        ref={messageEndRef}
                        className="h-4 shrink-0"
                    />
                </div>
            </div>

            <MessageInput />

            {/* Portal: renders the options menu outside the scrolling container */}
            {activeMenuId && menuMessage && createPortal(
                <div
                    className="fixed z-[9999] w-48 bg-base-200 border border-base-300 rounded-lg shadow-xl p-1"
                    style={{
                        top: menuPosition.top,
                        left: menuPosition.left,
                    }}
                    onClick={(event) => event.stopPropagation()}
                >
                    <button
                        onClick={() => handleReply(menuMessage)}
                        className="w-full flex items-center gap-2 px-3 py-2 text-sm rounded-md hover:bg-base-300"
                    >
                        <Reply className="size-4" />
                        Reply
                    </button>

                    <button
                        onClick={() => handleStartForward(menuMessage)}
                        className="w-full flex items-center gap-2 px-3 py-2 text-sm rounded-md hover:bg-base-300"
                    >
                        <Forward className="size-4" />
                        Forward
                    </button>

                    {getId(menuMessage.senderId) === getId(authUser._id) &&
                        menuMessage.text && (
                            <button
                                onClick={() => handleStartEdit(menuMessage)}
                                className="w-full flex items-center gap-2 px-3 py-2 text-sm rounded-md hover:bg-base-300"
                            >
                                <Pencil className="size-4" />
                                Edit
                            </button>
                        )}

                    <button
                        onClick={() => handleDelete(menuMessage._id, "me")}
                        className="w-full flex items-center gap-2 px-3 py-2 text-sm rounded-md hover:bg-base-300"
                    >
                        <Trash2 className="size-4" />
                        Delete for me
                    </button>

                    {getId(menuMessage.senderId) === getId(authUser._id) && (
                        <button
                            onClick={() =>
                                handleDelete(menuMessage._id, "everyone")
                            }
                            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-error rounded-md hover:bg-base-300"
                        >
                            <Trash2 className="size-4" />
                            Delete for everyone
                        </button>
                    )}
                </div>,
                document.body
            )}

            {/* Forward Message Dialog */}
            {forwardingMessage && (
                <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/60 p-4">
                    <div className="w-full max-w-md bg-base-100 rounded-xl shadow-2xl border border-base-300">

                        {/* Dialog Header */}
                        <div className="flex items-center justify-between p-4 border-b border-base-300">
                            <div className="flex items-center gap-2">
                                <Forward className="size-5 text-primary" />

                                <h2 className="font-semibold text-lg">
                                    Forward Message
                                </h2>
                            </div>

                            <button
                                onClick={handleCloseForwardDialog}
                                disabled={isForwarding}
                                className="btn btn-sm btn-circle btn-ghost"
                            >
                                <X className="size-5" />
                            </button>
                        </div>

                        {/* Message Preview */}
                        <div className="p-4 border-b border-base-300">
                            <p className="text-xs opacity-60 mb-2">
                                Message to forward
                            </p>

                            <div className="bg-base-200 rounded-lg p-3 text-sm">
                                {forwardingMessage.image && (
                                    <img
                                        src={forwardingMessage.image}
                                        alt="Forwarded attachment"
                                        className="max-h-24 rounded-lg mb-2 object-contain"
                                    />
                                )}

                                {forwardingMessage.audio && (
                                    <p className="mb-2">
                                        🎤 Voice message
                                    </p>
                                )}

                                {forwardingMessage.file && (
                                    <div className="flex items-center gap-2 mb-2">
                                        <File className="size-5 shrink-0" />

                                        <span className="truncate">
                                            {forwardingMessage.fileName || "Shared file"}
                                        </span>

                                        <span className="text-xs opacity-60 shrink-0">
                                            {getFileExtension(forwardingMessage.fileName)}
                                        </span>
                                    </div>
                                )}

                                {forwardingMessage.text && (
                                    <p className="whitespace-pre-wrap break-words">
                                        {forwardingMessage.text}
                                    </p>
                                )}

                                {!forwardingMessage.image &&
                                    !forwardingMessage.audio &&
                                    !forwardingMessage.file &&
                                    !forwardingMessage.text && (
                                        <p className="opacity-60">
                                            Message attachment
                                        </p>
                                    )}
                            </div>
                        </div>

                        {/* Recipient List */}
                        <div className="p-4">
                            <h3 className="font-medium mb-3">
                                Select recipients
                            </h3>

                            <div className="max-h-64 overflow-y-auto space-y-2">

                                {users.length === 0 ? (
                                    <p className="text-sm text-center opacity-60 py-6">
                                        No accepted friends available
                                    </p>
                                ) : (
                                    users.map((user) => {
                                        const isSelected =
                                            selectedForwardRecipients.includes(user._id);

                                        return (
                                            <button
                                                key={user._id}
                                                onClick={() =>
                                                    handleToggleForwardRecipient(user._id)
                                                }
                                                className={`w-full flex items-center justify-between p-3 rounded-lg border transition-colors ${
                                                    isSelected
                                                        ? "border-primary bg-primary/10"
                                                        : "border-base-300 hover:bg-base-200"
                                                }`}
                                            >
                                                <div className="flex items-center gap-3 min-w-0">
                                                    <img
                                                        src={
                                                            user.profilePic ||
                                                            "/avatar.png"
                                                        }
                                                        alt={user.fullname}
                                                        className="size-10 rounded-full object-cover"
                                                    />

                                                    <div className="text-left min-w-0">
                                                        <p className="font-medium truncate">
                                                            {user.fullname}
                                                        </p>

                                                        <p className="text-xs opacity-60 truncate">
                                                            {user.email}
                                                        </p>
                                                    </div>
                                                </div>

                                                {isSelected && (
                                                    <CheckCircle2 className="size-5 text-primary shrink-0" />
                                                )}
                                            </button>
                                        );
                                    })
                                )}

                            </div>
                        </div>

                        {/* Dialog Footer */}
                        <div className="flex items-center justify-between gap-3 p-4 border-t border-base-300">
                            <p className="text-xs opacity-60">
                                {selectedForwardRecipients.length} selected
                            </p>

                            <div className="flex gap-2">
                                <button
                                    onClick={handleCloseForwardDialog}
                                    disabled={isForwarding}
                                    className="btn btn-sm btn-ghost"
                                >
                                    Cancel
                                </button>

                                <button
                                    onClick={handleForward}
                                    disabled={
                                        selectedForwardRecipients.length === 0 ||
                                        isForwarding
                                    }
                                    className="btn btn-sm btn-primary"
                                >
                                    {isForwarding ? (
                                        <span className="loading loading-spinner loading-xs"></span>
                                    ) : (
                                        <Forward className="size-4" />
                                    )}

                                    Forward
                                </button>
                            </div>
                        </div>

                    </div>
                </div>
            )}
        </div>
    );
};

export default ChatContainer;
