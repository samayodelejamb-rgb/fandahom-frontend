import { createBrowserRouter } from "react-router-dom";
import MainLayout from "./layouts/MainLayout";
import ListingsPage from "./pages/listings/ListingsPage";
import LoginPage from "./pages/auth/LoginPage";
import RegisterPage from "./pages/auth/RegisterPage";
import ForgotPasswordPage from "./pages/auth/ForgotPasswordPage";
import ProfilePage from "./pages/profile/ProfilePage";
import WishlistPage from "./pages/wishlist/WishlistPage";
import PropertyDetailPage from "./pages/property-detail/PropertyDetailPage";
import CreateListingPage from "./pages/create-listing/CreateListingPage";
import EditListingPage from "./pages/edit-listing/EditListingPage";
import MyListingsPage from "./pages/my-listings/MyListingsPage";
import ListingMediaPage from "./pages/listing-media/ListingMediaPage";
import ProtectedRoute from "./components/common/ProtectedRoute";
import NotFoundPage from "./pages/NotFoundPage";

const router = createBrowserRouter([
  // Auth pages — no navbar, standalone
  { path: "/login", element: <LoginPage /> },
  { path: "/register", element: <RegisterPage /> },
  { path: "/forgot-password", element: <ForgotPasswordPage /> },

  // Everything else — wrapped in MainLayout (navbar included)
  {
    element: <MainLayout />,
    children: [
      { path: "/", element: <ListingsPage /> },
      { path: "/property/:id", element: <PropertyDetailPage /> },
      {
        path: "/profile",
        element: (
          <ProtectedRoute>
            <ProfilePage />
          </ProtectedRoute>
        ),
      },
      {
        path: "/wishlist",
        element: (
          <ProtectedRoute>
            <WishlistPage />
          </ProtectedRoute>
        ),
      },
      {
        path: "/create-listing",
        element: (
          <ProtectedRoute>
            <CreateListingPage />
          </ProtectedRoute>
        ),
      },
      {
        path: "/edit-listing/:id",
        element: (
          <ProtectedRoute>
            <EditListingPage />
          </ProtectedRoute>
        ),
      },
      {
        path: "/listing-media/:id",
        element: (
          <ProtectedRoute>
            <ListingMediaPage />
          </ProtectedRoute>
        ),
      },
      {
        path: "/my-listings",
        element: (
          <ProtectedRoute>
            <MyListingsPage />
          </ProtectedRoute>
        ),
      },
      { path: "*", element: <NotFoundPage /> },
    ],
  },
]);

export default router;
