import React, { useContext, useState } from "react";
import { UserContext } from "./user-context";
import { Redirect } from "react-router-dom";
import { api } from "./api";
import { HouseListing } from "./types";
import { makeStyles, Typography } from "@material-ui/core";
import ListingCard from "./ListingCard";
import { useQuery } from "react-query";
import LoadingBackdrop from "./LoadingBackdrop";
import ListingView from "./ListingView";

const useStyles = makeStyles(theme => {
  return {
    root: {
      padding: theme.spacing(4)
    },
    listing: {},
    container: {
      display: "grid",
      gridTemplateColumns: "auto 2fr",
      gridGap: theme.spacing(2)
    },
    listings: {
      background: theme.palette.primary.main,
      boxShadow: theme.shadows[1]
    },
    title: {
      paddingTop: theme.spacing(2),
      paddingLeft: theme.spacing(2),
      paddingRight: theme.spacing(2),
      paddingBottom: theme.spacing(1)
    },
    activeListing: {}
  };
});

interface PendingListingsResult {
  listings: HouseListing[];
}

export default function PendingListings() {
  const user = useContext(UserContext);
  const classes = useStyles();
  const [selectedListingId, setSelectedListingId] = useState<number>(-1);
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
  const selectedListing = data?.listings.find(
    listing => listing.id === selectedListingId
  );
  if (!user || user.role !== "admin") {
    return <Redirect to="/" />;
  }
  if (isLoading) {
    return <LoadingBackdrop />;
  }
  return (
    <div className={classes.root}>
      <div className={classes.container}>
        <div className={classes.listings}>
          <Typography variant="h6" className={classes.title}>
            Pending Jobs
          </Typography>
          {data?.listings.map(listing => (
            <ListingCard
              key={listing.id}
              className={classes.listing}
              houseListing={listing}
              selected={listing.id === selectedListingId}
              onClick={() => setSelectedListingId(listing.id)}
            />
          ))}
        </div>
        <div className={classes.activeListing}>
          {!!selectedListing && <ListingView listing={selectedListing} />}
        </div>
      </div>
    </div>
  );
}
