"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import HeroBanner from "@/components/ui/HeroBanner";
import StarRating from "@/components/ui/StarRating";
import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";
import FavoriteToggle from "@/components/ui/FavoriteToggle";
import { useAuth } from "@/hooks/useAuth";
import { Submission } from "@/types/submission";
import { User } from "@/types/user";
import { EvaluationCriteria } from "@/types/evaluation";
import { getSubmissionById } from "@/services/submission.service";
import { getUserById } from "@/services/user.service";
import { getActiveEventEdition } from "@/services/event-edition.service";
import {
  getEvaluationCriteria,
  createEvaluation,
} from "@/services/evaluation.service";
import { getPresentationsByEdition } from "@/services/presentation.service";
import { checkBookmark } from "@/services/favorite.service";
import styles from "./AvaliacaoFormPage.module.css";

interface AvaliacaoFormPageProps {
  submissionId: string;
}

export default function AvaliacaoFormPage({
  submissionId,
}: AvaliacaoFormPageProps) {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const router = useRouter();

  const [isLoading, setIsLoading] = useState(true);
  const [submission, setSubmission] = useState<Submission | null>(null);
  const [author, setAuthor] = useState<User | null>(null);
  const [criteria, setCriteria] = useState<EvaluationCriteria[]>([]);
  const [presentationId, setPresentationId] = useState<string | null>(null);
  const [isBookmarked, setIsBookmarked] = useState(false);

  const [scores, setScores] = useState<Record<string, number>>({});
  const [validationError, setValidationError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successOpen, setSuccessOpen] = useState(false);
  const [errorOpen, setErrorOpen] = useState(false);
  const [failedCriteria, setFailedCriteria] = useState<string[]>([]);

  const successTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (successTimerRef.current) clearTimeout(successTimerRef.current);
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function init() {
      try {
        const [subRes, editionRes] = await Promise.all([
          getSubmissionById(submissionId),
          getActiveEventEdition(),
        ]);
        if (cancelled) return;

        const sub = subRes.data.data;
        const edition = editionRes.data.data;
        setSubmission(sub);

        const [authorRes, criteriaRes, presRes] = await Promise.all([
          getUserById(sub.mainAuthorId),
          getEvaluationCriteria(edition.id),
          getPresentationsByEdition(edition.id),
        ]);

        if (cancelled) return;
        setAuthor(authorRes.data.data);
        setCriteria(criteriaRes.data.data);

        const pres = presRes.data.data.find(
          (p) => p.submissionId === submissionId
        );
        if (pres) {
          setPresentationId(pres.id);
          if (isAuthenticated) {
            try {
              const bookRes = await checkBookmark(pres.id);
              if (!cancelled) setIsBookmarked(bookRes.data.data.isBookmarked);
            } catch {
              // bookmarks unavailable
            }
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
  }, [submissionId, isAuthenticated, authLoading]);

  const handleScoreChange = (criteriaId: string, score: number) => {
    setScores((prev) => ({ ...prev, [criteriaId]: score }));
    if (validationError) setValidationError(null);
  };

  const handleSubmit = async () => {
    const missing = criteria.filter((c) => !scores[c.id]);
    if (missing.length > 0) {
      setValidationError("Selecione uma nota para todos os critérios.");
      return;
    }

    setIsSubmitting(true);
    setValidationError(null);

    const criteriaToSubmit =
      failedCriteria.length > 0 ? failedCriteria : criteria.map((c) => c.id);

    const results = await Promise.allSettled(
      criteriaToSubmit.map((criteriaId) =>
        createEvaluation({
          submissionId,
          evaluationCriteriaId: criteriaId,
          score: scores[criteriaId],
        })
      )
    );

    const newFailed = criteriaToSubmit.filter(
      (_, i) => results[i].status === "rejected"
    );

    setIsSubmitting(false);

    if (newFailed.length === 0) {
      setFailedCriteria([]);
      setSuccessOpen(true);
      successTimerRef.current = setTimeout(() => {
        setSuccessOpen(false);
        router.push("/ouvinte/avaliacao");
      }, 2000);
    } else {
      setFailedCriteria(newFailed);
      setErrorOpen(true);
    }
  };

  const handleSuccessClose = () => {
    if (successTimerRef.current) clearTimeout(successTimerRef.current);
    setSuccessOpen(false);
    router.push("/ouvinte/avaliacao");
  };

  const handleRetry = () => {
    setErrorOpen(false);
    handleSubmit();
  };

  if (authLoading || isLoading) {
    return (
      <>
        <HeroBanner title="Avaliação" />
        <div className={styles.container}>
          <p className={styles.loading}>Carregando...</p>
        </div>
      </>
    );
  }

  if (!submission || !author) {
    return (
      <>
        <HeroBanner title="Avaliação" />
        <div className={styles.container}>
          <p className={styles.loading}>Apresentação não encontrada.</p>
        </div>
      </>
    );
  }

  return (
    <>
      <HeroBanner title="Avaliação" />

      <div className={styles.container}>
        <div className={styles.presentationCard}>
          <div className={styles.avatarPlaceholder}>
            {author.name.charAt(0).toUpperCase()}
          </div>
          <div className={styles.cardInfo}>
            <h3 className={styles.authorName}>{author.name}</h3>
            <p className={styles.submissionTitle}>{submission.title}</p>
          </div>
          {isAuthenticated && presentationId && (
            <FavoriteToggle
              presentationId={presentationId}
              initialIsFavorite={isBookmarked}
            />
          )}
        </div>

        <div className={styles.criteriaList}>
          {criteria.map((c) => (
            <div key={c.id} className={styles.criterionItem}>
              <span className={styles.criterionLabel}>{c.title}</span>
              <StarRating
                value={scores[c.id] || 0}
                onChange={(v) => handleScoreChange(c.id, v)}
              />
            </div>
          ))}
        </div>

        {validationError && (
          <p className={styles.validationError} role="alert">
            {validationError}
          </p>
        )}

        <div className={styles.actions}>
          <Button
            variant="filled"
            color="secondary"
            onClick={handleSubmit}
            disabled={isSubmitting}
          >
            {isSubmitting ? "Enviando..." : "Enviar"}
          </Button>
        </div>
      </div>

      <Modal
        isOpen={successOpen}
        onClose={handleSuccessClose}
        title="Avaliação enviada!"
        variant="success"
      >
        <p>Sua avaliação foi registrada com sucesso.</p>
      </Modal>

      <Modal
        isOpen={errorOpen}
        onClose={() => setErrorOpen(false)}
        title="Algo deu errado!"
        variant="error"
      >
        <p>
          Não foi possível enviar todas as avaliações. Tente novamente.
        </p>
        <div className={styles.actions}>
          <Button variant="filled" color="secondary" onClick={handleRetry}>
            Tentar novamente
          </Button>
        </div>
      </Modal>
    </>
  );
}
