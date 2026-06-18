'use client';
import React, { useState } from 'react';
import ChatWidget from './chatWidget';

// Mock training data for June 2026
const MOCK_ACTIVITIES = {
  '2026-06-01': {
    type: 'run',
    title: 'Trail Run - Base Endurance',
    distance: '5.0 km',
    duration: '28m 30s',
    pace: '5:42 /km',
    calories: '354 kcal',
    status: 'completed',
    coachNote: 'Tốc độ duy trì rất tốt ở vùng nhịp tim Zone 2. Cơ đùi sau hoạt động ổn định.',
  },
  '2026-06-03': {
    type: 'strength',
    title: 'Lower Body Strength Training',
    duration: '45m',
    calories: '280 kcal',
    status: 'completed',
    coachNote: 'Hoàn thành đầy đủ các hiệp squat và lunge. Hãy chú ý phục hồi cơ bắp tối nay.',
  },
  '2026-06-05': {
    type: 'run',
    title: 'Interval Run - Speed Build',
    distance: '6.0 km',
    duration: '31m 15s',
    pace: '5:12 /km',
    calories: '420 kcal',
    status: 'completed',
    coachNote: 'Đạt ngưỡng pace 4:45 ở hiệp chạy nhanh cuối cùng. Rất tốt!',
  },
  '2026-06-08': {
    type: 'run',
    title: 'Trail Run - Hills & Elevation',
    distance: '8.0 km',
    duration: '48m 10s',
    pace: '6:01 /km',
    calories: '590 kcal',
    status: 'completed',
    coachNote: 'Kỹ thuật đổ dốc (downhill) đã cải thiện. Hãy tập trung tiếp đất bằng nửa bàn chân trước.',
  },
  '2026-06-10': {
    type: 'run',
    title: 'Recovery Run',
    distance: '4.0 km',
    status: 'missed',
    coachNote: 'Bạn đã bỏ lỡ buổi này. Đừng quá lo lắng, hãy đảm bảo ngủ đủ giấc và bù nước đầy đủ.',
  },
  '2026-06-12': {
    type: 'strength',
    title: 'Core & Upper Body Stability',
    duration: '50m',
    calories: '310 kcal',
    status: 'completed',
    coachNote: 'Tốt. Bài tập Plank đạt mốc 3 phút liên tục. Giữ vững phong độ!',
  },
  '2026-06-14': {
    type: 'run',
    title: 'Sunday Long Run',
    distance: '12.0 km',
    duration: '1h 10m',
    pace: '5:50 /km',
    calories: '850 kcal',
    status: 'completed',
    coachNote: 'Cự ly dài nhất trong tháng này. Khả năng phân phối sức lực chặng cuối tốt.',
  },
  '2026-06-16': {
    type: 'run',
    title: 'Active Recovery Jog',
    distance: '4.0 km',
    duration: '25m 40s',
    pace: '6:25 /km',
    calories: '260 kcal',
    status: 'completed',
    coachNote: 'Nhịp tim trung bình 132 bpm, đạt chuẩn hồi phục chủ động.',
  },
  '2026-06-17': {
    type: 'strength',
    title: 'Full Body Mobility & Stretch',
    duration: '40m',
    calories: '180 kcal',
    status: 'completed',
    coachNote: 'Hôm nay bạn đã hoàn thành bài kéo giãn cơ khớp. Giúp cơ thể sẵn sàng cho buổi chạy dài tiếp theo.',
  },
  '2026-06-19': {
    type: 'run',
    title: 'Tempo Run - Lactate Threshold',
    distance: '7.0 km',
    pace: '5:15 /km (Mục tiêu)',
    status: 'planned',
    coachNote: 'Bài tập duy trì ngưỡng mỏi. Chuẩn bị sẵn gel năng lượng và nước điện giải.',
  },
  '2026-06-21': {
    type: 'run',
    title: 'Long Trail Run - Endurance Booster',
    distance: '15.0 km',
    pace: '6:10 /km (Mục tiêu)',
    status: 'planned',
    coachNote: 'Chạy đường mòn cự ly dài cuối tuần. Nhớ trang bị vest nước và mũ chống nắng.',
  },
  '2026-06-23': {
    type: 'run',
    title: 'Recovery Run',
    distance: '5.0 km',
    status: 'planned',
    coachNote: 'Chạy chậm nhẹ nhàng sau ngày chạy dài.',
  },
  '2026-06-25': {
    type: 'strength',
    title: 'Core & Leg Explosiveness',
    duration: '45m',
    status: 'planned',
    coachNote: 'Bài tập bổ trợ sức mạnh bàn chân và cổ chân phòng tránh chấn thương.',
  },
  '2026-06-28': {
    type: 'run',
    title: 'Half Marathon Simulation',
    distance: '21.1 km',
    status: 'planned',
    coachNote: 'Bài kiểm tra thể lực tổng thể trước thềm giải đấu chính thức.',
  },
};

