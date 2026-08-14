import random
from sqlalchemy.orm import Session
from app.models.models import Meeting, MeetingType, MeetingStatus, Participant, User
from app.schemas.schemas import MeetingCreateInstant, MeetingCreateScheduled, ParticipantBase
from datetime import datetime, timezone


def generate_meeting_id(db: Session) -> str:
    """
    Always returns a plain 9-digit string with NO spaces.
    This is the single source of truth for meeting_id format —
    every creation path must call this function, never generate
    an ID inline.
    """
    while True:
        code = f"{random.randint(100, 999)}{random.randint(100, 999)}{random.randint(100, 999)}"
        exists = db.query(Meeting).filter(Meeting.meeting_id == code).first()
        if not exists:
            return code


def create_instant_meeting(db: Session, meeting_in: MeetingCreateInstant):
    meeting_id = generate_meeting_id(db)
    new_meeting = Meeting(
        meeting_id=meeting_id,
        host_id=meeting_in.host_id,
        title=meeting_in.title or f"Instant Meeting {meeting_id}",
        description=meeting_in.description,
        type=MeetingType.instant,
        status=MeetingStatus.active,
        invite_link=f"http://localhost:3000/j/{meeting_id}",
    )
    db.add(new_meeting)
    db.commit()
    db.refresh(new_meeting)
    return new_meeting


def create_scheduled_meeting(db: Session, meeting_in: MeetingCreateScheduled):
    meeting_id = generate_meeting_id(db)
    new_meeting = Meeting(
        meeting_id=meeting_id,
        host_id=meeting_in.host_id,
        title=meeting_in.title or f"Scheduled Meeting {meeting_id}",
        description=meeting_in.description,
        type=MeetingType.scheduled,
        status=MeetingStatus.scheduled,
        scheduled_at=meeting_in.scheduled_at,
        duration_minutes=meeting_in.duration_minutes,
        invite_link=f"http://localhost:3000/j/{meeting_id}",
    )
    db.add(new_meeting)
    db.commit()
    db.refresh(new_meeting)
    return new_meeting


def get_meeting(db: Session, meeting_id_str: str):
    return db.query(Meeting).filter(Meeting.meeting_id == meeting_id_str).first()


def get_upcoming_meetings(db: Session):
    now = datetime.now(timezone.utc)
    return db.query(Meeting).filter(
        Meeting.status == MeetingStatus.scheduled,
        Meeting.scheduled_at > now
    ).order_by(Meeting.scheduled_at.asc()).all()


def get_recent_meetings(db: Session, user_id: int):
    participations = db.query(Participant).filter(
        Participant.user_id == user_id
    ).order_by(Participant.joined_at.desc()).all()

    seen_meeting_pks = []
    recent_meetings = []
    for p in participations:
        if p.meeting_id not in seen_meeting_pks:
            seen_meeting_pks.append(p.meeting_id)
            if p.meeting.status in (MeetingStatus.ended, MeetingStatus.active):
                recent_meetings.append(p.meeting)
    return recent_meetings


def get_meeting_participants(db: Session, meeting_pk: int):
    """
    NOTE: this takes the internal integer Meeting.id (the FK used on
    Participant.meeting_id), NOT the human-facing meeting_id string.
    Callers must pass db_meeting.id here, e.g.:
        db_meeting = get_meeting(db, meeting_id_str)
        participants = get_meeting_participants(db, db_meeting.id)
    """
    return db.query(Participant).filter(
        Participant.meeting_id == meeting_pk,
        Participant.left_at.is_(None)
    ).all()


def join_meeting(db: Session, db_meeting: Meeting, participant_in: ParticipantBase):
    if participant_in.user_id:
        existing_p = db.query(Participant).filter(
            Participant.meeting_id == db_meeting.id,
            Participant.user_id == participant_in.user_id,
            Participant.left_at.is_(None)
        ).first()
        if existing_p:
            return existing_p

    p = Participant(
        meeting_id=db_meeting.id,
        user_id=participant_in.user_id,
        display_name=participant_in.display_name,
        is_host=(participant_in.user_id == db_meeting.host_id if participant_in.user_id else False),
    )
    db.add(p)
    db.commit()
    db.refresh(p)
    return p


def leave_meeting(db: Session, participant_id: int):
    p = db.query(Participant).filter(Participant.id == participant_id).first()
    if p and not p.left_at:
        p.left_at = datetime.now(timezone.utc)
        db.commit()
        db.refresh(p)
    return p

def update_participant_media_state(db: Session, participant_id: int, mic_on: bool | None = None, camera_on: bool | None = None):
    p = db.query(Participant).filter(Participant.id == participant_id).first()
    if p:
        if mic_on is not None:
            p.mic_on = mic_on
        if camera_on is not None:
            p.camera_on = camera_on
        db.commit()
        db.refresh(p)
    return p