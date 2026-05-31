"use client";

import { useState, useEffect } from "react";
import HeroBanner from "@/components/ui/HeroBanner";
import SearchBar from "@/components/ui/SearchBar";
import RankingCard from "@/components/ui/RankingCard";
import { useAuth } from "@/hooks/useAuth";
import { RankingEntry, Presentation, PresentationBlock, Panelist } from "@/types/presentation";
import { Submission } from "@/types/submission";
import { User } from "@/types/user";
import { getActiveEventEdition } from "@/services/event-edition.service";
import {
  getRanking,
  getPresentationsByEdition,
  getPresentationBlocksByEdition,
} from "@/services/presentation.service";
import { getPanelistsByBlock } from "@/services/panelist.service";
import { getSubmissions } from "@/services/submission.service";
import { getUsers } from "@/services/user.service";
import styles from "./PremiacaoPage.module.css";

type TabKey = "banca" | "avaliadores" | "publico" | "minhas-bancas";

interface TabConfig {
  key: TabKey;
  label: string;
  title: string;
  subtitle: string;
}

const TABS: TabConfig[] = [
  {
    key: "banca",
    label: "Banca",
    title: "Melhores Apresentações - Banca",
    subtitle: "Ranking baseado nas avaliações dos membros da banca avaliadora.",
  },
  {
    key: "avaliadores",
    label: "Avaliadores",
    title: "Melhores Apresentações - Avaliadores",
    subtitle: "Ranking baseado nas avaliações de todos os avaliadores.",
  },
  {
    key: "publico",
    label: "Público",
    title: "Melhores Apresentações - Público",
    subtitle: "Ranking baseado nas avaliações do público geral.",
  },
];

const MINHAS_BANCAS_TAB: TabConfig = {
  key: "minhas-bancas",
  label: "Minhas bancas",
  title: "Minhas bancas",
  subtitle: "Apresentações das sessões em que você atuou como avaliador(a).",
};

const SESSION_COLORS: ("green" | "orange" | "blue")[] = ["green", "orange", "blue"];

function getSessionColor(blockId: string): "green" | "orange" | "blue" {
  let hash = 0;
  for (let i = 0; i < blockId.length; i++) {
    hash = (hash * 31 + blockId.charCodeAt(i)) | 0;
  }
  return SESSION_COLORS[Math.abs(hash) % 3];
}

interface MyBancaEntry {
  submissionId: string;
  title: string;
  authorName: string;
  averageScore: number;
  presentationBlockId: string;
}

export default function PremiacaoPage() {
  const { user } = useAuth();

  const [activeTab, setActiveTab] = useState<TabKey>("banca");
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  const [bancaRanking, setBancaRanking] = useState<RankingEntry[]>([]);
  const [avaliadoresRanking, setAvaliadoresRanking] = useState<RankingEntry[]>([]);
  const [publicoRanking, setPublicoRanking] = useState<RankingEntry[]>([]);
  const [minhasBancas, setMinhasBancas] = useState<MyBancaEntry[]>([]);
  const [showMinhasBancas, setShowMinhasBancas] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const editionRes = await getActiveEventEdition();
        const eid = editionRes.data.data.id;

        const [bancaRes, avaliadoresRes, publicoRes] = await Promise.all([
          getRanking(eid, "panelists"),
          getRanking(eid, "all"),
          getRanking(eid, "public"),
        ]);

        if (cancelled) return;
        setBancaRanking(bancaRes.data.data);
        setAvaliadoresRanking(avaliadoresRes.data.data);
        setPublicoRanking(publicoRes.data.data);

        if (user) {
          const blocksRes = await getPresentationBlocksByEdition(eid);
          const presentationBlocks = blocksRes.data.data.filter(
            (b: PresentationBlock) => b.type === "Presentation"
          );

          const userPanelBlockIds: string[] = [];
          for (const block of presentationBlocks) {
            const panelistsRes = await getPanelistsByBlock(block.id);
            const panelists: Panelist[] = panelistsRes.data.data;
            if (panelists.some((p) => p.userId === user.id)) {
              userPanelBlockIds.push(block.id);
            }
          }

          if (cancelled) return;

          if (userPanelBlockIds.length > 0) {
            const [presRes, subsRes, usersRes] = await Promise.all([
              getPresentationsByEdition(eid),
              getSubmissions(eid),
              getUsers(),
            ]);

            if (cancelled) return;

            const presentations: Presentation[] = presRes.data.data;
            const submissions: Submission[] = subsRes.data.data;
            const allUsers: User[] = usersRes.data.data;

            const entries: MyBancaEntry[] = [];
            for (const pres of presentations) {
              if (!userPanelBlockIds.includes(pres.presentationBlockId)) continue;
              const sub = submissions.find((s) => s.id === pres.submissionId);
              if (!sub) continue;
              const author = allUsers.find((u) => u.id === sub.mainAuthorId);
              entries.push({
                submissionId: pres.submissionId,
                title: sub.title,
                authorName: author?.name || "",
                averageScore: pres.evaluatorsAverageScore ?? 0,
                presentationBlockId: pres.presentationBlockId,
              });
            }

            entries.sort((a, b) => b.averageScore - a.averageScore);
            setMinhasBancas(entries);
            setShowMinhasBancas(true);
          }
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
  }, [user]);

  const tabs = showMinhasBancas ? [...TABS, MINHAS_BANCAS_TAB] : TABS;
  const currentTab = tabs.find((t) => t.key === activeTab) || TABS[0];

  const getCurrentRanking = (): (RankingEntry | MyBancaEntry)[] => {
    switch (activeTab) {
      case "banca":
        return bancaRanking;
      case "avaliadores":
        return avaliadoresRanking;
      case "publico":
        return publicoRanking;
      case "minhas-bancas":
        return minhasBancas;
      default:
        return [];
    }
  };

  const ranking = getCurrentRanking();
  const filtered = ranking.filter((r) =>
    r.title.toLowerCase().includes(search.toLowerCase()) ||
    r.authorName.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <>
      <HeroBanner title="Premiação" />

      <div className={styles.container}>
        <div className={styles.tabs}>
          {tabs.map((tab) => (
            <button
              key={tab.key}
              type="button"
              className={`${styles.tab} ${activeTab === tab.key ? styles.tabActive : styles.tabInactive}`}
              onClick={() => setActiveTab(tab.key)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <SearchBar
          value={search}
          onChange={setSearch}
          placeholder="Pesquise pelo nome da apresentação"
          className={styles.search}
        />

        <h2 className={styles.sectionTitle}>{currentTab.title}</h2>
        <p className={styles.sectionSubtitle}>{currentTab.subtitle}</p>

        {isLoading && <p className={styles.loading}>Carregando ranking...</p>}

        {!isLoading && filtered.length === 0 && (
          <p className={styles.empty}>Nenhuma apresentação encontrada.</p>
        )}

        {!isLoading && filtered.length > 0 && (
          <div className={styles.list}>
            {filtered.map((entry, index) => {
              const isMyBancas = activeTab === "minhas-bancas";
              const blockId = isMyBancas
                ? (entry as MyBancaEntry).presentationBlockId
                : undefined;

              return (
                <RankingCard
                  key={entry.submissionId}
                  position={index + 1}
                  title={entry.title}
                  authorName={entry.authorName}
                  score={entry.averageScore}
                  colorVariant={
                    isMyBancas && blockId ? getSessionColor(blockId) : "default"
                  }
                />
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}
