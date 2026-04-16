import jwt from "jsonwebtoken";
import User from "../models/User.js";

export const protect = async (req, res, next) => {
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
    res.status(401);
    throw new Error("Not authorized, no token");
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findById(decoded.id).select("-password");

    if (!user) {
      res.status(401);
      throw new Error("User not found");
    }

    req.user = user;

    next();
  } catch (error) {
    res.status(401);
    throw new Error("Invalid or expired token");
  }
};