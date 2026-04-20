import { generateTasks } from "../services/ai.service.js";

const generateTasksController = async (req, res, next) => {
  try {
    const { projectTitle, description, techStack } = req.body;

    if (!projectTitle) {
      return res.status(400).json({ message: "Project title required" });
    }

    const tasks = await generateTasks({ projectTitle, description, techStack });

    res.json(tasks);
  } catch (err) {
    next(err);
  }
};

export { generateTasksController };