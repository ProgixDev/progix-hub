# Spec 026 — Draw mode (playground)

- **Status:** shipped
- **Type:** feature · **Owner:** Achref Arabi · **Date:** 2026-06-25
- **Builds on:** spec 022 (playground), real-time sync.

## Problem

Teams want to sketch/think on the canvas — circle things, draw arrows by hand — before committing to phases and cards. A freehand, clearable layer.

## Desired behavior

- A **Draw** toggle in the playground top bar. While on, dragging on the canvas draws a freehand stroke (over cards too); pan/select are suspended.
- A floating toolbar with **colour swatches**, **Clear** (wipe all strokes), and **Done**.
- Strokes live in canvas space (pan/zoom with the board), persist (`plan_drawings`, migration 0036), and **sync live** to teammates over the realtime channel; Clear is also live.

## Acceptance criteria

- **AC-1:** Toggling Draw lets a member draw freehand strokes that render on the canvas.
- **AC-2:** Strokes persist (reload) and sync to other members in real time.
- **AC-3:** Clear removes all strokes for everyone in real time.
- **AC-4:** Colour can be changed; strokes pan/zoom with the canvas.

## Out of scope

Per-stroke erase/undo (only bulk Clear for now); pressure/smoothing.

## CUJ

Extends CUJ-14 (plan in the playground): sketch freely before structuring.
