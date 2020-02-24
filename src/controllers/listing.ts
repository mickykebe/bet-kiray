import { Request, Response, NextFunction } from "express";
import { getListings } from "../db";

export async function pendingListings(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const listings = await getListings({ approvalStatus: "Pending" });
  res.status(200).send({
    listings
  });
}
