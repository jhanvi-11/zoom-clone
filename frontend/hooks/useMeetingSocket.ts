import { useState, useEffect, useRef } from "react";

type ConnectionStatus = "connecting" | "connected" | "disconnected";

export function useMeetingSocket(meetingId: string, participantId?: number) {
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>("disconnected");
  const [lastMessage, setLastMessage] = useState<any>(null);
  const socketRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    if (!meetingId || !participantId) return;

    // Build the WebSocket URL (ws:// instead of http://)
    const apiUrl = process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:8000";
    const wsUrl = `${apiUrl}/ws/meetings/${meetingId}?participant_id=${participantId}`;
    
    setConnectionStatus("connecting");
    const ws = new WebSocket(wsUrl);

    ws.onopen = () => {
      setConnectionStatus("connected");
      console.log(`[WebSocket] Connected to meeting ${meetingId}`);
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log("[WebSocket] Message received:", data);
        setLastMessage(data);
      } catch (err) {
        console.error("Failed to parse WebSocket message", err);
      }
    };

    ws.onclose = () => {
      setConnectionStatus("disconnected");
      console.log(`[WebSocket] Disconnected from meeting ${meetingId}`);
    };

    ws.onerror = (error) => {
      console.error("[WebSocket] Error:", error);
    };

    socketRef.current = ws;

    return () => {
      ws.close();
    };
  }, [meetingId, participantId]);

  const sendMessage = (data: any) => {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify(data));
    } else {
      console.warn("WebSocket is not connected. Cannot send message.");
    }
  };

  return { sendMessage, lastMessage, connectionStatus };
}
