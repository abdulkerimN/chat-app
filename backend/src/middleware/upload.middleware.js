import multer from "multer";
import path from "path";

// Store uploaded files temporarily in memory.
const storage = multer.memoryStorage();

// Common file extensions allowed for sharing.
const allowedExtensions = new Set([
    // Documents
    ".pdf", ".doc", ".docx", ".txt", ".rtf",

    // Spreadsheets
    ".xls", ".xlsx", ".csv",

    // Presentations
    ".ppt", ".pptx",

    // Archives
    ".zip", ".rar", ".7z",

    // Images
    ".png", ".jpg", ".jpeg", ".gif", ".svg", ".webp",

    // Audio
    ".mp3", ".wav", ".ogg", ".m4a", ".aac",

    // Video
    ".mp4", ".mov", ".webm", ".avi",

    // Other common formats
    ".json", ".xml", ".md", ".html", ".css",
]);

// MIME types associated with potentially dangerous files.
const blockedMimeTypes = new Set([
    "application/x-msdownload",
    "application/x-msdos-program",
    "application/x-executable",
    "application/x-sh",
    "application/x-bat",
    "application/x-msi",
]);

// Configure file uploads.
const upload = multer({
    storage: storage,

    limits: {
        fileSize: 10 * 1024 * 1024, // Maximum 10 MB
    },

    fileFilter: (req, file, callback) => {
        const extension = path.extname(file.originalname).toLowerCase();
        const mimeType = file.mimetype.toLowerCase();

        // Reject dangerous MIME types.
        if (blockedMimeTypes.has(mimeType)) {
            return callback(new Error("This file type is not allowed"));
        }

        // Only accept extensions from our allowlist.
        if (!allowedExtensions.has(extension)) {
            return callback(new Error("This file extension is not allowed"));
        }

        callback(null, true);
    },
});

// Keep the existing named import compatible if it is used elsewhere.
export const uploadAudio = upload;

export default upload;