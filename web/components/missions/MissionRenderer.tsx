import type { MissionIntro, MissionMedia } from "@/lib/content";
import { MissionExperience } from "@/components/missions/MissionExperience";
import type { MissionPhase } from "@/lib/game/types";

type MissionRendererProps = {
  intro: MissionIntro;
  media: MissionMedia | null;
  missionId: string;
  missionName: string;
  missionLabel: string;
  initialCheckpoint: string | null;
  resume: boolean;
  forcedPhase?: MissionPhase | null;
  savedState?: Record<string, unknown> | null;
  debriefPreview?: boolean;
  difficulty?: string | null;
};

export function MissionRenderer(props: MissionRendererProps) {
  return <MissionExperience {...props} />;
}
