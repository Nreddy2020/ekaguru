"use client";
import React from "react";
import styles from "./ApprovedClassroom.module.css";
import type { OrbState } from "../../lib/learning/guru-voice";

/**
 * Guru's presence: a circle that breathes when idle, pulses with each spoken word,
 * ripples outward when listening, and turns slowly while thinking.
 * Purely presentational; the board owns the state.
 */
export function GuruVoiceOrb({
  state,
  pulse,
  reducedMotion = false,
  size = 96,
}: {
  state: OrbState;
  /** Increments on each spoken word so the ring can kick. */
  pulse: number;
  reducedMotion?: boolean;
  size?: number;
}) {
  const label =
    state === "speaking"
      ? "Guru is speaking"
      : state === "listening"
        ? "Guru is listening"
        : state === "thinking"
          ? "Guru is thinking"
          : "Guru is ready";
  return (
    <div
      className={styles.orbWrap}
      data-state={state}
      data-pulse={pulse}
      data-testid="guru-orb"
      role="img"
      aria-label={label}
      style={{ width: size, height: size }}
    >
      <span className={styles.orbRingOuter} />
      <span className={styles.orbRingInner} />
      <span
        className={styles.orbCore}
        style={reducedMotion ? { animation: "none" } : undefined}
        key={state === "speaking" ? pulse : state}
      />
    </div>
  );
}
