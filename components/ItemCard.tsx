"use client";
import clsx from "clsx";
import { CityMarqueeChip } from "./MarqueeTextRotate";
import { UpcStripe } from "./UpcStripe";

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
    store_sku: string | null;
    upc: string | null;
};

async function trackEvent(event: string) {
    try {
        await fetch("https://emoneydeals.com/api/web-event", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                url: window.location.href,
                event,
            }),
        });
    } catch (error) {
        console.error("Failed to track event:", error);
    }
}

function getEventNameForItem(item: SafeItem): string {
    // Create a normalized version of the brand name for the event
    const brandNormalized = item.brand.toLowerCase().replace(/[^a-z0-9]/g, "_");
    return `get_deal_${brandNormalized}_button_click`;
}

export default function ItemCard({
    item,
    cities,
    onClick,
    className,
}: {
    item: SafeItem;
    cities: string[];
    onClick: () => void;
    className?: string;
}) {
    const handleGetDealClick = (e: React.MouseEvent) => {
        // Track the event
        const eventName = getEventNameForItem(item);
        trackEvent(eventName);

        // Call the original onClick handler
        onClick();
    };

    return (
        <button
            onClick={handleGetDealClick}
            className={clsx(
                "group relative w-full rounded-2xl border border-white/10 bg-[#0D0C14]/80 p-3 text-left",
                "shadow-[0_8px_28px_rgba(0,0,0,.35)] transition hover:translate-y-[-2px] hover:shadow-glow",
                "h-full flex flex-col",
                className
            )}
        >
            <div className="flex gap-3">
                {/* Thumb */}
                <div className="relative h-[66px] w-[88px] overflow-hidden rounded-lg border border-white/10 shrink-0">
                    <img
                        src={item.image}
                        alt=""
                        className="h-full w-full object-cover select-none"
                        draggable={false}
                    />
                    {/* <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(120%_90%_at_50%_10%,transparent,rgba(0,0,0,.55))]" /> */}
                    {/* <span className="absolute left-1.5 top-1.5 inline-flex items-center gap-1 rounded-md bg-black/60 px-1.5 py-0.5 text-[10px] font-semibold tracking-wide text-white/90 backdrop-blur">
                        🔒 LOCKED
                    </span> */}
                </div>

                <div className="min-w-0 flex-1">
                    <div
                        className="select-none pointer-events-none"
                        style={{ WebkitUserSelect: "none", userSelect: "none" }}
                    >
                        <div className="text-[11px] leading-[14px] text-white/85 [text-shadow:0_0_8px_rgba(0,0,0,.45)]">
                            {item.brand}
                        </div>
                        <div className="mt-0.5 line-clamp-2 text-[12.5px] leading-4 text-white/95 [text-shadow:0_0_10px_rgba(0,0,0,.5)] min-h-[32px]">
                            {item.name}
                        </div>
                    </div>

                    <div className="mt-2 flex items-center gap-2">
                        <span className="text-lg font-bold bg-gradient-to-r from-brand-purple to-brand-magenta bg-clip-text text-transparent">
                            ${item.price}
                        </span>
                        {item.oldPrice && (
                            <span className="text-xs text-white/60 line-through">{item.oldPrice}</span>
                        )}
                    </div>
                </div>
            </div>

            <div className="mt-3 min-h-[28px]">
                <div className="flex flex-col items-start min-w-0 gap-2 whitespace-nowrap">
                    <Chip>{item.retailer}</Chip>
                    <CityMarqueeChip cities={cities} seedKey={item.id} />
                    <span className="text-[11px] text-white/85 overflow-hidden text-ellipsis">✅ {item.stock_hint.split("-")[0]} Found</span>
                </div>
            </div>

            <div className="flex-1" />

            <div className="mt-3 rounded-xl border border-white/10 bg-black/30 p-3 w-full">
                {/* <div className="relative h-[68px] w-full overflow-hidden rounded-md">
                    <div
                        className="h-full w-full blur-[2px] opacity-90"
                        style={{
                            background:
                                "repeating-linear-gradient(90deg, rgba(255,255,255,.95) 0 2px, rgba(0,0,0,1) 2px 6px)",
                        }}
                    />
                    <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(110%_70%_at_50%_50%,transparent,rgba(0,0,0,.75))]" />
                </div> */}
                <UpcStripe upc={item.upc ?? undefined} height={68} />
                <div className="mt-3 flex flex-col items-center gap-2">
                    <Pill className="text-center">SKU: {item.store_sku}</Pill>
                    <Pill className="text-center">UPC: {item.upc}</Pill>
                </div>
            </div>

            <div className="btn btn-primary w-full mt-4 cursor-pointer select-none">
                GET DEAL
            </div>
        </button>
    );
}

function Chip({
    children,
    className,
}: {
    children: React.ReactNode;
    className?: string;
}) {
    return (
        <span
            className={clsx(
                "inline-flex items-center rounded-full border border-white/12 bg-white/[.055] px-2.5 py-1",
                "text-[11px] text-white/85 overflow-hidden text-ellipsis",
                className
            )}
            title={typeof children === "string" ? children : undefined}
        >
            <span className="truncate">{children}</span>
        </span>
    );
}

function Pill({ children, className }: { children: React.ReactNode; className?: string }) {
    return (
        <span className={clsx("inline-flex items-center rounded-full border border-white/12 bg-white/[.055] px-3 py-[6px] text-[11px] text-white/75", className)}>
            {children}
        </span>
    );
}