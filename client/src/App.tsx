import React, { Fragment, useState } from "react";
import { ThemeProvider, createMuiTheme } from "@material-ui/core/styles";
import CssBaseline from "@material-ui/core/CssBaseline";
import { UserContext } from "./user-context";
import UserLoader from "./UserLoader";
import { User } from "./types";
import Content from "./Content";

const theme = createMuiTheme();

function App() {
  const [loggedInUser, setLoggedInUser] = useState<User | null>(null);
  console.log("rendering app");
  return (
    <Fragment>
      <CssBaseline />
      <ThemeProvider theme={theme}>
        <UserContext.Provider value={loggedInUser}>
          <UserLoader
            onUserFetch={(user: User) => {
              if (!loggedInUser) {
                setLoggedInUser(user);
              }
            }}>
            {() => <Content />}
          </UserLoader>
        </UserContext.Provider>
      </ThemeProvider>
    </Fragment>
  );
}

export default App;
