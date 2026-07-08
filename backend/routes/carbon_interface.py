"""Carbon Interface API integration blueprint.

Provides verified real-world emission estimates for electricity and flights.
If the API key is missing or the request fails, the routes fall back to
locally stored emission coefficients without user-facing errors.
"""

import os

import requests
from flask import Blueprint, jsonify, request

carbon_bp = Blueprint("carbon", __name__)

CARBON_INTERFACE_URL = "https://www.carboninterface.com/api/v1/estimates"

# Local fallback grid factors, kg CO2e per kWh
GRID_FACTORS = {
    "in": 0.82, "us": 0.37, "gb": 0.21, "de": 0.36,
    "fr": 0.06, "au": 0.66, "cn": 0.58, "ca": 0.13,
}
DEFAULT_GRID_FACTOR = 0.475  # world average

FLIGHT_FACTOR_PER_KM = 0.115  # kg CO2e per passenger-km (short/medium haul avg)
ASSUMED_FLIGHT_KM = 1500      # fallback leg distance when API unavailable


def _api_key():
    return os.environ.get("CARBON_INTERFACE_API_KEY")


def _call_carbon_interface(payload):
    response = requests.post(
        CARBON_INTERFACE_URL,
        json=payload,
        headers={
            "Authorization": f"Bearer {_api_key()}",
            "Content-Type": "application/json",
        },
        timeout=10,
    )
    response.raise_for_status()
    return response.json()["data"]["attributes"]


@carbon_bp.route("/api/carbon/electricity", methods=["POST"])
def electricity():
    data = request.get_json(silent=True) or {}
    try:
        kwh = float(data.get("electricity_value", 0) or 0)
    except (TypeError, ValueError):
        return jsonify({"error": "electricity_value must be a number."}), 400
    if kwh < 0 or kwh > 10000:
        return jsonify({"error": "electricity_value must be between 0 and 10000 kWh."}), 400
    country = str(data.get("country", "in")).lower()[:2]

    if _api_key():
        try:
            attrs = _call_carbon_interface({
                "type": "electricity",
                "electricity_unit": "kwh",
                "electricity_value": kwh,
                "country": country,
            })
            return jsonify({"carbon_kg": attrs["carbon_kg"], "source": "carbon_interface"})
        except Exception as exc:
            print(f"[EcoTrack] Carbon Interface electricity call failed, using local factors: {exc}")

    factor = GRID_FACTORS.get(country, DEFAULT_GRID_FACTOR)
    return jsonify({"carbon_kg": round(kwh * factor, 2), "source": "local_fallback"})


@carbon_bp.route("/api/carbon/flight", methods=["POST"])
def flight():
    data = request.get_json(silent=True) or {}
    passengers = max(1, int(data.get("passengers", 1) or 1))
    legs = data.get("legs") or []
    if not legs:
        return jsonify({"error": "At least one flight leg is required."}), 400
    for leg in legs:
        if not leg.get("departure_airport") or not leg.get("destination_airport"):
            return jsonify({"error": "Each leg needs departure_airport and destination_airport codes."}), 400

    if _api_key():
        try:
            attrs = _call_carbon_interface({
                "type": "flight",
                "passengers": passengers,
                "legs": [
                    {
                        "departure_airport": str(leg["departure_airport"]).lower(),
                        "destination_airport": str(leg["destination_airport"]).lower(),
                    }
                    for leg in legs
                ],
            })
            return jsonify({"carbon_kg": attrs["carbon_kg"], "source": "carbon_interface"})
        except Exception as exc:
            print(f"[EcoTrack] Carbon Interface flight call failed, using local factors: {exc}")

    estimate = FLIGHT_FACTOR_PER_KM * ASSUMED_FLIGHT_KM * len(legs) * passengers
    return jsonify({"carbon_kg": round(estimate, 2), "source": "local_fallback"})
