import { describe, it, expect, beforeEach } from "vitest";
import request from "supertest";
import app from "../src/app.js";

describe("Invitation Endpoints", () => {
  let token;
  let projectId;
  const userData = {
    username: "inviteuser",
    email: "invite@example.com",
    password: "Password123",
  };

  beforeEach(async () => {
    // Auth
    await request(app).post("/api/auth/register").send(userData);
    const loginRes = await request(app)
      .post("/api/auth/login")
      .send({ email: userData.email, password: userData.password });
    token = loginRes.header["set-cookie"];

    // Project
    const projRes = await request(app)
      .post("/api/projects")
      .set("Cookie", token)
      .send({ name: "Invite Project" });
    projectId = projRes.body.data._id;
  });

  it("should create an invitation", async () => {
    const res = await request(app)
      .post(`/api/projects/${projectId}/invitations`)
      .set("Cookie", token)
      .send({
        email: "guest@example.com",
        role: "member",
      });

    expect(res.statusCode).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty("inviteeEmail", "guest@example.com");
  });
});
