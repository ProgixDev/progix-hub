# 0008 — Rich-text notes via Markdown (react-markdown + rehype-sanitize)

- **Status:** Accepted
- **Date:** 2026-06-09
- **Deciders:** Achref Arabi (founder), Claude

## Context

Spec 004 (Documents) needs **rich-text notes** — headings, bold/italic, lists, links. We need a storage format and a render path that is safe (notes are member-authored and shown to other members, so the render is an XSS surface) without pulling in a heavyweight WYSIWYG editor.

## Decision

Store notes as **Markdown text** (a plain `body` column). Authors write Markdown in a textarea; we render it read-only with **`react-markdown`** piped through **`rehype-sanitize`** (default safe schema), so raw HTML/scripts in the body can never execute. No WYSIWYG editor, no `dangerouslySetInnerHTML`.

## Alternatives considered

| Option                                           | Why not                                                                                                        |
| ------------------------------------------------ | -------------------------------------------------------------------------------------------------------------- |
| A full WYSIWYG editor (TipTap / Lexical / Slate) | Large dependency + state model + its own sanitization concerns; overkill for internal project notes.           |
| Store sanitized HTML + `dangerouslySetInnerHTML` | Keeps an XSS footgun one mistake away; sanitizing on write is brittle. Markdown + sanitize-on-render is safer. |
| Plain text only                                  | Fails the spec’s “rich-text” requirement (no headings/bold/links).                                             |
| Hand-rolled Markdown subset                      | Re-implementing a parser is exactly where XSS bugs come from. Use a vetted library.                            |

## Consequences

- **Positive:** safe by construction (sanitize on render), small surface, Markdown is portable + diff-friendly, authors get real formatting.
- **Negative / accepted trade-offs:** two new client dependencies (`react-markdown`, `rehype-sanitize`) and a ~modest bundle add on the documents view; authors write Markdown (not WYSIWYG) — acceptable for a developer-facing internal tool.
- **Follow-ups:** a live preview while editing is a nice-to-have, not MVP.
