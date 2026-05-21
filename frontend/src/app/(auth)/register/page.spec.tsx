import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import RegisterPage from "./page";
import { useAuth } from "@/hooks/useAuth";

jest.mock("@/hooks/useAuth");
jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
}));

const mockPush = jest.fn();
const mockRegister = jest.fn();
const mockedUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;

function setupAuth() {
  mockedUseAuth.mockReturnValue({
    user: null,
    isAuthenticated: false,
    isLoading: false,
    login: jest.fn(),
    logout: jest.fn(),
    register: mockRegister,
    refresh: jest.fn(),
  });
}

function getField(label: string) {
  return screen.getByLabelText(new RegExp(`^${label}`));
}

describe("RegisterPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    setupAuth();
  });

  it("renders the registration form", () => {
    render(<RegisterPage />);
    expect(screen.getByText("Cadastro")).toBeInTheDocument();
    expect(getField("Nome Completo")).toBeInTheDocument();
    expect(getField("Email UFBA")).toBeInTheDocument();
    expect(screen.getByText("Doutorando")).toBeInTheDocument();
    expect(screen.getByText("Professor")).toBeInTheDocument();
    expect(screen.getByText("Ouvinte")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Cadastrar/ })).toBeInTheDocument();
  });

  it("shows password rules", () => {
    render(<RegisterPage />);
    expect(screen.getByText(/A senha deve possuir pelo menos/)).toBeInTheDocument();
    expect(screen.getByText("8 dígitos")).toBeInTheDocument();
    expect(screen.getByText("1 letra maiúscula")).toBeInTheDocument();
    expect(screen.getByText("1 letra minúscula")).toBeInTheDocument();
    expect(screen.getByText("4 números")).toBeInTheDocument();
    expect(screen.getByText("1 caracter especial")).toBeInTheDocument();
  });

  it("shows validation errors on empty submit", async () => {
    render(<RegisterPage />);
    fireEvent.click(screen.getByRole("button", { name: /Cadastrar/ }));

    await waitFor(() => {
      expect(screen.getByText("Nome é obrigatório")).toBeInTheDocument();
      expect(screen.getByText("Selecione um perfil")).toBeInTheDocument();
      expect(screen.getByText("Email é obrigatório")).toBeInTheDocument();
      expect(screen.getByText("Senha é obrigatória")).toBeInTheDocument();
      expect(
        screen.getByText("Confirmação de senha é obrigatória")
      ).toBeInTheDocument();
    });

    expect(mockRegister).not.toHaveBeenCalled();
  });

  it("requires registration number for non-Listener profiles", async () => {
    render(<RegisterPage />);

    fireEvent.change(getField("Nome Completo"), {
      target: { value: "Test User" },
    });
    fireEvent.click(screen.getByLabelText("Doutorando"));
    fireEvent.change(getField("Email UFBA"), {
      target: { value: "test@test.com" },
    });
    fireEvent.change(screen.getByLabelText("Senha *"), {
      target: { value: "Pass1234!" },
    });
    fireEvent.change(screen.getByLabelText("Confirmação de senha *"), {
      target: { value: "Pass1234!" },
    });
    fireEvent.click(screen.getByRole("button", { name: /Cadastrar/ }));

    await waitFor(() => {
      expect(
        screen.getByText("Matrícula é obrigatória")
      ).toBeInTheDocument();
    });
  });

  it("does not require registration number for Listener", async () => {
    mockRegister.mockResolvedValue(undefined);
    render(<RegisterPage />);

    fireEvent.change(getField("Nome Completo"), {
      target: { value: "Test User" },
    });
    fireEvent.click(screen.getByLabelText("Ouvinte"));
    fireEvent.change(getField("Email UFBA"), {
      target: { value: "test@test.com" },
    });
    fireEvent.change(screen.getByLabelText("Senha *"), {
      target: { value: "Pass1234!" },
    });
    fireEvent.change(screen.getByLabelText("Confirmação de senha *"), {
      target: { value: "Pass1234!" },
    });
    fireEvent.click(screen.getByRole("button", { name: /Cadastrar/ }));

    await waitFor(() => {
      expect(mockRegister).toHaveBeenCalledWith({
        name: "Test User",
        email: "test@test.com",
        password: "Pass1234!",
        profile: "Listener",
        registrationNumber: undefined,
      });
    });
  });

  it("validates password minimum length", async () => {
    render(<RegisterPage />);

    fireEvent.change(screen.getByLabelText("Senha *"), {
      target: { value: "Ab1" },
    });
    fireEvent.change(screen.getByLabelText("Confirmação de senha *"), {
      target: { value: "Ab1" },
    });
    fireEvent.change(getField("Nome Completo"), {
      target: { value: "User" },
    });
    fireEvent.click(screen.getByLabelText("Ouvinte"));
    fireEvent.change(getField("Email UFBA"), {
      target: { value: "a@b.com" },
    });
    fireEvent.click(screen.getByRole("button", { name: /Cadastrar/ }));

    await waitFor(() => {
      expect(
        screen.getByText("Senha deve ter no mínimo 8 caracteres")
      ).toBeInTheDocument();
    });
  });

  it("validates password requires uppercase", async () => {
    render(<RegisterPage />);

    fireEvent.change(screen.getByLabelText("Senha *"), {
      target: { value: "password1234!" },
    });
    fireEvent.change(screen.getByLabelText("Confirmação de senha *"), {
      target: { value: "password1234!" },
    });
    fireEvent.change(getField("Nome Completo"), {
      target: { value: "User" },
    });
    fireEvent.click(screen.getByLabelText("Ouvinte"));
    fireEvent.change(getField("Email UFBA"), {
      target: { value: "a@b.com" },
    });
    fireEvent.click(screen.getByRole("button", { name: /Cadastrar/ }));

    await waitFor(() => {
      expect(
        screen.getByText("Senha deve conter ao menos 1 letra maiúscula")
      ).toBeInTheDocument();
    });
  });

  it("validates password requires lowercase", async () => {
    render(<RegisterPage />);

    fireEvent.change(screen.getByLabelText("Senha *"), {
      target: { value: "PASSWORD1234!" },
    });
    fireEvent.change(screen.getByLabelText("Confirmação de senha *"), {
      target: { value: "PASSWORD1234!" },
    });
    fireEvent.change(getField("Nome Completo"), {
      target: { value: "User" },
    });
    fireEvent.click(screen.getByLabelText("Ouvinte"));
    fireEvent.change(getField("Email UFBA"), {
      target: { value: "a@b.com" },
    });
    fireEvent.click(screen.getByRole("button", { name: /Cadastrar/ }));

    await waitFor(() => {
      expect(
        screen.getByText("Senha deve conter ao menos 1 letra minúscula")
      ).toBeInTheDocument();
    });
  });

  it("validates password requires 4 numbers", async () => {
    render(<RegisterPage />);

    fireEvent.change(screen.getByLabelText("Senha *"), {
      target: { value: "Password1!a" },
    });
    fireEvent.change(screen.getByLabelText("Confirmação de senha *"), {
      target: { value: "Password1!a" },
    });
    fireEvent.change(getField("Nome Completo"), {
      target: { value: "User" },
    });
    fireEvent.click(screen.getByLabelText("Ouvinte"));
    fireEvent.change(getField("Email UFBA"), {
      target: { value: "a@b.com" },
    });
    fireEvent.click(screen.getByRole("button", { name: /Cadastrar/ }));

    await waitFor(() => {
      expect(
        screen.getByText("Senha deve conter ao menos 4 números")
      ).toBeInTheDocument();
    });
  });

  it("validates password requires special character", async () => {
    render(<RegisterPage />);

    fireEvent.change(screen.getByLabelText("Senha *"), {
      target: { value: "Pass1234abc" },
    });
    fireEvent.change(screen.getByLabelText("Confirmação de senha *"), {
      target: { value: "Pass1234abc" },
    });
    fireEvent.change(getField("Nome Completo"), {
      target: { value: "User" },
    });
    fireEvent.click(screen.getByLabelText("Ouvinte"));
    fireEvent.change(getField("Email UFBA"), {
      target: { value: "a@b.com" },
    });
    fireEvent.click(screen.getByRole("button", { name: /Cadastrar/ }));

    await waitFor(() => {
      expect(
        screen.getByText("Senha deve conter ao menos 1 caracter especial")
      ).toBeInTheDocument();
    });
  });

  it("validates passwords must match", async () => {
    render(<RegisterPage />);

    fireEvent.change(screen.getByLabelText("Senha *"), {
      target: { value: "Pass1234!" },
    });
    fireEvent.change(screen.getByLabelText("Confirmação de senha *"), {
      target: { value: "Diff1234!" },
    });
    fireEvent.change(getField("Nome Completo"), {
      target: { value: "User" },
    });
    fireEvent.click(screen.getByLabelText("Ouvinte"));
    fireEvent.change(getField("Email UFBA"), {
      target: { value: "a@b.com" },
    });
    fireEvent.click(screen.getByRole("button", { name: /Cadastrar/ }));

    await waitFor(() => {
      expect(
        screen.getByText("As senhas não coincidem")
      ).toBeInTheDocument();
    });
  });

  it("calls register and shows success modal", async () => {
    mockRegister.mockResolvedValue(undefined);
    render(<RegisterPage />);

    fireEvent.change(getField("Nome Completo"), {
      target: { value: "Test User" },
    });
    fireEvent.click(screen.getByLabelText("Doutorando"));
    fireEvent.change(getField("Matricula"), {
      target: { value: "12345" },
    });
    fireEvent.change(getField("Email UFBA"), {
      target: { value: "test@test.com" },
    });
    fireEvent.change(screen.getByLabelText("Senha *"), {
      target: { value: "Pass1234!" },
    });
    fireEvent.change(screen.getByLabelText("Confirmação de senha *"), {
      target: { value: "Pass1234!" },
    });
    fireEvent.click(screen.getByRole("button", { name: /Cadastrar/ }));

    await waitFor(() => {
      expect(screen.getByText("Cadastro realizado!")).toBeInTheDocument();
    });

    expect(mockRegister).toHaveBeenCalledWith({
      name: "Test User",
      email: "test@test.com",
      password: "Pass1234!",
      profile: "DoctoralStudent",
      registrationNumber: "12345",
    });
  });

  it("shows error modal on API failure", async () => {
    mockRegister.mockRejectedValue({
      response: { data: { message: "Email já cadastrado" } },
    });
    render(<RegisterPage />);

    fireEvent.change(getField("Nome Completo"), {
      target: { value: "Test User" },
    });
    fireEvent.click(screen.getByLabelText("Ouvinte"));
    fireEvent.change(getField("Email UFBA"), {
      target: { value: "test@test.com" },
    });
    fireEvent.change(screen.getByLabelText("Senha *"), {
      target: { value: "Pass1234!" },
    });
    fireEvent.change(screen.getByLabelText("Confirmação de senha *"), {
      target: { value: "Pass1234!" },
    });
    fireEvent.click(screen.getByRole("button", { name: /Cadastrar/ }));

    await waitFor(() => {
      expect(screen.getByText("Erro no cadastro")).toBeInTheDocument();
      expect(screen.getByText("Email já cadastrado")).toBeInTheDocument();
    });
  });

  it("redirects to login on success modal close", async () => {
    mockRegister.mockResolvedValue(undefined);
    render(<RegisterPage />);

    fireEvent.change(getField("Nome Completo"), {
      target: { value: "Test User" },
    });
    fireEvent.click(screen.getByLabelText("Ouvinte"));
    fireEvent.change(getField("Email UFBA"), {
      target: { value: "test@test.com" },
    });
    fireEvent.change(screen.getByLabelText("Senha *"), {
      target: { value: "Pass1234!" },
    });
    fireEvent.change(screen.getByLabelText("Confirmação de senha *"), {
      target: { value: "Pass1234!" },
    });
    fireEvent.click(screen.getByRole("button", { name: /Cadastrar/ }));

    await waitFor(() => {
      expect(screen.getByText("Cadastro realizado!")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText("Ir para Login"));

    expect(mockPush).toHaveBeenCalledWith("/login");
  });
});
