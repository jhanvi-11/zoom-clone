from fastapi import WebSocket

class ConnectionManager:
    def __init__(self):
        # { meeting_id: [ (websocket, participant_id), ... ] }
        self.active_connections: dict[str, list[tuple[WebSocket, int]]] = {}

    async def connect(self, meeting_id: str, websocket: WebSocket, participant_id: int):
        await websocket.accept()
        if meeting_id not in self.active_connections:
            self.active_connections[meeting_id] = []
        self.active_connections[meeting_id].append((websocket, participant_id))

    def disconnect(self, meeting_id: str, websocket: WebSocket):
        if meeting_id in self.active_connections:
            self.active_connections[meeting_id] = [
                conn for conn in self.active_connections[meeting_id] if conn[0] != websocket
            ]
            if not self.active_connections[meeting_id]:
                del self.active_connections[meeting_id]

    async def broadcast(self, meeting_id: str, message: dict, exclude_websocket: WebSocket = None):
        if meeting_id in self.active_connections:
            for connection, _ in self.active_connections[meeting_id]:
                if connection != exclude_websocket:
                    try:
                        await connection.send_json(message)
                    except Exception as e:
                        print(f"Error broadcasting to a client: {e}")

manager = ConnectionManager()
