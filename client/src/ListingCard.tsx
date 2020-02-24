import React from "react";
import { HouseListing } from "./types";
import {
  Card,
  makeStyles,
  CardMedia,
  CardContent,
  Typography,
  CardActionArea
} from "@material-ui/core";
import BathtubIcon from "@material-ui/icons/Bathtub";
import MeetingRoomIcon from "@material-ui/icons/MeetingRoom";
import clsx from "clsx";
import ListingInfoItem from "./ListingInfoItem";

interface Props {
  houseListing: HouseListing;
  className?: string;
}

const useStyles = makeStyles(theme => {
  return {
    root: {
      display: "flex"
    },
    cover: {
      width: 150
    },
    title: {
      marginBottom: theme.spacing(1)
    },
    info: {
      marginRight: theme.spacing(2)
    }
  };
});

export default function ListingCard({ houseListing, className }: Props) {
  const classes = useStyles();
  return (
    <Card className={clsx(classes.root, className)}>
      {houseListing.photos.length > 0 && (
        <CardMedia
          className={classes.cover}
          image={houseListing.photos[0]}
          title="Live from space album cover"
        />
      )}
      <CardActionArea>
        <CardContent>
          <Typography variant="h5" component="h5" className={classes.title}>
            {houseListing.title}
          </Typography>
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
        </CardContent>
      </CardActionArea>
    </Card>
  );
}
