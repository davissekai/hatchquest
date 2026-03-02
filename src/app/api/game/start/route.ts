import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db/client";
import { players, gameSessions, narrativeBeats, narrativeChoices } from "@/db/schema";
import { createInitialState } from "@/engine/transition";
import { eq } from "drizzle-orm";

export async function POST(req: NextRequest) {
  try {
    const { email, name } = await req.json();

    if (!email || typeof email !== "string") {
      return NextResponse.json({ error: "email is required" }, { status: 400 });
    }
    if (!name || typeof name !== "string") {
      return NextResponse.json({ error: "name is required" }, { status: 400 });
    }

    // Upsert player — find existing or create new
    const existing = await db.query.players.findFirst({
      where: eq(players.email, email),
    });

    let playerId: string;
    if (existing) {
      playerId = existing.id;
    } else {
      const [newPlayer] = await db
        .insert(players)
        .values({ email, displayName: name })
        .returning({ id: players.id });
      playerId = newPlayer.id;
    }

    // Create fresh game state
    const initialState = createInitialState(playerId);

    // Persist session to DB
    const [session] = await db
      .insert(gameSessions)
      .values({ playerId, state: initialState, isComplete: false })
      .returning({ id: gameSessions.id });

    // Fetch preamble beat (beat_00)
    const beat = await db.query.narrativeBeats.findFirst({
      where: eq(narrativeBeats.id, "beat_00"),
    });

    if (!beat) {
      return NextResponse.json({ error: "Preamble beat not found" }, { status: 404 });
    }

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
    const message = error instanceof Error ? error.message : String(error);
    console.error("[POST /api/game/start]", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
