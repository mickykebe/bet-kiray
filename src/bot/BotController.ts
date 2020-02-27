import { Express, Request, Response } from "express";
import { TelegramBot } from "./TelegramBot";
import {
  Update as TelegramUpdate,
  Message as TelegramMessage,
  CallbackQuery
} from "../types/telegram";
import { TelegramBotMachine, EVENT_CLOSE_JOB } from "./TelegramBotMachine";
import { logger } from "../utils/logger";
import { getUserByTelegramId, closeListing } from "../db";

export class BotController {
  constructor(
    private bot: TelegramBot,
    private botMachine: TelegramBotMachine,
    private app: Express
  ) {}

  async setup(appRootUrl: string, endpointPath: string): Promise<void> {
    this.app.post(endpointPath, this.updateHandler);
    await this.bot.setupWebhook(appRootUrl, endpointPath);
  }

  private updateHandler = (req: Request, res: Response) => {
    const update: TelegramUpdate = req.body;
    if (update.message) {
      this.botMachine.run(update.message);
    }
    if (update.callback_query) {
      this.cbQueryHandler(update.callback_query);
    }
    res.sendStatus(200);
  };

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
