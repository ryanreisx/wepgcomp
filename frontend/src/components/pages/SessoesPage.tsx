"use client";

import { useState, useEffect, useCallback } from "react";
import HeroBanner from "@/components/ui/HeroBanner";
import SearchBar from "@/components/ui/SearchBar";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import Modal from "@/components/ui/Modal";
import SessaoModal from "@/components/forms/SessaoModal";
import type { SessaoFormData } from "@/components/forms/SessaoModal";
import { PresentationBlock } from "@/types/presentation";
import { Submission } from "@/types/submission";
import { Room, getRoomsByEdition } from "@/services/room.service";
import { User } from "@/types/user";
import { getUsers } from "@/services/user.service";
import { getActiveEventEdition } from "@/services/event-edition.service";
import { getSubmissions } from "@/services/submission.service";
import {
  getPresentationBlocksByEdition,
  createPresentationBlock,
  updatePresentationBlock,
  deletePresentationBlock,
} from "@/services/presentation.service";
import { createPanelist, getPanelistsByBlock, deletePanelist } from "@/services/panelist.service";
import { createPresentation, getPresentationsByEdition, deletePresentation } from "@/services/presentation.service";
import styles from "./SessoesPage.module.css";

const INITIAL_DISPLAY_COUNT = 5;

function formatBlockTime(block: PresentationBlock): string {
  const start = new Date(block.startTime);
  const end = new Date(start.getTime() + block.duration * 60000);
  const fmt = (d: Date) =>
    d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
  return `${fmt(start)} - ${fmt(end)}`;
}

