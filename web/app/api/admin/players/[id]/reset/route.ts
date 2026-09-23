import { prisma } from "@/lib/db";
import { resetPlayerProgress } from "@/lib/progress";
import { jsonWithCors, optionsCors, requireDashboardAdmin } from "@/lib/dashboardAuth";

export async function OPTIONS(request: Request) {
  return optionsCors(request);
}

type Ctx = { params: Promise<{ id: string }> };

export async function POST(request: Request, ctx: Ctx) {
  const gate = await requireDashboardAdmin(request);
  if (!gate.ok) return gate.response;

  const { id } = await ctx.params;
  const user = await prisma.user.findUnique({
    where: { id },
    select: { id: true, email: true, role: true },
  });
  if (!user) {
    return jsonWithCors(request, { error: "Player not found." }, { status: 404 });
  }
  if (user.role === "admin") {
    return jsonWithCors(request, { error: "Cannot reset an admin account." }, { status: 400 });
  }

  await resetPlayerProgress(user.id);
  return jsonWithCors(request, { ok: true, userId: user.id, email: user.email });
}
