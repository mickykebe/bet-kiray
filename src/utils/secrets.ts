import { logger } from "./logger";
import dotenv from "dotenv";
import fs from "fs";

if (fs.existsSync(".env")) {
  logger.debug("Using .env file to supply config environment variables");
  dotenv.config({ path: ".env" });
}

export const ENVIRONMENT = process.env.NODE_ENV;
const prod = ENVIRONMENT === "production";

export const PORT = process.env.PORT || 3030;

export const DATABASE_URL = process.env["DATABASE_URL"] || "";

if (!DATABASE_URL) {
  logger.error(
    "No Database connection string. Set DATABASE_URL environment variable"
  );
  process.exit(1);
}

export const APP_ROOT_URL: string = process.env["APP_ROOT_URL"] || "";

if (!APP_ROOT_URL) {
  logger.error("No app root url. Set APP_ROOT_URL environment variable");
  process.exit(1);
}

export const TELEGRAM_BOT_TOKEN = process.env["TELEGRAM_BOT_TOKEN"] || "";

if (!TELEGRAM_BOT_TOKEN) {
  logger.error(
    "No Telegram Bot token set. Set TELEGRAM_BOT_TOKEN environment variable"
  );
  process.exit(1);
}

export const REDIS_URL =
  ENVIRONMENT === "production" ? process.env.REDIS_URL : undefined;

if (!REDIS_URL && prod) {
  logger.error("No Redis url provided. Set REDIS_URL environment variable");
  process.exit(1);
}
