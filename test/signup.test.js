/* eslint-disable no-undef */
const mongoose = require("mongoose");
const request = require("supertest");
require("dotenv").config();
const app = require("../app");

describe("Testy kontrolera wejścia (login/signin)", () => {
  beforeAll(async () => {
    await mongoose.connect(process.env.DB_CONTACTS, {
      dbName: "db-contacts",
    });
  });

  afterAll(async () => {
    await mongoose.disconnect();
  });

  it("Powinien zwrócić token i obiekt user z polami email i subscription", async () => {
    const response = await request(app)
      .post("/api/users/login")
      .send({ email: "admin@op.pl", password: "admin" });

    expect(response.statusCode).toBe(200);
    console.log(response.statusCode);
    console.log(response.body);
    expect(response.body).toHaveProperty("token");
    expect(response.body.user).toHaveProperty("email");
    expect(response.body.user).toHaveProperty("subscription");
    expect(typeof response.body.user.email).toBe("string");
    expect(typeof response.body.user.subscription).toBe("string");
  });
});
