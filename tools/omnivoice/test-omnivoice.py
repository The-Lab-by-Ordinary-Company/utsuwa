#!/usr/bin/env python3
"""
Test client for omnivoice-proxy — verifies the minimal Basispaket endpoints.

Usage:
  # Start proxy in another terminal first:
  #   python tools/omnivoice/omnivoice-proxy.py --device cpu
  #
  # Then run:
  python tools/omnivoice/test-omnivoice.py
"""

from __future__ import annotations

import sys
from pathlib import Path

import requests

BASE = "http://localhost:8880"


def die(msg: str):
    print(f"  FAIL: {msg}")
    sys.exit(1)


def check(name: str, ok: bool, detail: str = ""):
    status = "OK" if ok else "FAIL"
    print(f"  [{status}] {name}")
    if not ok and detail:
        print(f"         {detail}")
    if not ok:
        sys.exit(1)


def main():
    print("OmniVoice Proxy — Basispaket Test\n")

    # 1. Health
    print("1. Health check")
    try:
        r = requests.get(f"{BASE}/health", timeout=5)
    except requests.ConnectionError:
        die("Proxy not running. Start it first: python tools/omnivoice/omnivoice-proxy.py")
        return
    check("GET /health -> 200", r.status_code == 200)
    health = r.json()
    check("status is 'ok'", health.get("status") == "ok")

    # 2. Models
    print("\n2. Models")
    r = requests.get(f"{BASE}/v1/models")
    check("GET /v1/models -> 200", r.status_code == 200)
    models = r.json()
    check("contains 'omnivoice'", any(m["id"] == "omnivoice" for m in models.get("data", [])))

    # 3. Voices
    print("\n3. Voices")
    r = requests.get(f"{BASE}/v1/voices")
    check("GET /v1/voices -> 200", r.status_code == 200)
    voices = r.json()
    check("has presets", len(voices.get("presets", [])) > 0)
    print(f"         Found {len(voices['presets'])} presets")

    # 4. Basic TTS (preset voice)
    print("\n4. TTS (voice preset)")
    r = requests.post(
        f"{BASE}/v1/audio/speech",
        json={"input": "Hello world.", "voice": "alloy", "language": "en", "speed": 1.0},
    )
    check("POST /v1/audio/speech -> 200", r.status_code == 200, f"HTTP {r.status_code}")
    check("returns audio/wav", r.headers.get("content-type", "").startswith("audio"))
    wav_path = Path("/tmp/omnivoice-test-preset.wav")
    wav_path.write_bytes(r.content)
    print(f"         Saved to {wav_path}")

    # 5. TTS with explicit instructions
    print("\n5. TTS (voice design)")
    r = requests.post(
        f"{BASE}/v1/audio/speech",
        json={
            "input": "This is a test of voice design.",
            "instructions": "female, british accent, high pitch",
            "language": "en",
        },
    )
    check("POST /v1/audio/speech (instructions) -> 200", r.status_code == 200, f"HTTP {r.status_code}")
    wav_path = Path("/tmp/omnivoice-test-design.wav")
    wav_path.write_bytes(r.content)
    print(f"         Saved to {wav_path}")

    print("\nAll tests passed.")


if __name__ == "__main__":
    main()
