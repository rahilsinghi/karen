import { useState, useEffect, useRef, useCallback } from "react";
import type { Escalation, KarenEvent } from "@/lib/types";

export type AnimationState = "idle" | "run" | "eat" | "charge" | "attack" | "hit" | "deescalate";

export interface GameEntity {
    id: string;
    x: number; // percentage 0-100
    y: number; // percentage 0-100
    state: AnimationState;
    type: string;
}

export interface Artifact extends GameEntity {
    channel: string;
    consumed: boolean;
    skipped: boolean;
}

export function useArenaGameLoop(events: KarenEvent[], escalation: Escalation | null) {
    const [crab, setCrab] = useState<GameEntity>({
        id: "crab",
        x: 50,
        y: 80,
        state: "idle",
        type: "crab",
    });

    const [target, setTarget] = useState<GameEntity>({
        id: "target",
        x: 50,
        y: 20,
        state: "idle",
        type: "target",
    });

    const [artifacts, setArtifacts] = useState<Artifact[]>([]);
    const [projectiles, setProjectiles] = useState<{ id: string; x: number; y: number; channel: string }[]>([]);
    const processedEvents = useRef(new Set<number>());

    // Movement goals
    const crabGoalRef = useRef<{ x: number; y: number; id?: string } | null>(null);
    const targetRef = useRef(target);
    const activeLevelRef = useRef<{ level: number, channel: string } | null>(null);
    const lastTargetUpdate = useRef(0);

    useEffect(() => {
        targetRef.current = target;
    }, [target]);

    // Handle Active Level Tracking
    useEffect(() => {
        const lastStart = [...events].reverse().find(e => e.type === "level_start");
        const lastComplete = [...events].reverse().find(e => e.type === "level_complete" || e.type === "response_detected" || e.type === "payment_detected");

        if (lastStart && (!lastComplete || events.indexOf(lastStart) > events.indexOf(lastComplete))) {
            activeLevelRef.current = { level: (lastStart as any).level, channel: (lastStart as any).channel };
        } else {
            activeLevelRef.current = null;
        }
    }, [events]);

    // Continuous artifact trail
    useEffect(() => {
        const trailInterval = setInterval(() => {
            if (activeLevelRef.current && escalation?.status === "active") {
                const newArtifact: Artifact = {
                    id: `trail-${Date.now()}`,
                    x: targetRef.current.x,
                    y: targetRef.current.y,
                    state: "idle",
                    type: "artifact",
                    channel: activeLevelRef.current.channel,
                    consumed: false,
                    skipped: false,
                };
                setArtifacts((prev) => {
                    // Keep last 10 artifacts only
                    const next = [...prev, newArtifact];
                    if (next.length > 10) return next.slice(next.length - 10);
                    return next;
                });

                // If crab is just chasing target, redirect it to the new artifact
                if (!crabGoalRef.current) {
                    crabGoalRef.current = { x: newArtifact.x, y: newArtifact.y };
                    setCrab(prev => ({ ...prev, state: "run" }));
                }
            }
        }, 1500);
        return () => clearInterval(trailInterval);
    }, [escalation?.status]);

    // Handle Events
    useEffect(() => {
        events.forEach((event, index) => {
            if (processedEvents.current.has(index)) return;
            processedEvents.current.add(index);

            switch (event.type) {
                case "level_start": {
                    const newArtifact: Artifact = {
                        id: `artifact-${event.level}-${index}`,
                        x: targetRef.current.x,
                        y: targetRef.current.y,
                        state: "idle",
                        type: "artifact",
                        channel: event.channel,
                        consumed: false,
                        skipped: false,
                    };
                    setArtifacts((prev) => [...prev, newArtifact]);
                    // Set crab goal to this artifact
                    crabGoalRef.current = { x: newArtifact.x, y: newArtifact.y };
                    setCrab((prev) => ({ ...prev, state: "run" }));
                    break;
                }
                case "level_complete": {
                    // Trigger attack from crab to target
                    const projectileId = `proj-${index}`;
                    setProjectiles((prev) => [...prev, { id: projectileId, x: crab.x, y: crab.y, channel: event.channel }]);
                    setCrab((prev) => ({ ...prev, state: "attack" }));

                    // Remove projectile after animation
                    setTimeout(() => {
                        setProjectiles((prev) => prev.filter((p) => p.id !== projectileId));
                        setTarget((prev) => ({ ...prev, state: "hit" }));
                        setTimeout(() => setTarget((prev) => ({ ...prev, state: "idle" })), 1000);
                        setCrab((prev) => ({ ...prev, state: "idle" }));
                        crabGoalRef.current = null;
                    }, 800);
                    break;
                }
                case "level_skipped": {
                    // Find the last artifact and mark as skipped
                    setArtifacts((prev) => {
                        const next = [...prev];
                        if (next.length > 0) {
                            next[next.length - 1].skipped = true;
                        }
                        return next;
                    });
                    break;
                }
                case "response_detected":
                    setTarget((prev) => ({ ...prev, state: "idle" })); // Stop target
                    break;
                case "payment_detected":
                    setTarget((prev) => ({ ...prev, state: "deescalate" }));
                    break;
            }
        });
    }, [events, crab.x, crab.y]);

    // Main Loop for movement
    useEffect(() => {
        const interval = setInterval(() => {
            // 1. Determine Crab Goal
            let currentGoal = crabGoalRef.current;

            // If no artifact goal, chase the target!
            if (!currentGoal && escalation?.status === "active") {
                currentGoal = { x: target.x, y: target.y };
            }

            // 2. Crab Movement
            if (currentGoal) {
                setCrab((prev) => {
                    const dx = currentGoal!.x - prev.x;
                    const dy = currentGoal!.y - prev.y;
                    const dist = Math.sqrt(dx * dx + dy * dy);

                    if (dist < 5) {
                        // Reached goal
                        if (prev.state === "run") {
                            // If it was an artifact, "eat" it
                            setArtifacts((as) =>
                                as.map(a => (Math.abs(a.x - prev.x) < 8 && Math.abs(a.y - prev.y) < 8) ? { ...a, consumed: true } : a)
                            );

                            // Find next unconsumed artifact
                            const nextArtifact = artifacts.find(a => !a.consumed && !a.skipped && a.id !== (currentGoal as any)?.id);
                            if (nextArtifact) {
                                crabGoalRef.current = { x: nextArtifact.x, y: nextArtifact.y, id: nextArtifact.id };
                            } else {
                                crabGoalRef.current = null;
                                return { ...prev, state: "idle" };
                            }
                        }
                        return prev;
                    }

                    const speed = crabGoalRef.current ? 3.5 : 1.2; // Significantly faster when hunting artifacts
                    return {
                        ...prev,
                        x: prev.x + (dx / dist) * speed,
                        y: prev.y + (dy / dist) * speed,
                        state: "run",
                    };
                });
            } else {
                setCrab((prev) => {
                    if (prev.state === "attack") return prev;
                    return { ...prev, state: "idle" };
                });
            }

            // 3. Target Movement (Running away from crab)
            setTarget((prev) => {
                if (prev.state === "hit" || prev.state === "deescalate" || escalation?.status !== "active") return prev;

                // Target tries to maintain distance from crab
                const dx = prev.x - crab.x;
                const dy = prev.y - crab.y;
                const dist = Math.sqrt(dx * dx + dy * dy);

                let moveX = (Math.random() - 0.5) * 1.5;
                let moveY = (Math.random() - 0.5) * 1.5;

                // If too close to crab, move away!
                if (dist < 30) {
                    moveX = (dx / dist) * 2;
                    moveY = (dy / dist) * 2;
                }

                let nx = prev.x + moveX;
                let ny = prev.y + moveY;

                // Bounce off walls
                if (nx < 5 || nx > 95) nx = prev.x - moveX;
                if (ny < 5 || ny > 95) ny = prev.y - moveY;

                return { ...prev, x: nx, y: ny, state: "run" };
            });

        }, 32);

        return () => clearInterval(interval);
    }, [escalation?.status, target.state, crab.x, crab.y]);

    return { crab, target, artifacts, projectiles };
}
