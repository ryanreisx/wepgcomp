"use client";

import { useState } from "react";
import Image from "next/image";
import Modal from "@/components/ui/Modal";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import { Submission } from "@/types/submission";
import { User } from "@/types/user";
import { PresentationBlock } from "@/types/presentation";
import styles from "./ApresentacaoEditModal.module.css";

const MAX_FILE_SIZE = 10 * 1024 * 1024;
const ALLOWED_PDF_TYPES = ["application/pdf"];

interface ApresentacaoEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: ApresentacaoFormData) => Promise<void>;
  submission: Submission;
  authorName: string;
  authorPhoto: string | null;
  professors: User[];
  blocks: PresentationBlock[];
}

export interface ApresentacaoFormData {
  title: string;
  abstract: string;
  advisorId: string;
  proposedPresentationBlockId?: string | null;
  pdfFile?: File | null;
}

function formatBlockLabel(block: PresentationBlock): string {
  const start = new Date(block.startTime);
  const end = new Date(start.getTime() + block.duration * 60000);
  const fmt = (d: Date) =>
    d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
  const label = block.title || "Sessão de apresentações";
  return `${label} (${fmt(start)} - ${fmt(end)})`;
}

function ApresentacaoEditModalInner({
  onSave,
  submission,
  authorName,
  authorPhoto,
  professors,
  blocks,
}: Omit<ApresentacaoEditModalProps, "isOpen" | "onClose">) {
  const [title, setTitle] = useState(submission.title);
  const [abstract, setAbstract] = useState(submission.abstract);
  const [advisorId, setAdvisorId] = useState(submission.advisorId);
  const [blockId, setBlockId] = useState(submission.proposedPresentationBlockId || "");
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const presentationBlocks = blocks.filter((b) => b.type === "Presentation");

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!title.trim()) {
      newErrors.title = "Tema é obrigatório.";
    }

    if (!abstract.trim()) {
      newErrors.abstract = "Abstract é obrigatório.";
    }

    if (!advisorId) {
      newErrors.advisorId = "Orientador é obrigatório.";
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    try {
      await onSave({
        title: title.trim(),
        abstract: abstract.trim(),
        advisorId,
        proposedPresentationBlockId: blockId || null,
        pdfFile,
      });
    } catch {
      setIsSubmitting(false);
    }
  };

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      <div className={styles.authorHeader}>
        {authorPhoto ? (
          <Image
            src={authorPhoto}
            alt={authorName}
            width={48}
            height={48}
            className={styles.authorPhoto}
          />
        ) : (
          <div className={styles.authorPhotoPlaceholder}>
            {authorName.charAt(0).toUpperCase()}
          </div>
        )}
        <div className={styles.authorInfo}>
          <span className={styles.authorLabel}>Apresentador:</span>
          <span className={styles.authorName}>{authorName}</span>
        </div>
      </div>

      <Input
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

      <div className={styles.fieldGroup}>
        <label className={styles.label}>Horário</label>
        <select
          className={styles.select}
          value={blockId}
          onChange={(e) => setBlockId(e.target.value)}
        >
          <option value="">Selecione uma sessão</option>
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
        />
        {submission.pdfFile && !pdfFile && (
          <span className={styles.currentFile}>
            Arquivo atual: {submission.pdfFile.split("/").pop()}
          </span>
        )}
        {errors.pdfFile && (
          <span className={styles.error} role="alert">
            {errors.pdfFile}
          </span>
        )}
      </div>

      <div className={styles.actions}>
        <Button
          type="submit"
          variant="filled"
          color="secondary"
          disabled={isSubmitting}
        >
          {isSubmitting ? "Salvando..." : "Alterar"}
        </Button>
      </div>
    </form>
  );
}

export default function ApresentacaoEditModal({
  isOpen,
  onClose,
  onSave,
  submission,
  authorName,
  authorPhoto,
  professors,
  blocks,
}: ApresentacaoEditModalProps) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Editar Apresentação"
    >
      <ApresentacaoEditModalInner
        key={isOpen ? `edit-${submission.id}` : "closed"}
        onSave={onSave}
        submission={submission}
        authorName={authorName}
        authorPhoto={authorPhoto}
        professors={professors}
        blocks={blocks}
      />
    </Modal>
  );
}
