import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db/client";
import { gameSessions } from "@/db/schema";
import { eq } from "drizzle-orm";
import { GameState } from "@/types/game";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const sessionId = searchParams.get("sessionId");

    if (!sessionId) {
      return NextResponse.json({ error: "sessionId is required" }, { status: 400 });
    }

    const session = await db.query.gameSessions.findFirst({
      where: eq(gameSessions.id, sessionId),
    });

    if (!session) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    if (!session.isComplete) {
      return NextResponse.json({ error: "Game session is not yet complete" }, { status: 400 });
    }

    const finalState = session.state as GameState;

    // Full state revealed here — including EO dimensions
    return NextResponse.json({
      finalState,
      acumenScore: session.acumenScore,
    });
  } catch (error) {
    console.error("[GET /api/game/results]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
