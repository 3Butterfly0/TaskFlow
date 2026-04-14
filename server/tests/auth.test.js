import { describe, it, expect } from "vitest";
import request from "supertest";
import app from "../src/app.js";



describe("Auth Endpoints", () => {
  const userData = {
    username: "testuser",
    email: "test@example.com",
    password: "Password123",
  };

  it("should register a new user", async () => {
    const res = await request(app).post("/api/auth/register").send({
      username: "testuser",
      email: "test@example.com",
      password: "Password123",
    });

    expect(res.statusCode).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toBeDefined();
  });

  it("should login an existing user", async () => {
    const loginData = {
      username: "testuser2",
      email: "test2@example.com",
      password: "Password123",
    };
    // Register first
    await request(app).post("/api/auth/register").send(loginData);

    const res = await request(app).post("/api/auth/login").send({
      email: loginData.email,
      password: loginData.password,
    });

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.header["set-cookie"]).toBeDefined();
    expect(res.body.data).toBeDefined();
  });

  it("should not login with wrong credentials", async () => {
    const res = await request(app).post("/api/auth/login").send({
      email: userData.email,
      password: "WrongPassword",
    });

    expect(res.statusCode).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it("should not register duplicate email", async () => {
    await request(app).post("/api/auth/register").send(userData);
    const res = await request(app).post("/api/auth/register").send(userData);

    expect(res.statusCode).toBe(409);
    expect(res.body.success).toBe(false);
  });

  it("should fail login with missing fields", async () => {
    const res = await request(app).post("/api/auth/login").send({
      email: userData.email,
    });

    expect(res.statusCode).toBe(400);
    expect(res.body.success).toBe(false);
  });
});

