import { Outlet } from "react-router-dom";
import Navbar from "../components/navbar/Navbar";
import { useAuth } from "../context/AuthContext";

function MainLayout() {
  const { loading } = useAuth();

  // While the app checks with the server whether you're logged in, show a
  // message instead of a blank page.
  if (loading) {
    return (
      <div
        style={{
          minHeight: "60vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "var(--color-text-secondary)",
          fontSize: "0.95rem",
        }}
      >
        Connecting to the server&hellip;
      </div>
    );
  }

  return (
    <>
      <Navbar />
      <Outlet />
    </>
  );
}

export default MainLayout;