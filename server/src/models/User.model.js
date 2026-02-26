import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: [true, "Username is required"],
      trim: true,
      minlength: [2, "Username must be at least 2 characters"],
      maxlength: [50, "Username cannot exceed 50 characters"],
    },

    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
      match: [
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        "Please provide a valid email address",
      ],
    },

    password: {
      type: String,
      minlength: [6, "Password must be at least 6 characters"],
      select: false, // Never return password by default
    },

    googleId: {
      type: String,
    },

    avatar: {
      type: String,
      default: "",
    },

    role: {
      type: String,
      enum: ["admin", "member", "observer"],
    },

    mfaSecret: {
      type: String,
      select: false, // Never return to client
    },

    mfaEnabled: {
      type: Boolean,
      default: false,
    },

    // Production enhancements (per production-blueprint.md §4)
    lastSeen: {
      type: Date,
      default: Date.now,
    },

    isOnline: {
      type: Boolean,
      default: false,
    },

    workspaceIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Project",
      },
    ],

    pinnedProjects: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Project",
      },
    ],

    lastAccessedProjects: [
      {
        projectId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Project",
        },
        accessedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
  },
  {
    timestamps: true, // createdAt, updatedAt
  },
);

// `email` index is already created by { unique: true } at the field level.
// `googleId` needs an explicit sparse index for optional Google OAuth lookups.
userSchema.index({ googleId: 1 }, { sparse: true });

// Pre-save: hash password
userSchema.pre("save", async function (next) {
  // Only hash if password field was modified
  if (!this.isModified("password")) return next();

  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Instance method: compare password
userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Instance method: strip sensitive fields
userSchema.methods.toSafeObject = function () {
  const obj = this.toObject();
  delete obj.password;
  delete obj.__v;
  return obj;
};

const User = mongoose.model("User", userSchema);

export default User;
