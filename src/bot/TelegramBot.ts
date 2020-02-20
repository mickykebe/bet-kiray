import axios, { AxiosResponse, AxiosRequestConfig } from "axios";
import { EventEmitter } from "events";
import { Express, Request, Response } from "express";
import { logger } from "../utils/logger";
import {
  Update as TelegramUpdate,
  Message as TelegramMessage,
  Response as TelegramResponse,
  File as TelegramFile,
  InlineKeyboardMarkup,
  ReplyKeyboardMarkup,
  TelegramResult
} from "../types/telegram";

const TELEGRAM_API_BASE_URL = `https://api.telegram.org/bot`;
const TELEGRAM_FILE_BASE_URL = `https://api.telegram.org/file/bot`;

export class TelegramBot extends EventEmitter {
  telegramBaseUrl: string;
  telegramFileBaseUrl: string;
  constructor(
    private botToken: string,
    private appRootUrl: string,
    private app: Express
  ) {
    super();
    this.telegramBaseUrl = TELEGRAM_API_BASE_URL + this.botToken;
    this.telegramFileBaseUrl = TELEGRAM_FILE_BASE_URL + this.botToken;
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

  private async telegramGenericMethod(
    baseUrl: string,
    method: string,
    config: AxiosRequestConfig
  ): Promise<TelegramResult> {
    const { data }: { data: TelegramResponse } = await axios({
      method: "post",
      ...config,
      url: `${baseUrl}/${method}`
    });
    if (!data.ok) {
      throw new Error(`Problem occurred invoking telegram method: ${method}`);
    }
    return data.result;
  }

  async telegramMethod(method: string, config: AxiosRequestConfig) {
    return this.telegramGenericMethod(this.telegramBaseUrl, method, config);
  }

  async telegramFileMethod(method: string, config: AxiosRequestConfig) {
    return this.telegramGenericMethod(this.telegramFileBaseUrl, method, config);
  }

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
  ): Promise<TelegramMessage> {
    return this.telegramMethod("sendMessage", {
      data: {
        chat_id: chatId,
        text,
        reply_markup: replyMarkup,
        parse_mode: parseMode
      }
    }) as Promise<TelegramMessage>;
  }

  sendChatAction(chatId: number | string, action: string): Promise<boolean> {
    return this.telegramMethod("sendChatAction", {
      data: {
        chat_id: chatId,
        action
      }
    }) as Promise<boolean>;
  }

  async getFile(fileId: string): Promise<TelegramFile> {
    return this.telegramMethod("getFile", {
      data: {
        file_id: fileId
      }
    }) as Promise<TelegramFile>;
  }

  downloadFile(filePath: string): Promise<AxiosResponse> {
    return axios.get(`${this.telegramFileBaseUrl}/${filePath}`, {
      responseType: "stream"
    });
  }
}
