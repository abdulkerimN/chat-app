
import { THEMES } from "../constants";
import { useThemeStore } from "../store/useThemeStore";
import { Send } from "lucide-react";

const PREVIEW_MESSAGES = [
  { id: 1, content: "Hey! How's it going?", isSent: false },
  {
    id: 2,
    content: "I'm doing great! Just working on some new features.",
    isSent: true,
  },
];

const SettingsPage = () => {
  const { theme, setTheme } = useThemeStore();

  const handleThemeChange = (selectedTheme) => {
    setTheme(selectedTheme);
  };

  return (
    <div className="min-h-[100dvh] w-full bg-base-100 text-base-content px-3 sm:px-6 pt-16 sm:pt-20 pb-8">

      <div className="max-w-5xl mx-auto space-y-6 sm:space-y-8">

        {/* Header */}
        <div className="space-y-1">
          <h2 className="text-xl sm:text-2xl font-semibold">
            Theme Settings
          </h2>

          <p className="text-sm text-base-content/70">
            Choose a theme for your chat interface
          </p>
        </div>

        {/* Theme Selection */}
        <div className="grid grid-cols-3 min-[400px]:grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-8 gap-2 sm:gap-3">

          {THEMES.map((t) => (
            <button
              key={t}
              type="button"
              aria-pressed={theme === t}
              className={`group flex flex-col items-center gap-2 p-2 sm:p-3 rounded-lg transition-colors ${
                theme === t
                  ? "bg-base-200 ring-1 ring-primary"
                  : "hover:bg-base-200/50"
              }`}
              onClick={() => handleThemeChange(t)}
            >
              <div
                className="relative h-9 sm:h-10 w-full rounded-md overflow-hidden"
                data-theme={t}
              >
                <div className="absolute inset-0 grid grid-cols-4 gap-px p-1">
                  <div className="rounded bg-primary" />
                  <div className="rounded bg-secondary" />
                  <div className="rounded bg-accent" />
                  <div className="rounded bg-neutral" />
                </div>
              </div>

              <span className="text-[11px] sm:text-xs font-medium truncate w-full text-center">
                {t.charAt(0).toUpperCase() + t.slice(1)}
              </span>
            </button>
          ))}

        </div>

        {/* Preview */}
        <div className="space-y-3">

          <div>
            <h3 className="text-lg sm:text-xl font-semibold">
              Preview
            </h3>

            <p className="text-sm text-base-content/70">
              See how your selected theme looks in a conversation.
            </p>
          </div>

          <div className="rounded-xl border border-base-300 overflow-hidden bg-base-100 shadow-sm">

            <div className="p-3 sm:p-5 bg-base-200">

              <div className="max-w-lg mx-auto">

                <div className="bg-base-100 rounded-xl shadow-sm overflow-hidden">

                  {/* Preview Header */}
                  <div className="px-3 sm:px-4 py-3 border-b border-base-300 bg-base-100">
                    <div className="flex items-center gap-3">

                      <div className="size-9 rounded-full bg-primary flex items-center justify-center text-primary-content font-medium shrink-0">
                        J
                      </div>

                      <div className="min-w-0">
                        <h3 className="font-medium text-sm">
                          John Doe
                        </h3>

                        <p className="text-xs text-base-content/70">
                          Online
                        </p>
                      </div>

                    </div>
                  </div>

                  {/* Preview Messages */}
                  <div className="p-3 sm:p-4 space-y-4 min-h-[180px] max-h-[220px] overflow-y-auto bg-base-100">

                    {PREVIEW_MESSAGES.map((message) => (
                      <div
                        key={message.id}
                        className={`flex ${
                          message.isSent
                            ? "justify-end"
                            : "justify-start"
                        }`}
                      >
                        <div
                          className={`max-w-[85%] sm:max-w-[80%] rounded-xl p-3 shadow-sm break-words ${
                            message.isSent
                              ? "bg-primary text-primary-content"
                              : "bg-base-200"
                          }`}
                        >
                          <p className="text-sm">
                            {message.content}
                          </p>

                          <p
                            className={`text-[10px] mt-1.5 ${
                              message.isSent
                                ? "text-primary-content/70"
                                : "text-base-content/70"
                            }`}
                          >
                            12:00 PM
                          </p>
                        </div>
                      </div>
                    ))}

                  </div>

                  {/* Preview Input */}
                  <div className="p-3 sm:p-4 border-t border-base-300 bg-base-100">

                    <div className="flex items-center gap-2">

                      <input
                        type="text"
                        className="input input-bordered flex-1 min-w-0 text-sm h-10"
                        placeholder="Type a message..."
                        value="This is a preview"
                        readOnly
                      />

                      <button
                        type="button"
                        className="btn btn-primary btn-square h-10 min-h-0 shrink-0"
                        aria-label="Preview send button"
                      >
                        <Send size={18} />
                      </button>

                    </div>
                  </div>

                </div>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default SettingsPage;
