"""Carbon footprint calculator blueprint.

Applies science-backed emission coefficients to the user's daily travel,
food and home-energy habits and returns a per-category breakdown plus the
daily total in kg CO2e.
"""

from flask import Blueprint, jsonify, request

calculator_bp = Blueprint("calculator", __name__)

# kg CO2e per passenger-km (car value is per vehicle-km and divided by occupancy)
TRANSPORT_FACTORS = {
    "car": 0.192,
    "motorcycle": 0.103,
    "bus": 0.105,
    "train": 0.041,
    "metro": 0.035,
    "bicycle": 0.0,
    "walk": 0.0,
    "none": 0.0,
}

# kg CO2e per meal by diet type
DIET_FACTORS = {
    "vegan": 0.7,
    "vegetarian": 1.2,
    "mixed": 2.0,
    "heavy_meat": 3.3,
}

FOOD_WASTE_KG = 0.5          # flat penalty when food was wasted that day
ELECTRICITY_FACTOR = 0.82    # kg CO2e per kWh (India grid average)
HEATING_FLAT_KG = 1.2        # flat daily rate when heating was used
AC_FLAT_KG = 2.0             # flat daily rate when air conditioning was used

VALID_DIETS = set(DIET_FACTORS)


def compute_footprint(travel, food, energy):
    """Core calculation shared by the calculator and habit-log routes."""
    travel = travel or {}
    food = food or {}
    energy = energy or {}

    mode = str(travel.get("mode", "none")).lower()
    if mode not in TRANSPORT_FACTORS:
        raise ValueError(f"Unknown transport mode '{mode}'.")
    distance = float(travel.get("distance_km", 0) or 0)
    if distance < 0 or distance > 2000:
        raise ValueError("Distance must be between 0 and 2000 km.")
    passengers = max(1, int(travel.get("passengers", 1) or 1))

    travel_kg = TRANSPORT_FACTORS[mode] * distance
    if mode == "car":
        travel_kg /= passengers

    diet = str(food.get("diet", "mixed")).lower()
    if diet not in VALID_DIETS:
        raise ValueError(f"Diet must be one of {sorted(VALID_DIETS)}.")
    meals = max(0, int(food.get("meals", 3) or 0))
    food_kg = DIET_FACTORS[diet] * meals
    if food.get("food_waste"):
        food_kg += FOOD_WASTE_KG

    kwh = float(energy.get("electricity_kwh", 0) or 0)
    if kwh < 0 or kwh > 200:
        raise ValueError("Electricity must be between 0 and 200 kWh.")
    energy_kg = kwh * ELECTRICITY_FACTOR
    if energy.get("heating"):
        energy_kg += HEATING_FLAT_KG
    if energy.get("ac"):
        energy_kg += AC_FLAT_KG

    travel_kg = round(travel_kg, 2)
    food_kg = round(food_kg, 2)
    energy_kg = round(energy_kg, 2)
    return {
        "travel_kg": travel_kg,
        "food_kg": food_kg,
        "energy_kg": energy_kg,
        "total_kg": round(travel_kg + food_kg + energy_kg, 2),
    }


@calculator_bp.route("/api/calculate/footprint", methods=["POST"])
def calculate_footprint():
    data = request.get_json(silent=True) or {}
    try:
        result = compute_footprint(
            data.get("travel"), data.get("food"), data.get("energy")
        )
    except (ValueError, TypeError) as exc:
        return jsonify({"error": str(exc)}), 400
    return jsonify(result)
