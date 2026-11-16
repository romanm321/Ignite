"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import {
  CalendarClock,
  Clock,
  Navigation,
  Ticket,
  Users,
  Video,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { bankers, branches, featureLabels, type Branch } from "@/lib/bank-data";
import { useBank } from "../bank-provider";
import { BookingSheet } from "../branches/booking-sheet";
import { Pill, ScreenHeader } from "../primitives";
import { SubNav, HeaderActions, moreSubNav } from "../nav";

const BranchMap = dynamic(() => import("../branches/branch-map"), {
  ssr: false,
  loading: () => <div className="size-full animate-pulse bg-muted" />,
});

type FilterId =
  "open" | "lowWait" | "Spanish" | "Mandarin" | "ASL" | "drive-thru" | "sunday";
const filters: { id: FilterId; label: string }[] = [
  { id: "open", label: "Open now" },
  { id: "lowWait", label: "Under 5 min" },
  { id: "Spanish", label: "Español" },
  { id: "Mandarin", label: "中文" },
  { id: "ASL", label: "ASL" },
  { id: "drive-thru", label: "Drive-thru" },
  { id: "sunday", label: "Sundays" },
];

function matches(b: Branch, f: FilterId) {
  switch (f) {
    case "open":
      return b.openNow;
    case "lowWait":
      return b.openNow && b.waitMins < 5;
    case "drive-thru":
      return b.features.includes("drive-thru");
    case "sunday":
      return b.features.includes("sunday");
    default:
      return b.languages.includes(f);
  }
}

function WaitBadge({ b }: { b: Branch }) {
  return (
    <span
      className={cn(
        "flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold",
        !b.openNow
          ? "bg-muted text-muted-foreground"
          : b.waitMins <= 5
            ? "bg-accent text-accent-foreground"
            : "bg-amber-100 text-amber-800",
      )}
    >
      <Clock className="size-3" aria-hidden />
      {!b.openNow
        ? "Closed"
        : b.waitMins === 0
          ? "No wait"
          : `${b.waitMins} min wait`}
    </span>
  );
}

