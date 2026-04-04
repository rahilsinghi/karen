"use client";

import { useCallback, useEffect, useRef } from "react";
import { API_URL, API_HEADERS } from "@/lib/constants";
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
  const playedUrlsRef = useRef<Set<string>>(new Set());
  const activeAudioRef = useRef<HTMLAudioElement | null>(null);

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

      const finish = () => {
        playingRef.current = false;
        onPlayEndRef.current?.();
        // Use a timeout to ensure state updates have settled if needed, 
        // though here it's mainly for a tiny gap between quips
        setTimeout(() => {
          playNext();
        }, 100);
      };

      fetch(`${API_URL}${url}`, { headers: API_HEADERS })
        .then((r) => r.blob())
        .then((blob) => {
          const audio = new Audio(URL.createObjectURL(blob));
          activeAudioRef.current = audio;
          audio.volume = 0.9;
          audio.onended = () => { activeAudioRef.current = null; finish(); };
          audio.onerror = () => { activeAudioRef.current = null; finish(); };
          audio.play().catch(() => { activeAudioRef.current = null; finish(); });
        })
        .catch(finish);
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
        // Deduplicate — never play the same URL twice in one escalation
        if (!playedUrlsRef.current.has(event.audio_url)) {
          playedUrlsRef.current.add(event.audio_url);
          queueRef.current.push(event.audio_url);
          added = true;
        }
      }
    }

    if (added) {
      playNext();
    }
  }, [events, playNext, enabled]);

  useEffect(() => {
    return () => {
      // Stop any actively playing audio on unmount
      if (activeAudioRef.current) {
        activeAudioRef.current.pause();
        activeAudioRef.current.src = "";
        activeAudioRef.current = null;
      }
      queueRef.current = [];
      playingRef.current = false;
      playedUrlsRef.current.clear();
    };
  }, []);
}
