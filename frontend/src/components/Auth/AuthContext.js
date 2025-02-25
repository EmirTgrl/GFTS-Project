import { createContext } from "react";

export const AuthContext = createContext({
  isAuthenticated: false,
  token: null,
  userId: null,
  login: () => {},
  logout: () => {},
});
