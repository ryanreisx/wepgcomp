import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import LoginPage from "./page";
import { useAuth } from "@/hooks/useAuth";

jest.mock("@/hooks/useAuth");
jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
}));

const mockPush = jest.fn();
const mockLogin = jest.fn();
const mockedUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;

function setupAuth() {
  mockedUseAuth.mockReturnValue({
    user: null,
    isAuthenticated: false,
    isLoading: false,
    login: mockLogin,
    logout: jest.fn(),
    register: jest.fn(),
    refresh: jest.fn(),
  });
}

describe("LoginPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    setupAuth();
  });

  it("renders the login form", () => {
    render(<LoginPage />);
    expect(screen.getByText("Acesse sua conta")).toBeInTheDocument();
    expect(screen.getByLabelText(/Email/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Senha/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Entrar/ })).toBeInTheDocument();
  });

  it("renders navigation links", () => {
    render(<LoginPage />);
    expect(screen.getByText("Esqueceu sua senha")).toBeInTheDocument();
    expect(screen.getByText("Cadastre-se")).toBeInTheDocument();
  });

  it("shows validation errors on empty submit", async () => {
    render(<LoginPage />);
    fireEvent.click(screen.getByRole("button", { name: /Entrar/ }));

    await waitFor(() => {
      expect(screen.getByText("Email é obrigatório")).toBeInTheDocument();
      expect(screen.getByText("Senha é obrigatória")).toBeInTheDocument();
    });

    expect(mockLogin).not.toHaveBeenCalled();
  });

  it("shows email validation error for invalid format", async () => {
    render(<LoginPage />);
    fireEvent.change(screen.getByLabelText(/Email/), {
      target: { value: "invalid" },
    });
    fireEvent.change(screen.getByLabelText(/Senha/), {
      target: { value: "pass123" },
    });
    fireEvent.click(screen.getByRole("button", { name: /Entrar/ }));

    await waitFor(() => {
      expect(screen.getByText("Email inválido")).toBeInTheDocument();
    });
  });

  it("calls login and redirects on success", async () => {
    mockLogin.mockResolvedValue(undefined);
    render(<LoginPage />);

    fireEvent.change(screen.getByLabelText(/Email/), {
      target: { value: "user@test.com" },
    });
    fireEvent.change(screen.getByLabelText(/Senha/), {
      target: { value: "Password1" },
    });
    fireEvent.click(screen.getByRole("button", { name: /Entrar/ }));

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith("user@test.com", "Password1");
    });

    expect(mockPush).toHaveBeenCalledWith("/");
  });

  it("shows API error on login failure", async () => {
    mockLogin.mockRejectedValue({
      response: { data: { message: "Credenciais inválidas" } },
    });
    render(<LoginPage />);

    fireEvent.change(screen.getByLabelText(/Email/), {
      target: { value: "user@test.com" },
    });
    fireEvent.change(screen.getByLabelText(/Senha/), {
      target: { value: "Password1" },
    });
    fireEvent.click(screen.getByRole("button", { name: /Entrar/ }));

    await waitFor(() => {
      expect(screen.getByText("Credenciais inválidas")).toBeInTheDocument();
    });
  });

  it("shows generic error when no message from API", async () => {
    mockLogin.mockRejectedValue(new Error("network error"));
    render(<LoginPage />);

    fireEvent.change(screen.getByLabelText(/Email/), {
      target: { value: "user@test.com" },
    });
    fireEvent.change(screen.getByLabelText(/Senha/), {
      target: { value: "Password1" },
    });
    fireEvent.click(screen.getByRole("button", { name: /Entrar/ }));

    await waitFor(() => {
      expect(
        screen.getByText("Erro ao fazer login. Tente novamente.")
      ).toBeInTheDocument();
    });
  });
});
