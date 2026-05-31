import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import MinhasApresentacoesPage from "./MinhasApresentacoesPage";
import { useAuth } from "@/hooks/useAuth";
import * as submissionService from "@/services/submission.service";

jest.mock("@/hooks/useAuth");
jest.mock("@/services/submission.service");

const mockPush = jest.fn();
jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
    replace: jest.fn(),
  }),
}));

const mockedUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;
const mockedSubmissionService = submissionService as jest.Mocked<
  typeof submissionService
>;

const baseAuth = {
  login: jest.fn(),
  logout: jest.fn(),
  register: jest.fn(),
  refresh: jest.fn(),
};

const studentUser = {
  id: "user-1",
  name: "Maria Silva",
  email: "maria@test.com",
  profile: "DoctoralStudent" as const,
  level: "Default" as const,
  isActive: true,
  isVerified: true,
  isCommitteeOfActiveEdition: false,
};

const mockSubmissions = [
  {
    id: "sub-1",
    advisorId: "adv-1",
    mainAuthorId: "user-1",
    eventEditionId: "ed-1",
    title: "Machine Learning em Redes Neurais",
    abstract: "Resumo da pesquisa",
    pdfFile: "file1.pdf",
    phoneNumber: "71999999999",
    status: "Submitted" as const,
    createdAt: "2024-01-01T00:00:00.000Z",
    updatedAt: "2024-01-01T00:00:00.000Z",
  },
  {
    id: "sub-2",
    advisorId: "adv-2",
    mainAuthorId: "user-1",
    eventEditionId: "ed-1",
    title: "Computação Quântica Aplicada",
    abstract: "Resumo quântico",
    pdfFile: "file2.pdf",
    phoneNumber: "71999999999",
    status: "Accepted" as const,
    createdAt: "2024-01-02T00:00:00.000Z",
    updatedAt: "2024-01-02T00:00:00.000Z",
  },
  {
    id: "sub-3",
    advisorId: "adv-1",
    mainAuthorId: "user-1",
    eventEditionId: "ed-1",
    title: "Blockchain e Segurança",
    abstract: "Resumo blockchain",
    pdfFile: "file3.pdf",
    phoneNumber: "71999999999",
    status: "Submitted" as const,
    createdAt: "2024-01-03T00:00:00.000Z",
    updatedAt: "2024-01-03T00:00:00.000Z",
  },
];

function setupMocks(submissions = mockSubmissions) {
  mockedUseAuth.mockReturnValue({
    ...baseAuth,
    user: studentUser,
    isAuthenticated: true,
    isLoading: false,
  });
  mockedSubmissionService.getMySubmissions.mockResolvedValue({
    data: { data: submissions },
  } as never);
}

