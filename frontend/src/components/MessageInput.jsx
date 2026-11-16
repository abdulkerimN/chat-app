
import { useEffect, useRef, useState } from "react";
import { useChatStore } from "../store/useChatStore";
import { useAuthStore } from "../store/useAuthStore";
import {
    Image,
    Send,
    X,
    Mic,
    Square,
    Trash2,
    Paperclip,
    File as FileIcon,
} from "lucide-react";
import toast from "react-hot-toast";

const MessageInput = () => {
    const [text, setText] = useState("");
    const [imagePreview, setImagePreview] = useState(null);

    // General file attachment state
    const [selectedFile, setSelectedFile] = useState(null);

    // Voice recording state
    const [isRecording, setIsRecording] = useState(false);
    const [recordingTime, setRecordingTime] = useState(0);
    const [audioBlob, setAudioBlob] = useState(null);

    const fileInputRef = useRef(null);
    const attachmentInputRef = useRef(null);
    const typingTimeoutRef = useRef(null);
    const isTypingRef = useRef(false);

    const mediaRecorderRef = useRef(null);
    const mediaStreamRef = useRef(null);
    const audioChunksRef = useRef([]);
    const recordingStartRef = useRef(null);
    const recordingTimerRef = useRef(null);

    const {
        sendMessage,
        selectedUser,
        replyingTo,
        setReplyingTo,
    } = useChatStore();

    const { socket, authUser } = useAuthStore();

    // Stop the typing indicator
    const stopTyping = () => {
        if (typingTimeoutRef.current) {
            clearTimeout(typingTimeoutRef.current);
            typingTimeoutRef.current = null;
        }

        if (isTypingRef.current && socket && selectedUser) {
            socket.emit("stopTyping", {
                receiverId: selectedUser._id,
            });
        }

        isTypingRef.current = false;
    };

    // Handle text input changes
    const handleTextChange = (e) => {
        const newText = e.target.value;

        setText(newText);

        if (!socket || !selectedUser) return;

        if (!isTypingRef.current && newText.trim()) {
            socket.emit("typing", {
                receiverId: selectedUser._id,
            });

            isTypingRef.current = true;
        }

        if (typingTimeoutRef.current) {
            clearTimeout(typingTimeoutRef.current);
        }

        if (newText.trim()) {
            typingTimeoutRef.current = setTimeout(() => {
                stopTyping();
            }, 1500);
        } else {
            stopTyping();
        }
    };

    // Stop and release the microphone
    const releaseMicrophone = () => {
        if (recordingTimerRef.current) {
            clearInterval(recordingTimerRef.current);
            recordingTimerRef.current = null;
        }

        if (mediaStreamRef.current) {
            mediaStreamRef.current.getTracks().forEach((track) => {
                track.stop();
            });

            mediaStreamRef.current = null;
        }
    };

    // Clean up typing and recording when leaving or changing chats
    useEffect(() => {
        return () => {
            if (typingTimeoutRef.current) {
                clearTimeout(typingTimeoutRef.current);
            }

            if (isTypingRef.current && socket && selectedUser) {
                socket.emit("stopTyping", {
                    receiverId: selectedUser._id,
                });
            }

            if (
                mediaRecorderRef.current &&
                mediaRecorderRef.current.state !== "inactive"
            ) {
                mediaRecorderRef.current.onstop = null;
                mediaRecorderRef.current.stop();
            }

            releaseMicrophone();
        };
    }, [selectedUser, socket]);

    // Handle image selection
    const handleImageChange = (e) => {
        const files = e.target.files;

        if (!files || files.length === 0) return;

        const file = files[0];

        if (!file.type.startsWith("image/")) {
            toast.error("Please select an image file");
            e.target.value = "";
            return;
        }

        if (file.size > 10 * 1024 * 1024) {
            toast.error("Image must be smaller than 10 MB");
            e.target.value = "";
            return;
        }

        const reader = new FileReader();

        reader.onloadend = () => {
            setImagePreview(reader.result);
        };

        reader.readAsDataURL(file);
    };

    // Remove selected image
    const removeImage = () => {
        setImagePreview(null);

        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    };

    // Handle general file selection
    const handleFileChange = (e) => {
        const files = e.target.files;

        if (!files || files.length === 0) return;

        const file = files[0];

        // Maximum file size: 10 MB
        if (file.size > 10 * 1024 * 1024) {
            toast.error("File must be smaller than 10 MB");
            e.target.value = "";
            return;
        }

        setSelectedFile(file);
    };

    // Remove selected general file
    const removeSelectedFile = () => {
        setSelectedFile(null);

        if (attachmentInputRef.current) {
            attachmentInputRef.current.value = "";
        }
    };

    // Format file size
    const formatFileSize = (size) => {
        if (size < 1024) {
            return `${size} B`;
        }

        if (size < 1024 * 1024) {
            return `${(size / 1024).toFixed(1)} KB`;
        }

        return `${(size / (1024 * 1024)).toFixed(2)} MB`;
    };

    // Cancel replying to a message
    const cancelReply = () => {
        setReplyingTo(null);
    };

    // Get the original message sender ID
    const getReplySenderId = () => {
        if (!replyingTo) return null;

        if (replyingTo.senderId && replyingTo.senderId._id) {
            return replyingTo.senderId._id;
        }

        return replyingTo.senderId;
    };

    // Format recording duration
    const formatDuration = (seconds) => {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;

        return `${String(minutes).padStart(2, "0")}:${String(
            remainingSeconds
        ).padStart(2, "0")}`;
    };

    // Start voice recording
    const startRecording = async() => {
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            toast.error("Your browser does not support audio recording");
            return;
        }

        if (typeof MediaRecorder === "undefined") {
            toast.error("Audio recording is not supported by your browser");
            return;
        }

        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                audio: true,
            });

            mediaStreamRef.current = stream;

            let mimeType = "";

            if (MediaRecorder.isTypeSupported("audio/webm;codecs=opus")) {
                mimeType = "audio/webm;codecs=opus";
            } else if (MediaRecorder.isTypeSupported("audio/webm")) {
                mimeType = "audio/webm";
            } else if (MediaRecorder.isTypeSupported("audio/mp4")) {
                mimeType = "audio/mp4";
            }

            const recorderOptions = mimeType
                ? { mimeType: mimeType }
                : {};

            const mediaRecorder = new MediaRecorder(
                stream,
                recorderOptions
            );

            mediaRecorderRef.current = mediaRecorder;
            audioChunksRef.current = [];

            mediaRecorder.ondataavailable = (event) => {
                if (event.data && event.data.size > 0) {
                    audioChunksRef.current.push(event.data);
                }
            };

            mediaRecorder.onstop = () => {
                const blob = new Blob(audioChunksRef.current, {
                    type: mediaRecorder.mimeType || "audio/webm",
                });

                if (blob.size > 0) {
                    setAudioBlob(blob);
                } else {
                    toast.error("No audio was recorded");
                }

                releaseMicrophone();
            };

            mediaRecorder.start();

            recordingStartRef.current = Date.now();

            setRecordingTime(0);
            setAudioBlob(null);
            setIsRecording(true);

            recordingTimerRef.current = setInterval(() => {
                const elapsed = Math.floor(
                    (Date.now() - recordingStartRef.current) / 1000
                );

                setRecordingTime(elapsed);

                if (elapsed >= 300) {
                    stopRecording();
                    toast("Maximum recording time reached");
                }
            }, 1000);
        } catch (error) {
            console.error("Recording error:", error);

            if (error.name === "NotAllowedError") {
                toast.error("Please allow microphone access");
            } else if (error.name === "NotFoundError") {
                toast.error("No microphone was found");
            } else {
                toast.error("Could not start audio recording");
            }

            releaseMicrophone();
            setIsRecording(false);
        }
    };

    // Stop voice recording
    const stopRecording = () => {
        const mediaRecorder = mediaRecorderRef.current;

        if (
            mediaRecorder &&
            mediaRecorder.state !== "inactive"
        ) {
            mediaRecorder.stop();
        }

        setIsRecording(false);
    };

    // Cancel recorded voice message
    const cancelRecording = () => {
        const mediaRecorder = mediaRecorderRef.current;

        if (
            mediaRecorder &&
            mediaRecorder.state !== "inactive"
        ) {
            mediaRecorder.onstop = null;
            mediaRecorder.stop();
        }

        releaseMicrophone();

        audioChunksRef.current = [];
        mediaRecorderRef.current = null;

        setIsRecording(false);
        setRecordingTime(0);
        setAudioBlob(null);
    };

    // Send recorded voice message
    const handleSendAudio = async() => {
        if (!audioBlob || !selectedUser) return;

        const formData = new FormData();

        const extension = audioBlob.type.includes("mp4")
            ? "mp4"
            : "webm";

        const audioFile = new File(
            [audioBlob],
            `voice-message.${extension}`,
            {
                type: audioBlob.type,
            }
        );

        formData.append("audio", audioFile);
        formData.append("audioDuration", String(recordingTime));

        if (replyingTo) {
            formData.append("replyTo", replyingTo._id);
        }

        stopTyping();

        try {
            await sendMessage(formData);

            setAudioBlob(null);
            setRecordingTime(0);
            setReplyingTo(null);

            toast.success("Voice message sent");
        } catch (error) {
            console.error("Failed to send voice message:", error);
        }
    };

    // Send text, image, or general file message
    const handleSendMessage = async(e) => {
        e.preventDefault();

        if (
            !text.trim() &&
            !imagePreview &&
            !selectedFile
        ) {
            return;
        }

        stopTyping();

        try {
            // Send general file using FormData.
            if (selectedFile) {
                const formData = new FormData();

                formData.append("file", selectedFile);
                formData.append("text", text.trim());

                if (replyingTo) {
                    formData.append("replyTo", replyingTo._id);
                }

                await sendMessage(formData);

                setSelectedFile(null);

                if (attachmentInputRef.current) {
                    attachmentInputRef.current.value = "";
                }
            } else {
                // Keep the existing JSON approach for text and images.
                await sendMessage({
                    text: text.trim(),
                    image: imagePreview,
                    replyTo: replyingTo ? replyingTo._id : null,
                });

                setImagePreview(null);

                if (fileInputRef.current) {
                    fileInputRef.current.value = "";
                }
            }

            setText("");
            setReplyingTo(null);

        } catch (error) {
            console.error("Failed to send message:", error);
        }
    };

    const replySenderId = getReplySenderId();

    const replySenderName =
        replyingTo && String(replySenderId) === String(authUser._id)
            ? "yourself"
            : selectedUser
                ? selectedUser.fullname
                : "this person";

    return (
        <div className="p-2 sm:p-4 w-full shrink-0 border-t border-base-300">

            {/* Reply Preview */}
            {replyingTo && (
                <div className="mb-3 flex items-center gap-3 rounded-lg bg-base-200 p-3 border-l-4 border-primary">
                    <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-primary mb-1">
                            Replying to {replySenderName}
                        </p>

                        {replyingTo.deletedForEveryone ? (
                            <p className="text-sm opacity-60 italic">
                                This message was deleted.
                            </p>
                        ) : (
                            <p className="text-sm truncate opacity-80">
                                {replyingTo.text
                                    ? replyingTo.text
                                    : replyingTo.image
                                        ? "Photo"
                                        : replyingTo.audio
                                            ? "Voice message"
                                            : replyingTo.file
                                                ? replyingTo.fileName || "File attachment"
                                                : "Message"}
                            </p>
                        )}
                    </div>

                    <button
                        type="button"
                        onClick={cancelReply}
                        className="btn btn-ghost btn-circle btn-xs"
                        aria-label="Cancel reply"
                    >
                        <X size={16} />
                    </button>
                </div>
            )}

            {/* Image Preview */}
            {imagePreview && (
                <div className="mb-3 flex items-center gap-2">
                    <div className="relative">
                        <img
                            src={imagePreview}
                            alt="Selected image preview"
                            className="w-16 h-16 sm:w-20 sm:h-20 object-cover rounded-lg border border-base-300"
                        />

                        <button
                            onClick={removeImage}
                            className="absolute -top-2 -right-2 size-6 rounded-full bg-base-300 hover:bg-base-content/20 flex items-center justify-center"
                            type="button"
                            aria-label="Remove image"
                        >
                            <X className="size-3" />
                        </button>
                    </div>
                </div>
            )}

            {/* General File Preview */}
            {selectedFile && (
                <div className="mb-3 flex items-center gap-3 rounded-lg bg-base-200 p-3">
                    <div className="flex items-center justify-center size-11 rounded-lg bg-primary/10 text-primary shrink-0">
                        <FileIcon size={22} />
                    </div>

                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                            {selectedFile.name}
                        </p>

                        <p className="text-xs opacity-60">
                            {formatFileSize(selectedFile.size)}
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={removeSelectedFile}
                        className="btn btn-circle btn-ghost btn-sm text-error"
                        aria-label="Remove selected file"
                    >
                        <X size={17} />
                    </button>
                </div>
            )}

            {/* Recording Preview */}
            {(isRecording || audioBlob) && (
                <div className="mb-3 flex items-center gap-3 rounded-lg bg-base-200 p-3">
                    {isRecording ? (
                        <>
                            <span className="size-3 rounded-full bg-red-500 animate-pulse" />

                            <span className="text-sm font-medium">
                                Recording {formatDuration(recordingTime)}
                            </span>

                            <div className="flex-1" />

                            <button
                                type="button"
                                onClick={stopRecording}
                                className="btn btn-circle btn-sm btn-primary"
                                aria-label="Stop recording"
                            >
                                <Square size={15} />
                            </button>
                        </>
                    ) : (
                        <>
                            <Mic size={20} className="text-primary" />

                            <span className="text-sm font-medium">
                                Voice message ({formatDuration(recordingTime)})
                            </span>

                            <div className="flex-1" />

                            <button
                                type="button"
                                onClick={cancelRecording}
                                className="btn btn-circle btn-ghost btn-sm text-error"
                                aria-label="Cancel voice message"
                            >
                                <Trash2 size={17} />
                            </button>

                            <button
                                type="button"
                                onClick={handleSendAudio}
                                className="btn btn-circle btn-primary btn-sm"
                                aria-label="Send voice message"
                            >
                                <Send size={17} />
                            </button>
                        </>
                    )}
                </div>
            )}

            {/* Message Form */}
            <form
                onSubmit={handleSendMessage}
                className="flex items-center gap-2"
            >
                {/* Text Input */}
                <input
                    type="text"
                    className="flex-1 min-w-0 input input-bordered rounded-full input-sm sm:input-md"
                    placeholder="Type a message..."
                    value={text}
                    onChange={handleTextChange}
                    disabled={isRecording || Boolean(audioBlob)}
                />

                {/* Hidden Image Input */}
                <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    ref={fileInputRef}
                    onChange={handleImageChange}
                />

                {/* Hidden General Attachment Input */}
                <input
                    type="file"
                    accept=".pdf,.doc,.docx,.txt,.rtf,.xls,.xlsx,.csv,.ppt,.pptx,.zip,.rar,.7z,.png,.jpg,.jpeg,.gif,.svg,.webp,.mp3,.wav,.ogg,.m4a,.aac,.mp4,.mov,.webm,.avi,.json,.xml,.md,.html,.css"
                    className="hidden"
                    ref={attachmentInputRef}
                    onChange={handleFileChange}
                />

                {/* Image Button */}
                <button
                    type="button"
                    className={`btn btn-circle btn-sm sm:btn-md shrink-0 ${
                        imagePreview ? "text-emerald-500" : "text-zinc-400"
                    }`}
                    onClick={() => {
                        if (fileInputRef.current) {
                            fileInputRef.current.click();
                        }
                    }}
                    disabled={
                        isRecording ||
                        Boolean(audioBlob) ||
                        Boolean(selectedFile)
                    }
                    aria-label="Attach image"
                >
                    <Image className="size-5" />
                </button>

                {/* General File Attachment Button */}
                <button
                    type="button"
                    className={`btn btn-circle btn-sm sm:btn-md shrink-0 ${
                        selectedFile ? "text-emerald-500" : "text-zinc-400"
                    }`}
                    onClick={() => {
                        if (attachmentInputRef.current) {
                            attachmentInputRef.current.click();
                        }
                    }}
                    disabled={
                        isRecording ||
                        Boolean(audioBlob) ||
                        Boolean(imagePreview)
                    }
                    aria-label="Attach file"
                    title="Attach file"
                >
                    <Paperclip className="size-5" />
                </button>

                {/* Voice Recording Button */}
                <button
                    type="button"
                    className={`btn btn-circle btn-sm sm:btn-md shrink-0 ${
                        isRecording ? "btn-error" : "text-zinc-400"
                    }`}
                    onClick={isRecording ? stopRecording : startRecording}
                    disabled={
                        Boolean(audioBlob) ||
                        Boolean(imagePreview) ||
                        Boolean(selectedFile)
                    }
                    aria-label={
                        isRecording ? "Stop recording" : "Record voice message"
                    }
                >
                    {isRecording ? (
                        <Square className="size-5" />
                    ) : (
                        <Mic className="size-5" />
                    )}
                </button>

                {/* Send Text, Image, or File Button */}
                <button
                    type="submit"
                    className="btn btn-circle btn-sm sm:btn-md shrink-0"
                    disabled={
                        (!text.trim() && !imagePreview && !selectedFile) ||
                        isRecording ||
                        Boolean(audioBlob)
                    }
                    aria-label="Send message"
                >
                    <Send className="size-5" />
                </button>
            </form>
        </div>
    );
};

export default MessageInput;
