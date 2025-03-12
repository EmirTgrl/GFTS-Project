import { createContext } from "react";

export const AuthContext = createContext({
  isAuthenticated: false,
  token: null,
  userId: null,
  username: null, // Bu artık email olacak
  login: () => {},
  logout: () => {},
  isLoggedOut: false,
});
