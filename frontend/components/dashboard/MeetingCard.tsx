import React from "react";
import { Meeting } from "@/lib/api";
import { Copy, Video } from "lucide-react";

interface MeetingCardProps {
  meeting: Meeting;
}

export default function MeetingCard({ meeting }: MeetingCardProps) {
  const dateObj = new Date(meeting.scheduled_at || meeting.created_at);
  
  const timeString = dateObj.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
  const dateString = dateObj.toLocaleDateString([], {
    weekday: "short",
    month: "short",
    day: "numeric",
  });

  const handleCopy = () => {
    if (meeting.invite_link) {
      navigator.clipboard.writeText(meeting.invite_link);
      alert("Invite link copied to clipboard!");
    }
  };

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between">
      <div>
        <div className="flex justify-between items-start mb-4">
          <h3 className="font-semibold text-lg text-gray-900 line-clamp-1">
            {meeting.title || `Meeting ${meeting.meeting_id}`}
          </h3>
          <span
            className={`px-2 py-1 text-xs font-medium rounded-full ${
              meeting.status === "scheduled"
                ? "bg-blue-100 text-blue-700"
                : meeting.status === "active"
                ? "bg-green-100 text-green-700"
                : "bg-gray-100 text-gray-700"
            }`}
          >
            {meeting.status}
          </span>
        </div>
        
        <div className="text-gray-500 text-sm mb-1">{dateString}</div>
        <div className="text-gray-900 text-2xl font-light tracking-tight mb-4">
          {timeString}
        </div>
      </div>

      <div className="flex gap-2 mt-4 pt-4 border-t border-gray-100">
        <button
          className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg font-medium flex justify-center items-center gap-2 transition-colors disabled:opacity-50"
          disabled={meeting.status === "ended"}
        >
          <Video className="w-4 h-4" />
          Join
        </button>
        <button
          onClick={handleCopy}
          disabled={!meeting.invite_link}
          className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-2 px-4 rounded-lg font-medium flex justify-center items-center gap-2 transition-colors disabled:opacity-50"
        >
          <Copy className="w-4 h-4" />
          Copy
        </button>
      </div>
    </div>
  );
}
