import asyncHandler from "../utils/asyncHandler.js";
import Team from "../models/Team.js";
import Project from "../models/Project.js";
import Task from "../models/Task.js";
import Contribution from "../models/Contribution.js";
import { isUserOnline } from "../socket/onlineTracker.js";

// GET /teams/activity/:teamId
export const getTeamActivity = asyncHandler(async (req, res) => {
  const team = await Team.findById(req.params.teamId).populate(
    "members",
    "name email skills"
  );

  if (!team) {
    res.status(404);
    throw new Error("Team not found");
  }

  // Find all projects for this team
  const projects = await Project.find({ teamId: team._id });
  const projectIds = projects.map((p) => p._id);

  // Get all tasks across team projects
  const allTasks = await Task.find({ projectId: { $in: projectIds } });

  const totalTasks = allTasks.length;
  const completedTasks = allTasks.filter((t) => t.status === "done").length;
  const pendingTasks = totalTasks - completedTasks;
  const overallProgress =
    totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) + "%" : "0%";

  // Check contributions in the last 7 days for activity status
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const recentContributions = await Contribution.find({
    projectId: { $in: projectIds },
    createdAt: { $gte: sevenDaysAgo },
  });

  // Build per-member activity data
  const members = await Promise.all(
    team.members.map(async (member) => {
      const memberId = member._id.toString();

      // Count pending and completed tasks for this member
      const memberTasks = allTasks.filter(
        (t) => t.assignedTo && t.assignedTo.toString() === memberId
      );
      const memberCompleted = memberTasks.filter(
        (t) => t.status === "done"
      ).length;
      const memberPending = memberTasks.length - memberCompleted;

      // Check if user has recent contributions
      const memberContributions = recentContributions.filter(
        (c) => c.userId && c.userId.toString() === memberId
      );

      // Find last contribution timestamp
      const lastContribution = await Contribution.findOne({
        userId: member._id,
        projectId: { $in: projectIds },
      })
        .sort({ createdAt: -1 })
        .select("createdAt");

      return {
        userId: member._id,
        name: member.name,
        email: member.email,
        skills: member.skills,
        isOnline: isUserOnline(memberId),
        status: memberContributions.length > 0 ? "active" : "inactive",
        lastActive: lastContribution ? lastContribution.createdAt : null,
        pendingTasks: memberPending,
        completedTasks: memberCompleted,
      };
    })
  );

  res.json({
    teamName: team.name,
    overallProgress,
    totalTasks,
    completedTasks,
    pendingTasks,
    members,
  });
});
