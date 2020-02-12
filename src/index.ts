import { config } from "dotenv";
import express, { Request, Response } from "express";
import bodyParser from "body-parser";

config();

const app = express();

const PORT = process.env.PORT || 3030;

app.use(bodyParser.urlencoded({ extended: true }));

app.listen(PORT, () => {
  console.log(`Listening on port ${PORT}`);
});
