import crypto from "crypto";
import Project from "../models/Project.model.js";
import User from "../models/User.model.js";
import {Invitation} from "../models/Invitation.model.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import {sendEmail} from "../utils/email.js";

// ──────────────────────────────────────────────────────
// POST /api/projects/:projectId/invitations
// Owner/Admin invites a user by email
// ──────────────────────────────────────────────────────
export const createInvitation = async (req, res, next) => {
  try {
    const { projectId } = req.params;
    const { email } = req.body;
    const inviterId = req.user.id;

    if (!email) {
      throw new ApiError(400, "Email is required");
    }

    const project = await Project.findById(projectId);
    if (!project) {
      throw new ApiError(404, "Project not found");
    }

    // Role check: Only owner or admin can invite
    // Usually members array has a structure or just ObjectIds. Since members array in Project.model.js right now is just ObjectId array,
    // everyone is basically a member. Wait, team.controller defines permissions. Let's assume Owner + members for now based on team controller logic.
    const isOwner = project.owner.toString() === inviterId;
    if (!isOwner) {
      // Check if they are admin in future if schema has roles. For now, enforce Owner only to match typical rigid behavior.
      // Let's check team.controller which says owner or admin role (if we had roles). Since we don't, just owner.
      // Actually `team.controller.js` has some logic. Assume owner for strict security, or if 'adminRole = true' later.
      if (!isOwner)
        throw new ApiError(403, "Only project owners can invite new members");
    }

    // Check if user is already a member
    const targetUser = await User.findOne({ email });
    if (targetUser && project.members.includes(targetUser._id)) {
      throw new ApiError(400, "User is already a member of this project");
    }

    // Check if active invitation already exists
    const existingInvite = await Invitation.findOne({
      projectId,
      inviteeEmail: email,
      status: "pending",
      expiresAt: { $gt: new Date() },
    });

    if (existingInvite) {
      throw new ApiError(
        400,
        "An active invitation already exists for this email",
      );
    }

    // Generate token
    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24); // 24 hour TTL

    const invitation = await Invitation.create({
      projectId,
      invitedBy: inviterId,
      inviteeEmail: email,
      inviteeUserId: targetUser ? targetUser._id : null,
      token,
      expiresAt,
    });

    // Determine the accept link (Client URL + route)
    const clientUrl = process.env.CLIENT_URL || "http://localhost:5173";
    const acceptLink = `${clientUrl}/accept-invite?token=${token}`;

    // Send email
    await sendEmail({
      to: email,
      subject: `You've been invited to join project: ${project.name}`,
      html: `
        <h2>TaskFlow Invitation</h2>
        <p>You have been invited by ${req.user.username} to join the project: <strong>${project.name}</strong>.</p>
        <p>This invitation will expire in 24 hours.</p>
        <p><a href="${acceptLink}" style="padding: 10px 15px; background: #4f46e5; color: white; text-decoration: none; border-radius: 5px;">Accept Invitation</a></p>
        <p>Or paste this link in your browser: <br> ${acceptLink}</p>
      `,
    });

    res
      .status(201)
      .json(new ApiResponse(201, invitation, "Invitation sent successfully"));
  } catch (err) {
    next(err);
  }
};

// ──────────────────────────────────────────────────────
// GET /api/projects/:projectId/invitations
// List pending invitations
// ──────────────────────────────────────────────────────
export const getProjectInvitations = async (req, res, next) => {
  try {
    const { projectId } = req.params;
    const userId = req.user.id;

    const project = await Project.findById(projectId);
    if (!project) throw new ApiError(404, "Project not found");

    if (project.owner.toString() !== userId) {
      throw new ApiError(
        403,
        "Only project owners can view pending invitations",
      );
    }

    const invitations = await Invitation.find({
      projectId,
      status: "pending",
      expiresAt: { $gt: new Date() },
    }).populate("invitedBy", "username avatar email");

    res
      .status(200)
      .json(new ApiResponse(200, invitations, "Invitations retrieved"));
  } catch (err) {
    next(err);
  }
};

// ──────────────────────────────────────────────────────
// POST /api/invitations/:token/accept
// Invitee accepts the invitation. Token is public.
// But they must be logged into TaskFlow to actually join.
// ──────────────────────────────────────────────────────
export const acceptInvitation = async (req, res, next) => {
  try {
    const { token } = req.params;
    const userId = req.user.id; // User must exist and be authenticated to call this

    const invitation = await Invitation.findOne({ token, status: "pending" });

    if (!invitation) {
      throw new ApiError(404, "Invitation not found or has been revoked");
    }

    if (new Date() > invitation.expiresAt) {
      invitation.status = "expired";
      await invitation.save();
      throw new ApiError(400, "Invitation has expired");
    }

    const project = await Project.findById(invitation.projectId);
    if (!project) {
      throw new ApiError(404, "Project no longer exists");
    }

    // Add to project members if not already
    if (!project.members.includes(userId)) {
      project.members.push(userId);
      await project.save();
    }

    // Mark accepted
    invitation.status = "accepted";
    invitation.inviteeUserId = userId; // Associate definitely
    await invitation.save();

    res
      .status(200)
      .json(
        new ApiResponse(
          200,
          { projectId: project._id },
          "Invitation accepted successfully",
        ),
      );
  } catch (err) {
    next(err);
  }
};

// ──────────────────────────────────────────────────────
// DELETE /api/invitations/:id
// Cancel an invitation
// ──────────────────────────────────────────────────────
export const cancelInvitation = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const invitation = await Invitation.findById(id);
    if (!invitation) throw new ApiError(404, "Invitation not found");

    const project = await Project.findById(invitation.projectId);
    if (!project || project.owner.toString() !== userId) {
      throw new ApiError(403, "Not authorized to cancel this invitation");
    }

    await Invitation.findByIdAndDelete(id);

    res.status(200).json(new ApiResponse(200, null, "Invitation cancelled"));
  } catch (err) {
    next(err);
  }
};
