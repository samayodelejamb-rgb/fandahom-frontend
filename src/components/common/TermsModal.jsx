import { X } from "lucide-react";
import "./TermsModal.css";

function TermsModal({ onClose }) {
  return (
    <div className="terms-modal__overlay" onClick={onClose}>
      <div className="terms-modal__box" onClick={(e) => e.stopPropagation()}>
        <div className="terms-modal__header">
          <h2>Terms & Conditions</h2>
          <button className="terms-modal__close" onClick={onClose} aria-label="Close">
            <X size={20} />
          </button>
        </div>

        <div className="terms-modal__content">
          <p>
            Welcome to Fandahom. By creating an account, you agree to be bound by
            the following terms and conditions. Please read them carefully before
            proceeding.
          </p>
          <h4>1. Use of Platform</h4>
          <p>
            Fandahom provides a platform for browsing, listing, and enquiring
            about real estate properties. You agree to use this platform only
            for lawful purposes.
          </p>
          <h4>2. Account Responsibility</h4>
          <p>
            You are responsible for maintaining the confidentiality of your
            account credentials and for all activities that occur under your
            account.
          </p>
          <h4>3. Property Listings</h4>
          <p>
            Fandahom does not guarantee the accuracy of property listings
            provided by agents or third parties. Users are advised to conduct
            their own due diligence before entering into any transaction.
          </p>
          <h4>4. Privacy</h4>
          <p>
            We collect and use your personal information in accordance with our
            Privacy Policy. By using Fandahom, you consent to such collection
            and use.
          </p>
          <h4>5. Changes to Terms</h4>
          <p>
            Fandahom reserves the right to update these terms at any time.
            Continued use of the platform after changes constitutes acceptance
            of the new terms.
          </p>
          <p style={{ color: "var(--color-text-muted)", fontSize: "0.8rem" }}>
            (Placeholder text — replace with actual legal terms before launch.)
          </p>
        </div>

        <div className="terms-modal__footer">
          <button className="terms-modal__close-btn" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

export default TermsModal;