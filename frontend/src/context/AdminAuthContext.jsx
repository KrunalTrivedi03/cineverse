import { createContext, useState } from "react";

export const AdminAuthContext = createContext();

export const AdminAuthProvider = ({ children }) => {
  const [admin, setAdmin] = useState(
    JSON.parse(localStorage.getItem("adminInfo")) || null
  );

  const login = (data) => {
    localStorage.setItem("adminInfo", JSON.stringify(data));
    setAdmin(data);
  };

  const logout = () => {
    localStorage.removeItem("adminInfo");
    setAdmin(null);
  };

  return (
    <AdminAuthContext.Provider value={{ admin, login, logout }}>
      {children}
    </AdminAuthContext.Provider>
  );
};

