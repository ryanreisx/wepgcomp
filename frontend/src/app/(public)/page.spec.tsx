import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import Home from "./page";
import * as eventEditionService from "@/services/event-edition.service";
import * as presentationService from "@/services/presentation.service";

jest.mock("@/services/event-edition.service");
jest.mock("@/services/presentation.service");

const mockedEventService = eventEditionService as jest.Mocked<
  typeof eventEditionService
>;
const mockedPresentationService = presentationService as jest.Mocked<
  typeof presentationService
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

const mockBlocks = [
  {
    id: "b1",
    eventEditionId: "ed-1",
    roomId: "r1",
    type: "General" as const,
    title: "Abertura",
    speakerName: null,
    startTime: "2024-11-12T09:00:00.000Z",
    duration: 60,
    createdAt: "2024-01-01T00:00:00.000Z",
    updatedAt: "2024-01-01T00:00:00.000Z",
  },
  {
    id: "b2",
    eventEditionId: "ed-1",
    roomId: "r1",
    type: "Presentation" as const,
    title: null,
    speakerName: null,
    startTime: "2024-11-12T11:00:00.000Z",
    duration: 20,
    createdAt: "2024-01-01T00:00:00.000Z",
    updatedAt: "2024-01-01T00:00:00.000Z",
  },
  {
    id: "b3",
    eventEditionId: "ed-1",
    roomId: "r1",
    type: "General" as const,
    title: "Coffee break",
    speakerName: null,
    startTime: "2024-11-13T10:00:00.000Z",
    duration: 30,
    createdAt: "2024-01-01T00:00:00.000Z",
    updatedAt: "2024-01-01T00:00:00.000Z",
  },
];

function setupMocks() {
  mockedEventService.getActiveEventEdition.mockResolvedValue({
    data: { data: mockEdition },
  } as never);
  mockedPresentationService.getPresentationBlocksByEdition.mockResolvedValue({
    data: { data: mockBlocks },
  } as never);
}

describe("Home Page", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    setupMocks();
  });

  it("renders the hero section with event name", async () => {
    render(<Home />);
    await waitFor(() => {
      expect(screen.getByText("WEPGCOMP 2024")).toBeInTheDocument();
    });
    expect(
      screen.getByText(/Workshop de Estudantes/)
    ).toBeInTheDocument();
    expect(screen.getByText("Confira a Programação")).toBeInTheDocument();
  });

  it("renders the programação section title", () => {
    render(<Home />);
    expect(screen.getByText("Programação")).toBeInTheDocument();
  });

  it("renders the orientações section", () => {
    render(<Home />);
    expect(screen.getByText("Orientações")).toBeInTheDocument();
    expect(
      screen.getByText("Ver todas as orientações")
    ).toBeInTheDocument();
    expect(screen.getByText("Datas Importantes:")).toBeInTheDocument();
  });

  it("renders the organização section", () => {
    render(<Home />);
    expect(screen.getByText("Organização")).toBeInTheDocument();
    expect(screen.getByText(/Coordenação geral:/)).toBeInTheDocument();
    expect(screen.getByText(/Comissão organizadora:/)).toBeInTheDocument();
  });

  it("renders the contato and local section", () => {
    render(<Home />);
    expect(screen.getByText("Contato")).toBeInTheDocument();
    expect(screen.getByText("Local do Evento")).toBeInTheDocument();
    expect(
      screen.getByPlaceholderText("Insira seu nome")
    ).toBeInTheDocument();
    expect(
      screen.getByPlaceholderText("Insira seu e-mail:")
    ).toBeInTheDocument();
    expect(
      screen.getByPlaceholderText("Digite sua mensagem")
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Instituto de computação da UFBA/)
    ).toBeInTheDocument();
  });

  it("renders programação tabs from API data", async () => {
    render(<Home />);
    await waitFor(() => {
      expect(screen.getByRole("tablist")).toBeInTheDocument();
    });
    const tabs = screen.getAllByRole("tab");
    expect(tabs).toHaveLength(2);
  });

  it("switches tabs on click", async () => {
    render(<Home />);
    await waitFor(() => {
      expect(screen.getAllByRole("tab")).toHaveLength(2);
    });

    const tabs = screen.getAllByRole("tab");
    expect(tabs[0]).toHaveAttribute("aria-selected", "true");

    fireEvent.click(tabs[1]);
    expect(tabs[1]).toHaveAttribute("aria-selected", "true");
    expect(tabs[0]).toHaveAttribute("aria-selected", "false");
  });

  it("shows schedule blocks for selected date", async () => {
    render(<Home />);
    await waitFor(() => {
      expect(screen.getByText("Abertura")).toBeInTheDocument();
    });
    expect(screen.getByText("SALA A")).toBeInTheDocument();
  });

  it("shows different blocks when switching tabs", async () => {
    render(<Home />);
    await waitFor(() => {
      expect(screen.getByText("Abertura")).toBeInTheDocument();
    });

    const tabs = screen.getAllByRole("tab");
    fireEvent.click(tabs[1]);

    await waitFor(() => {
      expect(screen.getByText("Coffee break")).toBeInTheDocument();
    });
    expect(screen.queryByText("Abertura")).not.toBeInTheDocument();
  });

  it("renders presentation blocks with avatar placeholder", async () => {
    render(<Home />);
    await waitFor(() => {
      expect(
        screen.getByText("Nome(s) Apresentador(a)(s)")
      ).toBeInTheDocument();
    });
  });

  it("handles API failure gracefully", async () => {
    mockedEventService.getActiveEventEdition.mockRejectedValue(
      new Error("API error")
    );
    render(<Home />);

    expect(screen.getByText("Programação")).toBeInTheDocument();
    expect(screen.getByText("Orientações")).toBeInTheDocument();
    expect(screen.getByText("Organização")).toBeInTheDocument();
    expect(screen.getByText("Contato")).toBeInTheDocument();
  });

  it("renders fallback dates when API is unavailable", async () => {
    mockedEventService.getActiveEventEdition.mockRejectedValue(
      new Error("API error")
    );
    render(<Home />);

    expect(
      screen.getByText(/Data limite para submissão: a definir/)
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Data do evento: a definir/)
    ).toBeInTheDocument();
  });

  it("renders contact form inputs", () => {
    render(<Home />);
    expect(screen.getByLabelText("Nome:")).toBeInTheDocument();
    expect(screen.getByLabelText("E-mail:")).toBeInTheDocument();
    expect(screen.getByLabelText("Mensagem:")).toBeInTheDocument();
  });

  it("renders enviar button in contact form", () => {
    render(<Home />);
    expect(
      screen.getByRole("button", { name: "Enviar" })
    ).toBeInTheDocument();
  });
});
