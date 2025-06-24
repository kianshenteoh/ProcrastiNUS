export const academicYears = {
  "AY2024/2025": {
    sem1: {
      start: new Date(2024, 7, 12),
      end: new Date(2024, 10, 15),
      orientation: new Date(2024, 7, 5),
      recessStart: new Date(2024, 8, 21),
      recessEnd: new Date(2024, 8, 29),
      readingStart: new Date(2024, 10, 16),
      readingEnd: new Date(2024, 10, 22),
    },
    sem2: {
      start: new Date(2025, 0, 13),
      end: new Date(2025, 3, 18),
      orientation: new Date(2025, 0, 6),
      recessStart: new Date(2025, 1, 22),
      recessEnd: new Date(2025, 2, 2),
      readingStart: new Date(2025, 3, 19),
      readingEnd: new Date(2025, 3, 25),
    }
  },
  "AY2025/2026": {
    sem1: {
      start: new Date(2025, 7, 11),
      end: new Date(2025, 10, 14),
      orientation: new Date(2025, 7, 4),
      recessStart: new Date(2025, 8, 20),
      recessEnd: new Date(2025, 8, 28),
      readingStart: new Date(2025, 10, 15),
      readingEnd: new Date(2025, 10, 21),
    },
    sem2: {
      start: new Date(2026, 0, 12),
      end: new Date(2026, 3, 17),
      orientation: new Date(2026, 0, 5),
      recessStart: new Date(2026, 1, 21),
      recessEnd: new Date(2026, 2, 1),
      readingStart: new Date(2026, 3, 18),
      readingEnd: new Date(2026, 3, 24),
    }
  },
  "AY2026/2027": {
    sem1: {
      start: new Date(2026, 7, 10),
      end: new Date(2026, 10, 13),
      orientation: new Date(2026, 7, 3),
      recessStart: new Date(2026, 8, 19),
      recessEnd: new Date(2026, 8, 27),
      readingStart: new Date(2026, 10, 14),
      readingEnd: new Date(2026, 10, 20),
    },
    sem2: {
      start: new Date(2027, 0, 11),
      end: new Date(2027, 3, 17),
      orientation: new Date(2027, 0, 4),
      recessStart: new Date(2027, 1, 20),
      recessEnd: new Date(2027, 1, 28),
      readingStart: new Date(2027, 3, 17),
      readingEnd: new Date(2027, 3, 23),
    }
  },
  "AY2027/2028": {
    sem1: {
      start: new Date(2027, 7, 9),
      end: new Date(2027, 10, 12),
      orientation: new Date(2027, 7, 2),
      recessStart: new Date(2027, 8, 18),
      recessEnd: new Date(2027, 8, 26),
      readingStart: new Date(2027, 10, 13),
      readingEnd: new Date(2027, 10, 19),
    },
    sem2: {
      start: new Date(2028, 0, 10),
      end: new Date(2028, 3, 14),
      orientation: new Date(2028, 0, 3),
      recessStart: new Date(2028, 1, 19),
      recessEnd: new Date(2028, 1, 27),
      readingStart: new Date(2028, 3, 15),
      readingEnd: new Date(2028, 3, 21),
    }
  }
};

export const getAcademicYear = (date) => {
  const year = date.getFullYear();
  const month = date.getMonth();
  const key = month >= 7
    ? `AY${year}/${year + 1}`
    : `AY${year - 1}/${year}`;

  return academicYears[key] ? key : Object.keys(academicYears).sort().pop();
};
