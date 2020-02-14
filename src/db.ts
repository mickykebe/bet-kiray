import Knex from "knex";
import { DATABASE_URL } from "./utils/secrets";
import { User as TelegramUser } from "./types/telegram";

const knex = Knex({
  client: "pg",
  connection: DATABASE_URL
});

interface User {
  id: number;
  telegram_id: number;
  telegram_user_name?: string;
  first_name?: string;
  last_name?: string;
  role: string;
}

export async function findOrCreateTelegramUser(
  telegramUser: TelegramUser,
  role: string
): Promise<User> {
  const user = await knex<User>("users")
    .first()
    .where({
      telegram_id: telegramUser.id
    });
  if (user) {
    return user;
  }
  const users = await knex<User>("users")
    .insert({
      telegram_id: telegramUser.id,
      telegram_user_name: telegramUser.username,
      first_name: telegramUser.first_name,
      last_name: telegramUser.last_name,
      role
    })
    .returning("*");
  if (users.length !== 1) {
    throw new Error("Problem occurre creating telegram user");
  }
  return users[0];
}
