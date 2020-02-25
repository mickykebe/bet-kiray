import React from "react";
import { BrowserRouter as Router, Switch, Route } from "react-router-dom";
import PendingListings from "./PendingListings";
import Home from "./Home";
import { makeStyles } from "@material-ui/core";
import { User } from "./types";

const useStyles = makeStyles(theme => ({
  root: {
    background: theme.palette.background.default,
    height: "100vh"
  }
}));

interface Props {
  onLogin: (user: User) => void;
}

export default function Content({ onLogin }: Props) {
  const classes = useStyles();
  return (
    <div className={classes.root}>
      <Router>
        <Switch>
          <Route path="/pending">
            <PendingListings />
          </Route>
          <Route path="/">
            <Home onLogin={onLogin} />
          </Route>
        </Switch>
      </Router>
    </div>
  );
}
