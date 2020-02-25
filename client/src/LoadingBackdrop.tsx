import React from "react";
import Backdrop from "@material-ui/core/Backdrop";
import { makeStyles, CircularProgress } from "@material-ui/core";

const useStyles = makeStyles(theme => ({
  root: {
    zIndex: theme.zIndex.drawer + 1,
    color: "#fff"
  }
}));

export default function LoadingBackdrop() {
  const classes = useStyles();
  return (
    <Backdrop className={classes.root} open>
      <CircularProgress color="inherit" />
    </Backdrop>
  );
}
