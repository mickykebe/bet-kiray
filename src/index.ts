import { TELEGRAM_BOT_TOKEN, APP_ROOT_URL } from "./utils/secrets";
import { logger } from "./utils/logger";
import { TelegramBot } from "./bot/TelegramBot";
import { app } from "./app";

async function start(): Promise<void> {
  app.listen(app.get("port"), async () => {
    console.log(
      `App is running at http://localhost:${app.get("port")} in ${app.get(
        "env"
      )}`
    );

    const telegramBot = new TelegramBot(TELEGRAM_BOT_TOKEN, APP_ROOT_URL, app);
    try {
      await telegramBot.setup("/api/telegram");
    } catch (err) {
      logger.error(err);
      process.exit(1);
    }
  });
}

start();
