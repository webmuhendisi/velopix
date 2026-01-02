import { useEffect, useRef } from "react";
import { useLocation } from "wouter";

// Generate or retrieve session ID
function getSessionId(): string {
  const storageKey = "analytics_session_id";
  const sessionExpiry = 30 * 60 * 1000; // 30 minutes
  
  let sessionId = sessionStorage.getItem(storageKey);
  const sessionTimestamp = sessionStorage.getItem(`${storageKey}_timestamp`);
  
  if (!sessionId || !sessionTimestamp) {
    // Generate new session ID
    sessionId = `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
    sessionStorage.setItem(storageKey, sessionId);
    sessionStorage.setItem(`${storageKey}_timestamp`, Date.now().toString());
  } else {
    // Check if session expired
    const timestamp = parseInt(sessionTimestamp, 10);
    if (Date.now() - timestamp > sessionExpiry) {
      // Generate new session ID
      sessionId = `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
      sessionStorage.setItem(storageKey, sessionId);
      sessionStorage.setItem(`${storageKey}_timestamp`, Date.now().toString());
    }
  }
  
  return sessionId;
}

export default function PageViewTracker() {
  const [location] = useLocation();
  const previousPathRef = useRef<string>("");

  useEffect(() => {
    // Skip tracking for admin pages
    if (location.startsWith("/admin")) {
      return;
    }

    // Skip if it's the same path (e.g., hash changes)
    if (location === previousPathRef.current) {
      return;
    }

    previousPathRef.current = location;

    // Track page view
    const trackPageView = async () => {
      try {
        const sessionId = getSessionId();
        const referrer = document.referrer || null;
        const userAgent = navigator.userAgent;

        await fetch("/api/analytics/pageview", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            path: location,
            referrer,
            userAgent,
            sessionId,
          }),
        });
      } catch (error) {
        // Silently fail - analytics shouldn't break the app
        console.debug("Failed to track page view:", error);
      }
    };

    // Small delay to ensure page is loaded
    const timeoutId = setTimeout(trackPageView, 100);

    return () => {
      clearTimeout(timeoutId);
    };
  }, [location]);

  return null;
}

