"use client";

import { useEffect, useMemo, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { isUSZip, cleanUSZip } from "@/lib/zip";
import ItemCard from "@/components/ItemCard";
import Modal from "@/components/Modal";
import SkeletonCard from "@/components/SkeletonCard";
import { gaEvent } from "@/app/(lib)/ga";
import SuccessHeroSlider from "@/components/SuccessHeroSlider";
import { useSearchParams, useRouter } from "next/navigation";
import ScanOverlayPurchase from "@/components/ScanOverlayPurchase";
import { WhopCheckoutEmbed, useCheckoutEmbedControls } from "@whop/checkout/react";

type ApiResp = { items: any[]; count: number };

interface ZipData {
  zip_code: number;
  city: string;
  state: string;
  county: string;
  latitude: number;
  longitude: number;
  cities: string[];
  uniqueCities: string[];
  addresses: string[];
}

type FomoProps = {
  min?: number;
  max?: number;
  durationMs?: number;
  autoReset?: boolean;
  onExpire?: () => void;
  label?: string;
};

// ⬇️ Replace with your FREE access pass *plan* ID on Whop
const FREE_PASS_PLAN_ID = "plan_yourFreeAccessPassIdHere";

export default function Dashboard() {
  const searchParams = useSearchParams();
  const initialZip = searchParams.get("zip");
  const [zip, setZip] = useState(cleanUSZip(initialZip || ""));
  const [data, setData] = useState<ApiResp | null>(null);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [zipData, setZipData] = useState<ZipData | null>(null);
  const [selectedItem, setSelectedItem] = useState<any | null>(null);
  const [scanning, setScanning] = useState(false);

  // Whop embed controls (so you can interact/track if needed)
  const whopRef = useCheckoutEmbedControls();

  useEffect(() => {
    const next = cleanUSZip(initialZip || "");
    setZip(next);
  }, [initialZip]);

  useEffect(() => {
    if (isUSZip(zip)) fetchItems(zip);
    else setData(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [zip]);

  async function fetchItems(z: string) {
    setLoading(true);
    setData(null);
    try {
      const res = await fetch(`/api/items?zip=${encodeURIComponent(z)}`, {
        cache: "no-store",
      });
      const json = (await res.json()) as ApiResp;
      setData(json);

      const response = await fetch(`/api/zip/${z}`);
      const data = await response.json();
      setZipData(data);
    } catch (e) {
      console.error("Error fetching items:", e);
      setData({ items: [], count: 0 });
      setZipData(null);
    } finally {
      setLoading(false);
    }
  }

  const router = useRouter();

  function getDealItem(item: any) {
    setSelectedItem(item);
    gaEvent("check_deal", { item });
    setScanning(true);
  }

  function openPurchaseOverlay() {
    setScanning(false);
    setOpen(true);
    gaEvent("modal_open", { src: "dashboard_modal", zip });
  }

  if (!isUSZip(zip) || !initialZip || !initialZip?.length) {
    router.push("/");
    return null;
  }

  return (
    <div className="relative min-h-dvh pb-20">
      <section className="container py-6">
        <h1 className="text-2xl font-bold">eMoney Deals</h1>

        {data?.count ? (
          <div className="mt-4 card p-4">
            <div className="text-sm">
              <span className="ml-2 text-white/70">Click one of the deals to unlock. ✅</span>
            </div>
          </div>
        ) : null}
      </section>

      <section className="container mt-4">
        {data === null ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: 12 }).map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        ) : (
          <div
            key={`grid-${zip}`}
            className="grid items-stretch gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
          >
            {data.items.map((it) => (
              <motion.div
                key={it.id}
                className="h-full"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25 }}
              >
                <ItemCard
                  item={it}
                  cities={zipData?.cities || []}
                  onClick={() => getDealItem(it)}
                  className="h-full"
                />
              </motion.div>
            ))}
          </div>
        )}
      </section>

      <AnimatePresence>
        {loading && (
          <motion.div
            className="fixed inset-0 z-50 grid place-items-center bg-black/60 backdrop-blur"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div className="h-1 w-2/3 overflow-hidden rounded-full bg-white/10">
              <motion.div
                className="h-full w-1/3 bg-gradient-to-r from-brand-purple to-brand-magenta"
                initial={{ x: "-100%" }}
                animate={{ x: "300%" }}
                transition={{ repeat: Infinity, duration: 1.2, ease: "easeInOut" }}
              />
            </motion.div>
            <div className="mt-3 text-sm text-white/70">Scanning inventory near {zip}…</div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* MODAL: “Your Report is Ready” with WHOP EMBED for Free Access Pass */}
      <Modal open={open} onClose={() => setOpen(false)}>
        <div className="items-center justify-center text-center">
          <h3 className="text-xl font-bold">Your Report is Ready</h3>
          <p className="text-sm text-white/70 mt-1">
            Enter your email below to claim your report and unlock your free trial.
          </p>

          {/* Optional trust line */}
          <div className="mt-2 text-[11px] text-white/55">
            You’ll receive your local report and instant access on the next step.
          </div>

          {/* Whop checkout/embed for FREE ACCESS PASS */}
          <div className="mx-auto mt-5 w-full max-w-md">
            <WhopCheckoutEmbed
              ref={whopRef}
              planId={FREE_PASS_PLAN_ID}
              theme="dark"
              // Sends useful tracking data
              onEvent={(e) => {
                gaEvent("whop_embed_event", {
                  name: e?.name || "unknown",
                  zip,
                  src: "dashboard_modal",
                });
              }}
              // Show a simple skeleton while loading
              fallback={<div className="card border border-white/10 p-4 text-sm text-white/70">Loading…</div>}
            />
          </div>

          {/* Proof / benefits carousel stays */}
          <SuccessHeroSlider
            items={[
              { src: "/success/insaneclearance.jpg", caption: "UNLOCK EXCLUSIVE HIDDEN CLEARANCE DEALS" },
              { src: "/success/pokemoncar.jpg", caption: "UNLOCK TRADING CARD RELEASES" },
              { src: "/success/lego.jpg", caption: "UNLOCK HIGH DEMAND COLLECTIBLES TO RESELL" },
              { src: "/success/penny.jpg", caption: "UNLOCK PENNY CLEARANCE ITEMS" },
              { src: "/success/tools.jpg", caption: "UNLOCK RANDOM RESELLABLE ITEMS" },
            ]}
            height={300}
            autoplayMs={1200}
            className="mx-auto mt-6"
          />

          <div className="mt-3 flex items-center justify-center">
            <FomoBadge min={200} max={450} durationMs={15 * 60_000} />
          </div>

          {/* Free Trial badge */}
          <div className="absolute top-0 right-0 w-16 h-16 rounded-full bg-red-600 flex items-center justify-center text-white font-bold text-sm -translate-x-1/3 -translate-y-1/3 shadow-glow">
            <span className="text-center">FREE TRIAL</span>
          </div>
        </div>
      </Modal>

      {scanning && (
        <ScanOverlayPurchase item={selectedItem} cities={zipData?.cities || []} onDone={openPurchaseOverlay} />
      )}
    </div>
  );
}

