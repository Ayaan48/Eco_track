"""Habit logging, history, settings and badge blueprint.

Persists to Firebase Firestore when configured, otherwise to the in-memory
Demo Mode store. Firestore layout:
    users/{userId}                       - profile & settings
    logs/{userId}/daily/{YYYY-MM-DD}     - daily habit log + emission totals
    badges/{userId}                      - earned badge ids and award dates
"""

from datetime import date, datetime, timedelta

from flask import Blueprint, jsonify, request

import firebase_config
from routes.calculator import compute_footprint

habits_bp = Blueprint("habits", __name__)

DEFAULT_SETTINGS = {
    "name": "Eco Tracker",
    "email": "",
    "daily_budget": 8.0,  # kg CO2e - global sustainable daily target
    "country": "in",
    "weekly_goal": 5,     # days per week under budget
}

BADGES = [
    {"id": "first_step", "name": "First Step", "description": "Log your first day of habits."},
    {"id": "green_day", "name": "Green Day", "description": "Finish a day under your carbon budget."},
    {"id": "streak_3", "name": "3-Day Streak", "description": "Log habits 3 days in a row."},
    {"id": "week_warrior", "name": "Week Warrior", "description": "Log habits 7 days in a row."},
    {"id": "pedal_power", "name": "Pedal Power", "description": "Travel by bicycle or on foot for a day."},
    {"id": "plant_day", "name": "Plant Day", "description": "Log a fully vegan day."},
    {"id": "low_energy", "name": "Low Energy", "description": "Use less than 5 kWh of electricity in a day."},
    {"id": "monthly_hero", "name": "Monthly Hero", "description": "Log 15 days within 30 days."},
    {"id": "monthly_master", "name": "Monthly Master", "description": "Log 30 days within 30 days."},
    {"id": "zero_waster", "name": "Zero Waster", "description": "Log a day with no food waste."},
]


def _user_id():
    return (
        request.args.get("user_id")
        or (request.get_json(silent=True) or {}).get("user_id")
        or "demo"
    )


# --------------------------- storage helpers ------------------------------

def get_settings(user_id):
    if firebase_config.FIREBASE_ENABLED:
        doc = firebase_config.db.collection("users").document(user_id).get()
        stored = doc.to_dict() if doc.exists else {}
    else:
        stored = firebase_config.memory_store["users"].get(user_id, {})
    return {**DEFAULT_SETTINGS, **stored}


def save_settings(user_id, updates):
    if firebase_config.FIREBASE_ENABLED:
        firebase_config.db.collection("users").document(user_id).set(updates, merge=True)
    else:
        firebase_config.memory_store["users"].setdefault(user_id, {}).update(updates)


def save_log(user_id, log):
    if firebase_config.FIREBASE_ENABLED:
        (firebase_config.db.collection("logs").document(user_id)
         .collection("daily").document(log["date"]).set(log))
    else:
        firebase_config.memory_store["logs"].setdefault(user_id, {})[log["date"]] = log


def get_logs(user_id, days=30):
    """Return logs for the last `days` days sorted by date ascending."""
    cutoff = (date.today() - timedelta(days=days - 1)).isoformat()
    if firebase_config.FIREBASE_ENABLED:
        docs = (firebase_config.db.collection("logs").document(user_id)
                .collection("daily").stream())
        logs = [d.to_dict() for d in docs]
    else:
        logs = list(firebase_config.memory_store["logs"].get(user_id, {}).values())
    logs = [l for l in logs if l.get("date", "") >= cutoff]
    return sorted(logs, key=lambda l: l["date"])


def get_badges(user_id):
    if firebase_config.FIREBASE_ENABLED:
        doc = firebase_config.db.collection("badges").document(user_id).get()
        return doc.to_dict() if doc.exists else {}
    return dict(firebase_config.memory_store["badges"].get(user_id, {}))


def save_badges(user_id, earned):
    if firebase_config.FIREBASE_ENABLED:
        firebase_config.db.collection("badges").document(user_id).set(earned)
    else:
        firebase_config.memory_store["badges"][user_id] = dict(earned)


# --------------------------- streak / badges ------------------------------

def current_streak(logs):
    """Consecutive logged days ending today or yesterday."""
    logged = {l["date"] for l in logs}
    day = date.today()
    if day.isoformat() not in logged:
        day -= timedelta(days=1)
    streak = 0
    while day.isoformat() in logged:
        streak += 1
        day -= timedelta(days=1)
    return streak


