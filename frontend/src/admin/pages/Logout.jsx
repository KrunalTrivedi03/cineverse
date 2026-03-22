import { useContext, useEffect } from "react";
import { AdminAuthContext } from "../../context/AdminAuthContext";

export default function Logout() {
  const { logout } = useContext(AdminAuthContext);

  useEffect(() => {
    logout();
    window.location.href = "/admin/login";
  }, []);

  return null;
}



