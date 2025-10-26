"use client";

import { useEffect, useMemo, useRef, useState, useId } from "react";
import { AnimatePresence, motion } from "framer-motion";
import SuccessHeroSlider from "./SuccessHeroSlider";

type SafeItem = {
    id: string;
    name: string;
    brand: string;
    price: string;
    oldPrice?: string;
    image: string;
    retailer: string;
    stock_hint: string;
    distance_hint: string;
    updated_hint: string;
};

const uniq = <T,>(arr: T[]) => [...new Set(arr.filter(Boolean))];
const shuffle = <T,>(arr: T[]) => {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
        const j = (Math.random() * (i + 1)) | 0;
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
};

export default function ScanOverlayPurchase({
    item,
    cities,
    totalMs = 6000,
    onDone,
}: {
    item: SafeItem;
    cities: string[];
    onDone: () => void;
    totalMs?: number;
}) {
    const titleId = useId();

    const cityPhrases = useMemo(
        () => shuffle(uniq(cities ?? [])).slice(0, 6).map((c) => `Checking ${c}…`),
        [cities]
    );

    const tailSteps = useMemo(
        () => ["Items Found Near You!✅", "Preparing your results… 🔓"],
        []
    );

    const steps = useMemo(() => [...cityPhrases, ...tailSteps], [cityPhrases, tailSteps]);

    const schedule = useMemo(() => {
        const minStepMs = 800;
        const cityShare = 0.6;
        const cityTime = Math.max(minStepMs * cityPhrases.length, Math.round(totalMs * cityShare));
        const tailTime = Math.max(minStepMs * tailSteps.length, totalMs - cityTime);

        const cityStep = Math.round(cityTime / Math.max(1, cityPhrases.length));
        const tailStep = Math.round(tailTime / Math.max(1, tailSteps.length));

        const durations = [
            ...Array(cityPhrases.length).fill(cityStep),
            ...Array(tailSteps.length).fill(tailStep),
        ];

        const sum = durations.reduce((a, b) => a + b, 0);
        const diff = totalMs - sum;
        if (diff !== 0 && durations.length) durations[durations.length - 1] += diff;

        const cumulative: number[] = [];
        let acc = 0;
        for (const d of durations) {
            acc += d;
            cumulative.push(acc);
        }
        return { durations, cumulative };
    }, [cityPhrases.length, tailSteps.length, totalMs]);

    const [progress, setProgress] = useState(0);
    const [idx, setIdx] = useState(0);
    const raf = useRef<number | null>(null);
    const start = useRef<number | null>(null);
    const done = useRef(false);

    useEffect(() => {
        const tick = (now: number) => {
            if (start.current == null) start.current = now;
            const elapsed = now - start.current;
            const t = Math.min(1, elapsed / totalMs);

            const eased = 1 - Math.pow(1 - t, 3);
            setProgress(eased);

            const cum = schedule.cumulative;
            let i = 0;
            while (i < cum.length && elapsed >= cum[i]) i++;
            setIdx(Math.min(cum.length - 1, i));

            if (t < 1) {
                raf.current = requestAnimationFrame(tick);
            } else if (!done.current) {
                done.current = true;
                onDone();
            }
        };
        raf.current = requestAnimationFrame(tick);
        return () => {
            if (raf.current) cancelAnimationFrame(raf.current);
        };
    }, [onDone, schedule.cumulative, totalMs]);

    return (
        <AnimatePresence>
            <motion.div
                className="fixed inset-0 z-[60] grid place-items-center bg-black/70 backdrop-blur"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                aria-modal="true"
                role="dialog"
                aria-labelledby={titleId}
            >
                <div className="card w-[min(92vw,860px)] p-6 text-center bg-black/70 shadow-2xl rounded-2xl border border-white/10">
                    <div className="flex items-center gap-4 justify-center">
                        <div className="size-14 shrink-0 rounded-xl overflow-hidden ring-1 ring-white/10 bg-white/5">
                            <img
                                src={item.image}
                                alt={item.name}
                                className="h-full w-full object-cover"
                                onError={(e) => {
                                    const el = e.currentTarget as HTMLImageElement;
                                    if (!el.src.endsWith("/logo.png")) el.src = "/logo.png";
                                }}
                            />
                        </div>

                        <div className="min-w-0 text-left">
                            <div className="flex flex-wrap items-center gap-2">
                                {item.brand && (
                                    <span className="px-2 py-0.5 rounded-md text-[11px] uppercase tracking-wide bg-white/10 text-white/70">
                                        {item.brand}
                                    </span>
                                )}
                                {item.retailer && (
                                    <span className="px-2 py-0.5 rounded-md text-[11px] uppercase tracking-wide bg-white/10 text-white/70">
                                        {item.retailer}
                                    </span>
                                )}
                            </div>

                            <h3
                                id={titleId}
                                className="mt-1 text-lg sm:text-xl font-semibold leading-tight text-white line-clamp-2"
                                title={item.name}
                            >
                                {item.name}
                            </h3>

                            <div className="mt-1 flex items-center gap-2">
                                {item.oldPrice && (
                                    <span className="text-white/40 text-sm line-through">{item.oldPrice}</span>
                                )}
                                <span className="text-base sm:text-lg font-bold bg-gradient-to-r from-brand-purple to-brand-magenta bg-clip-text text-transparent">
                                    {item.price}
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="mt-5 h-3 w-full overflow-hidden rounded-full bg-white/10">
                        <motion.div
                            className="h-full bg-gradient-to-r from-brand-purple to-brand-magenta"
                            animate={{ width: `${Math.round(progress * 100)}%` }}
                            transition={{ type: "tween", duration: 0.12, ease: "easeOut" }}
                            style={{ width: "0%" }}
                        />
                    </div>

                    <div className="text-[11px] text-white/60 mt-4">
                        {Math.round(progress * 100)}%
                    </div>

                    <div className="mt-2 h-6 overflow-hidden relative">
                        <AnimatePresence mode="wait" initial={false}>
                            <motion.div
                                key={idx}
                                initial={{ y: 16, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                exit={{ y: -16, opacity: 0 }}
                                transition={{ duration: 0.25, ease: "easeOut" }}
                                className="absolute inset-0 flex items-center justify-center text-sm text-white/85"
                                aria-live="polite"
                            >
                                {steps[idx]}
                            </motion.div>
                        </AnimatePresence>
                    </div>

                    <SuccessHeroSlider
                        items={[
                            { src: "/success/aicheck.png.jpg", caption: "1) Find Clearance Products With AI " },
                            { src: "/success/listing.png.jpg", caption: "2) List them on Online Marketplaces" },
                            { src: "/success/profit.png.jpg", caption: "3) Resell Them and Collect Profits" },
                           
                        ]}
                        height={300}
                        autoplayMs={2400}
                        className="mx-auto mt-4"
                    />

                    <p className="mt-2 text-xs text-white/50">The Steps To Success</p>
                </div>
            </motion.div>
        </AnimatePresence>
    );
}
