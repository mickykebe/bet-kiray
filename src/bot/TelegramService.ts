import { TelegramBot } from "./TelegramBot";
import {
  ReplyKeyboardMarkup,
  InlineKeyboardMarkup,
  Message as TelegramMessage,
  InputMediaPhoto
} from "../types/telegram";
import { User, HouseListing } from "../db";
import { EVENT_CLOSE_JOB } from "./TelegramBotMachine";

interface ListingData {
  title: string;
  available_for: string;
  house_type: string;
  price?: string;
  rooms?: number;
  bathrooms?: number;
  location?: string;
  description?: string;
  photos?: string[];
  apply_phone_number?: string;
  apply_via_telegram?: boolean;
}

export class TelegramService {
  constructor(private telegramBot: TelegramBot) {}

  private listingMessage = (
    listing: {
      title: string;
      available_for: string;
      house_type: string;
      price?: string;
      rooms?: number;
      bathrooms?: number;
      location?: string;
      description?: string;
      telegram_user_id?: number;
      apply_phone_number?: string;
      apply_via_telegram?: boolean;
    },
    owner?: User
  ): string => {
    return `*📝 መግለጫ:* \`\`\` ${listing.title} \`\`\`

*🤝 ቤቱ የቀረበው:* \`${listing.available_for}\`
    
*🏘️ የቤቱ አይነት:* \`${listing.house_type}\`${
      !!listing.location ? `\n\n*📍 ቦታ:* \`\`\` ${listing.location} \`\`\`` : ""
    }${!!listing.price ? `\n\n*💲 ዋጋ:* \`\`\` ${listing.price} \`\`\`` : ""}${
      !!listing.rooms ? `\n\n*🚪 ክፍሎች:* \`\`\`${listing.rooms}\`\`\`` : ""
    }${
      !!listing.bathrooms
        ? `\n\n*🛁 ሽንትቤቶች:* \`\`\`${listing.bathrooms}\`\`\``
        : ""
    }${
      !!listing.description
        ? `\n\n*📜 ዝርዝር መግለጫ:* \`\`\`${listing.description}\`\`\``
        : ""
    }${
      listing.apply_via_telegram && owner
        ? `\n\n*💬 ስለ ቤቱ ለመነጋገር፡* [${owner.first_name ||
            (owner.telegram_user_name
              ? `@${owner.telegram_user_name}`
              : null) ||
            "User"}](tg://user?id=${listing.telegram_user_id})`
        : ""
    }${
      !!listing.apply_phone_number
        ? `\n\n*📱 ስለ ቤቱ ለመነጋገር፡* \`\`\`${listing.apply_phone_number}\`\`\``
        : ""
    }`;
  };

  public sendListing = async (
    chatId: number | string,
    listing: ListingData,
    {
      owner,
      multiImageFollowupMessage = "ይህንን ይመስላል",
      replyMarkup
    }: {
      replyMarkup?: ReplyKeyboardMarkup | InlineKeyboardMarkup;
      multiImageFollowupMessage?: string;
      owner?: User;
    } = {}
  ): Promise<TelegramMessage> => {
    const message = this.listingMessage(listing, owner);
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

  sendSuccessSaving = (
    chatId: number | string,
    listing: HouseListing,
    owner?: User
  ) => {
    return this.sendListing(chatId, listing, {
      multiImageFollowupMessage: `ቤቱ ${
        listing.available_for === "Rent" ? "ሲከራይ" : "ሲሸጥ"
      } ይህንን በተን መጫን አይርሱ፡፡`,
      owner,
      replyMarkup: {
        inline_keyboard: [
          [
            {
              text: `✋ ቤቱ ${
                listing.available_for === "Rent" ? "ተከራይቷል" : "ተሽጧል"
              }`,
              callback_data: JSON.stringify({
                event: EVENT_CLOSE_JOB,
                id: listing.id
              })
            }
          ]
        ]
      }
    });
  };

  sendDeclineMessage = (chatId: string | number, listingTitle: string) => {
    return this.telegramBot.sendMessage(
      chatId,
      `በሚከተለው ርዕስ የተላከው ቤት አልተፈቀደም 😞፡፡

\`\`\` ${listingTitle} \`\`\``,
      {
        parseMode: "Markdown"
      }
    );
  };
}
