import React, { useState } from "react";
import { HouseListing } from "./types";
import {
  makeStyles,
  AppBar,
  Toolbar,
  IconButton,
  CardMedia,
  Typography,
  Snackbar
} from "@material-ui/core";
import DoneOutlineIcon from "@material-ui/icons/DoneOutline";
import CloseIcon from "@material-ui/icons/Close";
import ListingInfoItem from "./ListingInfoItem";
import BathtubIcon from "@material-ui/icons/Bathtub";
import MeetingRoomIcon from "@material-ui/icons/MeetingRoom";
import TransferWithinAStationIcon from "@material-ui/icons/TransferWithinAStation";
import BusinessIcon from "@material-ui/icons/Business";
import LocationOnIcon from "@material-ui/icons/LocationOn";
import { api } from "./api";
// @ts-ignore
import { useMutation, queryCache } from "react-query";
import MuiAlert from "@material-ui/lab/Alert";

const useStyles = makeStyles(theme => {
  return {
    root: {
      boxShadow: theme.shadows[1],
      background: theme.palette.primary.main
    },
    toolbar: {
      boxShadow: theme.shadows[0]
    },
    titleContainer: {
      display: "flex",
      flexDirection: "column"
    },
    title: {
      fontWeight: 800
    },
    location: {
      display: "inline-flex",
      alignItems: "center",
      marginLeft: theme.spacing(-0.25)
    },
    flexGrow: {
      flex: 1
    },
    listingBody: {
      paddingTop: theme.spacing(2),
      paddingBottom: theme.spacing(2),
      paddingLeft: theme.spacing(3),
      paddingRight: theme.spacing(3)
    },
    infoItems: {
      display: "flex",
      gridAutoFlow: "column",
      justifyContent: "start"
    },
    infoItem: {
      marginRight: theme.spacing(2)
    },
    description: {
      paddingTop: theme.spacing(2),
      paddingBottom: theme.spacing(3)
    },
    listingPhotos: {
      display: "grid",
      justifyContent: "center",
      gridGap: theme.spacing(2),
      gridAutoFlow: "column",
      paddingTop: theme.spacing(2)
    },
    listingPhoto: {
      width: 150,
      height: 150
    }
  };
});

interface Props {
  listing: HouseListing;
}

const approveListing = ({ id }: { id: number }) => {
  return api(`/api/approve-listing/${id}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json"
    }
  });
};

const declineListing = ({ id }: { id: number }) => {
  return api(`/api/decline-listing/${id}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json"
    }
  });
};

export default function ListingView({ listing }: Props) {
  const classes = useStyles();
  const [showError, setShowError] = useState(false);
  const [mutate, { status }] = useMutation(approveListing, {
    onSuccess: () => {
      queryCache.refetchQueries("pendingListings");
    },
    onError: () => {
      setShowError(true);
    }
  });
  const [declineMutate, { status: declineStatus }] = useMutation(
    declineListing,
    {
      onSuccess: () => {
        queryCache.refetchQueries("pendingListings");
      },
      onError: () => {
        setShowError(true);
      }
    }
  );
  const onApproveListing = async () => {
    try {
      await mutate({ id: listing.id });
    } catch (err) {
      setShowError(true);
      console.log(err);
    }
  };
  const onDeclineListing = async () => {
    try {
      await declineMutate({ id: listing.id });
    } catch (err) {
      setShowError(true);
      console.log(err);
    }
  };
  return (
    <div className={classes.root}>
      <AppBar position="static" className={classes.toolbar}>
        <Toolbar>
          <div className={classes.titleContainer}>
            <Typography variant="h6" className={classes.title}>
              {listing.title}
            </Typography>
            {listing.location && (
              <Typography
                variant="subtitle2"
                color="textSecondary"
                className={classes.location}>
                <LocationOnIcon fontSize="small" /> {listing.location}
              </Typography>
            )}
          </div>

          <div className={classes.flexGrow} />
          <IconButton
            onClick={onApproveListing}
            disabled={status === "loading"}>
            <DoneOutlineIcon fontSize="small" />
          </IconButton>
          <IconButton
            onClick={onDeclineListing}
            disabled={declineStatus === "loading"}>
            <CloseIcon fontSize="small" />
          </IconButton>
        </Toolbar>
      </AppBar>
      <div className={classes.listingBody}>
        <div className={classes.infoItems}>
          <ListingInfoItem
            className={classes.infoItem}
            Icon={TransferWithinAStationIcon}
            text={listing.available_for}
          />
          <ListingInfoItem
            className={classes.infoItem}
            Icon={BusinessIcon}
            text={listing.house_type}
          />
          {!!listing.rooms && (
            <ListingInfoItem
              className={classes.infoItem}
              Icon={MeetingRoomIcon}
              text={`${listing.rooms} Rooms`}
            />
          )}
          {!!listing.bathrooms && (
            <ListingInfoItem
              className={classes.infoItem}
              Icon={BathtubIcon}
              text={`${listing.bathrooms} Baths`}
            />
          )}
          <div className={classes.flexGrow} />
          {!!listing.price && (
            <Typography variant="h6" color="secondary">
              Price {listing.price}
            </Typography>
          )}
        </div>
        {!!listing.description && (
          <Typography variant="body1" className={classes.description}>
            {listing.description}
          </Typography>
        )}
        <div className={classes.listingPhotos}>
          {(listing.photos || []).map((photo, index) => {
            return (
              <CardMedia
                className={classes.listingPhoto}
                key={photo}
                image={photo}
                title={`Listing photo #${index}`}
              />
            );
          })}
        </div>
      </div>
      <Snackbar
        open={showError}
        autoHideDuration={6000}
        onClose={() => setShowError(false)}>
        <MuiAlert elevation={6} variant="filled" severity="error">
          Problem occurred performing request
        </MuiAlert>
      </Snackbar>
    </div>
  );
}
