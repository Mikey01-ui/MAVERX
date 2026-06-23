import { redirect } from "next/navigation";
import { VideoIntroClient } from "@/components/intro/VideoIntroClient";
import { auth } from "@/lib/auth";
import { getVideoIntroContent } from "@/lib/content";
import { getMissionProgress } from "@/lib/progress";

export default async function IntroPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login?callbackUrl=/intro");
  }
  const userId = session.user.id;

  const m1 = await getMissionProgress(userId, "m1");
  if (m1 && m1.checkpoint !== "start") {
    redirect("/hub");
  }

  const content = await getVideoIntroContent();
  return <VideoIntroClient content={content} />;
}
