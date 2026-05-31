"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import HeroBanner from "@/components/ui/HeroBanner";
import SearchBar from "@/components/ui/SearchBar";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import { Submission } from "@/types/submission";
import { useAuth } from "@/hooks/useAuth";
import { getMySubmissions } from "@/services/submission.service";
import styles from "./MinhasApresentacoesPage.module.css";

const INITIAL_DISPLAY_COUNT = 5;

export default function MinhasApresentacoesPage() {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showAll, setShowAll] = useState(false);
  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    let cancelled = false;

    async function loadMySubmissions() {
      try {
        const res = await getMySubmissions();
        if (!cancelled) {
          setSubmissions(res.data.data);
        }
      } catch {
        // silent — user sees empty state
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    loadMySubmissions();
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

  return (
    <>
      <HeroBanner title="Minhas apresentações" />

      <div className={styles.container}>
        <div className={styles.toolbar}>
          <Button
            variant="filled"
            color="secondary"
            className={styles.addBtn}
            onClick={() => router.push("/aluno/apresentacoes/nova")}
          >
            + Incluir Apresentação
          </Button>
          <SearchBar
            value={search}
            onChange={setSearch}
            placeholder="Pesquise pelo nome da apresentação"
          />
        </div>

        {isLoading && (
          <p className={styles.loading}>Carregando apresentações...</p>
        )}

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
                  subtitle={user?.name || ""}
                  onEdit={() =>
                    router.push(`/aluno/apresentacoes/${sub.id}/editar`)
                  }
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
    </>
  );
}
