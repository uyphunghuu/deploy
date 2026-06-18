'use client';
import React, { useState } from 'react';

export default function AuthModals({ isOpen, onClose, onAuthSuccess }) {
  const [step, setStep] = useState('login'); // login | register | details
  
  // Form States
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [gender, setGender] = useState('Male');
  const [birthdate, setBirthdate] = useState('');
  const [trainingHours, setTrainingHours] = useState(4);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fadeIn">
      
      {/* KHUNG POPUP CONTAINER */}
      <div className="bg-[#131926] border border-slate-800 w-full max-w-md rounded-2xl overflow-hidden shadow-2xl relative flex flex-col">
        
        {/* Nút đóng chủ động */}
        {onClose && (
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 text-slate-500 hover:text-white text-sm font-bold transition z-10"
          >
            ✕
          </button>
        )}

        {/* LOGO ĐỈNH POPUP */}
        <div className="bg-[#113166] py-5 flex justify-center items-center border-b border-blue-900">
          <span className="text-[#FC4C02] text-3xl font-black italic tracking-wider">S</span>
          <span className="text-white text-xl font-bold tracking-tight">Lab</span>
          <span className="text-[#FC4C02] text-xl font-bold tracking-tight">AI</span>
        </div>

        <div className="p-6 flex-1 overflow-y-auto">
          
          {/* ================= MÀN HÌNH 1: ĐĂNG NHẬP ================= */}
          {step === 'login' && (
            <div className="space-y-4 animate-fadeIn">
              <div className="text-center">
                <h3 className="text-lg font-black text-white">Chào mừng bạn trở lại</h3>
                <p className="text-xs text-slate-400 mt-1">Đăng nhập để tiếp tục tối ưu hóa lịch tập cùng AI</p>
              </div>

              <div className="space-y-3 pt-2">
                <div>
                  <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">Email address *</label>
                  <input 
                    type="email" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com" 
                    className="w-full bg-[#0B0F19] border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#FC4C02] transition"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">Password *</label>
                  <input 
                    type="password" 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••" 
                    className="w-full bg-[#0B0F19] border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#FC4C02] transition"
                  />
                </div>
              </div>

              <button 
                onClick={() => setStep('details')} // Giả lập đăng nhập thành công chuyển sang bổ sung thông tin nếu cần
                className="w-full bg-[#FC4C02] hover:bg-orange-600 text-white font-black py-2.5 rounded-xl text-xs shadow-lg shadow-orange-600/10 transition mt-4"
              >
                Sign In
              </button>

              <div className="text-center pt-2 text-xs text-slate-400">
                Chưa có tài khoản?{' '}
                <button onClick={() => setStep('register')} className="text-[#FC4C02] font-bold hover:underline">
                  Đăng ký ngay
                </button>
              </div>
            </div>
          )}

          {/* ================= MÀN HÌNH 2: ĐĂNG KÝ (Step 1 of 5 Athletica Style) ================= */}
          {step === 'register' && (
            <div className="space-y-4 animate-fadeIn">
              <div className="text-center">
                <div className="text-[10px] text-slate-500 font-bold tracking-widest uppercase mb-1">Step 1 of 5 — —— —— —— ——</div>
                <h3 className="text-lg font-black text-white">Let<span>&apos;</span>s get you started</h3>
                <p className="text-xs text-slate-400 mt-0.5">Chỉ mất khoảng 60 giây để thiết lập tài khoản thô</p>
              </div>

              <div className="space-y-3 pt-2">
                <div>
                  <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">Your name *</label>
                  <input 
                    type="text" 
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Nhập họ và tên" 
                    className="w-full bg-[#0B0F19] border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#FC4C02] transition"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">Email address *</label>
                  <input 
                    type="email" 
                    placeholder="you@example.com" 
                    className="w-full bg-[#0B0F19] border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#FC4C02] transition"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">Password *</label>
                    <input type="password" placeholder="Tối thiểu 8 ký tự" className="w-full bg-[#0B0F19] border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#FC4C02] transition" />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">Confirm password *</label>
                    <input type="password" placeholder="Nhập lại mật khẩu" className="w-full bg-[#0B0F19] border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#FC4C02] transition" />
                  </div>
                </div>
              </div>

              <div className="flex items-start space-x-2 pt-1 text-[11px] text-slate-400">
                <input type="checkbox" id="terms" className="mt-0.5 accent-[#FC4C02]" />
                <label htmlFor="terms">Tôi đồng ý với các <span className="text-blue-400 cursor-pointer">Điều khoản sử dụng</span> và <span className="text-blue-400 cursor-pointer">Chính sách bảo mật</span>.</label>
              </div>

              <button 
                onClick={() => setStep('details')}
                className="w-full bg-[#113166] hover:bg-blue-800 text-white font-black py-2.5 rounded-xl text-xs shadow-lg transition mt-2"
              >
                Create Account & Next
              </button>

              <div className="text-center pt-1 text-xs text-slate-400">
                Đã có tài khoản?{' '}
                <button onClick={() => setStep('login')} className="text-[#FC4C02] font-bold hover:underline">
                  Sign In
                </button>
              </div>
            </div>
          )}

          {/* ================= MÀN HÌNH 3: NHẬP THÔNG TIN CÁ NHÂN (Step 5 of 5) ================= */}
          {step === 'details' && (
            <div className="space-y-4 animate-fadeIn">
              <div className="text-center">
                <div className="text-[10px] text-slate-500 font-bold tracking-widest uppercase mb-1">Step 5 of 5 — — — — ——</div>
                <h3 className="text-lg font-black text-white">A few more details</h3>
                <p className="text-xs text-slate-400 mt-0.5">Thông tin này giúp huấn luyện viên AI tối ưu hóa tải lượng tập luyện</p>
              </div>

              <div className="space-y-4 pt-1">
                {/* Lựa chọn giới tính */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1.5">Select Your Gender</label>
                  <div className="grid grid-cols-3 gap-2">
                    {['Male', 'Female', 'Other'].map((g) => (
                      <button
                        key={g}
                        type="button"
                        onClick={() => setGender(g)}
                        className={`py-2 rounded-xl text-xs font-bold border transition flex flex-col items-center justify-center gap-1 ${
                          gender === g 
                            ? 'border-[#FC4C02] bg-[#FC4C02]/10 text-white' 
                            : 'border-slate-800 bg-[#0B0F19] text-slate-400 hover:text-white'
                        }`}
                      >
                        <span>{g === 'Male' ? '👤' : g === 'Female' ? '👩' : '👥'}</span>
                        <span>{g}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Ngày sinh */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">Date of Birth</label>
                  <input 
                    type="date" 
                    value={birthdate}
                    onChange={(e) => setBirthdate(e.target.value)}
                    className="w-full bg-[#0B0F19] border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#FC4C02] uppercase font-mono"
                  />
                </div>

                {/* Giờ tập luyện tuần (Slider) */}
                <div>
                  <div className="flex justify-between items-center mb-1 text-[11px] font-bold uppercase">
                    <span className="text-slate-400">Weekly Training Hours</span>
                    <span className="text-[#FC4C02] bg-[#FC4C02]/10 px-2 py-0.5 rounded font-mono">{trainingHours} hours</span>
                  </div>
                  <input 
                    type="range" 
                    min="1" 
                    max="20" 
                    value={trainingHours}
                    onChange={(e) => setTrainingHours(Number(e.target.value))}
                    className="w-full accent-[#FC4C02] bg-slate-800 h-1.5 rounded-lg appearance-none cursor-pointer"
                  />
                  <div className="flex justify-between text-[9px] text-slate-500 font-mono mt-1 font-bold">
                    <span>1 hr</span>
                    <span>5 hrs</span>
                    <span>10 hrs</span>
                    <span>15 hrs</span>
                    <span>20 hrs</span>
                  </div>
                </div>
              </div>

              {/* Khối điều hướng chân popup */}
              <div className="flex space-x-3 pt-3 border-t border-slate-800/60 mt-4">
                <button 
                  onClick={() => setStep('register')}
                  className="flex-1 bg-slate-800 hover:bg-slate-700 text-white font-bold py-2 rounded-xl text-xs transition"
                >
                  ◀ Back
                </button>
                <button 
                  onClick={() => onAuthSuccess({ name: fullName || email.split('@')[0] || 'User', email })}
                  className="flex-[2] bg-gradient-to-r from-[#FC4C02] to-orange-600 text-white font-black py-2 rounded-xl text-xs shadow-lg shadow-orange-600/20 transition"
                >
                  Start Training ▶
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
