"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import { useAuth } from "@/hooks/useAuth";
import styles from "../auth.module.css";

interface FormErrors {
  email?: string;
  password?: string;
}

function validate(email: string, password: string): FormErrors {
  const errors: FormErrors = {};
  if (!email.trim()) {
    errors.email = "Email é obrigatório";
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    errors.email = "Email inválido";
  }
  if (!password) {
    errors.password = "Senha é obrigatória";
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
            <Link href="/reset-password" className={styles.forgotLink}>
              Esqueceu sua senha
            </Link>
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
    </div>
  );
}
