
import { useEffect, useState } from "react";
import { Search, UserPlus, Check, X, Users } from "lucide-react";
import { useChatStore } from "../store/useChatStore";

const FriendsPage = () => {
  const [query, setQuery] = useState("");

  const {
    searchResults,
    friendRequests,
    isSearching,
    searchUsers,
    sendFriendRequest,
    getFriendRequests,
    acceptFriendRequest,
    rejectFriendRequest,
  } = useChatStore();

  useEffect(() => {
    getFriendRequests();
  }, [getFriendRequests]);

  const handleSearch = (e) => {
    e.preventDefault();
    searchUsers(query);
  };

  const handleSendRequest = async (userId) => {
    await sendFriendRequest(userId);
  };

  return (
    <div className="min-h-dvh bg-base-200 px-3 pb-8 pt-20 sm:px-6">
      <div className="mx-auto max-w-3xl space-y-6">

        {/* Page Heading */}
        <div>
          <h1 className="text-2xl font-bold sm:text-3xl">
            Friends
          </h1>
          <p className="mt-1 text-sm text-base-content/60">
            Find people and manage your friend requests.
          </p>
        </div>

        {/* Search Users */}
        <section className="rounded-xl bg-base-100 p-4 shadow-sm sm:p-6">
          <div className="mb-4 flex items-center gap-2">
            <UserPlus className="size-5 text-primary" />
            <h2 className="text-lg font-semibold">
              Find Friends
            </h2>
          </div>

          <form onSubmit={handleSearch} className="flex gap-2">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by name or email..."
              className="input input-bordered min-w-0 flex-1"
            />

            <button
              type="submit"
              disabled={!query.trim() || isSearching}
              className="btn btn-primary"
            >
              {isSearching ? (
                <span className="loading loading-spinner loading-sm" />
              ) : (
                <Search className="size-5" />
              )}
              <span className="hidden sm:inline">Search</span>
            </button>
          </form>

          {/* Search Results */}
          <div className="mt-4 space-y-3">
            {searchResults.map((user) => (
              <div
                key={user._id}
                className="flex items-center justify-between gap-3 rounded-lg border border-base-300 p-3"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <img
                    src={user.profilePic || "/avatar.png"}
                    alt={user.fullname}
                    className="size-11 shrink-0 rounded-full object-cover"
                  />

                  <div className="min-w-0">
                    <p className="truncate font-medium">
                      {user.fullname}
                    </p>
                  </div>
                </div>

                {/* Relationship Status Buttons */}

                {user.relationshipStatus === "none" && (
                  <button
                    onClick={() => handleSendRequest(user._id)}
                    className="btn btn-primary btn-sm"
                  >
                    <UserPlus size={16} />
                    Add Friend
                  </button>
                )}

                {user.relationshipStatus === "request_sent" && (
                  <button className="btn btn-sm" disabled>
                    Request Sent
                  </button>
                )}

                {user.relationshipStatus === "friends" && (
                  <button className="btn btn-sm btn-success" disabled>
                    <Check size={16} />
                    Friends
                  </button>
                )}

                {user.relationshipStatus === "request_received" && (
                  <div className="flex gap-2">
                    <button
                      onClick={async () => {
                        await acceptFriendRequest(user.requestId);
                        await searchUsers(query);
                        await getFriendRequests();
                      }}
                      className="btn btn-success btn-sm"
                    >
                      <Check size={16} />
                      Accept
                    </button>

                    <button
                      onClick={async () => {
                        await rejectFriendRequest(user.requestId);
                        await searchUsers(query);
                        await getFriendRequests();
                      }}
                      className="btn btn-error btn-sm"
                    >
                      <X size={16} />
                      Reject
                    </button>
                  </div>
                )}
              </div>
            ))}

            {!isSearching && query.trim() && searchResults.length === 0 && (
              <p className="py-4 text-center text-sm text-base-content/60">
                No users found. Try another name or email.
              </p>
            )}
          </div>
        </section>

        {/* Incoming Friend Requests */}
        <section className="rounded-xl bg-base-100 p-4 shadow-sm sm:p-6">
          <div className="mb-4 flex items-center gap-2">
            <Users className="size-5 text-primary" />
            <h2 className="text-lg font-semibold">
              Friend Requests
            </h2>
            <span className="badge badge-primary">
              {friendRequests.length}
            </span>
          </div>

          {friendRequests.length === 0 ? (
            <p className="py-5 text-center text-sm text-base-content/60">
              You don't have any pending friend requests.
            </p>
          ) : (
            <div className="space-y-3">
              {friendRequests.map((request) => (
                <div
                  key={request._id}
                  className="flex items-center justify-between gap-3 rounded-lg border border-base-300 p-3"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <img
                      src={
                        (request.requester && request.requester.profilePic) ||
                        "/avatar.png"
                      }
                      alt={
                        (request.requester && request.requester.fullname) ||
                        "User"
                      }
                      className="size-11 shrink-0 rounded-full object-cover"
                    />

                    <div className="min-w-0">
                      <p className="truncate font-medium">
                        {(request.requester && request.requester.fullname) ||
                          "Unknown user"}
                      </p>
                      <p className="text-xs text-base-content/60">
                        Wants to be your friend
                      </p>
                    </div>
                  </div>

                  <div className="flex shrink-0 gap-1">
                    <button
                      onClick={async () => {
                        await acceptFriendRequest(request._id);
                        await getFriendRequests();
                      }}
                      className="btn btn-success btn-sm btn-square"
                      aria-label="Accept request"
                      title="Accept"
                    >
                      <Check size={16} />
                    </button>

                    <button
                      onClick={async () => {
                        await rejectFriendRequest(request._id);
                        await getFriendRequests();
                      }}
                      className="btn btn-error btn-outline btn-sm btn-square"
                      aria-label="Reject request"
                      title="Reject"
                    >
                      <X size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

      </div>
    </div>
  );
};

export default FriendsPage;
