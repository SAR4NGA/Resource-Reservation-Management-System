"use client";

import { useSession, signOut } from "next-auth/react";

import Link from "next/link";

export function NavAuth() {
  const { data: session, status } = useSession();

  if (status === "loading") return null;

  if (!session) {
    return (
      <Link href="/login" className="nav-link">
        Log in
      </Link>
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
