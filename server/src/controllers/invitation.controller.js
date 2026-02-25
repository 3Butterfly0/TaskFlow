import crypto from "crypto";
import Project from "../models/Project.model.js";
import User from "../models/User.model.js";
import { Invitation } from "../models/Invitation.model.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import { sendEmail } from "../utils/email.js";

// POST /api/projects/:projectId/invitations
// Owner/Admin invites a user by email
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

    const isOwner = project.owner.toString() === inviterId;
    if (!isOwner) {
      if (!isOwner)
        throw new ApiError(403, "Only project owners can invite new members");
    }

    const targetUser = await User.findOne({ email });
    if (targetUser && project.members.includes(targetUser._id)) {
      throw new ApiError(400, "User is already a member of this project");
    }
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

    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24);

    const invitation = await Invitation.create({
      projectId,
      invitedBy: inviterId,
      inviteeEmail: email,
      inviteeUserId: targetUser ? targetUser._id : null,
      token,
      expiresAt,
    });

    const clientUrl = process.env.CLIENT_URL || "http://localhost:5173";
    const acceptLink = `${clientUrl}/accept-invite?token=${token}`;

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

// GET /api/projects/:projectId/invitations
// List pending invitations
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

// POST /api/invitations/:token/accept
export const acceptInvitation = async (req, res, next) => {
  try {
    const { token } = req.params;
    const userId = req.user.id;

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

    if (!project.members.includes(userId)) {
      project.members.push(userId);
      await project.save();
    }

    invitation.status = "accepted";
    invitation.inviteeUserId = userId;
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

// DELETE /api/invitations/:id
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
