import { describe, it, expect, beforeEach } from "vitest";
import request from "supertest";
import app from "../src/app.js";

describe("Task Endpoints", () => {
  let token;
  let projectId;
  let columnId;
  const userData = {
    username: "taskuser",
    email: "task@example.com",
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
      .send({ name: "Task Project" });
    
    projectId = projRes.body.data._id;
    columnId = projRes.body.data.columns[0].id;
  });

  it("should create a task in a project", async () => {
    const res = await request(app)
      .post("/api/tasks")
      .set("Cookie", token)
      .query({ projectId })
      .send({
        title: "Test Task",
        columnId: columnId,
      });

    expect(res.statusCode).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty("title", "Test Task");
  });
});
