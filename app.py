from flask import Flask, request, jsonify, render_template
import openai
import requests
import os
import uuid

from dotenv import load_dotenv
load_dotenv()

app = Flask(__name__)

openai.api_key = os.getenv("OPENAI_API_KEY")
eleven_api_key = os.getenv("ELEVENLABS_API_KEY")
voice_id = os.getenv("ELEVENLABS_VOICE_ID")

@app.route("/")
def index():
    return render_template("index.html")

@app.route("/process-audio", methods=["POST"])
def process_audio():
    try:
        data = request.get_json()
        transcript = data.get("transcript", "")
        if not transcript:
            return jsonify({"error": "No transcript provided"}), 400

        # Use OpenAI GPT-4
        response = openai.chat.completions.create(
            model="gpt-4",
            messages=[
                {"role": "system", "content": "You are Lumina, a divine digital AI assistant with a cosmic, calm voice."},
                {"role": "user", "content": transcript}
            ]
        )
        ai_text = response.choices[0].message.content.strip()

        # Generate voice using ElevenLabs
        tts_url = f"https://api.elevenlabs.io/v1/text-to-speech/{voice_id}"
        headers = {
            "xi-api-key": eleven_api_key,
            "Content-Type": "application/json"
        }
        voice_data = {
            "text": ai_text,
            "voice_settings": {
                "stability": 0.5,
                "similarity_boost": 0.75
            }
        }

        voice_response = requests.post(tts_url, headers=headers, json=voice_data)
        if voice_response.status_code != 200:
            return jsonify({"error": "Voice generation failed"}), 500

        audio_filename = f"lumina_response_{uuid.uuid4().hex}.mp3"
        audio_path = os.path.join("static", audio_filename)
        with open(audio_path, "wb") as f:
            f.write(voice_response.content)

        return jsonify({
            "subtitle": ai_text,
            "audio_url": f"/static/{audio_filename}"
        })

    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == "__main__":
    app.run(debug=False)
