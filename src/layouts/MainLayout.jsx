import { Outlet } from "react-router-dom";
import Navbar from "../components/navbar/Navbar";
import { useAuth } from "../context/AuthContext";

function MainLayout() {
  const { loading } = useAuth();

  if (loading) {
    return null; // or a spinner later
  }

  return (
    <>
      <Navbar />
      <Outlet />
    </>
  );
}

export default MainLayout;