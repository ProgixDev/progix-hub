# Spec 032 — Specs/PRD in the playground

- **Status:** shipped
- **Type:** feature · **Owner:** Achref Arabi · **Date:** 2026-06-25

## Problem

A project's specs/PRDs live in the repo; the hub couldn't show them. Surface them in the playground so the plan and the formal specs live together.

## Desired behavior

- A new **Specs** lens in the playground (Canvas / Board / Specs): a list of synced specs/PRDs (number, title, status, kind) + a markdown reader (sanitized).
- An MCP `sync_specs(projectId, specs[])` tool upserts a repo's specs by slug into `project_specs` (migration 0040).

## Acceptance criteria

- **AC-1:** sync_specs (token + access gated) upserts specs by (project, slug).
- **AC-2:** The Specs lens lists specs with status/kind and renders the selected one's markdown (rehypeSanitize — no XSS).
- **AC-3:** Empty state explains how to sync via the MCP.

## CUJ

Extends CUJ-14/15: repo specs → MCP → visible in the playground.
