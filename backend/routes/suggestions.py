"""AI eco-suggestion blueprint.

Sends the user's daily emission breakdown to the Groq API
(llama-3.3-70b-versatile) and returns three JSON-structured eco swap
suggestions. Falls back to curated static tips when the API key is missing
or the call fails, so the feature always works.
"""

import json
import os
import re

from flask import Blueprint, jsonify, request

try:
    from groq import Groq
except ImportError:  # groq optional in restricted environments
    Groq = None

suggestions_bp = Blueprint("suggestions", __name__)

GROQ_MODEL = "llama-3.3-70b-versatile"

FALLBACK_SUGGESTIONS = [
    {
        "title": "Swap short car trips for cycling",
        "description": "Trips under 5 km are perfect for a bicycle. Replacing one daily short car trip saves roughly 1 kg of CO2 and adds healthy exercise.",
        "category": "travel",
        "estimated_saving_kg": 1.0,
    },
    {
        "title": "Try one plant-based meal today",
        "description": "Swapping a single meat-based meal for a vegetarian or vegan option cuts food emissions by up to 60% for that meal.",
        "category": "food",
        "estimated_saving_kg": 1.3,
    },
    {
        "title": "Raise your AC setpoint by 2°C",
        "description": "Setting air conditioning to 26°C instead of 24°C reduces cooling energy use by around 12% with barely any comfort loss.",
        "category": "energy",
        "estimated_saving_kg": 0.8,
    },
]

SYSTEM_PROMPT = (
    "You are EcoTrack's sustainability coach. Given a user's daily carbon "
    "emission breakdown, respond with practical, encouraging eco-friendly "
    "lifestyle swaps. Respond ONLY with a JSON array of exactly 3 objects, "
    "each with keys: title (short string), description (1-2 sentences), "
    "category (one of 'travel', 'food', 'energy'), and estimated_saving_kg "
    "(number, kg CO2 saved per day). No markdown, no extra text."
)


def _build_user_prompt(breakdown, budget, details):
    lines = [
        f"Daily emissions: travel {breakdown.get('travel_kg', 0)} kg, "
        f"food {breakdown.get('food_kg', 0)} kg, "
        f"energy {breakdown.get('energy_kg', 0)} kg, "
        f"total {breakdown.get('total_kg', 0)} kg CO2.",
        f"Daily budget: {budget} kg CO2 "
        f"({'over' if breakdown.get('total_kg', 0) > budget else 'under'} budget).",
    ]
    if details:
        if details.get("travel"):
            lines.append(f"Travel details: {json.dumps(details['travel'])}")
        if details.get("food"):
            lines.append(f"Food details: {json.dumps(details['food'])}")
        if details.get("energy"):
            lines.append(f"Energy details: {json.dumps(details['energy'])}")
    lines.append("Give 3 personalised eco swap suggestions targeting the highest-emission categories.")
    return "\n".join(lines)


def _parse_suggestions(text):
    """Extract and validate the JSON array from the model response."""
    match = re.search(r"\[.*\]", text, re.DOTALL)
    if not match:
        raise ValueError("No JSON array in model response")
    items = json.loads(match.group(0))
    suggestions = []
    for item in items[:3]:
        suggestions.append({
            "title": str(item.get("title", "Eco tip"))[:120],
            "description": str(item.get("description", ""))[:500],
            "category": item.get("category") if item.get("category") in ("travel", "food", "energy") else "energy",
            "estimated_saving_kg": round(float(item.get("estimated_saving_kg", 0) or 0), 2),
        })
    if len(suggestions) != 3:
        raise ValueError("Model did not return 3 suggestions")
    return suggestions


@suggestions_bp.route("/api/suggestions/generate", methods=["POST"])
def generate_suggestions():
    data = request.get_json(silent=True) or {}
    breakdown = data.get("breakdown") or {}
    budget = float(data.get("daily_budget", 8.0) or 8.0)
    details = data.get("details") or {}

    api_key = os.environ.get("GROQ_API_KEY")
    if api_key and Groq is not None:
        try:
            client = Groq(api_key=api_key)
            completion = client.chat.completions.create(
                model=GROQ_MODEL,
                temperature=0.7,
                max_tokens=800,
                messages=[
                    {"role": "system", "content": SYSTEM_PROMPT},
                    {"role": "user", "content": _build_user_prompt(breakdown, budget, details)},
                ],
            )
            suggestions = _parse_suggestions(completion.choices[0].message.content)
            return jsonify({"suggestions": suggestions, "source": "groq"})
        except Exception as exc:
            print(f"[EcoTrack] Groq call failed, using fallback tips: {exc}")

    return jsonify({"suggestions": FALLBACK_SUGGESTIONS, "source": "fallback"})
