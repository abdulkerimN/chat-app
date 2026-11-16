
import { useState } from "react";
import {
    ArrowLeft,
    X,
    Search,
    LoaderCircle,
} from "lucide-react";

import { useAuthStore } from "../store/useAuthStore";
import { useChatStore } from "../store/useChatStore";

const ChatHeader = () => {
    const {
        selectedUser,
        setSelectedUser,
        typingUsers,
        searchMessages,
        searchMessagesResults,
        isSearchingMessages,
        clearMessageSearch,
        setSearchTargetMessage,
    } = useChatStore();

    const { onlineUsers } = useAuthStore();

    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");

    if (!selectedUser) return null;

    const isOnline = onlineUsers.includes(selectedUser._id);
    const isTyping = typingUsers.includes(selectedUser._id);

    const handleOpenSearch = () => {
        setIsSearchOpen(true);
        setSearchQuery("");
        clearMessageSearch();
    };

    const handleCloseSearch = () => {
        setIsSearchOpen(false);
        setSearchQuery("");
        clearMessageSearch();
    };

    const handleSearch = (event) => {
        event.preventDefault();

        if (!searchQuery.trim()) {
            clearMessageSearch();
            return;
        }

        searchMessages(selectedUser._id, searchQuery);
    };

    const handleSelectResult = (message) => {
        setSearchTargetMessage(message);
        handleCloseSearch();
    };

    return (
        <div className="relative z-30 w-full shrink-0 border-b border-base-300 p-2.5">

            <div className="flex w-full items-center justify-between gap-2">

                {/* User Information */}
                <div className="flex min-w-0 items-center gap-2 sm:gap-3">

                    {/* Mobile Back Button */}
                    <button
                        type="button"
                        onClick={() => setSelectedUser(null)}
                        className="flex size-10 shrink-0 items-center justify-center rounded-full hover:bg-base-300 md:hidden"
                        aria-label="Back to contacts"
                    >
                        <ArrowLeft className="size-6" />
                    </button>

                    {/* User Avatar */}
                    <div className="size-10 shrink-0 overflow-hidden rounded-full">
                        <img
                            src={selectedUser.profilePic || "/avatar.png"}
                            alt={selectedUser.fullname}
                            className="h-full w-full object-cover"
                        />
                    </div>

                    {/* User Name and Status */}
                    <div className="min-w-0">
                        <h3 className="truncate font-medium">
                            {selectedUser.fullname}
                        </h3>

                        <p
                            className={`text-sm ${
                                isTyping
                                    ? "text-success"
                                    : "text-base-content/70"
                            }`}
                        >
                            {isTyping
                                ? "Typing..."
                                : isOnline
                                    ? "Online"
                                    : "Offline"}
                        </p>
                    </div>
                </div>

                {/* Header Actions */}
                <div className="flex shrink-0 items-center gap-1">

                    {/* Search Button */}
                    <button
                        type="button"
                        onClick={handleOpenSearch}
                        className="flex size-10 items-center justify-center rounded-full hover:bg-base-300"
                        aria-label="Search messages"
                        title="Search messages"
                    >
                        <Search className="size-5" />
                    </button>

                    {/* Desktop Close Button */}
                    <button
                        type="button"
                        onClick={() => setSelectedUser(null)}
                        className="hidden size-10 items-center justify-center rounded-full hover:bg-base-300 md:flex"
                        aria-label="Close chat"
                    >
                        <X className="size-5" />
                    </button>
                </div>
            </div>

            {/* Message Search Panel */}
            {isSearchOpen && (
                <div className="absolute right-2 top-full z-50 mt-2 w-[calc(100%-1rem)] max-w-sm overflow-hidden rounded-xl border border-base-300 bg-base-100 shadow-xl">

                    {/* Search Input */}
                    <form
                        onSubmit={handleSearch}
                        className="flex items-center gap-2 border-b border-base-300 p-3"
                    >
                        <Search className="size-5 shrink-0 text-base-content/60" />

                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(event) =>
                                setSearchQuery(event.target.value)
                            }
                            placeholder="Search messages..."
                            autoFocus
                            className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-base-content/50"
                        />

                        {isSearchingMessages ? (
                            <LoaderCircle className="size-5 animate-spin text-primary" />
                        ) : (
                            <button
                                type="submit"
                                disabled={!searchQuery.trim()}
                                className="rounded-lg bg-primary px-3 py-1.5 text-sm text-primary-content disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                Search
                            </button>
                        )}

                        <button
                            type="button"
                            onClick={handleCloseSearch}
                            className="flex size-8 shrink-0 items-center justify-center rounded-full hover:bg-base-300"
                            aria-label="Close search"
                        >
                            <X className="size-4" />
                        </button>
                    </form>

                    {/* Search Results */}
                    <div className="max-h-80 overflow-y-auto">

                        {isSearchingMessages && (
                            <div className="flex items-center justify-center gap-2 p-5 text-sm text-base-content/60">
                                <LoaderCircle className="size-4 animate-spin" />
                                Searching messages...
                            </div>
                        )}

                        {!isSearchingMessages &&
                            searchQuery.trim() &&
                            searchMessagesResults.length === 0 && (
                                <div className="p-5 text-center text-sm text-base-content/60">
                                    No matching messages found.
                                </div>
                            )}

                        {!isSearchingMessages &&
                            searchMessagesResults.length > 0 && (
                                <div>
                                    <p className="px-3 pb-2 pt-3 text-xs font-semibold uppercase text-base-content/50">
                                        {searchMessagesResults.length} search result(s)
                                    </p>

                                    {searchMessagesResults.map((message) => (
                                        <button
                                            key={message._id}
                                            type="button"
                                            onClick={() =>
                                                handleSelectResult(message)
                                            }
                                            className="w-full border-t border-base-300 px-3 py-3 text-left transition-colors hover:bg-base-200"
                                        >
                                            <p className="line-clamp-2 break-words text-sm">
                                                {message.text || "Image message"}
                                            </p>

                                            <p className="mt-1 text-xs text-base-content/50">
                                                {new Date(
                                                    message.createdAt
                                                ).toLocaleString()}
                                            </p>
                                        </button>
                                    ))}
                                </div>
                            )}

                        {!isSearchingMessages &&
                            !searchQuery.trim() && (
                                <p className="p-4 text-center text-sm text-base-content/50">
                                    Enter a word or phrase to search this conversation.
                                </p>
                            )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default ChatHeader;
