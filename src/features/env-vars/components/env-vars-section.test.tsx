import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { EnvVarsSection } from "./env-vars-section";

// Stub the server-action module so importing the section doesn't pull `server-only` into jsdom.
vi.mock("../actions", () => ({
  createEnvVarAction: vi.fn(),
  updateEnvVarAction: vi.fn(),
  deleteEnvVarAction: vi.fn(),
  revealEnvVarValueAction: vi.fn(),
}));

describe("EnvVarsSection", () => {
  it("shows an invite empty state and an add button when there are no variables (AC-9)", () => {
    render(
      <EnvVarsSection projectId="11111111-1111-1111-1111-111111111111" envVars={[]} audit={[]} />,
    );
    expect(screen.getByText(/no variables yet/i)).toBeTruthy();
    expect(screen.getByRole("button", { name: /add variable/i })).toBeTruthy();
  });
});
