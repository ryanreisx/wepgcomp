"use client";

import { useState, useEffect, FormEvent } from "react";
import Link from "next/link";
import Tabs from "@/components/ui/Tabs";
import Modal from "@/components/ui/Modal";
import * as eventEditionService from "@/services/event-edition.service";
import * as presentationService from "@/services/presentation.service";
import { sendContact } from "@/services/contact.service";
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

const HERO_SLIDES = [
  {
    bg: "/images/hero-salvador.jpg",
    overlay: "linear-gradient(135deg, #3d6b82 0%, #c04040 100%)",
  },
  {
    bg: "/images/hero-carousel-2.png",
    overlay: "linear-gradient(135deg, #a03040 0%, #c0a030 100%)",
  },
  {
    bg: "/images/hero-carousel-3.png",
    overlay: "linear-gradient(135deg, #b09030 0%, #4a7090 100%)",
  },
];

export default function Home() {
  const [edition, setEdition] = useState<EventEdition | null>(null);
  const [blocks, setBlocks] = useState<PresentationBlock[]>([]);
  const [activeTab, setActiveTab] = useState("");
  const [contactName, setContactName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactMessage, setContactMessage] = useState("");
  const [contactErrors, setContactErrors] = useState<Record<string, string>>(
    {}
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successModalOpen, setSuccessModalOpen] = useState(false);
  const [errorModalOpen, setErrorModalOpen] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % HERO_SLIDES.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

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

  async function handleContactSubmit(e: FormEvent) {
    e.preventDefault();

    const errors: Record<string, string> = {};
    if (!contactName.trim()) {
      errors.name = "Informe seu nome.";
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!contactEmail.trim() || !emailRegex.test(contactEmail.trim())) {
      errors.email = "Informe um e-mail válido.";
    }
    if (!contactMessage.trim()) {
      errors.message = "Informe sua mensagem.";
    }

    if (Object.keys(errors).length > 0) {
      setContactErrors(errors);
      return;
    }

    setContactErrors({});
    setIsSubmitting(true);

    try {
      await sendContact({
        name: contactName.trim(),
        email: contactEmail.trim(),
        message: contactMessage.trim(),
      });
      setContactName("");
      setContactEmail("");
      setContactMessage("");
      setSuccessModalOpen(true);
    } catch (err: unknown) {
      const resp = (err as { response?: { status?: number; data?: { message?: string | string[] } } })?.response;
      if (resp?.status === 400 && Array.isArray(resp.data?.message)) {
        const fieldErrors: Record<string, string> = {};
        for (const msg of resp.data.message as string[]) {
          if (msg.toLowerCase().includes("name")) {
            fieldErrors.name = fieldErrors.name || msg;
          } else if (msg.toLowerCase().includes("email")) {
            fieldErrors.email = fieldErrors.email || msg;
          } else if (msg.toLowerCase().includes("message")) {
            fieldErrors.message = fieldErrors.message || msg;
          }
        }
        setContactErrors(
          Object.keys(fieldErrors).length > 0
            ? fieldErrors
            : { general: (resp.data.message as string[]).join(", ") }
        );
      } else {
        setErrorModalOpen(true);
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <>
      {/* Hero */}
      <section className={styles.hero} data-testid="hero-section">
        {HERO_SLIDES.map((slide, index) => (
          <div
            key={index}
            className={`${styles.heroSlide} ${index === currentSlide ? styles.heroSlideActive : ""}`}
            style={{ backgroundImage: `url(${slide.bg})` }}
          >
            <div
              className={styles.heroOverlay}
              style={{ background: slide.overlay }}
            />
          </div>
        ))}
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
          <Link href="/#programacao" className={styles.heroCta}>
            Confira a Programação
          </Link>
        </div>
        <div className={styles.heroIndicators}>
          {HERO_SLIDES.map((_, index) => (
            <button
              key={index}
              className={`${styles.heroIndicator} ${index === currentSlide ? styles.heroIndicatorActive : ""}`}
              onClick={() => setCurrentSlide(index)}
              aria-label={`Slide ${index + 1}`}
            />
          ))}
        </div>
        <div className={styles.heroDiagonalBlue} />
        <div className={styles.heroDiagonalWhite} />
      </section>

      {/* Programação */}
      <section id="programacao" className={styles.programacao} data-testid="programacao-section">
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

      <Modal
        isOpen={successModalOpen}
        onClose={() => setSuccessModalOpen(false)}
        title="Salvo com Sucesso!"
        variant="success"
      >
        <p>Sua mensagem foi enviada com sucesso.</p>
      </Modal>

      <Modal
        isOpen={errorModalOpen}
        onClose={() => setErrorModalOpen(false)}
        title="Algo deu errado!"
        variant="error"
      >
        <p>Formulário indisponível no momento. Tente mais tarde.</p>
      </Modal>

      {/* Contato + Local */}
      <section id="contato" className={styles.contatoLocal} data-testid="contato-section">
        <div className="container">
          <div className="row">
            <div className="col-md-6">
              <h2 className={styles.contatoTitle}>Contato</h2>
              <form
                className={styles.contatoForm}
                onSubmit={handleContactSubmit}
                noValidate
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
                    {contactErrors.name && (
                      <span className={styles.contatoError}>
                        {contactErrors.name}
                      </span>
                    )}
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
                    {contactErrors.email && (
                      <span className={styles.contatoError}>
                        {contactErrors.email}
                      </span>
                    )}
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
                  {contactErrors.message && (
                    <span className={styles.contatoError}>
                      {contactErrors.message}
                    </span>
                  )}
                </div>
                {contactErrors.general && (
                  <span className={styles.contatoError}>
                    {contactErrors.general}
                  </span>
                )}
                <button
                  type="submit"
                  className={styles.contatoSubmit}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Enviando..." : "Enviar"}
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
              <iframe
                className={styles.localMap}
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3887.9981847964584!2d-38.50827!3d-13.001389!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x71604d2481ae5c7%3A0x39d0b57af3de8592!2sInstituto%20de%20Computa%C3%A7%C3%A3o%20(IC%2FUFBA)!5e0!3m2!1spt-BR!2sbr!4v1717000000000"
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                title="Localização do Instituto de Computação da UFBA"
              />
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
