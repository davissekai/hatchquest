import { NarrativeBeat } from "@/types/game";

interface NarrativeCardProps {
    beat: NarrativeBeat;
    onChoice: (choiceId: string) => void;
}

/**
 * Renders the current story beat and its decision choices.
 * TODO: Implement UI with feedback display and choice animations.
 */
export function NarrativeCard({ beat, onChoice }: NarrativeCardProps) {
    return (
        <div>
            <h2>{beat.title}</h2>
            <p>{beat.storyText}</p>
            {beat.choices.map((choice) => (
                <button key={choice.choiceId} onClick={() => onChoice(choice.choiceId)}>
                    {choice.label}
                </button>
            ))}
        </div>
    );
}
