"use client";

import React, { useEffect, useState, use } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Shield } from "lucide-react";

import { Meeting, Participant, getMeeting, getMeetingParticipants, leaveMeeting } from "@/lib/api";
import { useLocalMedia } from "@/hooks/useLocalMedia";

import VideoGrid from "@/components/meeting/VideoGrid";
import VideoTile from "@/components/meeting/VideoTile";
import ControlBar from "@/components/meeting/ControlBar";
import ParticipantsPanel from "@/components/meeting/ParticipantsPanel";

export default function MeetingRoom({ params }: { params: Promise<{ meetingId: string }> }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { meetingId } = use(params);
  const participantIdStr = searchParams.get("participantId");
  const participantId = participantIdStr ? parseInt(participantIdStr, 10) : undefined;

  const [meeting, setMeeting] = useState<Meeting | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [showParticipants, setShowParticipants] = useState(false);
  const [currentTime, setCurrentTime] = useState("");

  const { stream, cameraOn, micOn, toggleMic, toggleCamera, stopAllMedia, error } = useLocalMedia();

  // Clock
  useEffect(() => {
    const updateTime = () => {
      setCurrentTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    };
    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  // Fetch Meeting & Participants
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

  // Refetch participants when panel is opened
  useEffect(() => {
    if (showParticipants) {
      getMeetingParticipants(meetingId)
        .then(setParticipants)
        .catch(console.error);
    }
  }, [showParticipants, meetingId]);

  const handleLeave = async () => {
    if (participantId) {
      try {
        await leaveMeeting(meetingId, participantId);
      } catch (err) {
        console.error("Failed to leave properly on backend", err);
      }
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
            
            {/* Remote Participants (Placeholder static tiles for UI since it's not a real WebRTC mesh yet) */}
            {participants.filter(p => p.id !== participantId).map((p) => (
              <VideoTile
                key={p.id}
                stream={null} // No remote stream yet
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
