import type { MissionIntro, MissionMedia } from "@/lib/content";
import { MissionExperience } from "@/components/missions/MissionExperience";

type MissionRendererProps = {
  intro: MissionIntro;
  media: MissionMedia | null;
  missionId: string;
  missionName: string;
  missionLabel: string;
  initialCheckpoint: string | null;
  resume: boolean;
  savedState?: Record<string, unknown> | null;
  debriefPreview?: boolean;
  difficulty?: string | null;
};

export function MissionRenderer(props: MissionRendererProps) {
  return <MissionExperience {...props} />;
}
