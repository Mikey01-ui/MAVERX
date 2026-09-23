import { z } from "zod";
import { listEnabledLocales, ensureLocalePacksSeeded } from "@/lib/locale";
import { addLocalePack } from "@/lib/group";
import { isAdminRole } from "@/lib/roles";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { jsonWithCors, optionsCors, requireDashboardAdmin } from "@/lib/dashboardAuth";

export async function OPTIONS(request: Request) {
  return optionsCors(request);
}

export async function GET(request: Request) {
  await ensureLocalePacksSeeded();
  const locales = await listEnabledLocales();
  return jsonWithCors(request, { locales });
}

const addSchema = z.object({
  code: z.string().min(2).max(8),
  label: z.string().min(1).max(64),
});

/** Register a new language pack (admin session or dashboard API key). */
export async function POST(request: Request) {
  const gate = await requireDashboardAdmin(request);
  if (!gate.ok) {
    const session = await auth();
    if (!session?.user?.id) return gate.response;
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    });
    if (!isAdminRole(user?.role)) return gate.response;
  }

  const body = await request.json().catch(() => null);
  const parsed = addSchema.safeParse(body);
  if (!parsed.success) {
    return jsonWithCors(request, { error: "Invalid code or label." }, { status: 400 });
  }

  try {
    const pack = await addLocalePack(parsed.data.code, parsed.data.label);
    return jsonWithCors(request, { ok: true, locale: pack });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to add locale.";
    return jsonWithCors(request, { error: message }, { status: 400 });
  }
}
