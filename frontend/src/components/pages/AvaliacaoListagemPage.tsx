"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import HeroBanner from "@/components/ui/HeroBanner";
import SearchBar from "@/components/ui/SearchBar";
import Tabs from "@/components/ui/Tabs";
import Button from "@/components/ui/Button";
import FavoriteToggle from "@/components/ui/FavoriteToggle";
import { useAuth } from "@/hooks/useAuth";
import { Submission } from "@/types/submission";
import { User } from "@/types/user";
import { Presentation } from "@/types/presentation";
import { getActiveEventEdition } from "@/services/event-edition.service";
import { getUsers } from "@/services/user.service";
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

  const [isLoading, setIsLoading] = useState(true);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [subToPres, setSubToPres] = useState<Record<string, string>>({});
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

        const presentations = presRes.data.data as (Presentation & { submission: Submission })[];
        setSubmissions(presentations.map((p) => p.submission));

        const map: Record<string, string> = {};
        presentations.forEach((p) => {
          map[p.submissionId] = p.id;
        });
        setSubToPres(map);

        try {
          const usersRes = await getUsers();
          if (!cancelled) setUsers(usersRes.data.data);
        } catch {
          // users endpoint requires auth — proceed without author names
        }

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

  const getAuthorName = (authorId: string): string => {
    const u = users.find((usr) => usr.id === authorId);
    return u?.name || "";
  };

  const handleFavoriteChange = (presentationId: string, next: boolean) => {
    setBookmarkedPresIds((prev) => {
      const s = new Set(prev);
      if (next) s.add(presentationId);
      else s.delete(presentationId);
      return s;
    });
  };

  const allFiltered = submissions.filter((s) =>
    s.title.toLowerCase().includes(search.toLowerCase())
  );

  const tabFiltered =
    activeTab === "favorites"
      ? allFiltered.filter((s) => {
          const presId = subToPres[s.id];
          return presId && bookmarkedPresIds.has(presId);
        })
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
              {displayed.map((sub) => {
                const presId = subToPres[sub.id];
                const isFav = presId ? bookmarkedPresIds.has(presId) : false;

                return (
                  <div
                    key={sub.id}
                    className={styles.cardRow}
                    onClick={() =>
                      router.push(`/ouvinte/avaliacao/${sub.id}`)
                    }
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === "Enter")
                        router.push(`/ouvinte/avaliacao/${sub.id}`);
                    }}
                  >
                    <div className={styles.cardContent}>
                      <h3 className={styles.cardTitle}>{sub.title}</h3>
                      <p className={styles.cardSubtitle}>
                        {getAuthorName(sub.mainAuthorId)}
                      </p>
                    </div>
                    {isAuthenticated && presId && (
                      <FavoriteToggle
                        presentationId={presId}
                        initialIsFavorite={isFav}
                        onChange={(next) =>
                          handleFavoriteChange(presId, next)
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
