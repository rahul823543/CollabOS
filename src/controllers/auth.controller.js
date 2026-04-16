import asyncHandler from "../utils/asyncHandler.js";
import User from "../models/User.js";
import generateToken from "../utils/generateToken.js";

export const registerUser = asyncHandler(async (req, res) => {
  const { name, email, password, skills } = req.body;

  if (!name || !email || !password) {
    res.status(400);
    throw new Error("Missing fields");
  }

  const exists = await User.findOne({ email: email.toLowerCase() });

  if (exists) {
    res.status(400);
    throw new Error("User already exists");
  }

  const user = await User.create({
    name,
    email,
    password,
    skills,
  });

  res.status(201).json({
    _id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    token: generateToken({ id: user._id, role: user.role }),
  });
});

export const loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    res.status(400);
    throw new Error("Missing email or password");
  }

  const user = await User.findOne({ email: email.toLowerCase() });

  if (!user || !(await user.matchPassword(password))) {
    res.status(401);
    throw new Error("Invalid credentials");
  }

  res.json({
    _id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    token: generateToken({ id: user._id, role: user.role }),
  });
});