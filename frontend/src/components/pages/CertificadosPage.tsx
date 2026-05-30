"use client";

import { useState, useEffect } from "react";
import HeroBanner from "@/components/ui/HeroBanner";
import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";
import { useUserView, View } from "@/hooks/useUserView";
import { Certificate } from "@/types/certificate";
import { EventEdition } from "@/types/event-edition";
import { User, Profile } from "@/types/user";
import {
  generateCertificates,
  getMyCertificates,
  downloadCertificate,
} from "@/services/certificate.service";
import {
  getEventEditions,
  getActiveEventEdition,
} from "@/services/event-edition.service";
import { getUsers } from "@/services/user.service";
import styles from "./CertificadosPage.module.css";

const PROFILE_LABEL: Record<Profile, string> = {
  DoctoralStudent: "Apresentador(a)",
  Professor: "Avaliador(a)",
  Listener: "Ouvinte",
};

function formatDateRange(startDate: string, endDate: string): string {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const dayStart = start.getDate();
  const dayEnd = end.getDate();
  const monthEnd = end.toLocaleDateString("pt-BR", { month: "long" });
  const year = end.getFullYear();

  if (
    start.getMonth() === end.getMonth() &&
    start.getFullYear() === end.getFullYear()
  ) {
    return `${dayStart} a ${dayEnd} de ${monthEnd} de ${year}`;
  }

  const monthStart = start.toLocaleDateString("pt-BR", { month: "long" });
  return `${dayStart} de ${monthStart} a ${dayEnd} de ${monthEnd} de ${year}`;
}

export default function CertificadosPage() {
  const view = useUserView();
  const isAdmin = view === "superadmin" || view === "committee";

  return (
    <>
      <HeroBanner title="Certificados" />
      <div className={styles.container}>
        {isAdmin ? <AdminView view={view} /> : <UserView />}
      </div>
    </>
  );
}

function AdminView({ view }: { view: View }) {
  const isSuperadmin = view === "superadmin";

  const [editions, setEditions] = useState<EventEdition[]>([]);
  const [selectedEditionId, setSelectedEditionId] = useState("");
  const [users, setUsers] = useState<User[]>([]);
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [successOpen, setSuccessOpen] = useState(false);
  const [errorOpen, setErrorOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        if (isSuperadmin) {
          const [edRes, usersRes] = await Promise.all([
            getEventEditions(),
            getUsers(),
          ]);
          if (cancelled) return;
          setEditions(edRes.data.data);
          setUsers(usersRes.data.data);
        } else {
          const [edRes, usersRes] = await Promise.all([
            getActiveEventEdition(),
            getUsers(),
          ]);
          if (cancelled) return;
          setSelectedEditionId(edRes.data.data.id);
          setEditions([edRes.data.data]);
          setUsers(usersRes.data.data);
        }
      } catch {
        // silent
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [isSuperadmin]);

  const handleGenerate = async () => {
    if (!selectedEditionId) return;
    setIsGenerating(true);

    try {
      const res = await generateCertificates(selectedEditionId);
      setCertificates(res.data.data);
      setSuccessOpen(true);
    } catch {
      setErrorOpen(true);
    } finally {
      setIsGenerating(false);
    }
  };

  const getUserName = (userId: string) => {
    const user = users.find((u) => u.id === userId);
    return user?.name ?? userId;
  };

  const getUserProfile = (userId: string) => {
    const user = users.find((u) => u.id === userId);
    return user ? PROFILE_LABEL[user.profile] : "—";
  };

  if (isLoading) {
    return <p className={styles.loading}>Carregando...</p>;
  }

  const selectedEdition = editions.find((e) => e.id === selectedEditionId);

  return (
    <>
      <div className={styles.adminHeader}>
        {isSuperadmin && (
          <div className={styles.fieldGroup}>
            <label htmlFor="edition-select" className={styles.fieldLabel}>
              Edição
            </label>
            <select
              id="edition-select"
              className={styles.select}
              value={selectedEditionId}
              onChange={(e) => setSelectedEditionId(e.target.value)}
            >
              <option value="">Selecione uma edição</option>
              {editions.map((ed) => (
                <option key={ed.id} value={ed.id}>
                  {ed.name}
                </option>
              ))}
            </select>
          </div>
        )}

        {!isSuperadmin && selectedEdition && (
          <p className={styles.editionName}>{selectedEdition.name}</p>
        )}

        <Button
          variant="filled"
          color="secondary"
          onClick={handleGenerate}
          disabled={!selectedEditionId || isGenerating}
        >
          {isGenerating ? "Gerando..." : "Gerar Certificados"}
        </Button>
      </div>

      {certificates.length > 0 && (
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Nome</th>
              <th>Tipo de participação</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {certificates.map((cert) => (
              <tr key={cert.id}>
                <td>{getUserName(cert.userId)}</td>
                <td>{getUserProfile(cert.userId)}</td>
                <td>
                  <span
                    className={
                      cert.isEmailSent
                        ? styles.statusSent
                        : styles.statusPending
                    }
                  >
                    {cert.isEmailSent ? "Enviado" : "Pendente"}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <Modal
        isOpen={successOpen}
        onClose={() => setSuccessOpen(false)}
        title="Certificados gerados!"
        variant="success"
      >
        <p>
          {certificates.length} certificado(s) gerado(s) com sucesso.
        </p>
      </Modal>

      <Modal
        isOpen={errorOpen}
        onClose={() => setErrorOpen(false)}
        title="Erro"
        variant="error"
      >
        <p>Erro ao gerar certificados.</p>
      </Modal>
    </>
  );
}

function UserView() {
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [editions, setEditions] = useState<EventEdition[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const [certRes, edRes] = await Promise.all([
          getMyCertificates(),
          getEventEditions(),
        ]);
        if (cancelled) return;
        setCertificates(certRes.data.data);
        setEditions(edRes.data.data);
      } catch {
        // silent
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleDownload = async (certId: string) => {
    try {
      const res = await downloadCertificate(certId);
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", "certificado.pdf");
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch {
      // silent
    }
  };

  const getEdition = (editionId: string) =>
    editions.find((e) => e.id === editionId);

  if (isLoading) {
    return <p className={styles.loading}>Carregando...</p>;
  }

  if (certificates.length === 0) {
    return (
      <p className={styles.empty}>Você ainda não possui certificados.</p>
    );
  }

  return (
    <div className={styles.cardList}>
      {certificates.map((cert) => {
        const edition = getEdition(cert.eventEditionId);
        return (
          <div key={cert.id} className={styles.certCard}>
            <div className={styles.certInfo}>
              <span className={styles.certTitle}>
                {edition?.name ?? cert.eventEditionId}
              </span>
              {edition && (
                <span className={styles.certDate}>
                  {formatDateRange(edition.startDate, edition.endDate)}
                </span>
              )}
            </div>
            <Button
              variant="filled"
              color="primary"
              onClick={() => handleDownload(cert.id)}
            >
              Baixar
            </Button>
          </div>
        );
      })}
    </div>
  );
}
