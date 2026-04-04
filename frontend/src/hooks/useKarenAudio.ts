"use client";

import { useCallback, useEffect, useRef } from "react";
import { API_URL } from "@/lib/constants";
import type { KarenEvent } from "@/lib/types";

interface UseKarenAudioOptions {
  onPlayStart?: () => void;
  onPlayEnd?: () => void;
}

export function useKarenAudio(events: KarenEvent[], options: UseKarenAudioOptions = {}) {
  const { onPlayStart, onPlayEnd } = options;
  const queueRef = useRef<string[]>([]);
  const playingRef = useRef(false);
  const lastProcessedRef = useRef(0);

  const playNext = useCallback(
    function playNextInner() {
      if (playingRef.current || queueRef.current.length === 0) return;

      const url = queueRef.current.shift();
      if (!url) return;

      playingRef.current = true;
      onPlayStart?.();

      const audio = new Audio(`${API_URL}${url}`);
      audio.volume = 0.9;

      const finish = () => {
        playingRef.current = false;
        onPlayEnd?.();
        playNextInner();
      };

      audio.onended = finish;
      audio.onerror = finish;
      audio.play().catch(finish);
    },
    [onPlayEnd, onPlayStart]
  );

  useEffect(() => {
    if (events.length <= lastProcessedRef.current) return;

    const newEvents = events.slice(lastProcessedRef.current);
    lastProcessedRef.current = events.length;

    for (const event of newEvents) {
      if (event.type === "audio" && event.audio_url) {
        queueRef.current.push(event.audio_url);
      }
    }

    playNext();
  }, [events, playNext]);

  useEffect(() => {
    return () => {
      queueRef.current = [];
      playingRef.current = false;
    };
  }, []);
}
