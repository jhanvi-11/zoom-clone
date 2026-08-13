from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from app.database import SessionLocal
from app.schemas.schemas import (
    MeetingCreateInstant, MeetingCreateScheduled, MeetingResponse,
    ParticipantBase, ParticipantResponse
)
from app.services import meeting_service

router = APIRouter(prefix="/meetings", tags=["meetings"])

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.post("", response_model=MeetingResponse)
def create_instant_meeting(meeting: MeetingCreateInstant, db: Session = Depends(get_db)):
    return meeting_service.create_instant_meeting(db, meeting)

@router.post("/schedule", response_model=MeetingResponse)
def create_scheduled_meeting(meeting: MeetingCreateScheduled, db: Session = Depends(get_db)):
    return meeting_service.create_scheduled_meeting(db, meeting)

@router.get("/upcoming", response_model=List[MeetingResponse])
def get_upcoming_meetings(db: Session = Depends(get_db)):
    return meeting_service.get_upcoming_meetings(db)

@router.get("/recent", response_model=List[MeetingResponse])
def get_recent_meetings(db: Session = Depends(get_db)):
    # hardcoded default user_id = 1 for now as per prompt
    return meeting_service.get_recent_meetings(db, user_id=1)

@router.get("/{meeting_id}", response_model=MeetingResponse)
def get_meeting(meeting_id: str, db: Session = Depends(get_db)):
    db_meeting = meeting_service.get_meeting(db, meeting_id)
    if not db_meeting:
        raise HTTPException(status_code=404, detail="Meeting not found")
    return db_meeting

@router.get("/{meeting_id}/participants", response_model=List[ParticipantResponse])
def get_meeting_participants(meeting_id: str, db: Session = Depends(get_db)):
    db_meeting = meeting_service.get_meeting(db, meeting_id)
    if not db_meeting:
        raise HTTPException(status_code=404, detail="Meeting not found")
    return meeting_service.get_meeting_participants(db, db_meeting.id)

@router.post("/{meeting_id}/participants", response_model=ParticipantResponse)
def join_meeting(meeting_id: str, participant: ParticipantBase, db: Session = Depends(get_db)):
    db_meeting = meeting_service.get_meeting(db, meeting_id)
    if not db_meeting:
        raise HTTPException(status_code=404, detail="Meeting not found")
    return meeting_service.join_meeting(db, db_meeting, participant)

@router.post("/{meeting_id}/participants/{participant_id}/leave", response_model=ParticipantResponse)
def leave_meeting(meeting_id: str, participant_id: int, db: Session = Depends(get_db)):
    p = meeting_service.leave_meeting(db, participant_id)
    if not p:
        raise HTTPException(status_code=404, detail="Participant not found")
    return p
