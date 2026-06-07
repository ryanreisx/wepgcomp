"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import HeroBanner from "@/components/ui/HeroBanner";
import SearchBar from "@/components/ui/SearchBar";
import Tabs from "@/components/ui/Tabs";
import Button from "@/components/ui/Button";
import FavoriteToggle from "@/components/ui/FavoriteToggle";
import { useAuth } from "@/hooks/useAuth";
import { Presentation } from "@/types/presentation";
import { getActiveEventEdition } from "@/services/event-edition.service";
import { getPresentationsByEdition } from "@/services/presentation.service";
import { getMyBookmarks } from "@/services/favorite.service";
import styles from "./AvaliacaoListagemPage.module.css";

const TABS = [
  { label: "Todas as apresentações", value: "all" },
  { label: "Apenas favoritos", value: "favorites" },
];

const INITIAL_DISPLAY_COUNT = 5;

export default function AvaliacaoListagemPage() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const router = useRouter();

  interface PresentationItem {
    submissionId: string;
    presentationId: string;
    title: string;
    authorName: string;
  }

  const [isLoading, setIsLoading] = useState(true);
  const [items, setItems] = useState<PresentationItem[]>([]);
  const [bookmarkedPresIds, setBookmarkedPresIds] = useState<Set<string>>(
    new Set()
  );
  const [restrictToLogged, setRestrictToLogged] = useState(false);

  const [activeTab, setActiveTab] = useState("all");
  const [search, setSearch] = useState("");
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function init() {
      try {
        const editionRes = await getActiveEventEdition();
        const edition = editionRes.data.data;
        if (cancelled) return;

        setRestrictToLogged(edition.isEvaluationRestrictToLoggedUsers);

        if (edition.isEvaluationRestrictToLoggedUsers && !isAuthenticated && !authLoading) {
          router.replace("/login");
          return;
        }

        const presRes = await getPresentationsByEdition(edition.id);
        if (cancelled) return;

        const presentations = presRes.data.data as Presentation[];
        setItems(
          presentations.map((p) => ({
            submissionId: p.submissionId,
            presentationId: p.id,
            title: p.submission?.title || "",
            authorName: p.submission?.mainAuthor?.name || "",
          }))
        );

        if (isAuthenticated) {
          try {
            const bookRes = await getMyBookmarks();
            if (!cancelled) {
              setBookmarkedPresIds(
                new Set(bookRes.data.data.map((b) => b.id))
              );
            }
          } catch {
            // bookmarks unavailable — proceed without
          }
        }
      } catch {
        // silent
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    if (!authLoading) {
      init();
    }
    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, authLoading, router]);

  const handleFavoriteChange = (presentationId: string, next: boolean) => {
    setBookmarkedPresIds((prev) => {
      const s = new Set(prev);
      if (next) s.add(presentationId);
      else s.delete(presentationId);
      return s;
    });
  };

  const allFiltered = items.filter((item) =>
    item.title.toLowerCase().includes(search.toLowerCase())
  );

  const tabFiltered =
    activeTab === "favorites"
      ? allFiltered.filter((item) =>
          bookmarkedPresIds.has(item.presentationId)
        )
      : allFiltered;

  const displayed = showAll
    ? tabFiltered
    : tabFiltered.slice(0, INITIAL_DISPLAY_COUNT);

  if (authLoading) return null;

  if (restrictToLogged && !isAuthenticated) return null;

  return (
    <>
      <HeroBanner title="Avaliação" />

      <div className={styles.container}>
        {isAuthenticated && (
          <Tabs
            tabs={TABS}
            activeTab={activeTab}
            onTabChange={(v) => {
              setActiveTab(v);
              setShowAll(false);
            }}
          />
        )}

        <div className={styles.toolbar}>
          <SearchBar
            value={search}
            onChange={setSearch}
            placeholder="Pesquise pelo nome da apresentação"
          />
        </div>

        {isLoading && (
          <p className={styles.loading}>Carregando apresentações...</p>
        )}

        {!isLoading && tabFiltered.length === 0 && (
          <p className={styles.empty}>
            {activeTab === "favorites"
              ? "Você ainda não favoritou nenhuma apresentação. Favorite clicando na estrela dos cards da aba 'Todas as apresentações'."
              : "Nenhuma apresentação encontrada."}
          </p>
        )}

        {!isLoading && tabFiltered.length > 0 && (
          <>
            <div className={styles.list}>
              {displayed.map((item) => {
                const isFav = bookmarkedPresIds.has(item.presentationId);

                return (
                  <div
                    key={item.submissionId}
                    className={styles.cardRow}
                    onClick={() =>
                      router.push(`/ouvinte/avaliacao/${item.submissionId}`)
                    }
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === "Enter")
                        router.push(`/ouvinte/avaliacao/${item.submissionId}`);
                    }}
                  >
                    <div className={styles.cardContent}>
                      <h3 className={styles.cardTitle}>{item.title}</h3>
                      <p className={styles.cardSubtitle}>
                        {item.authorName}
                      </p>
                    </div>
                    {isAuthenticated && (
                      <FavoriteToggle
                        presentationId={item.presentationId}
                        initialIsFavorite={isFav}
                        onChange={(next) =>
                          handleFavoriteChange(item.presentationId, next)
                        }
                      />
                    )}
                  </div>
                );
              })}
            </div>

            {!showAll && tabFiltered.length > INITIAL_DISPLAY_COUNT && (
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
