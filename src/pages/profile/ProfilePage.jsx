import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Camera, Mail, Heart, FileText, Shield, LogOut, ChevronRight, Pencil } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import TermsModal from "../../components/common/TermsModal";
import "./ProfilePage.css";

function getInitials(name = "") {
  return name
    .trim()
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join("");
}

function ProfilePage() {
  const { user, logout, updateProfile } = useAuth();
  const navigate = useNavigate();

  const [avatarPreview, setAvatarPreview] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [showTerms, setShowTerms] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.name || "",
    companyName: user?.companyName || "",
    email: user?.email || "",
  });

  if (!user) {
    return <p style={{ padding: "2rem" }}>You need to log in to view this page.</p>;
  }

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) setAvatarPreview(URL.createObjectURL(file));
  };

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const handleSaveEdit = (e) => {
    e.preventDefault();
    updateProfile(formData);
    setIsEditing(false);
  };

  return (
    <div className="profile-page">
      {/* Top card: name, avatar, email */}
      <div className="profile-page__card">
        <div className="profile-page__header">
          <div>
            <h2 className="profile-page__title">My Profile</h2>
            <div className="profile-page__title-bar" />
          </div>

          {!isEditing && (
            <button
              className="profile-page__edit-btn"
              onClick={() => {
                setFormData({ name: user.name, companyName: user.companyName, email: user.email });
                setIsEditing(true);
              }}
            >
              <Pencil size={14} /> Edit Profile
            </button>
          )}
        </div>

        <div className="profile-page__avatar-row">
          <div className="profile-page__avatar-wrapper">
            <div className="profile-page__avatar-initials">
              {avatarPreview ? (
                <img src={avatarPreview} alt="Profile" />
              ) : (
                getInitials(user.name)
              )}
            </div>
            <label className="profile-page__avatar-badge">
              <Camera size={14} />
              <input type="file" accept="image/*" onChange={handleAvatarChange} style={{ display: "none" }} />
            </label>
          </div>

          {!isEditing && (
            <div>
              <p className="profile-page__name">{user.name}</p>
              <p className="profile-page__company">{user.companyName}</p>
            </div>
          )}
        </div>

        {isEditing ? (
          <form onSubmit={handleSaveEdit} className="profile-page__form">
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Full name"
              className="profile-page__input"
            />
            <input
              type="text"
              value={formData.companyName}
              onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
              placeholder="Company name"
              className="profile-page__input"
            />
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="Email"
              className="profile-page__input"
            />
            <div className="profile-page__form-actions">
              <button type="submit" className="profile-page__save-btn">Save</button>
              <button type="button" onClick={() => setIsEditing(false)} className="profile-page__cancel-btn">
                Cancel
              </button>
            </div>
          </form>
        ) : (
          <div className="profile-page__email-row">
            <span className="profile-page__email-icon">
              <Mail size={16} />
            </span>
            <div>
              <p className="profile-page__email-label">Email</p>
              <p className="profile-page__email-value">{user.email}</p>
            </div>
          </div>
        )}
      </div>

      {/* Action list */}
      <div className="profile-page__list">
        <Link to="/wishlist" className="profile-page__row">
          <span className="profile-page__row-icon profile-page__row-icon--wishlist">
            <Heart size={18} />
          </span>
          <div className="profile-page__row-text">
            <p className="profile-page__row-title">Wishlist</p>
            <p className="profile-page__row-subtitle">View and manage your saved properties</p>
          </div>
          {user.wishlist?.length > 0 && (
            <span className="profile-page__row-count">{user.wishlist.length} saved</span>
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

      {/* Sign out — its own list for the danger spacing/margin */}
      <div className="profile-page__list" style={{ marginTop: "var(--space-sm)" }}>
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
  );
}

export default ProfilePage;