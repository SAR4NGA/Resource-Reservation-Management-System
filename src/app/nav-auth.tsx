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

  const role = (session.user.role || "member").toLowerCase();
  const name = session.user.name || session.user.email || "User";
  const initial = name.trim().charAt(0).toUpperCase();

  return (
    <div className="nav-user">
      <div className="user-chip">
        <span className={`user-avatar ${role}`} aria-hidden="true">
          {initial}
        </span>
        <span className="user-name">{name}</span>
        <span className={`user-role-badge ${role}`}>{role}</span>
      </div>
      <button
        type="button"
        className="btn-logout"
        onClick={() => signOut({ callbackUrl: "/login" })}
        title="Log out"
      >
        Log out
      </button>
    </div>
  );
}
