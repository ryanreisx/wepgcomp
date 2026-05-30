import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import AvaliacaoListagemPage from "./AvaliacaoListagemPage";
import { useAuth } from "@/hooks/useAuth";
import * as eventEditionService from "@/services/event-edition.service";
import * as submissionService from "@/services/submission.service";
import * as userService from "@/services/user.service";
import * as presentationService from "@/services/presentation.service";
import * as favoriteService from "@/services/favorite.service";

jest.mock("@/hooks/useAuth");
jest.mock("@/services/event-edition.service");
jest.mock("@/services/submission.service");
jest.mock("@/services/user.service");
jest.mock("@/services/presentation.service");
jest.mock("@/services/favorite.service");

const mockPush = jest.fn();
const mockReplace = jest.fn();
jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush, replace: mockReplace }),
}));

const mockedUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;
const mockedEditionService = eventEditionService as jest.Mocked<typeof eventEditionService>;
const mockedSubService = submissionService as jest.Mocked<typeof submissionService>;
const mockedUserService = userService as jest.Mocked<typeof userService>;
const mockedPresService = presentationService as jest.Mocked<typeof presentationService>;
const mockedFavService = favoriteService as jest.Mocked<typeof favoriteService>;

const baseAuth = {
  login: jest.fn(),
  logout: jest.fn(),
  register: jest.fn(),
  refresh: jest.fn(),
};

const mockEdition = {
  id: "ed-1",
  name: "WEPGCOMP 2024",
  description: "",
  callForPapersText: "",
  partnersText: "",
  location: "UFBA",
  startDate: "2024-11-12T00:00:00.000Z",
  endDate: "2024-11-14T00:00:00.000Z",
  submissionStartDate: "2024-09-01T00:00:00.000Z",
  submissionDeadline: "2024-10-27T00:00:00.000Z",
  isActive: true,
  isEvaluationRestrictToLoggedUsers: false,
  presentationDuration: 20,
  presentationsPerPresentationBlock: 5,
  createdAt: "2024-01-01T00:00:00.000Z",
  updatedAt: "2024-01-01T00:00:00.000Z",
};

const mockSubmissions = [
  {
    id: "sub-1",
    advisorId: "adv-1",
    mainAuthorId: "user-a",
    eventEditionId: "ed-1",
    title: "Machine Learning Aplicado",
    abstract: "Resumo ML",
    pdfFile: "f1.pdf",
    phoneNumber: "71999",
    status: "Accepted" as const,
    createdAt: "2024-01-01T00:00:00.000Z",
    updatedAt: "2024-01-01T00:00:00.000Z",
  },
  {
    id: "sub-2",
    advisorId: "adv-2",
    mainAuthorId: "user-b",
    eventEditionId: "ed-1",
    title: "Redes Neurais Profundas",
    abstract: "Resumo RN",
    pdfFile: "f2.pdf",
    phoneNumber: "71999",
    status: "Accepted" as const,
    createdAt: "2024-01-02T00:00:00.000Z",
    updatedAt: "2024-01-02T00:00:00.000Z",
  },
];

const mockUsers = [
  {
    id: "user-a",
    name: "Alice",
    email: "alice@t.com",
    profile: "DoctoralStudent" as const,
    level: "Default" as const,
    isActive: true,
    isVerified: true,
    isCommitteeOfActiveEdition: false,
  },
  {
    id: "user-b",
    name: "Bob",
    email: "bob@t.com",
    profile: "DoctoralStudent" as const,
    level: "Default" as const,
    isActive: true,
    isVerified: true,
    isCommitteeOfActiveEdition: false,
  },
];

const mockPresentations = [
  {
    id: "pres-1",
    submissionId: "sub-1",
    presentationBlockId: "block-1",
    positionWithinBlock: 1,
    status: "Scheduled" as const,
    createdAt: "2024-01-01T00:00:00.000Z",
    updatedAt: "2024-01-01T00:00:00.000Z",
  },
  {
    id: "pres-2",
    submissionId: "sub-2",
    presentationBlockId: "block-1",
    positionWithinBlock: 2,
    status: "Scheduled" as const,
    createdAt: "2024-01-01T00:00:00.000Z",
    updatedAt: "2024-01-01T00:00:00.000Z",
  },
];

const mockBookmarks = [
  {
    id: "pres-1",
    submissionId: "sub-1",
    presentationBlockId: "block-1",
    positionWithinBlock: 1,
    status: "Scheduled",
    createdAt: "2024-01-01T00:00:00.000Z",
    updatedAt: "2024-01-01T00:00:00.000Z",
    submission: {
      id: "sub-1",
      title: "Machine Learning Aplicado",
      mainAuthor: { id: "user-a", name: "Alice" },
    },
  },
];

