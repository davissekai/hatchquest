import React, { useState } from "react";
import { PublicChoice } from "../types/game";
import ChoiceButton from "./ChoiceButton";

interface ChoicePanelProps {
  choices: PublicChoice[];
  disabled?: boolean;
  onChoice: (choiceId: string) => void;
}

export default function ChoicePanel({ choices, disabled = false, onChoice }: ChoicePanelProps) {
  const [selectedChoiceId, setSelectedChoiceId] = useState<string | null>(null);

  const handleSelect = (choiceId: string) => {
    if (disabled) return;
    setSelectedChoiceId(choiceId);
    onChoice(choiceId);
    
    // Auto-clear selection after some time so a new choice can be active later
    setTimeout(() => {
      setSelectedChoiceId(null);
    }, 3000);
  };

  return (
    <div className="w-full mb-10">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-x-10 md:gap-y-6">
        {choices.map((option, idx) => {
          const alphaLabel = String.fromCharCode(65 + idx); // A, B, C, D
          return (
            <ChoiceButton
              key={option.choiceId}
              label={alphaLabel}
              text={option.label}
              isSelected={selectedChoiceId === option.choiceId}
              disabled={disabled}
              onSelect={() => handleSelect(option.choiceId)}
            />
          );
        })}
      </div>
    </div>
  );
}
