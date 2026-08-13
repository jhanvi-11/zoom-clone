import React from "react";
import { Mic, MicOff, Video, VideoOff, Users, MessageSquare, PhoneOff } from "lucide-react";

interface ControlBarProps {
  micOn: boolean;
  cameraOn: boolean;
  onToggleMic: () => void;
  onToggleCamera: () => void;
  onToggleParticipants: () => void;
  onLeave: () => void;
}

export default function ControlBar({
  micOn,
  cameraOn,
  onToggleMic,
  onToggleCamera,
  onToggleParticipants,
  onLeave,
}: ControlBarProps) {
  return (
    <div className="h-[80px] bg-black border-t border-gray-800 flex items-center justify-between px-6 shrink-0 w-full z-10">
      {/* Left placeholders for symmetry if needed */}
      <div className="flex-1"></div>

      {/* Center Controls */}
      <div className="flex items-center gap-4 flex-1 justify-center">
        <button
          onClick={onToggleMic}
          className="flex flex-col items-center justify-center gap-1 text-gray-300 hover:text-white transition group w-16"
        >
          <div className={`p-3 rounded-full flex items-center justify-center ${!micOn ? 'bg-red-500/20 text-red-500' : 'group-hover:bg-gray-800'}`}>
            {micOn ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
          </div>
          <span className="text-[10px]">{micOn ? "Mute" : "Unmute"}</span>
        </button>

        <button
          onClick={onToggleCamera}
          className="flex flex-col items-center justify-center gap-1 text-gray-300 hover:text-white transition group w-16"
        >
          <div className={`p-3 rounded-full flex items-center justify-center ${!cameraOn ? 'bg-red-500/20 text-red-500' : 'group-hover:bg-gray-800'}`}>
            {cameraOn ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
          </div>
          <span className="text-[10px]">{cameraOn ? "Stop Video" : "Start Video"}</span>
        </button>

        <button
          onClick={onToggleParticipants}
          className="flex flex-col items-center justify-center gap-1 text-gray-300 hover:text-white transition group w-16"
        >
          <div className="p-3 rounded-full group-hover:bg-gray-800 flex items-center justify-center">
            <Users className="w-5 h-5" />
          </div>
          <span className="text-[10px]">Participants</span>
        </button>

        <button className="flex flex-col items-center justify-center gap-1 text-gray-300 hover:text-white transition group w-16">
          <div className="p-3 rounded-full group-hover:bg-gray-800 flex items-center justify-center">
            <MessageSquare className="w-5 h-5" />
          </div>
          <span className="text-[10px]">Chat</span>
        </button>
      </div>

      {/* Right Controls */}
      <div className="flex-1 flex justify-end">
        <button
          onClick={onLeave}
          className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium text-sm flex items-center gap-2 transition"
        >
          <PhoneOff className="w-4 h-4" />
          Leave
        </button>
      </div>
    </div>
  );
}
