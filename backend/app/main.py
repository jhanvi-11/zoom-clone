from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from datetime import datetime, timedelta, timezone

from app import database
from app.routers import meetings

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Create tables if they don't exist
    from app.models.models import Base, User, Meeting, Participant, MeetingType, MeetingStatus
    from app.services.meeting_service import generate_meeting_id
    
    Base.metadata.create_all(bind=database.engine)
    
    db = database.SessionLocal()
    try:
        # Seed logic: if meetings table is empty
        if db.query(Meeting).count() == 0:
            print("Seeding database...")
            
            # Default User
            default_user = db.query(User).filter(User.id == 1).first()
            if not default_user:
                default_user = User(name="Default User", email="default@example.com")
                db.add(default_user)
                db.commit()
                db.refresh(default_user)
                
            now = datetime.now(timezone.utc)
            
            # 3 sample upcoming meetings
            for i in range(1, 4):
                m = Meeting(
                    meeting_id=generate_meeting_id(db),
                    host_id=default_user.id,
                    title=f"Upcoming Meeting {i}",
                    type=MeetingType.scheduled,
                    status=MeetingStatus.scheduled,
                    scheduled_at=now + timedelta(days=i),
                    duration_minutes=60,
                    invite_link=f"http://localhost:3000/j/upcoming{i}"
                )
                db.add(m)
            
            # 2 sample recent meetings
            for i in range(1, 3):
                m = Meeting(
                    meeting_id=generate_meeting_id(db),
                    host_id=default_user.id,
                    title=f"Recent Meeting {i}",
                    type=MeetingType.instant,
                    status=MeetingStatus.ended,
                    created_at=now - timedelta(days=i, hours=1),
                    ended_at=now - timedelta(days=i),
                    invite_link=f"http://localhost:3000/j/recent{i}"
                )
                db.add(m)
                db.commit()
                db.refresh(m)
                
                p = Participant(
                    meeting_id=m.id,
                    user_id=default_user.id,
                    display_name=default_user.name,
                    is_host=True,
                    joined_at=now - timedelta(days=i, hours=1),
                    left_at=now - timedelta(days=i)
                )
                db.add(p)
                
            db.commit()
            print("Seeding complete.")
    finally:
        db.close()
        
    yield
    # Shutdown logic (if any)

app = FastAPI(title="Zoom Clone API", lifespan=lifespan)

origins = [
    "http://localhost:3000",
    "https://your-production-vercel-url.vercel.app",  # Placeholder production Vercel URL
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(meetings.router)

@app.get("/health")
def health_check():
    return {"status": "ok"}

from fastapi import WebSocket, WebSocketDisconnect
from app.websocket.manager import manager

@app.websocket("/ws/meetings/{meeting_id}")
async def websocket_endpoint(websocket: WebSocket, meeting_id: str, participant_id: int):
    await manager.connect(meeting_id, websocket, participant_id)
    try:
        # Broadcast that the participant joined
        await manager.broadcast(meeting_id, {
            "type": "participant-joined",
            "participant_id": participant_id
        }, exclude_websocket=websocket)
        
        while True:
            # Wait for any message from the client
            data = await websocket.receive_json()
            # Broadcast the received message to everyone else in the room
            await manager.broadcast(meeting_id, data, exclude_websocket=websocket)
            
    except WebSocketDisconnect:
        manager.disconnect(meeting_id, websocket, participant_id)

