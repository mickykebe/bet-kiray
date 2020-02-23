import React from "react";
import { makeStyles } from "@material-ui/core";
import TelegramLoginButton from "./TelegramLoginButton";
import { api } from "./api";

const useStyles = makeStyles({
  root: {
    height: "100vh",
    display: "grid",
    alignItems: "center",
    justifyItems: "center"
  }
});

interface User {
  id: number;
  telegram_id: number;
  telegram_user_name?: string;
  first_name?: string;
  last_name?: string;
  role: string;
}

interface LoginResponse {
  user: User;
  token: string;
}

export default function Home() {
  const classes = useStyles();
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
