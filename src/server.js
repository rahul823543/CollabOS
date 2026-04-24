import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import rateLimit from "express-rate-limit";

import connectDB from "./config/db.js";
import authRoutes from "./routes/auth.routes.js";
import teamRoutes from "./routes/team.routes.js";
import taskRoutes from "./routes/task.routes.js";
import projectRoutes from "./routes/project.routes.js";
import skillRoutes from "./routes/skill.routes.js";
import userRoutes from "./routes/user.routes.js";
import contributionRoutes from "./routes/contribution.routes.js";
import aiRoutes from "./routes/ai.routes.js";
import githubRoutes from "./routes/github.routes.js";
import { notFound, errorHandler } from "./middleware/error.middleware.js";
import googleRoutes from "./routes/google.routes.js";
import { googleCallback } from "./controllers/google.controller.js";

dotenv.config();

const app = express();

app.use(express.json());
app.use(cors());
app.use(helmet());
app.use(morgan("dev"));
app.use(rateLimit({ windowMs: 15 * 60 * 1000, max: 100 }));

app.get("/", (req, res) => res.send("API is running..."));

app.use("/api/auth", authRoutes);
app.use("/api/team", teamRoutes);
app.use("/api/projects", projectRoutes);
app.use("/api/tasks", taskRoutes);
app.use("/api/skills", skillRoutes);
app.use("/api/ai", aiRoutes);
app.use("/api/users", userRoutes);
app.use("/api/contributions", contributionRoutes);
app.use("/api/integrations/github", githubRoutes);
app.get("/api/integrations/google/callback",googleCallback);
app.use("/api/integrations/google", googleRoutes);

app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    await connectDB();
    app.listen(PORT, () => console.log(`Server running on ${PORT}`));
  } catch (error) {
    console.error("DB connection failed:", error.message);
    process.exit(1);
  }
};

startServer();