import React from "react";
import { Participant } from "@/lib/api";
import { X, Mic, MicOff, Video, VideoOff } from "lucide-react";

interface ParticipantsPanelProps {
  isOpen: boolean;
  onClose: () => void;
  participants: Participant[];
  currentParticipantId?: number;
}

export default function ParticipantsPanel({
  isOpen,
  onClose,
  participants,
  currentParticipantId,
}: ParticipantsPanelProps) {
  if (!isOpen) return null;

  return (
    <div className="w-[320px] bg-white border-l border-gray-200 flex flex-col shrink-0 h-full">
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <h2 className="font-semibold text-gray-900">Participants ({participants.length})</h2>
        <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-full text-gray-500">
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {participants.map((p) => (
          <div key={p.id} className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center font-medium text-sm">
                {p.display_name.charAt(0).toUpperCase()}
              </div>
              <span className="text-sm font-medium text-gray-900">
                {p.display_name} {p.id === currentParticipantId && "(You)"}
              </span>
            </div>
            
            <div className="flex items-center gap-2 text-gray-400">
              {p.mic_on ? <Mic className="w-4 h-4 text-gray-600" /> : <MicOff className="w-4 h-4 text-red-500" />}
              {p.camera_on ? <Video className="w-4 h-4 text-gray-600" /> : <VideoOff className="w-4 h-4 text-red-500" />}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
