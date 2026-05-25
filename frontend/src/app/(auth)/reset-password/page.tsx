"use client";

import { useState, FormEvent } from "react";
import { useSearchParams } from "next/navigation";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";
import * as authService from "@/services/auth.service";
import styles from "../auth.module.css";

interface FormErrors {
  password?: string;
  confirmPassword?: string;
}

const PASSWORD_MIN_LENGTH = 8;

function validate(password: string, confirmPassword: string): FormErrors {
  const errors: FormErrors = {};

  if (!password) {
    errors.password = "Senha é obrigatória";
  } else if (password.length < PASSWORD_MIN_LENGTH) {
    errors.password = `Senha deve ter no mínimo ${PASSWORD_MIN_LENGTH} caracteres`;
  } else if (!/[A-Z]/.test(password)) {
    errors.password = "Senha deve conter ao menos 1 letra maiúscula";
  } else if (!/[a-z]/.test(password)) {
    errors.password = "Senha deve conter ao menos 1 letra minúscula";
  } else if ((password.match(/[0-9]/g) || []).length < 4) {
    errors.password = "Senha deve conter ao menos 4 números";
  } else if (!/[^A-Za-z0-9]/.test(password)) {
    errors.password = "Senha deve conter ao menos 1 caracter especial";
  }

  if (!confirmPassword) {
    errors.confirmPassword = "Confirmação de senha é obrigatória";
  } else if (password && confirmPassword !== password) {
    errors.confirmPassword = "As senhas não coincidem";
  }

  return errors;
}

export default function ResetPasswordPage() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token") || "";

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errors, setErrors] = useState<FormErrors>({});
  const [apiError, setApiError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showError, setShowError] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setApiError("");

    const validationErrors = validate(password, confirmPassword);
    setErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) return;

    setSubmitting(true);
    try {
      await authService.resetPassword(token, password);
      setShowSuccess(true);
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message || "Erro ao redefinir senha. Tente novamente.";
      setApiError(message);
      setShowError(true);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <div className={styles.brandHeader}>
          <p className={styles.brandTitle}>
            WEPGCOMP <span className={styles.brandTitleYear}>2024</span>
          </p>
          <hr className={styles.brandLine} />
        </div>

        <h1 className={styles.title}>Alteração de senha</h1>

        <form className={styles.form} onSubmit={handleSubmit} noValidate>
          <Input
            label="Senha"
            name="password"
            type="password"
            required
            placeholder="Insira sua senha"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            error={errors.password}
          />

          <div>
            <p className={styles.passwordRulesTitle}>A senha deve possuir pelo menos:</p>
            <ul className={styles.passwordRules}>
              <li>8 dígitos</li>
              <li>1 letra maiúscula</li>
              <li>1 letra minúscula</li>
              <li>4 números</li>
              <li>1 caracter especial</li>
            </ul>
          </div>

          <Input
            label="Confirmação de senha"
            name="confirmPassword"
            type="password"
            required
            placeholder="Insira sua senha novamente"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            error={errors.confirmPassword}
          />

          <div className={styles.actions}>
            <Button type="submit" variant="filled" color="secondary" disabled={submitting}>
              {submitting ? "Enviando..." : "Enviar"}
            </Button>
          </div>
        </form>
      </div>

      <Modal isOpen={showSuccess} onClose={() => setShowSuccess(false)} title="Senha alterada!" variant="success">
        <p>Sua senha foi alterada com sucesso. Faça login com a nova senha.</p>
        <div style={{ textAlign: "center", marginTop: "1rem" }}>
          <Button
            variant="filled"
            color="primary"
            onClick={() => {
              window.location.href = "/login";
            }}
          >
            Ir para Login
          </Button>
        </div>
      </Modal>

      <Modal isOpen={showError} onClose={() => setShowError(false)} title="Erro" variant="error">
        <p>{apiError}</p>
        <div style={{ textAlign: "center", marginTop: "1rem" }}>
          <Button variant="filled" color="primary" onClick={() => setShowError(false)}>
            Tentar novamente
          </Button>
        </div>
      </Modal>
    </div>
  );
}
