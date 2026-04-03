import React, { useState, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  BackHandler,
  Animated,
  Vibration
} from "react-native";
import { Audio } from "expo-av";
import { startWakeLoopOnboarding, stopWakeLoopOnboarding } from "../utils/wake_onboarding";

const AUDIO_STEPS = {
  marathi: [
    {
      audio: require("../../assets/audio/marathi/step1.mp3"),
      text: "पहिलं पाऊल",
      description: "आपला आधार कार्ड तयार ठेवा."
    },
    {
      audio: require("../../assets/audio/marathi/step2.mp3"),
      text: "दुसरं पाऊल",
      description: "मोबाईल क्रमांक भरा."
    },
    {
      audio: require("../../assets/audio/marathi/step3.mp3"),
      text: "तिसरं पाऊल",
      description: "OTP पडताळणी करा."
    }
  ],

  hindi: [
    {
      audio: require("../../assets/audio/hindi/step1.mp3"),
      text: "पहला चरण",
      description: "अपना आधार कार्ड तैयार रखें।"
    },
    {
      audio: require("../../assets/audio/hindi/step2.mp3"),
      text: "दूसरा चरण",
      description: "मोबाइल नंबर दर्ज करें।"
    },
    {
      audio: require("../../assets/audio/hindi/step3.mp3"),
      text: "तीसरा चरण",
      description: "OTP सत्यापन पूरा करें।"
    }
  ],

  english: [
    {
      audio: require("../../assets/audio/english/step1.mp3"),
      text: "Step One",
      description: "Keep your Aadhaar card ready."
    },
    {
      audio: require("../../assets/audio/english/step2.mp3"),
      text: "Step Two",
      description: "Enter your mobile number."
    },
    {
      audio: require("../../assets/audio/english/step3.mp3"),
      text: "Step Three",
      description: "Complete OTP verification."
    }
  ]
};