export function BranchesScreen() {
  const { focusBranchId, queue, appointments, dispatch, notify } = useBank();
  const [active, setActive] = useState<FilterId[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [bookingFor, setBookingFor] = useState<Branch | null>(null);
  const [lastFocus, setLastFocus] = useState<string | null>(null);

  if (focusBranchId !== lastFocus) {
    setLastFocus(focusBranchId);
    if (focusBranchId) {
      setSelectedId(focusBranchId);
      setBookingFor(branches.find((b) => b.id === focusBranchId) ?? null);
    }
  }

  const list = branches.filter((b) => active.every((f) => matches(b, f)));
  const queueBranch = queue
    ? branches.find((b) => b.id === queue.branchId)
    : null;

  function joinLine(b: Branch) {
    dispatch({
      type: "queue",
      ticket: {
        branchId: b.id,
        number: `A${Math.floor(10 + Math.random() * 80)}`,
        position: b.inLine + 1,
        etaMins: b.waitMins + 3,
      },
    });
    notify(
      `You’re in line at ${b.name}. We’ll ping you when it’s time to walk over.`,
    );
  }

  return (
    <>
      <div className="no-scrollbar absolute inset-0 overflow-y-auto pb-8">
        <ScreenHeader title="Branches" subtitle="Live wait times near you" right={<HeaderActions />} />
        <SubNav label="More sections" items={moreSubNav} />

        <div className="flex flex-col gap-4 pt-1">
          {(queue || appointments.length > 0) && (
            <div className="flex flex-col gap-2 px-4">
              {queue && queueBranch && (
                <div className="flex items-center gap-3 rounded-3xl bg-forest p-4 text-forest-foreground">
                  <span className="flex size-12 flex-col items-center justify-center rounded-2xl bg-lime font-mono text-sm font-bold text-lime-foreground">
                    <Ticket className="size-4" aria-hidden />
                    {queue.number}
                  </span>
                  <div className="flex-1">
                    <p className="font-semibold">
                      Virtual line · {queueBranch.name}
                    </p>
                    <p className="text-sm text-forest-foreground/75">
                      #{queue.position} in line · about {queue.etaMins} min ·
                      leave when we ping
                    </p>
                  </div>
                  <button
                    type="button"
                    aria-label="Leave line"
                    onClick={() => dispatch({ type: "queue", ticket: null })}
                    className="flex size-11 items-center justify-center rounded-full bg-white/10"
                  >
                    <X className="size-4" aria-hidden />
                  </button>
                </div>
              )}
              {appointments.map((a) => {
                const br = branches.find((b) => b.id === a.branchId);
                const bk = bankers.find((b) => b.id === a.bankerId);
                return (
                  <div
                    key={a.id}
                    className="flex items-center gap-3 rounded-3xl border bg-card p-4"
                  >
                    <span className="flex size-12 items-center justify-center rounded-2xl bg-muted text-lime">
                      {a.mode === "video" ? (
                        <Video className="size-5" aria-hidden />
                      ) : (
                        <CalendarClock className="size-5" aria-hidden />
                      )}
                    </span>
                    <div className="flex-1">
                      <p className="font-semibold">{a.reason}</p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(a.dateISO).toLocaleDateString("en-US", {
                          weekday: "short",
                          month: "short",
                          day: "numeric",
                        })}{" "}
                        · {a.time} · {bk?.name.split(" ")[0]} ·{" "}
                        {a.mode === "in-branch" ? br?.name : a.mode}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        dispatch({ type: "cancelAppointment", id: a.id });
                        notify("Appointment cancelled");
                      }}
                      className="h-11 rounded-xl px-3 text-sm font-medium text-destructive"
                    >
                      Cancel
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          <div className="isolate mx-4 h-56 overflow-hidden rounded-3xl border">
            <BranchMap
              branches={list}
              selectedId={selectedId}
              onSelect={setSelectedId}
            />
          </div>

          <div
            className="no-scrollbar flex gap-2 overflow-x-auto px-4"
            role="group"
            aria-label="Filters"
          >
            {filters.map((f) => {
              const on = active.includes(f.id);
              return (
                <button
                  key={f.id}
                  type="button"
                  aria-pressed={on}
                  onClick={() =>
                    setActive((a) =>
                      on ? a.filter((x) => x !== f.id) : [...a, f.id],
                    )
                  }
                  className={cn(
                    "h-10 shrink-0 rounded-xl border px-4 text-sm font-medium transition-colors",
                    on
                      ? "border-forest bg-forest text-forest-foreground"
                      : "bg-card",
                  )}
                >
                  {f.label}
                </button>
              );
            })}
          </div>

          <button
            type="button"
            onClick={() => setBookingFor(branches[0])}
            className="mx-4 flex items-center gap-3 rounded-3xl bg-lime p-4 text-left text-lime-foreground"
          >
            <Video className="size-5 shrink-0" aria-hidden />
            <span className="flex-1">
              <span className="block font-semibold">
                Skip the trip — meet by video
              </span>
              <span className="block text-sm opacity-80">
                Same-day slots with any TD specialist
              </span>
            </span>
          </button>

          <ul
            className="flex flex-col gap-3 px-4"
            aria-label={`${list.length} branches`}
          >
            {list.length === 0 && (
              <li className="rounded-3xl bg-card p-6 text-center text-sm text-muted-foreground">
                No branches match every filter. Try removing one, or book a
                video call.
              </li>
            )}
            {list.map((b) => {
              const branchBankers = bankers.filter((bk) =>
                b.bankerIds.includes(bk.id),
              );
              return (
                <li
                  key={b.id}
                  className={cn(
                    "rounded-3xl border bg-card p-4 transition-shadow",
                    selectedId === b.id &&
                      "border-primary ring-2 ring-primary/25",
                  )}
                >
                  <button
                    type="button"
                    onClick={() => setSelectedId(b.id)}
                    className="w-full text-left"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="font-semibold">{b.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {b.distanceMi} mi · {b.address.split(",")[0]}
                        </p>
                      </div>
                      <WaitBadge b={b} />
                    </div>
                    <p className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Users className="size-3.5" aria-hidden />
                      {b.openNow ? `${b.inLine} in line · ` : ""}Quietest{" "}
                      {b.quietest} · {b.hoursToday}
                    </p>
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {b.features.slice(0, 4).map((f) => (
                        <Pill key={f} className="bg-muted text-foreground">
                          {featureLabels[f]}
                        </Pill>
                      ))}
                    </div>
                    <div className="mt-3 flex items-center gap-2">
                      <div className="flex -space-x-2" aria-hidden>
                        {branchBankers.map((bk) => (
                          <span
                            key={bk.id}
                            className="flex size-7 items-center justify-center rounded-full bg-forest text-[10px] font-semibold text-lime ring-2 ring-card"
                          >
                            {bk.initials}
                          </span>
                        ))}
                      </div>
                      <span className="text-xs text-muted-foreground">
                        Speaks {b.languages.join(", ")}
                      </span>
                    </div>
                  </button>
                  <div className="mt-4 grid grid-cols-[auto_1fr_1fr] gap-2">
                    <a
                      href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(b.address)}`}
                      target="_blank"
                      rel="noreferrer"
                      aria-label={`Directions to ${b.name}`}
                      className="flex size-11 items-center justify-center rounded-full border"
                    >
                      <Navigation className="size-4" aria-hidden />
                    </a>
                    <button
                      type="button"
                      disabled={!b.openNow || queue?.branchId === b.id}
                      onClick={() => joinLine(b)}
                      className="h-11 rounded-xl border-2 border-shield text-sm font-semibold disabled:opacity-40 bg-card text-shield-700"
                    >
                      {queue?.branchId === b.id ? "In line" : "Join line"}
                    </button>
                    <button
                      type="button"
                      onClick={() => setBookingFor(b)}
                      className="h-11 rounded-xl bg-shield text-sm font-semibold text-shield-foreground"
                    >
                      Book
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
      {bookingFor && (
        <BookingSheet
          key={bookingFor.id}
          branch={bookingFor}
          onClose={() => setBookingFor(null)}
        />
      )}
    </>
  );
}
