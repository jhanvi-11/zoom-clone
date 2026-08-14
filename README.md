# Zoom Clone

## 1. Overview
A Zoom-style video conferencing web application clone built as an assignment. It replicates core meeting workflows including instant meetings, scheduled meetings, joining rooms, and live multi-participant video and audio streaming.

## 2. Tech Stack
- **Frontend**: Next.js (App Router, TypeScript), Tailwind CSS
- **Backend**: FastAPI, SQLAlchemy, Pydantic
- **Database**: SQLite
- **Real-time**: WebSocket (signaling) + native WebRTC (peer-to-peer audio/video)
- **Deployment**: Frontend on Vercel, Backend on Render

## 3. Features Implemented

### Core Workflows (Completed)
- Dashboard displaying upcoming and recent meetings
- Instant meeting creation with an auto-generated meeting ID and invite link
- Scheduled meetings with date, time, and duration
- Join flow via meeting ID or invite link with display name entry and validation

### Real-time Meeting Room (Completed)
- Live camera/mic integration via `getUserMedia`
- Mute/camera toggle buttons
- WebSocket-based live participant presence (join/leave updates without requiring page refresh)
- Peer-to-peer WebRTC video/audio between multiple participants using a mesh topology with STUN for NAT traversal

### Not Yet Implemented (Scoped Out)
- Mute/camera-off state sync to remote participants' tiles and the participants panel
- Host moderation controls (mute all / remove participant)
- In-meeting chat functionality
- Full responsive/mobile pass
- User authentication (login/signup)

## 4. Architecture
- **REST API**: Handles persistent application data including meetings, scheduling, and participants.
- **WebSocket**: Used exclusively for real-time signaling (presence events and relaying WebRTC offer/answer/ICE messages). It does **not** carry any audio/video data.
- **WebRTC**: Establishes a direct peer-to-peer connection between browsers for actual media transmission. The backend server never processes or routes video/audio streams.
- **Database**: SQLite stores Users, Meetings, and Participants.

```text
+----------------+          REST (App Data)         +----------------+
|                |  ----------------------------->  |                |
|  Browser       |                                  |  FastAPI       |
|  (Next.js App) |          WebSocket (Signaling)   |  (Backend)     |
|                |  <---------------------------->  |                |
+-------+--------+                                  +----------------+
        ^
        |
        | WebRTC via STUN (Media)
        |
        v
+-------+--------+
|                |
|  Browser       |
|  (Peer)        |
|                |
+----------------+
```

## 5. Database Schema

### `users`
| Column | Type | Notes |
| :--- | :--- | :--- |
| `id` | Integer | Primary Key |
| `name` | String | |
| `email` | String | |
| `avatar_url` | String | |
| `created_at` | DateTime | |

### `meetings`
| Column | Type | Notes |
| :--- | :--- | :--- |
| `id` | Integer | Primary Key (Internal DB ID) |
| `meeting_id` | String | Unique human-facing code (no spaces) |
| `title` | String | |
| `description` | String | |
| `host_id` | Integer | Foreign Key to `users.id` |
| `type` | Enum | "instant" or "scheduled" |
| `status` | Enum | "scheduled", "active", or "ended" |
| `scheduled_at`| DateTime| |
| `duration_minutes` | Integer | |
| `invite_link` | String | |
| `created_at` | DateTime| |
| `ended_at` | DateTime| |

### `participants`
| Column | Type | Notes |
| :--- | :--- | :--- |
| `id` | Integer | Primary Key |
| `meeting_id` | Integer | Foreign Key to `meetings.id` |
| `user_id` | Integer | Foreign Key to `users.id` (nullable for guests) |
| `display_name` | String | |
| `is_host` | Boolean | |
| `mic_on` | Boolean | |
| `camera_on` | Boolean | |
| `joined_at` | DateTime | |
| `left_at` | DateTime | |

**Relationships:** 
A **User** hosts many **Meetings**; a **Meeting** has many **Participants**; a **Participant** may optionally be linked to a **User** (guests can join with just a display name).

## 6. Setup Instructions

### 1. Clone the repository
```bash
git clone <your-repo-url>
cd zoom-clone
```

### 2. Backend Setup
Navigate to the backend directory and install dependencies:
```bash
cd backend
python -m venv venv
# Windows: venv\Scripts\activate | Mac/Linux: source venv/bin/activate
pip install -r requirements.txt
```
*(Note: Use `--break-system-packages` if required by your specific local Python environment.)*

**Set Environment Variables:**
You can optionally set `ALLOWED_ORIGINS` for CORS. By default, it allows `http://localhost:3000`.

**Run the Backend:**
```bash
uvicorn app.main:app --reload
```
*Note: On its very first startup, the application automatically creates the SQLite database and auto-seeds sample data (a default user and sample meetings). No manual seeding is required!*

### 3. Frontend Setup
In a new terminal window, navigate to the frontend directory:
```bash
cd frontend
npm install
```

**Set Environment Variables (`frontend/.env.local`):**
```env
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_WS_URL=ws://localhost:8000
```

**Run the Frontend:**
```bash
npm run dev
```
Access the application at `http://localhost:3000`.

## 7. Assumptions & Scoping Decisions
These are deliberate architectural and scoping choices made for the assignment context:

- **No authentication implemented:** A single default user is auto-seeded into the database and treated as "logged in" globally, strictly adhering to the assignment's explicit allowance to skip auth.
- **Mesh WebRTC topology (not an SFU):** This implementation utilizes a full mesh peer-to-peer topology. This is appropriate and efficient for a small number of participants at this scope. A production system operating at scale would require an SFU (Selective Forwarding Unit) like LiveKit, mediasoup, or Janus to reduce bandwidth overhead.
- **STUN only, no TURN server:** Relying solely on STUN is sufficient for most standard NAT traversal situations in this assignment. A production environment would add a TURN server (e.g., coturn or a managed provider) to guarantee connections for participants stuck behind restrictive or symmetric NATs.
- **In-memory WebSocket signaling state:** WebSocket room state is stored in memory, requiring a single backend instance deployment. This is correct for the deployment scope. True horizontal scaling would require moving this state out to a Redis-backed pub/sub layer so multiple backend instances can share room state.
- **`getUserMedia` HTTPS requirement:** Accessing cameras and microphones strictly requires HTTPS in production, which Vercel provides automatically. Localhost development environments are exempted from this rule by modern browsers.

## 8. Known Limitations
- Mic/camera mute state doesn't yet sync live to other participants' tiles or the participants panel (local-only toggle for now).
- No host moderation controls yet (mute all / remove participant).
- Limited mobile/responsive testing.
- Backend free-tier hosting may cold-start on the first request after periods of inactivity.

## 9. Live Links
- **Deployed frontend:** https://zoom-clone-murex-ten.vercel.app/
- **Deployed backend:** https://zoom-clone-xqv2.onrender.com/health
- **GitHub repo:** https://github.com/jhanvi-11/zoom-clone