from flask import Flask, request, jsonify
from vosk import Model, KaldiRecognizer
import wave, subprocess, os, uuid, json, shutil

app = Flask(__name__)

MODEL_PATH = r"C:/vosk-server/models/vosk-model-small-hi-0.22"

print("Loading Vosk model from", MODEL_PATH)
model = Model(MODEL_PATH)
print("Model loaded")

def convert_to_wav(infile, outfile):
    cmd = ["ffmpeg", "-y", "-i", infile, "-ar", "16000", "-ac", "1", outfile]
    proc = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
    return proc.returncode == 0 and os.path.exists(outfile)

def transcribe_wav(wav_path, words=True, chunk_frames=4000):
    wf = wave.open(wav_path, "rb")
    rec = KaldiRecognizer(model, wf.getframerate())
    rec.SetWords(words)
    text = ""
    while True:
        data = wf.readframes(chunk_frames)
        if len(data) == 0:
            break
        if rec.AcceptWaveform(data):
            j = json.loads(rec.Result())
            text += " " + j.get("text", "")
    final = json.loads(rec.FinalResult())
    text += " " + final.get("text", "")
    wf.close()
    return text.strip()

@app.route("/wake", methods=["POST"])
def wake():
    if "audio" not in request.files:
        return jsonify({"text": ""})
    f = request.files["audio"]
    raw_in = f"wake_raw_{uuid.uuid4().hex}.tmp"
    wav_out = f"wake_wav_{uuid.uuid4().hex}.wav"
    f.save(raw_in)
    ok = convert_to_wav (raw_in, wav_out) if True else False
    if not os.path.exists(wav_out):
        try:
            text = transcribe_wav(raw_in, words=False, chunk_frames=2000)
            os.remove(raw_in)
            return jsonify({"text": text})
        except Exception as e:
            if os.path.exists(raw_in):
                os.remove(raw_in)
            return jsonify({"text": ""})
    try:
        text = transcribe_wav(wav_out, words=False, chunk_frames=2000) 
    except Exception as e:
        text = ""

    if os.path.exists(raw_in): os.remove(raw_in)
    if os.path.exists(wav_out): os.remove(wav_out)
    return jsonify({"text": text})

@app.route("/stt", methods=["POST"])
def stt():
    if "audio" not in request.files:
        return jsonify({"error": "No audio file"}), 400
    f = request.files["audio"]
    raw_in = f"raw_{uuid.uuid4().hex}.tmp"
    wav_out = f"audio_{uuid.uuid4().hex}.wav"
    f.save(raw_in)

    cmd = ["ffmpeg", "-y", "-i", raw_in, "-ar", "16000", "-ac", "1", wav_out]
    subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
    if not os.path.exists(wav_out):
        if os.path.exists(raw_in): os.remove(raw_in)
        return jsonify({"text": ""})
    try:
        text = transcribe_wav(wav_out, words=True, chunk_frames=4000)
    except Exception as e:
        text = ""
    if os.path.exists(raw_in): os.remove(raw_in)
    if os.path.exists(wav_out): os.remove(wav_out)
    return jsonify({"text": text})

if __name__ == "__main__":
    print("Server running on http://0.0.0.0:5001")
    app.run(host="0.0.0.0", port=5001)
