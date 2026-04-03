// src/utils/wake.js
import { Audio } from "expo-av";
import * as FileSystem from "expo-file-system";

const WAKE_URL = "http://192.168.1.33:5001/wake";

let LOOP_ACTIVE = false;
let retryBoost = 0;

export async function startWakeLoop(callback) {
  if (LOOP_ACTIVE) return;
  LOOP_ACTIVE = true;

  const { granted } = await Audio.requestPermissionsAsync();
  if (!granted) {
    console.warn("Microphone permission denied");
    LOOP_ACTIVE = false;
    return;
  }

  while (LOOP_ACTIVE) {
    try {
      const rec = new Audio.Recording();

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
        staysActiveInBackground: true,
        shouldDuckAndroid: true,
      });

      await rec.prepareToRecordAsync({
        android: {
          extension: ".wav",
          outputFormat: Audio.AndroidOutputFormat.DEFAULT,
          audioEncoder: Audio.AndroidAudioEncoder.DEFAULT,
          sampleRate: 16000,
          numberOfChannels: 1,
        },
        ios: {
          extension: ".wav",
          sampleRate: 16000,
          numberOfChannels: 1,
          audioQuality: Audio.IOSAudioQuality.MAX,
        },
      });

      await rec.startAsync();

      const chunkDuration = retryBoost > 1 ? 1400 : 1000;
      await wait(chunkDuration);

      await rec.stopAndUnloadAsync().catch(() => {});
      const uri = rec.getURI();

      if (!uri) {
        retryBoost++;
        await wait(120);
        continue;
      }

      const form = new FormData();
      form.append("audio", {
        uri,
        name: "wake.wav",
        type: "audio/wav",
      });

      let res = null;
      try {
        res = await fetch(WAKE_URL, { method: "POST", body: form });
      } catch (err) {
        console.log("API error", err);
      }

      await FileSystem.deleteAsync(uri, { idempotent: true }).catch(() => {});

      if (res?.ok) {
        const json = await res.json();
        const text = (json?.text || "").trim();

        if (text) {
          retryBoost = 0;
          callback(text);
        } else {
          retryBoost++;
        }
      } else {
        retryBoost++;
      }

      await wait(120);
    } catch (err) {
      console.log("Wake loop error:", err);
      await wait(160);
    }
  }
}

export function stopWakeLoop() {
  LOOP_ACTIVE = false;
}

const wait = (ms) => new Promise((res) => setTimeout(res, ms));
