import { expect, test, describe } from "bun:test";
import { formatSchedule } from "./format";
import { Alarm } from "../types";

describe("formatSchedule", () => {
  test("returns '일정 없음' when triggers are missing or empty", () => {
    const alarmWithNoTriggers: Alarm = {
      id: "1",
      title: "Test",
      repeat_type: "None",
      triggers: [],
      enabled: true,
      order: 0,
    };
    expect(formatSchedule(alarmWithNoTriggers)).toBe("일정 없음");

    const alarmWithUndefinedTriggers: Alarm = {
      id: "1",
      title: "Test",
      repeat_type: "None",
      triggers: undefined as any,
      enabled: true,
      order: 0,
    };
    expect(formatSchedule(alarmWithUndefinedTriggers)).toBe("일정 없음");
  });

  describe("RepeatType: None", () => {
    test("returns formatted date and time for a single trigger", () => {
      const alarm: Alarm = {
        id: "1",
        title: "Test",
        repeat_type: "None",
        triggers: [{ date: "2023-10-27", time: "08:00" }],
        enabled: true,
        order: 0,
      };
      expect(formatSchedule(alarm)).toBe("2023-10-27 08:00");
    });

    test("returns 'X개의 날짜' for multiple triggers", () => {
      const alarm: Alarm = {
        id: "1",
        title: "Test",
        repeat_type: "None",
        triggers: [
          { date: "2023-10-27", time: "08:00" },
          { date: "2023-10-28", time: "09:00" },
        ],
        enabled: true,
        order: 0,
      };
      expect(formatSchedule(alarm)).toBe("2개의 날짜");
    });
  });

  test("RepeatType: Daily", () => {
    const alarm: Alarm = {
      id: "1",
      title: "Test",
      repeat_type: "Daily",
      triggers: [{ time: "07:30" }],
      enabled: true,
      order: 0,
    };
    expect(formatSchedule(alarm)).toBe("매일 07:30");
  });

  test("RepeatType: Weekly", () => {
    const alarm: Alarm = {
      id: "1",
      title: "Test",
      repeat_type: "Weekly",
      triggers: [{ days_of_week: ["Monday", "Wednesday"], time: "10:00" }],
      enabled: true,
      order: 0,
    };
    expect(formatSchedule(alarm)).toBe("매주 월요일, 수요일 10:00");
  });

  test("RepeatType: Monthly", () => {
    const alarm: Alarm = {
      id: "1",
      title: "Test",
      repeat_type: "Monthly",
      triggers: [
        {
          weeks_of_month: "First",
          days_of_week: ["Friday"],
          time: "18:00",
        },
      ],
      enabled: true,
      order: 0,
    };
    expect(formatSchedule(alarm)).toBe("매월 첫째 주 금요일 18:00");
  });

  test("returns '알 수 없는 일정' for unhandled repeat type", () => {
    const alarm: Alarm = {
      id: "1",
      title: "Test",
      repeat_type: "Unknown" as any,
      triggers: [{ time: "00:00" }],
      enabled: true,
      order: 0,
    };
    expect(formatSchedule(alarm)).toBe("알 수 없는 일정");
  });
});