export default function Calendar() {
  const [currentDate, setCurrentDate] = useState(new Date(2026, 5, 17)); // Default to June 17, 2026
  const [selectedDate, setSelectedDate] = useState(new Date(2026, 5, 17));
  const [viewMode, setViewMode] = useState('month'); // 'month' or 'list'

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const monthNames = [
    'Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4', 'Tháng 5', 'Tháng 6',
    'Tháng 7', 'Tháng 8', 'Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12'
  ];

  // Get total days in month
  const getDaysInMonth = (y, m) => new Date(y, m + 1, 0).getDate();

  // Get start day of month (Monday-indexed: 0 = Mon, ..., 6 = Sun)
  const getStartDayIndex = (y, m) => {
    const day = new Date(y, m, 1).getDay();
    return day === 0 ? 6 : day - 1;
  };

  const daysInMonth = getDaysInMonth(year, month);
  const startDayIndex = getStartDayIndex(year, month);

  const prevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const formatDateKey = (y, m, d) => {
    const mm = String(m + 1).padStart(2, '0');
    const dd = String(d).padStart(2, '0');
    return `${y}-${mm}-${dd}`;
  };

  // Generate calendar grid array
  const calendarCells = [];
  
  // Previous month padding days
  const prevMonthYear = month === 0 ? year - 1 : year;
  const prevMonthVal = month === 0 ? 11 : month - 1;
  const daysInPrevMonth = getDaysInMonth(prevMonthYear, prevMonthVal);
  for (let i = startDayIndex - 1; i >= 0; i--) {
    calendarCells.push({
      day: daysInPrevMonth - i,
      month: prevMonthVal,
      year: prevMonthYear,
      isCurrentMonth: false,
    });
  }

  // Current month days
  for (let i = 1; i <= daysInMonth; i++) {
    calendarCells.push({
      day: i,
      month: month,
      year: year,
      isCurrentMonth: true,
    });
  }

  // Next month padding days
  const nextMonthYear = month === 11 ? year + 1 : year;
  const nextMonthVal = month === 11 ? 0 : month + 1;
  const remainingCells = 42 - calendarCells.length;
  for (let i = 1; i <= remainingCells; i++) {
    calendarCells.push({
      day: i,
      month: nextMonthVal,
      year: nextMonthYear,
      isCurrentMonth: false,
    });
  }

  const selectedDateKey = formatDateKey(
    selectedDate.getFullYear(),
    selectedDate.getMonth(),
    selectedDate.getDate()
  );
  const selectedActivity = MOCK_ACTIVITIES[selectedDateKey];

  return (
    <div className="p-4 lg:p-6 space-y-6 flex-1 flex flex-col min-h-0 bg-[#0B0F19]">
      {/* HEADER SECTION */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-[#111A2E] p-4 rounded-2xl border border-blue-900/50 shadow-lg">
        <div>
          <h2 className="text-lg font-black text-white uppercase tracking-wider flex items-center">
            <span className="w-2.5 h-2.5 bg-[#FC4C02] rounded-full mr-2.5 animate-pulse"></span>
            Lịch Trình Luyện Tập
          </h2>
          <p className="text-xs text-slate-400 mt-1">Theo dõi, lên kế hoạch chạy bộ và bài tập bổ trợ sức bền</p>
        </div>

        <div className="flex items-center space-x-3 w-full sm:w-auto justify-between sm:justify-end">
          <div className="flex items-center bg-[#0B1324] rounded-xl border border-blue-950 p-1">
            <button
              onClick={() => setViewMode('month')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                viewMode === 'month' ? 'bg-[#FC4C02] text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              Tháng
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                viewMode === 'list' ? 'bg-[#FC4C02] text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              Danh sách
            </button>
          </div>

          <button className="bg-gradient-to-r from-[#FC4C02] to-orange-600 hover:opacity-90 text-white text-xs font-black px-4 py-2.5 rounded-xl shadow-md transition transform active:scale-95">
            + Thêm bài tập
          </button>
        </div>
      </div>

      {/* MAIN LAYOUT */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 items-start flex-1 min-h-0">
        
        {/* LEFT / CENTER: CALENDAR GRID OR LIST VIEW */}
        <div className="xl:col-span-2 bg-[#131926] border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xl flex flex-col h-full">
          {/* Calendar Month Navigation Header */}
          <div className="flex items-center justify-between pb-4 border-b border-slate-800/60 mb-4">
            <div className="flex items-center space-x-2">
              <span className="text-base font-black text-white">{monthNames[month]}</span>
              <span className="text-xs font-bold text-[#FC4C02] bg-[#FC4C02]/10 px-2 py-0.5 rounded-md border border-[#FC4C02]/20">{year}</span>
            </div>
            <div className="flex items-center space-x-1">
              <button
                onClick={prevMonth}
                className="w-8 h-8 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-white flex items-center justify-center text-sm font-bold border border-slate-700/50 transition active:scale-95"
              >
                &lt;
              </button>
              <button
                onClick={() => setCurrentDate(new Date(2026, 5, 17))}
                className="px-2.5 h-8 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-xs font-bold text-slate-300 transition active:scale-95 border border-slate-700/50"
              >
                Hôm nay
              </button>
              <button
                onClick={nextMonth}
                className="w-8 h-8 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-white flex items-center justify-center text-sm font-bold border border-slate-700/50 transition active:scale-95"
              >
                &gt;
              </button>
            </div>
          </div>

          {viewMode === 'month' ? (
            <div className="flex-1 flex flex-col">
              {/* Day names header */}
              <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">
                <div>T2</div>
                <div>T3</div>
                <div>T4</div>
                <div>T5</div>
                <div>T6</div>
                <div>T7</div>
                <div className="text-red-500/80">CN</div>
              </div>

              {/* Day cells grid */}
              <div className="grid grid-cols-7 gap-1.5 flex-1 min-h-0">
                {calendarCells.map((cell, idx) => {
                  const dateKey = formatDateKey(cell.year, cell.month, cell.day);
                  const act = MOCK_ACTIVITIES[dateKey];
                  const isSelected =
                    selectedDate.getDate() === cell.day &&
                    selectedDate.getMonth() === cell.month &&
                    selectedDate.getFullYear() === cell.year;

                  const isToday =
                    cell.day === 17 &&
                    cell.month === 5 &&
                    cell.year === 2026;

                  // Border and bg colors based on status
                  let borderStyle = 'border-slate-800/40 hover:border-slate-700';
                  let bgStyle = 'bg-slate-900/30';
                  let statusIndicator = null;

                  if (act) {
                    if (act.status === 'completed') {
                      borderStyle = isSelected ? 'border-[#FC4C02]' : 'border-emerald-500/30 hover:border-emerald-500/60';
                      bgStyle = isSelected ? 'bg-emerald-950/20' : 'bg-emerald-950/10';
                      statusIndicator = (
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_6px_#10b981]" />
                      );
                    } else if (act.status === 'planned') {
                      borderStyle = isSelected ? 'border-[#FC4C02]' : 'border-amber-500/30 hover:border-amber-500/60';
                      bgStyle = isSelected ? 'bg-amber-950/20' : 'bg-amber-950/10';
                      statusIndicator = (
                        <div className="w-1.5 h-1.5 rounded-full bg-amber-500 shadow-[0_0_6px_#f59e0b]" />
                      );
                    } else if (act.status === 'missed') {
                      borderStyle = isSelected ? 'border-[#FC4C02]' : 'border-red-500/30 hover:border-red-500/60';
                      bgStyle = isSelected ? 'bg-red-950/20' : 'bg-red-950/10';
                      statusIndicator = (
                        <div className="w-1.5 h-1.5 rounded-full bg-red-500 shadow-[0_0_6px_#ef4444]" />
                      );
                    }
                  } else if (isSelected) {
                    borderStyle = 'border-[#FC4C02]';
                    bgStyle = 'bg-slate-800/40';
                  }

                  return (
                    <div
                      key={idx}
                      onClick={() => {
                        setSelectedDate(new Date(cell.year, cell.month, cell.day));
                      }}
                      className={`min-h-[60px] p-2 border rounded-xl flex flex-col justify-between cursor-pointer transition transform active:scale-98 ${bgStyle} ${borderStyle} ${
                        !cell.isCurrentMonth ? 'opacity-30' : 'opacity-100'
                      } ${isToday ? 'relative ring-1 ring-[#FC4C02]/50 shadow-[0_0_10px_rgba(252,76,2,0.1)]' : ''}`}
                    >
                      {/* Cell Header */}
                      <div className="flex justify-between items-center">
                        <span
                          className={`text-xs font-bold ${
                            isToday
                              ? 'text-white bg-[#FC4C02] w-5 h-5 rounded-full flex items-center justify-center text-[10px]'
                              : cell.isCurrentMonth
                              ? 'text-white'
                              : 'text-slate-500'
                          }`}
                        >
                          {cell.day}
                        </span>
                        {statusIndicator}
                      </div>

                      {/* Workout Quick Tag */}
                      {act && (
                        <div className="mt-1 truncate">
                          <span
                            className={`text-[9px] font-black px-1.5 py-0.5 rounded uppercase ${
                              act.type === 'run'
                                ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                                : 'bg-purple-500/10 text-purple-400 border border-purple-500/20'
                            }`}
                          >
                            {act.type === 'run' ? '🏃 CHẠY' : '💪 BỔ TRỢ'}
                          </span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Status Guide Footer */}
              <div className="mt-4 pt-3 border-t border-slate-800/50 flex flex-wrap gap-4 justify-start text-[10px] font-bold text-slate-400">
                <div className="flex items-center space-x-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span>Đã hoàn thành</span>
                </div>
                <div className="flex items-center space-x-1.5">
                  <span className="w-2 h-2 rounded-full bg-amber-500" />
                  <span>Kế hoạch sắp tới</span>
                </div>
                <div className="flex items-center space-x-1.5">
                  <span className="w-2 h-2 rounded-full bg-red-500" />
                  <span>Bỏ lỡ</span>
                </div>
                <div className="flex items-center space-x-1.5">
                  <span className="w-2.5 h-2.5 rounded-full border border-dashed border-[#FC4C02]" />
                  <span>Hôm nay</span>
                </div>
              </div>
            </div>
          ) : (
            /* LIST VIEW */
            <div className="flex-1 overflow-y-auto space-y-3 pr-1">
              {Object.keys(MOCK_ACTIVITIES)
                .sort((a, b) => new Date(a) - new Date(b))
                .map((dateStr) => {
                  const act = MOCK_ACTIVITIES[dateStr];
                  const dObj = new Date(dateStr);
                  const formattedDate = `${dObj.getDate()} Thg ${dObj.getMonth() + 1}, ${dObj.getFullYear()}`;
                  const isSelected = selectedDateKey === dateStr;

                  let borderCls = 'border-slate-800 hover:border-slate-700 bg-slate-900/40';
                  let badgeCls = 'bg-slate-800 text-slate-400';
                  
                  if (act.status === 'completed') {
                    borderCls = isSelected ? 'border-[#FC4C02] bg-emerald-950/15' : 'border-emerald-500/20 bg-emerald-950/5 hover:border-emerald-500/40';
                    badgeCls = 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20';
                  } else if (act.status === 'planned') {
                    borderCls = isSelected ? 'border-[#FC4C02] bg-amber-950/15' : 'border-amber-500/20 bg-amber-950/5 hover:border-amber-500/40';
                    badgeCls = 'bg-amber-500/10 text-amber-400 border border-amber-500/20';
                  } else if (act.status === 'missed') {
                    borderCls = isSelected ? 'border-[#FC4C02] bg-red-950/15' : 'border-red-500/20 bg-red-950/5 hover:border-red-500/40';
                    badgeCls = 'bg-red-500/10 text-red-400 border border-red-500/20';
                  }

                  return (
                    <div
                      key={dateStr}
                      onClick={() => setSelectedDate(dObj)}
                      className={`p-3.5 border rounded-xl flex items-center justify-between cursor-pointer transition ${borderCls}`}
                    >
                      <div className="flex items-center space-x-3.5">
                        <span className="text-[20px]">{act.type === 'run' ? '🏃' : '🏋️'}</span>
                        <div>
                          <p className="text-xs font-black text-white">{act.title}</p>
                          <p className="text-[10px] text-slate-400 font-bold mt-0.5">{formattedDate}</p>
                        </div>
                      </div>

                      <div className="flex items-center space-x-3">
                        {act.distance && (
                          <span className="text-[10px] font-bold text-slate-300 bg-slate-800/80 px-2 py-1 rounded-lg">
                            {act.distance}
                          </span>
                        )}
                        <span className={`text-[9px] font-black px-2 py-1 rounded-lg uppercase ${badgeCls}`}>
                          {act.status}
                        </span>
                      </div>
                    </div>
                  );
                })}
            </div>
          )}
        </div>

        {/* RIGHT: DETAILED ACTIVITY SUMMARY & AI COACH WIDGET */}
        <div className="space-y-6 flex flex-col">
          <div className="bg-[#111A2E] border border-blue-900/60 rounded-2xl p-5 shadow-xl flex flex-col space-y-4">
          <div className="pb-3 border-b border-blue-900 flex justify-between items-center">
            <h3 className="text-xs font-black text-white uppercase tracking-wider">Chi Tiết Ngày Chọn</h3>
            <span className="text-[10px] text-[#FC4C02] font-black font-mono">
              {selectedDate.getDate()} / {selectedDate.getMonth() + 1} / {selectedDate.getFullYear()}
            </span>
          </div>

          {selectedActivity ? (
            <div className="space-y-4 flex-1 flex flex-col justify-between">
              <div className="space-y-4">
                {/* Activity title & type badge */}
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="text-2xl">{selectedActivity.type === 'run' ? '🏃' : '💪'}</span>
                    <div>
                      <h4 className="text-sm font-black text-white leading-snug">{selectedActivity.title}</h4>
                      <span className={`inline-block text-[9px] font-black px-2 py-0.5 rounded-md mt-1 uppercase ${
                        selectedActivity.status === 'completed'
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : selectedActivity.status === 'planned'
                          ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                          : 'bg-red-500/10 text-red-400 border border-red-500/20'
                      }`}>
                        {selectedActivity.status === 'completed'
                          ? 'Hoàn thành'
                          : selectedActivity.status === 'planned'
                          ? 'Chưa hoàn thành'
                          : 'Đã bỏ lỡ'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Workout metrics */}
                <div className="grid grid-cols-2 gap-3 bg-[#0B1324] p-3 rounded-xl border border-blue-950/60">
                  {selectedActivity.distance && (
                    <div className="space-y-0.5">
                      <p className="text-[9px] font-bold text-slate-500 uppercase">Quãng đường</p>
                      <p className="text-xs font-black text-white">{selectedActivity.distance}</p>
                    </div>
                  )}
                  {selectedActivity.duration && (
                    <div className="space-y-0.5">
                      <p className="text-[9px] font-bold text-slate-500 uppercase">Thời gian</p>
                      <p className="text-xs font-black text-white">{selectedActivity.duration}</p>
                    </div>
                  )}
                  {selectedActivity.pace && (
                    <div className="space-y-0.5">
                      <p className="text-[9px] font-bold text-slate-500 uppercase">Pace trung bình</p>
                      <p className="text-xs font-black text-white">{selectedActivity.pace}</p>
                    </div>
                  )}
                  {selectedActivity.calories && (
                    <div className="space-y-0.5">
                      <p className="text-[9px] font-bold text-slate-500 uppercase">Lượng Calo</p>
                      <p className="text-xs font-black text-white">{selectedActivity.calories}</p>
                    </div>
                  )}
                </div>

                {/* AI Coach section */}
                <div className="bg-[#1B2A4A]/50 border border-blue-900/40 rounded-xl p-3.5 space-y-2">
                  <div className="flex items-center space-x-1.5">
                    <span className="text-xs">🤖</span>
                    <span className="text-[10px] font-black text-slate-300 uppercase tracking-wider">Nhận xét từ AI Coach</span>
                  </div>
                  <p className="text-xs text-slate-200 leading-relaxed font-medium">
                    {selectedActivity.coachNote}
                  </p>
                </div>
              </div>

              {/* Action Button */}
              {selectedActivity.status === 'planned' && (
                <button className="w-full bg-[#FC4C02] hover:bg-orange-600 text-white text-xs font-black py-2.5 rounded-xl shadow-lg transition active:scale-98">
                  Đánh dấu Hoàn Thành
                </button>
              )}
              {selectedActivity.status === 'completed' && (
                <button className="w-full bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-black py-2.5 rounded-xl transition active:scale-98">
                  Xem phân tích biểu đồ nhịp tim
                </button>
              )}
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-6 space-y-3">
              <span className="text-3xl text-slate-600">🛌</span>
              <div>
                <p className="text-xs font-black text-white">Ngày Nghỉ Phục Hồi</p>
                <p className="text-[10px] text-slate-500 mt-1 max-w-[200px]">Không có bài tập nào được lập lịch hôm nay. Hãy nghỉ ngơi đầy đủ để phục hồi cơ bắp.</p>
              </div>
              <button className="bg-slate-800/80 hover:bg-slate-700 text-white text-[10px] font-black px-3 py-2 rounded-lg border border-slate-700/50 transition">
                + Thêm bài tập mới
              </button>
            </div>
          )}
          </div>
          
          <ChatWidget />
        </div>

      </div>
    </div>
  );
}
