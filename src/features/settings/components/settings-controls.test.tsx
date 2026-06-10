import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderWithIntl } from "@/test/intl";
import { updateSettingsAction } from "../actions";
import { SettingsControls } from "./settings-controls";

vi.mock("../actions", () => ({ updateSettingsAction: vi.fn().mockResolvedValue({ ok: true }) }));

const mockAction = vi.mocked(updateSettingsAction);

beforeEach(() => vi.clearAllMocks());

describe("SettingsControls (AC-1 / AC-3)", () => {
  it("reflects the member's current language and theme", () => {
    renderWithIntl(<SettingsControls current={{ locale: "fr", theme: "light" }} />);
    expect(screen.getByRole("radio", { name: "Français" }).getAttribute("aria-checked")).toBe(
      "true",
    );
    expect(screen.getByRole("radio", { name: "Light" }).getAttribute("aria-checked")).toBe("true");
    expect(screen.getByRole("radio", { name: "English" }).getAttribute("aria-checked")).toBe(
      "false",
    );
  });

  it("persists the chosen theme and repaints optimistically", async () => {
    const user = userEvent.setup();
    renderWithIntl(<SettingsControls current={{ locale: "en", theme: "dark" }} />);
    await user.click(screen.getByRole("radio", { name: "Light" }));
    expect(mockAction).toHaveBeenCalledWith({ theme: "light" });
    expect(document.documentElement.dataset.theme).toBe("light");
  });

  it("persists the chosen language", async () => {
    const user = userEvent.setup();
    renderWithIntl(<SettingsControls current={{ locale: "en", theme: "dark" }} />);
    await user.click(screen.getByRole("radio", { name: "Français" }));
    expect(mockAction).toHaveBeenCalledWith({ locale: "fr" });
  });
});
