import { useState, useCallback, useEffect, useRef } from "react";
import { GlobalState, NarrativeBeat } from "../types/game";
import { 
  startGame as apiStartGame, 
  getCurrentSession as apiGetCurrentSession, 
  submitChoice as apiSubmitChoice 
} from "../lib/game-api";

interface UseGameSessionReturn {
  sessionId: string | null;
  state: GlobalState | null;
  narrative: NarrativeBeat | null;
  feedback: string | null;
  isLoading: boolean;
  isSubmitting: boolean;
  error: string | null;
  startSession: () => Promise<void>;
  submitChoice: (choiceId: string) => Promise<void>;
}

const DUMMY_TOKEN = "mock-token";

export function useGameSession(): UseGameSessionReturn {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [state, setState] = useState<GlobalState | null>(null);
  const [narrative, setNarrative] = useState<NarrativeBeat | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const isMounted = useRef(false);

  const loadSession = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await apiGetCurrentSession(DUMMY_TOKEN);
      setSessionId(res.sessionId);
      setState(res.state);
      setNarrative(res.narrative);
    } catch {
      setSessionId(null);
      setState(null);
      setNarrative(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!isMounted.current) {
      isMounted.current = true;
      void loadSession();
    }
  }, [loadSession]);

  const startSession = useCallback(async () => {
    setIsSubmitting(true);
    setError(null);
    try {
      const res = await apiStartGame(DUMMY_TOKEN);
      setSessionId(res.sessionId);
      setState(res.state);
      setNarrative(res.narrative);
      setFeedback(null);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to start session");
    } finally {
      setIsSubmitting(false);
    }
  }, []);

  const submitChoice = useCallback(async (choiceId: string) => {
    if (isSubmitting) return;

    setIsSubmitting(true);
    setError(null);
    
    try {
      const res = await apiSubmitChoice(DUMMY_TOKEN, { choiceId });
      
      setState(res.state);
      setFeedback(res.feedback);
      
      await new Promise(resolve => setTimeout(resolve, 2500));
      
      setNarrative(res.narrative);
      setFeedback(null);
      
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to submit choice");
    } finally {
      setIsSubmitting(false);
    }
  }, [isSubmitting]);

  return {
    sessionId,
    state,
    narrative,
    feedback,
    isLoading,
    isSubmitting,
    error,
    startSession,
    submitChoice
  };
}
