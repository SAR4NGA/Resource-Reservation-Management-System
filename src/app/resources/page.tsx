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

  // Create form state
  const [name, setName] = useState("");
  const [type, setType] = useState("");
  const [capacity, setCapacity] = useState("");
  const [location, setLocation] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Edit state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editType, setEditType] = useState("");
  const [editCapacity, setEditCapacity] = useState("");
  const [editLocation, setEditLocation] = useState("");
  const [editSubmitting, setEditSubmitting] = useState(false);
  const [editError, setEditError] = useState("");

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

  function startEdit(r: Resource) {
    setEditingId(r.id);
    setEditName(r.name);
    setEditType(r.type);
    setEditCapacity(r.capacity?.toString() ?? "");
    setEditLocation(r.location ?? "");
    setEditError("");
  }

  function cancelEdit() {
    setEditingId(null);
    setEditError("");
  }

  async function handleEdit(id: string) {
    setEditError("");
    setEditSubmitting(true);
    try {
      const res = await fetch(`/api/resources/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editName,
          type: editType,
          capacity: editCapacity,
          location: editLocation,
        }),
      });
      if (!res.ok) {
        const body = await res.json();
        throw new Error(body.error || "Failed to update resource.");
      }
      setEditingId(null);
      await load();
    } catch (err) {
      setEditError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setEditSubmitting(false);
    }
  }

  async function handleDelete(id: string, resourceName: string) {
    if (!confirm(`Delete "${resourceName}"? This cannot be undone.`)) return;
    try {
      const res = await fetch(`/api/resources/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const body = await res.json();
        throw new Error(body.error || "Failed to delete resource.");
      }
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    }
  }

  const colSpan = isAdmin ? 5 : 4;

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
        {editError && (
          <div className="message message-error" style={{ marginBottom: 12 }}>
            {editError}
          </div>
        )}
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Type</th>
              <th>Capacity</th>
              <th>Location</th>
              {isAdmin && <th></th>}
            </tr>
          </thead>
          <tbody>
            {!loading && resources.length === 0 && (
              <tr>
                <td colSpan={colSpan} className="empty">
                  No resources yet.
                </td>
              </tr>
            )}
            {resources.map((r) =>
              editingId === r.id ? (
                <tr key={r.id} className="editing-row">
                  <td>
                    <input
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="inline-input"
                      required
                    />
                  </td>
                  <td>
                    <input
                      value={editType}
                      onChange={(e) => setEditType(e.target.value)}
                      className="inline-input"
                      required
                    />
                  </td>
                  <td>
                    <input
                      value={editCapacity}
                      onChange={(e) => setEditCapacity(e.target.value)}
                      className="inline-input"
                      type="number"
                      min="1"
                      placeholder="—"
                    />
                  </td>
                  <td>
                    <input
                      value={editLocation}
                      onChange={(e) => setEditLocation(e.target.value)}
                      className="inline-input"
                      placeholder="—"
                    />
                  </td>
                  <td className="row-actions">
                    <button
                      className="action-save"
                      disabled={editSubmitting}
                      onClick={() => handleEdit(r.id)}
                    >
                      {editSubmitting ? "Saving…" : "Save"}
                    </button>
                    <button
                      className="secondary action-cancel"
                      onClick={cancelEdit}
                    >
                      Cancel
                    </button>
                  </td>
                </tr>
              ) : (
                <tr key={r.id}>
                  <td>{r.name}</td>
                  <td className="muted">{r.type}</td>
                  <td className="mono muted">{r.capacity ?? "—"}</td>
                  <td className="muted">{r.location ?? "—"}</td>
                  {isAdmin && (
                    <td className="row-actions">
                      <button
                        className="secondary action-edit"
                        onClick={() => startEdit(r)}
                      >
                        Edit
                      </button>
                      <button
                        className="secondary action-delete"
                        onClick={() => handleDelete(r.id, r.name)}
                      >
                        Delete
                      </button>
                    </td>
                  )}
                </tr>
              )
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}
