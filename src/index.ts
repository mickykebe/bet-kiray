import "./utils/secrets";
import { logger } from "./utils/logger";
import { telegramBot } from "./telegramBot";
import { app } from "./app";

async function start(): Promise<void> {
  app.listen(app.get("port"), async () => {
    console.log(
      `App is running at http://localhost:${app.get("port")} in ${app.get(
        "env"
      )}`
    );
    try {
      await telegramBot.setupWebhook();
      logger.info("Setup telegram bot webhook");
    } catch (err) {
      logger.error(err);
    }
  });
}

start();
