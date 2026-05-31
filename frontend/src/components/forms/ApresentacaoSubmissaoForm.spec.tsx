import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import ApresentacaoSubmissaoForm from "./ApresentacaoSubmissaoForm";
import { useAuth } from "@/hooks/useAuth";
import * as eventEditionService from "@/services/event-edition.service";
import * as userService from "@/services/user.service";
import * as presentationService from "@/services/presentation.service";
import * as submissionService from "@/services/submission.service";

jest.mock("@/hooks/useAuth");
jest.mock("@/services/event-edition.service");
jest.mock("@/services/user.service");
jest.mock("@/services/presentation.service");
jest.mock("@/services/submission.service");

const mockPush = jest.fn();
jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush, replace: jest.fn() }),
  useParams: () => ({}),
}));

jest.mock("next/image", () => ({
  __esModule: true,
  default: (props: Record<string, unknown>) => {
    const { fill, priority, ...rest } = props;
    void fill;
    void priority;
    return <img {...rest} />;
  },
}));

const mockedUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;
const mockedEditionService = eventEditionService as jest.Mocked<
  typeof eventEditionService
>;
const mockedUserService = userService as jest.Mocked<typeof userService>;
const mockedPresentationService = presentationService as jest.Mocked<
  typeof presentationService
>;
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

const futureDeadline = new Date(Date.now() + 86400000 * 30).toISOString();
const pastDeadline = new Date(Date.now() - 86400000).toISOString();

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
  submissionDeadline: futureDeadline,
  isActive: true,
  isEvaluationRestrictToLoggedUsers: false,
  presentationDuration: 20,
  presentationsPerPresentationBlock: 5,
  createdAt: "2024-01-01T00:00:00.000Z",
  updatedAt: "2024-01-01T00:00:00.000Z",
};

const mockProfessors = [
  {
    id: "prof-1",
    name: "Dr. João",
    email: "joao@test.com",
    profile: "Professor" as const,
    level: "Default" as const,
    isActive: true,
    isVerified: true,
    isCommitteeOfActiveEdition: false,
  },
  {
    id: "prof-2",
    name: "Dra. Ana",
    email: "ana@test.com",
    profile: "Professor" as const,
    level: "Default" as const,
    isActive: true,
    isVerified: true,
    isCommitteeOfActiveEdition: false,
  },
];

const mockBlocks = [
  {
    id: "block-1",
    eventEditionId: "ed-1",
    roomId: "r1",
    type: "Presentation" as const,
    title: null,
    speakerName: null,
    startTime: "2024-11-12T09:00:00.000Z",
    duration: 20,
    createdAt: "2024-01-01T00:00:00.000Z",
    updatedAt: "2024-01-01T00:00:00.000Z",
  },
];

const mockExistingSubmission = {
  id: "sub-1",
  advisorId: "prof-1",
  mainAuthorId: "user-1",
  eventEditionId: "ed-1",
  title: "Minha Pesquisa",
  abstract: "Resumo existente",
  pdfFile: "/uploads/slide.pdf",
  phoneNumber: "71999999999",
  proposedPresentationBlockId: "block-1",
  proposedPositionWithinBlock: null,
  coAdvisor: "Co-orientador X",
  status: "Submitted" as const,
  createdAt: "2024-01-01T00:00:00.000Z",
  updatedAt: "2024-01-01T00:00:00.000Z",
};

function setupMocks(overrides?: { deadline?: string }) {
  mockedUseAuth.mockReturnValue({
    ...baseAuth,
    user: studentUser,
    isAuthenticated: true,
    isLoading: false,
  });

  const edition = overrides?.deadline
    ? { ...mockEdition, submissionDeadline: overrides.deadline }
    : mockEdition;

  mockedEditionService.getActiveEventEdition.mockResolvedValue({
    data: { data: edition },
  } as never);
  mockedUserService.getUsers.mockResolvedValue({
    data: { data: [...mockProfessors, studentUser] },
  } as never);
  mockedPresentationService.getPresentationBlocksByEdition.mockResolvedValue({
    data: { data: mockBlocks },
  } as never);
}

function createMockFile(
  name: string,
  size: number,
  type: string
): File {
  const buffer = new ArrayBuffer(size);
  return new File([buffer], name, { type });
}

