import { z } from "zod";

export const emailSchema = z.object({
  email: z.string().email("Email không hợp lệ.")
});

export const otpSchema = z.object({
  code: z.string().regex(/^\d{6}$/, "Mã xác thực gồm 6 chữ số.")
});

export const raceSchema = z.object({
  eventType: z.string().min(1, "Chọn loại sự kiện."),
  raceName: z.string().min(2, "Nhập tên mục tiêu."),
  date: z.string().min(1, "Chọn ngày."),
  priority: z.enum(["A", "B", "C"])
});

export const fitnessSchema = z.object({
  focus: z.enum(["5k", "10k", "half-marathon", "general-fitness", "endurance"]),
  durationWeeks: z.coerce.number().min(4, "Tối thiểu 4 tuần.").max(24, "Tối đa 24 tuần.")
});

export const thresholdSchema = z.object({
  heartRateBpm: z.coerce.number().min(80).max(220),
  paceSecondsPerKm: z.coerce.number().min(150).max(900),
  powerWatts: z.coerce.number().min(50).max(600)
});
