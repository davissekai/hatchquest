import { Resources } from "@/types/game";

interface ResourceBarProps {
    resources: Resources;
}

/**
 * Displays the player's current resource state.
 * Shows v_capital, reputation, network, and momentumMultiplier.
 * TODO: Implement visual bar/gauge UI.
 */
export function ResourceBar({ resources }: ResourceBarProps) {
    return (
        <div>
            <span>Capital: GHS {resources.v_capital.toLocaleString()}</span>
            <span>Reputation: {resources.reputation}</span>
            <span>Network: {resources.network}</span>
            <span>Momentum: {resources.momentumMultiplier}x</span>
        </div>
    );
}
