import React from "react";
import { HouseListing } from "./types";
import {
  makeStyles,
  CardMedia,
  Typography,
  CardActionArea
} from "@material-ui/core";
import BathtubIcon from "@material-ui/icons/Bathtub";
import MeetingRoomIcon from "@material-ui/icons/MeetingRoom";
import ListingInfoItem from "./ListingInfoItem";

interface Props {
  houseListing: HouseListing;
  className?: string;
  selected?: boolean;
  onClick: () => void;
}

const useStyles = makeStyles(theme => {
  return {
    container: {
      paddingTop: theme.spacing(1),
      paddingBottom: theme.spacing(1),
      paddingLeft: theme.spacing(2),
      paddingRight: theme.spacing(2),
      display: "flex",
      alignItems: "stretch"
    },
    cover: {
      width: 75,
      height: 75
    },
    title: {
      marginBottom: theme.spacing(2),
      fontWeight: 800,
      lineHeight: 1
    },
    info: {
      marginRight: theme.spacing(2)
    },
    details: {
      display: "flex",
      flexDirection: "column",
      paddingLeft: theme.spacing(2),
      justifyContent: "space-between"
    },
    infoItems: {
      display: "flex"
    },
    selectedBar: {
      backgroundColor: theme.palette.secondary.main,
      width: 2,
      position: "absolute",
      top: 0,
      bottom: 0,
      right: 0
    }
  };
});

export default function ListingCard({
  houseListing,
  className,
  selected = false,
  onClick
}: Props) {
  const classes = useStyles();
  return (
    <CardActionArea className={className} onClick={onClick}>
      <div className={classes.container}>
        {houseListing.photos && houseListing.photos.length > 0 && (
          <CardMedia
            className={classes.cover}
            image={houseListing.photos[0]}
            title="Live from space album cover"
          />
        )}
        <div className={classes.details}>
          <Typography variant="subtitle1" className={classes.title}>
            {houseListing.title}
          </Typography>
          <div className={classes.infoItems}>
            {!!houseListing.rooms && (
              <ListingInfoItem
                className={classes.info}
                Icon={MeetingRoomIcon}
                text={`${houseListing.rooms} Rooms`}
              />
            )}
            {!!houseListing.bathrooms && (
              <ListingInfoItem
                className={classes.info}
                Icon={BathtubIcon}
                text={`${houseListing.bathrooms} Baths`}
              />
            )}
          </div>
        </div>
      </div>
      {selected && <div className={classes.selectedBar} />}
    </CardActionArea>
  );
}
