"use client";

import { createContext, useContext, type ReactNode } from "react";
import {
  getDifficultyProfile,
  parseDifficulty,
  type DifficultyId,
  type DifficultyProfile,
} from "@/lib/game/difficulty";

const DifficultyContext = createContext<DifficultyProfile>(getDifficultyProfile("standard"));

export function DifficultyProvider({
  difficulty,
  children,
}: {
  difficulty: string | null | undefined;
  children: ReactNode;
}) {
  const profile = getDifficultyProfile(difficulty);
  return <DifficultyContext.Provider value={profile}>{children}</DifficultyContext.Provider>;
}

export function useDifficulty(): DifficultyProfile {
  return useContext(DifficultyContext);
}

export function useDifficultyId(): DifficultyId {
  return parseDifficulty(useDifficulty().id);
}
