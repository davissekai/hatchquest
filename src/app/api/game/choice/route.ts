import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db/client";
import { gameSessions, narrativeBeats, narrativeChoices, choiceImpacts } from "@/db/schema";
import { processChoice } from "@/engine/transition";
import { calculateEOScores, calculateAcumenScore } from "@/engine/scoring";
import { eq } from "drizzle-orm";
import { GameState, ChoiceImpact } from "@/types/game";

export async function POST(req: NextRequest) {
  try {
    const { sessionId, choiceId } = await req.json();

    if (!sessionId || !choiceId) {
      return NextResponse.json({ error: "sessionId and choiceId are required" }, { status: 400 });
    }

    // Fetch current session
    const session = await db.query.gameSessions.findFirst({
      where: eq(gameSessions.id, sessionId),
    });

    if (!session) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    if (session.isComplete) {
      return NextResponse.json({ error: "Game session is already complete" }, { status: 409 });
    }

    // Fetch the choice to get nextBeatId
    const choice = await db.query.narrativeChoices.findFirst({
      where: eq(narrativeChoices.id, choiceId),
    });

    if (!choice) {
      return NextResponse.json({ error: "Choice not found" }, { status: 404 });
    }

    // Fetch private impact data (backend only — never sent to client)
    const impact = await db.query.choiceImpacts.findFirst({
      where: eq(choiceImpacts.choiceId, choiceId),
    });

    if (!impact) {
      return NextResponse.json({ error: "Choice impact not found" }, { status: 404 });
    }

    // Shape impact into ChoiceImpact type for the engine
    const choiceImpact: ChoiceImpact = {
      choiceId,
      resourceDeltas: {
        v_capital: impact.capitalDelta,
        reputation: impact.reputationDelta,
        network: impact.networkDelta,
        momentumMultiplier: impact.momentumDelta,
      },
      dimensionDeltas: {
        autonomy: impact.autonomyDelta,
        innovativeness: impact.innovativenessDelta,
        proactiveness: impact.proactivenessDelta,
        riskTaking: impact.riskTakingDelta,
        competitiveAggressiveness: impact.competitiveAggressivenessDelta,
      },
      flagUpdates: (impact.flagUpdates as Record<string, boolean>) ?? {},
    };

    const currentState = session.state as GameState;
    const nextBeatId = choice.nextBeatId ?? deriveNextBeatId(currentState.session.currentNarrativeId);

    // Run engine
    const newState = processChoice(currentState, choiceId, choiceImpact, nextBeatId);

    // Check if this was the last beat
    const isLastBeat = nextBeatId === "beat_30";
    const finalState = isLastBeat
      ? { ...newState, session: { ...newState.session, isStoryComplete: true } }
      : newState;

    // Compute acumen score on completion
    const acumenScore = isLastBeat
      ? calculateAcumenScore(calculateEOScores(finalState))
      : null;

    // Persist new state
    await db
      .update(gameSessions)
      .set({
        state: finalState,
        isComplete: isLastBeat,
        completedAt: isLastBeat ? new Date() : null,
        ...(acumenScore !== null && { acumenScore }),
      })
      .where(eq(gameSessions.id, sessionId));

    // Fetch next beat + choices
    const nextBeat = await db.query.narrativeBeats.findFirst({
      where: eq(narrativeBeats.id, nextBeatId),
    });

    if (!nextBeat) {
      return NextResponse.json({ error: "Next beat not found" }, { status: 404 });
    }

    const nextChoices = await db.query.narrativeChoices.findMany({
      where: eq(narrativeChoices.beatId, nextBeatId),
    });

    const formattedChoices = nextChoices.map(c => ({
      choiceId: c.id,
      label: c.label,
      immediateFeedback: c.immediateFeedback
    }));

    return NextResponse.json({
      state: finalState,
      narrative: isLastBeat ? null : { 
        id: nextBeat.id,
        title: nextBeat.title,
        storyText: nextBeat.storyText,
        choices: formattedChoices 
      },
      feedback: choice.immediateFeedback,
    });
  } catch (error) {
    console.error("[POST /api/game/choice]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// Derives next beat ID by incrementing the current beat number
function deriveNextBeatId(currentBeatId: string): string {
  const match = currentBeatId.match(/beat_(\d+)/);
  if (!match) return "beat_01";
  const next = parseInt(match[1], 10) + 1;
  return `beat_${String(next).padStart(2, "0")}`;
}
