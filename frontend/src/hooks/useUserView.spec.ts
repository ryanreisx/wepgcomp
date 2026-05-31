import { renderHook } from "@testing-library/react";
import { useUserView } from "./useUserView";
import { useAuth } from "@/hooks/useAuth";

jest.mock("@/hooks/useAuth");

const mockedUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;

const baseAuth = {
  login: jest.fn(),
  logout: jest.fn(),
  register: jest.fn(),
  refresh: jest.fn(),
  isLoading: false,
};

const defaultUser = {
  id: "1",
  name: "User",
  email: "u@e.com",
  profile: "DoctoralStudent" as const,
  level: "Default" as const,
  isActive: true,
  isVerified: true,
  isCommitteeOfActiveEdition: false,
};

describe("useUserView", () => {
  it("returns 'public' when not authenticated", () => {
    mockedUseAuth.mockReturnValue({
      ...baseAuth,
      user: null,
      isAuthenticated: false,
    });
    const { result } = renderHook(() => useUserView());
    expect(result.current).toBe("public");
  });

  it("returns 'superadmin' for Superadmin level", () => {
    mockedUseAuth.mockReturnValue({
      ...baseAuth,
      user: { ...defaultUser, level: "Superadmin" },
      isAuthenticated: true,
    });
    const { result } = renderHook(() => useUserView());
    expect(result.current).toBe("superadmin");
  });

  it("returns 'committee' for committee member of active edition", () => {
    mockedUseAuth.mockReturnValue({
      ...baseAuth,
      user: {
        ...defaultUser,
        profile: "Professor",
        isCommitteeOfActiveEdition: true,
      },
      isAuthenticated: true,
    });
    const { result } = renderHook(() => useUserView());
    expect(result.current).toBe("committee");
  });

  it("returns 'student' for DoctoralStudent profile", () => {
    mockedUseAuth.mockReturnValue({
      ...baseAuth,
      user: defaultUser,
      isAuthenticated: true,
    });
    const { result } = renderHook(() => useUserView());
    expect(result.current).toBe("student");
  });

  it("returns 'listener' for Listener profile", () => {
    mockedUseAuth.mockReturnValue({
      ...baseAuth,
      user: { ...defaultUser, profile: "Listener" },
      isAuthenticated: true,
    });
    const { result } = renderHook(() => useUserView());
    expect(result.current).toBe("listener");
  });

  it("returns 'listener' for Professor without committee role", () => {
    mockedUseAuth.mockReturnValue({
      ...baseAuth,
      user: { ...defaultUser, profile: "Professor" },
      isAuthenticated: true,
    });
    const { result } = renderHook(() => useUserView());
    expect(result.current).toBe("listener");
  });

  it("prioritizes superadmin over committee", () => {
    mockedUseAuth.mockReturnValue({
      ...baseAuth,
      user: {
        ...defaultUser,
        level: "Superadmin",
        isCommitteeOfActiveEdition: true,
      },
      isAuthenticated: true,
    });
    const { result } = renderHook(() => useUserView());
    expect(result.current).toBe("superadmin");
  });
});
