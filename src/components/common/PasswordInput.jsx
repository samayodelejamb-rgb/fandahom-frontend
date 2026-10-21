import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import "./PasswordInput.css";

/**
 * A password field with a show/hide (eye) button.
 * Use it exactly like an <input>: value, onChange, required, placeholder,
 * autoComplete... are passed straight through. The "type" is handled here.
 */
function PasswordInput({ className = "split-auth__input", ...inputProps }) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="password-input">
      <input {...inputProps} type={visible ? "text" : "password"} className={className} />
      <button
        type="button"
        className="password-input__toggle"
        onClick={() => setVisible((v) => !v)}
        // keeps the cursor in the field when the eye is clicked
        onMouseDown={(e) => e.preventDefault()}
        aria-label={visible ? "Hide password" : "Show password"}
        aria-pressed={visible}
      >
        {visible ? <EyeOff size={18} strokeWidth={1.75} /> : <Eye size={18} strokeWidth={1.75} />}
      </button>
    </div>
  );
}

export default PasswordInput;
