import { Request, Response, NextFunction } from "express";
import * as db from "../db";
import { TELEGRAM_BOT_TOKEN } from "../utils/secrets";
import { TelegramBot } from "../bot/TelegramBot";
import { TelegramService } from "../bot/TelegramService";
import { TELEGRAM_CHANNEL_USERNAME } from "../utils/secrets";

export async function pendingListings(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const listings = await db.getListings({ approvalStatus: "Pending" });
  res.status(200).send({
    listings
  });
}

async function postListingToTelegram(listing: db.HouseListing, owner: db.User) {
  const telegramBot = new TelegramBot(TELEGRAM_BOT_TOKEN);
  const telegramService = new TelegramService(telegramBot);
  const sentMessage = await telegramService.sendListing(
    `@${TELEGRAM_CHANNEL_USERNAME}`,
    listing,
    {
      owner
    }
  );
  await db.createSocialPost(listing.id, sentMessage.message_id);
  await telegramBot.sendMessage(
    owner.telegram_id,
    `🙌🙌🙌 ቤቱ ተፈቅዷል 🙌🙌🙌.

ቴሌግራም ቻናላችን ላይ ሼር ተደርጓል`
  );
  await telegramService.sendSuccessSaving(owner.telegram_id, listing, owner);
}

export async function approveListing(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const { id } = req.params;
  const affectedRows = await db.approveListing(parseInt(id));
  if (affectedRows === 1) {
    res.status(200).send({
      success: true
    });
    const listing = (await db.getListingById(parseInt(id))) as db.HouseListing;
    const owner = await db.getUserById(listing.owner);
    if (!owner) {
      throw new Error(
        "Failed to retrieve listing owner when approving listing"
      );
    }
    await postListingToTelegram(listing, owner);
    return;
  }
  res.sendStatus(404);
}
