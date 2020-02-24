import React from "react";
import { Typography, makeStyles, SvgIconProps } from "@material-ui/core";
import clsx from "clsx";

interface Props {
  Icon: (props: SvgIconProps) => JSX.Element;
  text: string;
  className?: string;
}

const useStyles = makeStyles(theme => {
  return {
    root: {
      display: "inline-flex",
      alignItems: "center"
    },
    icon: {
      marginRight: theme.spacing(1)
    }
  };
});

export default function ListingInfoItem({ Icon, text, className }: Props) {
  const classes = useStyles();
  return (
    <Typography
      className={clsx(classes.root, className)}
      variant="caption"
      color="textSecondary">
      <Icon fontSize="small" className={classes.icon} /> {text}
    </Typography>
  );
}
