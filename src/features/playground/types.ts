/** Project planning playground (spec 022). One item type renders both lenses. */
export const ITEM_TYPES = ["task", "note", "phase"] as const;
export type ItemType = (typeof ITEM_TYPES)[number];

export const STATUSES = ["backlog", "in_progress", "in_review", "done"] as const;
export type Status = (typeof STATUSES)[number];

export type PlanItem = {
  id: string;
  project_id: string;
  type: ItemType;
  title: string;
  body: string | null;
  status: Status;
  assignee: string | null;
  estimate_hours: number | null;
  parent_id: string | null;
  pos_x: number;
  pos_y: number;
  width: number | null;
  height: number | null;
  board_order: number;
  color: string | null;
};

/** A dependency arrow: source is a prerequisite of target ("source → target"). */
export type PlanLink = { id: string; source_id: string; target_id: string };

export type Lens = "canvas" | "board";

/** Assignee option (a project member). */
export type MemberOption = { id: string; label: string };
