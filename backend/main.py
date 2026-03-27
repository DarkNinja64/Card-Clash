import socketio
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from config import settings
from database import create_tables
from routers.auth import router as auth_router
from routers.sessions import router as sessions_router
from socket_events.game import register_handlers
from socket_events.party import PartyNamespace

# socket.io server — has to be created before the fastapi app so we can
# wrap both of them together at the bottom with ASGIApp
sio = socketio.AsyncServer(
    async_mode="asgi",
    cors_allowed_origins=[settings.frontend_origin],  # only the frontend can connect
)
register_handlers(sio)  # wire up all the game event handlers from socket_events/game.py
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

app.include_router(auth_router)
app.include_router(sessions_router)


@app.on_event("startup")
async def startup():
    # runs once when the server boots — makes sure all db tables exist before requests come in
    await create_tables()
    print("[server] Tables ready")


@app.get("/health")
async def health():
    # simple ping endpoint, useful for checking if the server is up
    return {"status": "ok"}


# combined_app wraps both fastapi and socket.io into one ASGI app on port 8000
# always run with: uvicorn main:combined_app
# do NOT use main:app or socket.io won't be active
combined_app = socketio.ASGIApp(sio, other_asgi_app=app, socketio_path="/socket.io")
