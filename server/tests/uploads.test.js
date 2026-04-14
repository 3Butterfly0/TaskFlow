import { describe, it, expect, beforeEach, vi } from "vitest";
import request from "supertest";
import app from "../src/app.js";



describe("Upload Endpoints", () => {
  let token;
  const userData = {
    username: "uploaduser",
    email: "upload@example.com",
    password: "Password123",
  };

  beforeEach(async () => {
    await request(app).post("/api/auth/register").send(userData);
    const loginRes = await request(app)
      .post("/api/auth/login")
      .send({ email: userData.email, password: userData.password });
    token = loginRes.header["set-cookie"];
  });

  it("should upload a file", async () => {
    const res = await request(app)
      .post("/api/upload")
      .set("Cookie", token)
      .attach("file", Buffer.from("test content"), "test.txt");

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty("url");
  });
});

