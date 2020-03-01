import express, { Request, Response, NextFunction } from "express";
import bodyParser from "body-parser";
import { PORT, JWT_SECRET } from "./utils/secrets";
import expressJwt from "express-jwt";
import { telegramLogin, getUser, hasRole } from "./controllers/user";
import { pendingListings, approveListing } from "./controllers/listing";

const app = express();

const authenticate = expressJwt({
  secret: JWT_SECRET
});

app.set("port", PORT);
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

function catchErrors(
  middleware: (req: Request, res: Response, next: NextFunction) => Promise<void>
) {
  return function(req: Request, res: Response, next: NextFunction) {
    return middleware(req, res, next).catch(next);
  };
}

app.post("/api/telegram-login", catchErrors(telegramLogin));
app.get("/api/get-user", authenticate, catchErrors(getUser));
app.get(
  "/api/pending-listings",
  authenticate,
  catchErrors(hasRole("admin")),
  catchErrors(pendingListings)
);
app.patch(
  "/api/approve-listing/:id",
  authenticate,
  catchErrors(hasRole("admin")),
  catchErrors(approveListing)
);

export { app };
