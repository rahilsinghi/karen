"use client";

import { useCallback, useEffect, useRef } from "react";
import { API_URL } from "@/lib/constants";

/**
 * Background music with progressive Web Audio distortion effects.
 * Music starts clean (levels 1-2) and becomes increasingly distorted
 * through level 10 (full chaos).
 *
 * Effect chain: source → filter → waveshaper → gain → destination
 */
export function useBackgroundMusic() {
  const ctxRef = useRef<AudioContext | null>(null);
  const sourceRef = useRef<AudioBufferSourceNode | null>(null);
  const bufferRef = useRef<AudioBuffer | null>(null);
  const filterRef = useRef<BiquadFilterNode | null>(null);
  const distortionRef = useRef<WaveShaperNode | null>(null);
  const gainRef = useRef<GainNode | null>(null);
  const lfoRef = useRef<OscillatorNode | null>(null);
  const lfoGainRef = useRef<GainNode | null>(null);
  const playingRef = useRef(false);
  const levelRef = useRef(0);
  const normalVolumeRef = useRef(0.3);

  // Generate distortion curve
  const makeDistortionCurve = useCallback((amount: number): Float32Array<ArrayBuffer> => {
    const samples = 44100;
    const curve = new Float32Array(samples) as Float32Array<ArrayBuffer>;
    for (let i = 0; i < samples; i++) {
      const x = (i * 2) / samples - 1;
      curve[i] = ((3 + amount) * x * 20 * (Math.PI / 180)) /
        (Math.PI / 2 + amount * Math.abs(x));
    }
    return curve;
  }, []);

  // Fetch and decode the music file
  const loadMusic = useCallback(async () => {
    if (bufferRef.current) return; // Already loaded

    try {
      const ctx = new AudioContext();
      ctxRef.current = ctx;

      const response = await fetch(`${API_URL}/api/audio/music/hold-music.mp3`);
      if (!response.ok) return;

      const arrayBuffer = await response.arrayBuffer();
      bufferRef.current = await ctx.decodeAudioData(arrayBuffer);
    } catch {
      // Music is optional — don't break anything
    }
  }, []);

  const start = useCallback(async () => {
    if (playingRef.current) return;

    await loadMusic();

    const ctx = ctxRef.current;
    const buffer = bufferRef.current;
    if (!ctx || !buffer) return;

    if (ctx.state === "suspended") {
      await ctx.resume();
    }

    // Create nodes
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.loop = true;

    const filter = ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = 20000; // Start fully open
    filter.Q.value = 1;

    const distortion = ctx.createWaveShaper();
    distortion.curve = makeDistortionCurve(0);
    distortion.oversample = "4x";

    const gain = ctx.createGain();
    gain.gain.value = normalVolumeRef.current;

    // LFO for pitch warble (starts disconnected)
    const lfo = ctx.createOscillator();
    const lfoGain = ctx.createGain();
    lfo.frequency.value = 0;
    lfoGain.gain.value = 0;
    lfo.connect(lfoGain);
    lfoGain.connect(source.detune);
    lfo.start();

    // Chain: source → filter → distortion → gain → destination
    source.connect(filter);
    filter.connect(distortion);
    distortion.connect(gain);
    gain.connect(ctx.destination);

    source.start();

    sourceRef.current = source;
    filterRef.current = filter;
    distortionRef.current = distortion;
    gainRef.current = gain;
    lfoRef.current = lfo;
    lfoGainRef.current = lfoGain;
    playingRef.current = true;
  }, [loadMusic, makeDistortionCurve]);

  const stop = useCallback(() => {
    try {
      sourceRef.current?.stop();
      lfoRef.current?.stop();
    } catch {
      // Already stopped
    }
    playingRef.current = false;
    sourceRef.current = null;
  }, []);

  // Duck volume when Karen speaks
  const duck = useCallback(() => {
    if (!gainRef.current || !ctxRef.current) return;
    gainRef.current.gain.linearRampToValueAtTime(
      0.06, // ~20% of normal
      ctxRef.current.currentTime + 0.3
    );
  }, []);

  // Restore volume after Karen finishes speaking
  const unduck = useCallback(() => {
    if (!gainRef.current || !ctxRef.current) return;
    gainRef.current.gain.linearRampToValueAtTime(
      normalVolumeRef.current,
      ctxRef.current.currentTime + 0.5
    );
  }, []);

  // Apply effects based on escalation level
  const setLevel = useCallback(
    (level: number) => {
      levelRef.current = level;
      const filter = filterRef.current;
      const distortion = distortionRef.current;
      const lfo = lfoRef.current;
      const lfoGain = lfoGainRef.current;
      const source = sourceRef.current;
      if (!filter || !distortion || !lfo || !lfoGain) return;

      if (level <= 2) {
        // Clean
        filter.frequency.value = 20000;
        distortion.curve = makeDistortionCurve(0);
        lfo.frequency.value = 0;
        lfoGain.gain.value = 0;
        if (source) source.playbackRate.value = 1.0;
      } else if (level <= 4) {
        // Slight filter + pitch drop
        filter.frequency.value = 8000;
        distortion.curve = makeDistortionCurve(2);
        lfo.frequency.value = 0;
        lfoGain.gain.value = 0;
        if (source) source.playbackRate.value = 0.97;
      } else if (level <= 6) {
        // More aggressive
        filter.frequency.value = 4000;
        distortion.curve = makeDistortionCurve(10);
        lfo.frequency.value = 0.5;
        lfoGain.gain.value = 20;
        if (source) source.playbackRate.value = 0.95;
      } else if (level <= 8) {
        // Heavy distortion + warble
        filter.frequency.value = 2500;
        distortion.curve = makeDistortionCurve(30);
        lfo.frequency.value = 2;
        lfoGain.gain.value = 50;
        if (source) source.playbackRate.value = 0.92;
      } else if (level === 9) {
        // All effects cranked
        filter.frequency.value = 1500;
        distortion.curve = makeDistortionCurve(60);
        lfo.frequency.value = 4;
        lfoGain.gain.value = 100;
        if (source) source.playbackRate.value = 0.88;
      } else {
        // Level 10: full chaos
        filter.frequency.value = 800;
        distortion.curve = makeDistortionCurve(100);
        lfo.frequency.value = 8;
        lfoGain.gain.value = 200;
        if (source) source.playbackRate.value = 0.85;
      }
    },
    [makeDistortionCurve]
  );

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stop();
      ctxRef.current?.close();
      ctxRef.current = null;
    };
  }, [stop]);

  return { start, stop, duck, unduck, setLevel };
}
