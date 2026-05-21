import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import ResetPasswordPage from "./page";
import * as authService from "@/services/auth.service";

jest.mock("@/services/auth.service");
jest.mock("next/navigation", () => ({
  useSearchParams: () => ({
    get: (key: string) => (key === "token" ? "test-token-123" : null),
  }),
}));

const mockedAuthService = authService as jest.Mocked<typeof authService>;

function getPasswordInput() {
  return screen.getByLabelText("Nova Senha *");
}

function getConfirmInput() {
  return screen.getByLabelText("Confirmar Nova Senha *");
}

describe("ResetPasswordPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders the reset password form", () => {
    render(<ResetPasswordPage />);
    expect(screen.getByText("Redefinir Senha")).toBeInTheDocument();
    expect(getPasswordInput()).toBeInTheDocument();
    expect(getConfirmInput()).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Enviar/ })).toBeInTheDocument();
  });

  it("shows password rules", () => {
    render(<ResetPasswordPage />);
    expect(screen.getByText(/Mínimo de 8 caracteres/)).toBeInTheDocument();
    expect(screen.getByText(/Ao menos uma letra maiúscula/)).toBeInTheDocument();
    expect(screen.getByText(/Ao menos um número/)).toBeInTheDocument();
  });

  it("shows validation errors on empty submit", async () => {
    render(<ResetPasswordPage />);
    fireEvent.click(screen.getByRole("button", { name: /Enviar/ }));

    await waitFor(() => {
      expect(screen.getByText("Senha é obrigatória")).toBeInTheDocument();
      expect(
        screen.getByText("Confirmação de senha é obrigatória")
      ).toBeInTheDocument();
    });
  });

  it("validates password minimum length", async () => {
    render(<ResetPasswordPage />);
    fireEvent.change(getPasswordInput(), {
      target: { value: "Ab1" },
    });
    fireEvent.change(getConfirmInput(), {
      target: { value: "Ab1" },
    });
    fireEvent.click(screen.getByRole("button", { name: /Enviar/ }));

    await waitFor(() => {
      expect(
        screen.getByText("Senha deve ter no mínimo 8 caracteres")
      ).toBeInTheDocument();
    });
  });

  it("validates passwords must match", async () => {
    render(<ResetPasswordPage />);
    fireEvent.change(getPasswordInput(), {
      target: { value: "Password1" },
    });
    fireEvent.change(getConfirmInput(), {
      target: { value: "Different1" },
    });
    fireEvent.click(screen.getByRole("button", { name: /Enviar/ }));

    await waitFor(() => {
      expect(screen.getByText("As senhas não coincidem")).toBeInTheDocument();
    });
  });

  it("calls resetPassword and shows success modal", async () => {
    mockedAuthService.resetPassword.mockResolvedValue({
      data: { message: "ok" },
    } as never);

    render(<ResetPasswordPage />);
    fireEvent.change(getPasswordInput(), {
      target: { value: "Password1" },
    });
    fireEvent.change(getConfirmInput(), {
      target: { value: "Password1" },
    });
    fireEvent.click(screen.getByRole("button", { name: /Enviar/ }));

    await waitFor(() => {
      expect(screen.getByText("Senha redefinida!")).toBeInTheDocument();
    });

    expect(mockedAuthService.resetPassword).toHaveBeenCalledWith(
      "test-token-123",
      "Password1"
    );
  });

  it("shows error modal on API failure", async () => {
    mockedAuthService.resetPassword.mockRejectedValue({
      response: { data: { message: "Token expirado" } },
    });

    render(<ResetPasswordPage />);
    fireEvent.change(getPasswordInput(), {
      target: { value: "Password1" },
    });
    fireEvent.change(getConfirmInput(), {
      target: { value: "Password1" },
    });
    fireEvent.click(screen.getByRole("button", { name: /Enviar/ }));

    await waitFor(() => {
      expect(screen.getByText("Erro")).toBeInTheDocument();
      expect(screen.getByText("Token expirado")).toBeInTheDocument();
    });
  });
});