export default function SessoesPage() {
  const [blocks, setBlocks] = useState<PresentationBlock[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [professors, setProfessors] = useState<User[]>([]);
  const [editionId, setEditionId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showAll, setShowAll] = useState(false);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingBlock, setEditingBlock] = useState<PresentationBlock | null>(null);

  const [successOpen, setSuccessOpen] = useState(false);
  const [errorOpen, setErrorOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deletingBlockId, setDeletingBlockId] = useState<string | null>(null);

  const loadBlocks = useCallback(async (eid: string) => {
    const res = await getPresentationBlocksByEdition(eid);
    setBlocks(res.data.data);
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function init() {
      try {
        const editionRes = await getActiveEventEdition();
        const eid = editionRes.data.data.id;
        if (cancelled) return;
        setEditionId(eid);

        const [blocksRes, roomsRes, subsRes, usersRes] = await Promise.all([
          getPresentationBlocksByEdition(eid),
          getRoomsByEdition(eid),
          getSubmissions(eid),
          getUsers(),
        ]);

        if (cancelled) return;
        setBlocks(blocksRes.data.data);
        setRooms(roomsRes.data.data);
        setSubmissions(subsRes.data.data);
        setProfessors(
          usersRes.data.data.filter((u: User) => u.profile === "Professor")
        );
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

  const filtered = blocks.filter((b) => {
    const label = b.title || b.speakerName || "";
    return label.toLowerCase().includes(search.toLowerCase());
  });

  const displayed = showAll
    ? filtered
    : filtered.slice(0, INITIAL_DISPLAY_COUNT);

  const openCreateModal = () => {
    setEditingBlock(null);
    setModalOpen(true);
  };

  const openEditModal = (block: PresentationBlock) => {
    setEditingBlock(block);
    setModalOpen(true);
  };

  const handleSave = async (data: SessaoFormData) => {
    if (!editionId) return;

    const start = new Date(data.startTime);
    const end = new Date(data.endTime);
    const duration = Math.round((end.getTime() - start.getTime()) / 60000);

    const dto = {
      eventEditionId: editionId,
      type: data.type,
      title: data.title,
      speakerName: data.speakerName,
      roomId: data.roomId,
      startTime: data.startTime,
      duration,
    };

    try {
      if (editingBlock) {
        await updatePresentationBlock(editingBlock.id, {
          type: dto.type,
          title: dto.title,
          speakerName: dto.speakerName,
          roomId: dto.roomId,
          startTime: dto.startTime,
          duration: dto.duration,
        });

        if (data.type === "Presentation") {
          await syncPanelists(editingBlock.id, data.panelistUserIds || []);
          await syncPresentations(editingBlock.id, data.submissionIds || []);
        }
      } else {
        const res = await createPresentationBlock(dto);
        const newBlockId = res.data.data.id;

        if (data.type === "Presentation") {
          for (const userId of data.panelistUserIds || []) {
            await createPanelist({ presentationBlockId: newBlockId, userId });
          }
          const subs = data.submissionIds || [];
          for (let i = 0; i < subs.length; i++) {
            await createPresentation({
              submissionId: subs[i],
              presentationBlockId: newBlockId,
              positionWithinBlock: i + 1,
            });
          }
        }
      }

      await loadBlocks(editionId);
      setModalOpen(false);
      setSuccessOpen(true);
    } catch (err: unknown) {
      const msg =
        err && typeof err === "object" && "response" in err
          ? ((err as { response: { data: { message?: string } } }).response?.data
              ?.message ?? "Erro ao salvar sessão.")
          : "Erro ao salvar sessão.";
      setErrorMessage(msg);
      setErrorOpen(true);
      throw err;
    }
  };

  const syncPanelists = async (blockId: string, userIds: string[]) => {
    const existing = await getPanelistsByBlock(blockId);
    const current = existing.data.data;

    for (const p of current) {
      if (!userIds.includes(p.userId)) {
        await deletePanelist(p.id);
      }
    }

    const currentUserIds = current.map((p) => p.userId);
    for (const userId of userIds) {
      if (!currentUserIds.includes(userId)) {
        await createPanelist({ presentationBlockId: blockId, userId });
      }
    }
  };

  const syncPresentations = async (blockId: string, submissionIds: string[]) => {
    if (!editionId) return;
    const existing = await getPresentationsByEdition(editionId);
    const blockPresentations = existing.data.data.filter(
      (p) => p.presentationBlockId === blockId
    );

    for (const p of blockPresentations) {
      if (!submissionIds.includes(p.submissionId)) {
        await deletePresentation(p.id);
      }
    }

    const currentSubIds = blockPresentations.map((p) => p.submissionId);
    let position = blockPresentations.length + 1;
    for (const subId of submissionIds) {
      if (!currentSubIds.includes(subId)) {
        await createPresentation({
          submissionId: subId,
          presentationBlockId: blockId,
          positionWithinBlock: position++,
        });
      }
    }
  };

  const confirmDelete = (blockId: string) => {
    setDeletingBlockId(blockId);
    setDeleteConfirmOpen(true);
  };

  const handleDelete = async () => {
    if (!deletingBlockId || !editionId) return;
    try {
      await deletePresentationBlock(deletingBlockId);
      await loadBlocks(editionId);
      setDeleteConfirmOpen(false);
      setDeletingBlockId(null);
    } catch (err: unknown) {
      const msg =
        err && typeof err === "object" && "response" in err
          ? ((err as { response: { data: { message?: string } } }).response?.data
              ?.message ?? "Erro ao excluir sessão.")
          : "Erro ao excluir sessão.";
      setDeleteConfirmOpen(false);
      setErrorMessage(msg);
      setErrorOpen(true);
    }
  };

  const blockLabel = (b: PresentationBlock): string => {
    if (b.type === "General" && b.title) return b.title;
    if (b.type === "Presentation") return b.title || "Sessão de apresentações";
    return "Sessão";
  };

  return (
    <>
      <HeroBanner title="Sessões" />

      <div className={styles.container}>
        <div className={styles.toolbar}>
          <Button
            variant="filled"
            color="secondary"
            className={styles.addBtn}
            onClick={openCreateModal}
          >
            + Incluir Sessão
          </Button>
          <SearchBar
            value={search}
            onChange={setSearch}
            placeholder="Pesquise pelo nome da sessão"
          />
        </div>

        {isLoading && <p className={styles.loading}>Carregando sessões...</p>}

        {!isLoading && filtered.length === 0 && (
          <p className={styles.empty}>Nenhuma sessão encontrada.</p>
        )}

        {!isLoading && filtered.length > 0 && (
          <>
            <div className={styles.list}>
              {displayed.map((block) => (
                <Card
                  key={block.id}
                  title={blockLabel(block)}
                  subtitle={formatBlockTime(block)}
                  onEdit={() => openEditModal(block)}
                  onDelete={() => confirmDelete(block.id)}
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
                  Veja todas as sessões
                </Button>
              </div>
            )}
          </>
        )}
      </div>

      <SessaoModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSave={handleSave}
        editingBlock={editingBlock}
        rooms={rooms}
        submissions={submissions}
        professors={professors}
        existingBlocks={blocks}
      />

      <Modal
        isOpen={successOpen}
        onClose={() => setSuccessOpen(false)}
        title="Salvo com Sucesso!"
        variant="success"
      >
        <p>A sessão foi salva com sucesso.</p>
      </Modal>

      <Modal
        isOpen={errorOpen}
        onClose={() => setErrorOpen(false)}
        title="Erro"
        variant="error"
      >
        <p>{errorMessage}</p>
      </Modal>

      <Modal
        isOpen={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
        title="ATENÇÃO"
        variant="confirmation"
      >
        <p>Tem certeza que deseja excluir esta sessão?</p>
        <div style={{ display: "flex", gap: "0.75rem", justifyContent: "flex-end", marginTop: "1rem" }}>
          <Button
            variant="outline"
            color="primary"
            onClick={() => setDeleteConfirmOpen(false)}
          >
            Cancelar
          </Button>
          <Button variant="filled" color="secondary" onClick={handleDelete}>
            Confirmar
          </Button>
        </div>
      </Modal>
    </>
  );
}
