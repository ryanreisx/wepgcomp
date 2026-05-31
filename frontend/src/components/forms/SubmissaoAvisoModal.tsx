"use client";

import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
import styles from "./ApresentacaoEditModal.module.css";

interface SubmissaoAvisoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isSubmitting: boolean;
}

export default function SubmissaoAvisoModal({
  isOpen,
  onClose,
  onConfirm,
  isSubmitting,
}: SubmissaoAvisoModalProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="ATENÇÃO" variant="confirmation">
      <div className={styles.form}>
        <p>
          Ao submeter sua apresentação, você concorda que a comissão organizadora
          poderá alterar o horário e a data sugeridos conforme a necessidade da
          programação do evento.
        </p>
        <p>
          Após o envio, você poderá editar os dados da sua submissão até o
          encerramento do prazo de submissões.
        </p>
        <div className={styles.actions}>
          <Button variant="outline" color="primary" onClick={onClose} type="button">
            Cancelar
          </Button>
          <Button
            variant="filled"
            color="secondary"
            onClick={onConfirm}
            disabled={isSubmitting}
            type="button"
          >
            {isSubmitting ? "Enviando..." : "Enviar"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
