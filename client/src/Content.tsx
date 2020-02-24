import React from "react";
import { BrowserRouter as Router, Switch, Route } from "react-router-dom";
import PendingListings from "./PendingListings";
import Home from "./Home";

export default function Content() {
  return (
    <Router>
      <Switch>
        <Route path="/pending">
          <PendingListings />
        </Route>
        <Route path="/">
          <Home />
        </Route>
      </Switch>
    </Router>
  );
}
