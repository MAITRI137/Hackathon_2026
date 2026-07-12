import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import Home from "@/app/page";

vi.mock("@/lib/db", () => ({
  db: {
    healthCheck: {
      findMany: vi.fn().mockResolvedValue([{ id: "test", status: "OK" }]),
    },
  },
}));

describe("Home Page", () => {
  it("renders the ready message", async () => {
    // Note: Since Home is an async component, in a real app you'd test it differently
    // or extract the UI into a client component.
    // We are simulating the render here for the POC structure.
    const UI = await Home();
    render(UI);
    expect(
      screen.getByText(/TransitOps workspace is ready/i)
    ).toBeInTheDocument();
  });
});
