"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";
import { useAuth } from "@/hooks/useAuth";
import * as authService from "@/services/auth.service";
import styles from "../auth.module.css";

interface FormErrors {
  email?: string;
  password?: string;
}

function validate(email: string, password: string): FormErrors {
  const errors: FormErrors = {};
  if (!email.trim()) {
    errors.email = "Verifique seu email";
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    errors.email = "Email inválido";
  }
  if (!password) {
    errors.password = "Verifique sua senha";
  }
  return errors;
}

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<FormErrors>({});
  const [apiError, setApiError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const [showForgot, setShowForgot] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotError, setForgotError] = useState("");
  const [forgotSubmitting, setForgotSubmitting] = useState(false);
  const [showForgotSuccess, setShowForgotSuccess] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setApiError("");

    const validationErrors = validate(email, password);
    setErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) return;

    setSubmitting(true);
    try {
      await login(email, password);
      router.push("/");
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message || "Erro ao fazer login. Tente novamente.";
      setApiError(message);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleForgotSubmit(e: FormEvent) {
    e.preventDefault();
    setForgotError("");

    if (!forgotEmail.trim()) {
      setForgotError("Email é obrigatório");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(forgotEmail)) {
      setForgotError("Email inválido");
      return;
    }

    setForgotSubmitting(true);
    try {
      await authService.forgotPassword(forgotEmail.trim());
      setShowForgot(false);
      setShowForgotSuccess(true);
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message || "Erro ao enviar email. Tente novamente.";
      setForgotError(message);
    } finally {
      setForgotSubmitting(false);
    }
  }

  function handleOpenForgot() {
    setForgotEmail("");
    setForgotError("");
    setShowForgot(true);
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

        <h1 className={styles.title}>Acesse sua conta</h1>

        <form className={styles.form} onSubmit={handleSubmit} noValidate>
          <Input
            label="Email"
            name="email"
            type="email"
            required
            placeholder="exemplo@ufba.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            error={errors.email}
          />

          <div>
            <Input
              label="Senha"
              name="password"
              type="password"
              required
              placeholder="digite sua senha"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              error={errors.password}
            />
            <button
              type="button"
              className={styles.forgotLink}
              onClick={handleOpenForgot}
            >
              Esqueceu sua senha
            </button>
          </div>

          {apiError && <p className={styles.apiError}>{apiError}</p>}

          <div className={styles.actions}>
            <Button type="submit" variant="filled" color="primary" disabled={submitting}>
              {submitting ? "Entrando..." : "Entrar"}
            </Button>
          </div>
        </form>

        <hr className={styles.separator} />

        <p className={styles.registerText}>
          Ainda não tem conta?{" "}
          <Link href="/register" className={styles.link}>
            Cadastre-se
          </Link>
        </p>
      </div>

      <Modal isOpen={showForgot} onClose={() => setShowForgot(false)} title="Esqueci minha Senha">
        <p className={styles.forgotDescription}>
          Por favor, informe o e-mail cadastrado em sua conta, e enviaremos
          um link com as instruções para recuperação.
        </p>
        <form onSubmit={handleForgotSubmit} noValidate>
          <Input
            label="Email"
            name="forgotEmail"
            type="email"
            required
            placeholder="exemplo@ufba.com"
            value={forgotEmail}
            onChange={(e) => setForgotEmail(e.target.value)}
            error={forgotError}
          />
          <div className={styles.actions} style={{ marginTop: "1.5rem" }}>
            <Button type="submit" variant="filled" color="primary" disabled={forgotSubmitting}>
              {forgotSubmitting ? "Enviando..." : "Enviar"}
            </Button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={showForgotSuccess} onClose={() => setShowForgotSuccess(false)} title="Email enviado!" variant="success">
        <p>Verifique sua caixa de entrada para redefinir sua senha.</p>
        <div style={{ textAlign: "center", marginTop: "1rem" }}>
          <Button variant="filled" color="primary" onClick={() => setShowForgotSuccess(false)}>
            Ok
          </Button>
        </div>
      </Modal>
    </div>
  );
}
