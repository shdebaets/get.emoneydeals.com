"use client";
import { useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import RotatingHeadline from "@/components/RotatingHeadline";
import ScanOverlay from "@/components/ScanOverlay";
import { isUSZip, cleanUSZip } from "@/lib/zip";
import SuccessBackdrop from "@/components/SuccessBackdrop";
import ProofStrip from "@/components/ProofStrip"; 
import { gaEvent } from "@/app/(lib)/ga";

export default function Landing() {
  const r = useRouter();
  const qp = useSearchParams();
  const utm = useMemo(() => new URLSearchParams(qp ?? undefined).toString(), [qp]);
  const [zip, setZip] = useState("");
  const [scanning, setScanning] = useState(false);
  const [city, setCity] = useState<string | null>(null);
  const [state, setState] = useState<string | null>(null);

  const go = async () => {
    const z = cleanUSZip(zip);
    if (!isUSZip(z)) return alert("Enter a valid US ZIP (e.g., 33101 or 33101-1234).");

    const response = await fetch(`/api/zip/${z}`);

    if (!response.ok) {
      const data = await response.json();
      return alert(data.error || "Error looking up ZIP.");
    }

    const data = await response.json();

    setCity(data.city);
    setState(data.state);

    setScanning(true);
  };

  const finalizeRoute = () => {
    const z = cleanUSZip(zip);
    const qs = new URLSearchParams({ zip: z, fsrc: "landing" });
    if (utm) new URLSearchParams(utm).forEach((v, k) => qs.append(k, v));

    gaEvent("zip_submit", { zip: z });

    r.push(`/dashboard?${qs.toString()}`);
  };

  return (
    <div>
      <section className="relative container min-h-[calc(100dvh-4rem)] grid items-center py-10">
        <SuccessBackdrop
          images={[
            
          ]}
          parallaxIntensity={0.1}
        />
        <div className="mx-auto z-10 max-w-[46rem] text-center">
          <RotatingHeadline />
          <p className="mt-4 text-white/80 drop-shadow-2xl">
            Enter your ZIP to see what’s popping near you. No distractions, just results.
          </p>

          <div className="mt-8 mx-auto flex w-full max-w-md gap-3">
            <input
              autoFocus
               className="w-full rounded-xl bg-black border border-white/10 px-4 py-3 outline-none focus:ring-4 focus:ring-brand-purple/50 shadow-[0_0_48px_theme(colors.brand.purple/0.75),0_0_18px_theme(colors.brand.magenta/0.55)] text-center text-lg"
              // className="input text-center text-lg"
              placeholder="Enter US ZIP (e.g., 33101)"
              value={zip}
              onChange={(e) => setZip(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && go()}
            />
            <button className="btn btn-primary" onClick={go}>Search</button>
          </div>
          <p className="mt-2 text-xs text-white/60 drop-shadow-2xl">US ZIP codes only.</p>

          <ProofStrip />
        </div>
      </section>

      {scanning && <ScanOverlay zip={cleanUSZip(zip)} city={city} state={state} onDone={finalizeRoute} />}
    </div>
  );
}
