import autoBind from "auto-bind";
import { Environment } from "../Utils/colors";
import { monomitter, Monomitter } from "../Utils/Monomitter";
import { GameManager } from "./GameManager";

const baseUrl = "/files/";
const url = (str: string) => baseUrl + str;
const envBgm: Record<Environment, string> = [
  "bgm/FMixo.mp3", // Night
  "bgm/FLyd.mp3", // Day
  "bgm/FPhryg.mp3", // Winter
  "bgm/FAc.mp3", // Spring
  "bgm/FDor.mp3", // Summer
  "bgm/FMaj.mp3", // Autumn
];
const envWin: Record<Environment, string> = [
  "sfx/FMixo.wav", // Night
  "sfx/FLyd.wav", // Day
  "sfx/FPhryg.wav", // Winter
  "sfx/FAc.wav", // Spring
  "sfx/FDor.wav", // Summer
  "sfx/FMaj.wav", // Autumn
];
const fx = ["sfx/Fmaj3.wav", "sfx/Fmin3.wav"];
const envFx: Record<Environment, string> = [
  fx[0], // Night
  fx[0], // Day
  fx[1], // Winter
  fx[0], // Spring
  fx[1], // Summer
  fx[0], // Autumn
];
const rocket = "Rocket.mp3";

const allAudio = [
  ...(envWin as string[]),
  ...(envBgm as string[]),
  ...fx,
  rocket,
];

const maxTime = ((32 * 4) / 75) * 60;

export class AudioManager {
  private gameManager: GameManager;
  private audio: Map<string, HTMLAudioElement>;
  private loaded: Map<string, boolean>;

  public update$: Monomitter<void> = monomitter();

  private currentBgm: HTMLAudioElement | undefined = undefined;
  private env: Environment = Environment.DEFAULT;

  private rocketFrames = 0;

  private didLoad = false;
  private hasStarted = false;

  constructor(gameManager: GameManager) {
    autoBind(this);
    this.gameManager = gameManager;
    this.audio = new Map();
    this.loaded = new Map();

    allAudio.forEach((str) => this.loadAudio(str));

    gameManager.colorManager.colorData$.subscribe((data) => {
      this.updateBgm(data.env);
      if (data.env !== undefined) this.env = data.env;
    });
    gameManager.frame$.subscribe(this.onFrame);
  }

  private loadAudio(name: string): void {
    const audio = new Audio(url(name));
    this.audio.set(name, audio);
    audio.addEventListener("canplaythrough", this.canPlayThrough(name));
  }

  private canPlayThrough(name: string): () => void {
    return () => {
      const loaded = this.loaded;
      const update$ = this.update$;

      if (!loaded.get(name)) {
        console.log("loaded ", name);
        loaded.set(name, true);
        update$.publish();
      }
    };
  }

  public isLoaded(): boolean {
    if (this.didLoad) return true;

    if (
      allAudio
        .map((str) => !!this.loaded.get(str))
        .reduce((prev: boolean, curr: boolean) => prev && curr)
    ) {
      this.didLoad = true;
      console.log("all audio loaded!");
      return true;
    }
    return false;
  }

  // public playAudio(name: string): void {
  //   if (!this.isLoaded()) console.error("audio not loaded!");
  //   if (!allAudio.includes(name)) console.error("audio file does not exist!");
  //   this.audio.get(name).play();
  // }

  public playFx() {
    const fxa = this.audio.get(envFx[this.env]);
    fxa.currentTime = 0;
    fxa.volume = 0.7;
    fxa.play();
  }
  public playSolve() {
    const fxa = this.audio.get(envWin[this.env]);
    fxa.currentTime = 0;
    fxa.volume = 0.7;
    fxa.play();
  }

  // audio management
  private fadeOut(audio: HTMLAudioElement): void {
    // console.log("fading out");
    audio.volume = Math.max(audio.volume - 0.1, 0);
    if (audio.volume !== 0) setTimeout(() => this.fadeOut(audio), 100);
  }
  private fadeIn(audio: HTMLAudioElement): void {
    audio.volume = Math.min(audio.volume + 0.1, 1);
    if (audio.volume !== 1) setTimeout(() => this.fadeIn(audio), 100);
  }

  // bgm stuff
  private onFrame(_fc: number) {
    if (!this.currentBgm) return;
    const rocketAudio = this.audio.get(rocket);

    this.rocketFrames--;
    if (this.rocketFrames <= 0) {
      if (rocketAudio.volume !== 0)
        rocketAudio.volume = Math.max(rocketAudio.volume - 0.1, 0);
    } else {
      if (rocketAudio.volume !== 0.4)
        rocketAudio.volume = Math.min(rocketAudio.volume + 0.1, 0.4);
    }

    if (this.currentBgm.currentTime >= maxTime - 0.1) {
      this.currentBgm.currentTime = 0;
    }
    if (rocketAudio.currentTime >= maxTime - 0.1) {
      rocketAudio.currentTime = 0;
    }
  }
  private updateBgm(env: Environment | undefined): void {
    if (env === undefined || !this.isLoaded() || !this.hasStarted) return;
    this.audio.get(rocket).play();

    const bgmName = envBgm[env];
    const bgm = this.audio.get(bgmName);
    const lastBgm = this.currentBgm;

    // crossfade
    if (lastBgm) {
      this.fadeOut(lastBgm);
      setTimeout(() => this.fadeIn(bgm), 2000);
    }

    this.currentBgm = bgm;

    if (lastBgm) {
      bgm.currentTime = lastBgm.currentTime;
    }
    bgm.play();
  }
  public startBgm(): void {
    this.hasStarted = true;
    console.log("start bgm!");
    const bgm = this.audio.get(envBgm[0]);
    bgm.play();
    this.currentBgm = bgm;

    this.audio.get(envBgm[1]).volume = 0;
    this.audio.get(envBgm[2]).volume = 0;
    this.audio.get(envBgm[3]).volume = 0;
    this.audio.get(envBgm[4]).volume = 0;
    this.audio.get(envBgm[5]).volume = 0;

    const rocketAudio = this.audio.get(rocket);
    rocketAudio.play();
  }

  public requestRocket(): void {
    this.rocketFrames = 10;
  }
}
