"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { archiveApi } from "@/lib/api";

const CHANGED = "ludexis:review-changed";

/** Ask every review badge to count again, e.g. after a game was identified or marked resolved. */
export function announceReviewChanged() {
  window.dispatchEvent(new Event(CHANGED));
}

/** Games a scan could not fully identify that no one has marked resolved yet. */
export async function loadReviewCount(): Promise<number> {
  const pages = await Promise.all(
    (["UNMATCHED", "PARTIAL"] as const).map((status) =>
      archiveApi.browse({ metadata_status: status, review_resolved: false, limit: 1 }),
    ),
  );
  return pages.reduce((sum, page) => sum + page.total, 0);
}

/** The review queue's open count, refreshed on navigation and on announceReviewChanged; 0 when disabled. */
export function useReviewCount(enabled: boolean): number {
  const pathname = usePathname();
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!enabled) return;
    let current = true;
    const load = () => loadReviewCount().then((total) => current && setCount(total), () => undefined);
    load();
    window.addEventListener(CHANGED, load);
    return () => {
      current = false;
      window.removeEventListener(CHANGED, load);
    };
  }, [enabled, pathname]);

  return enabled ? count : 0;
}
