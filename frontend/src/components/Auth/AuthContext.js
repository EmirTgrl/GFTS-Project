import { createContext } from "react";

export const AuthContext = createContext({
  isAuthenticated: false,
  token: null,
  userId: null, // userId ekledik
  login: () => {},
  logout: () => {},
});
