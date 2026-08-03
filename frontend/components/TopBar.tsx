"use client";

import { useRouter } from "next/navigation";
import { logout } from "@/lib/session";

export default function TopBar() {
  const router = useRouter();

  function handleLogout() {
    logout();
    router.push("/login");
  }

  return (
    <div className="topbar">
      <div className="brand" onClick={() => router.push("/calendar")} style={{ cursor: "pointer" }}>
        Agentic <span>Content Creator</span>
      </div>
      <button className="btn" onClick={handleLogout} aria-label="Log out">
        Log out
      </button>
    </div>
  );
}
