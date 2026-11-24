"""Offline English + Nepali text-to-speech API.
    POST /api/v1/tts     text -> audio/wav
    GET  /api/v1/voices  list voices
    GET  /api/health     health check (no login)
    GET  /api/docs       interactive docs
Settings:  config.json (login, ports, limits)  +  model.config.json (voices shown to users).
They are looked up next to this file first (deployed), then one folder up (dev: project root).
"""
import asyncio
import io
import json
import os
import secrets
import threading
import wave
from contextlib import asynccontextmanager
from pathlib import Path
from typing import Literal

from fastapi import APIRouter, Depends, FastAPI, Header, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response
from fastapi.security import HTTPBasic, HTTPBasicCredentials
from piper import PiperVoice, SynthesisConfig
from pydantic import BaseModel, Field
from starlette.concurrency import run_in_threadpool

APP_DIR = Path(__file__).resolve().parent  # api folder (deployed: public\api, dev: <root>\api)


def find_path(name: str) -> Path:
    for d in (os.getenv("TTS_CONFIG_DIR"), APP_DIR, APP_DIR.parent):
        if d and (Path(d) / name).is_file():
            return Path(d) / name
    raise RuntimeError(f"{name} not found next to {APP_DIR} or in its parent folder")


def load_json(name: str) -> dict:
    return json.loads(find_path(name).read_text(encoding="utf-8-sig"))


CONFIG_PATH = find_path("config.json")   # the default voices are saved back into this file
CONFIG = load_json("config.json")
MODELS = load_json("model.config.json")

USERNAME = os.getenv("TTS_USERNAME", CONFIG.get("username", ""))
PASSWORD = os.getenv("TTS_PASSWORD", CONFIG.get("password", ""))
# Extra API keys (X-API-Key header). Env TTS_API_KEYS is comma separated.
API_KEYS = set(CONFIG.get("api_keys", [])) | {k.strip() for k in os.getenv("TTS_API_KEYS", "").split(",") if k.strip()}

HOSTS = [h.strip() for h in CONFIG.get("hosts", []) if h.strip()]
# Browser pages on these origins may call the API (the UI when it is served from another port/site).
CORS_ORIGINS = [f"http://{h}:{CONFIG['ui_port']}" for h in HOSTS if CONFIG.get("ui_port")] + list(CONFIG.get("cors_origins", []))
MAX_WORDS = int(CONFIG.get("max_words", 5000))  # words per request; no character cap
TRUST_PROXY = bool(CONFIG.get("trust_proxy_headers", True))  # IIS passes the real IP in X-Forwarded-For
QUEUE_TIMEOUT = float(CONFIG.get("queue_timeout_seconds", 300))

# --- voices -------------------------------------------------------------------
# model.config.json -> "voices": {id: {lang, label, path, speaker_id?}}, "default_voices": {en: id, ne: id}
VOICES: dict[str, dict] = MODELS["voices"]
# default voice per language: saved in config.json ("default_voices"); PUT /api/v1/defaults changes it
DEFAULTS: dict[str, str] = dict(CONFIG.get("default_voices") or MODELS.get("default_voices") or {})
for _lang, _vid in DEFAULTS.items():
    if _vid not in VOICES or VOICES[_vid]["lang"] != _lang:
        raise RuntimeError(f"default_voices.{_lang} = '{_vid}' is not a '{_lang}' voice in model.config.json")

_models: dict[str, PiperVoice] = {}  # one loaded model per .onnx file (shared by its speakers)
_models_lock = threading.Lock()


def get_model(voice_id: str) -> PiperVoice:
    """Models are loaded on first use (defaults are preloaded at startup)."""
    path = str(APP_DIR / VOICES[voice_id]["path"])
    with _models_lock:
        if path not in _models:
            _models[path] = PiperVoice.load(path)
        return _models[path]


def is_devanagari(ch: str) -> bool:
    return "ऀ" <= ch <= "ॿ"


def is_latin(ch: str) -> bool:
    return ("A" <= ch <= "Z") or ("a" <= ch <= "z")


def split_by_script(text: str) -> list[tuple[str, str]]:
    """Split mixed text into (lang, chunk) runs. Neutral chars join the current run."""
    runs: list[tuple[str, str]] = []
    cur_lang, buf = None, []
    for ch in text:
        lang = "ne" if is_devanagari(ch) else "en" if is_latin(ch) else None
        if lang and cur_lang and lang != cur_lang:
            runs.append((cur_lang, "".join(buf)))
            buf = []
        if lang:
            cur_lang = lang
        buf.append(ch)
    if buf:
        runs.append((cur_lang or "en", "".join(buf)))
    return [(l, t.strip()) for l, t in runs if t.strip()]


