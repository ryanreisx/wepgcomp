import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import CertificadosPage from "./CertificadosPage";
import { useAuth } from "@/hooks/useAuth";
import { useUserView } from "@/hooks/useUserView";
import * as certificateService from "@/services/certificate.service";
import * as eventEditionService from "@/services/event-edition.service";
import * as userService from "@/services/user.service";

jest.mock("@/hooks/useAuth");
jest.mock("@/hooks/useUserView");
jest.mock("@/services/certificate.service");
jest.mock("@/services/event-edition.service");
jest.mock("@/services/user.service");

const mockPush = jest.fn();
jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush, replace: jest.fn() }),
}));

const mockedUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;
const mockedUseUserView = useUserView as jest.MockedFunction<
  typeof useUserView
>;
const mockedCertService = certificateService as jest.Mocked<
  typeof certificateService
>;
const mockedEditionService = eventEditionService as jest.Mocked<
  typeof eventEditionService
>;
const mockedUserService = userService as jest.Mocked<typeof userService>;

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

const mockEditions = [
  mockEdition,
  {
    ...mockEdition,
    id: "ed-2",
    name: "WEPGCOMP 2023",
    isActive: false,
    startDate: "2023-11-12T00:00:00.000Z",
    endDate: "2023-11-14T00:00:00.000Z",
  },
];

const mockUsers = [
  {
    id: "user-a",
    name: "Alice Silva",
    email: "alice@t.com",
    profile: "DoctoralStudent" as const,
    level: "Default" as const,
    isActive: true,
    isVerified: true,
    isCommitteeOfActiveEdition: false,
  },
  {
    id: "user-b",
    name: "Bob Santos",
    email: "bob@t.com",
    profile: "Professor" as const,
    level: "Default" as const,
    isActive: true,
    isVerified: true,
    isCommitteeOfActiveEdition: false,
  },
];

const mockCertificates = [
  {
    id: "cert-1",
    eventEditionId: "ed-1",
    userId: "user-a",
    filePath: "certificates/ed-1/user-a.pdf",
    isEmailSent: true,
    createdAt: "2024-12-01T00:00:00.000Z",
    updatedAt: "2024-12-01T00:00:00.000Z",
  },
  {
    id: "cert-2",
    eventEditionId: "ed-1",
    userId: "user-b",
    filePath: "certificates/ed-1/user-b.pdf",
    isEmailSent: false,
    createdAt: "2024-12-01T00:00:00.000Z",
    updatedAt: "2024-12-01T00:00:00.000Z",
  },
];

const mockMyCertificates = [
  {
    id: "cert-1",
    eventEditionId: "ed-1",
    userId: "me",
    filePath: "certificates/ed-1/me.pdf",
    isEmailSent: true,
    createdAt: "2024-12-01T00:00:00.000Z",
    updatedAt: "2024-12-01T00:00:00.000Z",
  },
];

function setupAdminMocks(view: "superadmin" | "committee") {
  mockedUseAuth.mockReturnValue({
    ...baseAuth,
    user: {
      id: "me",
      name: "Admin",
      email: "admin@t.com",
      profile: "Professor" as const,
      level: view === "superadmin" ? ("Superadmin" as const) : ("Admin" as const),
      isActive: true,
      isVerified: true,
      isCommitteeOfActiveEdition: view === "committee",
    },
    isAuthenticated: true,
    isLoading: false,
  });
  mockedUseUserView.mockReturnValue(view);
  mockedEditionService.getEventEditions.mockResolvedValue({
    data: { data: mockEditions },
  } as never);
  mockedEditionService.getActiveEventEdition.mockResolvedValue({
    data: { data: mockEdition },
  } as never);
  mockedUserService.getUsers.mockResolvedValue({
    data: { data: mockUsers },
  } as never);
}

