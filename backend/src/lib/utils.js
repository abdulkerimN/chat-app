import jwt from "jsonwebtoken";

export const generateToken = (userId, res) => {
    const token = jwt.sign({ userId }, process.env.JWT_SECRET, {
        expiresIn: "7d",
    });
    // The cookie has a name: "jwt", and its value is the token you just created.
    res.cookie("jwt", token, {
        maxAge: 7 * 24 * 60 * 60 * 1000, // MS
        httpOnly: true, // prevent XSS attacks cross-site scripting attacks
        sameSite: "strict", // CSRF attacks cross-site request forgery attacks
        secure: process.env.NODE_ENV !== "development",
    });

    return token;
};

// One important distinction: the cookie and the JWT are not the same thing. -
//     The JWT is the signed digital pass. -
//     The cookie is the browser 's container for storing and sending that pass.