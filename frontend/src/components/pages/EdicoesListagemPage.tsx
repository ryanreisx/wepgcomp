"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import HeroBanner from "@/components/ui/HeroBanner";
import SearchBar from "@/components/ui/SearchBar";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import { EventEdition } from "@/types/event-edition";
import { getEventEditions } from "@/services/event-edition.service";
import styles from "./EdicoesListagemPage.module.css";

const INITIAL_DISPLAY_COUNT = 5;

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
  if (start.getFullYear() === end.getFullYear()) {
    return `${dayStart} de ${monthStart} a ${dayEnd} de ${monthEnd} de ${year}`;
  }

  return `${dayStart} de ${monthStart} de ${start.getFullYear()} a ${dayEnd} de ${monthEnd} de ${year}`;
}

export default function EdicoesListagemPage() {
  const [editions, setEditions] = useState<EventEdition[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showAll, setShowAll] = useState(false);
  const router = useRouter();

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const res = await getEventEditions();
        if (!cancelled) setEditions(res.data.data);
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

  const filtered = editions.filter((e) =>
    e.name.toLowerCase().includes(search.toLowerCase())
  );

  const displayed = showAll
    ? filtered
    : filtered.slice(0, INITIAL_DISPLAY_COUNT);

  return (
    <>
      <HeroBanner title="Edições do Evento" />

      <div className={styles.container}>
        <div className={styles.toolbar}>
          <Button
            variant="filled"
            color="secondary"
            className={styles.addBtn}
            onClick={() => router.push("/superadmin/edicoes/nova")}
          >
            + Cadastrar Edição
          </Button>
          <SearchBar
            value={search}
            onChange={setSearch}
            placeholder="Pesquise pelo nome da edição"
          />
        </div>

        {isLoading && <p className={styles.loading}>Carregando edições...</p>}

        {!isLoading && filtered.length === 0 && (
          <p className={styles.empty}>Nenhuma edição encontrada.</p>
        )}

        {!isLoading && filtered.length > 0 && (
          <>
            <div className={styles.list}>
              {displayed.map((edition) => (
                <Card
                  key={edition.id}
                  title={edition.name}
                  subtitle={formatDateRange(edition.startDate, edition.endDate)}
                  onEdit={() =>
                    router.push(`/superadmin/edicoes/${edition.id}/editar`)
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
                  Ver todas as edições
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </>
  );
}
