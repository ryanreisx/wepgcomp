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
  return screen.getByLabelText("Senha *");
}

function getConfirmInput() {
  return screen.getByLabelText("Confirmação de senha *");
}

describe("ResetPasswordPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders the reset password form", () => {
    render(<ResetPasswordPage />);
    expect(screen.getByText("Alteração de senha")).toBeInTheDocument();
    expect(getPasswordInput()).toBeInTheDocument();
    expect(getConfirmInput()).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Enviar/ })).toBeInTheDocument();
  });

  it("renders brand header", () => {
    render(<ResetPasswordPage />);
    expect(screen.getByText(/WEPGCOMP/)).toBeInTheDocument();
  });

  it("shows password rules", () => {
    render(<ResetPasswordPage />);
    expect(screen.getByText(/A senha deve possuir pelo menos/)).toBeInTheDocument();
    expect(screen.getByText("8 dígitos")).toBeInTheDocument();
    expect(screen.getByText("1 letra maiúscula")).toBeInTheDocument();
    expect(screen.getByText("1 letra minúscula")).toBeInTheDocument();
    expect(screen.getByText("4 números")).toBeInTheDocument();
    expect(screen.getByText("1 caracter especial")).toBeInTheDocument();
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

  it("validates password requires uppercase", async () => {
    render(<ResetPasswordPage />);
    fireEvent.change(getPasswordInput(), {
      target: { value: "password1234!" },
    });
    fireEvent.change(getConfirmInput(), {
      target: { value: "password1234!" },
    });
    fireEvent.click(screen.getByRole("button", { name: /Enviar/ }));

    await waitFor(() => {
      expect(
        screen.getByText("Senha deve conter ao menos 1 letra maiúscula")
      ).toBeInTheDocument();
    });
  });

  it("validates password requires lowercase", async () => {
    render(<ResetPasswordPage />);
    fireEvent.change(getPasswordInput(), {
      target: { value: "PASSWORD1234!" },
    });
    fireEvent.change(getConfirmInput(), {
      target: { value: "PASSWORD1234!" },
    });
    fireEvent.click(screen.getByRole("button", { name: /Enviar/ }));

    await waitFor(() => {
      expect(
        screen.getByText("Senha deve conter ao menos 1 letra minúscula")
      ).toBeInTheDocument();
    });
  });

  it("validates password requires 4 numbers", async () => {
    render(<ResetPasswordPage />);
    fireEvent.change(getPasswordInput(), {
      target: { value: "Password1!a" },
    });
    fireEvent.change(getConfirmInput(), {
      target: { value: "Password1!a" },
    });
    fireEvent.click(screen.getByRole("button", { name: /Enviar/ }));

    await waitFor(() => {
      expect(
        screen.getByText("Senha deve conter ao menos 4 números")
      ).toBeInTheDocument();
    });
  });

  it("validates password requires special character", async () => {
    render(<ResetPasswordPage />);
    fireEvent.change(getPasswordInput(), {
      target: { value: "Pass1234abc" },
    });
    fireEvent.change(getConfirmInput(), {
      target: { value: "Pass1234abc" },
    });
    fireEvent.click(screen.getByRole("button", { name: /Enviar/ }));

    await waitFor(() => {
      expect(
        screen.getByText("Senha deve conter ao menos 1 caracter especial")
      ).toBeInTheDocument();
    });
  });

  it("validates passwords must match", async () => {
    render(<ResetPasswordPage />);
    fireEvent.change(getPasswordInput(), {
      target: { value: "Pass1234!" },
    });
    fireEvent.change(getConfirmInput(), {
      target: { value: "Different1234!" },
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
      target: { value: "Pass1234!" },
    });
    fireEvent.change(getConfirmInput(), {
      target: { value: "Pass1234!" },
    });
    fireEvent.click(screen.getByRole("button", { name: /Enviar/ }));

    await waitFor(() => {
      expect(screen.getByText("Senha alterada!")).toBeInTheDocument();
    });

    expect(mockedAuthService.resetPassword).toHaveBeenCalledWith(
      "test-token-123",
      "Pass1234!"
    );
  });

  it("shows error modal on API failure", async () => {
    mockedAuthService.resetPassword.mockRejectedValue({
      response: { data: { message: "Token expirado" } },
    });

    render(<ResetPasswordPage />);
    fireEvent.change(getPasswordInput(), {
      target: { value: "Pass1234!" },
    });
    fireEvent.change(getConfirmInput(), {
      target: { value: "Pass1234!" },
    });
    fireEvent.click(screen.getByRole("button", { name: /Enviar/ }));

    await waitFor(() => {
      expect(screen.getByText("Erro")).toBeInTheDocument();
      expect(screen.getByText("Token expirado")).toBeInTheDocument();
    });
  });
});
