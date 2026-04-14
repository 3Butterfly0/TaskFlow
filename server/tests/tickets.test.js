import { describe, it, expect, beforeEach } from "vitest";
import request from "supertest";
import app from "../src/app.js";

describe("Ticket Endpoints", () => {
  let token;
  let projectId;
  const userData = {
    username: "ticketuser",
    email: "ticket@example.com",
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
      .send({ name: "Ticket Project" });
    projectId = projRes.body.data._id;
  });

  it("should create a ticket", async () => {
    const res = await request(app)
      .post("/api/tickets")
      .set("Cookie", token)
      .query({ projectId })
      .send({
        subject: "Bug report",
        description: "Something is broken",
        severity: "major",
      });

    expect(res.statusCode).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty("subject", "Bug report");
  });
});
