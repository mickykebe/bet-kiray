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

interface Listing {
  id: number;
  available_for: string;
  house_type: string;
  title: string;
  description?: string;
  rooms?: number;
  bathrooms?: number;
  price?: string;
  owner: number;
  approval_status: string;
  created: Date;
}

export interface HouseListing extends Listing {
  photos: ListingPhoto[];
}

interface ListingPhoto {
  id: number;
  listing_id: number;
  photo_url: string;
}

interface ListingInput {
  title: string;
  availableFor: string;
  houseType: string;
  rooms?: number;
  bathrooms?: number;
  description?: string;
  price?: string;
  photos?: string[];
}

export async function createListing(values: ListingInput, userId: number) {
  return await knex.transaction(async trx => {
    let rows = await trx<HouseListing>("house_listing")
      .insert({
        available_for: values.availableFor,
        house_type: values.houseType,
        title: values.title,
        description: values.description,
        rooms: values.rooms,
        bathrooms: values.bathrooms,
        price: values.price,
        owner: userId
      })
      .returning("*");

    if (rows.length !== 1) {
      throw new Error("Problem occurred inserting listing");
    }

    const row = rows[0];

    let photos: ListingPhoto[] = [];
    if (values.photos && values.photos.length > 0) {
      photos = await trx<ListingPhoto>("listing_photo").insert(
        values.photos.map(url => {
          return {
            listing_id: row["id"],
            photo_url: url
          };
        }),
        "*"
      );
    }
    return {
      ...row,
      photos
    } as HouseListing;
  });
}

export async function getUserByTelegramId(
  telegramUserId: number
): Promise<User | undefined> {
  const row = await knex<User>("users")
    .first()
    .where("telegram_id", telegramUserId);
  return row;
}

export async function getUserById(id: number): Promise<User | undefined> {
  const row = await knex<User>("users")
    .first()
    .where("id", id);
  return row;
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

export function closeListing(id: number, { ownerId }: { ownerId?: number }) {
  return knex<Listing>("house_listing")
    .where("id", id)
    .whereIn("approval_status", ["Pending", "Active"])
    .update({
      approval_status: "Closed",
      ...(!!ownerId && {
        owner: ownerId
      })
    });
}
