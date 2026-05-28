import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import OrientacoesPage from "./page";
import * as eventEditionService from "@/services/event-edition.service";
import * as guidanceService from "@/services/guidance.service";

jest.mock("@/services/event-edition.service");
jest.mock("@/services/guidance.service");
jest.mock("@/components/ui/HeroBanner", () => {
  return function MockHeroBanner({ title }: { title: string }) {
    return <div data-testid="hero-banner">{title}</div>;
  };
});

const mockedEventService = eventEditionService as jest.Mocked<
  typeof eventEditionService
>;
const mockedGuidanceService = guidanceService as jest.Mocked<
  typeof guidanceService
>;

const mockEdition = {
  id: "ed-1",
  name: "WEPGCOMP 2024",
  description: "Descrição do evento",
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

const mockGuidance = {
  id: "g-1",
  eventEditionId: "ed-1",
  summary: "Resumo das orientações",
  authorGuidance: "<h3>Template para slides</h3><p>O template está disponível.</p>",
  reviewerGuidance:
    "<h3>Recomendações para os Avaliadores</h3><p>Fazer perguntas objetivas.</p>",
  audienceGuidance:
    "<h3>Recomendações para a audiência</h3><p>Chegar cedo à sala.</p>",
  createdAt: "2024-01-01T00:00:00.000Z",
  updatedAt: "2024-01-01T00:00:00.000Z",
};

function setupMocks() {
  mockedEventService.getActiveEventEdition.mockResolvedValue({
    data: { data: mockEdition },
  } as never);
  mockedGuidanceService.getGuidancesByEdition.mockResolvedValue({
    data: { data: [mockGuidance] },
  } as never);
}

describe("Orientações Page", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    setupMocks();
  });

  it("renders the hero banner with title Orientações", () => {
    render(<OrientacoesPage />);
    expect(screen.getByTestId("hero-banner")).toHaveTextContent("Orientações");
  });

  it("renders three tabs: Autores, Avaliadores, Audiência", () => {
    render(<OrientacoesPage />);
    expect(screen.getByRole("tablist")).toBeInTheDocument();
    const tabs = screen.getAllByRole("tab");
    expect(tabs).toHaveLength(3);
    expect(tabs[0]).toHaveTextContent("Autores");
    expect(tabs[1]).toHaveTextContent("Avaliadores");
    expect(tabs[2]).toHaveTextContent("Audiência");
  });

  it("has Autores tab active by default", () => {
    render(<OrientacoesPage />);
    const tabs = screen.getAllByRole("tab");
    expect(tabs[0]).toHaveAttribute("aria-selected", "true");
    expect(tabs[1]).toHaveAttribute("aria-selected", "false");
    expect(tabs[2]).toHaveAttribute("aria-selected", "false");
  });

  it("switches to Avaliadores tab on click", () => {
    render(<OrientacoesPage />);
    const tabs = screen.getAllByRole("tab");
    fireEvent.click(tabs[1]);
    expect(tabs[1]).toHaveAttribute("aria-selected", "true");
    expect(tabs[0]).toHaveAttribute("aria-selected", "false");
  });

  it("switches to Audiência tab on click", () => {
    render(<OrientacoesPage />);
    const tabs = screen.getAllByRole("tab");
    fireEvent.click(tabs[2]);
    expect(tabs[2]).toHaveAttribute("aria-selected", "true");
    expect(tabs[0]).toHaveAttribute("aria-selected", "false");
  });

  it("shows author guidance content when API data loads", async () => {
    render(<OrientacoesPage />);
    await waitFor(() => {
      expect(screen.getByText("Template para slides")).toBeInTheDocument();
    });
    expect(screen.getByText("O template está disponível.")).toBeInTheDocument();
  });

  it("shows reviewer guidance when switching to Avaliadores tab", async () => {
    render(<OrientacoesPage />);
    await waitFor(() => {
      expect(screen.getByText("Template para slides")).toBeInTheDocument();
    });

    const tabs = screen.getAllByRole("tab");
    fireEvent.click(tabs[1]);

    await waitFor(() => {
      expect(
        screen.getByText("Recomendações para os Avaliadores")
      ).toBeInTheDocument();
    });
    expect(
      screen.getByText("Fazer perguntas objetivas.")
    ).toBeInTheDocument();
  });

  it("shows audience guidance when switching to Audiência tab", async () => {
    render(<OrientacoesPage />);
    await waitFor(() => {
      expect(screen.getByText("Template para slides")).toBeInTheDocument();
    });

    const tabs = screen.getAllByRole("tab");
    fireEvent.click(tabs[2]);

    await waitFor(() => {
      expect(
        screen.getByText("Recomendações para a audiência")
      ).toBeInTheDocument();
    });
    expect(screen.getByText("Chegar cedo à sala.")).toBeInTheDocument();
  });

  it("shows fallback message when API fails", async () => {
    mockedEventService.getActiveEventEdition.mockRejectedValue(
      new Error("API error")
    );
    render(<OrientacoesPage />);

    expect(screen.getByText(/Conteúdo em breve/)).toBeInTheDocument();
  });

  it("shows fallback when guidance has no content for a tab", async () => {
    mockedGuidanceService.getGuidancesByEdition.mockResolvedValue({
      data: {
        data: [
          { ...mockGuidance, authorGuidance: null },
        ],
      },
    } as never);

    render(<OrientacoesPage />);
    await waitFor(() => {
      expect(screen.getByText(/Conteúdo em breve/)).toBeInTheDocument();
    });
  });

  it("fetches guidance using active edition id", async () => {
    render(<OrientacoesPage />);
    await waitFor(() => {
      expect(
        mockedGuidanceService.getGuidancesByEdition
      ).toHaveBeenCalledWith("ed-1");
    });
  });
});
