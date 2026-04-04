"use client";

import { useCallback, useEffect, useRef } from "react";
import { API_URL } from "@/lib/constants";
import type { KarenEvent } from "@/lib/types";

interface UseKarenAudioOptions {
  enabled?: boolean;
  onPlayStart?: () => void;
  onPlayEnd?: () => void;
}

export function useKarenAudio(events: KarenEvent[], options: UseKarenAudioOptions = {}) {
  const { enabled = true, onPlayStart, onPlayEnd } = options;
  const queueRef = useRef<string[]>([]);
  const playingRef = useRef(false);
  const lastProcessedRef = useRef(0);

  // Use refs for callbacks to avoid stale closures
  const onPlayStartRef = useRef(onPlayStart);
  const onPlayEndRef = useRef(onPlayEnd);

  useEffect(() => {
    onPlayStartRef.current = onPlayStart;
    onPlayEndRef.current = onPlayEnd;
  }, [onPlayStart, onPlayEnd]);

  const playNext = useCallback(
    () => {
      if (!enabled || playingRef.current || queueRef.current.length === 0) return;

      const url = queueRef.current.shift();
      if (!url) return;

      playingRef.current = true;
      onPlayStartRef.current?.();

      const audio = new Audio(`${API_URL}${url}`);
      audio.volume = 0.9;

      const finish = () => {
        playingRef.current = false;
        onPlayEndRef.current?.();
        // Use a timeout to ensure state updates have settled if needed, 
        // though here it's mainly for a tiny gap between quips
        setTimeout(() => {
          playNext();
        }, 100);
      };

      audio.onended = finish;
      audio.onerror = finish;
      audio.play().catch(finish);
    },
    [enabled] // only depend on enabled
  );

  useEffect(() => {
    if (!enabled) return;

    const count = events.length;
    if (count <= lastProcessedRef.current) return;

    const newEvents = events.slice(lastProcessedRef.current);
    lastProcessedRef.current = count;

    let added = false;
    for (const event of newEvents) {
      if (event.type === "audio" && event.audio_url) {
        queueRef.current.push(event.audio_url);
        added = true;
      }
    }

    if (added) {
      playNext();
    }
  }, [events, playNext, enabled]);

  useEffect(() => {
    return () => {
      queueRef.current = [];
      playingRef.current = false;
    };
  }, []);
}
