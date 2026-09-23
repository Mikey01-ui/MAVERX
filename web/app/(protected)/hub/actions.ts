"use server";

import { redirect } from "next/navigation";
import { auth, signOut } from "@/lib/auth";
import { getMissionCatalog } from "@/lib/content";
import { upsertProgress } from "@/lib/progress";

/** Clear all mission progress and return to the video intro — works without client JS. */
export async function restartGameAction() {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) redirect("/login");

  const missions = await getMissionCatalog();
  await Promise.all(
    missions.map((m) =>
      upsertProgress(userId, {
        missionId: m.id,
        status: m.id === "m1" ? "in_progress" : "locked",
        checkpoint: "start",
        stateJson: null,
        score: null,
      })
    )
  );

  redirect("/intro");
}

/** Sign out via form POST — works when React never hydrates. */
export async function signOutAction() {
  await signOut({ redirectTo: "/login" });
}
