'use client';
import React, { useState } from 'react';
import Calendar from './calendar';
import AuthModals from './authModals';
import DevicesView from './devices';
import ChatWidget from './chatWidget';

export default function SLabAIFullLayout() {
  const [currentTab, setCurrentTab] = useState('dashboard');
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [user, setUser] = useState(null);

  return (
    <div className="min-h-screen bg-[#0B0F19] flex">

      {/* 1. LEFT NAVIGATION SIDEBAR (Thu nhỏ từ Athletica) */}
      <aside className="w-64 bg-[#0D1321] border-r border-slate-800 flex flex-col fixed h-screen z-40 hidden md:flex">
        {/* Logo SLabAI tại đỉnh Sidebar */}
        <div className="p-6 border-b border-slate-800 flex items-center space-x-1.5">
          <span className="text-[#FC4C02] text-3xl font-black italic tracking-wider">S</span>
          <span className="text-white text-xl font-bold tracking-tight">Lab</span>
          <span className="text-[#FC4C02] text-xl font-bold tracking-tight">AI</span>
        </div>

        {/* Danh mục Menu điều hướng */}
        <div className="flex-1 p-4 space-y-6 overflow-y-auto text-xs font-bold tracking-wide text-slate-400">

          {/* CATEGORY: TRAINING */}
          <div className="space-y-1">
            <p className="px-3 text-[10px] uppercase font-black text-slate-600 tracking-widest mb-2">TRAINING Category</p>
            <a
              href="#"
              onClick={(e) => {
                e.preventDefault();
                setCurrentTab('dashboard');
              }}
              className={`flex items-center space-x-3 px-3 py-2.5 rounded-xl transition ${
                currentTab === 'dashboard'
                  ? 'bg-gradient-to-r from-[#113166] to-transparent text-white border-l-4 border-[#FC4C02] font-bold shadow-md shadow-[#FC4C02]/10'
                  : 'hover:bg-slate-800/50 hover:text-white text-slate-400'
              }`}
            >
              <span>📊</span> <span className="text-sm">Dashboard</span>
            </a>
            <a
              href="#"
              onClick={(e) => {
                e.preventDefault();
                setCurrentTab('calendar');
              }}
              className={`flex items-center space-x-3 px-3 py-2.5 rounded-xl transition ${
                currentTab === 'calendar'
                  ? 'bg-gradient-to-r from-[#113166] to-transparent text-white border-l-4 border-[#FC4C02] font-bold shadow-md shadow-[#FC4C02]/10'
                  : 'hover:bg-slate-800/50 hover:text-white text-slate-400'
              }`}
            >
              <span>📅</span> <span className="text-sm">Calendar</span>
            </a>
            <a href="#" className="flex items-center space-x-3 px-3 py-2.5 rounded-xl hover:bg-slate-800/50 hover:text-white transition">
              <span>🗺️</span> <span>Roadmap</span>
            </a>
            <a href="#" className="flex items-center space-x-3 px-3 py-2.5 rounded-xl hover:bg-slate-800/50 hover:text-white transition">
              <span>🛠️</span> <span>Plan Builder</span>
            </a>
            <a href="#" className="flex items-center space-x-3 px-3 py-2.5 rounded-xl hover:bg-slate-800/50 hover:text-white transition">
              <span>📥</span> <span>Import Data</span>
            </a>
          </div>

          {/* CATEGORY: ACCOUNT */}
          <div className="space-y-1">
            <p className="px-3 text-[10px] uppercase font-black text-slate-600 tracking-widest mb-2">ACCOUNT Category</p>
            <a href="#" className="flex items-center space-x-3 px-3 py-2.5 rounded-xl hover:bg-slate-800/50 hover:text-white transition">
              <span>👤</span> <span>Profile</span>
            </a>
            <a href="#" className="flex items-center space-x-3 px-3 py-2.5 rounded-xl hover:bg-slate-800/50 hover:text-white transition">
              <span>⚙️</span> <span>Preferences</span>
            </a>
            <a href="#" className="flex items-center space-x-3 px-3 py-2.5 rounded-xl hover:bg-slate-800/50 hover:text-white transition">
              <span>🤖</span> <span>AI Coach Settings</span>
            </a>
            <a
              href="#"
              onClick={(e) => {
                e.preventDefault();
                setCurrentTab('devices');
              }}
              className={`flex items-center space-x-3 px-3 py-2.5 rounded-xl transition ${
                currentTab === 'devices'
                  ? 'bg-gradient-to-r from-[#113166] to-transparent text-white border-l-4 border-[#FC4C02] font-bold shadow-md shadow-[#FC4C02]/10'
                  : 'hover:bg-slate-800/50 hover:text-white text-slate-400'
              }`}
            >
              <span>📱</span> <span className="text-sm">Devices & Apps</span>
            </a>
            <a href="#" className="flex items-center space-x-3 px-3 py-2.5 rounded-xl hover:bg-slate-800/50 hover:text-white transition">
              <span>💳</span> <span>Billing & Subscription</span>
            </a>
          </div>
        </div>

        {/* Trạng thái Profile thu nhỏ dưới đáy Sidebar */}
        {user && user.isLoggedIn ? (
          <div className="p-4 border-t border-slate-800 bg-[#0A0E1A] flex items-center justify-between">
            <div className="flex items-center space-x-3 truncate">
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#FC4C02] to-amber-500 flex items-center justify-center text-white font-black text-xs">
                {user.name.substring(0, 2).toUpperCase()}
              </div>
              <div className="truncate">
                <p className="text-xs font-bold text-white truncate">{user.name}</p>
                <p className="text-[10px] text-emerald-500 font-medium flex items-center">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1 animate-pulse"></span> Online
                </p>
              </div>
            </div>
            <button
              onClick={() => setUser(null)}
              title="Đăng xuất"
              className="text-slate-500 hover:text-red-500 text-sm font-bold transition p-1 cursor-pointer"
            >
              🚪
            </button>
          </div>
        ) : (
          <div className="p-4 border-t border-slate-800 bg-[#0A0E1A] flex flex-col space-y-2">
            <p className="text-[10px] text-slate-500 font-bold text-center">Tối ưu luyện tập cùng AI</p>
            <button
              onClick={() => setIsAuthOpen(true)}
              className="w-full bg-gradient-to-r from-[#FC4C02] to-orange-600 hover:opacity-90 text-white font-black py-2 rounded-xl text-xs shadow-md transition transform active:scale-95 cursor-pointer"
            >
              Sign In / Sign Up
            </button>
          </div>
        )}
      </aside>

      {/* 2. MAIN CONTENT AREA (Bao gồm Top Nav và 3 Phân vùng chiến lược) */}
      <div className="flex-1 md:pl-64 flex flex-col min-h-screen">

        {/* TOP NAVIGATION BAR */}
        <nav className="bg-[#113166] border-b border-blue-900 px-6 py-3.5 flex justify-between items-center sticky top-0 z-30 shadow-lg">
          <div className="text-sm font-bold text-white md:block hidden">
            Thông tin cá nhân <span className="text-slate-400 font-normal">/ {currentTab === 'dashboard' ? 'Dashboard' : currentTab === 'calendar' ? 'Calendar' : 'Devices & Apps'}</span>
          </div>
          <div className="md:hidden font-black text-xl text-white">
            <span className="text-[#FC4C02]">S</span>LabAI
          </div>

          <div className="flex items-center bg-blue-950/60 rounded-xl px-3 py-1.5 border border-blue-900 w-64 lg:w-96">
            <span className="text-slate-400 mr-2 text-xs">🔍</span>
            <input type="text" placeholder="Th trích / Tìm kiếm..." className="bg-transparent text-xs w-full text-white focus:outline-none" />
          </div>

          <div className="flex items-center space-x-3">
            <button className="p-1.5 bg-blue-950/40 rounded-lg text-slate-300 hover:text-[#FC4C02]">🔔</button>
            <button className="p-1.5 bg-blue-950/40 rounded-lg text-slate-300 hover:text-[#FC4C02]">⚙️</button>
          </div>
        </nav>

        {currentTab === 'dashboard' ? (
          <>
            {/* GRID LAYOUT CHO 3 VÙNG CHIẾN LƯỢC */}
            <div className="p-4 lg:p-6 grid grid-cols-1 xl:grid-cols-3 gap-6 flex-1 items-start">

              {/* ZONE A: CENTER SECTION - SOCIAL FEED (Chiếm 2 cột lớn bên trái) */}
              <div className="xl:col-span-2 space-y-6">
            <h3 className="text-base font-black text-white uppercase tracking-wider flex items-center">
              <span className="w-2 h-2 bg-[#FC4C02] rounded-full mr-2"></span> Mới nhất từ bạn bè
            </h3>

            {/* CARD HOẠT ĐỘNG: NGUYỄN NAM */}
            <div className="bg-[#131926] border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
              {/* Header Card */}
              <div className="p-4 flex items-center justify-between border-b border-slate-800/50">
                <div className="flex items-center space-x-3">
                  <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-[#FC4C02] to-amber-500 flex items-center justify-center text-white text-xs font-bold">NN</div>
                  <div>
                    <h4 className="text-sm font-bold text-white">Nguyễn Nam</h4>
                    <p className="text-[10px] text-slate-400">10 chós bản nam • Hôm nay 05:23</p>
                  </div>
                </div>
                <span className="text-slate-500 cursor-pointer">•••</span>
              </div>

              {/* Khối Ảnh thực tế & Bản đồ GPS song song */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-0.5 bg-[#0B0F19]">
                <div className="h-52 bg-slate-800 relative flex items-center justify-center overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent z-10"></div>
                  <span className="text-5xl z-10">🏃</span>
                  <div className="absolute bottom-3 left-3 z-20 bg-[#FC4C02] text-white text-[10px] font-black px-2 py-0.5 rounded-md">TRAIL RUN</div>
                </div>
                <div className="h-52 bg-[#162032] relative flex items-center justify-center">
                  {/* SVG Bản đồ đồng bộ tuyến đường màu cam */}
                  <svg className="w-4/5 h-4/5 text-[#FC4C02]" viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
                    <path d="M30,70 L40,30 L70,20 L80,60 L50,85 Z" className="animate-dash" />
                  </svg>
                  <span className="absolute bottom-2 right-2 text-[9px] text-slate-600 font-mono">Map snippet</span>
                </div>
              </div>

              {/* Footer Thông số bài chạy & Nút Tương tác */}
              <div className="p-4 bg-[#141C2B] flex flex-col sm:flex-row justify-between sm:items-center gap-4 border-b border-slate-800">
                <div className="space-y-1">
                  <h4 className="text-base font-black text-white">Chạy bộ 5km</h4>
                  <p className="text-xs font-bold text-[#FC4C02]">🏃 5 km  |  ⏱️ 5:37 /km  |  🔥 354</p>
                </div>
                {/* Nút Challenge trực diện cực ngầu */}
                <div className="flex items-center space-x-3">
                  <div className="flex items-center space-x-1 text-xs font-bold text-amber-500 bg-amber-500/10 px-2.5 py-1.5 rounded-xl border border-amber-500/20">
                    <span>🔥</span> <span>5</span>
                  </div>
                  <button className="bg-gradient-to-r from-[#FC4C02] to-orange-600 text-white text-xs font-black px-4 py-2 rounded-xl shadow-lg shadow-orange-600/20 transform active:scale-95 transition">
                    Direct Challenge
                  </button>
                </div>
              </div>

              {/* Bình luận & Thích */}
              <div className="px-4 py-3 bg-[#131926] flex space-x-6 text-xs font-bold text-slate-400">
                <button className="hover:text-[#FC4C02] flex items-center space-x-1"><span>🤍</span> <span>Like</span></button>
                <button className="hover:text-white flex items-center space-x-1"><span>💬</span> <span>0 bình luận</span></button>
              </div>
            </div>
          </div>

          {/* ZONE B: RIGHT SECTION - LEADBOARD THỬ THÁCH NHÓM */}
          <div className="space-y-6">
            <h3 className="text-base font-black text-white uppercase tracking-wider flex items-center">
              <span className="w-2 h-2 bg-[#FC4C02] rounded-full mr-2"></span> Thử thách nhóm
            </h3>

            <div className="bg-[#131926] border border-slate-800 rounded-2xl p-4 space-y-3.5 shadow-xl">
              {/* Thử thách xếp chồng 1 */}
              <div className="p-3.5 bg-[#1A2233] rounded-xl border border-slate-800 space-y-2.5 relative group hover:border-[#FC4C02]/40 transition">
                <div className="flex justify-between items-start">
                  <p className="text-xs font-black text-white">Thử thách: Chạy bộ cùng lớp</p>
                  <span className="text-[10px] text-slate-400 font-mono">00:03:24</span>
                </div>
                <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden">
                  <div className="bg-gradient-to-r from-[#FC4C02] to-amber-500 h-full w-[80%] rounded-full shadow-[0_0_8px_#FC4C02]"></div>
                </div>
                <div className="flex justify-between items-center text-[10px]">
                  <div className="flex -space-x-1">
                    <div className="w-4 h-4 rounded-full bg-blue-500 border border-slate-800"></div>
                    <div className="w-4 h-4 rounded-full bg-amber-500 border border-slate-800"></div>
                    <div className="w-4 h-4 rounded-full bg-green-500 border border-slate-800"></div>
                  </div>
                  <span className="text-[#FC4C02] font-black">80% Hoàn thành</span>
                </div>
              </div>

              {/* Thử thách xếp chồng 2 */}
              <div className="p-3.5 bg-[#1A2233] rounded-xl border border-slate-800 space-y-2.5">
                <div className="flex justify-between items-start">
                  <p className="text-xs font-black text-white">Thử thách: Chạy bộ cùng lớp</p>
                  <span className="text-[10px] text-slate-400 font-mono">00:03:35</span>
                </div>
                <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden">
                  <div className="bg-gradient-to-r from-[#FC4C02] to-amber-500 h-full w-[55%] rounded-full"></div>
                </div>
                <div className="flex justify-between items-center text-[10px]">
                  <div className="flex -space-x-1"><div className="w-4 h-4 rounded-full bg-red-500 border border-slate-800"></div></div>
                  <span className="text-amber-500 font-black">55% Hoàn thành</span>
                </div>
              </div>

              {/* Thử thách xếp chồng 3 */}
              <div className="p-3.5 bg-[#1A2233] rounded-xl border border-slate-800 space-y-2.5 opacity-50">
                <div className="flex justify-between items-start">
                  <p className="text-xs font-black text-white">Thử thách: Chạy bộ cùng lớp</p>
                  <span className="text-[10px] text-slate-500 font-mono">00:03:56</span>
                </div>
                <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden">
                  <div className="bg-slate-800 h-full w-[30%] rounded-full"></div>
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* PHÂN VÙNG ĐÁY CHÂN TRANG: CHIA ĐÔI GÓC DƯỚI TRÁI VÀ GÓC DƯỚI PHẢI */}
        <div className="p-4 lg:p-6 pt-0 grid grid-cols-1 xl:grid-cols-2 gap-6 items-end">

          {/* ZONE C: BOTTOM LEFT - USER FITNESS METRICS PANEL */}
          <div className="bg-[#0D1424] border border-blue-950 rounded-2xl p-5 grid grid-cols-2 sm:grid-cols-4 gap-4 shadow-2xl">
            {/* Vòng chỉ số 1: Tuân thủ */}
            <div className="flex flex-col items-center justify-center p-3 bg-slate-900/50 rounded-xl border border-slate-800/40">
              <span className="text-[11px] font-bold text-slate-400 mb-2">Tuân thủ</span>
              <div className="relative w-16 h-16 rounded-full border-4 border-slate-800 flex items-center justify-center border-t-[#FC4C02] border-r-[#FC4C02] shadow-[0_0_10px_rgba(252,76,2,0.15)]">
                <span className="text-xs font-black text-white">92%</span>
              </div>
              <span className="text-xs text-[#FC4C02] opacity-70 mt-2">〰️〰️</span>
            </div>

            {/* Vòng chỉ số 2: Mệt mỏi */}
            <div className="flex flex-col items-center justify-center p-3 bg-slate-900/50 rounded-xl border border-slate-800/40">
              <span className="text-[11px] font-bold text-slate-400 mb-2">Mệt mỏi</span>
              <div className="relative w-16 h-16 rounded-full border-4 border-slate-800 flex items-center justify-center border-t-amber-500">
                <span className="text-sm font-black text-white">45</span>
              </div>
              <span className="text-xs text-amber-500 opacity-70 mt-2">〰️〰️</span>
            </div>

            {/* Vòng chỉ số 3: Thể lực */}
            <div className="flex flex-col items-center justify-center p-3 bg-slate-900/50 rounded-xl border border-slate-800/40">
              <span className="text-[11px] font-bold text-slate-400 mb-2">Thể lực</span>
              <div className="relative w-16 h-16 rounded-full border-4 border-slate-800 flex items-center justify-center border-t-cyan-400 border-b-cyan-400">
                <span className="text-sm font-black text-white">75</span>
              </div>
              <span className="text-xs text-cyan-400 opacity-70 mt-2">〰️〰️</span>
            </div>

            {/* Vòng chỉ số 4: Phong độ */}
            <div className="flex flex-col items-center justify-center p-3 bg-slate-900/50 rounded-xl border border-slate-800/40">
              <span className="text-[11px] font-bold text-slate-400 mb-2">Phong độ</span>
              <div className="relative w-16 h-16 rounded-full border-4 border-slate-800 flex items-center justify-center border-t-indigo-500 border-l-indigo-500">
                <span className="text-sm font-black text-white">8.5</span>
              </div>
              <span className="text-xs text-indigo-500 opacity-70 mt-2">〰️〰️</span>
            </div>
          </div>

          {/* ZONE D: BOTTOM RIGHT - CONVERSATIONAL AI COACH WIDGET */}
          <ChatWidget />

        </div>
          </>
        ) : currentTab === 'calendar' ? (
          <Calendar />
        ) : (
          <DevicesView />
        )}

      </div>

      {/* MODAL ĐĂNG KÝ / ĐĂNG NHẬP */}
      <AuthModals
        isOpen={!user || isAuthOpen}
        onClose={user ? () => setIsAuthOpen(false) : null}
        onAuthSuccess={(userData) => {
          setUser({ name: userData.name, email: userData.email, isLoggedIn: true });
          setIsAuthOpen(false);
        }}
      />
    </div>
  );
}