import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { Topbar } from "@/components/layout/topbar";

vi.mock("next-themes", () => ({
  useTheme: () => ({ theme: "light", setTheme: vi.fn() }),
}));

const user = {
  id: "user-1",
  email: "dispatcher@transitops.local",
  name: "Dispatcher User",
  roleSlug: "dispatcher" as const,
  status: "ACTIVE" as const,
  permissions: [],
};

describe("Topbar", () => {
  it("keeps identity, theme, and logout controls available", () => {
    render(<Topbar user={user} />);

    expect(screen.getByText("Dispatcher User")).toBeInTheDocument();
    expect(screen.getByText("dispatcher")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Toggle theme" })
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Log out" })).toHaveAttribute(
      "href",
      "/logout"
    );
  });
});