function setupMocks(opts?: { authenticated?: boolean; restricted?: boolean }) {
  const authenticated = opts?.authenticated ?? true;

  mockedUseAuth.mockReturnValue({
    ...baseAuth,
    user: authenticated
      ? {
          id: "me",
          name: "Me",
          email: "me@t.com",
          profile: "Listener" as const,
          level: "Default" as const,
          isActive: true,
          isVerified: true,
          isCommitteeOfActiveEdition: false,
        }
      : null,
    isAuthenticated: authenticated,
    isLoading: false,
  });

  const edition = opts?.restricted
    ? { ...mockEdition, isEvaluationRestrictToLoggedUsers: true }
    : mockEdition;

  mockedEditionService.getActiveEventEdition.mockResolvedValue({
    data: { data: edition },
  } as never);
  mockedSubService.getSubmissions.mockResolvedValue({
    data: { data: mockSubmissions },
  } as never);
  mockedUserService.getUsers.mockResolvedValue({
    data: { data: mockUsers },
  } as never);
  mockedPresService.getPresentationsByEdition.mockResolvedValue({
    data: { data: mockPresentations },
  } as never);
  mockedFavService.getMyBookmarks.mockResolvedValue({
    data: { data: mockBookmarks },
  } as never);
  mockedFavService.addBookmark.mockResolvedValue({} as never);
  mockedFavService.removeBookmark.mockResolvedValue({} as never);
}

describe("AvaliacaoListagemPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders cards with stars marked for bookmarked items", async () => {
    setupMocks();
    render(<AvaliacaoListagemPage />);

    await waitFor(() => {
      expect(screen.getByText("Machine Learning Aplicado")).toBeInTheDocument();
    });
    expect(screen.getByText("Redes Neurais Profundas")).toBeInTheDocument();
    expect(screen.getByText("Alice")).toBeInTheDocument();
    expect(screen.getByText("Bob")).toBeInTheDocument();

    const removeBtn = screen.getByLabelText("Remover favorito");
    expect(removeBtn).toBeInTheDocument();

    const addBtn = screen.getByLabelText("Favoritar");
    expect(addBtn).toBeInTheDocument();
  });

  it("filters by search within active tab", async () => {
    setupMocks();
    render(<AvaliacaoListagemPage />);

    await waitFor(() => {
      expect(screen.getByText("Machine Learning Aplicado")).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText(
      "Pesquise pelo nome da apresentação"
    );
    fireEvent.change(searchInput, { target: { value: "Redes" } });

    expect(screen.queryByText("Machine Learning Aplicado")).not.toBeInTheDocument();
    expect(screen.getByText("Redes Neurais Profundas")).toBeInTheDocument();
  });

  it("switches to favorites tab and shows only bookmarked", async () => {
    setupMocks();
    render(<AvaliacaoListagemPage />);

    await waitFor(() => {
      expect(screen.getByText("Machine Learning Aplicado")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole("tab", { name: "Apenas favoritos" }));

    expect(screen.getByText("Machine Learning Aplicado")).toBeInTheDocument();
    expect(
      screen.queryByText("Redes Neurais Profundas")
    ).not.toBeInTheDocument();
  });

  it("shows empty state on favorites tab when none bookmarked", async () => {
    setupMocks();
    mockedFavService.getMyBookmarks.mockResolvedValue({
      data: { data: [] },
    } as never);

    render(<AvaliacaoListagemPage />);

    await waitFor(() => {
      expect(screen.getByText("Machine Learning Aplicado")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole("tab", { name: "Apenas favoritos" }));

    expect(
      screen.getByText(/Você ainda não favoritou nenhuma apresentação/)
    ).toBeInTheDocument();
  });

  it("navigates to evaluation form on card click", async () => {
    setupMocks();
    render(<AvaliacaoListagemPage />);

    await waitFor(() => {
      expect(screen.getByText("Machine Learning Aplicado")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText("Machine Learning Aplicado"));

    expect(mockPush).toHaveBeenCalledWith("/ouvinte/avaliacao/sub-1");
  });

  it("search composes with favorites tab filter", async () => {
    setupMocks();
    render(<AvaliacaoListagemPage />);

    await waitFor(() => {
      expect(screen.getByText("Machine Learning Aplicado")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole("tab", { name: "Apenas favoritos" }));

    const searchInput = screen.getByPlaceholderText(
      "Pesquise pelo nome da apresentação"
    );
    fireEvent.change(searchInput, { target: { value: "inexistente" } });

    expect(
      screen.getByText(/Você ainda não favoritou nenhuma apresentação/)
    ).toBeInTheDocument();
  });

  it("hides tabs and stars when not authenticated", async () => {
    setupMocks({ authenticated: false });
    render(<AvaliacaoListagemPage />);

    await waitFor(() => {
      expect(screen.getByText("Machine Learning Aplicado")).toBeInTheDocument();
    });

    expect(screen.queryByRole("tablist")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Favoritar")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Remover favorito")).not.toBeInTheDocument();
  });

  it("redirects to login when restricted and not authenticated", async () => {
    setupMocks({ authenticated: false, restricted: true });
    render(<AvaliacaoListagemPage />);

    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith("/login");
    });
  });
});
