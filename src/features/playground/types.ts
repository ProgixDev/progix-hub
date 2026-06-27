import type { ChecklistStep } from "@/lib/playground/feature-catalog";

/** Project planning playground (spec 022). One item type renders both lenses. */
export const ITEM_TYPES = ["task", "note", "phase"] as const;
export type ItemType = (typeof ITEM_TYPES)[number];

export const STATUSES = ["backlog", "in_progress", "in_review", "done"] as const;
export type Status = (typeof STATUSES)[number];

export type { ChecklistStep };

/** Extra data on a card. Feature cards (seeded from the block catalog) carry brand + checklist. */
export type ItemMeta = {
  /** Catalog key of the feature block (e.g. "stripe") — presence marks this a feature card. */
  feature?: string;
  category?: string;
  color?: string;
  checklist?: ChecklistStep[];
};

export type PlanItem = {
  id: string;
  project_id: string;
  type: ItemType;
  title: string;
  body: string | null;
  status: Status;
  assignee: string | null;
  estimate_hours: number | null;
  due_date: string | null;
  parent_id: string | null;
  pos_x: number;
  pos_y: number;
  width: number | null;
  height: number | null;
  board_order: number;
  color: string | null;
  meta: ItemMeta;
};

/** A dependency arrow: source is a prerequisite of target ("source → target"). */
export type PlanLink = { id: string; source_id: string; target_id: string };

/** A freehand sketch stroke (draw mode): flattened canvas-space points [x0,y0,x1,y1,…]. */
export type PlanStroke = { id: string; points: number[]; color: string; width: number };

/** A saved version of the plan (items + links). The list view omits the heavy `data` blob. */
export type PlanSnapshot = {
  id: string;
  label: string;
  author_label: string | null;
  created_at: string;
};

/** A collaborator currently in the playground (live presence). */
export type Peer = {
  userId: string;
  name: string;
  initials: string;
  color: string;
  selectedId: string | null;
};
/** A remote collaborator's cursor, in canvas coordinates. */
export type RemoteCursor = { userId: string; name: string; color: string; x: number; y: number };

export type Lens = "canvas" | "board" | "specs";

/** A spec/PRD synced from the project repo (Specs lens). */
export type PlanSpec = {
  id: string;
  slug: string;
  number: number | null;
  title: string;
  status: string;
  kind: string;
  body_md: string | null;
  updated_at: string;
};

/** Assignee option (a project member). */
export type MemberOption = { id: string; label: string };
