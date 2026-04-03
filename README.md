PROJECT TITLE
VERNACULAR DPI ONBOARDING SUITE

A mobile prototype that helps users complete digital onboarding steps (like Aadhaar-based registration) using simple Hindi/Marathi/English voice instructions and speech recognition.

---

1. OVERVIEW

This project is a prototype of a voice-guided onboarding assistant designed for users who struggle with reading, complex UI, or digital forms.

Instead of reading long instructions, the user can:

* Speak a language name (Hindi/Marathi/English) on the Language Screen
* Hear step-by-step audio guidance (e.g., “Keep your Aadhaar ready”, “Enter your mobile number”, “Complete OTP verification”)
* Navigate between steps using simple voice commands like “Next”, “Previous”, “Aage”, “Peeche”, etc.

The system continuously records short audio chunks, sends them to a local STT (Speech-to-Text) Flask server powered by Vosk (Hindi model), and uses the recognized text to drive navigation.

This helps:

* Semi-literate / first-time smartphone users
* Rural or regional-language users
* Any user who prefers audio + voice interaction over reading long screens

Current prototype focuses on Hindi + basic Marathi/English support for instructions and UI text.

---

2. FEATURES

* Multilingual Language Selection via Voice

  * User can say “Hindi / Marathi / English” on the Language Screen to select language.
  * Visual mic indicator (LIVE/OFF) shows when the system is listening.

* Step-by-Step Audio Onboarding

  * Plays pre-recorded audio instructions for each step (Aadhaar ready → enter mobile → OTP verification).
  * Each language has its own audio files and text (Hindi, Marathi, English).

* Voice-Based Navigation (Next / Previous)

  * After each step audio completes (or if user pauses), the app starts “wake listening”.
  * User can say words like “haan”, “yes”, “next”, “aage”, “peeche”, “back”, etc.
  * Recognized keywords move to the next or previous instruction automatically.

* Real-Time STT using Local Flask + Vosk Server

  * App records small audio chunks (~1s) via Expo Audio API.
  * Sends them to Flask /wake endpoint.
  * Vosk Hindi ASR model returns quick transcription used for wake-words and commands.

* Visual Feedback & Micro-Interactions

  * Animated waveform bar during voice listening.
  * “You said: …” text shows what the system understood.
  * Short vibration + beep + green tick popup when a valid command is detected (success feedback).

* Multilingual UI with i18n

  * Uses i18n (react-i18next) to translate UI labels such as Back, Next, Previous, Play Instruction, Pause Instruction, You said, etc.
  * Auto-switches UI language based on selected language on the Language Screen.

* Robust Audio Handling

  * Avoids overlapping audio by carefully stopping/unloading sounds.
  * Handles pause/play correctly and restarts listening when instruction ends.

---

3. TECH STACK

Frontend (Mobile App):

* React Native (Expo)
* React Navigation
* react-i18next / i18next (for multilingual UI)
* expo-av (audio recording & playback)
* expo-file-system (temp audio storage)
* Animated API from React Native (for waveform & mic pulse)

Backend (STT Server):

* Python 3
* Flask (REST endpoints /wake and /stt)
* Vosk ASR Model (vosk-model-small-hi-0.22 for Hindi)
* ffmpeg (for audio format conversion to 16kHz mono WAV)

Database:

* Not used in this prototype (no persistent storage).
* Can be extended later with MongoDB / PostgreSQL / Firebase to log sessions, analytics, or user progress.

Machine Learning / AI:

* Vosk speech-to-text engine (offline/near-real-time Hindi transcription on the server).

APIs / Tools Used:

* Expo CLI / Metro bundler
* React Native + Expo Audio APIs
* Flask REST API (/wake, /stt)
* ffmpeg (command-line audio conversion)

---

4. SYSTEM REQUIREMENTS

Minimum Hardware (User Device):

* Android smartphone
* Android 8.0 (Oreo) or above
* RAM: 2 GB or higher (3–4 GB recommended)
* Microphone (built-in)
* Stable Wi-Fi or hotspot connection to reach the local STT server (same network)

