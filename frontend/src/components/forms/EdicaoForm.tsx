"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import HeroBanner from "@/components/ui/HeroBanner";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";
import { EventEdition, CreateEventEditionDto } from "@/types/event-edition";
import { User } from "@/types/user";
import {
  createEventEdition,
  getEventEditionById,
  getActiveEventEdition,
  updateEventEdition,
} from "@/services/event-edition.service";
import { getUsers } from "@/services/user.service";
import {
  CommitteeMember,
  getCommitteeMembersByEdition,
  createCommitteeMember,
  deleteCommitteeMember,
} from "@/services/committee.service";
import styles from "./EdicaoForm.module.css";

type FormMode = "create" | "edit" | "committee";

interface EdicaoFormProps {
  mode: FormMode;
  editionId?: string;
}

interface CommitteeState {
  coordinatorId: string;
  organizingCommittee: string[];
  itSupport: string[];
  adminSupport: string[];
  communication: string[];
}

function toLocalDatetime(iso: string): string {
  if (!iso) return "";
  const d = new Date(iso);
  const offset = d.getTimezoneOffset();
  const local = new Date(d.getTime() - offset * 60000);
  return local.toISOString().slice(0, 16);
}

function EdicaoFormInner({ mode, editionId }: EdicaoFormProps) {
  const router = useRouter();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [callForPapersText, setCallForPapersText] = useState("");
  const [submissionDeadline, setSubmissionDeadline] = useState("");
  const [presentationDuration, setPresentationDuration] = useState("20");
  const [presentationsPerBlock, setPresentationsPerBlock] = useState("6");

  const [committee, setCommittee] = useState<CommitteeState>({
    coordinatorId: "",
    organizingCommittee: [],
    itSupport: [],
    adminSupport: [],
    communication: [],
  });

  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [professors, setProfessors] = useState<User[]>([]);
  const [existingMembers, setExistingMembers] = useState<CommitteeMember[]>([]);
  const [loadedEditionId, setLoadedEditionId] = useState<string | null>(null);

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(mode !== "create");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successOpen, setSuccessOpen] = useState(false);
  const [errorOpen, setErrorOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const usersRes = await getUsers();
        if (cancelled) return;
        const users = usersRes.data.data;
        setAllUsers(users);
        setProfessors(users.filter((u: User) => u.profile === "Professor"));

        let edition: EventEdition | null = null;
        let eid: string | null = null;

        if (mode === "edit" && editionId) {
          const res = await getEventEditionById(editionId);
          edition = res.data.data;
          eid = editionId;
        } else if (mode === "committee") {
          const res = await getActiveEventEdition();
          edition = res.data.data;
          eid = edition.id;
        }

        if (cancelled) return;

        if (edition && eid) {
          setName(edition.name);
          setDescription(edition.description);
          setLocation(edition.location);
          setStartDate(toLocalDatetime(edition.startDate));
          setEndDate(toLocalDatetime(edition.endDate));
          setCallForPapersText(edition.callForPapersText);
          setSubmissionDeadline(toLocalDatetime(edition.submissionDeadline));
          setPresentationDuration(String(edition.presentationDuration));
          setPresentationsPerBlock(
            String(edition.presentationsPerPresentationBlock)
          );
          setLoadedEditionId(eid);

          const membersRes = await getCommitteeMembersByEdition(eid);
          if (cancelled) return;
          const members = membersRes.data.data;
          setExistingMembers(members);

          const coordinator = members.find(
            (m) => m.level === "Coordinator"
          );
          setCommittee({
            coordinatorId: coordinator?.userId || "",
            organizingCommittee: members
              .filter((m) => m.role === "OrganizingCommittee" && m.level !== "Coordinator")
              .map((m) => m.userId),
            itSupport: members
              .filter((m) => m.role === "ITSupport")
              .map((m) => m.userId),
            adminSupport: members
              .filter((m) => m.role === "AdministativeSupport")
              .map((m) => m.userId),
            communication: members
              .filter((m) => m.role === "Communication")
              .map((m) => m.userId),
          });
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
  }, [mode, editionId]);

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!name.trim()) newErrors.name = "Nome é obrigatório.";
    if (!description.trim()) newErrors.description = "Descrição é obrigatória.";
    if (!location.trim()) newErrors.location = "Local é obrigatório.";
    if (!startDate) newErrors.startDate = "Data de início é obrigatória.";
    if (!endDate) newErrors.endDate = "Data de fim é obrigatória.";

    if (startDate && endDate && new Date(endDate) <= new Date(startDate)) {
      newErrors.endDate = "Data de fim deve ser posterior à data de início.";
    }

    if (startDate && submissionDeadline) {
      if (new Date(submissionDeadline) > new Date(startDate)) {
        newErrors.submissionDeadline =
          "Data limite de submissão deve ser anterior ou igual à data de início do evento.";
      }
    }

    if (committee.coordinatorId) {
      const coord = professors.find((p) => p.id === committee.coordinatorId);
      if (!coord) {
        newErrors.coordinatorId =
          "Coordenador(a) deve ter perfil de Professor.";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleMultiSelect = (
    e: React.ChangeEvent<HTMLSelectElement>,
    field: keyof Omit<CommitteeState, "coordinatorId">
  ) => {
    const selected = Array.from(e.target.selectedOptions, (o) => o.value);
    setCommittee((prev) => ({ ...prev, [field]: selected }));
  };

  const getAvailableUsers = (
    excludeCoordinator: boolean = true
  ): User[] => {
    if (!excludeCoordinator || !committee.coordinatorId) return allUsers;
    return allUsers.filter((u) => u.id !== committee.coordinatorId);
  };

  const syncCommitteeMembers = async (eid: string) => {
    const desired: { userId: string; level: "Coordinator" | "Committee"; role: string }[] = [];

    if (committee.coordinatorId) {
      desired.push({
        userId: committee.coordinatorId,
        level: "Coordinator",
        role: "OrganizingCommittee",
      });
    }

    for (const userId of committee.organizingCommittee) {
      if (userId !== committee.coordinatorId) {
        desired.push({ userId, level: "Committee", role: "OrganizingCommittee" });
      }
    }
    for (const userId of committee.itSupport) {
      desired.push({ userId, level: "Committee", role: "ITSupport" });
    }
    for (const userId of committee.adminSupport) {
      desired.push({ userId, level: "Committee", role: "AdministativeSupport" });
    }
    for (const userId of committee.communication) {
      desired.push({ userId, level: "Committee", role: "Communication" });
    }

    for (const existing of existingMembers) {
      const stillDesired = desired.some(
        (d) => d.userId === existing.userId && d.role === existing.role
      );
      if (!stillDesired) {
        await deleteCommitteeMember(existing.id);
      }
    }

    for (const d of desired) {
      const alreadyExists = existingMembers.some(
        (e) => e.userId === d.userId && e.role === d.role
      );
      if (!alreadyExists) {
        await createCommitteeMember({
          eventEditionId: eid,
          userId: d.userId,
          level: d.level,
          role: d.role,
        });
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);

    const dto: CreateEventEditionDto = {
      name: name.trim(),
      description: description.trim(),
      callForPapersText: callForPapersText.trim(),
      partnersText: "",
      location: location.trim(),
      startDate: new Date(startDate).toISOString(),
      endDate: new Date(endDate).toISOString(),
      submissionStartDate: new Date(startDate).toISOString(),
      submissionDeadline: submissionDeadline
        ? new Date(submissionDeadline).toISOString()
        : new Date(startDate).toISOString(),
      presentationDuration: parseInt(presentationDuration, 10) || 20,
      presentationsPerPresentationBlock: parseInt(presentationsPerBlock, 10) || 6,
    };

    try {
      if (mode === "create") {
        const res = await createEventEdition(dto);
        const newId = res.data.data.id;
        await syncCommitteeMembers(newId);
        setSuccessOpen(true);
      } else {
        const eid = loadedEditionId || editionId;
        if (!eid) return;
        await updateEventEdition(eid, dto);
        await syncCommitteeMembers(eid);
        setSuccessOpen(true);
      }
    } catch (err: unknown) {
      const msg =
        err && typeof err === "object" && "response" in err
          ? ((err as { response: { data: { message?: string } } }).response?.data
              ?.message ?? "Erro ao salvar edição.")
          : "Erro ao salvar edição.";
      setErrorMessage(msg);
      setErrorOpen(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSuccessClose = () => {
    setSuccessOpen(false);
    if (mode === "create" || mode === "edit") {
      router.push("/superadmin/edicoes");
    }
  };

  if (isLoading) {
    return (
      <>
        <HeroBanner
          title={mode === "create" ? "Cadastrar Edição" : "Editar Edição"}
        />
        <div className={styles.container}>
          <p className={styles.loading}>Carregando...</p>
        </div>
      </>
    );
  }

  const heroTitle =
    mode === "create"
      ? "Cadastrar Edição"
      : mode === "committee"
        ? "Edição do Evento"
        : "Editar Edição";

  return (
    <>
      <HeroBanner title={heroTitle} />

      <div className={styles.container}>
        <form className={styles.form} onSubmit={handleSubmit}>
          <Input
            label="Nome do evento"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            error={errors.name}
            placeholder="WEPGCOMP 202_"
          />

          <div className={styles.fieldGroup}>
            <label className={styles.label}>
              Descrição do evento <span className={styles.asterisk}>*</span>
            </label>
            <textarea
              className={`${styles.textarea} ${errors.description ? styles.textareaError : ""}`}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Descrição do evento"
              rows={4}
            />
            {errors.description && (
              <span className={styles.error} role="alert">
                {errors.description}
              </span>
            )}
          </div>

          <div className={styles.dateRow}>
            <Input
              label="Data/horário de início"
              type="datetime-local"
              required
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              error={errors.startDate}
            />
            <Input
              label="Data/horário de fim"
              type="datetime-local"
              required
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              error={errors.endDate}
            />
          </div>

          <Input
            label="Local do evento"
            required
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            error={errors.location}
            placeholder="Local do evento"
          />

          <h2 className={styles.sectionTitle}>Comissão Organizadora</h2>

          <div className={styles.fieldGroup}>
            <label className={styles.label}>Coordenador(a) geral</label>
            <select
              className={`${styles.select} ${errors.coordinatorId ? styles.selectError : ""}`}
              value={committee.coordinatorId}
              onChange={(e) =>
                setCommittee((prev) => ({
                  ...prev,
                  coordinatorId: e.target.value,
                }))
              }
            >
              <option value="">Selecione um professor</option>
              {professors.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
            {errors.coordinatorId && (
              <span className={styles.error} role="alert">
                {errors.coordinatorId}
              </span>
            )}
          </div>

          <div className={styles.fieldGroup}>
            <label className={styles.label}>Comissão organizadora</label>
            <select
              multiple
              className={styles.multiSelect}
              value={committee.organizingCommittee}
              onChange={(e) => handleMultiSelect(e, "organizingCommittee")}
            >
              {getAvailableUsers().map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name}
                </option>
              ))}
            </select>
          </div>

          <div className={styles.fieldGroup}>
            <label className={styles.label}>Apoio TI</label>
            <select
              multiple
              className={styles.multiSelect}
              value={committee.itSupport}
              onChange={(e) => handleMultiSelect(e, "itSupport")}
            >
              {getAvailableUsers().map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name}
                </option>
              ))}
            </select>
          </div>

          <div className={styles.fieldGroup}>
            <label className={styles.label}>Apoio Administrativo</label>
            <select
              multiple
              className={styles.multiSelect}
              value={committee.adminSupport}
              onChange={(e) => handleMultiSelect(e, "adminSupport")}
            >
              {getAvailableUsers().map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name}
                </option>
              ))}
            </select>
          </div>

          <div className={styles.fieldGroup}>
            <label className={styles.label}>Comunicação</label>
            <select
              multiple
              className={styles.multiSelect}
              value={committee.communication}
              onChange={(e) => handleMultiSelect(e, "communication")}
            >
              {getAvailableUsers().map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name}
                </option>
              ))}
            </select>
          </div>

          <h2 className={styles.sectionTitle}>Sessões e Apresentações</h2>

          <div className={styles.dateRow}>
            <Input
              label="Duração das apresentações (min)"
              type="number"
              value={presentationDuration}
              onChange={(e) => setPresentationDuration(e.target.value)}
              placeholder="20"
              min={1}
            />
            <Input
              label="Apresentações por sessão"
              type="number"
              value={presentationsPerBlock}
              onChange={(e) => setPresentationsPerBlock(e.target.value)}
              placeholder="6"
              min={1}
            />
          </div>

          <div className={styles.fieldGroup}>
            <label className={styles.label}>Texto da chamada</label>
            <textarea
              className={styles.textarea}
              value={callForPapersText}
              onChange={(e) => setCallForPapersText(e.target.value)}
              placeholder="Texto da chamada para trabalhos"
              rows={3}
            />
          </div>

          <Input
            label="Data limite para submissão"
            type="datetime-local"
            value={submissionDeadline}
            onChange={(e) => setSubmissionDeadline(e.target.value)}
            error={errors.submissionDeadline}
          />

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
      </div>

      <Modal
        isOpen={successOpen}
        onClose={handleSuccessClose}
        title="Salvo com Sucesso!"
        variant="success"
      >
        <p>A edição foi salva com sucesso.</p>
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

export default function EdicaoForm(props: EdicaoFormProps) {
  return <EdicaoFormInner key={`${props.mode}-${props.editionId || "new"}`} {...props} />;
}
