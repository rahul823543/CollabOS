import jwt from "jsonwebtoken";
import User from "../models/User.js";

// In-memory store: userId -> { socketId, name, email }
const onlineUsers = new Map();

export const getOnlineUserIds = () => {
  return Array.from(onlineUsers.keys());
};

export const isUserOnline = (userId) => {
  return onlineUsers.has(userId.toString());
};

export const setupOnlineTracker = (io) => {
  io.on("connection", (socket) => {
    console.log(`Socket connected: ${socket.id}`);

    // Client sends JWT to authenticate
    socket.on("authenticate", async ({ token }) => {
      try {
        if (!token) {
          socket.emit("auth-error", { message: "No token provided" });
          return;
        }

        // Remove "Bearer " prefix if present
        const cleanToken = token.startsWith("Bearer ") ? token.slice(7) : token;

        const decoded = jwt.verify(cleanToken, process.env.JWT_SECRET);
        const user = await User.findById(decoded.id).select("name email");

        if (!user) {
          socket.emit("auth-error", { message: "User not found" });
          return;
        }

        const userId = user._id.toString();

        // Store user in online map
        onlineUsers.set(userId, {
          socketId: socket.id,
          name: user.name,
          email: user.email,
        });

        // Attach userId to socket for disconnect handling
        socket.userId = userId;
        socket.userName = user.name;

        // Confirm authentication
        socket.emit("authenticated", { userId, name: user.name });

        // Broadcast to everyone that this user came online
        socket.broadcast.emit("user-online", { userId, name: user.name });

        // Send the full online users list to the newly connected client
        const onlineList = Array.from(onlineUsers.entries()).map(
          ([id, data]) => ({
            userId: id,
            name: data.name,
          })
        );
        socket.emit("online-users", onlineList);

        console.log(`User authenticated: ${user.name} (${userId})`);
      } catch (error) {
        socket.emit("auth-error", { message: "Invalid token" });
      }
    });

    // Handle disconnect
    socket.on("disconnect", () => {
      if (socket.userId) {
        onlineUsers.delete(socket.userId);

        // Broadcast to everyone that this user went offline
        socket.broadcast.emit("user-offline", {
          userId: socket.userId,
          name: socket.userName,
        });

        console.log(`User disconnected: ${socket.userName} (${socket.userId})`);
      }
    });
  });
};
