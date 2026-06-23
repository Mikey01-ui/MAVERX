import { M1Game } from "@/components/missions/m1/M1Game";
import { M2Game } from "@/components/missions/m2/M2Game";
import { M3Game } from "@/components/missions/m3/M3Game";
import { M4Game } from "@/components/missions/m4/M4Game";
import { M5Game } from "@/components/missions/m5/M5Game";
import { MissionGameStub } from "@/components/missions/shared/MissionGameStub";

type MissionGameProps = {
  missionId: string;
  missionLabel: string;
  missionName: string;
  savedState?: Record<string, unknown> | null;
};

export function MissionGame({ missionId, missionLabel, missionName, savedState }: MissionGameProps) {
  if (missionId === "m1") {
    return <M1Game savedState={savedState} />;
  }
  if (missionId === "m2") {
    return <M2Game savedState={savedState} />;
  }
  if (missionId === "m3") {
    return <M3Game savedState={savedState} />;
  }
  if (missionId === "m4") {
    return <M4Game savedState={savedState} />;
  }
  if (missionId === "m5") {
    return <M5Game savedState={savedState} />;
  }
  return <MissionGameStub missionId={missionId} missionLabel={missionLabel} missionName={missionName} />;
}
