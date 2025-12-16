'use client';

import Button from "@/components/Button";
import { Header } from "@/components/Header";
import SettingsButton from "@/components/SettingsButton";
import Image from "next/image";
import { redirect } from "next/navigation";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-950 to-black text-white flex flex-col">
      <Header
        logoSrc="/logo.png"
        exitVisible={false}
        onExit={() => console.log("EXIT")}
        className="top-0 left-0"
      />
      <div className="flex flex-col items-center justify-center h-150 px-4 gap-4">
        <h1 className="text-4xl font-bold mb-8 text-center">Welcome to MusiGuessr!</h1>
        <p className="text-lg mb-8 text-center">
          Test your knowledge of music tracks and artists. Can you guess them all?
        </p>
        <Button className="px-6 py-3 text-lg bg-blue-600 hover:bg-blue-700" onClick={() => { redirect('/game'); }}>
          Play
        </Button>
        <Button className="px-6 py-3 text-lg bg-blue-600 hover:bg-blue-700" onClick={() => { redirect('/game'); }}>
          Tournaments
        </Button>
        <Button className="px-6 py-3 text-lg bg-blue-600 hover:bg-blue-700" onClick={() => { redirect('/game'); }}>
          Leaderboard
        </Button>
      </div>
      <SettingsButton></SettingsButton>
      <div className="mt-auto p-4 text-center text-sm text-gray-400">
        &copy; 2025 MusiGuessr. All rights reserved.
      </div>
    </div>
  );
}
