
import { useState } from "react";
import { useAuthStore } from "../store/useAuthStore";
import { Camera, Mail, User } from "lucide-react";

const ProfilePage = () => {
  const { authUser, isUpdatingProfile, updateProfile } = useAuthStore();
  const [selectedImg, setSelectedImg] = useState(null);

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];

    if (!file) return;

    if (!file.type.startsWith("image/")) {
      alert("Please select a valid image file.");
      e.target.value = "";
      return;
    }

    const reader = new FileReader();

    reader.onload = async () => {
      if (typeof reader.result !== "string") return;

      const base64Image = reader.result;
      const previousImg = selectedImg;

      setSelectedImg(base64Image);

      const success = await updateProfile({
        profilePic: base64Image,
      });

      if (!success) {
        setSelectedImg(previousImg);
      }

      e.target.value = "";
    };

    reader.onerror = () => {
      alert("Failed to read the selected image.");
      e.target.value = "";
    };

    reader.readAsDataURL(file);
  };

  if (!authUser) {
    return (
      <div className="min-h-[100dvh] flex items-center justify-center">
        <p>Loading profile...</p>
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] pt-16 sm:pt-20 pb-8 px-3 sm:px-6">

      <div className="max-w-2xl mx-auto py-4 sm:py-8">

        <div className="bg-base-300 rounded-xl p-4 sm:p-6 md:p-8 space-y-6 sm:space-y-8">

          {/* Page Header */}
          <div className="text-center">
            <h1 className="text-2xl sm:text-3xl font-semibold">
              Profile
            </h1>

            <p className="mt-2 text-sm sm:text-base text-base-content/70">
              Your profile information
            </p>
          </div>

          {/* Avatar Upload */}
          <div className="flex flex-col items-center gap-4">

            <div className="relative">
              <img
                src={
                  selectedImg ||
                  authUser.profilePic ||
                  "/avatar.png"
                }
                alt="Profile"
                className="size-28 sm:size-32 rounded-full object-cover border-4 border-base-content/10"
              />

              <label
                htmlFor="avatar-upload"
                className={`
                  absolute bottom-0 right-0
                  bg-base-content hover:scale-105
                  p-2 sm:p-2.5 rounded-full cursor-pointer
                  transition-all duration-200
                  ${
                    isUpdatingProfile
                      ? "animate-pulse pointer-events-none"
                      : ""
                  }
                `}
              >
                <Camera className="size-5 text-base-200" />

                <input
                  type="file"
                  id="avatar-upload"
                  className="hidden"
                  accept="image/*"
                  onChange={handleImageUpload}
                  disabled={isUpdatingProfile}
                />
              </label>
            </div>

            <p className="text-xs sm:text-sm text-base-content/60 text-center">
              {isUpdatingProfile
                ? "Uploading..."
                : "Click the camera icon to update your photo"}
            </p>
          </div>

          {/* Profile Details */}
          <div className="space-y-5 sm:space-y-6">

            <div className="space-y-2">
              <div className="text-sm text-base-content/60 flex items-center gap-2">
                <User className="size-4" />
                Full Name
              </div>

              <p className="px-3 sm:px-4 py-3 bg-base-200 rounded-lg border border-base-content/10 break-words">
                {authUser.fullname || "Not provided"}
              </p>
            </div>

            <div className="space-y-2">
              <div className="text-sm text-base-content/60 flex items-center gap-2">
                <Mail className="size-4" />
                Email Address
              </div>

              <p className="px-3 sm:px-4 py-3 bg-base-200 rounded-lg border border-base-content/10 break-all">
                {authUser.email || "Not provided"}
              </p>
            </div>

          </div>

          {/* Account Information */}
          <div className="bg-base-200 rounded-xl p-4 sm:p-6">

            <h2 className="text-lg font-medium mb-4">
              Account Information
            </h2>

            <div className="space-y-3 text-sm">

              <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between py-2 border-b border-base-content/10">
                <span className="text-base-content/70">
                  Member Since
                </span>

                <span className="font-medium">
                  {authUser.createdAt
                    ? new Date(authUser.createdAt).toLocaleDateString()
                    : "Unknown"}
                </span>
              </div>

              <div className="flex items-center justify-between py-2">
                <span className="text-base-content/70">
                  Account Status
                </span>

                <span className="text-green-500 font-medium">
                  Active
                </span>
              </div>

            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
