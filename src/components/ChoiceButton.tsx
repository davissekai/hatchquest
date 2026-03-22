type ChoiceButtonProps = {
  label: string;
  onClick?: () => void;
  disabled?: boolean;
};

export default function ChoiceButton({
  label,
  onClick,
  disabled = false,
}: ChoiceButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={[
        "w-full rounded-xl border border-glaucous/40 p-4 text-left transition",
        disabled
          ? "bg-glaucous/10 opacity-60"
          : "bg-glaucous/10 hover:bg-pacific/40",
      ].join(" ")}
    >
      {label}
    </button>
  );
}