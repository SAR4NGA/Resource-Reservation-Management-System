import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

function formatRange(start: Date, end: Date) {
  const opts: Intl.DateTimeFormatOptions = {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  };
  return `${start.toLocaleString("en-US", opts)} – ${end.toLocaleString("en-US", { hour: "numeric", minute: "2-digit" })}`;
}

export default async function OverviewPage() {
  const now = new Date();

  const resources = await prisma.resource.findMany({
    orderBy: { name: "asc" },
    include: {
      reservations: {
        where: { status: "confirmed", endTime: { gte: now } },
        orderBy: { startTime: "asc" },
        take: 1,
        include: { user: true },
      },
    },
  });

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Overview</h1>
          <p>Live availability across every shared resource.</p>
        </div>
      </div>

      <div className="panel">
        <table>
          <thead>
            <tr>
              <th>Resource</th>
              <th>Type</th>
              <th>Status</th>
              <th>Next booking</th>
            </tr>
          </thead>
          <tbody>
            {resources.length === 0 && (
              <tr>
                <td colSpan={4} className="empty">
                  No resources yet. Add one from the Resources page.
                </td>
              </tr>
            )}
            {resources.map((r) => {
              const next = r.reservations[0];
              const isBusyNow =
                next && next.startTime <= now && next.endTime > now;
              return (
                <tr key={r.id}>
                  <td>{r.name}</td>
                  <td className="muted">{r.type}</td>
                  <td>
                    {isBusyNow ? (
                      <span className="badge badge-warn">in use</span>
                    ) : (
                      <span className="badge badge-confirmed">available</span>
                    )}
                  </td>
                  <td className="mono muted">
                    {next
                      ? `${formatRange(next.startTime, next.endTime)} · ${next.user.name}`
                      : "nothing scheduled"}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </>
  );
}
