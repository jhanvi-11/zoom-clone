"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Loader2, Users } from "lucide-react";
import Navbar from "@/components/dashboard/Navbar";
import { getMeeting, joinMeeting, Meeting } from "@/lib/api";

export default function JoinPage() {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2>(1);
  
  // Step 1 states
  const [meetingInput, setMeetingInput] = useState("");
  const [meetingError, setMeetingError] = useState<string | null>(null);
  const [loadingMeeting, setLoadingMeeting] = useState(false);
  const [foundMeeting, setFoundMeeting] = useState<Meeting | null>(null);

  // Step 2 states
  const [displayName, setDisplayName] = useState("");
  const [joinError, setJoinError] = useState<string | null>(null);
  const [loadingJoin, setLoadingJoin] = useState(false);

  const handleFindMeeting = async (e: React.FormEvent) => {
    e.preventDefault();
    setMeetingError(null);

    if (!meetingInput.trim()) {
      setMeetingError("Please enter a Meeting ID or invite link.");
      return;
    }

    // Extract meeting ID if it's a URL, otherwise use raw input
    let parsedId = meetingInput.trim();
    if (parsedId.includes("/j/")) {
      const parts = parsedId.split("/j/");
      parsedId = parts[parts.length - 1].replace(/ /g, "");
    } else {
      parsedId = parsedId.replace(/ /g, "");
    }

    try {
      setLoadingMeeting(true);
      const meeting = await getMeeting(parsedId);
      setFoundMeeting(meeting);
      setStep(2);
    } catch (err: any) {
      console.error(err);
      if (err.message === "Meeting not found") {
        setMeetingError("Meeting not found. Please check the ID and try again.");
      } else {
        setMeetingError("An error occurred while finding the meeting.");
      }
    } finally {
      setLoadingMeeting(false);
    }
  };

  const handleJoinMeeting = async (e: React.FormEvent) => {
    e.preventDefault();
    setJoinError(null);

    if (!displayName.trim()) {
      setJoinError("Display name is required.");
      return;
    }

    if (!foundMeeting) return;

    try {
      setLoadingJoin(true);
      const participant = await joinMeeting(foundMeeting.meeting_id, displayName);
      router.push(`/meeting/${foundMeeting.meeting_id.replace(/ /g, "")}?participantId=${participant.id}`);
    } catch (err) {
      console.error(err);
      setJoinError("Failed to join the meeting. Please try again.");
      setLoadingJoin(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
      <Navbar />

      <main className="flex-1 max-w-xl w-full mx-auto p-6 lg:p-12">
        <button 
          onClick={() => {
            if (step === 2) setStep(1);
            else router.push("/");
          }}
          className="flex items-center text-gray-500 hover:text-gray-900 mb-8 transition"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          {step === 2 ? "Back" : "Back to Dashboard"}
        </button>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center">
              <Users className="w-8 h-8" />
            </div>
          </div>
          
          <h1 className="text-2xl font-bold text-gray-900 mb-6 text-center">
            {step === 1 ? "Join a Meeting" : "Enter your name"}
          </h1>

          {step === 1 ? (
            <form onSubmit={handleFindMeeting} className="space-y-6">
              {meetingError && (
                <div className="bg-red-50 text-red-600 p-4 rounded-lg text-sm text-center">
                  {meetingError}
                </div>
              )}
              
              <div>
                <input
                  type="text"
                  required
                  value={meetingInput}
                  onChange={(e) => setMeetingInput(e.target.value)}
                  className="w-full px-4 py-3 text-lg border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition text-center text-gray-900 placeholder:text-gray-400"
                  placeholder="Meeting ID or Personal Link Name"
                />
              </div>

              <button
                type="submit"
                disabled={loadingMeeting}
                className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold flex items-center justify-center transition disabled:opacity-50 text-lg"
              >
                {loadingMeeting ? <Loader2 className="w-6 h-6 animate-spin" /> : "Join"}
              </button>
            </form>
          ) : (
            <form onSubmit={handleJoinMeeting} className="space-y-6">
              {joinError && (
                <div className="bg-red-50 text-red-600 p-4 rounded-lg text-sm text-center">
                  {joinError}
                </div>
              )}
              
              <div className="text-center mb-6">
                <p className="text-gray-500 mb-1">Joining meeting:</p>
                <p className="font-medium text-gray-900">{foundMeeting?.title}</p>
                <p className="text-sm font-mono text-gray-500">{foundMeeting?.meeting_id}</p>
              </div>

              <div>
                <input
                  type="text"
                  required
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="w-full px-4 py-3 text-lg border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition text-center text-gray-900 placeholder:text-gray-400"
                  placeholder="Your Name"
                />
              </div>

              <button
                type="submit"
                disabled={loadingJoin}
                className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold flex items-center justify-center transition disabled:opacity-50 text-lg"
              >
                {loadingJoin ? <Loader2 className="w-6 h-6 animate-spin" /> : "Join Meeting"}
              </button>
            </form>
          )}
        </div>
      </main>
    </div>
  );
}
