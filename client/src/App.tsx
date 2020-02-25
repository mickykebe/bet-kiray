import React, { Fragment, useState } from "react";
import { ThemeProvider, createMuiTheme } from "@material-ui/core/styles";
import CssBaseline from "@material-ui/core/CssBaseline";
import { UserContext } from "./user-context";
import UserLoader from "./UserLoader";
import { User } from "./types";
import Content from "./Content";

const theme = createMuiTheme({
  palette: {
    background: {
      default: "#F6F7F9"
    }
  }
});

function App() {
  const [loggedInUser, setLoggedInUser] = useState<User | null>(null);
  const setUser = (user: User) => {
    if (!loggedInUser) {
      setLoggedInUser(user);
    }
  };
  return (
    <Fragment>
      <CssBaseline />
      <ThemeProvider theme={theme}>
        <UserContext.Provider value={loggedInUser}>
          <UserLoader onUserFetch={setUser}>
            {() => <Content onLogin={setUser} />}
          </UserLoader>
        </UserContext.Provider>
      </ThemeProvider>
    </Fragment>
  );
}

export default App;
