import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import { MapPin, Phone, Mail, Send, CircleCheck, Clock } from "lucide-react";
import "leaflet/dist/leaflet.css";
import "../../styles/map-theme.css";
import "./ContactPage.css";

// Social icons are drawn here instead of imported from lucide-react: newer
// lucide versions removed all brand logos, which would crash this page.
const iconProps = {
  width: 18,
  height: 18,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2,
  strokeLinecap: "round",
  strokeLinejoin: "round",
};
const FacebookIcon = () => (
  <svg {...iconProps}><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" /></svg>
);
const TwitterIcon = () => (
  <svg {...iconProps}><path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z" /></svg>
);
const InstagramIcon = () => (
  <svg {...iconProps}><rect width="20" height="20" x="2" y="2" rx="5" ry="5" /><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" /><line x1="17.5" x2="17.51" y1="6.5" y2="6.5" /></svg>
);
const LinkedinIcon = () => (
  <svg {...iconProps}><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" /><rect width="4" height="12" x="2" y="9" /><circle cx="4" cy="4" r="2" /></svg>
);

const OFFICE = { lat: 6.6823835, lng: 3.300265, label: "Fandahom HQ, Lagos" };

const officeIcon = L.divIcon({
  className: "re-contact-pin",
  html: '<div class="re-contact-pin__inner"></div>',
  iconSize: [34, 34],
  iconAnchor: [17, 34],
  popupAnchor: [0, -32],
});

const initialForm = { name: "", email: "", subject: "", message: "" };

