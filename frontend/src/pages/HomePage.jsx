
import React from "react";
import Sidebar from "../components/Sidebar";
import NoChatSelected from "../components/NoChatSelected";
import { useChatStore } from "../store/useChatStore";
import ChatContainer from "../components/ChatContainer";

const HomePage = () => {
  const { selectedUser } = useChatStore();

  return (
    <div className="h-dvh bg-base-200 pt-16">
      <div className="h-[calc(100dvh-4rem)] md:flex md:items-center md:justify-center md:px-4 md:pt-20">
        <div className="h-full w-full bg-base-100 md:max-w-6xl md:rounded-lg md:shadow-xl md:h-[calc(100vh-8rem)]">
          <div className="flex h-full min-h-0 flex-col overflow-hidden md:flex-row md:rounded-lg">

            {/* Sidebar */}
            <div
              className={`h-full min-h-0 w-full md:w-auto ${
                selectedUser ? "hidden md:flex" : "flex"
              }`}
            >
              <Sidebar />
            </div>

            {/* Chat Area */}
            <div
              className={`h-full min-h-0 w-full min-w-0 flex-1 ${
                selectedUser ? "flex" : "hidden md:flex"
              }`}
            >
              {selectedUser ? <ChatContainer /> : <NoChatSelected />}
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};

export default HomePage;
