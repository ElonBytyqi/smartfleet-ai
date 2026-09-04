"use client";

import { useSyncExternalStore } from "react";

const emptySubscribe = () => () => {};

/** Lexon rolet e userit nga localStorage, i sigurt për SSR. */
export function useRoles(): string[] {
  const raw = useSyncExternalStore(
    emptySubscribe,
    () => localStorage.getItem("userRoles"),
    () => null
  );

  if (!raw) return [];

  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

/** A ka useri të paktën një nga rolet e kërkuara. */
export function hasAnyRole(userRoles: string[], required: string[]): boolean {
  if (required.length === 0) return true;   // pa kufizim
  return required.some((r) => userRoles.includes(r));
}