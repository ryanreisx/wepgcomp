"use client";

import { useState, useEffect, useCallback } from "react";
import HeroBanner from "@/components/ui/HeroBanner";
import SearchBar from "@/components/ui/SearchBar";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import Modal from "@/components/ui/Modal";
import ApresentacaoEditModal from "@/components/forms/ApresentacaoEditModal";
import { Submission } from "@/types/submission";
import { User } from "@/types/user";
import { PresentationBlock } from "@/types/presentation";
import { getSubmissions, updateSubmission } from "@/services/submission.service";
import { getUsers, getProfessors } from "@/services/user.service";
import { getActiveEventEdition } from "@/services/event-edition.service";
import { getPresentationBlocksByEdition } from "@/services/presentation.service";
import type { ApresentacaoFormData } from "@/components/forms/ApresentacaoEditModal";
import styles from "./ApresentacoesAdminPage.module.css";

const INITIAL_DISPLAY_COUNT = 5;

export default function ApresentacoesAdminPage() {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [professors, setProfessors] = useState<User[]>([]);
  const [blocks, setBlocks] = useState<PresentationBlock[]>([]);
  const [editionId, setEditionId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showAll, setShowAll] = useState(false);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingSubmission, setEditingSubmission] = useState<Submission | null>(null);

  const [successOpen, setSuccessOpen] = useState(false);
  const [errorOpen, setErrorOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const loadSubmissions = useCallback(async (eid: string) => {
    const res = await getSubmissions(eid);
    setSubmissions(res.data.data);
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function init() {
      try {
        const editionRes = await getActiveEventEdition();
        const eid = editionRes.data.data.id;
        if (cancelled) return;
        setEditionId(eid);

        const [subsRes, blocksRes] = await Promise.all([
          getSubmissions(eid),
          getPresentationBlocksByEdition(eid),
        ]);

        if (cancelled) return;
        setSubmissions(subsRes.data.data);
        setBlocks(blocksRes.data.data);

        let allUsers: User[] = [];
        try {
          const usersRes = await getUsers();
          allUsers = usersRes.data.data;
        } catch {
          // fallback: ignored
        }

        if (cancelled) return;
        setUsers(allUsers);

        try {
          const profsRes = await getProfessors();
          if (!cancelled) setProfessors(profsRes.data.data);
        } catch {
          if (!cancelled) {
            setProfessors(allUsers.filter((u: User) => u.profile === "Professor"));
          }
        }
      } catch {
        // silent — user sees empty state
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    init();
    return () => {
      cancelled = true;
    };
  }, []);

  const filtered = submissions.filter((s) =>
    s.title.toLowerCase().includes(search.toLowerCase())
  );

  const displayed = showAll
    ? filtered
    : filtered.slice(0, INITIAL_DISPLAY_COUNT);

  const getAuthorName = (authorId: string): string => {
    const user = users.find((u) => u.id === authorId);
    return user?.name || "";
  };

  const openEditModal = (submission: Submission) => {
    setEditingSubmission(submission);
    setModalOpen(true);
  };

  const handleSave = async (data: ApresentacaoFormData) => {
    if (!editingSubmission || !editionId) return;

    const dto = {
      title: data.title,
      abstract: data.abstract,
      advisorId: data.advisorId,
      proposedPresentationBlockId: data.proposedPresentationBlockId || undefined,
    };

    try {
      await updateSubmission(editingSubmission.id, dto, data.pdfFile || undefined);
      await loadSubmissions(editionId);
      setModalOpen(false);
      setSuccessOpen(true);
    } catch (err: unknown) {
      const msg =
        err && typeof err === "object" && "response" in err
          ? ((err as { response: { data: { message?: string } } }).response?.data
              ?.message ?? "Erro ao salvar apresentação.")
          : "Erro ao salvar apresentação.";
      setErrorMessage(msg);
      setErrorOpen(true);
      throw err;
    }
  };

  return (
    <>
      <HeroBanner title="Apresentações" />

      <div className={styles.container}>
        <div className={styles.toolbar}>
          <Button
            variant="filled"
            color="secondary"
            className={styles.addBtn}
          >
            + Incluir Apresentação
          </Button>
          <SearchBar
            value={search}
            onChange={setSearch}
            placeholder="Pesquise pelo nome da apresentação"
          />
        </div>

        {isLoading && <p className={styles.loading}>Carregando apresentações...</p>}

        {!isLoading && filtered.length === 0 && (
          <p className={styles.empty}>Nenhuma apresentação encontrada.</p>
        )}

        {!isLoading && filtered.length > 0 && (
          <>
            <div className={styles.list}>
              {displayed.map((sub) => (
                <Card
                  key={sub.id}
                  title={sub.title}
                  subtitle={getAuthorName(sub.mainAuthorId)}
                  onEdit={() => openEditModal(sub)}
                />
              ))}
            </div>

            {!showAll && filtered.length > INITIAL_DISPLAY_COUNT && (
              <div className={styles.showAllWrapper}>
                <Button
                  variant="outline"
                  color="primary"
                  onClick={() => setShowAll(true)}
                >
                  Veja todas as apresentações
                </Button>
              </div>
            )}
          </>
        )}
      </div>

      {editingSubmission && (
        <ApresentacaoEditModal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          onSave={handleSave}
          submission={editingSubmission}
          authorName={getAuthorName(editingSubmission.mainAuthorId)}
          authorPhoto={users.find((u) => u.id === editingSubmission.mainAuthorId)?.photoFilePath || null}
          professors={professors}
          blocks={blocks}
        />
      )}

      <Modal
        isOpen={successOpen}
        onClose={() => setSuccessOpen(false)}
        title="Salvo com Sucesso!"
        variant="success"
      >
        <p>A apresentação foi salva com sucesso.</p>
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
