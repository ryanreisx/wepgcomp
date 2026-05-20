import { render, screen, waitFor, act } from "@testing-library/react";
import { useContext } from "react";
import { AuthProvider, AuthContext } from "./AuthContext";
import * as authService from "@/services/auth.service";

jest.mock("@/services/auth.service");

const mockedAuthService = authService as jest.Mocked<typeof authService>;

const mockUser = {
  id: "user-1",
  name: "Test User",
  email: "test@example.com",
  profile: "DoctoralStudent" as const,
  level: "Default" as const,
  isCommitteeOfActiveEdition: false,
};

function TestConsumer({ onRender }: { onRender?: (ctx: unknown) => void }) {
  const ctx = useContext(AuthContext);
  if (onRender && ctx) onRender(ctx);
  if (!ctx) return <div>no context</div>;
  return (
    <div>
      <span data-testid="loading">{String(ctx.isLoading)}</span>
      <span data-testid="authenticated">{String(ctx.isAuthenticated)}</span>
      <span data-testid="user">{ctx.user ? ctx.user.name : "null"}</span>
      <span data-testid="committee">
        {ctx.user ? String(ctx.user.isCommitteeOfActiveEdition) : "null"}
      </span>
      <button onClick={() => ctx.login("test@example.com", "pass")}>
        login
      </button>
      <button onClick={() => ctx.logout()}>logout</button>
      <button onClick={() => ctx.refresh()}>refresh</button>
      <button
        onClick={() =>
          ctx.register({
            name: "New",
            email: "new@example.com",
            password: "pass",
            profile: "Listener",
          })
        }
      >
        register
      </button>
    </div>
  );
}

describe("AuthContext", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should start loading and fetch /me on mount", async () => {
    mockedAuthService.getMe.mockResolvedValue({
      data: { data: mockUser },
    } as never);

    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId("loading")).toHaveTextContent("false");
    });

    expect(screen.getByTestId("authenticated")).toHaveTextContent("true");
    expect(screen.getByTestId("user")).toHaveTextContent("Test User");
  });

  it("should set isAuthenticated to false when /me fails", async () => {
    mockedAuthService.getMe.mockRejectedValue(new Error("401"));

    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId("loading")).toHaveTextContent("false");
    });

    expect(screen.getByTestId("authenticated")).toHaveTextContent("false");
    expect(screen.getByTestId("user")).toHaveTextContent("null");
  });

  it("should login and populate user via /me", async () => {
    mockedAuthService.getMe
      .mockRejectedValueOnce(new Error("401"))
      .mockResolvedValueOnce({ data: { data: mockUser } } as never);
    mockedAuthService.login.mockResolvedValue({} as never);

    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId("loading")).toHaveTextContent("false");
    });

    expect(screen.getByTestId("authenticated")).toHaveTextContent("false");

    await act(async () => {
      screen.getByText("login").click();
    });

    expect(mockedAuthService.login).toHaveBeenCalledWith(
      "test@example.com",
      "pass"
    );
    expect(screen.getByTestId("authenticated")).toHaveTextContent("true");
    expect(screen.getByTestId("user")).toHaveTextContent("Test User");
  });

  it("should logout and clear user", async () => {
    mockedAuthService.getMe.mockResolvedValue({
      data: { data: mockUser },
    } as never);
    mockedAuthService.logout.mockResolvedValue({} as never);

    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId("authenticated")).toHaveTextContent("true");
    });

    await act(async () => {
      screen.getByText("logout").click();
    });

    expect(mockedAuthService.logout).toHaveBeenCalled();
    expect(screen.getByTestId("authenticated")).toHaveTextContent("false");
    expect(screen.getByTestId("user")).toHaveTextContent("null");
  });

  it("should call register service", async () => {
    mockedAuthService.getMe.mockRejectedValue(new Error("401"));
    mockedAuthService.register.mockResolvedValue({} as never);

    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId("loading")).toHaveTextContent("false");
    });

    await act(async () => {
      screen.getByText("register").click();
    });

    expect(mockedAuthService.register).toHaveBeenCalledWith({
      name: "New",
      email: "new@example.com",
      password: "pass",
      profile: "Listener",
    });
  });

  it("should refresh user data via /me", async () => {
    const updatedUser = { ...mockUser, isCommitteeOfActiveEdition: true };
    mockedAuthService.getMe
      .mockResolvedValueOnce({ data: { data: mockUser } } as never)
      .mockResolvedValueOnce({ data: { data: updatedUser } } as never);

    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId("loading")).toHaveTextContent("false");
    });

    expect(screen.getByTestId("committee")).toHaveTextContent("false");

    await act(async () => {
      screen.getByText("refresh").click();
    });

    expect(mockedAuthService.getMe).toHaveBeenCalledTimes(2);
    expect(screen.getByTestId("committee")).toHaveTextContent("true");
  });
});