describe("ApresentacaoSubmissaoForm", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("create mode", () => {
    it("renders the form with all fields", async () => {
      setupMocks();
      render(<ApresentacaoSubmissaoForm />);

      await waitFor(() => {
        expect(screen.getByRole("button", { name: "Cadastrar" })).toBeInTheDocument();
      });

      expect(screen.getByLabelText(/Tema/)).toBeInTheDocument();
      expect(screen.getByPlaceholderText("Resumo da apresentação")).toBeInTheDocument();
      expect(screen.getByText("Orientador")).toBeInTheDocument();
      expect(screen.getByLabelText(/Co-orientador/)).toBeInTheDocument();
      expect(screen.getByText("Sugestão de data e horário")).toBeInTheDocument();
      expect(screen.getByText(/Slide \(PDF\)/)).toBeInTheDocument();
      expect(screen.getByLabelText(/Telefone/)).toBeInTheDocument();
    });

    it("renders step indicator", async () => {
      setupMocks();
      render(<ApresentacaoSubmissaoForm />);

      await waitFor(() => {
        expect(screen.getByRole("button", { name: "Cadastrar" })).toBeInTheDocument();
      });
      expect(screen.getByText("1")).toBeInTheDocument();
      expect(screen.getByText("2")).toBeInTheDocument();
      expect(screen.getByText("3")).toBeInTheDocument();
    });

    it("shows author info from logged user", async () => {
      setupMocks();
      render(<ApresentacaoSubmissaoForm />);

      await waitFor(() => {
        expect(screen.getByText("Apresentador:")).toBeInTheDocument();
      });
      expect(screen.getByText("Maria Silva")).toBeInTheDocument();
    });

    it("populates professors dropdown", async () => {
      setupMocks();
      render(<ApresentacaoSubmissaoForm />);

      await waitFor(() => {
        expect(screen.getByText("Dr. João")).toBeInTheDocument();
      });
      expect(screen.getByText("Dra. Ana")).toBeInTheDocument();
    });

    it("shows validation errors on empty submit", async () => {
      setupMocks();
      render(<ApresentacaoSubmissaoForm />);

      await waitFor(() => {
        expect(screen.getByRole("button", { name: "Cadastrar" })).toBeInTheDocument();
      });

      fireEvent.click(screen.getByRole("button", { name: "Cadastrar" }));

      await waitFor(() => {
        expect(screen.getByText("Tema é obrigatório.")).toBeInTheDocument();
      });
      expect(screen.getByText("Abstract é obrigatório.")).toBeInTheDocument();
      expect(screen.getByText("Orientador é obrigatório.")).toBeInTheDocument();
      expect(screen.getByText("Telefone é obrigatório.")).toBeInTheDocument();
      expect(screen.getByText("Slide (PDF) é obrigatório.")).toBeInTheDocument();
    });

    it("validates file size over 10MB", async () => {
      setupMocks();
      render(<ApresentacaoSubmissaoForm />);

      await waitFor(() => {
        expect(screen.getByTestId("pdf-upload")).toBeInTheDocument();
      });

      const bigFile = createMockFile("big.pdf", 11 * 1024 * 1024, "application/pdf");
      fireEvent.change(screen.getByTestId("pdf-upload"), {
        target: { files: [bigFile] },
      });

      fireEvent.change(screen.getByLabelText(/Tema/), {
        target: { value: "Título" },
      });
      fireEvent.change(screen.getByPlaceholderText("Resumo da apresentação"), {
        target: { value: "Resumo" },
      });
      fireEvent.change(screen.getByLabelText(/Telefone/), {
        target: { value: "71999999999" },
      });

      const advisorSelect = screen.getAllByRole("combobox")[0];
      fireEvent.change(advisorSelect, { target: { value: "prof-1" } });

      fireEvent.click(screen.getByRole("button", { name: "Cadastrar" }));

      await waitFor(() => {
        expect(
          screen.getByText("O arquivo deve ter no máximo 10MB.")
        ).toBeInTheDocument();
      });
    });

    it("validates non-PDF file type", async () => {
      setupMocks();
      render(<ApresentacaoSubmissaoForm />);

      await waitFor(() => {
        expect(screen.getByTestId("pdf-upload")).toBeInTheDocument();
      });

      const txtFile = createMockFile("doc.txt", 1024, "text/plain");
      fireEvent.change(screen.getByTestId("pdf-upload"), {
        target: { files: [txtFile] },
      });

      fireEvent.change(screen.getByLabelText(/Tema/), {
        target: { value: "Título" },
      });
      fireEvent.change(screen.getByPlaceholderText("Resumo da apresentação"), {
        target: { value: "Resumo" },
      });
      fireEvent.change(screen.getByLabelText(/Telefone/), {
        target: { value: "71999999999" },
      });

      const advisorSelect = screen.getAllByRole("combobox")[0];
      fireEvent.change(advisorSelect, { target: { value: "prof-1" } });

      fireEvent.click(screen.getByRole("button", { name: "Cadastrar" }));

      await waitFor(() => {
        expect(
          screen.getByText("Apenas arquivos PDF são permitidos.")
        ).toBeInTheDocument();
      });
    });

    it("opens warning modal on valid submit", async () => {
      setupMocks();
      render(<ApresentacaoSubmissaoForm />);

      await waitFor(() => {
        expect(screen.getByRole("button", { name: "Cadastrar" })).toBeInTheDocument();
      });

      fireEvent.change(screen.getByLabelText(/Tema/), {
        target: { value: "Minha Pesquisa" },
      });
      fireEvent.change(screen.getByPlaceholderText("Resumo da apresentação"), {
        target: { value: "Resumo detalhado" },
      });
      fireEvent.change(screen.getByLabelText(/Telefone/), {
        target: { value: "71999999999" },
      });

      const advisorSelect = screen.getAllByRole("combobox")[0];
      fireEvent.change(advisorSelect, { target: { value: "prof-1" } });

      const validFile = createMockFile("slide.pdf", 1024, "application/pdf");
      fireEvent.change(screen.getByTestId("pdf-upload"), {
        target: { files: [validFile] },
      });

      fireEvent.click(screen.getByRole("button", { name: "Cadastrar" }));

      await waitFor(() => {
        expect(screen.getByText("ATENÇÃO")).toBeInTheDocument();
      });
      expect(screen.getByText(/comissão organizadora/)).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Enviar" })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Cancelar" })).toBeInTheDocument();
    });

    it("submits on confirm and shows success modal", async () => {
      setupMocks();
      mockedSubmissionService.createSubmission.mockResolvedValue({
        data: {
          data: mockExistingSubmission,
          message: "Criado",
        },
      } as never);

      render(<ApresentacaoSubmissaoForm />);

      await waitFor(() => {
        expect(screen.getByRole("button", { name: "Cadastrar" })).toBeInTheDocument();
      });

      fireEvent.change(screen.getByLabelText(/Tema/), {
        target: { value: "Minha Pesquisa" },
      });
      fireEvent.change(screen.getByPlaceholderText("Resumo da apresentação"), {
        target: { value: "Resumo detalhado" },
      });
      fireEvent.change(screen.getByLabelText(/Telefone/), {
        target: { value: "71999999999" },
      });

      const advisorSelect = screen.getAllByRole("combobox")[0];
      fireEvent.change(advisorSelect, { target: { value: "prof-1" } });

      const validFile = createMockFile("slide.pdf", 1024, "application/pdf");
      fireEvent.change(screen.getByTestId("pdf-upload"), {
        target: { files: [validFile] },
      });

      fireEvent.click(screen.getByRole("button", { name: "Cadastrar" }));

      await waitFor(() => {
        expect(screen.getByRole("button", { name: "Enviar" })).toBeInTheDocument();
      });

      fireEvent.click(screen.getByRole("button", { name: "Enviar" }));

      await waitFor(() => {
        expect(
          screen.getByText("Apresentação cadastrada!")
        ).toBeInTheDocument();
      });

      expect(mockedSubmissionService.createSubmission).toHaveBeenCalledTimes(1);
    });

    it("redirects to /aluno/apresentacoes after success modal close", async () => {
      setupMocks();
      mockedSubmissionService.createSubmission.mockResolvedValue({
        data: {
          data: mockExistingSubmission,
          message: "Criado",
        },
      } as never);

      render(<ApresentacaoSubmissaoForm />);

      await waitFor(() => {
        expect(screen.getByRole("button", { name: "Cadastrar" })).toBeInTheDocument();
      });

      fireEvent.change(screen.getByLabelText(/Tema/), {
        target: { value: "Pesquisa" },
      });
      fireEvent.change(screen.getByPlaceholderText("Resumo da apresentação"), {
        target: { value: "Resumo" },
      });
      fireEvent.change(screen.getByLabelText(/Telefone/), {
        target: { value: "71999" },
      });

      const advisorSelect = screen.getAllByRole("combobox")[0];
      fireEvent.change(advisorSelect, { target: { value: "prof-1" } });

      const validFile = createMockFile("slide.pdf", 1024, "application/pdf");
      fireEvent.change(screen.getByTestId("pdf-upload"), {
        target: { files: [validFile] },
      });

      fireEvent.click(screen.getByRole("button", { name: "Cadastrar" }));

      await waitFor(() => {
        expect(screen.getByRole("button", { name: "Enviar" })).toBeInTheDocument();
      });
      fireEvent.click(screen.getByRole("button", { name: "Enviar" }));

      await waitFor(() => {
        expect(screen.getByText("Apresentação cadastrada!")).toBeInTheDocument();
      });

      fireEvent.click(screen.getByLabelText("Fechar"));

      expect(mockPush).toHaveBeenCalledWith("/aluno/apresentacoes");
    });

    it("closes warning modal on cancel", async () => {
      setupMocks();
      render(<ApresentacaoSubmissaoForm />);

      await waitFor(() => {
        expect(screen.getByRole("button", { name: "Cadastrar" })).toBeInTheDocument();
      });

      fireEvent.change(screen.getByLabelText(/Tema/), {
        target: { value: "Pesquisa" },
      });
      fireEvent.change(screen.getByPlaceholderText("Resumo da apresentação"), {
        target: { value: "Resumo" },
      });
      fireEvent.change(screen.getByLabelText(/Telefone/), {
        target: { value: "71999" },
      });

      const advisorSelect = screen.getAllByRole("combobox")[0];
      fireEvent.change(advisorSelect, { target: { value: "prof-1" } });

      const validFile = createMockFile("slide.pdf", 1024, "application/pdf");
      fireEvent.change(screen.getByTestId("pdf-upload"), {
        target: { files: [validFile] },
      });

      fireEvent.click(screen.getByRole("button", { name: "Cadastrar" }));

      await waitFor(() => {
        expect(screen.getByText("ATENÇÃO")).toBeInTheDocument();
      });

      fireEvent.click(screen.getByRole("button", { name: "Cancelar" }));

      await waitFor(() => {
        expect(screen.queryByText("ATENÇÃO")).not.toBeInTheDocument();
      });
    });
  });

  describe("deadline validation", () => {
    it("shows deadline error when submission period is over", async () => {
      setupMocks({ deadline: pastDeadline });
      render(<ApresentacaoSubmissaoForm />);

      const formatted = new Date(pastDeadline).toLocaleDateString("pt-BR");

      await waitFor(() => {
        expect(
          screen.getByText(`Período de submissão encerrado em ${formatted}.`)
        ).toBeInTheDocument();
      });

      expect(screen.queryByLabelText(/Tema/)).not.toBeInTheDocument();
    });
  });

  describe("edit mode", () => {
    it("loads existing submission data", async () => {
      setupMocks();
      mockedSubmissionService.getSubmissionById.mockResolvedValue({
        data: { data: mockExistingSubmission },
      } as never);

      render(<ApresentacaoSubmissaoForm submissionId="sub-1" />);

      await waitFor(() => {
        expect(screen.getByDisplayValue("Minha Pesquisa")).toBeInTheDocument();
      });
      expect(screen.getByDisplayValue("Resumo existente")).toBeInTheDocument();
      expect(screen.getByDisplayValue("71999999999")).toBeInTheDocument();
      expect(screen.getByDisplayValue("Co-orientador X")).toBeInTheDocument();
      expect(screen.getByText("Arquivo atual: slide.pdf")).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Salvar" })).toBeInTheDocument();
    });

    it("shows edit title in header", async () => {
      setupMocks();
      mockedSubmissionService.getSubmissionById.mockResolvedValue({
        data: { data: mockExistingSubmission },
      } as never);

      render(<ApresentacaoSubmissaoForm submissionId="sub-1" />);

      await waitFor(() => {
        expect(screen.getByText("Editar Apresentação")).toBeInTheDocument();
      });
    });

    it("does not require PDF in edit mode", async () => {
      setupMocks();
      mockedSubmissionService.getSubmissionById.mockResolvedValue({
        data: { data: mockExistingSubmission },
      } as never);
      mockedSubmissionService.updateSubmission.mockResolvedValue({
        data: { data: mockExistingSubmission, message: "ok" },
      } as never);

      render(<ApresentacaoSubmissaoForm submissionId="sub-1" />);

      await waitFor(() => {
        expect(screen.getByRole("button", { name: "Salvar" })).toBeInTheDocument();
      });

      fireEvent.click(screen.getByRole("button", { name: "Salvar" }));

      await waitFor(() => {
        expect(screen.getByText("ATENÇÃO")).toBeInTheDocument();
      });
    });

    it("calls updateSubmission on confirm in edit mode", async () => {
      setupMocks();
      mockedSubmissionService.getSubmissionById.mockResolvedValue({
        data: { data: mockExistingSubmission },
      } as never);
      mockedSubmissionService.updateSubmission.mockResolvedValue({
        data: { data: mockExistingSubmission, message: "ok" },
      } as never);

      render(<ApresentacaoSubmissaoForm submissionId="sub-1" />);

      await waitFor(() => {
        expect(screen.getByRole("button", { name: "Salvar" })).toBeInTheDocument();
      });

      fireEvent.click(screen.getByRole("button", { name: "Salvar" }));

      await waitFor(() => {
        expect(screen.getByRole("button", { name: "Enviar" })).toBeInTheDocument();
      });

      fireEvent.click(screen.getByRole("button", { name: "Enviar" }));

      await waitFor(() => {
        expect(
          screen.getByText("Apresentação atualizada!")
        ).toBeInTheDocument();
      });

      expect(mockedSubmissionService.updateSubmission).toHaveBeenCalledTimes(1);
      expect(mockedSubmissionService.updateSubmission).toHaveBeenCalledWith(
        "sub-1",
        expect.objectContaining({ title: "Minha Pesquisa" }),
        undefined
      );
    });
  });

  describe("error handling", () => {
    it("shows error modal on API failure", async () => {
      setupMocks();
      mockedSubmissionService.createSubmission.mockRejectedValue({
        response: { data: { message: "Erro no servidor" } },
      });

      render(<ApresentacaoSubmissaoForm />);

      await waitFor(() => {
        expect(screen.getByRole("button", { name: "Cadastrar" })).toBeInTheDocument();
      });

      fireEvent.change(screen.getByLabelText(/Tema/), {
        target: { value: "Pesquisa" },
      });
      fireEvent.change(screen.getByPlaceholderText("Resumo da apresentação"), {
        target: { value: "Resumo" },
      });
      fireEvent.change(screen.getByLabelText(/Telefone/), {
        target: { value: "71999" },
      });

      const advisorSelect = screen.getAllByRole("combobox")[0];
      fireEvent.change(advisorSelect, { target: { value: "prof-1" } });

      const validFile = createMockFile("slide.pdf", 1024, "application/pdf");
      fireEvent.change(screen.getByTestId("pdf-upload"), {
        target: { files: [validFile] },
      });

      fireEvent.click(screen.getByRole("button", { name: "Cadastrar" }));

      await waitFor(() => {
        expect(screen.getByRole("button", { name: "Enviar" })).toBeInTheDocument();
      });
      fireEvent.click(screen.getByRole("button", { name: "Enviar" }));

      await waitFor(() => {
        expect(screen.getByText("Erro no servidor")).toBeInTheDocument();
      });
    });

    it("shows loading state initially", () => {
      setupMocks();
      mockedEditionService.getActiveEventEdition.mockReturnValue(
        new Promise(() => {}) as never
      );
      render(<ApresentacaoSubmissaoForm />);

      expect(screen.getByText("Carregando...")).toBeInTheDocument();
    });
  });
});
