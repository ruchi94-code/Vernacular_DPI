import React, { useRef, useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet, Animated } from "react-native";
import { Feather } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { startWakeLoop, stopWakeLoop } from "../utils/wake";

export default function LanguageScreen({ navigation }) {
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const isActive = useRef(false);

  const [isMicLive, setIsMicLive] = useState(false);

  const cleanText = (raw = "") =>
    raw
      .toLowerCase()
      .normalize("NFC")
      .replace(/[^\p{L}\p{M} ]/gu, "")
      .replace(/\s+/g, " ")
      .trim();

  const fuzzyMatch = (text, word) => {
    if (!text) return false;
    if (text.includes(word)) return true;

    const dist = levenshtein(text, word);
    return dist <= 2;
  };

  const levenshtein = (a, b) => {
    const dp = Array(a.length + 1)
      .fill(null)
      .map(() => Array(b.length + 1).fill(0));

    for (let i = 0; i <= a.length; i++) dp[i][0] = i;
    for (let j = 0; j <= b.length; j++) dp[0][j] = j;

    for (let i = 1; i <= a.length; i++) {
      for (let j = 1; j <= b.length; j++) {
        const cost = a[i - 1] === b[j - 1] ? 0 : 1;
        dp[i][j] = Math.min(
          dp[i - 1][j] + 1,
          dp[i][j - 1] + 1,
          dp[i - 1][j - 1] + cost
        );
      }
    }
    return dp[a.length][b.length];
  };

  const startWave = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.18, duration: 600, useNativeDriver: false }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 600, useNativeDriver: false }),
      ])
    ).start();
  };

  const stopWave = () => {
    pulseAnim.stopAnimation();
    pulseAnim.setValue(1);
  };

  const handleWakeText = (rawText) => {
    if (!isActive.current) return;

    const text = cleanText(rawText);
    if (!text) return;

    console.log("🎧 Wake text:", text);

    const checks = (words) => words.some(w => fuzzyMatch(text, w));

    if (checks(["hindi", "हिंदी", "हिन्दी"])) {
      stopWakeLoop();
      navigation.navigate("Onboarding", { language: "hindi" });
      return;
    }

    if (checks(["english", "इंग्लिश", "इंग्लीश"])) {
      stopWakeLoop();
      navigation.navigate("Onboarding", { language: "english" });
      return;
    }

    if (checks(["marathi", "मराठी"])) {
      stopWakeLoop();
      navigation.navigate("Onboarding", { language: "marathi" });
      return;
    }
  };

  useFocusEffect(
    React.useCallback(() => {
      console.log("📌 LanguageScreen Focused → Start Wake Loop");
      isActive.current = true;
      setIsMicLive(true);
      startWave();

      startWakeLoop(handleWakeText);

      return () => {
        console.log("📴 LanguageScreen Blurred → Stop Wake Loop");
        isActive.current = false;
        stopWave();
        setIsMicLive(false);
        stopWakeLoop();
      };
    }, [])
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Select Language</Text>
      <Text style={styles.hint}>
        <Feather name="mic" size={22} color="black" /> Say “Hindi”, “Marathi”, or “English”
      </Text>

      <View style={{ alignItems: "center", marginBottom: 40 }}>
        <Animated.View style={[styles.pulseRing, { transform: [{ scale: pulseAnim }] }]} />
        <View style={[styles.micCircle, { backgroundColor: isMicLive ? "#00c851" : "#ff3b30" }]}>
          <Feather name="mic" size={32} color="white" />
        </View>
        <View style={styles.statusBadge}>
          <Text style={{ fontSize: 8, color: "white" }}>{isMicLive ? "LIVE" : "OFF"}</Text>
        </View>
      </View>

      <TouchableOpacity style={styles.button} onPress={() => navigation.navigate("Onboarding", { language: "marathi" })}>
        <Text style={styles.buttonText}>मराठी</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.button} onPress={() => navigation.navigate("Onboarding", { language: "hindi" })}>
        <Text style={styles.buttonText}>हिंदी</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.button} onPress={() => navigation.navigate("Onboarding", { language: "english" })}>
        <Text style={styles.buttonText}>English</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", alignItems: "center" },
  title: { fontSize: 32, fontWeight: "bold", marginBottom: 20 },
  hint: { fontSize: 18, marginBottom: 20, textAlign: "center" },

  pulseRing: {
    position: "absolute",
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "rgba(255,255,255,0.5)",
    zIndex: -1,
  },

  micCircle: {
    width: 70,
    height: 70,
    borderRadius: 35,
    justifyContent: "center",
    alignItems: "center",
    elevation: 8,
  },

  statusBadge: {
    position: "absolute",
    right: -20,
    top: 40,
    backgroundColor: "#000",
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "white",
  },

  button: {
    backgroundColor: "#007bff",
    padding: 15,
    width: 240,
    borderRadius: 10,
    marginVertical: 10,
  },
  buttonText: { color: "#fff", fontSize: 20, textAlign: "center" },
});
