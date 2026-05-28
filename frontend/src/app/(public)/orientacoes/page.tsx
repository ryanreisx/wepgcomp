"use client";

import { useState, useEffect } from "react";
import HeroBanner from "@/components/ui/HeroBanner";
import Tabs from "@/components/ui/Tabs";
import * as eventEditionService from "@/services/event-edition.service";
import * as guidanceService from "@/services/guidance.service";
import { Guidance } from "@/services/guidance.service";
import styles from "./orientacoes.module.css";

const TABS = [
  { label: "Autores", value: "autores" },
  { label: "Avaliadores", value: "avaliadores" },
  { label: "Audiência", value: "audiencia" },
];

export default function OrientacoesPage() {
  const [activeTab, setActiveTab] = useState("autores");
  const [guidance, setGuidance] = useState<Guidance | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        const edRes = await eventEditionService.getActiveEventEdition();
        const ed = edRes.data.data;
        const guidRes = await guidanceService.getGuidancesByEdition(ed.id);
        if (guidRes.data.data.length > 0) {
          setGuidance(guidRes.data.data[0]);
        }
      } catch {
        // API unavailable — fallback content renders
      }
    }
    loadData();
  }, []);

  function getTabContent(): string | null {
    if (!guidance) return null;
    switch (activeTab) {
      case "autores":
        return guidance.authorGuidance || null;
      case "avaliadores":
        return guidance.reviewerGuidance || null;
      case "audiencia":
        return guidance.audienceGuidance || null;
      default:
        return null;
    }
  }

  const content = getTabContent();

  return (
    <>
      <HeroBanner
        title="Orientações"
        backgroundImage="/images/hero-orientacoes.jpg"
      />

      <section className={styles.content}>
        <div className="container">
          <Tabs
            tabs={TABS}
            activeTab={activeTab}
            onTabChange={setActiveTab}
            className={styles.tabs}
          />

          {content ? (
            <div
              className={styles.tabContent}
              dangerouslySetInnerHTML={{ __html: content }}
            />
          ) : (
            <p className={styles.fallback}>Conteúdo em breve.</p>
          )}

          <hr className={styles.separator} />
        </div>
      </section>
    </>
  );
}
