import React, { useContext, useEffect, useState } from "react";
import { UserContext } from "./user-context";
import { Redirect } from "react-router-dom";
import { api } from "./api";
import { HouseListing } from "./types";
import { Card, makeStyles, Typography } from "@material-ui/core";
import ListingCard from "./ListingCard";

const useStyles = makeStyles(theme => {
  return {
    root: {
      padding: theme.spacing(2)
    },
    title: {
      marginBottom: theme.spacing(2)
    },
    listing: {
      marginBottom: theme.spacing(1)
    },
    container: {
      display: "grid",
      gridTemplateColumns: "auto 2fr"
    },
    listings: {},
    activeListing: {}
  };
});

export default function PendingListings() {
  const user = useContext(UserContext);
  const classes = useStyles();
  const [listings, setListings] = useState<HouseListing[]>([]);
  useEffect(() => {
    api("/api/pending-listings", {
      method: "GET",
      headers: {
        "Content-Type": "application/json"
      }
    }).then(({ listings }: { listings: HouseListing[] }) => {
      setListings(listings);
    });
  }, []);
  if (!user || user.role !== "admin") {
    return <Redirect to="/" />;
  }
  return (
    <div className={classes.root}>
      <Typography variant="h4" className={classes.title}>
        Pending Jobs
      </Typography>
      <div className={classes.container}>
        <div className={classes.listings}>
          {listings.map(listing => (
            <ListingCard className={classes.listing} houseListing={listing} />
          ))}
        </div>
        <div className={classes.activeListing}></div>
      </div>
    </div>
  );
}
