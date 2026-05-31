"use client";

import { useState, useEffect, useCallback } from "react";
import HeroBanner from "@/components/ui/HeroBanner";
import SearchBar from "@/components/ui/SearchBar";
import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";
import StatusBadge from "@/components/ui/StatusBadge";
import type { UserStatus } from "@/components/ui/StatusBadge";
import UsuarioStatusModal from "@/components/forms/UsuarioStatusModal";
import { User, UserLevel } from "@/types/user";
import {
  getUsers,
  approveUser,
  rejectUser,
  updateUserLevel,
} from "@/services/user.service";
import styles from "./UsuariosPage.module.css";

type PermissionLabel = "Sup Administrador" | "Administrador" | "Normal";

const LEVEL_TO_LABEL: Record<UserLevel, PermissionLabel> = {
  Superadmin: "Sup Administrador",
  Admin: "Administrador",
  Default: "Normal",
};

const LABEL_TO_LEVEL: Record<PermissionLabel, UserLevel> = {
  "Sup Administrador": "Superadmin",
  Administrador: "Admin",
  Normal: "Default",
};

function deriveStatus(user: User): UserStatus {
  if (user.isActive) return "Ativo";
  if (user.isVerified) return "Pendente";
  return "Inativo";
}

interface UserChange {
  status: UserStatus;
  level: UserLevel;
}

