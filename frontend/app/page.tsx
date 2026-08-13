"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Video, Calendar, PlusSquare, Loader2 } from "lucide-react";
import Navbar from "@/components/dashboard/Navbar";
import MeetingCard from "@/components/dashboard/MeetingCard";
import {
  Meeting,
  createInstantMeeting,
  getUpcomingMeetings,
  getRecentMeetings,
} from "@/lib/api";

export default function Dashboard() {
  const router = useRouter();
  const [upcomingMeetings, setUpcomingMeetings] = useState<Meeting[]>([]);
  const [recentMeetings, setRecentMeetings] = useState<Meeting[]>([]);
  const [loadingNew, setLoadingNew] = useState(false);
  const [loadingUpcoming, setLoadingUpcoming] = useState(true);
  const [loadingRecent, setLoadingRecent] = useState(true);

  // Using hardcoded hostId = 1 for the demo per backend seeding
  const DEFAULT_USER_ID = 1;

  useEffect(() => {
    async function fetchData() {
      try {
        const upcoming = await getUpcomingMeetings();
        setUpcomingMeetings(upcoming);
      } catch (err) {
        console.error(err);
      } finally {
        setLoadingUpcoming(false);
      }

      try {
        const recent = await getRecentMeetings();
        setRecentMeetings(recent);
      } catch (err) {
        console.error(err);
      } finally {
        setLoadingRecent(false);
      }
    }
    fetchData();
  }, []);

  const handleNewMeeting = async () => {
    try {
      setLoadingNew(true);
      const meeting = await createInstantMeeting(DEFAULT_USER_ID);
      router.push(`/meeting/${meeting.meeting_id.replace(/ /g, "")}`);
    } catch (err) {
      console.error(err);
      alert("Failed to create meeting.");
      setLoadingNew(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto p-6 lg:p-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8 tracking-tight">
          Welcome back
        </h1>

        {/* Action Buttons */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {/* New Meeting Button */}
          <button
            onClick={handleNewMeeting}
            disabled={loadingNew}
            className="flex flex-col justify-center items-center gap-4 bg-orange-500 hover:bg-orange-600 text-white rounded-2xl p-8 shadow-md hover:shadow-lg transition-all h-48 relative overflow-hidden group"
          >
            {loadingNew ? (
              <Loader2 className="w-12 h-12 animate-spin" />
            ) : (
              <Video className="w-12 h-12 group-hover:scale-110 transition-transform" />
            )}
            <span className="text-xl font-semibold">New Meeting</span>
          </button>

          {/* Join Meeting Button */}
          <button 
            onClick={() => router.push("/join")}
            className="flex flex-col justify-center items-center gap-4 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl p-8 shadow-md hover:shadow-lg transition-all h-48 group"
          >
            <PlusSquare className="w-12 h-12 group-hover:scale-110 transition-transform" />
            <span className="text-xl font-semibold">Join Meeting</span>
          </button>

          {/* Schedule Meeting Button */}
          <button 
            onClick={() => router.push("/schedule")}
            className="flex flex-col justify-center items-center gap-4 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl p-8 shadow-md hover:shadow-lg transition-all h-48 group"
          >
            <Calendar className="w-12 h-12 group-hover:scale-110 transition-transform" />
            <span className="text-xl font-semibold">Schedule Meeting</span>
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
          {/* Upcoming Meetings */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-6">
              Upcoming Meetings
            </h2>
            {loadingUpcoming ? (
              <div className="flex justify-center p-8">
                <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
              </div>
            ) : upcomingMeetings.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {upcomingMeetings.map((meeting) => (
                  <MeetingCard key={meeting.id} meeting={meeting} />
                ))}
              </div>
            ) : (
              <div className="bg-white border border-gray-200 rounded-xl p-8 text-center text-gray-500">
                No upcoming meetings.
              </div>
            )}
          </section>

          {/* Recent Meetings */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-6">
              Recent Meetings
            </h2>
            {loadingRecent ? (
              <div className="flex justify-center p-8">
                <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
              </div>
            ) : recentMeetings.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {recentMeetings.map((meeting) => (
                  <MeetingCard key={meeting.id} meeting={meeting} />
                ))}
              </div>
            ) : (
              <div className="bg-white border border-gray-200 rounded-xl p-8 text-center text-gray-500">
                No recent meetings.
              </div>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}
