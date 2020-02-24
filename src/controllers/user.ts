import crypto from "crypto";
import jwt from "jsonwebtoken";
import { JWT_SECRET, TELEGRAM_BOT_TOKEN } from "../utils/secrets";
import { findOrCreateTelegramUser, getUserById } from "../db";
import { Request, Response, NextFunction } from "express";

export async function telegramLogin(req: Request, res: Response) {
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
}

interface AuthRequest extends Request {
  user?: { id: number };
}

export async function getUser(req: AuthRequest, res: Response) {
  const { id } = req.user as { id: number };
  const user = await getUserById(id);
  if (user) {
    res.status(200).send({
      user
    });
  }
}

export function hasRole(role: string) {
  return async (req: AuthRequest, res: Response, next: NextFunction) => {
    if (req.user) {
      const user = await getUserById(req.user.id);
      if (user && user.role === role) {
        next();
        return;
      }
    }
  };
  throw new Error("User doesn't have the role to execute this action");
}
