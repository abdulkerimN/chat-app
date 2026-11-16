
import { useEffect, useState } from "react";
import { useChatStore } from "../store/useChatStore";
import { useAuthStore } from "../store/useAuthStore";
import SidebarSkeleton from "./skeletons/SidebarSkeleton";
import { Users, MoreVertical, UserMinus } from "lucide-react";

const Sidebar = () => {
  const {
    getUsers,
    users,
    selectedUser,
    setSelectedUser,
    isUsersLoading,
    removeFriend,
  } = useChatStore();

  const { onlineUsers } = useAuthStore();

  const [showOnlineOnly, setShowOnlineOnly] = useState(false);
  const [openMenuUserId, setOpenMenuUserId] = useState(null);

  useEffect(() => {
    getUsers();
  }, [getUsers]);

  // Count online contacts
  const onlineContactsCount = users.filter((user) =>
    onlineUsers.includes(user._id)
  ).length;

  // Filter contacts
  const filteredUsers = showOnlineOnly
    ? users.filter((user) => onlineUsers.includes(user._id))
    : users;

  // Remove friend
  const handleRemoveFriend = async (user) => {
    const confirmed = window.confirm(
      `Are you sure you want to remove ${user.fullname} from your friends?`
    );

    if (!confirmed) return;

    await removeFriend(user._id);

    setOpenMenuUserId(null);
  };

  if (isUsersLoading) {
    return (
      <div className="h-full w-full md:w-60 lg:w-72">
        <SidebarSkeleton />
      </div>
    );
  }

  return (
    <aside className="flex h-full w-full shrink-0 flex-col border-r border-base-300 md:w-60 lg:w-72">

      {/* Sidebar Header */}
      <div className="w-full border-b border-base-300 p-3 sm:p-4">
        <div className="flex items-center gap-2">
          <Users className="size-6 shrink-0" />

          <span className="font-medium">Contacts</span>

          <span className="ml-auto text-xs text-base-content/60">
            {users.length}
          </span>
        </div>

        {/* Online Filter */}
        <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
          <label className="flex cursor-pointer items-center gap-2">
            <input
              type="checkbox"
              checked={showOnlineOnly}
              onChange={(e) => setShowOnlineOnly(e.target.checked)}
              className="checkbox checkbox-sm"
            />

            <span className="text-sm">Show online only</span>
          </label>

          <span className="text-xs text-base-content/60">
            {onlineContactsCount} online
          </span>
        </div>
      </div>

      {/* Contacts List */}
      <div className="w-full flex-1 min-h-0 overflow-y-auto py-2">
        {filteredUsers.map((user) => {
          const isOnline = onlineUsers.includes(user._id);
          const isSelected =
            selectedUser && selectedUser._id === user._id;

          const isMenuOpen = openMenuUserId === user._id;

          return (
            <div
              key={user._id}
              className={`
                relative flex w-full items-center gap-2 p-2 sm:p-3
                transition-colors hover:bg-base-300
                ${isSelected ? "bg-base-300" : ""}
              `}
            >
              {/* Select Contact Button */}
              <button
                type="button"
                onClick={() => {
                  setSelectedUser(user);
                  setOpenMenuUserId(null);
                }}
                className="flex min-w-0 flex-1 items-center gap-3 text-left"
              >
                {/* Profile Picture */}
                <div className="relative shrink-0">
                  <img
                    src={user.profilePic || "/avatar.png"}
                    alt={user.fullname}
                    className="size-11 rounded-full object-cover sm:size-12"
                  />

                  {isOnline && (
                    <span className="absolute bottom-0 right-0 size-3 rounded-full bg-green-500 ring-2 ring-base-100" />
                  )}
                </div>

                {/* User Information */}
                <div className="min-w-0 flex-1">
                  <div className="truncate font-medium">
                    {user.fullname}
                  </div>

                  <div className="text-sm text-base-content/50">
                    {isOnline ? "Online" : "Offline"}
                  </div>
                </div>
              </button>

              {/* Three-Dot Menu */}
              <div className="relative shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    setOpenMenuUserId(
                      isMenuOpen ? null : user._id
                    );
                  }}
                  className="flex size-9 items-center justify-center rounded-full hover:bg-base-100"
                  aria-label={`More options for ${user.fullname}`}
                  title="More options"
                >
                  <MoreVertical className="size-5" />
                </button>

                {/* Dropdown Menu */}
                {isMenuOpen && (
                  <div className="absolute right-0 top-full z-50 mt-1 w-44 rounded-lg border border-base-300 bg-base-100 p-1 shadow-lg">
                    <button
                      type="button"
                      onClick={() => handleRemoveFriend(user)}
                      className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-error hover:bg-base-200"
                    >
                      <UserMinus className="size-4" />
                      Remove Friend
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {/* Empty State */}
        {filteredUsers.length === 0 && (
          <div className="px-3 py-6 text-center text-sm text-base-content/60">
            {showOnlineOnly
              ? "No online users"
              : "No contacts found"}
          </div>
        )}
      </div>
    </aside>
  );
};

export default Sidebar;
