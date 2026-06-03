"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Button from "@/components/ui/Button";
import * as authService from "@/services/auth.service";
import authStyles from "../auth.module.css";
import styles from "./verify-email.module.css";

type Status = "loading" | "success" | "error";

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={null}>
      <VerifyEmailContent />
    </Suspense>
  );
}

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token") || "";

  const [status, setStatus] = useState<Status>("loading");

  useEffect(() => {
    if (!token) {
      setStatus("error");
      return;
    }

    authService
      .verifyEmail(token)
      .then(() => setStatus("success"))
      .catch(() => setStatus("error"));
  }, [token]);

  return (
    <div className={authStyles.container}>
      <div className={authStyles.card}>
        <div className={authStyles.brandHeader}>
          <p className={authStyles.brandTitle}>
            WEPGCOMP <span className={authStyles.brandTitleYear}>2024</span>
          </p>
          <hr className={authStyles.brandLine} />
        </div>

        {status === "loading" && (
          <div className={styles.statusBox}>
            <div className={`spinner-border ${styles.spinner}`} role="status">
              <span className="visually-hidden">Verificando...</span>
            </div>
            <p className={styles.loadingText}>Verificando seu e-mail...</p>
          </div>
        )}

        {status === "success" && (
          <div className={styles.statusBox}>
            <h1 className={styles.successTitle}>E-mail verificado com sucesso!</h1>
            <p className={styles.successText}>
              Sua conta foi ativada. Agora voc&#234; pode acessar o portal.
            </p>
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
        )}

        {status === "error" && (
          <div className={styles.statusBox}>
            <h1 className={styles.errorTitle}>Token inv&#225;lido ou expirado</h1>
            <p className={styles.errorText}>
              N&#227;o foi poss&#237;vel verificar seu e-mail. O link pode ter expirado ou j&#225; foi utilizado.
            </p>
            <Button
              variant="filled"
              color="primary"
              onClick={() => {
                window.location.href = "/login";
              }}
            >
              Voltar
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
