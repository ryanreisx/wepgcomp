import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import AvaliacaoFormPage from "./AvaliacaoFormPage";
import { useAuth } from "@/hooks/useAuth";
import * as submissionService from "@/services/submission.service";
import * as userService from "@/services/user.service";
import * as eventEditionService from "@/services/event-edition.service";
import * as evaluationService from "@/services/evaluation.service";
import * as presentationService from "@/services/presentation.service";
import * as favoriteService from "@/services/favorite.service";

jest.mock("@/hooks/useAuth");
jest.mock("@/services/submission.service");
jest.mock("@/services/user.service");
jest.mock("@/services/event-edition.service");
jest.mock("@/services/evaluation.service");
jest.mock("@/services/presentation.service");
jest.mock("@/services/favorite.service");

const mockPush = jest.fn();
jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush, replace: jest.fn() }),
  useParams: () => ({ submissionId: "sub-1" }),
}));

const mockedUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;
const mockedSubService = submissionService as jest.Mocked<typeof submissionService>;
const mockedUserService = userService as jest.Mocked<typeof userService>;
const mockedEditionService = eventEditionService as jest.Mocked<typeof eventEditionService>;
const mockedEvalService = evaluationService as jest.Mocked<typeof evaluationService>;
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

const mockSubmission = {
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
};

const mockAuthor = {
  id: "user-a",
  name: "Alice Silva",
  email: "alice@t.com",
  profile: "DoctoralStudent" as const,
  level: "Default" as const,
  isActive: true,
  isVerified: true,
  isCommitteeOfActiveEdition: false,
};

