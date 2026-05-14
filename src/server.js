import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import rateLimit from "express-rate-limit";
import http from "http";
import { Server } from "socket.io";

import connectDB from "./config/db.js";
import authRoutes from "./routes/auth.routes.js";
import teamRoutes from "./routes/team.routes.js";
import taskRoutes from "./routes/Task.routes.js";
import projectRoutes from "./routes/project.routes.js";
import skillRoutes from "./routes/skill.routes.js";
import userRoutes from "./routes/user.routes.js";
import contributionRoutes from "./routes/contribution.routes.js";
import aiRoutes from "./routes/ai.routes.js";
import githubRoutes from "./routes/github.routes.js";
import googleRoutes from "./routes/google.routes.js";

import { notFound, errorHandler } from "./middleware/error.middleware.js";
import { setupOnlineTracker } from "./socket/onlineTracker.js";

dotenv.config();

const app = express();

app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    credentials: true,
  })
);

app.use(express.json());

app.use(
  helmet({
    crossOriginOpenerPolicy: false,
    crossOriginEmbedderPolicy: false,
  })
);

app.use(morgan("dev"));

/*
  Enable rate limit only in production
  Prevents 429 spam during local development
*/
if (process.env.NODE_ENV === "production") {
  app.use(
    rateLimit({
      windowMs: 15 * 60 * 1000,
      max: 100,
    })
  );
}

app.get("/", (req, res) => {
  res.send("API is running...");
});

app.use("/api/auth", authRoutes);
app.use("/api/team", teamRoutes);
app.use("/api/projects", projectRoutes);
app.use("/api/tasks", taskRoutes);
app.use("/api/skills", skillRoutes);
app.use("/api/ai", aiRoutes);
app.use("/api/users", userRoutes);
app.use("/api/contributions", contributionRoutes);
app.use("/api/integrations/github", githubRoutes);
app.use("/api/integrations/google", googleRoutes);

app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    await connectDB();

    const server = http.createServer(app);

    const io = new Server(server, {
      cors: {
        origin: process.env.FRONTEND_URL || "http://localhost:5173",
        methods: ["GET", "POST"],
        credentials: true,
      },
      transports: ["websocket", "polling"],
    });

    setupOnlineTracker(io);

    server.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error("DB connection failed:", error.message);
    process.exit(1);
  }
};

startServer();