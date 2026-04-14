"use client";

import { useEffect } from "react";

export function TimezoneSync() {
  useEffect(() => {
    const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    document.cookie = `dayly_tz=${timeZone}; path=/; max-age=31536000; samesite=lax`;
  }, []);

  return null;
}
