import { createMcpHandler, experimental_withMcpAuth as withMcpAuth } from "mcp-handler";
import { z } from "zod";
import { resolveBearerUser } from "@/lib/mcp/auth";
import {
  mcpAddFeature,
  mcpBulkCreatePlan,
  mcpCreateItem,
  mcpDeleteItem,
  mcpGetPlan,
  mcpLink,
  mcpListFeatures,
  mcpListProjects,
  mcpSetStatus,
  mcpUpdateItem,
} from "@/lib/mcp/tools";

const STATUS = z.enum(["backlog", "in_progress", "in_review", "done"]);

function text(value: unknown) {
  return {
    content: [
      {
        type: "text" as const,
        text: typeof value === "string" ? value : JSON.stringify(value, null, 2),
      },
    ],
  };
}

/** The token-resolved user id, injected by withMcpAuth into the request's authInfo. */
function userId(extra: unknown): string {
  const auth = (extra as { authInfo?: { clientId?: string; extra?: { userId?: unknown } } })
    .authInfo;
  const id = auth?.extra?.userId ?? auth?.clientId;
  if (typeof id !== "string") throw new Error("Unauthorized");
  return id;
}

const handler = createMcpHandler(
  (server) => {
    server.tool("list_projects", "List the projects you can plan.", {}, async (_args, extra) =>
      text(await mcpListProjects(userId(extra))),
    );

    server.tool(
      "get_plan",
      "Get a project's current plan (items + dependency links).",
      { projectId: z.string().uuid() },
      async ({ projectId }, extra) => text(await mcpGetPlan(userId(extra), projectId)),
    );

    server.tool(
      "create_task",
      "Create a task card on a project's playground.",
      {
        projectId: z.string().uuid(),
        title: z.string(),
        estimate_hours: z.number().optional(),
        status: STATUS.optional(),
      },
      async (a, extra) =>
        text(
          await mcpCreateItem(userId(extra), a.projectId, {
            type: "task",
            title: a.title,
            estimate_hours: a.estimate_hours,
            status: a.status,
          }),
        ),
    );

    server.tool(
      "create_phase",
      "Create a phase frame to group tasks.",
      { projectId: z.string().uuid(), title: z.string() },
      async (a, extra) =>
        text(
          await mcpCreateItem(userId(extra), a.projectId, {
            type: "phase",
            title: a.title,
            width: 360,
            height: 280,
          }),
        ),
    );

    server.tool(
      "link_tasks",
      "Create a dependency arrow (source must be done before target).",
      { projectId: z.string().uuid(), sourceId: z.string().uuid(), targetId: z.string().uuid() },
      async (a, extra) => text(await mcpLink(userId(extra), a.projectId, a.sourceId, a.targetId)),
    );

    server.tool(
      "set_status",
      "Set a task's status.",
      { itemId: z.string().uuid(), status: STATUS },
      async (a, extra) => text(await mcpSetStatus(userId(extra), a.itemId, a.status)),
    );

    server.tool(
      "update_task",
      "Edit a card's title, status, and/or estimate.",
      {
        itemId: z.string().uuid(),
        title: z.string().max(500).optional(),
        status: STATUS.optional(),
        estimate_hours: z.number().nullable().optional(),
      },
      async (a, extra) =>
        text(
          await mcpUpdateItem(userId(extra), a.itemId, {
            title: a.title,
            status: a.status,
            estimate_hours: a.estimate_hours,
          }),
        ),
    );

    server.tool(
      "delete_item",
      "Delete a card (task, note, or phase).",
      { itemId: z.string().uuid() },
      async (a, extra) => text(await mcpDeleteItem(userId(extra), a.itemId)),
    );

    server.tool(
      "add_note",
      "Add a sticky note to the playground.",
      { projectId: z.string().uuid(), text: z.string() },
      async (a, extra) =>
        text(await mcpCreateItem(userId(extra), a.projectId, { type: "note", title: a.text })),
    );

    server.tool(
      "list_features",
      "List the prebuilt feature blocks (Stripe, Twilio, …) you can add, with their keys.",
      {},
      async () => text(mcpListFeatures()),
    );

    server.tool(
      "add_feature",
      "Add a prebuilt feature block as a rich card (with brand + a starter checklist), optionally inside a phase. Use list_features for valid keys.",
      { projectId: z.string().uuid(), key: z.string(), phaseId: z.string().uuid().optional() },
      async (a, extra) =>
        text(await mcpAddFeature(userId(extra), a.projectId, a.key, { phaseId: a.phaseId })),
    );

    server.tool(
      "bulk_create_plan",
      "Lay down a whole project plan in one call: phases (frames) each with tasks, plus optional dependency links referenced by task title.",
      {
        projectId: z.string().uuid(),
        phases: z.array(
          z.object({
            title: z.string(),
            tasks: z
              .array(
                z.object({
                  title: z.string(),
                  estimate_hours: z.number().optional(),
                  status: STATUS.optional(),
                }),
              )
              .optional(),
          }),
        ),
        links: z.array(z.object({ from: z.string(), to: z.string() })).optional(),
      },
      async (a, extra) =>
        text(
          await mcpBulkCreatePlan(userId(extra), a.projectId, { phases: a.phases, links: a.links }),
        ),
    );
  },
  { serverInfo: { name: "progixhub-playground", version: "1.0.0" } },
  { streamableHttpEndpoint: "/api/mcp", disableSse: true, verboseLogs: false },
);

const authed = withMcpAuth(
  handler,
  async (_req, bearer) => {
    const id = await resolveBearerUser(bearer);
    if (!id) return undefined;
    return { token: bearer!, clientId: id, scopes: [], extra: { userId: id } };
  },
  { required: true },
);

export { authed as GET, authed as POST, authed as DELETE };
