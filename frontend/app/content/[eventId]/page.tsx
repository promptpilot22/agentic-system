"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import TopBar from "@/components/TopBar";
import { getEvent, type Concept } from "@/lib/data";
import { approveConcept, getApproved, isLoggedIn } from "@/lib/session";

const SCORE_LABELS: Record<keyof Concept["scores"], string> = {
  creativity: "Creativity",
  eventRelevance: "Event relevance",
  brandAlignment: "Brand alignment",
  visualUniqueness: "Visual uniqueness",
  messageQuality: "Message quality",
};

export default function ContentPage() {
  const router = useRouter();
  const params = useParams<{ eventId: string }>();
  const event = useMemo(() => getEvent(params.eventId), [params.eventId]);

  const [ready, setReady] = useState(false);
  const [approvedKeys, setApprovedKeys] = useState<string[]>([]);
  const [toast, setToast] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");

  useEffect(() => {
    if (!isLoggedIn()) {
      router.replace("/login");
      return;
    }
    setApprovedKeys(getApproved());
    setReady(true);
  }, [router]);

  if (!ready) return null;

  if (!event) {
    return (
      <>
        <TopBar />
        <div className="container">
          <Link className="back-link" href="/calendar">
            ← Back to calendar
          </Link>
          <h1 className="page-title">Event not found</h1>
          <p className="page-sub">We couldn&apos;t find that event. It may have been removed.</p>
        </div>
      </>
    );
  }

  function handleApprove(concept: Concept) {
    approveConcept(event!.id, concept.id);
    setApprovedKeys(getApproved());
    setToast(`Approved the ${concept.archetype} concept for ${event!.name}.`);
  }

  function handleDownload(concept: Concept) {
    const payload = {
      event: event!.name,
      archetype: concept.archetype,
      one_liner: concept.oneLiner,
      caption: concept.caption,
      cta: concept.cta,
      hashtags: concept.hashtags,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${concept.id}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setToast(`Downloaded ${concept.archetype} concept.`);
  }

  function submitEdit(concept: Concept) {
    if (!editText.trim()) {
      setToast("Please describe the change you want before submitting.");
      return;
    }
    setToast(`Edit requested for ${concept.archetype} concept: "${editText.trim()}" — regenerating…`);
    setEditingId(null);
    setEditText("");
  }

  const isApproved = (conceptId: string) => approvedKeys.includes(`${event.id}:${conceptId}`);

  return (
    <>
      <TopBar />
      <div className="container">
        <Link className="back-link" href="/calendar">
          ← Back to calendar
        </Link>
        <h1 className="page-title">{event.name}</h1>
        <p className="page-sub">
          Audience: {event.audience} · Tone: {event.tone}
        </p>

        {event.sensitivity && <div className="flag">⚠ {event.sensitivity}</div>}

        {toast && (
          <div className="toast" role="status">
            {toast}
          </div>
        )}

        <div className="concept-grid">
          {event.concepts.map((concept) => (
            <div className="concept-card" key={concept.id}>
              <div className="poster" style={{ background: concept.gradient }}>
                <span className="archetype-tag">{concept.archetype}</span>
                <div className="one-liner">{concept.oneLiner}</div>
                <div className="logo">ABA CENTER</div>
              </div>
              <div className="concept-body">
                {isApproved(concept.id) && <div className="approved-banner">✓ Approved</div>}
                <p className="caption">{concept.caption}</p>
                <div className="cta">{concept.cta}</div>
                <div className="hashtags">{concept.hashtags.join(" ")}</div>

                <div className="scores">
                  {(Object.keys(SCORE_LABELS) as (keyof Concept["scores"])[]).map((k) => (
                    <div className="row" key={k}>
                      <span>{SCORE_LABELS[k]}</span>
                      <span className="val">{concept.scores[k]}/10</span>
                    </div>
                  ))}
                </div>

                <div className="actions">
                  <button
                    className="btn primary"
                    onClick={() => handleApprove(concept)}
                    disabled={isApproved(concept.id)}
                  >
                    {isApproved(concept.id) ? "Approved" : "Approve"}
                  </button>
                  <button className="btn secondary" onClick={() => handleDownload(concept)}>
                    Download
                  </button>
                  <button
                    className="btn"
                    onClick={() => {
                      setEditingId(editingId === concept.id ? null : concept.id);
                      setEditText("");
                    }}
                  >
                    Request edit
                  </button>
                </div>

                {editingId === concept.id && (
                  <div className="edit-box">
                    <textarea
                      value={editText}
                      onChange={(e) => setEditText(e.target.value)}
                      placeholder="e.g. Make it more emotional, shorten the caption…"
                    />
                    <button className="btn primary" onClick={() => submitEdit(concept)}>
                      Submit edit
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
