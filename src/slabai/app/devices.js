'use client';
import React, { useState } from 'react';

export default function DevicesView() {
    // Trạng thái kết nối giả lập của các nền tảng/thiết bị
    const [connections, setConnections] = useState({
        strava: true,
        garmin: true,
        appleHealth: false,
        polar: false,
        wahoo: false
    });

    const toggleConnection = (key) => {
        setConnections(prev => ({ ...prev, [key]: !prev[key] }));
    };

    return (
        <div className="space-y-6 animate-fadeIn">
            {/* HEADER MÀN HÌNH */}
            <div>
                <h2 className="text-xl font-black text-white uppercase tracking-wider flex items-center">
                    <span className="w-2.5 h-2.5 bg-[#FC4C02] rounded-full mr-2"></span> Devices &amp; Apps
                </h2>
                <p className="text-xs text-slate-400 mt-1">Kết nối các thiết bị đeo thông minh và ứng dụng vệ tinh để tự động hóa dữ liệu đầu vào</p>
            </div>

            {/* PHÂN VÙNG 1: NỀN TẢNG ĐỒNG BỘ ĐÁM MÂY (Cloud Platforms) */}
            <div className="space-y-3">
                <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">Ứng dụng &amp; Nền tảng cốt lõi</h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* CARD: STRAVA */}
                    <div className="bg-[#131926] border border-slate-800 rounded-2xl p-4 flex items-center justify-between shadow-xl transition hover:border-slate-700">
                        <div className="flex items-center space-x-4">
                            <div className="w-12 h-12 rounded-xl bg-[#FC4C02]/10 flex items-center justify-center text-xl">
                                🧡
                            </div>
                            <div>
                                <h4 className="text-sm font-bold text-white flex items-center gap-2">
                                    Strava Sync
                                    {connections.strava && <span className="bg-emerald-500/10 text-emerald-400 text-[9px] px-1.5 py-0.5 rounded-md font-bold">Connected</span>}
                                </h4>
                                <p className="text-[11px] text-slate-400 mt-0.5">Đồng bộ hoạt động, phân đoạn đường và bảng tương tác xã hội</p>
                            </div>
                        </div>
                        <button
                            onClick={() => toggleConnection('strava')}
                            className={`text-xs font-black px-4 py-2 rounded-xl border transition ${connections.strava
                                    ? 'border-slate-800 bg-slate-800/40 text-slate-400 hover:text-rose-400 hover:border-rose-900/30'
                                    : 'border-[#FC4C02] bg-[#FC4C02] text-white hover:bg-orange-600'
                                }`}
                        >
                            {connections.strava ? 'Disconnect' : 'Connect'}
                        </button>
                    </div>

                    {/* CARD: GARMIN CONNECT */}
                    <div className="bg-[#131926] border border-slate-800 rounded-2xl p-4 flex items-center justify-between shadow-xl transition hover:border-slate-700">
                        <div className="flex items-center space-x-4">
                            <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center text-xl">
                                ⌚
                            </div>
                            <div>
                                <h4 className="text-sm font-bold text-white flex items-center gap-2">
                                    Garmin Connect
                                    {connections.garmin && <span className="bg-emerald-500/10 text-emerald-400 text-[9px] px-1.5 py-0.5 rounded-md font-bold">Connected</span>}
                                </h4>
                                <p className="text-[11px] text-slate-400 mt-0.5">Thu thập chỉ số nhịp tim, HRV, giấc ngủ và tải tập luyện thô</p>
                            </div>
                        </div>
                        <button
                            onClick={() => toggleConnection('garmin')}
                            className={`text-xs font-black px-4 py-2 rounded-xl border transition ${connections.garmin
                                    ? 'border-slate-800 bg-slate-800/40 text-slate-400 hover:text-rose-400 hover:border-rose-900/30'
                                    : 'border-blue-500 bg-blue-500 text-white hover:bg-blue-600'
                                }`}
                        >
                            {connections.garmin ? 'Disconnect' : 'Connect'}
                        </button>
                    </div>
                </div>
            </div>

            {/* PHÂN VÙNG 2: ỨNG DỤNG DI ĐỘNG & THIẾT BỊ PHỤ TRỢ */}
            <div className="space-y-3 pt-2">
                <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">Nền tảng bổ trợ khác</h3>

                <div className="bg-[#131926] border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
                    <div className="divide-y divide-slate-800/60">

                        {/* Hàng 1: Apple Health / Google Fit */}
                        <div className="p-4 flex items-center justify-between sm:flex-row flex-col gap-4 text-center sm:text-left">
                            <div className="flex items-center space-x-3 sm:flex-row flex-col">
                                <span className="text-xl p-2 bg-slate-900 rounded-xl">❤️</span>
                                <div>
                                    <h4 className="text-xs font-bold text-slate-200">Apple Health / Google Fit Mobile Kit</h4>
                                    <p className="text-[10px] text-slate-500 mt-0.5">Lấy dữ liệu bước chân sinh hoạt hàng ngày và năng lượng chuyển hóa tĩnh</p>
                                </div>
                            </div>
                            <button
                                onClick={() => toggleConnection('appleHealth')}
                                className={`text-[11px] font-bold px-3 py-1.5 rounded-lg border transition ${connections.appleHealth ? 'bg-slate-800 text-slate-400 border-transparent' : 'border-slate-700 text-slate-300 hover:border-white'
                                    }`}
                            >
                                {connections.appleHealth ? 'Ngắt kết nối' : 'Liên kết App'}
                            </button>
                        </div>

                        {/* Hàng 2: Wahoo Fitness */}
                        <div className="p-4 flex items-center justify-between sm:flex-row flex-col gap-4 text-center sm:text-left">
                            <div className="flex items-center space-x-3 sm:flex-row flex-col">
                                <span className="text-xl p-2 bg-slate-900 rounded-xl">🚴</span>
                                <div>
                                    <h4 className="text-xs font-bold text-slate-200">Wahoo Fitness Ecosystem</h4>
                                    <p className="text-[10px] text-slate-500 mt-0.5">Đồng bộ trực tiếp dữ liệu từ Smart Trainer và Sensor đo siêu tốc độ đạp xe</p>
                                </div>
                            </div>
                            <button
                                onClick={() => toggleConnection('wahoo')}
                                className={`text-[11px] font-bold px-3 py-1.5 rounded-lg border transition ${connections.wahoo ? 'bg-slate-800 text-slate-400 border-transparent' : 'border-slate-700 text-slate-300 hover:border-white'
                                    }`}
                            >
                                {connections.wahoo ? 'Ngắt kết nối' : 'Liên kết App'}
                            </button>
                        </div>

                        {/* Hàng 3: Suunto / Polar */}
                        <div className="p-4 flex items-center justify-between sm:flex-row flex-col gap-4 text-center sm:text-left">
                            <div className="flex items-center space-x-3 sm:flex-row flex-col">
                                <span className="text-xl p-2 bg-slate-900 rounded-xl">🏔️</span>
                                <div>
                                    <h4 className="text-xs font-bold text-slate-200">Suunto &amp; Polar Cloud Integration</h4>
                                    <p className="text-[10px] text-slate-500 mt-0.5">Dành cho vận động viên sử dụng hệ sinh thái đồng hồ chuyên phục vụ chạy Trail địa hình</p>
                                </div>
                            </div>
                            <button
                                onClick={() => toggleConnection('polar')}
                                className={`text-[11px] font-bold px-3 py-1.5 rounded-lg border transition ${connections.polar ? 'bg-slate-800 text-slate-400 border-transparent' : 'border-slate-700 text-slate-300 hover:border-white'
                                    }`}
                            >
                                {connections.polar ? 'Ngắt kết nối' : 'Liên kết App'}
                            </button>
                        </div>

                    </div>
                </div>
            </div>

            {/* PHÂN VÙNG TỔNG KẾT TRẠNG THÁI (Dữ liệu nền RAG) */}
            <div className="bg-[#0D1424] border border-blue-950 rounded-2xl p-4 flex flex-col sm:flex-row justify-between items-center gap-4 shadow-2xl">
                <div className="text-center sm:text-left">
                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Trạng thái đồng bộ RAG Pipeline</p>
                    <p className="text-xs font-medium text-slate-300 mt-1">
                        Mạng lưới đang lắng nghe từ <span className="text-[#FC4C02] font-bold">2 nguồn luồng dữ liệu chính thức</span>. Giáo án thích ứng sẽ tự động cập nhật sau mỗi 5 phút kể từ khi bạn hoàn thành hoạt động thể chất trên Strava/Garmin.
                    </p>
                </div>
                <div className="bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-xl text-center min-w-[120px]">
                    <span className="text-[10px] font-black text-emerald-400 block uppercase">Real-time Webhook</span>
                    <span className="text-xs font-mono text-white font-bold">Active</span>
                </div>
            </div>
        </div>
    );
}