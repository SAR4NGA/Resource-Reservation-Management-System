"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";

type Resource = {
  id: string;
  name: string;
  type: string;
  capacity: number | null;
  location: string | null;
};

export default function ResourcesPage() {
  const { data: session } = useSession();
  const isAdmin = session?.user.role === "admin";

  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [name, setName] = useState("");
  const [type, setType] = useState("");
  const [capacity, setCapacity] = useState("");
  const [location, setLocation] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function load() {
    setLoading(true);
    const res = await fetch("/api/resources");
    const data = await res.json();
    setResources(data);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const res = await fetch("/api/resources", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, type, capacity, location }),
      });
      if (!res.ok) {
        const body = await res.json();
        throw new Error(body.error || "Failed to create resource.");
      }
      setName("");
      setType("");
      setCapacity("");
      setLocation("");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Resources</h1>
          <p>Rooms, equipment, and anything else the organization shares.</p>
        </div>
      </div>

      {isAdmin ? (
        <div className="panel">
          <form onSubmit={handleSubmit}>
            {error && <div className="message message-error">{error}</div>}
            <div className="form-row">
              <label>
                Name
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Conference Room A"
                  required
                />
              </label>
              <label>
                Type
                <input
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                  placeholder="room / vehicle / equipment"
                  required
                />
              </label>
            </div>
            <div className="form-row">
              <label>
                Capacity (optional)
                <input
                  value={capacity}
                  onChange={(e) => setCapacity(e.target.value)}
                  type="number"
                  min="1"
                />
              </label>
              <label>
                Location (optional)
                <input
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="2nd floor"
                />
              </label>
            </div>
            <button type="submit" disabled={submitting}>
              {submitting ? "Adding…" : "Add resource"}
            </button>
          </form>
        </div>
      ) : (
        <div className="panel">
          <p className="empty">Only admins can add resources.</p>
        </div>
      )}

      <div className="panel">
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Type</th>
              <th>Capacity</th>
              <th>Location</th>
            </tr>
          </thead>
          <tbody>
            {!loading && resources.length === 0 && (
              <tr>
                <td colSpan={4} className="empty">
                  No resources yet.
                </td>
              </tr>
            )}
            {resources.map((r) => (
              <tr key={r.id}>
                <td>{r.name}</td>
                <td className="muted">{r.type}</td>
                <td className="mono muted">{r.capacity ?? "—"}</td>
                <td className="muted">{r.location ?? "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
