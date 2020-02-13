import axios, { AxiosResponse } from "axios";
import { TELEGRAM_BOT_TOKEN, APP_ROOT_URL } from "./utils/secrets";

const TELEGRAM_API_BASE_URL = `https://api.telegram.org/bot`;

class TelegramBot {
  constructor(private botToken: string, private appRootUrl: string) {}

  setupWebhook(): Promise<AxiosResponse> {
    return axios.post(`${TELEGRAM_API_BASE_URL}${this.botToken}/setWebhook`, {
      url: `${this.appRootUrl}/api/telegram/${this.botToken}`
    });
  }
}

export const telegramBot = new TelegramBot(TELEGRAM_BOT_TOKEN, APP_ROOT_URL);
