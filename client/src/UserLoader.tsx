import React, { useEffect, useReducer } from "react";
import { api } from "./api";
import { User } from "./types";
import { Backdrop, CircularProgress } from "@material-ui/core";
import { makeStyles } from "@material-ui/core/styles";
import { setAuthToken } from "./api";

interface Props {
  onUserFetch: (user: User) => void;
  children: () => React.ReactElement;
}

type ReducerState = "loading" | "finished";
interface ReducerAction {
  type: "LOADING_USER" | "LOADING_FINISHED";
}

function reducer(state: ReducerState, action: ReducerAction): ReducerState {
  switch (action.type) {
    case "LOADING_USER": {
      return "loading";
    }
    case "LOADING_FINISHED": {
      return "finished";
    }
    default:
      throw new Error("Unrecognized action type");
  }
}

const useStyles = makeStyles(theme => {
  return {
    backdrop: {
      zIndex: theme.zIndex.drawer + 1,
      color: "#fff"
    }
  };
});

export default function UserLoader({
  onUserFetch,
  children
}: Props): React.ReactElement {
  console.log("userloader rendering");
  const classes = useStyles();
  const [status, dispatch] = useReducer(reducer, "loading");
  useEffect(() => {
    const userToken = localStorage.getItem("token");
    if (userToken) {
      setAuthToken(userToken);
      dispatch({ type: "LOADING_USER" });
      api("/api/get-user", {
        method: "GET",
        headers: {
          "Content-Type": "application/json"
        }
      })
        .then(({ user }: { user: User }) => {
          console.log({ user });
          onUserFetch(user);
          dispatch({ type: "LOADING_FINISHED" });
        })
        .catch(() => {
          dispatch({ type: "LOADING_FINISHED" });
        });
    } else {
      dispatch({ type: "LOADING_FINISHED" });
    }
  }, [onUserFetch]);

  if (status === "loading") {
    return (
      <Backdrop className={classes.backdrop} open>
        <CircularProgress color="inherit" />
      </Backdrop>
    );
  }

  return children();
}
