import { generateToken } from "../lib/utils.js";
import User from "../models/user.model.js";
import bcrypt from "bcryptjs";
export const signup = async(req, res) => {
    // res.send('signup route');
    const { email, fullname, password } = req.body;
    try {
        if (!email || !fullname || !password) {
            return res.status(400).json({ message: "Please fill all fields" });
        }
        if (password.length < 6) {
            return res.status(400).json({ message: "Password must be at least 6 characters long" });
        }
        const user = await User.findOne({ email });
        if (user) {
            return res.status(400).json({ message: "User already exists" });
        }
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const newUser = new User({
            email,
            fullname,
            password: hashedPassword,
        });

        if (newUser) {
            // generate jwt token
            generateToken(newUser._id, res);
            await newUser.save();
            res.status(201).json({
                message: "User created successfully",
                _id: newUser._id,
                email: newUser.email,
                fullname: newUser.fullname,
                profilePic: newUser.profilePic,
            });
        } else {
            return res.status(400).json({ message: "Invalid user data" });
        }

    } catch (error) {
        console.error("error in signup controller: ", error.message);
        res.status(500).json({ message: "Server error" });
    }
}
export const login = async(req, res) => {
    const { email, password } = req.body;
    try {
        // check if user exists with the provided email
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ message: "Invalid credentials" });
        }
        // compare the provided password with the hashed password in the database
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: "Invalid credentials" });
        }
        generateToken(user._id, res);
        res.status(200).json({
            message: "User logged in successfully",
            _id: user._id,
            email: user.email,
            fullname: user.fullname,
            profilePic: user.profilePic,
        })
    } catch (error) {
        console.error("error in login controller: ", error.message);
        res.status(500).json({ message: "Server error" });
    }
}
export const logout = (req, res) => {
    try {
        res.cookie("jwt", "", { maxAge: 0 });
        res.status(200).json({ message: "User logged out successfully" });
    } catch (error) {
        console.log("error in logout controller: ", error.message);
        res.status(500).json({ message: "Server error" });
    }
}

export const updateProfile = async(req, res) => {}