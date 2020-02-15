import axios, { AxiosResponse } from "axios";
import { EventEmitter } from "events";
import { Express, Request, Response } from "express";
import { logger } from "../utils/logger";
import {
  Update as TelegramUpdate,
  Message as TelegramMessage,
  InlineKeyboardMarkup,
  ReplyKeyboardMarkup
} from "../types/telegram";

const TELEGRAM_API_BASE_URL = `https://api.telegram.org/bot`;

export class TelegramBot extends EventEmitter {
  telegramBaseUrl: string;
  constructor(
    private botToken: string,
    private appRootUrl: string,
    private app: Express
  ) {
    super();
    this.telegramBaseUrl = TELEGRAM_API_BASE_URL + this.botToken;
  }

  async setup(path: string): Promise<void> {
    const pathEndpoint = `${path}/${this.botToken}`;
    this.app.post(pathEndpoint, this.updateHandler);
    await axios.post(`${this.telegramBaseUrl}/setWebhook`, {
      url: `${this.appRootUrl}${pathEndpoint}`
    });
    logger.info("Setup telegram bot webhook");
  }

  private updateHandler = (req: Request, res: Response) => {
    const update: TelegramUpdate = req.body;
    if (update.message) {
      this.emit("message", update.message);
    }
    res.sendStatus(200);
  };

  sendMessage(
    chatId: number | string,
    text: string,
    {
      replyMarkup,
      parseMode
    }: {
      replyMarkup?: InlineKeyboardMarkup | ReplyKeyboardMarkup;
      parseMode?: string;
    } = {}
  ): Promise<AxiosResponse> {
    return axios.post(`${this.telegramBaseUrl}/sendMessage`, {
      chat_id: chatId,
      text,
      reply_markup: replyMarkup,
      parse_mode: parseMode
    });
  }
}