def evaluate_badges(user_id):
    """Check every badge condition and award anything newly earned."""
    logs = get_logs(user_id, days=30)
    settings = get_settings(user_id)
    earned = get_badges(user_id)
    budget = float(settings.get("daily_budget", 8.0))
    streak = current_streak(logs)

    conditions = {
        "first_step": len(logs) >= 1,
        "green_day": any(l["total_kg"] <= budget for l in logs),
        "streak_3": streak >= 3,
        "week_warrior": streak >= 7,
        "pedal_power": any(
            l.get("travel", {}).get("mode") in ("bicycle", "walk")
            and float(l.get("travel", {}).get("distance_km", 0) or 0) > 0
            for l in logs
        ),
        "plant_day": any(l.get("food", {}).get("diet") == "vegan" for l in logs),
        "low_energy": any(
            float(l.get("energy", {}).get("electricity_kwh", 99) or 0) < 5 for l in logs
        ),
        "monthly_hero": len(logs) >= 15,
        "monthly_master": len(logs) >= 30,
        "zero_waster": any(not l.get("food", {}).get("food_waste", True) for l in logs),
    }

    newly_awarded = []
    today = date.today().isoformat()
    for badge in BADGES:
        if conditions.get(badge["id"]) and badge["id"] not in earned:
            earned[badge["id"]] = today
            newly_awarded.append(badge["id"])

    if newly_awarded:
        save_badges(user_id, earned)
    return earned, newly_awarded, streak


# ------------------------------- routes -----------------------------------

@habits_bp.route("/api/habits/log", methods=["POST"])
def log_habits():
    data = request.get_json(silent=True) or {}
    user_id = _user_id()
    try:
        totals = compute_footprint(
            data.get("travel"), data.get("food"), data.get("energy")
        )
    except (ValueError, TypeError) as exc:
        return jsonify({"error": str(exc)}), 400

    log = {
        "date": data.get("date") or date.today().isoformat(),
        "travel": data.get("travel") or {},
        "food": data.get("food") or {},
        "energy": data.get("energy") or {},
        **totals,
        "logged_at": datetime.utcnow().isoformat() + "Z",
    }
    save_log(user_id, log)
    earned, newly_awarded, streak = evaluate_badges(user_id)
    return jsonify({
        "ok": True,
        "log": log,
        "streak": streak,
        "newly_awarded": newly_awarded,
    }), 201


@habits_bp.route("/api/habits/history", methods=["GET"])
def history():
    user_id = _user_id()
    days = min(90, int(request.args.get("days", 30)))
    logs = get_logs(user_id, days=days)
    return jsonify({
        "logs": logs,
        "streak": current_streak(logs),
        "daily_budget": get_settings(user_id)["daily_budget"],
    })


@habits_bp.route("/api/habits/today", methods=["GET"])
def today():
    user_id = _user_id()
    logs = get_logs(user_id, days=1)
    today_iso = date.today().isoformat()
    log = next((l for l in logs if l["date"] == today_iso), None)
    return jsonify({"log": log, "streak": current_streak(get_logs(user_id))})


@habits_bp.route("/api/habits/settings", methods=["GET", "PATCH"])
def settings():
    user_id = _user_id()
    if request.method == "GET":
        return jsonify(get_settings(user_id))

    data = request.get_json(silent=True) or {}
    updates = {}
    if "name" in data:
        updates["name"] = str(data["name"])[:100]
    if "email" in data:
        updates["email"] = str(data["email"])[:200]
    if "country" in data:
        updates["country"] = str(data["country"]).lower()[:2]
    if "daily_budget" in data:
        budget = float(data["daily_budget"])
        if not 1.0 <= budget <= 50.0:
            return jsonify({"error": "Daily budget must be between 1 and 50 kg."}), 400
        updates["daily_budget"] = budget
    if "weekly_goal" in data:
        goal = int(data["weekly_goal"])
        if not 1 <= goal <= 7:
            return jsonify({"error": "Weekly goal must be between 1 and 7 days."}), 400
        updates["weekly_goal"] = goal

    save_settings(user_id, updates)
    return jsonify(get_settings(user_id))


@habits_bp.route("/api/habits/badges", methods=["GET", "POST"])
def badges():
    user_id = _user_id()
    if request.method == "POST":
        earned, newly_awarded, streak = evaluate_badges(user_id)
    else:
        earned = get_badges(user_id)
        newly_awarded = []
        streak = current_streak(get_logs(user_id))
    return jsonify({
        "catalog": BADGES,
        "earned": earned,
        "newly_awarded": newly_awarded,
        "streak": streak,
    })
