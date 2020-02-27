import { TelegramBot } from "./TelegramBot";
import {
  ReplyKeyboardMarkup,
  InlineKeyboardMarkup,
  Message as TelegramMessage,
  InputMediaPhoto
} from "../types/telegram";

export class TelegramService {
  constructor(private telegramBot: TelegramBot) {}

  private listingMessage = (listing: {
    title: string;
    available_for: string;
    house_type: string;
    price?: string;
    rooms?: number;
    bathrooms?: number;
    location?: string;
    description?: string;
  }): string => {
    return `*📝 Title:* \`\`\` ${listing.title} \`\`\`

*🤝 Available For:* \`${listing.available_for}\`
    
*🏘️ House Type:* \`${listing.house_type}\`${
      !!listing.location
        ? `\n\n*📍 Location:* \`\`\` ${listing.location} \`\`\``
        : ""
    }${
      !!listing.price ? `\n\n*💲 Price:* \`\`\` ${listing.price} \`\`\`` : ""
    }${!!listing.rooms ? `\n\n*🚪 Rooms:* \`\`\`${listing.rooms}\`\`\`` : ""}${
      !!listing.bathrooms
        ? `\n\n*🛁 Bathrooms:* \`\`\`${listing.bathrooms}\`\`\``
        : ""
    }${
      !!listing.description
        ? `\n\n*📜 Description:* \`\`\` ${listing.description} \`\`\``
        : ""
    }`;
  };

  public sendListing = async (
    chatId: number | string,
    listing: {
      title: string;
      available_for: string;
      house_type: string;
      price?: string;
      rooms?: number;
      bathrooms?: number;
      location?: string;
      description?: string;
      photos?: string[];
    },
    {
      multiImageFollowupMessage = "ይህንን ይመስላል",
      replyMarkup
    }: {
      replyMarkup?: ReplyKeyboardMarkup | InlineKeyboardMarkup;
      multiImageFollowupMessage?: string;
    } = {}
  ): Promise<TelegramMessage> => {
    const message = this.listingMessage(listing);
    if (listing.photos && listing.photos.length === 1) {
      return this.telegramBot.sendPhoto(chatId, listing.photos[0], {
        caption: message,
        parseMode: "Markdown",
        replyMarkup
      });
    }
    if (listing.photos && listing.photos.length > 1) {
      const messages = await this.telegramBot.sendMediaGroup(
        chatId,
        listing.photos.map(
          (photo, index): InputMediaPhoto => ({
            type: "photo",
            media: photo,
            caption: index === 0 ? message : undefined,
            parse_mode: "Markdown"
          })
        )
      );
      if (replyMarkup) {
        await this.telegramBot.sendMessage(chatId, multiImageFollowupMessage, {
          replyMarkup
        });
      }

      return messages[0];
    }
    return this.telegramBot.sendMessage(chatId, message, {
      parseMode: "Markdown",
      replyMarkup
    });
  };
}
