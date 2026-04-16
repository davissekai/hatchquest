// World event types — shared between backend engine and frontend display layer

export interface WorldEvent {
  id: string;
  label: string;
  narrativeHook: string;
  minLayer: number;
}

export interface WorldEventLogEntry {
  turn: number;
  eventId: string;
  label: string;
  narrativeHook: string;
}
