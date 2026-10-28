"use client";

import { useId, useState, type ComponentProps } from "react";

type PasswordFieldProps = Omit<ComponentProps<"input">, "type" | "children"> & {
  label: string;
};

export function PasswordField({ label, id, ...props }: PasswordFieldProps) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const [visible, setVisible] = useState(false);
  const toggleLabel = `${visible ? "Hide" : "Show"} ${label.toLowerCase()}`;

  return (
    <div className="passwordField">
      <label htmlFor={inputId}>{label}</label>
      <div className="passwordInput">
        <input {...props} id={inputId} type={visible ? "text" : "password"} />
        <button
          type="button"
          className="passwordToggle"
          aria-label={toggleLabel}
          aria-controls={inputId}
          aria-pressed={visible}
          title={toggleLabel}
          onClick={() => setVisible((current) => !current)}
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
            <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" />
            <circle cx="12" cy="12" r="3" />
            {visible ? <path d="m3 3 18 18" /> : null}
          </svg>
        </button>
      </div>
    </div>
  );
}
