"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import TopBar from "@/components/TopBar";
import { events, type RunStatus } from "@/lib/data";
import { isLoggedIn, isEventApproved } from "@/lib/session";

const STATUS_LABEL: Record<RunStatus, string> = {
  not_started: "Not started",
  generating: "Generating",
  pending_approval: "Pending approval",
  approved: "Approved",
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default function CalendarPage() {
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!isLoggedIn()) {
      router.replace("/login");
    } else {
      setReady(true);
    }
  }, [router]);

  if (!ready) return null;

  return (
    <>
      <TopBar />
      <div className="container">
        <h1 className="page-title">Upcoming events</h1>
        <p className="page-sub">Review the three AI-generated concepts for each event and approve your pick.</p>

        <div className="event-grid">
          {events.map((event) => {
            const status: RunStatus = isEventApproved(event.id) ? "approved" : event.status;
            const reviewable = event.concepts.length > 0;
            return (
              <div className="event-card" key={event.id}>
                <div className="event-name">{event.name}</div>
                <div className="event-meta">{formatDate(event.date)}</div>
                <div className="badges">
                  <span className="badge">{event.category}</span>
                  <span className={`badge status-${status}`}>{STATUS_LABEL[status]}</span>
                </div>
                {event.sensitivity && <div className="flag">⚠ {event.sensitivity}</div>}
                {reviewable ? (
                  <Link className="btn primary" href={`/content/${event.id}`}>
                    Review concepts
                  </Link>
                ) : (
                  <button className="btn" disabled>
                    {event.status === "generating" ? "Generating…" : "Not started"}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}
