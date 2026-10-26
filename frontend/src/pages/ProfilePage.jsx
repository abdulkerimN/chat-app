
import { useState } from "react";
import { useAuthStore } from "../store/useAuthStore";
import { Camera, Mail, User } from "lucide-react";

const ProfilePage = () => {
  const { authUser, isUpdatingProfile, updateProfile } = useAuthStore();
  const [selectedImg, setSelectedImg] = useState(null);

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];

    if (!file) return;

    // Validate the selected file
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

      // Restore the previous preview if the upload fails
      if (!success) {
        setSelectedImg(previousImg);
      }

      // Allow selecting the same file again
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
      <div className="min-h-screen flex items-center justify-center">
        <p>Loading profile...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-20">
      <div className="max-w-2xl mx-auto p-4 py-8">
        <div className="bg-base-300 rounded-xl p-6 space-y-8">
          <div className="text-center">
            <h1 className="text-2xl font-semibold">Profile</h1>
            <p className="mt-2">Your profile information</p>
          </div>

          {/* Avatar upload section */}
          <div className="flex flex-col items-center gap-4">
            <div className="relative">
              <img
                src={
                  selectedImg ||
                  authUser.profilePic ||
                  "/avatar.png"
                }
                alt="Profile"
                className="size-32 rounded-full object-cover border-4 border-base-content/10"
              />

              <label
                htmlFor="avatar-upload"
                className={`
                  absolute bottom-0 right-0
                  bg-base-content hover:scale-105
                  p-2 rounded-full cursor-pointer
                  transition-all duration-200
                  ${
                    isUpdatingProfile
                      ? "animate-pulse pointer-events-none"
                      : ""
                  }
                `}
              >
                <Camera className="w-5 h-5 text-base-200" />

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

            <p className="text-sm text-zinc-400">
              {isUpdatingProfile
                ? "Uploading..."
                : "Click the camera icon to update your photo"}
            </p>
          </div>

          {/* Profile details */}
          <div className="space-y-6">
            <div className="space-y-1.5">
              <div className="text-sm text-zinc-400 flex items-center gap-2">
                <User className="w-4 h-4" />
                Full Name
              </div>

              <p className="px-4 py-2.5 bg-base-200 rounded-lg border">
                {authUser.fullname || "Not provided"}
              </p>
            </div>

            <div className="space-y-1.5">
              <div className="text-sm text-zinc-400 flex items-center gap-2">
                <Mail className="w-4 h-4" />
                Email Address
              </div>

              <p className="px-4 py-2.5 bg-base-200 rounded-lg border">
                {authUser.email || "Not provided"}
              </p>
            </div>
          </div>

          {/* Account information */}
          <div className="mt-6 bg-base-300 rounded-xl p-6">
            <h2 className="text-lg font-medium mb-4">
              Account Information
            </h2>

            <div className="space-y-3 text-sm">
              <div className="flex items-center justify-between py-2 border-b border-zinc-700">
                <span>Member Since</span>
                <span>
                  {authUser.createdAt
                    ? new Date(authUser.createdAt).toLocaleDateString()
                    : "Unknown"}
                </span>
              </div>

              <div className="flex items-center justify-between py-2">
                <span>Account Status</span>
                <span className="text-green-500">Active</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
