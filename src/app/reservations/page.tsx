"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";

type Resource = { id: string; name: string; type: string };
type Reservation = {
  id: string;
  team: string | null;
  startTime: string;
  endTime: string;
  status: "confirmed" | "cancelled";
  resource: Resource;
  user: { id: string; name: string; email: string };
};

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export default function ReservationsPage() {
  const { data: session } = useSession();
  const isAdmin = session?.user.role === "admin";

  const [resources, setResources] = useState<Resource[]>([]);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const [resourceId, setResourceId] = useState("");
  const [team, setTeam] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");

  async function load() {
    setLoading(true);
    const [resRes, resReservations] = await Promise.all([
      fetch("/api/resources"),
      fetch("/api/reservations"),
    ]);
    setResources(await resRes.json());
    setReservations(await resReservations.json());
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess("");
    setSubmitting(true);
    try {
      const res = await fetch("/api/reservations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resourceId, team, startTime, endTime }),
      });
      const body = await res.json();
      if (!res.ok) {
        // 409 is the conflict case from the overlap check in lib/reservations.ts
        throw new Error(body.error || "Failed to create reservation.");
      }
      setSuccess("Reservation confirmed.");
      setTeam("");
      setStartTime("");
      setEndTime("");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleCancel(id: string) {
    await fetch(`/api/reservations/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "cancelled" }),
    });
    await load();
  }

  const upcoming = reservations.filter(
    (r) => r.status === "confirmed" && new Date(r.endTime) >= new Date()
  );
  const past = reservations.filter(
    (r) => r.status === "cancelled" || new Date(r.endTime) < new Date()
  );

  function canCancel(r: Reservation) {
    return isAdmin || r.user.id === session?.user.id;
  }

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Reservations</h1>
          <p>Book a resource. Overlapping bookings are rejected automatically.</p>
        </div>
      </div>

      <div className="panel">
        <form onSubmit={handleSubmit}>
          {error && <div className="message message-error">{error}</div>}
          {success && <div className="message message-success">{success}</div>}
          <div className="form-row">
            <label>
              Resource
              <select
                value={resourceId}
                onChange={(e) => setResourceId(e.target.value)}
                required
              >
                <option value="" disabled>
                  Select a resource
                </option>
                {resources.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name} ({r.type})
                  </option>
                ))}
              </select>
            </label>
            <label>
              Team (optional)
              <input
                value={team}
                onChange={(e) => setTeam(e.target.value)}
                placeholder="Engineering"
              />
            </label>
          </div>
          <div className="form-row">
            <label>
              Starts
              <input
                type="datetime-local"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                required
              />
            </label>
            <label>
              Ends
              <input
                type="datetime-local"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                required
              />
            </label>
          </div>
          <button type="submit" disabled={submitting}>
            {submitting ? "Booking…" : "Book resource"}
          </button>
        </form>
      </div>

      <div className="panel">
        <table>
          <thead>
            <tr>
              <th>Resource</th>
              <th>Booked by</th>
              <th>When</th>
              <th>Status</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {!loading && upcoming.length === 0 && (
              <tr>
                <td colSpan={5} className="empty">
                  No upcoming reservations.
                </td>
              </tr>
            )}
            {upcoming.map((r) => (
              <tr key={r.id}>
                <td>
                  {r.resource.name}
                  {r.team && <div className="muted">{r.team}</div>}
                </td>
                <td className="muted">{r.user.name}</td>
                <td className="mono muted">
                  {formatDateTime(r.startTime)} – {formatDateTime(r.endTime)}
                </td>
                <td>
                  <span className="badge badge-confirmed">confirmed</span>
                </td>
                <td>
                  {canCancel(r) && (
                    <button className="secondary" onClick={() => handleCancel(r.id)}>
                      Cancel
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {past.length > 0 && (
        <div className="panel">
          <table>
            <thead>
              <tr>
                <th>Resource</th>
                <th>Booked by</th>
                <th>When</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {past.map((r) => (
                <tr key={r.id}>
                  <td className="muted">{r.resource.name}</td>
                  <td className="muted">{r.user.name}</td>
                  <td className="mono muted">
                    {formatDateTime(r.startTime)} – {formatDateTime(r.endTime)}
                  </td>
                  <td>
                    {r.status === "cancelled" ? (
                      <span className="badge badge-cancelled">cancelled</span>
                    ) : (
                      <span className="badge" style={{ background: "#eee" }}>
                        past
                      </span>
                    )}
                  </td>
                  <td></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
