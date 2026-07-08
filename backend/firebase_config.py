"""Firebase Admin SDK initialisation for EcoTrack.

If the service account key is missing or Firebase cannot be initialised,
the app falls back to an in-memory store (Demo Mode) so every feature keeps
working without cloud credentials.
"""

import os

try:
    import firebase_admin
    from firebase_admin import credentials, firestore
except ImportError:  # firebase-admin optional in restricted environments
    firebase_admin = None

db = None
FIREBASE_ENABLED = False


def init_firebase():
    """Initialise Firestore if a service account key is available."""
    global db, FIREBASE_ENABLED

    if firebase_admin is None:
        print("[EcoTrack] firebase-admin not installed - running in Demo Mode (in-memory store).")
        return

    key_path = os.environ.get("FIREBASE_SERVICE_ACCOUNT_PATH", "serviceAccountKey.json")
    key_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), key_path) \
        if not os.path.isabs(key_path) else key_path

    if not os.path.exists(key_path):
        print("[EcoTrack] serviceAccountKey.json not found - running in Demo Mode (in-memory store).")
        return

    try:
        cred = credentials.Certificate(key_path)
        firebase_admin.initialize_app(cred)
        db = firestore.client()
        FIREBASE_ENABLED = True
        print("[EcoTrack] Firebase Firestore connected.")
    except Exception as exc:  # pragma: no cover - depends on local credentials
        print(f"[EcoTrack] Firebase initialisation failed ({exc}) - running in Demo Mode.")


# ---------------------------------------------------------------------------
# In-memory fallback store used when Firebase is not configured (Demo Mode).
# Shape mirrors the Firestore collections:
#   users/{userId}, logs/{userId}/daily/{YYYY-MM-DD}, badges/{userId}
# ---------------------------------------------------------------------------
memory_store = {
    "users": {},   # user_id -> settings dict
    "logs": {},    # user_id -> {date -> log dict}
    "badges": {},  # user_id -> {badge_id -> awarded date}
}


init_firebase()
