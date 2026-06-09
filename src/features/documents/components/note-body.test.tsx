import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { NoteBody } from "./note-body";

describe("NoteBody (AC-3, XSS-safe per ADR-0008)", () => {
  it("renders Markdown formatting", () => {
    render(<NoteBody body={"# Title\n\nSome **bold** text"} />);
    expect(screen.getByText("Title")).toBeTruthy();
    expect(screen.getByText("bold")).toBeTruthy();
  });

  it("never renders raw HTML or scripts as elements", () => {
    const { container } = render(
      <NoteBody body={"<script>alert(1)</script><img src=x onerror=alert(1)>"} />,
    );
    expect(container.querySelector("script")).toBeNull();
    expect(container.querySelector("img")).toBeNull();
  });
});
