import express, { Request, Response, NextFunction } from "express";
import bodyParser from "body-parser";
import { PORT } from "./utils/secrets";

const app = express();

app.set("port", PORT);
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

export { app };
