import express, { Request, Response, NextFunction } from "express";
import bodyParser from "body-parser";
import { TELEGRAM_BOT_TOKEN, PORT } from "./utils/secrets";

const app = express();

app.set("port", PORT);
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.post(`/api/telegram/${TELEGRAM_BOT_TOKEN}`, function(
  req: Request,
  res: Response,
  next: NextFunction
) {
  res.status(200).send({ success: true });
});

export { app };
