import React, { useContext } from "react";
import { UserContext } from "./user-context";
import { Redirect } from "react-router-dom";
import { api } from "./api";
import { HouseListing } from "./types";
import { makeStyles, Typography } from "@material-ui/core";
import ListingCard from "./ListingCard";
import { useQuery } from "react-query";
import LoadingBackdrop from "./LoadingBackdrop";

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

interface PendingListingsResult {
  listings: HouseListing[];
}

export default function PendingListings() {
  const user = useContext(UserContext);
  const classes = useStyles();
  const { data, isLoading } = useQuery<PendingListingsResult, any>(
    "pendingListings",
    (): Promise<PendingListingsResult> => {
      return api("/api/pending-listings", {
        method: "GET",
        headers: {
          "Content-Type": "application/json"
        }
      });
    }
  );
  if (!user || user.role !== "admin") {
    return <Redirect to="/" />;
  }
  if (isLoading) {
    return <LoadingBackdrop />;
  }
  return (
    <div className={classes.root}>
      <Typography variant="h4" className={classes.title}>
        Pending Jobs
      </Typography>
      <div className={classes.container}>
        <div className={classes.listings}>
          {data?.listings.map(listing => (
            <ListingCard
              key={listing.id}
              className={classes.listing}
              houseListing={listing}
            />
          ))}
        </div>
        <div className={classes.activeListing}></div>
      </div>
    </div>
  );
}