Development Machine:

* OS: Windows / Linux / macOS
* RAM: 8 GB minimum (16 GB recommended for smoother dev + model loading)
* Processor: Any modern x64 CPU (i5 or equivalent and above)
* Disk Space:

  * Vosk Hindi model folder (hundreds of MB)
  * Node modules + Expo dependencies
  * ffmpeg binaries

Software Requirements:

* Node.js (LTS, e.g., 18.x)
* npm or yarn
* Expo CLI (npx expo)
* Python 3.8+
* pip (Python package manager)
* ffmpeg installed and added to PATH
* Android device with Expo Go app (for quick testing) or Android emulator

Python Dependencies:

* flask
* vosk
* (standard library modules: wave, subprocess, os, uuid, json, shutil)

JavaScript / React Native Dependencies:

* react
* react-native
* expo
* expo-av
* expo-file-system
* @react-navigation/native & related packages
* react-i18next, i18next

---

5. PROJECT STRUCTURE


* /App.js

  * Root of the React Native app, navigation setup.

* /src

  * /screens
    * HomeScreen.js

    * LanguageScreen.js

      * First screen, listens for language names via wake.js.
      * Shows pulsing mic, LIVE/OFF badge, and manual language buttons.
    * OnboardingScreen.js

      * Plays stepwise instructions in chosen language.
      * Handles play/pause, waveform animation, “You said” text, and voice-based next/previous navigation.

  * /utils

    * wake.js

      * Loop for language detection on LanguageScreen.
      * Records short chunks, sends to /wake, parses text for “Hindi/Marathi/English”.
    * wake_onboarding.js

      * Similar loop but specialized for onboarding navigation (next/previous).
      * Sends short audio chunks to /wake endpoint and invokes callback with recognized text.

  * /i18n

    * i18n.js

      * i18next configuration and language initialization.
    * /locales

      * en.json – English UI strings (back, next, play instruction, pause instruction, you said, etc.)
      * hi.json – Hindi UI strings.
      * mr.json – Marathi UI strings (optional/in progress).

* /assets

  * /audio

    * /hindi

      * step1.mp3 – “पहला चरण – अपना आधार कार्ड तैयार रखें…”
      * step2.mp3 – “दूसरा चरण – मोबाइल नंबर दर्ज करें…”
      * step3.mp3 – “तीसरा चरण – OTP सत्यापन पूरा करें…”
    * /marathi

      * step1.mp3, step2.mp3, step3.mp3 (Marathi equivalents).
    * /english

      * step1.mp3, step2.mp3, step3.mp3 (English equivalents).
  * beep.mp3 – short beep sound for success feedback.

In C:\vosk-server
* models folder :
vosk-model-small-hi-0.22 --download and extract here

* stt_server.py

  * Flask server exposing:

    * POST /wake – fast, short-chunk transcription for commands.
    * POST /stt – longer transcription (reserved for future).
  * Handles ffmpeg conversion to 16kHz mono WAV and uses Vosk to recognize text.

---

6. INSTALLATION & SETUP

7. Clone the Repository

   * git clone <repo-url>
   * cd <project-folder>

8. Install Node / JS Dependencies (React Native App)

   * Install Node.js (LTS) from official website.
   * Install Expo CLI if needed:

     * npm install -g expo-cli  (or use npx directly)
   * Inside project folder (app root):

     * npm install
     * npm install react-i18next i18next
     * npx expo install expo-av expo-file-system @react-navigation/native

9. Python Environment for STT Server

   * Install Python 3.8+
   * pip install flask vosk
   * Install ffmpeg and add it to PATH.

10. Download Vosk Model (Hindi)

    * Download vosk-model-small-hi-0.22.
    * Extract it to a folder, e.g. C:/vosk-server/models/vosk-model-small-hi-0.22
    * Ensure MODEL_PATH in stt_server.py points to this folder.

