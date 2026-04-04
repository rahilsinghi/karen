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

  const playNext = useCallback(
    function playNextInner() {
      if (!enabled || playingRef.current || queueRef.current.length === 0) return;

      const url = queueRef.current.shift();
      if (!url) return;

      playingRef.current = true;
      onPlayStart?.();

      const finish = () => {
        playingRef.current = false;
        onPlayEnd?.();
        playNextInner();
      };

      fetch(`${API_URL}${url}`, { headers: API_HEADERS })
        .then((r) => r.blob())
        .then((blob) => {
          const audio = new Audio(URL.createObjectURL(blob));
          audio.volume = 0.9;
          audio.onended = finish;
          audio.onerror = finish;
          audio.play().catch(finish);
        })
        .catch(finish);
    },
    [onPlayEnd, onPlayStart, enabled]
  );

  useEffect(() => {
    if (!enabled || events.length <= lastProcessedRef.current) return;

    const newEvents = events.slice(lastProcessedRef.current);
    lastProcessedRef.current = events.length;

    for (const event of newEvents) {
      if (event.type === "audio" && event.audio_url) {
        queueRef.current.push(event.audio_url);
      }
    }

    playNext();
  }, [events, playNext, enabled]);

  useEffect(() => {
    return () => {
      queueRef.current = [];
      playingRef.current = false;
    };
  }, []);
}
