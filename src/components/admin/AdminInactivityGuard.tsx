'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { INACTIVITY_TIMEOUT_MS } from '@/lib/auth/admin-constants';

interface AdminInactivityGuardProps {
  children: React.ReactNode;
}

export function AdminInactivityGuard({ children }: AdminInactivityGuardProps) {
  const router = useRouter();
  const pathname = usePathname();
  const lastActivityRef = useRef<number>(Date.now());
  const [showWarning, setShowWarning] = useState(false);
  const [remainingSeconds, setRemainingSeconds] = useState(60);

  useEffect(() => {
    // Skip guard on login and public request-access pages
    if (pathname === '/admin/login' || pathname === '/admin/request-access') {
      return;
    }

    const resetActivity = () => {
      lastActivityRef.current = Date.now();
      if (showWarning) {
        setShowWarning(false);
      }
    };

    // User interaction events
    const events = ['mousedown', 'keydown', 'scroll', 'touchstart', 'click'];
    events.forEach((ev) => window.addEventListener(ev, resetActivity, { passive: true }));

    // Heartbeat every 3 minutes to keep server-side sliding session fresh while user is active
    const heartbeatInterval = setInterval(async () => {
      const idleTime = Date.now() - lastActivityRef.current;
      if (idleTime < INACTIVITY_TIMEOUT_MS) {
        try {
          await fetch('/api/admin/auth/session');
        } catch {
          // ignore network glitch
        }
      }
    }, 3 * 60 * 1000);

    // Inactivity checker every 5 seconds
    const checkInterval = setInterval(async () => {
      const idleTime = Date.now() - lastActivityRef.current;
      const timeLeft = INACTIVITY_TIMEOUT_MS - idleTime;

      // Show warning in the last 60 seconds
      if (timeLeft > 0 && timeLeft <= 60 * 1000) {
        setShowWarning(true);
        setRemainingSeconds(Math.ceil(timeLeft / 1000));
      } else if (timeLeft <= 0) {
        // Exceeded 15 minutes: Auto Logout
        clearInterval(checkInterval);
        clearInterval(heartbeatInterval);
        try {
          await fetch('/api/admin/auth/logout', { method: 'POST' });
        } catch {
          // ignore
        }
        router.push('/admin/login?reason=inactivity');
      }
    }, 5000);

    return () => {
      events.forEach((ev) => window.removeEventListener(ev, resetActivity));
      clearInterval(heartbeatInterval);
      clearInterval(checkInterval);
    };
  }, [pathname, router, showWarning]);

  return (
    <>
      {showWarning && (
        <div className="fixed bottom-4 right-4 z-50 max-w-sm rounded-xl bg-amber-500 text-slate-950 p-4 shadow-2xl border-2 border-amber-600 animate-bounce">
          <p className="font-bold text-sm">Security Inactivity Warning</p>
          <p className="text-xs mt-1">
            You will be automatically logged out in <strong>{remainingSeconds} seconds</strong> due to inactivity. Move your mouse or click anywhere to stay logged in.
          </p>
        </div>
      )}
      {children}
    </>
  );
}
