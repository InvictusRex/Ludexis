"use client";

import { useEffect, useRef, useState } from "react";
import { TriangleAlert } from "lucide-react";
import { metadataApi } from "@/lib/api";
import type { ProviderNotice } from "@/lib/types";
import { toast } from "@/lib/toast";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const POLL_MS = 60000;
const CHANGED = "ludexis:notices-changed";

/** Ask the indicator to look for notices now, e.g. right after a metadata search. */
export function announceNoticesChanged() {
  window.dispatchEvent(new Event(CHANGED));
}

function until(notice: ProviderNotice): string {
  if (!notice.expires_at) return "";
  return ` Until ${new Date(notice.expires_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}.`;
}

/** Warnings providers raise about themselves; each new one is also shown once as a toast. Hidden when there are none. */
export function ProviderNotices() {
  const [notices, setNotices] = useState<ProviderNotice[]>([]);
  const shown = useRef(new Set<string>());

  useEffect(() => {
    let stopped = false;

    const check = async () => {
      try {
        const current = await metadataApi.notices();
        if (stopped) return;
        setNotices(current);
        const keys = new Set(current.map((notice) => `${notice.provider}:${notice.message}`));
        for (const notice of current) {
          if (!shown.current.has(`${notice.provider}:${notice.message}`)) toast.warning(`${notice.provider}: ${notice.message}`);
        }
        // Forgetting lapsed notices lets one that comes back be toasted again.
        shown.current = keys;
      } catch {
        // A failed poll leaves the last known state; the next one tries again.
      }
    };

    check();
    const timer = setInterval(check, POLL_MS);
    window.addEventListener(CHANGED, check);
    return () => {
      stopped = true;
      clearInterval(timer);
      window.removeEventListener(CHANGED, check);
    };
  }, []);

  if (notices.length === 0) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label={`${notices.length} provider warning${notices.length === 1 ? "" : "s"}`}
        className="relative grid size-9 place-items-center rounded-full text-spark outline-none hover:bg-stone focus-visible:ring-2 focus-visible:ring-violet-lit"
      >
        <TriangleAlert className="size-[18px]" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 p-2">
        <p className="px-2 pb-2 pt-1 text-sm font-semibold text-parchment">Metadata providers</p>
        {notices.map((notice) => (
          <div key={notice.provider} className="rounded-md px-2 py-2 text-sm">
            <p className="text-parchment">{notice.provider}</p>
            <p className="text-ash">
              {notice.message}
              {until(notice)}
            </p>
          </div>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