/* ----------------- FomoBadge ----------------- */
function FomoBadge({
  min = 200,
  max = 400,
  durationMs = 15 * 60_000,
  autoReset = false,
  onExpire,
  label = "claimed in the last hour",
}: FomoProps) {
  const randInt = (a: number, b: number) => a + Math.floor(Math.random() * (b - a + 1));
  const [count] = useState(() => randInt(min, max));
  const endTs = useRef<number>(Date.now() + durationMs);
  const [remaining, setRemaining] = useState<number>(durationMs);

  const safeCount = useMemo(
    () => Math.min(Math.max(count, Math.min(min, max)), Math.max(min, max)),
    [count, min, max]
  );

  useEffect(() => {
    endTs.current = Date.now() + durationMs;
    setRemaining(durationMs);

    const id = window.setInterval(() => {
      const left = Math.max(0, endTs.current - Date.now());
      setRemaining(left);

      if (left === 0) {
        onExpire?.();
        if (autoReset) {
          endTs.current = Date.now() + durationMs;
          setRemaining(durationMs);
        } else {
          window.clearInterval(id);
        }
      }
    }, 1000);

    return () => window.clearInterval(id);
  }, [durationMs, autoReset, onExpire]);

  const mm = String(Math.floor(remaining / 60_000)).padStart(2, "0");
  const ss = String(Math.floor((remaining % 60_000) / 1000)).padStart(2, "0");
  const urgent = remaining <= 60_000;

  return (
    <span
      className={[
        "inline-flex items-center gap-3 rounded-full border border-white/10 bg-white/5",
        "px-3 py-1 text-xs font-semibold text-white/80",
        urgent ? "ring-1 ring-red-500/20 animate-[pulse_1.6s_ease-in-out_infinite]" : "",
      ].join(" ")}
      aria-live="polite"
      title={`Offer window ends in ${mm}:${ss}`}
    >
      <span className="text-base leading-none">🔥</span>
      <span>
        <strong className="text-white">{safeCount}</strong> {label}
      </span>
      <span className="inline-flex items-center gap-1 text-white/70">
        • <span className="tabular-nums">
          {mm}:{ss}
        </span>
      </span>
    </span>
  );
}
