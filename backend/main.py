import socketio
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from config import settings
from database import create_tables
from services.auth_service import warm_jwks_cache, refresh_jwks_cache
from socket_events.party import PartyNamespace

# socket.io server — has to be created before the fastapi app so we can
# wrap both of them together at the bottom with ASGIApp
sio = socketio.AsyncServer(
    async_mode="asgi",
    cors_allowed_origins=[settings.frontend_origin],  # only the frontend can connect
)
sio.register_namespace(PartyNamespace("/party"))

# fastapi app — handles all the REST endpoints
app = FastAPI(title="Card Clash API", version="0.1.0")

# allow the frontend to make cross-origin requests, otherwise browsers block everything
app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.frontend_origin],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
async def startup():
    # ensure db tables exist (no-op if they're already there)
    await create_tables()
    # pre-fetch Supabase public keys so socket auth never blocks on an HTTP call
    await warm_jwks_cache()
    print("[server] Ready")


@app.get("/health")
async def health():
    return {"status": "ok"}


@app.post("/auth/refresh-jwks")
async def refresh_jwks():
    """Force a JWKS cache refresh if Supabase rotated its signing keys.

    Call this if socket connections start failing with 'kid not in cache' errors.
    """
    await refresh_jwks_cache()
    return {"status": "ok", "message": "JWKS cache refreshed"}


# combined_app wraps both fastapi and socket.io into one ASGI app on port 8000
# always run with: uvicorn main:combined_app
# do NOT use main:app or socket.io won't be active
combined_app = socketio.ASGIApp(sio, other_asgi_app=app, socketio_path="/socket.io")
