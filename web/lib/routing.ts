import { getMissionProgress, isFreshMissionStart } from "@/lib/progress";

/** Where to send a logged-in user after login/register. */
export async function resolvePostLoginPath(userId: string): Promise<string> {
  const m1 = await getMissionProgress(userId, "m1");
  if (isFreshMissionStart(m1)) {
    return "/intro";
  }
  return "/hub";
}
