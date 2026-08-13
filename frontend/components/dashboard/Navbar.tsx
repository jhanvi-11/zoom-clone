import React from "react";
import { Settings, User } from "lucide-react";

export default function Navbar() {
  return (
    <nav className="flex items-center justify-between px-6 py-4 bg-white border-b border-gray-200">
      <div className="flex items-center gap-2">
        <div className="flex items-center justify-center w-8 h-8 bg-blue-600 rounded-md text-white font-bold">
          Z
        </div>
        <span className="text-xl font-semibold text-gray-900 tracking-tight">
          Zoom Clone
        </span>
      </div>

      <div className="flex items-center gap-4">
        <button className="p-2 text-gray-500 hover:bg-gray-100 rounded-full transition">
          <Settings className="w-5 h-5" />
        </button>
        <button className="flex items-center justify-center w-9 h-9 bg-gray-200 text-gray-700 rounded-full hover:bg-gray-300 transition">
          <User className="w-5 h-5" />
        </button>
      </div>
    </nav>
  );
}