# --- app ----------------------------------------------------------------------
security = HTTPBasic(auto_error=False)
app = FastAPI(title="Offline TTS (English + Nepali)", version="2.0",
              docs_url="/api/docs", redoc_url=None, openapi_url="/api/openapi.json")
if CORS_ORIGINS:
    app.add_middleware(
        CORSMiddleware,
        allow_origins=CORS_ORIGINS,
        allow_methods=["GET", "POST", "PUT"],
        allow_headers=["Authorization", "Content-Type", "X-API-Key"],
    )
api = APIRouter()  # mounted under /api (and, hidden, at the root as a fallback for hosts that strip the prefix)


@app.on_event("startup")
def preload_defaults() -> None:
    for vid in DEFAULTS.values():
        get_model(vid)


def check_key(
    x_api_key: str | None = Header(default=None),
    creds: HTTPBasicCredentials | None = Depends(security),
) -> None:
    """Allow if auth is not configured, or a valid API key, or valid username/password."""
    if not (API_KEYS or (USERNAME and PASSWORD)):
        return
    if x_api_key and any(secrets.compare_digest(x_api_key, k) for k in API_KEYS):
        return
    if creds and USERNAME and secrets.compare_digest(creds.username, USERNAME) \
            and secrets.compare_digest(creds.password, PASSWORD):
        return
    raise HTTPException(401, "Invalid credentials", headers={"WWW-Authenticate": "Basic"})


class TTSRequest(BaseModel):
    text: str = Field(min_length=1)
    lang: Literal["auto", "en", "ne"] = "auto"
    voice: str | None = Field(None, description="One voice id from GET /api/v1/voices (its language only).")
    voices: dict[Literal["en", "ne"], str] | None = Field(
        None, description='Pick both at once, e.g. {"en": "en_US-amy-medium", "ne": "ne_NP-google-2"}.')
    speed: float = Field(1.0, ge=0.5, le=2.0, description="1.0 normal, 2.0 twice as fast")


def synthesize(text: str, lang: str, voice: str | None, voices: dict | None, speed: float) -> bytes:
    chosen = dict(DEFAULTS)  # language -> voice id; starts as the config defaults
    picks = dict(voices or {})
    if voice:
        if voice not in VOICES:
            raise HTTPException(422, f"Unknown voice '{voice}'. See GET /api/v1/voices")
        picks[VOICES[voice]["lang"]] = voice
    for plang, vid in picks.items():
        if vid not in VOICES:
            raise HTTPException(422, f"Unknown voice '{vid}'. See GET /api/v1/voices")
        if VOICES[vid]["lang"] != plang:
            raise HTTPException(422, f"Voice '{vid}' is a '{VOICES[vid]['lang']}' voice, not '{plang}'")
        if lang not in ("auto", plang) and voice == vid:
            raise HTTPException(422, f"Voice '{vid}' is a '{plang}' voice but lang='{lang}'")
        chosen[plang] = vid

    parts = [(lang, text)] if lang != "auto" else split_by_script(text)
    if not parts:
        raise HTTPException(422, "No speakable text")

    pcm, rate = bytearray(), 22050
    for l, chunk in parts:
        entry = VOICES[chosen[l]]
        model = get_model(chosen[l])
        rate = model.config.sample_rate
        cfg = SynthesisConfig(length_scale=1.0 / speed, speaker_id=entry.get("speaker_id"))
        for ac in model.synthesize(chunk, syn_config=cfg):
            pcm += ac.audio_int16_bytes
        pcm += b"\x00\x00" * int(rate * 0.15)  # short pause between segments
    out = io.BytesIO()
    with wave.open(out, "wb") as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(rate)
        w.writeframes(bytes(pcm))
    return out.getvalue()


# --- one job at a time per client IP -------------------------------------------
# If the same IP sends a new request while its previous one is still being
# generated, the new request waits (FIFO) until the previous one finishes.
# Different IPs are served in parallel.
_slots: dict[str, list] = {}  # ip -> [asyncio.Lock, waiting+running count]