describe("MinhasApresentacoesPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders hero banner with correct title", async () => {
    setupMocks();
    render(<MinhasApresentacoesPage />);
    expect(screen.getByText("Minhas apresentações")).toBeInTheDocument();
  });

  it("renders loading state initially", () => {
    setupMocks();
    mockedSubmissionService.getMySubmissions.mockReturnValue(
      new Promise(() => {}) as never
    );
    render(<MinhasApresentacoesPage />);
    expect(
      screen.getByText("Carregando apresentações...")
    ).toBeInTheDocument();
  });

  it("renders submissions from getMySubmissions", async () => {
    setupMocks();
    render(<MinhasApresentacoesPage />);

    await waitFor(() => {
      expect(
        screen.getByText("Machine Learning em Redes Neurais")
      ).toBeInTheDocument();
    });
    expect(
      screen.getByText("Computação Quântica Aplicada")
    ).toBeInTheDocument();
    expect(screen.getByText("Blockchain e Segurança")).toBeInTheDocument();
  });

  it("displays user name as subtitle on each card", async () => {
    setupMocks();
    render(<MinhasApresentacoesPage />);

    await waitFor(() => {
      expect(
        screen.getByText("Machine Learning em Redes Neurais")
      ).toBeInTheDocument();
    });

    const authorNames = screen.getAllByText("Maria Silva");
    expect(authorNames.length).toBe(3);
  });

  it("calls getMySubmissions on mount", async () => {
    setupMocks();
    render(<MinhasApresentacoesPage />);

    await waitFor(() => {
      expect(mockedSubmissionService.getMySubmissions).toHaveBeenCalledTimes(1);
    });
  });

  it("shows empty state when no submissions", async () => {
    setupMocks([]);
    render(<MinhasApresentacoesPage />);

    await waitFor(() => {
      expect(
        screen.getByText("Nenhuma apresentação encontrada.")
      ).toBeInTheDocument();
    });
  });

  it("filters submissions by search term", async () => {
    setupMocks();
    render(<MinhasApresentacoesPage />);

    await waitFor(() => {
      expect(
        screen.getByText("Machine Learning em Redes Neurais")
      ).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText(
      "Pesquise pelo nome da apresentação"
    );
    fireEvent.change(searchInput, { target: { value: "Quântica" } });

    expect(
      screen.getByText("Computação Quântica Aplicada")
    ).toBeInTheDocument();
    expect(
      screen.queryByText("Machine Learning em Redes Neurais")
    ).not.toBeInTheDocument();
    expect(
      screen.queryByText("Blockchain e Segurança")
    ).not.toBeInTheDocument();
  });

  it("shows empty state when search has no matches", async () => {
    setupMocks();
    render(<MinhasApresentacoesPage />);

    await waitFor(() => {
      expect(
        screen.getByText("Machine Learning em Redes Neurais")
      ).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText(
      "Pesquise pelo nome da apresentação"
    );
    fireEvent.change(searchInput, { target: { value: "xyz inexistente" } });

    expect(
      screen.getByText("Nenhuma apresentação encontrada.")
    ).toBeInTheDocument();
  });

  it("navigates to edit page on edit icon click", async () => {
    setupMocks();
    render(<MinhasApresentacoesPage />);

    await waitFor(() => {
      expect(
        screen.getByText("Machine Learning em Redes Neurais")
      ).toBeInTheDocument();
    });

    const editButtons = screen.getAllByLabelText("Editar");
    fireEvent.click(editButtons[0]);

    expect(mockPush).toHaveBeenCalledWith("/aluno/apresentacoes/sub-1/editar");
  });

  it("navigates to new submission page on button click", async () => {
    setupMocks();
    render(<MinhasApresentacoesPage />);

    const addButton = screen.getByText("+ Incluir Apresentação");
    fireEvent.click(addButton);

    expect(mockPush).toHaveBeenCalledWith("/aluno/apresentacoes/nova");
  });

  it("shows 'show all' button when more than 5 submissions", async () => {
    const manySubmissions = Array.from({ length: 7 }, (_, i) => ({
      id: `sub-${i}`,
      advisorId: "adv-1",
      mainAuthorId: "user-1",
      eventEditionId: "ed-1",
      title: `Apresentação ${i + 1}`,
      abstract: `Resumo ${i + 1}`,
      pdfFile: `file${i}.pdf`,
      phoneNumber: "71999999999",
      status: "Submitted" as const,
      createdAt: "2024-01-01T00:00:00.000Z",
      updatedAt: "2024-01-01T00:00:00.000Z",
    }));

    setupMocks(manySubmissions);
    render(<MinhasApresentacoesPage />);

    await waitFor(() => {
      expect(screen.getByText("Apresentação 1")).toBeInTheDocument();
    });

    expect(screen.getByText("Apresentação 5")).toBeInTheDocument();
    expect(screen.queryByText("Apresentação 6")).not.toBeInTheDocument();

    const showAllBtn = screen.getByText("Veja todas as apresentações");
    expect(showAllBtn).toBeInTheDocument();

    fireEvent.click(showAllBtn);

    expect(screen.getByText("Apresentação 6")).toBeInTheDocument();
    expect(screen.getByText("Apresentação 7")).toBeInTheDocument();
  });

  it("handles API failure gracefully", async () => {
    mockedUseAuth.mockReturnValue({
      ...baseAuth,
      user: studentUser,
      isAuthenticated: true,
      isLoading: false,
    });
    mockedSubmissionService.getMySubmissions.mockRejectedValue(
      new Error("API error")
    );

    render(<MinhasApresentacoesPage />);

    await waitFor(() => {
      expect(
        screen.getByText("Nenhuma apresentação encontrada.")
      ).toBeInTheDocument();
    });
  });

  it("renders search bar with correct placeholder", () => {
    setupMocks();
    render(<MinhasApresentacoesPage />);

    expect(
      screen.getByPlaceholderText("Pesquise pelo nome da apresentação")
    ).toBeInTheDocument();
  });

  it("search is case-insensitive", async () => {
    setupMocks();
    render(<MinhasApresentacoesPage />);

    await waitFor(() => {
      expect(
        screen.getByText("Machine Learning em Redes Neurais")
      ).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText(
      "Pesquise pelo nome da apresentação"
    );
    fireEvent.change(searchInput, { target: { value: "machine learning" } });

    expect(
      screen.getByText("Machine Learning em Redes Neurais")
    ).toBeInTheDocument();
    expect(
      screen.queryByText("Computação Quântica Aplicada")
    ).not.toBeInTheDocument();
  });
});
