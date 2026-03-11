import { SessionResponse, ChoiceResponse, GlobalState, NarrativeBeat } from "../types/game";

export const MOCK_NARRATIVES: Record<string, NarrativeBeat> = {
  "N_001": {
    id: "N_001",
    title: "Day One",
    storyText: "You've just received your first GHS 10,000 in seed capital. Your university mentor gives you 48 hours to make your first move. The market won't wait.",
    choices: [
      { choiceId: "C_01A", label: "Rent a stall at the Accra Mall and launch immediately.", immediateFeedback: "Bold move. You're in the market before anyone else." },
      { choiceId: "C_01B", label: "Spend two weeks researching competitors first.", immediateFeedback: "Careful. You know your landscape — but so does everyone else now." },
      { choiceId: "C_01C", label: "Partner with a classmate to split costs and risk.", immediateFeedback: "You've halved your exposure. You've also halved your control." }
    ]
  },
  "N_002": {
    id: "N_002",
    title: "First Week",
    storyText: "Your stall is up. Foot traffic is decent but not what you hoped. A supplier offers you a bulk discount — take it now or lose the deal.",
    choices: [
      { choiceId: "C_02A", label: "Take the bulk deal. Commit the capital.", immediateFeedback: "All in. Your shelves are full." },
      { choiceId: "C_02B", label: "Decline. Preserve cash for flexibility.", immediateFeedback: "You kept your options open. The supplier moves on." }
    ]
  },
  "N_003": {
    id: "N_003",
    title: "End of Month 1",
    storyText: "The month ends. The market has shifted unpredictably.",
    choices: [
      { choiceId: "C_03A", label: "Pivot the product slightly.", immediateFeedback: "Adapt and survive." },
      { choiceId: "C_03B", label: "Double down on current offering.", immediateFeedback: "Commitment shows confidence." }
    ]
  }
};

const getInitialState = (): GlobalState => ({
  session: { currentNarrativeId: "N_001", isStoryComplete: false },
  resources: { v_capital: 10000, momentumMultiplier: 1.0, reputation: 50, network: 10 },
  dimensions: { autonomy: 0, innovativeness: 0, proactiveness: 0, riskTaking: 0, competitiveAggressiveness: 0 },
  flags: { hasDebt: false, hiredTeam: false },
  history: []
});

export const getMockSessionResponse = (): SessionResponse => ({
  sessionId: "mock-session-001",
  state: getInitialState(),
  narrative: MOCK_NARRATIVES["N_001"]
});

export const playMockChoice = (
  currentState: GlobalState,
  choiceId: string
): ChoiceResponse => {
  const currentNarrativeId = currentState.session.currentNarrativeId;
  const narrative = MOCK_NARRATIVES[currentNarrativeId];
  const choice = narrative?.choices.find(c => c.choiceId === choiceId);
  const feedback = choice ? choice.immediateFeedback : "Choice locked.";

  // Determine next beat
  let nextNarrativeId = "N_001";
  if (currentNarrativeId === "N_001") nextNarrativeId = "N_002";
  else if (currentNarrativeId === "N_002") nextNarrativeId = "N_003";
  else nextNarrativeId = "N_END";

  const isComplete = nextNarrativeId === "N_END";

  const newState: GlobalState = {
    ...currentState,
    session: { currentNarrativeId: isComplete ? currentNarrativeId : nextNarrativeId, isStoryComplete: isComplete },
    resources: {
      ...currentState.resources,
      v_capital: currentState.resources.v_capital - 500, // mock deduction
    },
    history: [
      ...currentState.history,
      {
        narrativeId: currentNarrativeId,
        choiceId,
        capitalBefore: currentState.resources.v_capital,
        capitalAfter: currentState.resources.v_capital - 500,
        timestamp: Date.now()
      }
    ]
  };

  return {
    state: newState,
    narrative: isComplete ? null : MOCK_NARRATIVES[nextNarrativeId],
    feedback
  };
};
