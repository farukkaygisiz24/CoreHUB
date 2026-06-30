import { GlassCard } from "@/components/ui/glass-card";

// "Ayna": kaynaklar olayı farklı çerçeveliyorsa her birinin bakışını TARAFSIZ gösterir.
// Hakem değiliz — kimin haklı olduğunu söylemeyiz, sadece kimin ne dediğini sunarız.
export default function SourcePerspectives({
  perspectives,
}: {
  perspectives?: { source: string; framing: string }[];
}) {
  if (!perspectives || perspectives.length < 2) return null;

  return (
    <GlassCard glowEffect={false} fillHeight={false} className="p-5">
      <h2 className="text-base font-bold glass-text">Kaynaklar ne dedi?</h2>
      <p className="mt-1 text-xs glass-text-muted">
        Aynı olay, farklı kaynaklarda nasıl sunuldu — taraf tutmadan, karşılaştırmalı.
      </p>
      <ul className="mt-4 space-y-3">
        {perspectives.map((p, i) => (
          <li key={i} className="border-l-2 border-cyan-400/50 pl-3">
            <p className="text-sm font-semibold glass-text">{p.source}</p>
            <p className="text-sm glass-text-muted">{p.framing}</p>
          </li>
        ))}
      </ul>
    </GlassCard>
  );
}
