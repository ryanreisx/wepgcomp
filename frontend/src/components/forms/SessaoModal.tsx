"use client";

import { useState } from "react";
import Modal from "@/components/ui/Modal";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import { PresentationBlock, PresentationBlockType } from "@/types/presentation";
import { Submission } from "@/types/submission";
import { Room } from "@/services/room.service";
import { User } from "@/types/user";
import styles from "./SessaoModal.module.css";

interface SessaoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: SessaoFormData) => Promise<void>;
  editingBlock?: PresentationBlock | null;
  rooms: Room[];
  submissions: Submission[];
  professors: User[];
  existingBlocks: PresentationBlock[];
}

export interface SessaoFormData {
  type: PresentationBlockType;
  title?: string;
  speakerName?: string;
  roomId?: string;
  startTime: string;
  endTime: string;
  submissionIds?: string[];
  panelistUserIds?: string[];
}

function toLocalDatetime(iso: string): string {
  if (!iso) return "";
  const d = new Date(iso);
  const offset = d.getTimezoneOffset();
  const local = new Date(d.getTime() - offset * 60000);
  return local.toISOString().slice(0, 16);
}

function deriveInitialState(editingBlock: PresentationBlock | null | undefined) {
  if (editingBlock) {
    const end = new Date(
      new Date(editingBlock.startTime).getTime() +
        editingBlock.duration * 60000
    );
    return {
      type: editingBlock.type,
      title: editingBlock.title || "",
      speakerName: editingBlock.speakerName || "",
      roomId: editingBlock.roomId || "",
      startTime: toLocalDatetime(editingBlock.startTime),
      endTime: toLocalDatetime(end.toISOString()),
    };
  }
  return {
    type: "General" as PresentationBlockType,
    title: "",
    speakerName: "",
    roomId: "",
    startTime: "",
    endTime: "",
  };
}

