import mongoose from "mongoose";

const userSchema = new mongoose.Schema({

    email: {
        type: String,
        required: true,
        unique: true,
    },
    fullname: {
        type: String,
        required: true,
    },
    password: {
        type: String,
        required: true,
        minlength: 6,
    },
    profilePic: {
        type: String,
        default: "",
    },
}, { timestamps: true });


// the below User model is designed based on the userSchema defined above, 
// which includes fields for email, fullname, password, and profilePic. 
// The timestamps option automatically adds createdAt and updatedAt fields to the schema.

const User = mongoose.model("User", userSchema);
export default User;