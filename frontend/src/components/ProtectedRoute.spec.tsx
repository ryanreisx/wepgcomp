import { render, screen } from "@testing-library/react";
import { ProtectedRoute } from "./ProtectedRoute";
import { useAuth } from "@/hooks/useAuth";

jest.mock("@/hooks/useAuth");
jest.mock("next/navigation", () => ({
  useRouter: () => ({
    replace: mockReplace,
  }),
}));

const mockReplace = jest.fn();
const mockedUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;

const baseAuth = {
  login: jest.fn(),
  logout: jest.fn(),
  register: jest.fn(),
  refresh: jest.fn(),
};

const defaultUser = {
  id: "1",
  name: "User",
  email: "u@e.com",
  profile: "DoctoralStudent" as const,
  level: "Default" as const,
  isCommitteeOfActiveEdition: false,
};

describe("ProtectedRoute", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should render nothing while loading", () => {
    mockedUseAuth.mockReturnValue({
      ...baseAuth,
      user: null,
      isAuthenticated: false,
      isLoading: true,
    });

    const { container } = render(
      <ProtectedRoute>
        <div>protected</div>
      </ProtectedRoute>
    );

    expect(container.innerHTML).toBe("");
  });

  it("should redirect to /login when not authenticated", () => {
    mockedUseAuth.mockReturnValue({
      ...baseAuth,
      user: null,
      isAuthenticated: false,
      isLoading: false,
    });

    render(
      <ProtectedRoute>
        <div>protected</div>
      </ProtectedRoute>
    );

    expect(mockReplace).toHaveBeenCalledWith("/login");
    expect(screen.queryByText("protected")).toBeNull();
  });

  it("should render children when authenticated (no extra requirements)", () => {
    mockedUseAuth.mockReturnValue({
      ...baseAuth,
      user: defaultUser,
      isAuthenticated: true,
      isLoading: false,
    });

    render(
      <ProtectedRoute>
        <div>protected</div>
      </ProtectedRoute>
    );

    expect(screen.getByText("protected")).toBeInTheDocument();
    expect(mockReplace).not.toHaveBeenCalled();
  });

  it("should enforce requiredLevel", () => {
    mockedUseAuth.mockReturnValue({
      ...baseAuth,
      user: defaultUser,
      isAuthenticated: true,
      isLoading: false,
    });

    render(
      <ProtectedRoute requiredLevel="Admin">
        <div>admin content</div>
      </ProtectedRoute>
    );

    expect(mockReplace).toHaveBeenCalledWith("/login");
    expect(screen.queryByText("admin content")).toBeNull();
  });

  it("should allow Superadmin for Admin-required route (hierarchy)", () => {
    mockedUseAuth.mockReturnValue({
      ...baseAuth,
      user: { ...defaultUser, level: "Superadmin" },
      isAuthenticated: true,
      isLoading: false,
    });

    render(
      <ProtectedRoute requiredLevel="Admin">
        <div>admin content</div>
      </ProtectedRoute>
    );

    expect(screen.getByText("admin content")).toBeInTheDocument();
    expect(mockReplace).not.toHaveBeenCalled();
  });

  it("should enforce requiredProfile", () => {
    mockedUseAuth.mockReturnValue({
      ...baseAuth,
      user: { ...defaultUser, profile: "Listener" },
      isAuthenticated: true,
      isLoading: false,
    });

    render(
      <ProtectedRoute requiredProfile="DoctoralStudent">
        <div>student content</div>
      </ProtectedRoute>
    );

    expect(mockReplace).toHaveBeenCalledWith("/login");
    expect(screen.queryByText("student content")).toBeNull();
  });

  it("should allow matching profile", () => {
    mockedUseAuth.mockReturnValue({
      ...baseAuth,
      user: defaultUser,
      isAuthenticated: true,
      isLoading: false,
    });

    render(
      <ProtectedRoute requiredProfile="DoctoralStudent">
        <div>student content</div>
      </ProtectedRoute>
    );

    expect(screen.getByText("student content")).toBeInTheDocument();
  });

  it("should accept array of profiles", () => {
    mockedUseAuth.mockReturnValue({
      ...baseAuth,
      user: { ...defaultUser, profile: "Professor" },
      isAuthenticated: true,
      isLoading: false,
    });

    render(
      <ProtectedRoute requiredProfile={["DoctoralStudent", "Professor"]}>
        <div>content</div>
      </ProtectedRoute>
    );

    expect(screen.getByText("content")).toBeInTheDocument();
  });

  it("should enforce requireEditionAdmin", () => {
    mockedUseAuth.mockReturnValue({
      ...baseAuth,
      user: defaultUser,
      isAuthenticated: true,
      isLoading: false,
    });

    render(
      <ProtectedRoute requireEditionAdmin>
        <div>committee content</div>
      </ProtectedRoute>
    );

    expect(mockReplace).toHaveBeenCalledWith("/login");
    expect(screen.queryByText("committee content")).toBeNull();
  });

  it("should allow committee member for requireEditionAdmin", () => {
    mockedUseAuth.mockReturnValue({
      ...baseAuth,
      user: { ...defaultUser, isCommitteeOfActiveEdition: true },
      isAuthenticated: true,
      isLoading: false,
    });

    render(
      <ProtectedRoute requireEditionAdmin>
        <div>committee content</div>
      </ProtectedRoute>
    );

    expect(screen.getByText("committee content")).toBeInTheDocument();
  });

  it("should allow Superadmin for requireEditionAdmin", () => {
    mockedUseAuth.mockReturnValue({
      ...baseAuth,
      user: { ...defaultUser, level: "Superadmin" },
      isAuthenticated: true,
      isLoading: false,
    });

    render(
      <ProtectedRoute requireEditionAdmin>
        <div>committee content</div>
      </ProtectedRoute>
    );

    expect(screen.getByText("committee content")).toBeInTheDocument();
  });
});
