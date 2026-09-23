import { z } from "zod";
import { getOrgSettings, updateOrgSettings } from "@/lib/orgSettings";
import { jsonWithCors, optionsCors, requireDashboardAdmin } from "@/lib/dashboardAuth";

export async function OPTIONS(request: Request) {
  return optionsCors(request);
}

export async function GET(request: Request) {
  const gate = await requireDashboardAdmin(request);
  if (!gate.ok) return gate.response;
  const settings = await getOrgSettings();
  return jsonWithCors(request, {
    settings: {
      notifyEmail: settings.notifyEmail,
      updatedAt: settings.updatedAt.toISOString(),
    },
  });
}

const patchSchema = z.object({
  notifyEmail: z.string().email().nullable().optional().or(z.literal("")),
});

export async function PATCH(request: Request) {
  const gate = await requireDashboardAdmin(request);
  if (!gate.ok) return gate.response;

  const body = await request.json().catch(() => null);
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return jsonWithCors(request, { error: "Invalid settings payload." }, { status: 400 });
  }

  const notifyEmail =
    parsed.data.notifyEmail === undefined
      ? undefined
      : parsed.data.notifyEmail === "" || parsed.data.notifyEmail === null
        ? null
        : parsed.data.notifyEmail;

  const settings = await updateOrgSettings({ notifyEmail });
  return jsonWithCors(request, {
    ok: true,
    settings: {
      notifyEmail: settings.notifyEmail,
      updatedAt: settings.updatedAt.toISOString(),
    },
  });
}
