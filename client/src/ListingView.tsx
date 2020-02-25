import React from "react";
import { HouseListing } from "./types";

interface Props {
  listing: HouseListing;
}

export default function ListingView({ listing }: Props) {
  return <div>{listing.title}</div>;
}