function SessaoModalInner({
  onSave,
  editingBlock,
  rooms,
  submissions,
  professors,
  existingBlocks,
}: Omit<SessaoModalProps, "isOpen" | "onClose">) {
  const initial = deriveInitialState(editingBlock);
  const [type, setType] = useState<PresentationBlockType>(initial.type);
  const [title, setTitle] = useState(initial.title);
  const [speakerName, setSpeakerName] = useState(initial.speakerName);
  const [roomId, setRoomId] = useState(initial.roomId);
  const [startTime, setStartTime] = useState(initial.startTime);
  const [endTime, setEndTime] = useState(initial.endTime);
  const [selectedSubmissions, setSelectedSubmissions] = useState<string[]>([]);
  const [selectedPanelists, setSelectedPanelists] = useState<string[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleTypeChange = (newType: PresentationBlockType) => {
    setType(newType);
    if (newType === "General") {
      setSelectedSubmissions([]);
      setSelectedPanelists([]);
    } else {
      setTitle("");
      setSpeakerName("");
    }
    setErrors({});
  };

  const checkRoomOverlap = (
    rId: string,
    start: Date,
    end: Date
  ): boolean => {
    if (!rId) return false;
    return existingBlocks.some((block) => {
      if (editingBlock && block.id === editingBlock.id) return false;
      if (block.roomId !== rId) return false;
      const bStart = new Date(block.startTime);
      const bEnd = new Date(bStart.getTime() + block.duration * 60000);
      return start < bEnd && end > bStart;
    });
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!startTime) {
      newErrors.startTime = "Data/horário de início é obrigatório.";
    }

    if (type === "General") {
      if (!title.trim()) {
        newErrors.title = "Título é obrigatório.";
      }
      if (!endTime) {
        newErrors.endTime = "Data/horário de fim é obrigatório.";
      }
      if (startTime && endTime && new Date(endTime) <= new Date(startTime)) {
        newErrors.endTime = "Fim deve ser posterior ao início.";
      }
    }

    if (type === "Presentation") {
      if (!roomId) {
        newErrors.roomId = "Sala é obrigatória.";
      }
      if (!endTime) {
        newErrors.endTime = "Data/horário de fim é obrigatório.";
      }
      if (startTime && endTime && new Date(endTime) <= new Date(startTime)) {
        newErrors.endTime = "Fim deve ser posterior ao início.";
      }
    }

    if (startTime && endTime && roomId) {
      const start = new Date(startTime);
      const end = new Date(endTime);
      if (end > start && checkRoomOverlap(roomId, start, end)) {
        newErrors.roomId =
          "Já existe uma sessão nesta sala neste horário.";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    try {
      await onSave({
        type,
        title: type === "General" ? title.trim() : undefined,
        speakerName: type === "General" ? speakerName.trim() || undefined : undefined,
        roomId: roomId || undefined,
        startTime: new Date(startTime).toISOString(),
        endTime: new Date(endTime).toISOString(),
        submissionIds: type === "Presentation" ? selectedSubmissions : undefined,
        panelistUserIds: type === "Presentation" ? selectedPanelists : undefined,
      });
    } catch {
      setIsSubmitting(false);
    }
  };

  const handleMultiSelect = (
    e: React.ChangeEvent<HTMLSelectElement>,
    setter: (val: string[]) => void
  ) => {
    const selected = Array.from(e.target.selectedOptions, (o) => o.value);
    setter(selected);
  };

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      <div className={styles.radioGroup}>
        <label className={styles.radioLabel}>
          <input
            type="radio"
            name="sessionType"
            value="General"
            checked={type === "General"}
            onChange={() => handleTypeChange("General")}
          />
          Sessão geral do evento
        </label>
        <label className={styles.radioLabel}>
          <input
            type="radio"
            name="sessionType"
            value="Presentation"
            checked={type === "Presentation"}
            onChange={() => handleTypeChange("Presentation")}
          />
          Sessão de apresentações
        </label>
      </div>

      {type === "General" && (
        <>
          <Input
            label="Título"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            error={errors.title}
            placeholder="Título da sessão"
          />
          <Input
            label="Nome do palestrante"
            value={speakerName}
            onChange={(e) => setSpeakerName(e.target.value)}
            placeholder="Nome do palestrante"
          />
        </>
      )}

      {type === "Presentation" && (
        <>
          <div className={styles.fieldGroup}>
            <label className={styles.label}>Apresentações</label>
            <select
              multiple
              className={styles.multiSelect}
              value={selectedSubmissions}
              onChange={(e) => handleMultiSelect(e, setSelectedSubmissions)}
            >
              {submissions.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.title}
                </option>
              ))}
            </select>
          </div>
        </>
      )}

      <div className={styles.fieldGroup}>
        <label className={styles.label}>
          Sala{type === "Presentation" && <span className={styles.asterisk}> *</span>}
        </label>
        <select
          className={`${styles.select} ${errors.roomId ? styles.selectError : ""}`}
          value={roomId}
          onChange={(e) => setRoomId(e.target.value)}
        >
          <option value="">Selecione uma sala</option>
          {rooms.map((r) => (
            <option key={r.id} value={r.id}>
              {r.name}
            </option>
          ))}
        </select>
        {errors.roomId && (
          <span className={styles.error} role="alert">
            {errors.roomId}
          </span>
        )}
      </div>

      <div className={styles.dateRow}>
        <Input
          label="Data/horário início"
          type="datetime-local"
          required
          value={startTime}
          onChange={(e) => setStartTime(e.target.value)}
          error={errors.startTime}
        />
        <Input
          label="Data/horário fim"
          type="datetime-local"
          required
          value={endTime}
          onChange={(e) => setEndTime(e.target.value)}
          error={errors.endTime}
        />
      </div>

      {type === "Presentation" && (
        <div className={styles.fieldGroup}>
          <label className={styles.label}>Avaliadores</label>
          <select
            multiple
            className={styles.multiSelect}
            value={selectedPanelists}
            onChange={(e) => handleMultiSelect(e, setSelectedPanelists)}
          >
            {professors.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>
      )}

      <div className={styles.actions}>
        <Button
          type="submit"
          variant="filled"
          color="secondary"
          disabled={isSubmitting}
        >
          {isSubmitting ? "Salvando..." : "Salvar"}
        </Button>
      </div>
    </form>
  );
}

export default function SessaoModal({
  isOpen,
  onClose,
  onSave,
  editingBlock,
  rooms,
  submissions,
  professors,
  existingBlocks,
}: SessaoModalProps) {
  const modalKey = editingBlock ? `edit-${editingBlock.id}` : "create";

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={editingBlock ? "Editar Sessão" : "Nova Sessão"}
    >
      <SessaoModalInner
        key={isOpen ? modalKey : "closed"}
        onSave={onSave}
        editingBlock={editingBlock}
        rooms={rooms}
        submissions={submissions}
        professors={professors}
        existingBlocks={existingBlocks}
      />
    </Modal>
  );
}
