# Spec 033 — Tutorials as complete guides

- **Status:** shipped (phase 1)
- **Type:** feature · **Owner:** Achref Arabi · **Date:** 2026-06-26
- **Epic:** make tutorials the central "teach the client everything" feature, spanning tutorials ↔ platforms ↔ client setup ↔ MCP.

## Problem

A tutorial was video-only. Clients need detailed written instructions to create accounts and grant access — not just a video.

## Phase 1 (this PR)

- A tutorial gains a **markdown guide body** (`tutorials.body_md`, migration 0041): a written step-by-step walkthrough beside the video.
- The tutorial form becomes a **full-screen editor** — a metadata sidebar + a guide editor with **live preview** (sanitized markdown).
- The library renders the guide (collapsible, sanitized).

## Next phases (epic)

2. Client setup page renders each platform's tutorials as ordered labeled sections (video + guide + access action).
3. Platforms (settings): cleaner tutorial linking/ordering + coverage flags.
4. MCP tools to create tutorials (with guide) + link to platforms + manage setup.

## AC (phase 1)

- **AC-1:** A tutorial stores + renders a markdown guide (sanitized — no XSS).
- **AC-2:** Authoring is a full-screen editor with live preview.
