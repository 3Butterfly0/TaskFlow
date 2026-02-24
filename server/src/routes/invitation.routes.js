import express from "express";
import {
  createInvitation,
  getProjectInvitations,
  acceptInvitation,
  cancelInvitation,
} from "../controllers/invitation.controller.js";
import verifyJWT from "../middlewares/auth.middleware.js";

const router = express.Router({ mergeParams: true });

// Protect all routes with JWT
router.use(verifyJWT);

// Create invitation: /api/projects/:projectId/invitations
router.post("/", createInvitation);

// Get pending invitations: /api/projects/:projectId/invitations
router.get("/", getProjectInvitations);

// Routes scoped under /api/invitations (not nested in projects)
// We export this as a separate router as well
const topLevelRouter = express.Router();
topLevelRouter.use(verifyJWT);
topLevelRouter.post("/:token/accept", acceptInvitation);
topLevelRouter.delete("/:id", cancelInvitation);

export {
  router as projectInvitationRoutes,
  topLevelRouter as invitationRoutes,
};
