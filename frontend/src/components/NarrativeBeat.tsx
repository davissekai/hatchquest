type NarrativeBeatProps = {
  title: string;
  text: string;
};

export default function NarrativeBeat({ title, text }: NarrativeBeatProps) {
  return (
    <section className="rounded-2xl border border-white/10 bg-white/5 p-6">
      <h2 className="text-2xl font-bold mb-3">{title}</h2>
      <p className="text-gray-200 leading-relaxed">{text}</p>
    </section>
  );
}