11. Configure IP Address for WAKE_URL

    * In src/utils/wake.js and src/utils/wake_onboarding.js, update:

      * const WAKE_URL = "http://<your-local-IP>:5001/wake";
    * Ensure the phone and the dev machine running Flask are on the same network.

12. Run the STT Server

    * python stt_server.py
    * Server runs at [http://0.0.0.0:5001](http://0.0.0.0:5001)

13. Run the React Native App

    * npx expo start
    * Open Expo Go on your Android device.
    * Scan the QR code or connect using LAN.

---

7. USAGE INSTRUCTIONS

Once setup is complete:

1. Start Backend

   * Make sure stt_server.py is running.

2. Start Mobile App

   * Launch the Expo app on your phone.
   * Open the project via Expo Go.

3. Language Selection Flow

   * On the Language Screen:

     * Mic icon will pulse and show LIVE (listening).
     * Say “Hindi / Marathi / English” clearly.
     * If recognized, the app navigates automatically to the Onboarding Screen in that language.
     * Alternatively, tap the language button manually.

4. Onboarding Flow

   * Step title and description are shown (e.g., “पहला चरण – अपना आधार कार्ड तैयार रखें।” ).
   * For Hindi:

     * Instruction audio auto-plays for Step 1 when screen opens.
     * After audio finishes, the system starts listening for commands.
   * Speak commands like:

     * “haan”, “yes”, “ok”, “next”, “aage” → go to next step.
     * “peeche”, “back”, “previous” → go to previous step.
   * When a valid command is detected:

     * Short vibration
     * Beep sound
     * Green tick popup
     * Step changes after a short delay.

5. Manual Controls

   * “Play Instruction” button: replay step audio.
   * “Pause Instruction” button: pause audio, then system listens for voice commands.
   * “Back” button: exits onboarding and returns to Language Screen (stops all audio and listening).

---

8. DEMO

* Live demo URL:

  * [](https://youtu.be/OxTAAxdk_vw)
* Video demonstration:

  * Prototype walkthrough (Google Meet recording) showing:

    * Voice language selection
    * Hindi onboarding steps
    * Voice “Next/Previous” navigation
    * UI translations and feedback

---

9. TEAM MEMBERS

| Name                  | Role                                      | Department / College                                      |
| --------------------- | ----------------------------------------- | --------------------------------------------------------- |
| Sarish Amit Shinde    | Team Leader, Mobile + Backend Integration | SY B.Tech, Automation & Robotics, JSPM’s RSCOE, Tathawade |
| Ruchita Shravan Patil | Team Member, STT / Logic / UI Content     | SY B.Tech, CSBS, JSPM’s RSCOE, Tathawade                  |
| Mayank Satish Dandane | Team Member, App Testing & UX Feedback    | SY B.Tech, Automation & Robotics, JSPM’s RSCOE, Tathawade |

10. FUTURE IMPROVEMENTS

* Better Noise Handling & Robustness

  * Integrate proper VAD/noise suppression pipeline on server for cleaner input.
  * More aggressive handling of background noise in crowded environments.

* Multi-Language STT Models

  * Add Marathi and English Vosk models (or alternate ASR engines).
  * Auto-detect language from speech where possible.

* Richer Onboarding Flows

  * Extend beyond Aadhaar onboarding to full government portal flows or digital payments.
  * Dynamic steps fetched from backend configuration instead of hardcoded audio files.

* Offline / On-Device STT (Long Term)

  * Explore on-device ASR models to remove dependency on local network server.

* Analytics & Personalization

  * Track where users get stuck (which step is repeated).
  * Adapt instructions or play additional help tips based on user behavior.

---

11. LICENSE

Currently: N/A (for hackathon / academic prototype use).
Can be updated to MIT or another open-source license as needed.

---

12. CONTACT

For any queries or support regarding this prototype:

* Team Leader:

  * Name: Sarish Amit Shinde
  * Department: Automation & Robotics, SY B.Tech
  * College: JSPM’s RSCOE, Tathawade, Pune
  * Email : sarishshinde06@gmail.com
