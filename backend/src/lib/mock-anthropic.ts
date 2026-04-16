import type { ScenarioSkeleton, NarrativeSkin, PlayerContext } from "@hatchquest/shared";

export function isMockLLM(): boolean {
  return process.env["MOCK_LLM"] === "1";
}

export async function mockGenerateSkin(
  skeleton: ScenarioSkeleton,
  _context: PlayerContext
): Promise<NarrativeSkin> {
  return {
    narrative: skeleton.situationSeed,
    choices: skeleton.choiceArchetypes.map((a) => a.archetypeDescription) as [string, string, string],
    tensionHints: skeleton.choiceArchetypes.map((a) => a.tensionAxis) as [string, string, string],
  };
}
