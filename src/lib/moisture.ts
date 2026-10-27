export interface MoistureClassification {
  labelEn: string;
  labelTl: string;
  badgeClass: string;
  category: 'high' | 'suitable' | 'needs-drying' | 'ready' | 'overdry';
}

export function getMoistureClassification(moistureStr?: string): MoistureClassification {
  if (!moistureStr) {
    return {
      labelEn: 'Unassessed Moisture',
      labelTl: 'Hindi Na-assess na Moisture',
      badgeClass: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700',
      category: 'suitable',
    };
  }

  const numericVal = parseFloat(moistureStr.replace(/[^0-9.]/g, ''));
  if (isNaN(numericVal)) {
    return {
      labelEn: moistureStr,
      labelTl: moistureStr,
      badgeClass: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700',
      category: 'suitable',
    };
  }

  if (numericVal >= 17) {
    return {
      labelEn: 'Wet (17% MC and above)',
      labelTl: 'Basa (17% MC pataas)',
      badgeClass: 'bg-red-100 text-red-800 border-red-300 dark:bg-red-950/50 dark:text-red-300 dark:border-red-800',
      category: 'high',
    };
  }
  if (numericVal >= 15) {
    return {
      labelEn: 'Moderate (15-16.9% MC)',
      labelTl: 'Katamtaman (15-16.9% MC)',
      badgeClass: 'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-800',
      category: 'needs-drying',
    };
  }
  if (numericVal >= 12) {
    return {
      labelEn: 'Dry (12-14.9% MC)',
      labelTl: 'Tuyo (12-14.9% MC)',
      badgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800',
      category: 'ready',
    };
  }
  return {
    labelEn: 'Risk of Grain Breakage (Below 12% MC)',
    labelTl: 'Panganib ng Pagkabiyak ng Butil (Mababa sa 12% MC)',
    badgeClass: 'bg-purple-100 text-purple-800 border-purple-300 dark:bg-purple-950/50 dark:text-purple-300 dark:border-purple-800',
    category: 'overdry',
  };
}