function setupUserMocks(view: "student" | "listener") {
  mockedUseAuth.mockReturnValue({
    ...baseAuth,
    user: {
      id: "me",
      name: "Me",
      email: "me@t.com",
      profile:
        view === "student"
          ? ("DoctoralStudent" as const)
          : ("Listener" as const),
      level: "Default" as const,
      isActive: true,
      isVerified: true,
      isCommitteeOfActiveEdition: false,
    },
    isAuthenticated: true,
    isLoading: false,
  });
  mockedUseUserView.mockReturnValue(view);
  mockedCertService.getMyCertificates.mockResolvedValue({
    data: { data: mockMyCertificates },
  } as never);
  mockedEditionService.getEventEditions.mockResolvedValue({
    data: { data: mockEditions },
  } as never);
}

describe("CertificadosPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("SuperAdmin view", () => {
    it("renders edition select and generate button", async () => {
      setupAdminMocks("superadmin");
      render(<CertificadosPage />);

      await waitFor(() => {
        expect(screen.getByLabelText("Edição")).toBeInTheDocument();
      });

      expect(
        screen.getByRole("button", { name: "Gerar Certificados" })
      ).toBeInTheDocument();
    });

    it("populates edition select with all editions", async () => {
      setupAdminMocks("superadmin");
      render(<CertificadosPage />);

      await waitFor(() => {
        expect(screen.getByLabelText("Edição")).toBeInTheDocument();
      });

      const select = screen.getByLabelText("Edição") as HTMLSelectElement;
      expect(select.options.length).toBe(3);
      expect(select.options[1].textContent).toBe("WEPGCOMP 2024");
      expect(select.options[2].textContent).toBe("WEPGCOMP 2023");
    });

    it("generates certificates and shows table on success", async () => {
      setupAdminMocks("superadmin");
      mockedCertService.generateCertificates.mockResolvedValue({
        data: { data: mockCertificates, message: "ok" },
      } as never);

      render(<CertificadosPage />);

      await waitFor(() => {
        expect(screen.getByLabelText("Edição")).toBeInTheDocument();
      });

      fireEvent.change(screen.getByLabelText("Edição"), {
        target: { value: "ed-1" },
      });

      fireEvent.click(
        screen.getByRole("button", { name: "Gerar Certificados" })
      );

      await waitFor(() => {
        expect(screen.getByText("Certificados gerados!")).toBeInTheDocument();
      });

      expect(mockedCertService.generateCertificates).toHaveBeenCalledWith(
        "ed-1"
      );

      expect(screen.getByText("Alice Silva")).toBeInTheDocument();
      expect(screen.getByText("Bob Santos")).toBeInTheDocument();
      expect(screen.getByText("Enviado")).toBeInTheDocument();
      expect(screen.getByText("Pendente")).toBeInTheDocument();
    });

    it("shows error modal on generation failure", async () => {
      setupAdminMocks("superadmin");
      mockedCertService.generateCertificates.mockRejectedValue(
        new Error("fail")
      );

      render(<CertificadosPage />);

      await waitFor(() => {
        expect(screen.getByLabelText("Edição")).toBeInTheDocument();
      });

      fireEvent.change(screen.getByLabelText("Edição"), {
        target: { value: "ed-1" },
      });

      fireEvent.click(
        screen.getByRole("button", { name: "Gerar Certificados" })
      );

      await waitFor(() => {
        expect(
          screen.getByText("Erro ao gerar certificados.")
        ).toBeInTheDocument();
      });
    });

    it("disables generate button when no edition selected", async () => {
      setupAdminMocks("superadmin");
      render(<CertificadosPage />);

      await waitFor(() => {
        expect(screen.getByLabelText("Edição")).toBeInTheDocument();
      });

      const btn = screen.getByRole("button", { name: "Gerar Certificados" });
      expect(btn).toBeDisabled();
    });

    it("shows loading state on generate button while generating", async () => {
      setupAdminMocks("superadmin");
      mockedCertService.generateCertificates.mockReturnValue(
        new Promise(() => {}) as never
      );

      render(<CertificadosPage />);

      await waitFor(() => {
        expect(screen.getByLabelText("Edição")).toBeInTheDocument();
      });

      fireEvent.change(screen.getByLabelText("Edição"), {
        target: { value: "ed-1" },
      });

      fireEvent.click(
        screen.getByRole("button", { name: "Gerar Certificados" })
      );

      expect(screen.getByText("Gerando...")).toBeInTheDocument();
    });
  });

  describe("Committee view", () => {
    it("renders generate button without edition select", async () => {
      setupAdminMocks("committee");
      render(<CertificadosPage />);

      await waitFor(() => {
        expect(
          screen.getByRole("button", { name: "Gerar Certificados" })
        ).toBeInTheDocument();
      });

      expect(screen.queryByLabelText("Edição")).not.toBeInTheDocument();
    });

    it("uses active edition for generation", async () => {
      setupAdminMocks("committee");
      mockedCertService.generateCertificates.mockResolvedValue({
        data: { data: mockCertificates, message: "ok" },
      } as never);

      render(<CertificadosPage />);

      await waitFor(() => {
        expect(
          screen.getByRole("button", { name: "Gerar Certificados" })
        ).toBeInTheDocument();
      });

      fireEvent.click(
        screen.getByRole("button", { name: "Gerar Certificados" })
      );

      await waitFor(() => {
        expect(screen.getByText("Certificados gerados!")).toBeInTheDocument();
      });

      expect(mockedCertService.generateCertificates).toHaveBeenCalledWith(
        "ed-1"
      );
    });
  });

  describe("Student view", () => {
    it("renders certificate cards with edition name and download button", async () => {
      setupUserMocks("student");
      render(<CertificadosPage />);

      await waitFor(() => {
        expect(screen.getByText("WEPGCOMP 2024")).toBeInTheDocument();
      });

      expect(
        screen.getByRole("button", { name: "Baixar" })
      ).toBeInTheDocument();
    });

    it("shows empty state when no certificates", async () => {
      setupUserMocks("student");
      mockedCertService.getMyCertificates.mockResolvedValue({
        data: { data: [] },
      } as never);

      render(<CertificadosPage />);

      await waitFor(() => {
        expect(
          screen.getByText("Você ainda não possui certificados.")
        ).toBeInTheDocument();
      });
    });

    it("triggers download on button click", async () => {
      setupUserMocks("student");
      const mockBlob = new Blob(["pdf"], { type: "application/pdf" });
      mockedCertService.downloadCertificate.mockResolvedValue({
        data: mockBlob,
      } as never);

      const createObjectURL = jest.fn(() => "blob:mock-url");
      const revokeObjectURL = jest.fn();
      Object.defineProperty(window, "URL", {
        value: { createObjectURL, revokeObjectURL },
        writable: true,
      });

      render(<CertificadosPage />);

      await waitFor(() => {
        expect(
          screen.getByRole("button", { name: "Baixar" })
        ).toBeInTheDocument();
      });

      fireEvent.click(screen.getByRole("button", { name: "Baixar" }));

      await waitFor(() => {
        expect(mockedCertService.downloadCertificate).toHaveBeenCalledWith(
          "cert-1"
        );
      });
    });
  });

  describe("Listener view", () => {
    it("renders same card layout as student view", async () => {
      setupUserMocks("listener");
      render(<CertificadosPage />);

      await waitFor(() => {
        expect(screen.getByText("WEPGCOMP 2024")).toBeInTheDocument();
      });

      expect(
        screen.getByRole("button", { name: "Baixar" })
      ).toBeInTheDocument();
    });
  });

  describe("Common", () => {
    it("shows loading state initially", () => {
      setupUserMocks("student");
      mockedCertService.getMyCertificates.mockReturnValue(
        new Promise(() => {}) as never
      );
      mockedEditionService.getEventEditions.mockReturnValue(
        new Promise(() => {}) as never
      );

      render(<CertificadosPage />);

      expect(screen.getByText("Carregando...")).toBeInTheDocument();
    });
  });
});
