"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import HeroBanner from "@/components/ui/HeroBanner";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";
import SubmissaoAvisoModal from "@/components/forms/SubmissaoAvisoModal";
import { useAuth } from "@/hooks/useAuth";
import { User } from "@/types/user";
import { PresentationBlock } from "@/types/presentation";
import { getActiveEventEdition } from "@/services/event-edition.service";
import { getProfessors } from "@/services/user.service";
import { getPresentationBlocksByEdition } from "@/services/presentation.service";
import {
  createSubmission,
  getSubmissionById,
  updateSubmission,
} from "@/services/submission.service";
import styles from "./ApresentacaoSubmissaoForm.module.css";

const MAX_FILE_SIZE = 10 * 1024 * 1024;
const ALLOWED_PDF_TYPES = ["application/pdf"];

interface ApresentacaoSubmissaoFormProps {
  submissionId?: string;
}

function formatBlockLabel(block: PresentationBlock): string {
  const start = new Date(block.startTime);
  const end = new Date(start.getTime() + block.duration * 60000);
  const fmt = (d: Date) =>
    d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
  const date = start.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
  });
  const label = block.title || "Sessão de apresentações";
  return `${date} — ${label} (${fmt(start)} - ${fmt(end)})`;
}

export default function ApresentacaoSubmissaoForm({
  submissionId,
}: ApresentacaoSubmissaoFormProps) {
  const { user } = useAuth();
  const router = useRouter();
  const isEditMode = !!submissionId;

  const [isLoading, setIsLoading] = useState(true);
  const [editionId, setEditionId] = useState<string | null>(null);
  const [deadlineError, setDeadlineError] = useState<string | null>(null);
  const [professors, setProfessors] = useState<User[]>([]);
  const [blocks, setBlocks] = useState<PresentationBlock[]>([]);

  const [title, setTitle] = useState("");
  const [abstract, setAbstract] = useState("");
  const [advisorId, setAdvisorId] = useState("");
  const [coAdvisor, setCoAdvisor] = useState("");
  const [blockId, setBlockId] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [currentPdfName, setCurrentPdfName] = useState<string | null>(null);

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [avisoOpen, setAvisoOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successOpen, setSuccessOpen] = useState(false);
  const [errorOpen, setErrorOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function init() {
      try {
        const editionRes = await getActiveEventEdition();
        const edition = editionRes.data.data;
        if (cancelled) return;

        const deadline = new Date(edition.submissionDeadline);
        if (new Date() > deadline) {
          const formatted = deadline.toLocaleDateString("pt-BR");
          setDeadlineError(
            `Período de submissão encerrado em ${formatted}.`
          );
          setIsLoading(false);
          return;
        }

        setEditionId(edition.id);

        const [profsRes, blocksRes] = await Promise.all([
          getProfessors(),
          getPresentationBlocksByEdition(edition.id),
        ]);

        if (cancelled) return;
        setProfessors(profsRes.data.data);
        setBlocks(blocksRes.data.data);

        if (submissionId) {
          const subRes = await getSubmissionById(submissionId);
          if (cancelled) return;
          const sub = subRes.data.data;
          setTitle(sub.title);
          setAbstract(sub.abstract);
          setAdvisorId(sub.advisorId);
          setCoAdvisor(sub.coAdvisor || "");
          setBlockId(sub.proposedPresentationBlockId || "");
          setPhoneNumber(sub.phoneNumber);
          setCurrentPdfName(sub.pdfFile?.split("/").pop() || null);
        }
      } catch {
        // silent
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    init();
    return () => {
      cancelled = true;
    };
  }, [submissionId]);

  const presentationBlocks = blocks.filter((b) => b.type === "Presentation");

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!title.trim()) newErrors.title = "Tema é obrigatório.";
    if (!abstract.trim()) newErrors.abstract = "Abstract é obrigatório.";
    if (!advisorId) newErrors.advisorId = "Orientador é obrigatório.";
    if (!phoneNumber.trim()) newErrors.phoneNumber = "Telefone é obrigatório.";

    if (!isEditMode && !pdfFile) {
      newErrors.pdfFile = "Slide (PDF) é obrigatório.";
    }

    if (pdfFile) {
      if (!ALLOWED_PDF_TYPES.includes(pdfFile.type)) {
        newErrors.pdfFile = "Apenas arquivos PDF são permitidos.";
      } else if (pdfFile.size > MAX_FILE_SIZE) {
        newErrors.pdfFile = "O arquivo deve ter no máximo 10MB.";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setPdfFile(file);
    if (errors.pdfFile) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next.pdfFile;
        return next;
      });
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setAvisoOpen(true);
  };

  const handleConfirm = async () => {
    if (!editionId) return;
    setIsSubmitting(true);

    const dto = {
      title: title.trim(),
      abstract: abstract.trim(),
      advisorId,
      eventEditionId: editionId,
      phoneNumber: phoneNumber.trim(),
      proposedPresentationBlockId: blockId || undefined,
      coAdvisor: coAdvisor.trim() || undefined,
    };

    try {
      if (isEditMode && submissionId) {
        await updateSubmission(submissionId, dto, pdfFile || undefined);
      } else {
        await createSubmission(dto, pdfFile!);
      }
      setAvisoOpen(false);
      setSuccessOpen(true);
    } catch (err: unknown) {
      setAvisoOpen(false);
      const msg =
        err && typeof err === "object" && "response" in err
          ? ((err as { response: { data: { message?: string } } }).response
              ?.data?.message ?? "Erro ao salvar apresentação.")
          : "Erro ao salvar apresentação.";
      setErrorMessage(msg);
      setErrorOpen(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSuccessClose = () => {
    setSuccessOpen(false);
    router.push("/aluno/apresentacoes");
  };

  if (isLoading) {
    return (
      <>
        <HeroBanner title="Cadastro de Apresentação" />
        <div className={styles.container}>
          <p className={styles.loading}>Carregando...</p>
        </div>
      </>
    );
  }

  if (deadlineError) {
    return (
      <>
        <HeroBanner title="Cadastro de Apresentação" />
        <div className={styles.container}>
          <p className={styles.deadlineError}>{deadlineError}</p>
        </div>
      </>
    );
  }

  return (
    <>
      <HeroBanner title="Cadastro de Apresentação" />

      <div className={styles.container}>
        <div className={styles.header}>
          <h2 className={styles.title}>
            {isEditMode ? "Editar Apresentação" : "Cadastro de Apresentação"}
          </h2>
        </div>

        {user && (
          <div className={styles.authorHeader}>
            {user.photoFilePath ? (
              <Image
                src={user.photoFilePath}
                alt={user.name}
                width={48}
                height={48}
                className={styles.authorPhoto}
              />
            ) : (
              <div className={styles.authorPhotoPlaceholder}>
                {user.name.charAt(0).toUpperCase()}
              </div>
            )}
            <div className={styles.authorInfo}>
              <span className={styles.authorLabel}>Apresentador:</span>
              <span className={styles.authorName}>{user.name}</span>
            </div>
          </div>
        )}

        <form className={styles.form} onSubmit={handleFormSubmit} noValidate>
          <Input
            name="title"
            label="Tema"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            error={errors.title}
            placeholder="Título da apresentação"
          />

          <div className={styles.fieldGroup}>
            <label className={styles.label}>
              Abstract <span className={styles.asterisk}>*</span>
            </label>
            <textarea
              className={`${styles.textarea} ${errors.abstract ? styles.textareaError : ""}`}
              value={abstract}
              onChange={(e) => setAbstract(e.target.value)}
              placeholder="Resumo da apresentação"
              rows={4}
            />
            {errors.abstract && (
              <span className={styles.error} role="alert">
                {errors.abstract}
              </span>
            )}
          </div>

          <div className={styles.fieldGroup}>
            <label className={styles.label}>
              Orientador <span className={styles.asterisk}>*</span>
            </label>
            <select
              className={`${styles.select} ${errors.advisorId ? styles.selectError : ""}`}
              value={advisorId}
              onChange={(e) => setAdvisorId(e.target.value)}
            >
              <option value="">Selecione um orientador</option>
              {professors.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
            {errors.advisorId && (
              <span className={styles.error} role="alert">
                {errors.advisorId}
              </span>
            )}
          </div>

          <Input
            name="coAdvisor"
            label="Co-orientador"
            value={coAdvisor}
            onChange={(e) => setCoAdvisor(e.target.value)}
            placeholder="Nome do co-orientador (opcional)"
          />

          <div className={styles.fieldGroup}>
            <label className={styles.label}>Sugestão de data e horário</label>
            <select
              className={styles.select}
              value={blockId}
              onChange={(e) => setBlockId(e.target.value)}
            >
              <option value="">Selecione uma sessão (opcional)</option>
              {presentationBlocks.map((b) => (
                <option key={b.id} value={b.id}>
                  {formatBlockLabel(b)}
                </option>
              ))}
            </select>
          </div>

          <div className={styles.fieldGroup}>
            <label className={styles.label}>
              Slide (PDF) <span className={styles.asterisk}>*</span>
            </label>
            <input
              type="file"
              accept=".pdf,application/pdf"
              onChange={handleFileChange}
              className={styles.fileInput}
              data-testid="pdf-upload"
            />
            {currentPdfName && !pdfFile && (
              <span className={styles.currentFile}>
                Arquivo atual: {currentPdfName}
              </span>
            )}
            {errors.pdfFile && (
              <span className={styles.error} role="alert">
                {errors.pdfFile}
              </span>
            )}
          </div>

          <Input
            name="phoneNumber"
            label="Telefone"
            required
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
            error={errors.phoneNumber}
            placeholder="(XX) XXXXX-XXXX"
          />

          <div className={styles.actions}>
            <Button type="submit" variant="filled" color="secondary">
              {isEditMode ? "Salvar" : "Cadastrar"}
            </Button>
          </div>
        </form>
      </div>

      <SubmissaoAvisoModal
        isOpen={avisoOpen}
        onClose={() => setAvisoOpen(false)}
        onConfirm={handleConfirm}
        isSubmitting={isSubmitting}
      />

      <Modal
        isOpen={successOpen}
        onClose={handleSuccessClose}
        title={isEditMode ? "Apresentação atualizada!" : "Apresentação cadastrada!"}
        variant="success"
      >
        <p>
          {isEditMode
            ? "Sua apresentação foi atualizada com sucesso."
            : "Sua apresentação foi cadastrada com sucesso."}
        </p>
      </Modal>

      <Modal
        isOpen={errorOpen}
        onClose={() => setErrorOpen(false)}
        title="Erro"
        variant="error"
      >
        <p>{errorMessage}</p>
      </Modal>
    </>
  );
}
