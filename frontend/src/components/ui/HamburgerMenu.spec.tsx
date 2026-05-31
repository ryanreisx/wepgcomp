import { render, screen, fireEvent, act } from "@testing-library/react";
import HamburgerMenu from "./HamburgerMenu";
import { useAuth } from "@/hooks/useAuth";
import { useUserView } from "@/hooks/useUserView";

jest.mock("@/hooks/useAuth");
jest.mock("@/hooks/useUserView");
jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
}));

const mockPush = jest.fn();
const mockLogout = jest.fn().mockResolvedValue(undefined);
const mockedUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;
const mockedUseUserView = useUserView as jest.MockedFunction<typeof useUserView>;

function setupAuth() {
  mockedUseAuth.mockReturnValue({
    user: {
      id: "1",
      name: "User",
      email: "u@e.com",
      profile: "DoctoralStudent",
      level: "Default",
      isActive: true,
      isVerified: true,
      isCommitteeOfActiveEdition: false,
    },
    isAuthenticated: true,
    isLoading: false,
    login: jest.fn(),
    logout: mockLogout,
    register: jest.fn(),
    refresh: jest.fn(),
  });
}

describe("HamburgerMenu", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    setupAuth();
  });

  it("renders nothing for public view", () => {
    mockedUseUserView.mockReturnValue("public");
    const { container } = render(<HamburgerMenu />);
    expect(container.innerHTML).toBe("");
  });

  it("renders trigger button for logged-in views", () => {
    mockedUseUserView.mockReturnValue("student");
    render(<HamburgerMenu />);
    expect(screen.getByLabelText("Menu do usuário")).toBeInTheDocument();
  });

  it("opens dropdown on click", () => {
    mockedUseUserView.mockReturnValue("student");
    render(<HamburgerMenu />);
    fireEvent.click(screen.getByLabelText("Menu do usuário"));
    expect(screen.getByRole("menu")).toBeInTheDocument();
  });

  describe("superadmin view", () => {
    beforeEach(() => {
      mockedUseUserView.mockReturnValue("superadmin");
    });

    it("renders all superadmin menu items", () => {
      render(<HamburgerMenu />);
      fireEvent.click(screen.getByLabelText("Menu do usuário"));
      expect(screen.getByText("Sessões")).toBeInTheDocument();
      expect(screen.getByText("Apresentações")).toBeInTheDocument();
      expect(screen.getByText("Edições do Evento")).toBeInTheDocument();
      expect(screen.getByText("Premiação")).toBeInTheDocument();
      expect(screen.getByText("Usuários")).toBeInTheDocument();
      expect(screen.getByText("Emitir Certificado")).toBeInTheDocument();
      expect(screen.getByText("Sair")).toBeInTheDocument();
    });
  });

  describe("committee view", () => {
    beforeEach(() => {
      mockedUseUserView.mockReturnValue("committee");
    });

    it("renders committee menu items (no Usuários)", () => {
      render(<HamburgerMenu />);
      fireEvent.click(screen.getByLabelText("Menu do usuário"));
      expect(screen.getByText("Sessões")).toBeInTheDocument();
      expect(screen.getByText("Apresentações")).toBeInTheDocument();
      expect(screen.getByText("Edição do Evento")).toBeInTheDocument();
      expect(screen.getByText("Premiação")).toBeInTheDocument();
      expect(screen.getByText("Emitir Certificado")).toBeInTheDocument();
      expect(screen.getByText("Sair")).toBeInTheDocument();
      expect(screen.queryByText("Usuários")).toBeNull();
    });
  });

  describe("student view", () => {
    beforeEach(() => {
      mockedUseUserView.mockReturnValue("student");
    });

    it("renders student menu items", () => {
      render(<HamburgerMenu />);
      fireEvent.click(screen.getByLabelText("Menu do usuário"));
      expect(screen.getByText("Minhas Apresentações")).toBeInTheDocument();
      expect(screen.getByText("Emitir Certificado")).toBeInTheDocument();
      expect(screen.getByText("Sair")).toBeInTheDocument();
    });
  });

  describe("listener view", () => {
    beforeEach(() => {
      mockedUseUserView.mockReturnValue("listener");
    });

    it("renders listener menu items", () => {
      render(<HamburgerMenu />);
      fireEvent.click(screen.getByLabelText("Menu do usuário"));
      expect(screen.getByText("Avaliação")).toBeInTheDocument();
      expect(screen.getByText("Emitir Certificado")).toBeInTheDocument();
      expect(screen.getByText("Sair")).toBeInTheDocument();
    });
  });

  it("calls logout and redirects on Sair click", async () => {
    mockedUseUserView.mockReturnValue("student");
    render(<HamburgerMenu />);
    fireEvent.click(screen.getByLabelText("Menu do usuário"));

    await act(async () => {
      fireEvent.click(screen.getByText("Sair"));
    });

    expect(mockLogout).toHaveBeenCalled();
    expect(mockPush).toHaveBeenCalledWith("/");
  });

  it("closes dropdown when clicking outside", () => {
    mockedUseUserView.mockReturnValue("student");
    render(
      <div>
        <span data-testid="outside">outside</span>
        <HamburgerMenu />
      </div>
    );
    fireEvent.click(screen.getByLabelText("Menu do usuário"));
    expect(screen.getByRole("menu")).toBeInTheDocument();

    fireEvent.mouseDown(screen.getByTestId("outside"));
    expect(screen.queryByRole("menu")).toBeNull();
  });
});
