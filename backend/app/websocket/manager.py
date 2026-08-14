import asyncio
from fastapi import WebSocket
from app.database import SessionLocal
from app.services.meeting_service import leave_meeting

class ConnectionManager:
    def __init__(self):
        # { meeting_id: [ (websocket, participant_id), ... ] }
        self.active_connections: dict[str, list[tuple[WebSocket, int]]] = {}
        # { participant_id: asyncio.Task }
        self.pending_disconnects: dict[int, asyncio.Task] = {}

    async def connect(self, meeting_id: str, websocket: WebSocket, participant_id: int):
        await websocket.accept()
        if meeting_id not in self.active_connections:
            self.active_connections[meeting_id] = []
        self.active_connections[meeting_id].append((websocket, participant_id))
        
        # Cancel any pending disconnect for this participant
        if participant_id in self.pending_disconnects:
            self.pending_disconnects[participant_id].cancel()
            del self.pending_disconnects[participant_id]

    async def _handle_disconnect_grace_period(self, meeting_id: str, participant_id: int):
        try:
            await asyncio.sleep(5)  # 5 second grace period
            
            # If we wake up and haven't been cancelled, the user actually left
            db = SessionLocal()
            try:
                leave_meeting(db, participant_id)
            finally:
                db.close()
                
            # Broadcast that the participant left
            await self.broadcast(meeting_id, {
                "type": "participant-left",
                "participant_id": participant_id
            })
            
        except asyncio.CancelledError:
            # Task was cancelled because the user reconnected
            pass
        finally:
            if participant_id in self.pending_disconnects:
                del self.pending_disconnects[participant_id]

    def disconnect(self, meeting_id: str, websocket: WebSocket, participant_id: int):
        if meeting_id in self.active_connections:
            self.active_connections[meeting_id] = [
                conn for conn in self.active_connections[meeting_id] if conn[0] != websocket
            ]
            if not self.active_connections[meeting_id]:
                del self.active_connections[meeting_id]
                
        # Schedule the delayed leave
        task = asyncio.create_task(self._handle_disconnect_grace_period(meeting_id, participant_id))
        self.pending_disconnects[participant_id] = task

    async def broadcast(self, meeting_id: str, message: dict, exclude_websocket: WebSocket = None):
        if meeting_id in self.active_connections:
            for connection, _ in self.active_connections[meeting_id]:
                if connection != exclude_websocket:
                    try:
                        await connection.send_json(message)
                    except Exception as e:
                        print(f"Error broadcasting to a client: {e}")

manager = ConnectionManager()
