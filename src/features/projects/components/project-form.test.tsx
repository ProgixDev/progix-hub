import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

const createProjectAction = vi.fn();
const updateProjectAction = vi.fn();
vi.mock("../actions", () => ({
  createProjectAction: (...args: unknown[]) => createProjectAction(...args),
  updateProjectAction: (...args: unknown[]) => updateProjectAction(...args),
}));

import { ProjectFormModal } from "./project-form";

describe("ProjectFormModal (AC-4)", () => {
  beforeEach(() => {
    createProjectAction.mockReset();
    updateProjectAction.mockReset();
  });

  it("keeps the dialog open and shows errors when the action rejects bad input", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    createProjectAction.mockResolvedValue({
      ok: false,
      error: "Please fix the highlighted fields.",
      fieldErrors: { github_url: "Enter a valid URL (including https://)" },
    });

    render(<ProjectFormModal editing={null} onClose={onClose} />);

    await user.type(screen.getByRole("textbox", { name: /name/i }), "Atlas");
    await user.type(screen.getByRole("textbox", { name: /github/i }), "not-a-url");
    await user.click(screen.getByRole("button", { name: "Create project" }));

    expect(await screen.findByText("Please fix the highlighted fields.")).toBeInTheDocument();
    expect(screen.getByText(/Enter a valid URL/i)).toBeInTheDocument();
    expect(onClose).not.toHaveBeenCalled();
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  it("closes on a successful create", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    createProjectAction.mockResolvedValue({ ok: true });

    render(<ProjectFormModal editing={null} onClose={onClose} />);
    await user.type(screen.getByRole("textbox", { name: /name/i }), "Atlas");
    await user.click(screen.getByRole("button", { name: "Create project" }));

    await waitFor(() => expect(onClose).toHaveBeenCalled());
  });
});
