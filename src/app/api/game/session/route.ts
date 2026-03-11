import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db/client";
import { gameSessions, narrativeBeats, narrativeChoices } from "@/db/schema";
import { eq } from "drizzle-orm";
import { GameState } from "@/types/game";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const sessionId = searchParams.get("sessionId");

    if (!sessionId) {
      return NextResponse.json({ error: "sessionId is required" }, { status: 400 });
    }

    // Fetch session from DB
    const session = await db.query.gameSessions.findFirst({
      where: eq(gameSessions.id, sessionId),
    });

    if (!session) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    const state = session.state as GameState;
    const currentBeatId = state.session.currentNarrativeId;

    // Fetch current beat + choices
    const beat = await db.query.narrativeBeats.findFirst({
      where: eq(narrativeBeats.id, currentBeatId),
    });

    if (!beat) {
      return NextResponse.json({ error: "Narrative beat not found" }, { status: 404 });
    }

    const choices = await db.query.narrativeChoices.findMany({
      where: eq(narrativeChoices.beatId, currentBeatId),
    });

    const formattedChoices = choices.map(c => ({
      choiceId: c.id,
      label: c.label,
      immediateFeedback: c.immediateFeedback
    }));

    return NextResponse.json({
      sessionId: session.id,
      state,
      narrative: {
        id: beat.id,
        title: beat.title,
        storyText: beat.storyText,
        choices: formattedChoices
      },
    });
  } catch (error) {
    console.error("[GET /api/game/session]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
