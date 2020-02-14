import Redis from "ioredis";
import { REDIS_URL } from "./utils/secrets";

export const redis = new Redis(REDIS_URL);
