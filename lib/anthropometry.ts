/**
 * Standar Antropometri Anak 0-60 Bulan
 * Berdasarkan WHO Child Growth Standards (2006) & PMK Kemenkes RI No. 2 Tahun 2020
 */

export interface AnthropometryEvaluation {
  ageMonths: number;
  ageFormatted: string;
  weightCategory: 'Gizi Buruk (< -3 SD)' | 'Gizi Kurang (< -2 SD)' | 'Gizi Baik / Normal (-2 s/d +1 SD)' | 'Risiko Berat Lebih / Gizi Lebih (> +1 SD)';
  heightCategory: 'Sangat Pendek / Severely Stunted (< -3 SD)' | 'Pendek / Stunted (< -2 SD)' | 'Normal (-2 s/d +3 SD)' | 'Tinggi (> +3 SD)';
  bmiOrStatureNotes: string[];
  measurementRecencyNote: string;
  whoReference: string;
}

// Data acuan WHO (Usia dalam bulan: Median, -2SD, +2SD, -3SD)
// Format: [ageMonth, -3SD, -2SD, Median, +2SD]
const WHO_BOYS_WEIGHT: Record<number, { min3: number; min2: number; median: number; plus2: number }> = {
  0: { min3: 2.1, min2: 2.5, median: 3.3, plus2: 4.4 },
  1: { min3: 2.9, min2: 3.4, median: 4.5, plus2: 5.8 },
  2: { min3: 3.8, min2: 4.3, median: 5.6, plus2: 7.1 },
  3: { min3: 4.4, min2: 5.0, median: 6.4, plus2: 8.0 },
  4: { min3: 4.9, min2: 5.6, median: 7.0, plus2: 8.7 },
  5: { min3: 5.3, min2: 6.0, median: 7.5, plus2: 9.3 },
  6: { min3: 5.7, min2: 6.4, median: 7.9, plus2: 9.8 },
  7: { min3: 5.9, min2: 6.7, median: 8.3, plus2: 10.3 },
  8: { min3: 6.2, min2: 6.9, median: 8.6, plus2: 10.7 },
  9: { min3: 6.4, min2: 7.1, median: 8.9, plus2: 11.0 },
  10: { min3: 6.6, min2: 7.4, median: 9.2, plus2: 11.4 },
  11: { min3: 6.8, min2: 7.6, median: 9.4, plus2: 11.7 },
  12: { min3: 6.9, min2: 7.7, median: 9.6, plus2: 12.0 },
  15: { min3: 7.4, min2: 8.3, median: 10.3, plus2: 12.8 },
  18: { min3: 7.9, min2: 8.8, median: 10.9, plus2: 13.7 },
  21: { min3: 8.3, min2: 9.2, median: 11.5, plus2: 14.5 },
  24: { min3: 8.6, min2: 9.7, median: 12.2, plus2: 15.3 },
  30: { min3: 9.4, min2: 10.5, median: 13.3, plus2: 16.9 },
  36: { min3: 10.0, min2: 11.3, median: 14.3, plus2: 18.3 },
  42: { min3: 10.7, min2: 12.0, median: 15.3, plus2: 19.7 },
  48: { min3: 11.3, min2: 12.7, median: 16.3, plus2: 21.2 },
  54: { min3: 11.9, min2: 13.4, median: 17.3, plus2: 22.7 },
  60: { min3: 12.4, min2: 14.1, median: 18.3, plus2: 24.2 },
};

