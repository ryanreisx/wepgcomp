"use client";

import { useState, useEffect, FormEvent } from "react";
import Link from "next/link";
import Tabs from "@/components/ui/Tabs";
import * as eventEditionService from "@/services/event-edition.service";
import * as presentationService from "@/services/presentation.service";
import { EventEdition } from "@/types/event-edition";
import { PresentationBlock } from "@/types/presentation";
import styles from "./home.module.css";

function formatDateLabel(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString("pt-BR", { day: "numeric", month: "long" });
}

function formatTime(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function groupBlocksByDate(
  blocks: PresentationBlock[]
): Record<string, PresentationBlock[]> {
  const groups: Record<string, PresentationBlock[]> = {};
  blocks.forEach((block) => {
    const dateKey = block.startTime.split("T")[0];
    if (!groups[dateKey]) groups[dateKey] = [];
    groups[dateKey].push(block);
  });
  Object.values(groups).forEach((g) =>
    g.sort((a, b) => a.startTime.localeCompare(b.startTime))
  );
  return groups;
}

export default function Home() {
  const [edition, setEdition] = useState<EventEdition | null>(null);
  const [blocks, setBlocks] = useState<PresentationBlock[]>([]);
  const [activeTab, setActiveTab] = useState("");
  const [contactName, setContactName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactMessage, setContactMessage] = useState("");

  useEffect(() => {
    async function loadData() {
      try {
        const res = await eventEditionService.getActiveEventEdition();
        const ed = res.data.data;
        setEdition(ed);

        const blocksRes =
          await presentationService.getPresentationBlocksByEdition(ed.id);
        setBlocks(blocksRes.data.data);
      } catch {
        // API unavailable — static content renders as fallback
      }
    }
    loadData();
  }, []);

  const blocksByDate = groupBlocksByDate(blocks);
  const dates = Object.keys(blocksByDate).sort();
  const tabs = dates.map((d) => ({
    label: formatDateLabel(d),
    value: d,
  }));
  const currentTab = activeTab || dates[0] || "";
  const currentBlocks = blocksByDate[currentTab] || [];

  const editionYear = edition
    ? new Date(edition.startDate).getFullYear()
    : new Date().getFullYear();

  function handleContactSubmit(e: FormEvent) {
    e.preventDefault();
  }

  return (
    <>
      {/* Hero */}
      <section className={styles.hero} data-testid="hero-section">
        <div className={styles.heroOverlay} />
        <div className={styles.heroContent}>
          <h1 className={styles.heroTitle}>
            {edition?.name || `WEPGCOMP ${editionYear}`}
          </h1>
          <p className={styles.heroSubtitle}>
            Workshop de Estudantes da Pós-Graduação em Ciência da Computação do
            PGCOMP-UFBA
          </p>
          {edition && (
            <p className={styles.heroDate}>
              de {formatDateLabel(edition.startDate)} a{" "}
              {formatDateLabel(edition.endDate)} de {editionYear}
            </p>
          )}
          <Link href="/programacao" className={styles.heroCta}>
            Confira a Programação
          </Link>
        </div>
      </section>

      {/* Programação */}
      <section className={styles.programacao} data-testid="programacao-section">
        <div className="container">
          <h2 className={styles.sectionTitle}>Programação</h2>
          <p className={styles.programacaoSubtitle}>
            Confira a grade de apresentações do evento
          </p>

          {tabs.length > 0 && (
            <>
              <Tabs
                tabs={tabs}
                activeTab={currentTab}
                onTabChange={setActiveTab}
                className={styles.programacaoTabs}
              />
              <div className={styles.scheduleContainer}>
                <div className={styles.roomHeader}>SALA A</div>
                {currentBlocks.map((block) => (
                  <div key={block.id} className={styles.scheduleRow}>
                    <div className={styles.scheduleTime}>
                      {formatTime(block.startTime)}
                    </div>
                    {block.type === "General" ? (
                      <div
                        className={`${styles.scheduleCard} ${styles.scheduleCardGeneral}`}
                      >
                        <div>
                          <p className={styles.generalTitle}>{block.title}</p>
                          {block.speakerName && (
                            <p className={styles.generalSubtitle}>
                              {block.speakerName}
                            </p>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className={styles.scheduleCard}>
                        <div className={styles.presenterAvatar} />
                        <div>
                          <p className={styles.presenterName}>
                            Nome(s) Apresentador(a)(s)
                          </p>
                          <p className={styles.presenterTitle}>
                            {block.title || "Título da pesquisa"}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </section>

      {/* Orientações */}
      <section
        className={styles.orientacoes}
        data-testid="orientacoes-section"
      >
        <div className={styles.orientacoesContent}>
          <h2 className={styles.orientacoesTitle}>Orientações</h2>
          <p className={styles.orientacoesText}>
            Este evento é uma excelente oportunidade para estudantes
            apresentarem e discutirem suas pesquisas, além de receberem feedback
            valioso de colegas e professores.
            <br />
            Clique em Ver todas as orientações para ter mais informações sobre o
            evento
          </p>
          <p className={styles.orientacoesDatesTitle}>Datas Importantes:</p>
          <ul className={styles.orientacoesList}>
            {edition ? (
              <>
                <li>
                  Data limite para submissão:{" "}
                  {formatDateLabel(edition.submissionDeadline)} de{" "}
                  {new Date(edition.submissionDeadline).getFullYear()}.
                </li>
                <li>
                  O evento será realizado de{" "}
                  {formatDateLabel(edition.startDate)} a{" "}
                  {formatDateLabel(edition.endDate)} de {editionYear}.
                </li>
              </>
            ) : (
              <>
                <li>Data limite para submissão: a definir.</li>
                <li>Data do evento: a definir.</li>
              </>
            )}
          </ul>
          <Link href="/orientacoes" className={styles.orientacoesBtn}>
            Ver todas as orientações
          </Link>
        </div>
      </section>

      {/* Organização */}
      <section
        className={styles.organizacao}
        data-testid="organizacao-section"
      >
        <div className="container">
          <h2 className={styles.sectionTitleDark}>Organização</h2>
          <div className={styles.orgList}>
            <p className={styles.orgItem}>
              <span className={styles.orgRole}>Coordenação geral:</span>{" "}
              {edition?.description || "A definir"}
            </p>
            <p className={styles.orgItem}>
              <span className={styles.orgRole}>Comissão organizadora:</span> A
              definir
            </p>
            <p className={styles.orgItem}>
              <span className={styles.orgRole}>Apoio à TI:</span> A definir
            </p>
            <p className={styles.orgItem}>
              <span className={styles.orgRole}>Comunicação:</span> A definir
            </p>
            <p className={styles.orgItem}>
              <span className={styles.orgRole}>Apoio administrativo:</span> A
              definir
            </p>
          </div>
        </div>
      </section>

      {/* Contato + Local */}
      <section className={styles.contatoLocal} data-testid="contato-section">
        <div className="container">
          <div className="row">
            <div className="col-md-6">
              <h2 className={styles.contatoTitle}>Contato</h2>
              <form
                className={styles.contatoForm}
                onSubmit={handleContactSubmit}
              >
                <div className="row">
                  <div className="col-6">
                    <label
                      className={styles.contatoLabel}
                      htmlFor="contactName"
                    >
                      Nome:
                    </label>
                    <input
                      id="contactName"
                      type="text"
                      className={styles.contatoInput}
                      placeholder="Insira seu nome"
                      value={contactName}
                      onChange={(e) => setContactName(e.target.value)}
                    />
                  </div>
                  <div className="col-6">
                    <label
                      className={styles.contatoLabel}
                      htmlFor="contactEmail"
                    >
                      E-mail:
                    </label>
                    <input
                      id="contactEmail"
                      type="email"
                      className={styles.contatoInput}
                      placeholder="Insira seu e-mail:"
                      value={contactEmail}
                      onChange={(e) => setContactEmail(e.target.value)}
                    />
                  </div>
                </div>
                <div>
                  <label
                    className={styles.contatoLabel}
                    htmlFor="contactMessage"
                  >
                    Mensagem:
                  </label>
                  <textarea
                    id="contactMessage"
                    className={styles.contatoTextarea}
                    placeholder="Digite sua mensagem"
                    rows={5}
                    value={contactMessage}
                    onChange={(e) => setContactMessage(e.target.value)}
                  />
                </div>
                <button type="submit" className={styles.contatoSubmit}>
                  Enviar
                </button>
              </form>
            </div>
            <div className="col-md-6">
              <h2 className={styles.contatoTitle}>Local do Evento</h2>
              <p className={styles.localAddress}>
                <strong>Instituto de computação da UFBA – PAF 2</strong>
                <br />
                Avenida Milton Santos, s/n - Campus de Ondina
                <br />
                CEP 40.170-110, Salvador - Bahia.
              </p>
              <p className={styles.localEmail}>E-mail: ceapg-ic@ufba.br</p>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
