import { z } from "zod";
import { revokeInvite } from "@/lib/invites";
import { jsonWithCors, optionsCors, requireDashboardAdmin } from "@/lib/dashboardAuth";

type Ctx = { params: Promise<{ id: string }> };

export async function OPTIONS(request: Request) {
  return optionsCors(request);
}

const patchSchema = z.object({
  action: z.enum(["revoke"]),
});

export async function PATCH(request: Request, ctx: Ctx) {
  const gate = await requireDashboardAdmin(request);
  if (!gate.ok) return gate.response;

  const { id } = await ctx.params;
  const body = await request.json().catch(() => null);
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return jsonWithCors(request, { error: "Unsupported action." }, { status: 400 });
  }

  try {
    const invite = await revokeInvite(id);
    return jsonWithCors(request, { ok: true, invite });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Revoke failed.";
    return jsonWithCors(request, { error: message }, { status: 400 });
  }
}