const WHO_GIRLS_WEIGHT: Record<number, { min3: number; min2: number; median: number; plus2: number }> = {
  0: { min3: 2.0, min2: 2.4, median: 3.2, plus2: 4.2 },
  1: { min3: 2.7, min2: 3.2, median: 4.2, plus2: 5.5 },
  2: { min3: 3.4, min2: 3.9, median: 5.1, plus2: 6.6 },
  3: { min3: 4.0, min2: 4.5, median: 5.8, plus2: 7.5 },
  4: { min3: 4.4, min2: 5.0, median: 6.4, plus2: 8.2 },
  5: { min3: 4.8, min2: 5.4, median: 6.9, plus2: 8.8 },
  6: { min3: 5.1, min2: 5.7, median: 7.3, plus2: 9.3 },
  7: { min3: 5.3, min2: 6.0, median: 7.6, plus2: 9.8 },
  8: { min3: 5.6, min2: 6.3, median: 7.9, plus2: 10.2 },
  9: { min3: 5.8, min2: 6.5, median: 8.2, plus2: 10.5 },
  10: { min3: 5.9, min2: 6.7, median: 8.5, plus2: 10.9 },
  11: { min3: 6.1, min2: 6.9, median: 8.7, plus2: 11.2 },
  12: { min3: 6.3, min2: 7.0, median: 8.9, plus2: 11.5 },
  15: { min3: 6.7, min2: 7.6, median: 9.6, plus2: 12.4 },
  18: { min3: 7.2, min2: 8.1, median: 10.2, plus2: 13.2 },
  21: { min3: 7.6, min2: 8.6, median: 10.9, plus2: 14.0 },
  24: { min3: 8.1, min2: 9.0, median: 11.5, plus2: 14.8 },
  30: { min3: 8.9, min2: 10.0, median: 12.7, plus2: 16.5 },
  36: { min3: 9.6, min2: 10.8, median: 13.9, plus2: 18.1 },
  42: { min3: 10.2, min2: 11.6, median: 15.0, plus2: 19.6 },
  48: { min3: 10.8, min2: 12.3, median: 16.1, plus2: 21.2 },
  54: { min3: 11.4, min2: 13.0, median: 17.2, plus2: 22.8 },
  60: { min3: 12.1, min2: 13.7, median: 18.2, plus2: 24.4 },
};

// WHO Height (TB/PB) in cm
const WHO_BOYS_HEIGHT: Record<number, { min3: number; min2: number; median: number }> = {
  0: { min3: 44.2, min2: 46.1, median: 49.9 },
  6: { min3: 63.3, min2: 65.5, median: 67.6 },
  12: { min3: 71.0, min2: 73.4, median: 75.7 },
  18: { min3: 76.9, min2: 79.6, median: 82.3 },
  24: { min3: 81.7, min2: 84.8, median: 87.8 },
  36: { min3: 88.7, min2: 92.4, median: 96.1 },
  48: { min3: 94.9, min2: 99.1, median: 103.3 },
  60: { min3: 100.7, min2: 105.3, median: 110.0 },
};

const WHO_GIRLS_HEIGHT: Record<number, { min3: number; min2: number; median: number }> = {
  0: { min3: 43.6, min2: 45.4, median: 49.1 },
  6: { min3: 61.2, min2: 63.5, median: 65.7 },
  12: { min3: 68.9, min2: 71.4, median: 74.0 },
  18: { min3: 74.9, min2: 77.9, median: 80.7 },
  24: { min3: 80.0, min2: 83.2, median: 86.4 },
  36: { min3: 87.4, min2: 91.2, median: 95.1 },
  48: { min3: 94.1, min2: 98.4, median: 102.7 },
  60: { min3: 99.9, min2: 104.7, median: 109.4 },
};

// Interpolasi data WHO terdekat berdasarkan usia bulan
function getClosestNorm(
  dict: Record<number, any>,
  months: number
): any {
  const keys = Object.keys(dict).map(Number).sort((a, b) => a - b);
  let closest = keys[0];
  let minDiff = Math.abs(months - closest);
  for (const k of keys) {
    const diff = Math.abs(months - k);
    if (diff < minDiff) {
      minDiff = diff;
      closest = k;
    }
  }
  return dict[closest];
}

// Hitung usia dalam bulan dan format string dari Tanggal Lahir (DOB)
export function calculateAgeFromDob(dobString: string): {
  totalMonths: number;
  years: number;
  months: number;
  formatted: string;
} {
  if (!dobString) {
    return { totalMonths: 0, years: 0, months: 0, formatted: '-' };
  }

  const birth = new Date(dobString);
  const now = new Date();
  if (isNaN(birth.getTime())) {
    return { totalMonths: 0, years: 0, months: 0, formatted: '-' };
  }

  let years = now.getFullYear() - birth.getFullYear();
  let months = now.getMonth() - birth.getMonth();
  if (now.getDate() < birth.getDate()) {
    months--;
  }
  if (months < 0) {
    years--;
    months += 12;
  }

  const totalMonths = Math.max(0, years * 12 + months);
  let formatted = '';
  if (years === 0) {
    formatted = `${totalMonths} Bulan`;
  } else if (months === 0) {
    formatted = `${years} Tahun (${totalMonths} Bulan)`;
  } else {
    formatted = `${years} Tahun ${months} Bulan (${totalMonths} Bulan)`;
  }

  return { totalMonths, years, months, formatted };
}

