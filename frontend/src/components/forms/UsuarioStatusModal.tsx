"use client";

import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";

interface UsuarioStatusModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  changeCount: number;
  isSubmitting: boolean;
}

export default function UsuarioStatusModal({
  isOpen,
  onClose,
  onConfirm,
  changeCount,
  isSubmitting,
}: UsuarioStatusModalProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="ATENÇÃO" variant="confirmation">
      <p>
        Você está prestes a alterar as permissões e/ou status de{" "}
        <strong>{changeCount}</strong> usuário{changeCount !== 1 ? "s" : ""}.
        Essa ação pode afetar o acesso desses usuários ao sistema. Deseja
        continuar?
      </p>
      <div
        style={{
          display: "flex",
          gap: "0.75rem",
          justifyContent: "flex-end",
          marginTop: "1rem",
        }}
      >
        <Button variant="outline" color="primary" onClick={onClose}>
          Cancelar
        </Button>
        <Button
          variant="filled"
          color="secondary"
          onClick={onConfirm}
          disabled={isSubmitting}
        >
          {isSubmitting ? "Salvando..." : "Confirmar"}
        </Button>
      </div>
    </Modal>
  );
}
