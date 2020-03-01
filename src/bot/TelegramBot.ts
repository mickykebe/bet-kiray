import axios, { AxiosResponse, AxiosRequestConfig } from "axios";
import { EventEmitter } from "events";
import { logger } from "../utils/logger";
import {
  Update as TelegramUpdate,
  Message as TelegramMessage,
  Response as TelegramResponse,
  File as TelegramFile,
  InlineKeyboardMarkup,
  ReplyKeyboardMarkup,
  TelegramResult,
  InputMediaPhoto,
  InputMediaVideo,
  ReplyKeyboardRemove,
  ForceReply
} from "../types/telegram";

const TELEGRAM_API_BASE_URL = `https://api.telegram.org/bot`;
const TELEGRAM_FILE_BASE_URL = `https://api.telegram.org/file/bot`;

export class TelegramBot extends EventEmitter {
  telegramBaseUrl: string;
  telegramFileBaseUrl: string;
  constructor(private botToken: string) {
    super();
    this.telegramBaseUrl = TELEGRAM_API_BASE_URL + this.botToken;
    this.telegramFileBaseUrl = TELEGRAM_FILE_BASE_URL + this.botToken;
  }

  async setupWebhook(appRootUrl: string, endpointPath: string): Promise<void> {
    await axios.post(`${this.telegramBaseUrl}/setWebhook`, {
      url: `${appRootUrl}${endpointPath}`
    });
    logger.info("Setup telegram bot webhook");
  }

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

  async telegramMethod(
    method: string,
    config: AxiosRequestConfig
  ): Promise<TelegramResult> {
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
      parseMode,
      disableWebPagePreview,
      disableNotification,
      replyToMessageId
    }: {
      replyMarkup?: InlineKeyboardMarkup | ReplyKeyboardMarkup;
      parseMode?: "Markdown" | "HTML";
      disableWebPagePreview?: boolean;
      disableNotification?: boolean;
      replyToMessageId?: number;
    } = {}
  ): Promise<TelegramMessage> {
    return this.telegramMethod("sendMessage", {
      data: {
        chat_id: chatId,
        text,
        reply_markup: replyMarkup,
        parse_mode: parseMode,
        disable_web_page_preview: disableWebPagePreview,
        disable_notification: disableNotification,
        reply_to_message_id: replyToMessageId
      }
    }) as Promise<TelegramMessage>;
  }

  sendPhoto(
    chatId: number | string,
    photo: string,
    {
      caption,
      parseMode,
      disableNotification,
      replyToMessageId,
      replyMarkup
    }: {
      caption?: string;
      parseMode?: string;
      disableNotification?: boolean;
      replyToMessageId?: number;
      replyMarkup?:
        | InlineKeyboardMarkup
        | ReplyKeyboardMarkup
        | ReplyKeyboardRemove
        | ForceReply;
    } = {}
  ): Promise<TelegramMessage> {
    return this.telegramMethod("sendPhoto", {
      data: {
        chat_id: chatId,
        photo,
        caption,
        parse_mode: parseMode,
        disable_notification: disableNotification,
        reply_to_message_id: replyToMessageId,
        reply_markup: replyMarkup
      }
    }) as Promise<TelegramMessage>;
  }

  sendMediaGroup(
    chatId: number | string,
    media: (InputMediaPhoto | InputMediaVideo)[],
    {
      disableNotification,
      replyToMessageId
    }: {
      disableNotification?: boolean;
      replyToMessageId?: number;
    } = {}
  ): Promise<TelegramMessage[]> {
    return this.telegramMethod("sendMediaGroup", {
      data: {
        chat_id: chatId,
        media,
        disable_notification: disableNotification,
        reply_to_message_id: replyToMessageId
      }
    }) as Promise<TelegramMessage[]>;
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

  async answerCallbackQuery(
    callbackQueryId: string,
    {
      text,
      showAlert,
      url,
      cacheTime
    }: { text?: string; showAlert?: boolean; url?: string; cacheTime?: number }
  ) {
    return this.telegramMethod("answerCallbackQuery", {
      data: {
        callback_query_id: callbackQueryId,
        text,
        show_alert: showAlert,
        cache_time: cacheTime
      }
    }) as Promise<boolean>;
  }

  downloadFile(filePath: string): Promise<AxiosResponse> {
    return axios.get(`${this.telegramFileBaseUrl}/${filePath}`, {
      responseType: "stream"
    });
  }
}