export default function OnboardingScreen({ route, navigation }) {
  const { language } = route.params;
  const { t, i18n } = useTranslation();

  const steps = AUDIO_STEPS[language];
  const [currentStep, setCurrentStep] = useState(0);

  const [sound, setSound] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const [recognizedText, setRecognizedText] = useState("");
  const [successVisible, setSuccessVisible] = useState(false);

  const waveform = useRef(new Animated.Value(0)).current;
  const beepSound = useRef(null);

  const onboardingListening = useRef(false);
  const firstPlayDone = useRef(false);

  useEffect(() => {
    i18n.changeLanguage(
      language === "hindi" ? "hi" : language === "marathi" ? "mr" : "en"
    );
  }, []);

  const nextKeywords = [
    "haan", "ha", "yes", "ok", "continue", "next", "aage",
    "हाँ", "हा", "आगे", "अगला", "चलो", "ठीक"
  ];

  const prevKeywords = [
    "peeche", "piche", "back", "previous",
    "पीछे", "पिछला", "वापस"
  ];

  useEffect(() => {
    Audio.Sound.createAsync(require("../../assets/beep.mp3")).then(({ sound }) => {
      beepSound.current = sound;
    });
    return () => beepSound.current?.unloadAsync();
  }, []);

  useEffect(() => {
    const backHandler = BackHandler.addEventListener("hardwareBackPress", () => {
      stopEverythingAndGoBack();
      return true;
    });

    if (language === "hindi" && !firstPlayDone.current) {
      firstPlayDone.current = true;
      setTimeout(() => playAudioForStep(0), 150);
    }

    return () => {
      backHandler.remove();
      stopEverything();
    };
  }, []);

const mountStepPlayed = useRef(false);

useEffect(() => {
  if (!firstPlayDone.current || !mountStepPlayed.current) {
    mountStepPlayed.current = true;
    return;
  }

  stopEverything();
  if (language === "hindi") {
    setTimeout(() => playAudioForStep(currentStep), 150);
  }
}, [currentStep]);


  const startWaveform = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(waveform, { toValue: 1, duration: 350, useNativeDriver: false }),
        Animated.timing(waveform, { toValue: 0, duration: 350, useNativeDriver: false })
      ])
    ).start();
  };

  const stopWaveform = () => {
    waveform.stopAnimation();
    waveform.setValue(0);
  };

  const stopAllAudio = async () => {
    if (sound) {
      try {
        await sound.stopAsync();
        await sound.unloadAsync();
      } catch {}
      setSound(null);
      setIsPlaying(false);
    }
  };

  const stopEverything = async () => {
    await stopAllAudio();
    stopWakeLoopOnboarding();
    onboardingListening.current = false;
    stopWaveform();
  };

  const stopEverythingAndGoBack = async () => {
    await stopEverything();
    navigation.goBack();
  };

  const playAudioForStep = async (stepIndex) => {
    await stopAllAudio();
    stopWakeLoopOnboarding();
    onboardingListening.current = false;
    stopWaveform();
    setRecognizedText("");

    try {
      const { sound: newSound } = await Audio.Sound.createAsync(steps[stepIndex].audio);

      setSound(newSound);
      setIsPlaying(true);

      newSound.setOnPlaybackStatusUpdate(async (status) => {
        if (!status) return;

        if (status.didJustFinish) {
          setIsPlaying(false);

          try { await newSound.unloadAsync(); } catch {}
          setSound(null);

          if (language === "hindi") startOnboardingListening();
        }
      });

      await newSound.playAsync();
    } catch {
      if (language === "hindi") startOnboardingListening();
    }
  };

  const pausePlayback = async () => {
    if (sound && isPlaying) {
      try { await sound.pauseAsync(); } catch {}
      setIsPlaying(false);

      stopWakeLoopOnboarding();
      onboardingListening.current = false;

      if (language === "hindi") startOnboardingListening();
    }
  };

  const resumePlayback = async () => {
    stopWakeLoopOnboarding();
    onboardingListening.current = false;
    stopWaveform();
    setRecognizedText("");

    if (sound && !isPlaying) {
      try {
        await sound.playAsync();
        setIsPlaying(true);
      } catch {}
    } else {
      playAudioForStep(currentStep);
    }
  };

  const startOnboardingListening = async () => {
    stopWakeLoopOnboarding();
    if (onboardingListening.current) return;

    onboardingListening.current = true;
    startWaveform();

    const handleWakeText = (raw) => {
      const text = (raw || "")
        .toLowerCase()
        .normalize("NFC")
        .replace(/[^\p{L}\p{M} ]/gu, "")
        .trim();

      if (!text) return;

      setRecognizedText(text);

      if (nextKeywords.some(w => text.includes(w))) {
        showSuccess();
        stopWakeLoopOnboarding();
        onboardingListening.current = false;
        setTimeout(() => setCurrentStep(s => Math.min(s + 1, steps.length - 1)), 300);
      }

      if (prevKeywords.some(w => text.includes(w))) {
        showSuccess();
        stopWakeLoopOnboarding();
        onboardingListening.current = false;
        setTimeout(() => setCurrentStep(s => Math.max(s - 1, 0)), 300);
      }
    };

    try {
      await startWakeLoopOnboarding(handleWakeText);
    } catch {
      onboardingListening.current = false;
      stopWaveform();
    }
  };

  const showSuccess = async () => {
    Vibration.vibrate(120);
    try { await beepSound.current?.replayAsync(); } catch {}
    setSuccessVisible(true);
    setTimeout(() => setSuccessVisible(false), 700);
  };

  const nextStep = async () => {
    await stopEverything();
    setRecognizedText("");
    setCurrentStep(s => Math.min(s + 1, steps.length - 1));
  };

  const prevStep = async () => {
    await stopEverything();
    setRecognizedText("");
    setCurrentStep(s => Math.max(s - 1, 0));
  };

  const renderPlayPause = () => {
    return (
      <TouchableOpacity style={styles.play} onPress={isPlaying ? pausePlayback : resumePlayback}>
        <Text style={styles.playText}>
          {isPlaying ? `⏸ ${t("pause_instruction")}` : `▶ ${t("play_instruction")}`}
        </Text>
      </TouchableOpacity>
    );
  };

  const progressPercent = ((currentStep + 1) / steps.length) * 100;

  return (
    <View style={styles.container}>

      <TouchableOpacity style={styles.back} onPress={stopEverythingAndGoBack}>
        <Text style={styles.backText}>← {t("back")}</Text>
      </TouchableOpacity>

      <View style={styles.progressContainer}>
        <View style={[styles.progressFill, { width: `${progressPercent}%` }]} />
      </View>

      <Text style={styles.title}>{steps[currentStep].text}</Text>
      <Text style={styles.description}>{steps[currentStep].description}</Text>

      {language === "hindi" ? (
        <>
          {renderPlayPause()}

          <View style={styles.row}>

            <TouchableOpacity style={styles.nav} onPress={prevStep}>
              <Text style={styles.navText}>{t("previous")}</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.nav} onPress={nextStep}>
              <Text style={styles.navText}>{t("next")}</Text>
            </TouchableOpacity>

          </View>

          <Animated.View
            style={[
              styles.waveform,
              {
                opacity: waveform.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.3, 1]
                })
              }
            ]}
          />

          {successVisible && (
            <View style={styles.successPopup}>
              <Text style={styles.successCheck}>✔</Text>
            </View>
          )}

          <Text style={styles.recText}>
            {t("you_said")} {recognizedText}
          </Text>
        </>
      ) : (
        <>
          {renderPlayPause()}

          <View style={styles.row}>
            <TouchableOpacity style={styles.nav} onPress={prevStep}>
              <Text style={styles.navText}>{t("previous")}</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.nav} onPress={nextStep}>
              <Text style={styles.navText}>{t("next")}</Text>
            </TouchableOpacity>
          </View>
        </>
      )}

    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingTop: 50, alignItems: "center" },

  back: { alignSelf: "flex-start", marginLeft: 20 },
  backText: { fontSize: 20, color: "blue" },

  progressContainer: {
    width: "90%",
    height: 14,
    backgroundColor: "#ddd",
    borderRadius: 100,
    marginTop: 20,
    overflow: "hidden"
  },
  progressFill: {
    height: "100%",
    backgroundColor: "#28a745",
    borderRadius: 100
  },

  title: { fontSize: 28, fontWeight: "bold", marginTop: 25 },
  description: {
    fontSize: 18,
    marginTop: 10,
    color: "#444",
    width: "85%",
    textAlign: "center"
  },

  play: {
    backgroundColor: "green",
    padding: 15,
    borderRadius: 10,
    marginTop: 30,
    marginBottom : 10,
    width: 220
  },
  playText: { color: "white", textAlign: "center", fontSize: 18 },

  row: {
    flexDirection: "row",
    width: "75%",
    justifyContent: "space-between",
    marginTop: 25
  },

  nav: {
    backgroundColor: "#007bff",
    padding: 12,
    borderRadius: 10,
    width: 120
  },
  navText: { color: "white", textAlign: "center", fontSize: 16 },

  waveform: {
    width: "70%",
    height: 12,
    backgroundColor: "#ff8800",
    borderRadius: 10,
    marginTop: 25
  },

  successPopup: {
    position: "absolute",
    bottom: 140,
    backgroundColor: "rgba(76,175,80,0.2)",
    padding: 20,
    borderRadius: 50
  },
  successCheck: {
    fontSize: 40,
    color: "green",
    fontWeight: "bold"
  },

  recText: { marginTop: 30, fontSize: 16, color: "#333" }
});
