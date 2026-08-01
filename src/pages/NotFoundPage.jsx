import { Link } from "react-router-dom";

function NotFoundPage() {
  return (
    <div style={{ maxWidth: "500px", margin: "4rem auto", textAlign: "center", padding: "1rem" }}>
      <h1 style={{ fontSize: "3rem", margin: "0 0 0.5rem 0" }}>404</h1>
      <p style={{ color: "#666", marginBottom: "1.5rem" }}>
        Sorry, the page you're looking for doesn't exist.
      </p>
      <Link
        to="/"
        style={{
          display: "inline-block",
          padding: "0.6rem 1.2rem",
          background: "#2563eb",
          color: "white",
          borderRadius: "6px",
          textDecoration: "none",
          fontWeight: "600",
        }}
      >
        Back to Listings
      </Link>
    </div>
  );
}

export default NotFoundPage;