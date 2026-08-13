export type MeetingType = "instant" | "scheduled";
export type MeetingStatus = "scheduled" | "active" | "ended";

export interface Meeting {
  id: number;
  meeting_id: string;
  host_id: number;
  title?: string;
  description?: string;
  type: MeetingType;
  status: MeetingStatus;
  scheduled_at?: string | null;
  duration_minutes?: number | null;
  invite_link?: string | null;
  created_at: string;
  ended_at?: string | null;
}

export interface Participant {
  id: number;
  meeting_id: number;
  is_host: boolean;
  mic_on: boolean;
  camera_on: boolean;
  joined_at: string;
  left_at?: string | null;
  display_name: string;
  user_id?: number | null;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export async function createInstantMeeting(hostId: number): Promise<Meeting> {
  const res = await fetch(`${API_URL}/meetings`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ host_id: hostId }),
  });
  if (!res.ok) throw new Error("Failed to create meeting");
  return res.json();
}

export async function getUpcomingMeetings(): Promise<Meeting[]> {
  const res = await fetch(`${API_URL}/meetings/upcoming`);
  if (!res.ok) throw new Error("Failed to fetch upcoming meetings");
  return res.json();
}

export async function getRecentMeetings(): Promise<Meeting[]> {
  const res = await fetch(`${API_URL}/meetings/recent`);
  if (!res.ok) throw new Error("Failed to fetch recent meetings");
  return res.json();
}
