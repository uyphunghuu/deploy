'use client';
import React, { useState } from 'react';

export default function ChatWidget() {
  const [message, setMessage] = useState('');
  const [chatState, setChatState] = useState('normal'); // 'normal' | 'collapsed' | 'maximized' | 'hidden'

  if (chatState === 'hidden') {
    return (
      <div className="flex justify-end items-end w-full">
        <button 
          onClick={() => setChatState('normal')}
          className="bg-gradient-to-r from-[#FC4C02] to-orange-600 hover:opacity-95 text-white px-5 py-3 rounded-2xl shadow-lg shadow-orange-600/20 flex items-center space-x-2 hover:scale-105 active:scale-95 transition transform duration-150 cursor-pointer font-bold text-xs"
          title="Mở AI Coach Chat"
        >
          <span>💬</span> <span>Trò chuyện với Coach AI</span>
        </button>
      </div>
    );
  }

  return (
    <div className={`bg-[#111A2E] border border-blue-900 rounded-2xl shadow-2xl overflow-hidden flex flex-col transition-all duration-300 w-full ${
      chatState === 'collapsed' ? 'h-11' : chatState === 'maximized' ? 'h-[480px]' : 'h-64'
    }`}>
      {/* Header Chat */}
      <div 
        className="bg-[#162545] px-4 py-2.5 border-b border-blue-900 flex justify-between items-center cursor-pointer select-none"
        onClick={() => {
          if (chatState === 'collapsed') setChatState('normal');
        }}
      >
        <div className="flex items-center space-x-2 text-xs font-black uppercase text-white tracking-wider">
          <span>🤖</span> <span>AI Coach Chat Window</span>
        </div>
        <div className="flex items-center space-x-2.5 text-slate-400 text-xs font-mono" onClick={(e) => e.stopPropagation()}>
          {chatState !== 'collapsed' ? (
            <button 
              onClick={() => setChatState('collapsed')} 
              title="Thu nhỏ (Collapse)" 
              className="hover:text-white transition cursor-pointer font-bold px-1"
            >
              —
            </button>
          ) : (
            <button 
              onClick={() => setChatState('normal')} 
              title="Mở rộng (Expand)" 
              className="hover:text-white transition cursor-pointer font-bold px-1"
            >
              ▲
            </button>
          )}
          {chatState !== 'maximized' ? (
            <button 
              onClick={() => setChatState('maximized')} 
              title="Phóng to (Maximize)" 
              className="hover:text-white transition cursor-pointer font-bold px-1 text-sm leading-none"
            >
              ⤢
            </button>
          ) : (
            <button 
              onClick={() => setChatState('normal')} 
              title="Thu nhỏ lại (Restore)" 
              className="hover:text-white transition cursor-pointer font-bold px-1 text-sm leading-none"
            >
              ⤡
            </button>
          )}
          <button 
            onClick={() => setChatState('hidden')} 
            title="Đóng (Close)" 
            className="hover:text-red-500 hover:scale-110 transition cursor-pointer font-bold px-1"
          >
            ✕
          </button>
        </div>
      </div>

      {chatState !== 'collapsed' && (
        <>
          {/* Bong bóng chat hội thoại tiếng Việt */}
          <div className="p-4 flex-1 overflow-y-auto space-y-3 text-[11px] leading-relaxed">
            <div className="flex items-start space-x-2">
              <div className="w-5 h-5 rounded-full bg-blue-900 border border-blue-600 flex items-center justify-center text-[9px]">🤖</div>
              <div className="bg-[#1B2A4A] text-slate-200 p-2 rounded-xl rounded-tl-none max-w-[85%] border border-blue-900/40 shadow-md">
                Huấn luyện viên SLabAI: Xin chào Nam! Hôm nay bạn có muốn tập không?
              </div>
            </div>

            <div className="flex items-start space-x-2 justify-end">
              <div className="bg-[#FC4C02] text-white p-2 rounded-xl rounded-tr-none max-w-[85%] font-medium shadow-md">
                Chào Coach, lát chiều mát mình sẽ chạy bù bài hôm qua nhé!
              </div>
            </div>
          </div>

          {/* Input nhập tin nhắn dưới đáy hộp chat */}
          <div className="p-2.5 bg-[#131F3B] border-t border-blue-900 flex items-center space-x-2">
            <input
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Tinh binh liem / Nhập tin nhắn hỏi Coach..."
              className="bg-[#0B1324] border border-blue-900 rounded-xl px-3 py-1.5 text-xs w-full text-white focus:outline-none focus:border-[#FC4C02] transition"
            />
            <button className="bg-[#FC4C02] hover:bg-orange-600 text-white font-bold p-1.5 rounded-xl text-xs transition">
              ➔
            </button>
          </div>
        </>
      )}
    </div>
  );
}