def client_ip(request: Request) -> str:
    if TRUST_PROXY:
        fwd = request.headers.get("x-forwarded-for")
        if fwd:
            return fwd.split(",")[0].strip()
    return request.client.host if request.client else "unknown"


@asynccontextmanager
async def ip_slot(ip: str):
    entry = _slots.setdefault(ip, [asyncio.Lock(), 0])
    entry[1] += 1
    try:
        try:
            await asyncio.wait_for(entry[0].acquire(), QUEUE_TIMEOUT)
        except asyncio.TimeoutError:
            raise HTTPException(429, "Previous request from this IP is still running; try again")
        try:
            yield
        finally:
            entry[0].release()
    finally:
        entry[1] -= 1
        if entry[1] == 0:
            _slots.pop(ip, None)


# --- API routes (/api/...) -----------------------------------------------------
@app.get("/api", include_in_schema=False)
@app.get("/", include_in_schema=False)
def api_info() -> dict:
    return {
        "service": "Offline TTS (English + Nepali)",
        "status": "ok",
        "max_words": MAX_WORDS,
        "endpoints": {
            "POST /api/v1/tts": "text -> audio/wav (Basic auth or X-API-Key)",
            "GET /api/v1/voices": "list voices",
            "GET|PUT /api/v1/defaults": "read / change the default English + Nepali voice (saved in config.json)",
            "GET /api/health": "health check (no login)",
            "GET /api/docs": "interactive docs",
        },
    }


@api.post("/v1/tts", dependencies=[Depends(check_key)], response_class=Response)
async def tts(req: TTSRequest, request: Request) -> Response:
    words = len(req.text.split())
    if words > MAX_WORDS:
        raise HTTPException(413, f"Text too long: {words} words (max {MAX_WORDS})")
    async with ip_slot(client_ip(request)):
        audio = await run_in_threadpool(synthesize, req.text, req.lang, req.voice, req.voices, req.speed)
    return Response(audio, media_type="audio/wav")


@api.get("/v1/voices", dependencies=[Depends(check_key)])
def list_voices() -> dict:
    return {
        "max_words": MAX_WORDS,
        "voices": [
            {"id": vid, "lang": v["lang"], "label": v.get("label", vid), "default": DEFAULTS.get(v["lang"]) == vid}
            for vid, v in VOICES.items()
        ],
    }


class DefaultsBody(BaseModel):
    en: str | None = Field(None, description="Default English voice id")
    ne: str | None = Field(None, description="Default Nepali voice id")


_cfg_lock = threading.Lock()


def save_defaults() -> None:
    """Write the current defaults into config.json (keeps every other setting)."""
    with _cfg_lock:
        data = json.loads(CONFIG_PATH.read_text(encoding="utf-8-sig"))
        data["default_voices"] = dict(DEFAULTS)
        CONFIG_PATH.write_text(json.dumps(data, indent=4, ensure_ascii=False) + "\n", encoding="utf-8")


@api.get("/v1/defaults", dependencies=[Depends(check_key)])
def get_defaults() -> dict:
    return {"default_voices": DEFAULTS}


@api.put("/v1/defaults", dependencies=[Depends(check_key)])
def set_defaults(body: DefaultsBody) -> dict:
    """Choose the default English / Nepali voice. Saved in config.json, so API calls without
    "voice"/"voices" use it (also after a restart)."""
    new = {lang: vid for lang, vid in body.model_dump().items() if vid}
    for lang, vid in new.items():
        if vid not in VOICES:
            raise HTTPException(422, f"Unknown voice '{vid}'. See GET /api/v1/voices")
        if VOICES[vid]["lang"] != lang:
            raise HTTPException(422, f"Voice '{vid}' is a '{VOICES[vid]['lang']}' voice, not '{lang}'")
    old = dict(DEFAULTS)
    DEFAULTS.update(new)
    try:
        for vid in new.values():
            get_model(vid)              # load now so the next request is fast
        save_defaults()
    except OSError as e:
        DEFAULTS.clear(); DEFAULTS.update(old)
        raise HTTPException(500, f"Could not write {CONFIG_PATH.name}: {e}. Give the app pool Modify permission on it.")
    return {"default_voices": DEFAULTS}


@api.get("/health")
def health() -> dict:
    return {"status": "ok", "voices_available": len(VOICES), "voices_loaded": len(_models)}


app.include_router(api, prefix="/api")
app.include_router(api, include_in_schema=False)  # fallback: same routes without the /api prefix