const mockCriteria = [
  {
    id: "crit-1",
    eventEditionId: "ed-1",
    title: "Conteúdo",
    description: "Qualidade do conteúdo",
    weightRadio: null,
    createdAt: "2024-01-01T00:00:00.000Z",
    updatedAt: "2024-01-01T00:00:00.000Z",
  },
  {
    id: "crit-2",
    eventEditionId: "ed-1",
    title: "Clareza",
    description: "Clareza da apresentação",
    weightRadio: null,
    createdAt: "2024-01-01T00:00:00.000Z",
    updatedAt: "2024-01-01T00:00:00.000Z",
  },
  {
    id: "crit-3",
    eventEditionId: "ed-1",
    title: "Relevância",
    description: "Relevância ao tema",
    weightRadio: null,
    createdAt: "2024-01-01T00:00:00.000Z",
    updatedAt: "2024-01-01T00:00:00.000Z",
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
];

function setupMocks() {
  mockedUseAuth.mockReturnValue({
    ...baseAuth,
    user: {
      id: "me",
      name: "Me",
      email: "me@t.com",
      profile: "Listener" as const,
      level: "Default" as const,
      isActive: true,
      isVerified: true,
      isCommitteeOfActiveEdition: false,
    },
    isAuthenticated: true,
    isLoading: false,
  });

  mockedSubService.getSubmissionById.mockResolvedValue({
    data: { data: mockSubmission },
  } as never);
  mockedUserService.getUserById.mockResolvedValue({
    data: { data: mockAuthor },
  } as never);
  mockedEditionService.getActiveEventEdition.mockResolvedValue({
    data: { data: mockEdition },
  } as never);
  mockedEvalService.getEvaluationCriteria.mockResolvedValue({
    data: { data: mockCriteria },
  } as never);
  mockedPresService.getPresentationsByEdition.mockResolvedValue({
    data: { data: mockPresentations },
  } as never);
  mockedFavService.checkBookmark.mockResolvedValue({
    data: { data: { isBookmarked: false } },
  } as never);
}

describe("AvaliacaoFormPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("renders author card and N criteria", async () => {
    setupMocks();
    render(<AvaliacaoFormPage submissionId="sub-1" />);

    await waitFor(() => {
      expect(screen.getByText("Alice Silva")).toBeInTheDocument();
    });
    expect(screen.getByText("Machine Learning Aplicado")).toBeInTheDocument();
    expect(screen.getByText("Conteúdo")).toBeInTheDocument();
    expect(screen.getByText("Clareza")).toBeInTheDocument();
    expect(screen.getByText("Relevância")).toBeInTheDocument();
  });

  it("shows validation error when submitting without all scores", async () => {
    setupMocks();
    render(<AvaliacaoFormPage submissionId="sub-1" />);

    await waitFor(() => {
      expect(screen.getByText("Alice Silva")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole("button", { name: "Enviar" }));

    expect(
      screen.getByText("Selecione uma nota para todos os critérios.")
    ).toBeInTheDocument();
  });

  it("submits all evaluations on success", async () => {
    setupMocks();
    mockedEvalService.createEvaluation.mockResolvedValue({
      data: { data: {} as never, message: "ok" },
    } as never);

    render(<AvaliacaoFormPage submissionId="sub-1" />);

    await waitFor(() => {
      expect(screen.getByText("Conteúdo")).toBeInTheDocument();
    });

    const starGroups = screen.getAllByRole("group", {
      name: "Avaliação por estrelas",
    });
    expect(starGroups).toHaveLength(3);

    starGroups.forEach((group) => {
      const stars = group.querySelectorAll("button");
      fireEvent.click(stars[3]);
    });

    fireEvent.click(screen.getByRole("button", { name: "Enviar" }));

    await waitFor(() => {
      expect(screen.getByText("Avaliação enviada!")).toBeInTheDocument();
    });

    expect(mockedEvalService.createEvaluation).toHaveBeenCalledTimes(3);
  });

  it("shows error modal on partial failure with retry", async () => {
    setupMocks();

    let callCount = 0;
    mockedEvalService.createEvaluation.mockImplementation(() => {
      callCount++;
      if (callCount === 2) {
        return Promise.reject(new Error("fail"));
      }
      return Promise.resolve({
        data: { data: {} as never, message: "ok" },
      } as never);
    });

    render(<AvaliacaoFormPage submissionId="sub-1" />);

    await waitFor(() => {
      expect(screen.getByText("Conteúdo")).toBeInTheDocument();
    });

    const starGroups = screen.getAllByRole("group", {
      name: "Avaliação por estrelas",
    });
    starGroups.forEach((group) => {
      const stars = group.querySelectorAll("button");
      fireEvent.click(stars[4]);
    });

    fireEvent.click(screen.getByRole("button", { name: "Enviar" }));

    await waitFor(() => {
      expect(screen.getByText("Algo deu errado!")).toBeInTheDocument();
    });

    expect(
      screen.getByRole("button", { name: "Tentar novamente" })
    ).toBeInTheDocument();
  });

  it("retries only failed criteria on retry click", async () => {
    setupMocks();

    mockedEvalService.createEvaluation
      .mockResolvedValueOnce({ data: { data: {} as never, message: "ok" } } as never)
      .mockRejectedValueOnce(new Error("fail"))
      .mockResolvedValueOnce({ data: { data: {} as never, message: "ok" } } as never)
      .mockResolvedValueOnce({ data: { data: {} as never, message: "ok" } } as never);

    render(<AvaliacaoFormPage submissionId="sub-1" />);

    await waitFor(() => {
      expect(screen.getByText("Conteúdo")).toBeInTheDocument();
    });

    const starGroups = screen.getAllByRole("group", {
      name: "Avaliação por estrelas",
    });
    starGroups.forEach((group) => {
      const stars = group.querySelectorAll("button");
      fireEvent.click(stars[2]);
    });

    fireEvent.click(screen.getByRole("button", { name: "Enviar" }));

    await waitFor(() => {
      expect(screen.getByText("Algo deu errado!")).toBeInTheDocument();
    });

    expect(mockedEvalService.createEvaluation).toHaveBeenCalledTimes(3);

    fireEvent.click(screen.getByRole("button", { name: "Tentar novamente" }));

    await waitFor(() => {
      expect(mockedEvalService.createEvaluation).toHaveBeenCalledTimes(4);
    });
  });

  it("shows avatar placeholder with first letter of author name", async () => {
    setupMocks();
    render(<AvaliacaoFormPage submissionId="sub-1" />);

    await waitFor(() => {
      expect(screen.getByText("A")).toBeInTheDocument();
    });
  });

  it("shows loading state initially", () => {
    setupMocks();
    mockedSubService.getSubmissionById.mockReturnValue(
      new Promise(() => {}) as never
    );
    render(<AvaliacaoFormPage submissionId="sub-1" />);

    expect(screen.getByText("Carregando...")).toBeInTheDocument();
  });

  it("renders favorite toggle in presentation card", async () => {
    setupMocks();
    render(<AvaliacaoFormPage submissionId="sub-1" />);

    await waitFor(() => {
      expect(screen.getByLabelText("Favoritar")).toBeInTheDocument();
    });
  });
});
