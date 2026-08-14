"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Copy, ArrowLeft, Loader2, Calendar } from "lucide-react";
import Navbar from "@/components/dashboard/Navbar";
import { createScheduledMeeting, Meeting } from "@/lib/api";

export default function SchedulePage() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [duration, setDuration] = useState("30");
  
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [successMeeting, setSuccessMeeting] = useState<Meeting | null>(null);

  // Hardcoded host ID for demo
  const DEFAULT_USER_ID = 1;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!title || !date || !time) {
      setError("Title, Date, and Time are required.");
      return;
    }

    const scheduledDate = new Date(`${date}T${time}`);
    if (scheduledDate < new Date()) {
      setError("Scheduled time must be in the future.");
      return;
    }

    try {
      setLoading(true);
      const meeting = await createScheduledMeeting(
        DEFAULT_USER_ID,
        title,
        description,
        scheduledDate.toISOString(),
        parseInt(duration)
      );
      setSuccessMeeting(meeting);
    } catch (err) {
      console.error(err);
      setError("Failed to schedule meeting.");
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (successMeeting?.invite_link) {
      navigator.clipboard.writeText(successMeeting.invite_link);
      alert("Invite link copied to clipboard!");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
      <Navbar />

      <main className="flex-1 max-w-2xl w-full mx-auto p-6 lg:p-12">
        <button 
          onClick={() => router.push("/")}
          className="flex items-center text-gray-500 hover:text-gray-900 mb-8 transition"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Dashboard
        </button>

        {successMeeting ? (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-10 text-center">
            <div className="flex justify-center mb-6">
              <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center">
                <Calendar className="w-8 h-8" />
              </div>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-4 tracking-tight">
              Meeting Scheduled!
            </h1>
            <p className="text-gray-600 mb-8">
              Your meeting "{successMeeting.title}" has been successfully scheduled.
            </p>
            
            <div className="bg-gray-50 rounded-xl p-6 mb-8 text-left border border-gray-100">
              <div className="mb-4">
                <span className="text-gray-500 text-sm block mb-1">Meeting ID</span>
                <span className="font-mono text-lg text-gray-900 font-semibold">{successMeeting.meeting_id}</span>
              </div>
              <div>
                <span className="text-gray-500 text-sm block mb-1">Invite Link</span>
                <span className="text-blue-600 break-all">{successMeeting.invite_link}</span>
              </div>
            </div>

            <div className="flex gap-4 justify-center">
              <button
                onClick={handleCopy}
                className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white py-3 px-6 rounded-xl font-medium transition-colors"
              >
                <Copy className="w-5 h-5" />
                Copy Invite
              </button>
              <button
                onClick={() => router.push("/")}
                className="flex items-center justify-center bg-gray-100 hover:bg-gray-200 text-gray-700 py-3 px-6 rounded-xl font-medium transition-colors"
              >
                Back to Dashboard
              </button>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
            <h1 className="text-2xl font-bold text-gray-900 mb-6">Schedule Meeting</h1>
            
            {error && (
              <div className="bg-red-50 text-red-600 p-4 rounded-lg mb-6 text-sm">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition text-gray-900 placeholder:text-gray-400"
                  placeholder="e.g. Weekly Team Sync"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition h-24 resize-none text-gray-900 placeholder:text-gray-400"
                  placeholder="Optional agenda or notes"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                  <input
                    type="date"
                    required
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition text-gray-900"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Time</label>
                  <input
                    type="time"
                    required
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition text-gray-900"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Duration</label>
                <select
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition bg-white text-gray-900"
                >
                  <option value="15">15 minutes</option>
                  <option value="30">30 minutes</option>
                  <option value="45">45 minutes</option>
                  <option value="60">1 hour</option>
                  <option value="90">1 hour 30 minutes</option>
                </select>
              </div>

              <div className="pt-4 border-t border-gray-100 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => router.push("/")}
                  className="px-6 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition"
                  disabled={loading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium flex items-center justify-center min-w-[120px] transition disabled:opacity-50"
                >
                  {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Save"}
                </button>
              </div>
            </form>
          </div>
        )}
      </main>
    </div>
  );
}
