import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import LoginScreen from "./LoginScreen";
import { useCookSession } from "../../context/CookSessionContext";

vi.mock("../../context/CookSessionContext", () => ({ useCookSession: vi.fn() }));
const mocked = useCookSession as unknown as ReturnType<typeof vi.fn>;

function setup(overrides: Record<string, unknown> = {}) {
  const ctx = {
    username: "",
    setUsername: vi.fn(),
    password: "",
    setPassword: vi.fn(),
    authError: null,
    isLoggingIn: false,
    handleLogin: vi.fn().mockResolvedValue(undefined),
    ...overrides,
  };
  mocked.mockReturnValue(ctx);
  render(<LoginScreen />);
  return ctx;
}

beforeEach(() => mocked.mockReset());

describe("LoginScreen", () => {
  it("names the product, not a leftover brand", () => {
    setup();
    expect(screen.getByRole("heading", { name: "FireBoard Pitmaster" })).toBeInTheDocument();
    expect(screen.queryByText(/hearth command/i)).not.toBeInTheDocument();
  });

  it("explains missing fields instead of submitting", async () => {
    const ctx = setup();
    await userEvent.click(screen.getByRole("button", { name: "Sign in" }));
    expect(screen.getByText("Enter your username.")).toBeInTheDocument();
    expect(screen.getByText("Enter your password.")).toBeInTheDocument();
    expect(ctx.handleLogin).not.toHaveBeenCalled();
    expect(screen.getByLabelText("Username")).toHaveFocus();
  });

  it("signs in when both fields are filled", async () => {
    const ctx = setup({ username: "tobin", password: "secret" });
    await userEvent.click(screen.getByRole("button", { name: "Sign in" }));
    expect(ctx.handleLogin).toHaveBeenCalledTimes(1);
  });

  it("uses password and autocomplete semantics", () => {
    setup();
    expect(screen.getByLabelText("Password")).toHaveAttribute("type", "password");
    expect(screen.getByLabelText("Password")).toHaveAttribute("autocomplete", "current-password");
    expect(screen.getByLabelText("Username")).toHaveAttribute("autocomplete", "username");
  });

  it("shows the server's reason and a busy state", () => {
    setup({ authError: "Username and password are required.", isLoggingIn: true });
    expect(screen.getByRole("alert")).toHaveTextContent("Username and password are required.");
    expect(screen.getByRole("button", { name: "Signing in…" })).toBeDisabled();
  });
});
