import { useCallback, useEffect, useMemo, useState } from "react";
import { useGameManager } from "..";
import { InputManager } from "../Engine/InputManager";
import { Monomitter, Subscription } from "./Monomitter";
import { ActorData, ActorProps } from "../Engine/Actor";
import { Position } from "./types";
import {
  CircleTriggerData,
  SolidData,
  TriggerData,
} from "../Engine/CollisionManager";
import { FragmentKey, FragmentStatus } from "../Data/FragmentData";

type Extractor = (
  iM: InputManager
) => (key: string, cb: (k: string) => void) => Subscription;
const exKeyDown: Extractor = (iM: InputManager) => iM.bindKeyDown;
const exKeyUp: Extractor = (iM: InputManager) => iM.bindKeyUp;

function useKey(extract: Extractor, key: string, cb: (k: string) => void) {
  const gM = useGameManager();
  useEffect(
    () => extract(gM.inputManager)(key, cb).unsubscribe,
    [key, cb, gM, extract]
  );
}

export function useKeyDown(key: string, cb: (k: string) => void) {
  useKey(exKeyDown, key, cb);
}
export function useKeyUp(key: string, cb: (k: string) => void) {
  useKey(exKeyUp, key, cb);
}

export function useManyKeys(
  extract: Extractor,
  keys: string[],
  cb: (k: string) => void
) {
  const gM = useGameManager();
  useEffect(() => {
    const subscriptions: Subscription[] = [];
    for (const key of keys)
      subscriptions.push(extract(gM.inputManager)(key, cb));

    return () => {
      for (const sub of subscriptions) sub.unsubscribe();
    };
  }, [keys, cb, gM, extract]);
}

export function useManyKeysDown(keys: string[], cb: (k: string) => void) {
  useManyKeys(exKeyDown, keys, cb);
}
export function useManyKeysUp(keys: string[], cb: (k: string) => void) {
  useManyKeys(exKeyUp, keys, cb);
}

// bind a callback to frames
export function useFrame(cb?: (fc: number, lifetime?: number) => void) {
  const gM = useGameManager();

  useEffect(() => {
    if (!cb) return;

    let lifetime = 0;
    const sub = gM.frame$.subscribe((fc: number) => {
      cb(fc, lifetime++);
    });

    return sub.unsubscribe;
  }, [cb, gM]);
}

// register Actor data to a component
export function useActor(pos: Position, props: ActorProps): ActorData {
  const gM = useGameManager();
  const [motion] = useState<ActorData>(new ActorData(gM, pos, props));
  return motion;
}

// trim leading and trailing newlines - so that we can use string literals ``
export function useLines(text: string): string[] {
  const cleaned = useMemo(() => {
    let str = text;
    if (str.charAt(0) === "\n") str = str.substring(1, str.length);
    if (str.charAt(str.length - 1) === "\n")
      str = str.substring(0, str.length - 1);
    return str;
  }, [text]);

  const lines = useMemo(() => cleaned.split("\n"), [cleaned]);
  return lines;
}

// return the center of the map
export function useCenter(): Position {
  const gM = useGameManager();
  const center = useMemo(() => gM.viewportManager.getCenter(), [gM]);
  return center;
}

// log a value
export function useLog<T>(val: T) {
  useEffect(() => {
    console.log(val);
  }, [val]);
}

// emitter and value management
export function useUpdatedValue<T>(
  getter: () => T,
  update$: Monomitter<void>
): T {
  const [val, setVal] = useState<T>(getter());

  useEffect(() => {
    const sub = update$.subscribe(() => {
      setVal(getter());
    });

    return sub.unsubscribe;
  }, [setVal, getter, update$]);

  return val;
}

export function useEmittedValue<T>(val$: Monomitter<T>, def: T): T {
  const [val, setVal] = useState<T>(def);
  useEffect(() => {
    const sub = val$.subscribe((v: T) => setVal(v));

    return sub.unsubscribe;
  }, [val$, def]);

  return val;
}

export function useSpaceshipPos(): Position | undefined {
  const gM = useGameManager();
  const pos = useEmittedValue<Position | undefined>(
    gM.spaceshipPos$,
    undefined
  );
  return pos;
}

// returns [status, solve()]
export function usePuzzleStatus(
  fkey: FragmentKey
): [FragmentStatus, () => void] {
  const { dataManager: dM, audioManager: aM } = useGameManager();

  const audioLoaded = useAudioLoaded();

  const status = useUpdatedValue(
    () => dM.getFragmentStatus(fkey),
    dM.dataUpdated$
  );

  const setStatus = useCallback(() => dM.solvePuzzle(fkey), [dM, fkey]);
  const solve = useCallback(() => {
    aM.playSolve();
    if (audioLoaded) setStatus();
  }, [audioLoaded, aM, setStatus]);

  return [status, solve];
}

export function useAudioLoaded(): boolean {
  const { audioManager: aM } = useGameManager();
  const loaded = useUpdatedValue(() => aM.isLoaded(), aM.update$);

  return loaded;
}

/* Triggers and solids */
export function useSolid(data: SolidData | undefined): void {
  const gM = useGameManager();

  useEffect(() => {
    if (!data) return;
    return gM.collisionManager.registerSolid(data);
  }, [gM, data]);
}

export function useTrigger(data: TriggerData | undefined): void {
  const gM = useGameManager();

  useEffect(() => {
    if (!data) return;
    return gM.collisionManager.registerTrigger(data);
  }, [gM, data]);
}

export function useCircleTrigger(data: CircleTriggerData | undefined): void {
  const gM = useGameManager();

  useEffect(() => {
    if (!data) return;
    return gM.collisionManager.registerCircleTrigger(data);
  }, [gM, data]);
}
