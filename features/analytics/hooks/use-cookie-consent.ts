"use client";

import { useState, useEffect, useCallback, useSyncExternalStore } from "react";
import {
  COOKIE_CONSENT_CHANGE_EVENT,
  OPEN_COOKIE_PREFERENCES_EVENT,
} from "../constants";
import { getStoredConsent, setStoredConsent } from "../utils/consent";
import type { CookieConsentChoice } from "../types";

function subscribeConsent(callback: () => void) {
  if (typeof window === "undefined") return () => {};
  window.addEventListener(COOKIE_CONSENT_CHANGE_EVENT, callback);
  window.addEventListener("storage", callback);
  return () => {
    window.removeEventListener(COOKIE_CONSENT_CHANGE_EVENT, callback);
    window.removeEventListener("storage", callback);
  };
}

function getConsentSnapshot(): CookieConsentChoice {
  return getStoredConsent();
}

function getServerConsentSnapshot(): CookieConsentChoice {
  return null;
}

const emptySubscribe = () => () => {};

export function useCookieConsent() {
  const isHydrated = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );

  const consent = useSyncExternalStore(
    subscribeConsent,
    getConsentSnapshot,
    getServerConsentSnapshot
  );

  // Manual open state for reviewing/modifying preferences
  const [isPreferencesOpen, setIsPreferencesOpen] = useState(false);

  useEffect(() => {
    const handleOpenPreferences = () => {
      setIsPreferencesOpen(true);
    };
    window.addEventListener(OPEN_COOKIE_PREFERENCES_EVENT, handleOpenPreferences);
    return () => {
      window.removeEventListener(OPEN_COOKIE_PREFERENCES_EVENT, handleOpenPreferences);
    };
  }, []);

  const saveConsent = useCallback((choice: "all" | "essential") => {
    setStoredConsent(choice);
    setIsPreferencesOpen(false);
  }, []);

  const openPreferences = useCallback(() => {
    setIsPreferencesOpen(true);
  }, []);

  const closePreferences = useCallback(() => {
    if (consent !== null) {
      setIsPreferencesOpen(false);
    }
  }, [consent]);

  // The banner displays when user hasn't made a choice (consent === null) OR when opened via preferences
  const isOpen = isHydrated && (consent === null || isPreferencesOpen);

  return {
    consent,
    hasResponded: consent !== null,
    isMounted: isHydrated,
    isOpen,
    saveConsent,
    openPreferences,
    closePreferences,
  };
}
