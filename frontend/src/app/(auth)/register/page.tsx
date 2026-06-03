"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";
import { useAuth } from "@/hooks/useAuth";
import type { Profile } from "@/types/user";
import styles from "../auth.module.css";

interface FormErrors {
  name?: string;
  registrationNumber?: string;
  email?: string;
  profile?: string;
  password?: string;
  confirmPassword?: string;
}

const PASSWORD_MIN_LENGTH = 8;

function validateForm(fields: {
  name: string;
  registrationNumber: string;
  email: string;
  profile: Profile | "";
  password: string;
  confirmPassword: string;
}): FormErrors {
  const errors: FormErrors = {};

  if (!fields.name.trim()) {
    errors.name = "Nome é obrigatório";
  }

  if (!fields.profile) {
    errors.profile = "Selecione um perfil";
  }

  if (fields.profile !== "Listener" && !fields.registrationNumber.trim()) {
    errors.registrationNumber = "Matrícula é obrigatória";
  }

  if (!fields.email.trim()) {
    errors.email = "Email é obrigatório";
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(fields.email)) {
    errors.email = "Email inválido";
  }

  if (!fields.password) {
    errors.password = "Senha é obrigatória";
  } else if (fields.password.length < PASSWORD_MIN_LENGTH) {
    errors.password = `Senha deve ter no mínimo ${PASSWORD_MIN_LENGTH} caracteres`;
  } else if (!/[A-Z]/.test(fields.password)) {
    errors.password = "Senha deve conter ao menos 1 letra maiúscula";
  } else if (!/[a-z]/.test(fields.password)) {
    errors.password = "Senha deve conter ao menos 1 letra minúscula";
  } else if ((fields.password.match(/[0-9]/g) || []).length < 4) {
    errors.password = "Senha deve conter ao menos 4 números";
  } else if (!/[^A-Za-z0-9]/.test(fields.password)) {
    errors.password = "Senha deve conter ao menos 1 caracter especial";
  }

  if (!fields.confirmPassword) {
    errors.confirmPassword = "Confirmação de senha é obrigatória";
  } else if (fields.password && fields.confirmPassword !== fields.password) {
    errors.confirmPassword = "As senhas não coincidem";
  }

  return errors;
}

export default function RegisterPage() {
  const router = useRouter();
  const { register } = useAuth();

  const [name, setName] = useState("");
  const [registrationNumber, setRegistrationNumber] = useState("");
  const [email, setEmail] = useState("");
  const [profile, setProfile] = useState<Profile | "">("");
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

    const validationErrors = validateForm({
      name,
      registrationNumber,
      email,
      profile,
      password,
      confirmPassword,
    });
    setErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) return;

    setSubmitting(true);
    try {
      await register({
        name: name.trim(),
        email: email.trim(),
        password,
        profile: profile as Profile,
        registrationNumber: registrationNumber.trim() || undefined,
      });
      setShowSuccess(true);
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message || "Erro ao criar conta. Tente novamente.";
      setApiError(message);
      setShowError(true);
    } finally {
      setSubmitting(false);
    }
  }

  function handleSuccessClose() {
    setShowSuccess(false);
    router.push("/login");
  }

  return (
    <div className={styles.container}>
      <div className={`${styles.card} ${styles.cardWide}`}>
        <div className={styles.brandHeader}>
          <p className={styles.brandTitle}>
            WEPGCOMP <span className={styles.brandTitleYear}>2024</span>
          </p>
          <hr className={styles.brandLine} />
        </div>

        <h1 className={styles.title}>Cadastro</h1>

        <form className={styles.form} onSubmit={handleSubmit} noValidate>
          <Input
            label="Nome Completo"
            name="name"
            type="text"
            required
            placeholder="Insira seu nome"
            value={name}
            onChange={(e) => setName(e.target.value)}
            error={errors.name}
          />

          <Input
            label="Matricula"
            name="registrationNumber"
            type="text"
            required={profile !== "Listener"}
            placeholder="Insira sua matricula"
            value={registrationNumber}
            onChange={(e) => setRegistrationNumber(e.target.value)}
            error={errors.registrationNumber}
          />

          <Input
            label={profile === "Listener" ? "Email" : "Email UFBA"}
            name="email"
            type="email"
            required
            placeholder="Insira seu email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            error={errors.email}
          />

          <div className={styles.radioGroup}>
            <span className={styles.radioGroupLabel}>Perfil</span>
            <div className={styles.radioOptions}>
              {(
                [
                  ["DoctoralStudent", "Doutorando"],
                  ["Professor", "Professor"],
                  ["Listener", "Ouvinte"],
                ] as [Profile, string][]
              ).map(([value, label]) => (
                <label key={value} className={styles.radioLabel}>
                  <input
                    type="radio"
                    name="profile"
                    value={value}
                    checked={profile === value}
                    onChange={() => setProfile(value)}
                  />
                  {label}
                </label>
              ))}
            </div>
            {errors.profile && (
              <span className={styles.apiError} style={{ textAlign: "left", fontSize: "0.8125rem" }} role="alert">
                {errors.profile}
              </span>
            )}
          </div>

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
              {submitting ? "Cadastrando..." : "Cadastrar"}
            </Button>

            <Link href="/login" className={styles.link}>
              Já tem conta? Faça login
            </Link>
          </div>
        </form>
      </div>

      <Modal isOpen={showSuccess} onClose={handleSuccessClose} title="Cadastro realizado!" variant="success">
        <p>Sua conta foi criada com sucesso. Faça login para continuar.</p>
        <div style={{ textAlign: "center", marginTop: "1rem" }}>
          <Button variant="filled" color="primary" onClick={handleSuccessClose}>
            Ir para Login
          </Button>
        </div>
      </Modal>

      <Modal isOpen={showError} onClose={() => setShowError(false)} title="Erro no cadastro" variant="error">
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
