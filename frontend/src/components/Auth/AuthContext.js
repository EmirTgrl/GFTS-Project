import { createContext } from 'react';

export const AuthContext = createContext({
  isAuthenticated: false,
  token: null,
  user: null, // { id, email, role, version }
  login: () => {},
  logout: () => {},
  isLoggedOut: false,
});