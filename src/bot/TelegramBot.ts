import axios from "axios";
import { EventEmitter } from "events";
import { Express, Request, Response } from "express";
import { logger } from "../utils/logger";
import {
  Update as TelegramUpdate,
  Message as TelegramMessage
} from "../types/telegram";
import * as telegramBotMachine from "./TelegramBotMachine";
import * as db from "../db";
import { interpret } from "xstate";

const TELEGRAM_API_BASE_URL = `https://api.telegram.org/bot`;

export class TelegramBot extends EventEmitter {
  constructor(
    private botToken: string,
    private appRootUrl: string,
    private app: Express
  ) {
    super();
    this.on("message", this.onReceiveMessage);
  }

  async setup(path: string): Promise<void> {
    const pathEndpoint = `${path}/${this.botToken}`;
    this.app.post(pathEndpoint, this.updateHandler);
    await axios.post(`${TELEGRAM_API_BASE_URL}${this.botToken}/setWebhook`, {
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

  private async onReceiveMessage(message: TelegramMessage) {
    const telegramUser = message.from;
    if (!telegramUser) {
      return;
    }
    let botMachine = telegramBotMachine.machine;
    let previousState = await telegramBotMachine.getPersistedMachineState(
      telegramUser.id
    );
    let currentState;
    if (previousState) {
      currentState = botMachine.resolveState(previousState);
    } else {
      const user = await db.findOrCreateTelegramUser(telegramUser, "user");
      botMachine = telegramBotMachine.machine.withContext({
        ...telegramBotMachine.machine.context,
        userId: user.id,
        telegramUserId: telegramUser.id
      });
      currentState = botMachine.initialState;
    }
    const service = interpret(botMachine);
    service.onTransition(state => {
      if (state.changed) {
        telegramBotMachine.persistMachineState(telegramUser.id, state);
      }
    });
    service.start(currentState);
  }
}
