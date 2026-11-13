"use client";

import { useEffect, useRef, useState } from "react";
import { getLS } from "@/lib/storage";

const AUDIO_MUTED_KEY = "levelup_audio_muted";

export function AudioPlayer() {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    function startAudio() {
      if (getLS().getItem(AUDIO_MUTED_KEY) === "1") {
        document.removeEventListener("click", startAudio);
        return;
      }
      const aud = audioRef.current;
      if (!aud) return;
      aud.volume = 0.35;
      aud
        .play()
        .then(() => setPlaying(true))
        .catch(() => {});
      document.removeEventListener("click", startAudio);
    }
    document.addEventListener("click", startAudio, { once: true });
    return () => document.removeEventListener("click", startAudio);
  }, []);

  function toggleAudio() {
    const aud = audioRef.current;
    if (!aud) return;
    if (playing) {
      aud.pause();
      getLS().setItem(AUDIO_MUTED_KEY, "1");
    } else {
      aud.play().catch(() => {});
      getLS().setItem(AUDIO_MUTED_KEY, "0");
    }
    setPlaying(!playing);
  }

  return (
    <>
      <audio ref={audioRef} loop preload="auto" src="/assets/theme.mp3" />
      <div className={`audio-ctrl${playing ? "" : " muted"}`} onClick={toggleAudio}>
        <span className="a-dot"></span>
        <span>{playing ? "SILENCIAR" : "LET'S ROLL"}</span>
      </div>
    </>
  );
}
