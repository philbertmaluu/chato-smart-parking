"use client";

import { useEffect } from "react";

export function HideFallback() {
  useEffect(() => {
    const fallback = document.getElementById('root-fallback');
    if (fallback) {
      fallback.style.display = 'none';
    }
  }, []);

  return null;
}

