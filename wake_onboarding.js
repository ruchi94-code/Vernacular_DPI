// src/utils/wake_onboarding.js
import { Audio } from "expo-av";
import * as FileSystem from "expo-file-system";

const WAKE_URL = "http://192.168.1.33:5001/wake";

let LOOP_ACTIVE = false;
let currentRecording = null;
let loopPromise = null;

export async function startWakeLoopOnboarding(callback) {
  try {
    if (LOOP_ACTIVE) return;
    LOOP_ACTIVE = true;

    const { granted } = await Audio.requestPermissionsAsync();
    if (!granted) {
      console.warn("Microphone permission denied (onboarding)");
      LOOP_ACTIVE = false;
      return;
    }

    if (loopPromise) return;
    loopPromise = runLoop(callback);
  } catch (e) {
    console.warn("startWakeLoopOnboarding error:", e);
  }
}

async function runLoop(callback) {
  while (LOOP_ACTIVE) {
    try {
      const rec = new Audio.Recording();
      currentRecording = rec;

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
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

      await wait(900);

      try {
        await rec.stopAndUnloadAsync();
      } catch {}

      const uri = rec.getURI();
      currentRecording = null;

      if (!uri) {
        await wait(100);
        continue;
      }

      const form = new FormData();
      form.append("audio", {
        uri,
        type: "audio/wav",
        name: "wake.wav",
      });

      let response = null;
      try {
        response = await fetch(WAKE_URL, {
          method: "POST",
          body: form,
        });
      } catch (e) {
        console.warn("Wake fetch error:", e);
      }

      try {
        await FileSystem.deleteAsync(uri, { idempotent: true });
      } catch {}

      if (response?.ok) {
        let json = null;
        try {
          json = await response.json();
        } catch {}
        if (json && typeof callback === "function") {
          try {
            callback(json.text || "");
          } catch (e) {
            console.warn("Callback error:", e);
          }
        }
      }
    } catch (e) {
      console.warn("wake loop error:", e);
      await wait(150);
    }

    await wait(120);
  }

  try {
    if (currentRecording) {
      try {
        await currentRecording.stopAndUnloadAsync();
      } catch {}
      currentRecording = null;
    }
  } catch {}

  loopPromise = null;
}

export function stopWakeLoopOnboarding() {
  try {
    LOOP_ACTIVE = false;

    (async () => {
      if (currentRecording) {
        try {
          await currentRecording.stopAndUnloadAsync();
        } catch {}
        currentRecording = null;
      }
    })();
  } catch (e) {
    console.warn("stopWakeLoopOnboarding error:", e);
  }
}

const wait = (ms) => new Promise((res) => setTimeout(res, ms));
