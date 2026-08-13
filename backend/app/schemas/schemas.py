from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
from app.models.models import MeetingType, MeetingStatus

class UserBase(BaseModel):
    name: str
    email: str
    avatar_url: Optional[str] = None

class UserResponse(UserBase):
    id: int
    created_at: datetime
    class Config:
        from_attributes = True

class MeetingBase(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None

class MeetingCreateInstant(MeetingBase):
    host_id: int

class MeetingCreateScheduled(MeetingBase):
    host_id: int
    scheduled_at: datetime
    duration_minutes: int

class MeetingResponse(MeetingBase):
    id: int
    meeting_id: str
    host_id: int
    type: MeetingType
    status: MeetingStatus
    scheduled_at: Optional[datetime] = None
    duration_minutes: Optional[int] = None
    invite_link: Optional[str] = None
    created_at: datetime
    ended_at: Optional[datetime] = None
    class Config:
        from_attributes = True

class ParticipantBase(BaseModel):
    display_name: str
    user_id: Optional[int] = None

class ParticipantResponse(ParticipantBase):
    id: int
    meeting_id: int
    is_host: bool
    mic_on: bool
    camera_on: bool
    joined_at: datetime
    left_at: Optional[datetime] = None
    class Config:
        from_attributes = True
