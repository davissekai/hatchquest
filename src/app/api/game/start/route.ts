import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db/client";
import { gameSessions, narrativeBeats, narrativeChoices } from "@/db/schema";
import { createInitialState } from "@/engine/transition";
import { eq } from "drizzle-orm";

export async function POST(req: NextRequest) {
  try {
    const { playerId } = await req.json();

    if (!playerId || typeof playerId !== "string") {
      return NextResponse.json({ error: "playerId is required" }, { status: 400 });
    }

    // Create fresh game state
    const initialState = createInitialState(playerId);

    // Persist session to DB
    const [session] = await db
      .insert(gameSessions)
      .values({
        playerId,
        state: initialState,
        isComplete: false,
      })
      .returning({ id: gameSessions.id });

    // Fetch preamble beat (beat_00)
    const beat = await db.query.narrativeBeats.findFirst({
      where: eq(narrativeBeats.id, "beat_00"),
    });

    if (!beat) {
      return NextResponse.json({ error: "Preamble beat not found" }, { status: 404 });
    }

    // Fetch choices for preamble beat
    const choices = await db.query.narrativeChoices.findMany({
      where: eq(narrativeChoices.beatId, "beat_00"),
    });

    const { dimensions: _dimensions, ...stateWithoutDimensions } = initialState;

    return NextResponse.json({
      sessionId: session.id,
      beat: { ...beat, choices },
      state: stateWithoutDimensions,
    });
  } catch (error) {
    console.error("[POST /api/game/start]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
