import React, { useContext } from "react";
import { makeStyles } from "@material-ui/core";
import TelegramLoginButton from "./TelegramLoginButton";
import { api } from "./api";
import { User } from "./types";
import { UserContext } from "./user-context";
import { Redirect } from "react-router-dom";

const useStyles = makeStyles({
  root: {
    height: "100vh",
    display: "grid",
    alignItems: "center",
    justifyItems: "center"
  }
});

interface LoginResponse {
  user: User;
  token: string;
}

export default function Home() {
  const user = useContext(UserContext);
  const classes = useStyles();
  if (user) {
    return <Redirect to="/pending" />;
  }
  if (!process.env.REACT_APP_TELEGRAM_BOT_NAME) {
    throw new Error("REACT_APP_TELEGRAM_BOT_NAME env var not defined");
  }
  const handleLogin = async (user: any) => {
    const data: LoginResponse = await api("/api/telegram-login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(user)
    });
    localStorage.setItem("token", data.token);
  };

  return (
    <div className={classes.root}>
      <TelegramLoginButton
        botName={process.env.REACT_APP_TELEGRAM_BOT_NAME}
        dataOnauth={handleLogin}
      />
    </div>
  );
}
