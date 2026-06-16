import { screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { renderWithIntl } from "@/test/intl";
import type { EnvVarMeta } from "../types";
import { EnvVarsSection } from "./env-vars-section";

// Stub the server-action module so importing the section doesn't pull `server-only` into jsdom.
vi.mock("../actions", () => ({
  createEnvVarAction: vi.fn(),
  updateEnvVarAction: vi.fn(),
  deleteEnvVarAction: vi.fn(),
  revealEnvVarValueAction: vi.fn(),
  importEnvVarsAction: vi.fn(),
  exportEnvFileAction: vi.fn(),
}));

const baseVar: EnvVarMeta = {
  id: "11111111-1111-1111-1111-111111111111",
  project_id: "22222222-2222-2222-2222-222222222222",
  key: "STRIPE_SECRET_KEY",
  service: "stripe",
  scope: "backend",
  created_at: "2026-06-09T00:00:00Z",
  updated_at: "2026-06-09T00:00:00Z",
};

const projectId = "22222222-2222-2222-2222-222222222222";

describe("EnvVarsSection", () => {
  it("shows an invite empty state and an add button when there are no variables (AC-9)", () => {
    renderWithIntl(<EnvVarsSection projectId={projectId} envVars={[]} audit={[]} />);
    expect(screen.getByText(/no variables yet/i)).toBeTruthy();
    expect(screen.getByRole("button", { name: /add variable/i })).toBeTruthy();
  });

  it("renders a row with its auto-matched service logo and a masked value (AC-1/AC-2)", () => {
    renderWithIntl(<EnvVarsSection projectId={projectId} envVars={[baseVar]} audit={[]} />);
    expect(screen.getByText("STRIPE_SECRET_KEY")).toBeTruthy();
    expect(screen.getByTestId("service-logo").getAttribute("data-service")).toBe("stripe");
    expect(screen.getByText("••••••••••••")).toBeTruthy();
  });

  it("groups variables under Backend and Frontend headings (spec 009 AC-1)", () => {
    renderWithIntl(
      <EnvVarsSection
        projectId={projectId}
        envVars={[
          baseVar,
          {
            ...baseVar,
            id: "33333333-3333-3333-3333-333333333333",
            key: "NEXT_PUBLIC_API",
            scope: "frontend",
          },
        ]}
        audit={[]}
      />,
    );
    expect(screen.getByRole("heading", { name: "Backend" })).toBeTruthy();
    expect(screen.getByRole("heading", { name: "Frontend" })).toBeTruthy();
    expect(screen.getByText("STRIPE_SECRET_KEY")).toBeTruthy();
    expect(screen.getByText("NEXT_PUBLIC_API")).toBeTruthy();
  });

  it("offers import and export controls to a writer (spec 009)", () => {
    renderWithIntl(<EnvVarsSection projectId={projectId} envVars={[baseVar]} audit={[]} />);
    expect(screen.getByRole("button", { name: /^import$/i })).toBeTruthy();
    expect(screen.getByText(/^export$/i)).toBeTruthy();
  });

  it("renders a neutral default logo for an unknown service", () => {
    renderWithIntl(
      <EnvVarsSection projectId={projectId} envVars={[{ ...baseVar, service: null }]} audit={[]} />,
    );
    expect(screen.getByTestId("service-logo").getAttribute("data-service")).toBe("none");
  });

  it("hides mutation controls for a viewer who cannot write (AC-roles)", () => {
    renderWithIntl(
      <EnvVarsSection projectId={projectId} envVars={[baseVar]} audit={[]} canWrite={false} />,
    );
    expect(screen.getByText("STRIPE_SECRET_KEY")).toBeTruthy();
    expect(screen.queryByRole("button", { name: /add variable/i })).toBeNull();
    expect(screen.queryByRole("button", { name: /reveal/i })).toBeNull();
    expect(screen.queryByRole("button", { name: /^import$/i })).toBeNull();
  });
});
