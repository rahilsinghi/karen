"use client";

import { useCallback, useEffect, useRef } from "react";
import { API_URL } from "@/lib/constants";
import type { KarenEvent } from "@/lib/types";

interface UseKarenAudioOptions {
  /** Called when a voice clip starts playing */
  onPlayStart?: () => void;
  /** Called when a voice clip finishes playing */
  onPlayEnd?: () => void;
}

/**
 * Manages Karen's voice audio playback — quips and commentary.
 * Queues clips so they play sequentially (quip first, then commentary).
 * Emits play start/end callbacks for music ducking.
 */
export function useKarenAudio(
  events: KarenEvent[],
  options: UseKarenAudioOptions = {}
) {
  const { onPlayStart, onPlayEnd } = options;
  const queueRef = useRef<string[]>([]);
  const playingRef = useRef(false);
  const lastProcessedRef = useRef(0);
  const onPlayStartRef = useRef(onPlayStart);
  const onPlayEndRef = useRef(onPlayEnd);

  // Keep callback refs current
  onPlayStartRef.current = onPlayStart;
  onPlayEndRef.current = onPlayEnd;

  const playNext = useCallback(() => {
    if (playingRef.current || queueRef.current.length === 0) return;

    const url = queueRef.current.shift()!;
    playingRef.current = true;
    onPlayStartRef.current?.();

    const audio = new Audio(`${API_URL}${url}`);
    audio.volume = 0.9;

    audio.onended = () => {
      playingRef.current = false;
      onPlayEndRef.current?.();
      // Play next in queue if any
      playNext();
    };

    audio.onerror = () => {
      playingRef.current = false;
      onPlayEndRef.current?.();
      // Skip failed audio, try next
      playNext();
    };

    audio.play().catch(() => {
      playingRef.current = false;
      onPlayEndRef.current?.();
      playNext();
    });
  }, []);

  // Process new audio events
  useEffect(() => {
    if (events.length <= lastProcessedRef.current) return;

    const newEvents = events.slice(lastProcessedRef.current);
    lastProcessedRef.current = events.length;

    for (const event of newEvents) {
      if (event.type === "audio" && event.audio_url) {
        queueRef.current.push(event.audio_url);
      }
    }

    // Try to start playback
    playNext();
  }, [events, playNext]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      queueRef.current = [];
      playingRef.current = false;
    };
  }, []);
}
