import React, { useRef, useEffect } from "react";
import { MicOff } from "lucide-react";

interface VideoTileProps {
  stream: MediaStream | null;
  displayName: string;
  isMuted: boolean;
  isCameraOff: boolean;
  error?: string | null;
}

export default function VideoTile({
  stream,
  displayName,
  isMuted,
  isCameraOff,
  error,
}: VideoTileProps) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  const initials = displayName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .substring(0, 2)
    .toUpperCase();

  return (
    <div className="relative bg-gray-900 rounded-lg overflow-hidden w-full h-full min-h-[200px] flex items-center justify-center border border-gray-800 shadow-sm">
      {/* Video Element */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted // Muted to avoid feedback loop for local user, but in a real app this is conditionally muted
        className={`w-full h-full object-cover ${isCameraOff || error ? "hidden" : "block"}`}
      />

      {/* Avatar Fallback */}
      {(isCameraOff || error) && (
        <div className="flex flex-col items-center justify-center">
          <div className="w-24 h-24 rounded-full bg-gray-700 flex items-center justify-center text-3xl font-medium text-white mb-2 shadow-inner">
            {initials || "?"}
          </div>
          {error && <span className="text-gray-400 text-sm">{error}</span>}
        </div>
      )}

      {/* Overlays */}
      <div className="absolute bottom-3 left-3 bg-black/60 px-2 py-1 rounded text-white text-xs font-medium flex items-center gap-2 backdrop-blur-sm">
        {isMuted && <MicOff className="w-3 h-3 text-red-500" />}
        {displayName}
      </div>
    </div>
  );
}
