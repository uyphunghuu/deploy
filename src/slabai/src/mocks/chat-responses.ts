export const mockResponses: { keywords: string[]; response: string }[] = [
  {
    keywords: ["chạy", "chạy bộ", "run", "running"],
    response: "Chạy bộ là một cách tuyệt vời để cải thiện sức khỏe tim mạch. Hôm nay bạn muốn chạy nhẹ nhàng (Zone 2) hay tập các bài interval cường độ cao? Nhớ khởi động kỹ trước khi bắt đầu nhé!",
  },
  {
    keywords: ["bơi", "swim", "swimming"],
    response: "Đối với môn bơi, kỹ thuật thở và lướt nước rất quan trọng. Nếu bạn mới tập, hãy bắt đầu với các cự ly ngắn 25m hoặc 50m và nghỉ ngơi đầy đủ giữa các hiệp.",
  },
  {
    keywords: ["đạp xe", "đạp", "bike", "cycling"],
    response: "Đạp xe giúp phát triển sức bền rất tốt. Bạn dự định đạp trên đường bằng hay tập leo dốc hôm nay? Đừng quên kiểm tra áp suất lốp trước khi xuất phát.",
  },
  {
    keywords: ["nhịp tim", "heart rate", "hr", "zone"],
    response: "Tập luyện theo vùng nhịp tim (Heart Rate Zones) giúp tối ưu hóa hiệu quả. Zone 2 (khoảng 60-70% nhịp tim tối đa) là vùng tốt nhất để xây dựng nền tảng sức bền.",
  },
  {
    keywords: ["đau", "chấn thương", "pain", "injury", "mỏi"],
    response: "AI Coach không thay thế tư vấn y tế. Bạn nên dừng tập và tham khảo chuyên gia y tế nếu có đau kéo dài hoặc dấu hiệu bất thường.",
  },
  {
    keywords: ["lịch", "kế hoạch", "giáo án", "plan", "schedule"],
    response: "Dựa vào giáo án của bạn, tuần này chúng ta tập trung vào việc duy trì khối lượng luyện tập (volume). Hãy chắc chắn bạn có ít nhất một ngày nghỉ ngơi hoàn toàn.",
  },
  {
    keywords: ["phục hồi", "nghỉ ngơi", "recovery", "rest"],
    response: "Phục hồi quan trọng không kém việc tập luyện. Hãy chú ý đến giấc ngủ, dinh dưỡng và uống đủ nước. Bạn có thể kết hợp các bài tập giãn cơ nhẹ nhàng.",
  },
  {
    keywords: ["quá sức", "mệt", "overtraining", "tired"],
    response: "Cảm giác mệt mỏi kéo dài có thể là dấu hiệu của overtraining. Bạn nên lắng nghe cơ thể, giảm cường độ bài tập tiếp theo hoặc nghỉ ngơi thêm 1-2 ngày.",
  }
];

export const defaultResponse = "Tôi là SLABAI Running AI Coach. Tôi có thể giúp bạn phân tích buổi chạy, khối lượng tập, pace, nhịp tim và hồi phục. Bạn muốn mình hỗ trợ gì hôm nay?";