// Evaluasi Antropometri Sesuai Kemenkes RI & WHO
export function evaluateAnthropometry(
  dobString: string,
  gender: 'Laki-laki' | 'Perempuan',
  weightRaw: string,
  heightRaw: string,
  measurementDateRaw?: string
): AnthropometryEvaluation | null {
  const age = calculateAgeFromDob(dobString);
  if (age.totalMonths === 0 && !dobString) return null;

  // Parsing angka BB dan TB
  const weightNum = parseFloat(weightRaw.replace(/[^0-9.]/g, ''));
  const heightNum = parseFloat(heightRaw.replace(/[^0-9.]/g, ''));

  const weightNorm =
    gender === 'Laki-laki'
      ? getClosestNorm(WHO_BOYS_WEIGHT, age.totalMonths)
      : getClosestNorm(WHO_GIRLS_WEIGHT, age.totalMonths);

  const heightNorm =
    gender === 'Laki-laki'
      ? getClosestNorm(WHO_BOYS_HEIGHT, age.totalMonths)
      : getClosestNorm(WHO_GIRLS_HEIGHT, age.totalMonths);

  let weightCategory: AnthropometryEvaluation['weightCategory'] = 'Gizi Baik / Normal (-2 s/d +1 SD)';
  let heightCategory: AnthropometryEvaluation['heightCategory'] = 'Normal (-2 s/d +3 SD)';
  const notes: string[] = [];

  // Evaluasi BB/U
  if (!isNaN(weightNum) && weightNorm) {
    if (weightNum < weightNorm.min3) {
      weightCategory = 'Gizi Buruk (< -3 SD)';
      notes.push(`BB ananda (${weightNum} kg) berada di bawah -3 SD (standar median usia ${age.totalMonths} bln: ~${weightNorm.median} kg).`);
    } else if (weightNum < weightNorm.min2) {
      weightCategory = 'Gizi Kurang (< -2 SD)';
      notes.push(`BB ananda (${weightNum} kg) berada di bawah garis -2 SD kurva WHO (Gizi Kurang / Underweight).`);
    } else if (weightNum > weightNorm.plus2) {
      weightCategory = 'Risiko Berat Lebih / Gizi Lebih (> +1 SD)';
      notes.push(`BB ananda (${weightNum} kg) berada di atas +2 SD kurva WHO (Risiko Overweight).`);
    } else {
      weightCategory = 'Gizi Baik / Normal (-2 s/d +1 SD)';
    }
  }

  // Evaluasi TB/U (Stunting check)
  if (!isNaN(heightNum) && heightNorm) {
    if (heightNum < heightNorm.min3) {
      heightCategory = 'Sangat Pendek / Severely Stunted (< -3 SD)';
      notes.push(`Tinggi/Panjang badan (${heightNum} cm) di bawah -3 SD (indikasi risiko stunting berat).`);
    } else if (heightNum < heightNorm.min2) {
      heightCategory = 'Pendek / Stunted (< -2 SD)';
      notes.push(`Tinggi/Panjang badan (${heightNum} cm) di bawah -2 SD (indikasi perawakan pendek / stunting).`);
    } else {
      heightCategory = 'Normal (-2 s/d +3 SD)';
    }
  }

  // Evaluasi Usia saat Pengukuran
  let recencyNote = 'Pengukuran tercatat terkini.';
  if (measurementDateRaw) {
    const measDate = new Date(measurementDateRaw);
    if (!isNaN(measDate.getTime())) {
      const diffDays = Math.round((new Date().getTime() - measDate.getTime()) / (1000 * 3600 * 24));
      if (diffDays > 45) {
        recencyNote = `⚠️ Data pengukuran diambil ${Math.round(diffDays / 30)} bulan yang lalu. Direkomendasikan melakukan penimbangan BB & pengukuran TB/PB ulang di Posyandu/Klinik untuk akurasi terkini.`;
      }
    } else if (
      measurementDateRaw.toLowerCase().includes('lalu') ||
      measurementDateRaw.toLowerCase().includes('bulan lalu') ||
      measurementDateRaw.toLowerCase().includes('dulu')
    ) {
      recencyNote = '⚠️ Data BB/TB adalah pengukuran lampau. Sangat disarankan menimbang ulang BB dan TB anak saat ini.';
    }
  }

  return {
    ageMonths: age.totalMonths,
    ageFormatted: age.formatted,
    weightCategory,
    heightCategory,
    bmiOrStatureNotes: notes,
    measurementRecencyNote: recencyNote,
    whoReference: 'Standar Antropometri WHO 2006 & Permenkes RI No. 2 Tahun 2020',
  };
}
