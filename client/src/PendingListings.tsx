import React, { useContext } from "react";
import { UserContext } from "./user-context";
import { Redirect } from "react-router-dom";

export default function PendingListings() {
  const user = useContext(UserContext);
  if (!user) {
    return <Redirect to="/" />;
  }
  return <div>Pending listings</div>;
}
