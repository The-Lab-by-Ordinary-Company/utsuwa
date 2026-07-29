#!/usr/bin/env python3
"""
Test client for omnivoice-proxy — verifies the minimal endpoint set.

Usage:
  # Start proxy in another terminal first:
  #   python tools/omnivoice/omnivoice-proxy.py --device cpu
  #
  # Then run:
  python tools/omnivoice/test-omnivoice.py
"""

from __future__ import annotations

import math
import sys
import wave
from pathlib import Path

import requests

BASE = "http://localhost:8881"


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


def _make_test_wav(path: Path, duration: float = 2.0):
    """Write a simple 24 kHz mono sine wave for voice-cloning tests."""
    sample_rate = 24000
    samples = int(sample_rate * duration)
    data = bytearray()
    for i in range(samples):
        value = int(32767 * 0.3 * math.sin(2 * math.pi * 440 * i / sample_rate))
        data.extend(value.to_bytes(2, "little", signed=True))
    with wave.open(str(path), "wb") as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(sample_rate)
        w.writeframes(data)


def main():
    print("OmniVoice Proxy — Endpoint Test\n")

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
    check("has clones list", isinstance(voices.get("clones", None), list))
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

    # 6. Persistent profile initialization
    print("\n6. Persistent profile initialization")
    r = requests.post(
        f"{BASE}/v1/voices/initialize",
        json={"voice": "alloy", "language": "en"},
    )
    check("POST /v1/voices/initialize -> 200", r.status_code == 200, f"HTTP {r.status_code}")
    profile_key = r.json().get("profile_key")
    check("profile_key returned", bool(profile_key))
    print(f"         profile_key = {profile_key}")

    # 7. Profile reset
    print("\n7. Persistent profile reset")
    r = requests.post(
        f"{BASE}/v1/voices/profile/reset",
        json={"voice": "alloy", "language": "en"},
    )
    check("POST /v1/voices/profile/reset -> 200", r.status_code == 200, f"HTTP {r.status_code}")

    # 8. Delete profile
    print("\n8. Persistent profile deletion")
    r = requests.delete(f"{BASE}/v1/voices/profile/{profile_key}")
    check(f"DELETE /v1/voices/profile/{profile_key} -> 200", r.status_code == 200, f"HTTP {r.status_code}")

    # 9. Voice cloning
    print("\n9. Voice cloning")
    clone_wav = Path("/tmp/omnivoice-test-clone.wav")
    _make_test_wav(clone_wav)
    r = requests.post(
        f"{BASE}/v1/voices/clone",
        files={"ref_audio": ("test.wav", clone_wav.read_bytes(), "audio/wav")},
        data={"voice_id": "test-clone", "ref_text": "Hello, this is my voice."},
    )
    check("POST /v1/voices/clone -> 200", r.status_code == 200, f"HTTP {r.status_code}")
    clone_id = r.json().get("id")
    check("clone id returned", bool(clone_id))
    print(f"         clone id = {clone_id}")

    # 10. Delete cloned voice
    print("\n10. Delete cloned voice")
    r = requests.delete(f"{BASE}/v1/voices/clone/test-clone")
    check("DELETE /v1/voices/clone/test-clone -> 200", r.status_code == 200, f"HTTP {r.status_code}")

    # 11. TTS with extra generation parameters
    print("\n11. TTS (extra generation parameters)")
    r = requests.post(
        f"{BASE}/v1/audio/speech",
        json={
            "input": "Testing extra parameters.",
            "voice": "alloy",
            "language": "en",
            "num_step": 16,
            "position_temperature": 1.0,
            "class_temperature": 0.2,
        },
    )
    check("POST /v1/audio/speech (extra params) -> 200", r.status_code == 200, f"HTTP {r.status_code}")
    wav_path = Path("/tmp/omnivoice-test-params.wav")
    wav_path.write_bytes(r.content)
    print(f"         Saved to {wav_path}")

    print("\nAll tests passed.")


if __name__ == "__main__":
    main()
