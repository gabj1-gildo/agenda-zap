"use client";

import { useEffect, useState } from "react";

export function Countdown({ expiresAt }: { expiresAt: string }) {
  const [timeLeft, setTimeLeft] = useState("");
  const [expired, setExpired] = useState(false);

  useEffect(() => {
    const targetDate = new Date(expiresAt).getTime();

    const interval = setInterval(() => {
      const now = new Date().getTime();
      const distance = targetDate - now;

      if (distance <= 0) {
        clearInterval(interval);
        setExpired(true);
        setTimeLeft("Expirado");
      } else {
        const h = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const m = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
        const s = Math.floor((distance % (1000 * 60)) / 1000);
        
        const parts = [];
        if (h > 0) parts.push(`${h}h`);
        if (m > 0 || h > 0) parts.push(`${m}m`);
        parts.push(`${s}s`);
        
        setTimeLeft(parts.join(' '));
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [expiresAt]);

  if (expired) {
    return <span className="text-red-500 font-medium text-xs">Expirado</span>;
  }

  return <span className="text-amber-600 font-medium text-xs font-mono">{timeLeft}</span>;
}
