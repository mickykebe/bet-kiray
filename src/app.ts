import express, { Request, Response, NextFunction } from "express";
import bodyParser from "body-parser";
import crypto from "crypto";
import { PORT, JWT_SECRET, TELEGRAM_BOT_TOKEN } from "./utils/secrets";
import { findOrCreateTelegramUser } from "./db";
import jwt from "jsonwebtoken";
import expressJwt from "express-jwt";

const app = express();

const authenticate = expressJwt({
  secret: JWT_SECRET
});

app.set("port", PORT);
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.post("/api/telegram-login", async (req, res) => {
  const { hash, ...userData } = req.body;
  const dataCheckStr = Object.keys(userData)
    .sort()
    .map(key => `${key}=${userData[key]}`)
    .join("\n");
  const secretKey = crypto
    .createHash("sha256")
    .update(TELEGRAM_BOT_TOKEN)
    .digest();
  const computedHash = crypto
    .createHmac("sha256", secretKey)
    .update(dataCheckStr)
    .digest("hex");

  if (
    hash === computedHash &&
    new Date().getTime() / 1000 - userData.auth_date < 86400
  ) {
    const user = await findOrCreateTelegramUser(userData, "user");
    const token = jwt.sign({ id: user.id }, JWT_SECRET);
    res.status(200).send({
      user,
      token
    });
    return;
  }
  res.sendStatus(401);
});

app.get("/api/pending-listings", authenticate, (req, res) => {});

export { app };
