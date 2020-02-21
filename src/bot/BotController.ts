import { TelegramBot } from "./TelegramBot";
import { Message as TelegramMessage, CallbackQuery } from "../types/telegram";
import { TelegramBotMachine, EVENT_CLOSE_JOB } from "./TelegramBotMachine";
import { logger } from "../utils/logger";
import { getUserByTelegramId, closeListing } from "../db";

export class BotController {
  private botMachine: TelegramBotMachine;
  constructor(private bot: TelegramBot) {
    this.botMachine = new TelegramBotMachine(bot);
    bot.on("message", (message: TelegramMessage) => {
      this.botMachine.run(message);
    });
    bot.on("callback_query", this.cbQueryHandler);
  }

  cbQueryHandler = async (callbackQuery: CallbackQuery) => {
    const telegramUser = callbackQuery.from;
    let callbackData;
    if (callbackQuery.data) {
      try {
        callbackData = JSON.parse(callbackQuery.data);
      } catch (err) {
        logger.warn("Problem parsing event from callback data");
      }
      if (callbackData.event === EVENT_CLOSE_JOB) {
        await this.closeListing(
          telegramUser.id,
          callbackQuery.id,
          parseInt(callbackData.id)
        );
      }
    }
  };

  closeListing = async (
    telegramUserId: number,
    callbackQueryId: string,
    listingId: number
  ) => {
    const user = await getUserByTelegramId(telegramUserId);
    if (user) {
      const numClosed = await closeListing(listingId, { ownerId: user.id });
      if (numClosed > 0) {
        this.bot.answerCallbackQuery(callbackQueryId, {
          text: "የቤቱ ማስታወቅያ አሁን ተዘግቷል፡፡",
          showAlert: true
        });
      } else {
        this.bot.answerCallbackQuery(callbackQueryId, {
          text: "የቤቱን ማስታወቅያ ስዘጋ ችግር አጋጠመኝ፡፡ ምናልባት ከዚህ በፊት ተዘግቶ ይሆናል፡፡",
          showAlert: true
        });
      }
    }
  };
}