export default function UsuariosPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [activeFilters, setActiveFilters] = useState<Set<UserStatus>>(
    new Set(["Ativo", "Pendente", "Inativo"])
  );
  const [changes, setChanges] = useState<Record<string, UserChange>>({});

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successOpen, setSuccessOpen] = useState(false);
  const [errorOpen, setErrorOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const loadUsers = useCallback(async () => {
    try {
      const res = await getUsers();
      setUsers(res.data.data);
    } catch {
      // silent
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function init() {
      try {
        const res = await getUsers();
        if (!cancelled) {
          setUsers(res.data.data);
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
  }, []);

  const toggleFilter = (status: UserStatus) => {
    setActiveFilters((prev) => {
      const next = new Set(prev);
      if (next.has(status)) {
        next.delete(status);
      } else {
        next.add(status);
      }
      return next;
    });
  };

  const getCurrentStatus = (user: User): UserStatus => {
    return changes[user.id]?.status ?? deriveStatus(user);
  };

  const getCurrentLevel = (user: User): UserLevel => {
    return changes[user.id]?.level ?? user.level;
  };

  const handleStatusChange = (user: User, newStatus: UserStatus) => {
    const originalStatus = deriveStatus(user);
    const currentLevel = getCurrentLevel(user);

    setChanges((prev) => {
      const next = { ...prev };
      if (newStatus === originalStatus && currentLevel === user.level) {
        delete next[user.id];
      } else {
        next[user.id] = { status: newStatus, level: currentLevel };
      }
      return next;
    });
  };

  const handleLevelChange = (user: User, newLevel: UserLevel) => {
    const currentStatus = getCurrentStatus(user);
    const originalStatus = deriveStatus(user);

    setChanges((prev) => {
      const next = { ...prev };
      if (newLevel === user.level && currentStatus === originalStatus) {
        delete next[user.id];
      } else {
        next[user.id] = { status: currentStatus, level: newLevel };
      }
      return next;
    });
  };

  const filtered = users.filter((u) => {
    const status = getCurrentStatus(u);
    if (!activeFilters.has(status)) return false;
    return u.name.toLowerCase().includes(search.toLowerCase());
  });

  const changedCount = Object.keys(changes).length;

  const handleSave = () => {
    if (changedCount === 0) return;
    setConfirmOpen(true);
  };

  const handleConfirm = async () => {
    setIsSubmitting(true);
    try {
      const promises: Promise<unknown>[] = [];

      for (const [userId, change] of Object.entries(changes)) {
        const user = users.find((u) => u.id === userId);
        if (!user) continue;

        const originalStatus = deriveStatus(user);
        if (change.status !== originalStatus) {
          if (change.status === "Ativo") {
            promises.push(approveUser(userId));
          } else if (change.status === "Inativo") {
            promises.push(rejectUser(userId));
          }
        }

        if (change.level !== user.level) {
          promises.push(updateUserLevel(userId, change.level));
        }
      }

      await Promise.all(promises);
      setChanges({});
      setConfirmOpen(false);
      setSuccessOpen(true);
      await loadUsers();
    } catch (err: unknown) {
      const msg =
        err && typeof err === "object" && "response" in err
          ? ((err as { response: { data: { message?: string } } }).response?.data
              ?.message ?? "Erro ao salvar alterações.")
          : "Erro ao salvar alterações.";
      setConfirmOpen(false);
      setErrorMessage(msg);
      setErrorOpen(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <HeroBanner title="Gerenciamento de Usuários" />

      <div className={styles.container}>
        <SearchBar
          value={search}
          onChange={setSearch}
          placeholder="Pesquise pelo nome do usuário"
          className={styles.search}
        />

        <div className={styles.filters}>
          <StatusBadge
            status="Ativo"
            active={activeFilters.has("Ativo")}
            onClick={() => toggleFilter("Ativo")}
          />
          <StatusBadge
            status="Pendente"
            active={activeFilters.has("Pendente")}
            onClick={() => toggleFilter("Pendente")}
          />
          <StatusBadge
            status="Inativo"
            active={activeFilters.has("Inativo")}
            onClick={() => toggleFilter("Inativo")}
          />
        </div>

        <div className={styles.statusInfo}>
          <p>
            <strong>Ativo:</strong> Usuário com acesso liberado ao sistema.
          </p>
          <p>
            <strong>Pendente:</strong> Usuário aguardando aprovação de cadastro.
          </p>
          <p>
            <strong>Inativo:</strong> Usuário com acesso bloqueado ao sistema.
          </p>
        </div>

        {isLoading && <p className={styles.loading}>Carregando usuários...</p>}

        {!isLoading && filtered.length === 0 && (
          <p className={styles.empty}>Nenhum usuário encontrado.</p>
        )}

        {!isLoading && filtered.length > 0 && (
          <>
            <div className={styles.list}>
              {filtered.map((user) => {
                const status = getCurrentStatus(user);
                const level = getCurrentLevel(user);
                const isChanged = !!changes[user.id];

                return (
                  <div
                    key={user.id}
                    className={`${styles.userCard} ${isChanged ? styles.userCardChanged : ""}`}
                  >
                    <div className={styles.userName}>{user.name}</div>
                    <div className={styles.userControls}>
                      <div className={styles.controlGroup}>
                        <label className={styles.controlLabel}>Status</label>
                        <select
                          className={styles.select}
                          value={status}
                          onChange={(e) =>
                            handleStatusChange(
                              user,
                              e.target.value as UserStatus
                            )
                          }
                        >
                          <option value="Ativo">Ativo</option>
                          <option value="Pendente">Pendente</option>
                          <option value="Inativo">Inativo</option>
                        </select>
                      </div>
                      <div className={styles.controlGroup}>
                        <label className={styles.controlLabel}>Permissão</label>
                        <select
                          className={styles.select}
                          value={LEVEL_TO_LABEL[level]}
                          onChange={(e) =>
                            handleLevelChange(
                              user,
                              LABEL_TO_LEVEL[e.target.value as PermissionLabel]
                            )
                          }
                        >
                          <option value="Sup Administrador">
                            Sup Administrador
                          </option>
                          <option value="Administrador">Administrador</option>
                          <option value="Normal">Normal</option>
                        </select>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className={styles.saveWrapper}>
              <Button
                variant="filled"
                color="secondary"
                onClick={handleSave}
                disabled={changedCount === 0}
              >
                Salvar
              </Button>
            </div>
          </>
        )}
      </div>

      <UsuarioStatusModal
        isOpen={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={handleConfirm}
        changeCount={changedCount}
        isSubmitting={isSubmitting}
      />

      <Modal
        isOpen={successOpen}
        onClose={() => setSuccessOpen(false)}
        title="Salvo com Sucesso!"
        variant="success"
      >
        <p>As alterações foram salvas com sucesso.</p>
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