export default function ContactPage() {
  // "Make Enquiry" on a property page sends the subject and message here.
  const prefill = useLocation().state;
  const [form, setForm] = useState({
    ...initialForm,
    subject: prefill?.subject || "",
    message: prefill?.message || "",
  });

  // Arriving from a long page (e.g. a property), start at the top.
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);
  const [errors, setErrors] = useState({});
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = "Please enter your name";
    if (!form.email.trim()) e.email = "Please enter your email";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
      e.email = "Enter a valid email address";
    if (!form.subject.trim()) e.subject = "Please add a subject";
    if (!form.message.trim()) e.message = "Please write a message";
    return e;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
    if (errors[name]) setErrors((er) => ({ ...er, [name]: undefined }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const v = validate();
    setErrors(v);
    if (Object.keys(v).length > 0) return;
    setSending(true);
    // Simulated: the API doc has no contact/enquiry endpoint, so nothing is
    // actually sent yet. Replace this with a real call once one exists.
    setTimeout(() => {
      setSending(false);
      setSent(true);
      setForm(initialForm);
    }, 700);
  };

  const resetSent = () => setSent(false);

  return (
    <div className="re-page re-contact">
      <div className="re-contact__inner">
        {/* Heading */}
        <header className="re-contact__head">
          <span className="re-contact__eyebrow">Get in touch</span>
          <h1>Lets find your next home</h1>
          <p>
            Have a question about a listing or want to schedule a viewing? Our
            team is ready to help.
          </p>
        </header>

        <div className="re-contact__grid">
          {/* Info column */}
          <div className="re-contact__info">
            <div className="re-contact__info-cards">
              <div className="re-contact__info-card">
                <div className="re-contact__info-icon re-contact__info-icon--primary">
                  <MapPin size={20} />
                </div>
                <div>
                  <h3>Office Address</h3>
                  <p>106 Agbado Road, Jankara Ijaye ojokoro Lagos, Nigeria</p>
                </div>
              </div>
              <div className="re-contact__info-card">
                <div className="re-contact__info-icon re-contact__info-icon--accent">
                  <Phone size={20} />
                </div>
                <div>
                  <h3>Phone Number</h3>
                  <p>
                    <a href="tel:+2348145446512">+234 (814) 544-6512</a>
                  </p>
                </div>
              </div>
              <div className="re-contact__info-card">
                <div className="re-contact__info-icon re-contact__info-icon--success">
                  <Mail size={20} />
                </div>
                <div>
                  <h3>Email Address</h3>
                  <p>
                    <a href="mailto:hello@fandahom.com">hello@fandahom.com</a>
                  </p>
                </div>
              </div>
              <div className="re-contact__info-card">
                <div className="re-contact__info-icon re-contact__info-icon--dark">
                  <Clock size={20} />
                </div>
                <div>
                  <h3>Working Hours</h3>
                  <p>Mon – Sat · 9:00 AM – 7:00 PM</p>
                </div>
              </div>
            </div>

            {/* Map */}
            <div className="re-contact__map">
              <MapContainer
                center={[OFFICE.lat, OFFICE.lng]}
                zoom={14}
                scrollWheelZoom={false}
                className="re-leaflet"
              >
              <TileLayer
                 attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                 url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
               />
                <Marker position={[OFFICE.lat, OFFICE.lng]} icon={officeIcon}>
                  <Popup>{OFFICE.label}</Popup>
                </Marker>
              </MapContainer>
            </div>

            {/* Socials */}
            <div className="re-contact__socials">
              <a href="#" aria-label="Facebook"><FacebookIcon /></a>
              <a href="#" aria-label="Twitter"><TwitterIcon /></a>
              <a href="#" aria-label="Instagram"><InstagramIcon /></a>
              <a href="#" aria-label="LinkedIn"><LinkedinIcon /></a>
            </div>
          </div>

          {/* Form column */}
          <div className="re-contact__formwrap">
            {sent ? (
              <div className="re-contact__success">
                <CircleCheck size={56} />
                <h2>Message sent!</h2>
                <p>
                  Thanks for reaching out. One of our agents will get back to you
                  within 24 hours.
                </p>
                <button className="re-btn re-btn--primary" type="button" onClick={resetSent}>
                  Send another message
                </button>
              </div>
            ) : (
              <form className="re-contact__form" onSubmit={handleSubmit} noValidate>
                <h2>Send us a message</h2>

                <div className="re-field">
                  <label htmlFor="c-name">Full Name</label>
                  <input
                    id="c-name"
                    name="name"
                    type="text"
                    placeholder="Tunde Bello"
                    value={form.name}
                    onChange={handleChange}
                    aria-invalid={!!errors.name}
                  />
                  {errors.name && <span className="re-field__error">{errors.name}</span>}
                </div>

                <div className="re-field">
                  <label htmlFor="c-email">Email Address</label>
                  <input
                    id="c-email"
                    name="email"
                    type="email"
                    placeholder="tunde@example.com"
                    value={form.email}
                    onChange={handleChange}
                    aria-invalid={!!errors.email}
                  />
                  {errors.email && <span className="re-field__error">{errors.email}</span>}
                </div>

                <div className="re-field">
                  <label htmlFor="c-subject">Subject</label>
                  <input
                    id="c-subject"
                    name="subject"
                    type="text"
                    placeholder="I'd like to schedule a viewing"
                    value={form.subject}
                    onChange={handleChange}
                    aria-invalid={!!errors.subject}
                  />
                  {errors.subject && <span className="re-field__error">{errors.subject}</span>}
                </div>

                <div className="re-field">
                  <label htmlFor="c-message">Message</label>
                  <textarea
                    id="c-message"
                    name="message"
                    rows={5}
                    placeholder="Tell us a bit about what you're looking for…"
                    value={form.message}
                    onChange={handleChange}
                    aria-invalid={!!errors.message}
                  />
                  {errors.message && <span className="re-field__error">{errors.message}</span>}
                </div>

                <button
                  className="re-btn re-btn--primary re-contact__submit"
                  type="submit"
                  disabled={sending}
                >
                  {sending ? (
                    "Sending…"
                  ) : (
                    <>
                      <Send size={16} /> Send Message
                    </>
                  )}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
