import Knex from "knex";
import { DATABASE_URL } from "./utils/secrets";
import { User as TelegramUser } from "./types/telegram";

const knex = Knex({
  client: "pg",
  connection: DATABASE_URL
});

export interface User {
  id: number;
  telegram_id: number;
  telegram_user_name?: string;
  first_name?: string;
  last_name?: string;
  role: string;
}

export interface HouseListing {
  id: number;
  available_for: string;
  house_type: string;
  title: string;
  description?: string;
  rooms?: number;
  bathrooms?: number;
  location?: string;
  price?: string;
  owner: number;
  approval_status: string;
  created: Date;
  apply_via_telegram?: boolean;
  apply_phone_number?: string;
  photos?: string[];
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
  location?: string;
  description?: string;
  price?: string;
  photos?: string[];
  applyViaTelegram?: boolean;
  applyPhoneNumber?: string;
}

interface ListingSocialPost {
  listing_id: number;
  telegram_message_id?: number;
}

const houseListingColumns = [
  "id",
  "available_for",
  "house_type",
  "title",
  "description",
  "rooms",
  "bathrooms",
  "location",
  "price",
  "owner",
  "approval_status",
  "created",
  "apply_via_telegram",
  "apply_phone_number"
];

function selectColumns(tableName: string, columns: string[]) {
  return columns.map(columnName => `${tableName}.${columnName}`);
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
        location: values.location,
        price: values.price,
        owner: userId,
        apply_phone_number: values.applyPhoneNumber,
        apply_via_telegram: values.applyViaTelegram
      })
      .returning("*");

    if (rows.length !== 1) {
      throw new Error("Problem occurred inserting listing");
    }

    const row = rows[0];

    let listingPhotos: ListingPhoto[] = [];
    if (values.photos && values.photos.length > 0) {
      listingPhotos = await trx<ListingPhoto>("listing_photo").insert(
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
      photos: listingPhotos.map(listingPhoto => listingPhoto.photo_url)
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

export async function getListings({
  approvalStatus = []
}: {
  approvalStatus?: string | string[];
} = {}) {
  let query = knex<HouseListing>("house_listing")
    .select(selectColumns("house_listing", houseListingColumns))
    .select(
      knex.raw(
        `coalesce(json_agg(listing_photo.photo_url) filter (where listing_photo.photo_url IS NOT NULL), '[]') as photos`
      )
    )
    .leftJoin("listing_photo", "house_listing.id", "listing_photo.listing_id")
    .groupBy("house_listing.id");

  if (approvalStatus) {
    let approvalIn: string[] = [];
    if (typeof approvalStatus === "string") {
      approvalIn = [approvalStatus];
    } else {
      approvalIn = approvalStatus;
    }

    if (approvalIn.length > 0) {
      query = query.whereIn("house_listing.approval_status", approvalIn);
    }
  }

  return await query;
}

export async function getListingById(id: number) {
  return knex<HouseListing>("house_listing")
    .first(selectColumns("house_listing", houseListingColumns))
    .first(
      knex.raw(
        `coalesce(json_agg(listing_photo.photo_url) filter (where listing_photo.photo_url IS NOT NULL), '[]') as photos`
      )
    )
    .leftJoin("listing_photo", "house_listing.id", "listing_photo.listing_id")
    .groupBy("house_listing.id")
    .where("house_listing.id", id);
}

export function closeListing(id: number, { ownerId }: { ownerId?: number }) {
  return knex<HouseListing>("house_listing")
    .where("id", id)
    .whereIn("approval_status", ["Pending", "Active"])
    .update({
      approval_status: "Closed",
      ...(!!ownerId && {
        owner: ownerId
      })
    });
}

export function approveListing(id: number) {
  return knex("house_listing")
    .where("id", id)
    .update({
      approval_status: "Active"
    });
}

export function declineListing(listingId: number) {
  return knex("house_listing")
    .where("id", listingId)
    .update({
      approval_status: "Declined"
    });
}

export function createSocialPost(listingId: number, telegramMessageId: number) {
  return knex("listing_social_post").insert({
    listing_id: listingId,
    telegram_message_id: telegramMessageId
  });
}

export function getSocialPost(listingId: number) {
  return knex<ListingSocialPost>("listing_social_post")
    .first()
    .where("listing_id", listingId);
}
