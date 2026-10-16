"use client";

import { useSession, signOut } from "next-auth/react";

export function NavAuth() {
  const { data: session, status } = useSession();

  if (status === "loading") return null;

  if (!session) {
    return (
      <a href="/login" className="mono">
        Log in
      </a>
    );
  }

  return (
    <span className="nav-user">
      <span className="mono muted">
        {session.user.name} · {session.user.role}
      </span>
      <button className="secondary" onClick={() => signOut({ callbackUrl: "/login" })}>
        Log out
      </button>
    </span>
  );
}
