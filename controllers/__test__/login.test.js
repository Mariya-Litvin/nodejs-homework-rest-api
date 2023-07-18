const request = require("supertest");
const mongoose = require("mongoose");

const app = require("../../app");

const { DB_HOST, PORT = 3000 } = process.env;

describe("test login controller", () => {
  let server;
  // Перед усіма тестами запускаємо сервер та під'єднуємося до бази даних
  beforeAll(() => {
    server = app.listen(PORT);
    mongoose.connect(DB_HOST);
  });

  // Від'єднуємося від бази даних та зупиняємо сервер після виконання всіх тестів
  afterAll(() => {
    mongoose.disconnect();
    server.close();
  });

  it("should return status 200, token and user", async () => {
    const testData = {
      email: "xixib68052@muzitp.com",
      password: "111222333",
    };

    const res = await request(app).post("/api/auth/login").send(testData);

    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual(
      expect.objectContaining({
        token: expect.any(String),
        user: expect.objectContaining({
          email: expect.any(String),
          subscription: expect.any(String),
        }),
      })
    );
  });

  it("should return 401 status, incorrect email", async () => {
    const testData = {
      email: "xixib68052111111111@muzitp.com",
      password: "111222333",
    };

    const res = await request(app).post("/api/auth/login").send(testData);

    expect(res.statusCode).toBe(401);
  });

  it("should return 401 status, incorrect password", async () => {
    const testData = {
      email: "xixib68052@muzitp.com",
      password: "1112223334",
    };

    const res = await request(app).post("/api/auth/login").send(testData);

    expect(res.statusCode).toBe(401);
  });

  it("should return 400 status, not body", async () => {
    const res = await request(app).post("/api/auth/login").send();

    expect(res.statusCode).toBe(400);
  });

  it("should return 400 status, not field email", async () => {
    const testData = {
      password: "111222333",
    };

    const res = await request(app).post("/api/auth/login").send(testData);

    expect(res.statusCode).toBe(400);
  });

  it("should return 400 status, not field password", async () => {
    const testData = {
      email: "xixib68052@muzitp.com",
    };

    const res = await request(app).post("/api/auth/login").send(testData);

    expect(res.statusCode).toBe(400);
  });
});
