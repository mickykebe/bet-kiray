import React from "react";
import { HouseListing } from "./types";
import {
  makeStyles,
  AppBar,
  Toolbar,
  IconButton,
  CardMedia,
  Typography
} from "@material-ui/core";
import DoneOutlineIcon from "@material-ui/icons/DoneOutline";
import CloseIcon from "@material-ui/icons/Close";
import ListingInfoItem from "./ListingInfoItem";
import BathtubIcon from "@material-ui/icons/Bathtub";
import MeetingRoomIcon from "@material-ui/icons/MeetingRoom";
import TransferWithinAStationIcon from "@material-ui/icons/TransferWithinAStation";
import BusinessIcon from "@material-ui/icons/Business";

const useStyles = makeStyles(theme => {
  return {
    root: {
      boxShadow: theme.shadows[1],
      background: theme.palette.primary.main
    },
    toolbar: {
      boxShadow: theme.shadows[0]
    },
    title: {
      fontWeight: 800
    },
    flexGrow: {
      flex: 1
    },
    listingBody: {
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

export default function ListingView({ listing }: Props) {
  const classes = useStyles();
  return (
    <div className={classes.root}>
      <AppBar position="static" className={classes.toolbar}>
        <Toolbar>
          <Typography variant="h6" className={classes.title}>
            {listing.title}
          </Typography>
          <div className={classes.flexGrow} />
          <IconButton>
            <DoneOutlineIcon fontSize="small" />
          </IconButton>
          <IconButton>
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
          {listing.photos.map((photo, index) => {
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
    </div>
  );
}
