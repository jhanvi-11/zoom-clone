"use client";

import React, { useEffect, useState, use, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Shield, Loader2 } from "lucide-react";

import { Meeting, Participant, getMeeting, getMeetingParticipants, leaveMeeting, joinMeeting } from "@/lib/api";
import { useLocalMedia } from "@/hooks/useLocalMedia";
import { useMeetingSocket } from "@/hooks/useMeetingSocket";

import VideoGrid from "@/components/meeting/VideoGrid";
import VideoTile from "@/components/meeting/VideoTile";
import ControlBar from "@/components/meeting/ControlBar";
import ParticipantsPanel from "@/components/meeting/ParticipantsPanel";

// Define an inner component that receives a GUARANTEED participantId
function MeetingRoomInner({ meetingId, participantId }: { meetingId: string, participantId: number }) {
  const router = useRouter();
  
  const [meeting, setMeeting] = useState<Meeting | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [showParticipants, setShowParticipants] = useState(false);
  const [currentTime, setCurrentTime] = useState("");

  const { stream, cameraOn, micOn, toggleMic, toggleCamera, stopAllMedia, error } = useLocalMedia();
  
  // Initialize WebSocket signaling
  const { connectionStatus, lastMessage } = useMeetingSocket(meetingId, participantId);

  // Clock
  useEffect(() => {
    const updateTime = () => {
      setCurrentTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    };
    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  // Fetch Meeting & Initial Participants
  useEffect(() => {
    async function loadData() {
      try {
        const m = await getMeeting(meetingId);
        setMeeting(m);
        const pList = await getMeetingParticipants(meetingId);
        setParticipants(pList);
      } catch (err) {
        console.error(err);
        alert("Failed to load meeting details.");
        router.push("/");
      }
    }
    loadData();
  }, [meetingId, router]);

  // Handle incoming WebSocket messages
  useEffect(() => {
    if (lastMessage && (lastMessage.type === "participant-joined" || lastMessage.type === "participant-left")) {
      getMeetingParticipants(meetingId)
        .then(setParticipants)
        .catch(console.error);
    }
  }, [lastMessage, meetingId]);

  // Refetch participants when panel is opened
  useEffect(() => {
    if (showParticipants) {
      getMeetingParticipants(meetingId)
        .then(setParticipants)
        .catch(console.error);
    }
  }, [showParticipants, meetingId]);

  const handleLeave = async () => {
    try {
      await leaveMeeting(meetingId, participantId);
    } catch (err) {
      console.error("Failed to leave properly on backend", err);
    }
    stopAllMedia();
    router.push("/");
  };

  // Find local participant info if exists
  const localParticipant = participants.find(p => p.id === participantId);
  const localDisplayName = localParticipant?.display_name || "You";

  return (
    <div className="flex flex-col h-screen w-screen bg-[#1a1a1a] text-white overflow-hidden font-sans">
      {/* Header */}
      <header className="h-[48px] bg-black/50 backdrop-blur-md flex items-center justify-between px-4 shrink-0 absolute top-0 left-0 right-0 z-10">
        <div className="flex items-center gap-3">
          <Shield className="w-4 h-4 text-green-500" />
          <span className="font-medium text-sm">
            {meeting?.title || "Zoom Meeting"}
          </span>
        </div>
        
        <div className="flex items-center gap-4 text-sm font-medium text-gray-300">
          <span>{currentTime}</span>
          <div className="flex items-center gap-1 bg-gray-800/80 px-2 py-1 rounded">
            <span className="text-xs">Participants:</span>
            <span className="font-bold text-white">{participants.length}</span>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden pt-[48px]">
        {/* Video Area */}
        <div className="flex-1 relative bg-[#1a1a1a] flex flex-col">
          <VideoGrid>
            {/* Local User Tile */}
            <VideoTile
              stream={stream}
              displayName={localDisplayName}
              isMuted={!micOn}
              isCameraOff={!cameraOn}
              error={error}
            />
            
            {/* Remote Participants */}
            {participants.filter(p => p.id !== participantId).map((p) => (
              <VideoTile
                key={p.id}
                stream={null}
                displayName={p.display_name}
                isMuted={!p.mic_on}
                isCameraOff={!p.camera_on}
              />
            ))}
          </VideoGrid>
        </div>

        {/* Slide-out Panel */}
        <ParticipantsPanel
          isOpen={showParticipants}
          onClose={() => setShowParticipants(false)}
          participants={participants}
          currentParticipantId={participantId}
        />
      </div>

      {/* Footer Controls */}
      <ControlBar
        micOn={micOn}
        cameraOn={cameraOn}
        onToggleMic={toggleMic}
        onToggleCamera={toggleCamera}
        onToggleParticipants={() => setShowParticipants(!showParticipants)}
        onLeave={handleLeave}
      />
    </div>
  );
}

export default function MeetingRoom({ params }: { params: Promise<{ meetingId: string }> }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { meetingId } = use(params);
  
  const [resolvedParticipantId, setResolvedParticipantId] = useState<number | null>(null);
  const hasJoinedRef = useRef(false);

  useEffect(() => {
    async function resolveParticipant() {
      if (hasJoinedRef.current) return;
      
      const participantIdStr = searchParams.get("participantId");
      if (participantIdStr) {
        hasJoinedRef.current = true;
        setResolvedParticipantId(parseInt(participantIdStr, 10));
        return;
      }

      hasJoinedRef.current = true;
      // If missing, auto-join as Host (DEFAULT_USER_ID = 1)
      try {
        const DEFAULT_USER_ID = 1;
        const participant = await joinMeeting(meetingId, "Host", DEFAULT_USER_ID);
        setResolvedParticipantId(participant.id);
        
        // Update URL to avoid re-joining on refresh
        const newUrl = `/meeting/${meetingId}?participantId=${participant.id}`;
        window.history.replaceState({ ...window.history.state, as: newUrl, url: newUrl }, '', newUrl);
      } catch (err) {
        console.error("Failed to auto-join meeting", err);
        alert("Failed to join meeting.");
        router.push("/");
      }
    }

    resolveParticipant();
  }, [meetingId, searchParams, router]);

  if (resolvedParticipantId === null) {
    return (
      <div className="h-screen w-screen bg-[#1a1a1a] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-white" />
      </div>
    );
  }

  return <MeetingRoomInner meetingId={meetingId} participantId={resolvedParticipantId} />;
}
