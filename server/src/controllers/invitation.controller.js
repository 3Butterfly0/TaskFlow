import crypto from "crypto";
import Project from "../models/Project.model.js";
import User from "../models/User.model.js";
import {Invitation} from "../models/Invitation.model.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import {sendEmail} from "../utils/email.js";

// POST /api/projects/:projectId/invitations
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
      subject: `You've been invited to join "${project.name}" on TaskFlow`,
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 520px; margin: 0 auto; background: #0f172a; border-radius: 12px; padding: 40px 32px; color: #cbd5e1;">
          <h1 style="color: #fff; font-size: 22px; margin: 0 0 8px;">You're invited to TaskFlow</h1>
          <p style="margin: 0 0 24px; font-size: 15px; line-height: 1.6; color: #94a3b8;">
            <strong style="color: #e2e8f0;">${req.user.username}</strong> has invited you to collaborate on the project
            <strong style="color: #818cf8;">${project.name}</strong>.
          </p>
          <a href="${acceptLink}" style="display: inline-block; padding: 12px 28px; background: #4f46e5; color: #fff; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 14px;">
            Accept Invitation
          </a>
          <p style="margin: 24px 0 0; font-size: 13px; color: #64748b; line-height: 1.5;">
            This invitation expires in 24 hours.<br/>
            If you can't click the button, paste this link in your browser:<br/>
            <a href="${acceptLink}" style="color: #818cf8; word-break: break-all;">${acceptLink}</a>
          </p>
          <hr style="border: none; border-top: 1px solid #1e293b; margin: 24px 0;" />
          <p style="margin: 0; font-size: 12px; color: #475569;">
            This is an automated message from TaskFlow. Please do not reply to this email.
          </p>
        </div>
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
