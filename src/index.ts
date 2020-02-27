import { TELEGRAM_BOT_TOKEN, APP_ROOT_URL } from "./utils/secrets";
import { logger } from "./utils/logger";
import { TelegramBot } from "./bot/TelegramBot";
import { app } from "./app";
import { BotController } from "./bot/BotController";
import { TelegramBotMachine } from "./bot/TelegramBotMachine";
import { TelegramService } from "./bot/TelegramService";

async function start(): Promise<void> {
  app.listen(app.get("port"), async () => {
    logger.info(
      `App is running at http://localhost:${app.get("port")} in ${app.get(
        "env"
      )}`
    );

    const telegramBot = new TelegramBot(TELEGRAM_BOT_TOKEN);
    const botMachine = new TelegramBotMachine(
      telegramBot,
      new TelegramService(telegramBot)
    );
    const botController = new BotController(telegramBot, botMachine, app);
    try {
      await botController.setup(
        APP_ROOT_URL,
        "/api/telegram/" + TELEGRAM_BOT_TOKEN
      );
    } catch (err) {
      logger.error(err);
      process.exit(1);
    }
  });
}

start();
