import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Camera, Mail, Heart, Home, FileText, Shield, LogOut, ChevronRight, Pencil } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import TermsModal from "../../components/common/TermsModal";
import "./ProfilePage.css";

function getInitials(firstName = "", lastName = "") {
  const first = firstName.trim()[0] || "";
  const last = lastName.trim()[0] || "";
  return (first + last).toUpperCase();
}

function ProfilePage() {
  const { user, wishlist, logout, updateProfile } = useAuth();
  const navigate = useNavigate();

  const [avatarPreview, setAvatarPreview] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [showTerms, setShowTerms] = useState(false);
  const [formData, setFormData] = useState({
    firstName: user?.first_name || "",
    lastName: user?.last_name || "",
    email: user?.email || "",
  });

  if (!user) {
    return <p style={{ padding: "2rem" }}>You need to log in to view this page.</p>;
  }

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) setAvatarPreview(URL.createObjectURL(file));
  };

  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

  const handleSaveEdit = (e) => {
    e.preventDefault();
    // NOTE: no backend endpoint exists yet for saving profile edits —
    // this only updates local state for now. See AuthContext.updateProfile.
    updateProfile({
      first_name: formData.firstName,
      last_name: formData.lastName,
      email: formData.email,
    });
    setIsEditing(false);
  };

  const fullName = `${user.first_name} ${user.last_name}`.trim();

  return (
    <div className="profile-page-bg">
      <div className="profile-page">
        <h1 className="profile-page__page-title">My Profile</h1>

        <div className="profile-page__card">
        <div className="profile-page__avatar-row">
          <div className="profile-page__avatar-wrapper">
            <div className="profile-page__avatar-initials">
              {avatarPreview ? (
                <img src={avatarPreview} alt="Profile" />
              ) : (
                getInitials(user.first_name, user.last_name)
              )}
            </div>
            <label className="profile-page__avatar-badge">
              <Camera size={16} />
              <input type="file" accept="image/*" onChange={handleAvatarChange} style={{ display: "none" }} />
            </label>
          </div>

          {!isEditing && (
            <div className="profile-page__name-block">
              <p className="profile-page__name">{fullName}</p>
              <p className="profile-page__email-inline">{user.email}</p>
            </div>
          )}

          {!isEditing && (
            <button
              className="profile-page__edit-btn"
              onClick={() => {
                setFormData({
                  firstName: user.first_name,
                  lastName: user.last_name,
                  email: user.email,
                });
                setIsEditing(true);
              }}
            >
              <Pencil size={14} /> Edit
            </button>
          )}
        </div>

        {isEditing && (
          <form onSubmit={handleSaveEdit} className="profile-page__form">
            <div className="profile-page__form-row">
              <input
                type="text"
                value={formData.firstName}
                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                placeholder="First name"
                className="profile-page__input"
              />
              <input
                type="text"
                value={formData.lastName}
                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                placeholder="Last name"
                className="profile-page__input"
              />
            </div>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="Email"
              className="profile-page__input"
            />
            <div className="profile-page__form-actions">
              <button type="submit" className="profile-page__save-btn">Save Changes</button>
              <button type="button" onClick={() => setIsEditing(false)} className="profile-page__cancel-btn">
                Cancel
              </button>
            </div>
          </form>
        )}
      </div>

      <div className="profile-page__list">
        <Link to="/my-listings" className="profile-page__row">
          <span className="profile-page__row-icon profile-page__row-icon--listings">
            <Home size={18} />
          </span>
          <div className="profile-page__row-text">
            <p className="profile-page__row-title">My Listings</p>
            <p className="profile-page__row-subtitle">Manage properties you've listed</p>
          </div>
          <ChevronRight size={18} className="profile-page__row-chevron" />
        </Link>

        <Link to="/wishlist" className="profile-page__row">
          <span className="profile-page__row-icon profile-page__row-icon--wishlist">
            <Heart size={18} />
          </span>
          <div className="profile-page__row-text">
            <p className="profile-page__row-title">Wishlist</p>
            <p className="profile-page__row-subtitle">View and manage your saved properties</p>
          </div>
          {wishlist?.length > 0 && (
            <span className="profile-page__row-count">{wishlist.length} saved</span>
          )}
          <ChevronRight size={18} className="profile-page__row-chevron" />
        </Link>

        <button className="profile-page__row" onClick={() => setShowTerms(true)}>
          <span className="profile-page__row-icon profile-page__row-icon--terms">
            <FileText size={18} />
          </span>
          <div className="profile-page__row-text">
            <p className="profile-page__row-title">Terms & Conditions</p>
            <p className="profile-page__row-subtitle">Read our terms and conditions</p>
          </div>
          <ChevronRight size={18} className="profile-page__row-chevron" />
        </button>

        <a href="#" className="profile-page__row">
          <span className="profile-page__row-icon profile-page__row-icon--privacy">
            <Shield size={18} />
          </span>
          <div className="profile-page__row-text">
            <p className="profile-page__row-title">Privacy Policy</p>
            <p className="profile-page__row-subtitle">Learn how we protect your data</p>
          </div>
          <ChevronRight size={18} className="profile-page__row-chevron" />
        </a>
      </div>

      <div className="profile-page__list profile-page__list--danger">
        <button className="profile-page__row profile-page__row--danger" onClick={handleLogout}>
          <span className="profile-page__row-icon profile-page__row-icon--signout">
            <LogOut size={18} />
          </span>
          <div className="profile-page__row-text">
            <p className="profile-page__row-title">Sign Out</p>
            <p className="profile-page__row-subtitle">Sign out of your account</p>
          </div>
          <ChevronRight size={18} className="profile-page__row-chevron" />
        </button>
        </div>

        {showTerms && <TermsModal onClose={() => setShowTerms(false)} />}
      </div>
    </div>
  );
}

export default ProfilePage;
