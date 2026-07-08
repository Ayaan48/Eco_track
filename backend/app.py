"""EcoTrack Flask backend entry point."""

import os

from dotenv import load_dotenv

load_dotenv()  # must run before route modules read API keys

from flask import Flask, jsonify
from flask_cors import CORS

import firebase_config
from routes.calculator import calculator_bp
from routes.habits import habits_bp
from routes.suggestions import suggestions_bp
from routes.carbon_interface import carbon_bp

app = Flask(__name__)
CORS(app)

app.register_blueprint(calculator_bp)
app.register_blueprint(habits_bp)
app.register_blueprint(suggestions_bp)
app.register_blueprint(carbon_bp)


@app.route("/api/health")
def health():
    return jsonify({
        "status": "ok",
        "firebase": firebase_config.FIREBASE_ENABLED,
        "groq": bool(os.environ.get("GROQ_API_KEY")),
        "carbon_interface": bool(os.environ.get("CARBON_INTERFACE_API_KEY")),
    })


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)
