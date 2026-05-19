"use client";

import styles from "./Input.module.css";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export default function Input({
  label,
  error,
  required,
  id,
  className = "",
  ...rest
}: InputProps) {
  const inputId = id || rest.name;

  return (
    <div className={styles.group}>
      {label && (
        <label htmlFor={inputId} className={styles.label}>
          {label}
          {required && <span className={styles.asterisk}> *</span>}
        </label>
      )}
      <input
        id={inputId}
        className={`${styles.input} ${error ? styles["input--error"] : ""} ${className}`}
        required={required}
        aria-invalid={!!error}
        aria-describedby={error ? `${inputId}-error` : undefined}
        {...rest}
      />
      {error && (
        <span id={`${inputId}-error`} className={styles.error} role="alert">
          {error}
        </span>
      )}
    </div>
  );
}
