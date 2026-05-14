import jwt from "jsonwebtoken";
import User from "../models/User.js";

export const protect = async (req, res, next) => {
  try {
    if (!process.env.JWT_SECRET) {
      throw new Error("JWT_SECRET is not defined");
    }

    let token;

    if (req.headers.authorization?.startsWith("Bearer")) {
      const parts = req.headers.authorization.split(" ");
      if (parts.length === 2) {
        token = parts[1];
      }
    }

    if (!token) {
      const err = new Error("Not authorized, no token");
      err.status = 401;
      throw err;
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findById(decoded.id).select("-password");

    if (!user) {
      const err = new Error("User not found");
      err.status = 401;
      throw err;
    }

    req.user = user;

    next();
  } catch (error) {
    if (!error.status) {
      error.status = 401;
      error.message = "Invalid or expired token";
    }
    next(error);
  }
};