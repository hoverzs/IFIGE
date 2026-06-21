/** Heti publikálási logika — Europe/Bucharest, hétfő–vasárnap */

export const TIMEZONE = 'Europe/Bucharest';

export const WEEKDAY_LABELS = [
  'Hétfő',
  'Kedd',
  'Szerda',
  'Csütörtök',
  'Péntek',
  'Szombat',
  'Vasárnap',
];

const CORE_EPISODE_FIELDS = ['title', 'scripture', 'thought', 'question', 'prayer'];

export function calendarDateInTz(date = new Date(), tz = TIMEZONE) {
  return new Intl.DateTimeFormat('en-CA', { timeZone: tz }).format(date);
}

export function addDaysToDateStr(dateStr, days) {
  const [y, m, d] = dateStr.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d + days, 12, 0, 0));
  return dt.toISOString().slice(0, 10);
}

/** 1 = startDate (hétfő), 0 = vasárnap előtti nap, <0 = hét előtt */
export function getDayIndex(startDate, now = new Date()) {
  const today = calendarDateInTz(now);
  const [sy, sm, sd] = startDate.split('-').map(Number);
  const [ty, tm, td] = today.split('-').map(Number);
  const diff = Math.floor((Date.UTC(ty, tm - 1, td) - Date.UTC(sy, sm - 1, sd)) / 86400000);
  return diff + 1;
}

export function getEpisodePublishDate(startDate, day) {
  return addDaysToDateStr(startDate, day - 1);
}

function getZonedParts(date, tz = TIMEZONE) {
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: tz,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
  const parts = {};
  for (const p of formatter.formatToParts(date)) {
    if (p.type !== 'literal') parts[p.type] = p.value;
  }
  return parts;
}

/** Vasárnap (startDate + 6 nap) 16:00 után */
export function isRecapAvailable(startDate, now = new Date()) {
  const sundayStr = addDaysToDateStr(startDate, 6);
  const today = calendarDateInTz(now);
  if (today < sundayStr) return false;
  if (today > sundayStr) return true;
  return parseInt(getZonedParts(now).hour, 10) >= 16;
}

export function getRecapPublishInfo(startDate) {
  return {
    publishDate: addDaysToDateStr(startDate, 6),
    publishTime: '16:00',
    timezone: TIMEZONE,
  };
}

/** 0 = vasárnap, 1 = hétfő, … 6 = szombat (naptár nap, UTC-dátum alapján) */
export function getWeekdayIndex(dateStr) {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d, 12, 0, 0)).getUTCDay();
}

export function isMondayStartDate(dateStr) {
  return getWeekdayIndex(dateStr) === 1;
}

export function getWeekdayNameForDate(dateStr) {
  const names = ['Vasárnap', 'Hétfő', 'Kedd', 'Szerda', 'Csütörtök', 'Péntek', 'Szombat'];
  return names[getWeekdayIndex(dateStr)] || '';
}

export function validateStartDate(dateStr) {
  if (!dateStr || !/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    return { ok: false, isMonday: false, weekday: '', message: 'Érvénytelen dátumformátum (YYYY-MM-DD).' };
  }
  const weekday = getWeekdayNameForDate(dateStr);
  const isMonday = isMondayStartDate(dateStr);
  if (!isMonday) {
    return {
      ok: false,
      isMonday: false,
      weekday,
      message: `A startDate hétfői dátum legyen (${dateStr} = ${weekday}).`,
    };
  }
  return { ok: true, isMonday: true, weekday, message: '' };
}

export function getEpisodeContentStatus(ep) {
  const hasAny =
    CORE_EPISODE_FIELDS.some((f) => ep[f]?.trim()) || !!ep.image;
  if (!hasAny) return 'missing';
  const complete =
    CORE_EPISODE_FIELDS.every((f) => ep[f]?.trim()) && !!ep.image;
  return complete ? 'complete' : 'incomplete';
}

export function getRecapContentStatus(recap) {
  if (!recap?.text?.trim() && !recap?.video) return 'missing';
  if (recap?.text?.trim() && recap?.title?.trim() && recap?.video) return 'complete';
  if (recap?.text?.trim() || recap?.video) return 'incomplete';
  return 'missing';
}

function computeEpisodeStatus(epDay, dayIndex) {
  if (dayIndex < 1) return 'locked';
  if (dayIndex > 7) return 'available';
  if (epDay < dayIndex) return 'available';
  if (epDay === dayIndex) return 'current';
  return 'locked';
}

function unlockAllForTest(s, resolveHeroImage) {
  return {
    ...s,
    heroImage: resolveHeroImage(s, 1),
    currentDay: 7,
    totalDays: 7,
    episodes: s.episodes.map((ep) => ({
      ...ep,
      status: 'available',
      publishDate: getEpisodePublishDate(s.startDate, ep.day),
      contentStatus: getEpisodeContentStatus(ep),
    })),
    recapStatus: 'available',
    isComplete: true,
    showAllEpisodes: true,
  };
}

/**
 * @param {object} series — migrateSeries után
 * @param {{ showAllEpisodes?: boolean, now?: Date, resolveHeroImage?: Function }} opts
 */
export function enrichSeries(series, opts = {}) {
  const { showAllEpisodes = false, now = new Date(), resolveHeroImage = () => '' } = opts;
  const s = { ...series };
  const dayIndex = getDayIndex(s.startDate, now);

  if (s.status === 'draft') {
    return {
      ...s,
      heroImage: resolveHeroImage(s, 1),
      currentDay: 0,
      totalDays: 7,
      dayIndex,
      episodes: s.episodes.map((ep) => ({
        ...ep,
        status: 'locked',
        publishDate: getEpisodePublishDate(s.startDate, ep.day),
        weekdayLabel: WEEKDAY_LABELS[ep.day - 1],
        contentStatus: getEpisodeContentStatus(ep),
      })),
      recapStatus: 'locked',
      recapPublishDate: getRecapPublishInfo(s.startDate).publishDate,
      isComplete: false,
      showAllEpisodes: false,
    };
  }

  if (showAllEpisodes) {
    return unlockAllForTest(s, resolveHeroImage);
  }

  if (s.releaseMode === 'all') {
    return {
      ...s,
      heroImage: resolveHeroImage(s, 1),
      currentDay: 7,
      totalDays: 7,
      dayIndex,
      episodes: s.episodes.map((ep) => ({
        ...ep,
        status: 'available',
        publishDate: getEpisodePublishDate(s.startDate, ep.day),
        weekdayLabel: WEEKDAY_LABELS[ep.day - 1],
        contentStatus: getEpisodeContentStatus(ep),
      })),
      recapStatus: 'available',
      recapPublishDate: getRecapPublishInfo(s.startDate).publishDate,
      isComplete: true,
      showAllEpisodes: false,
    };
  }

  // daily — hétfőtől vasárnapig
  const currentDay = dayIndex < 1 ? 0 : Math.min(dayIndex, 7);

  return {
    ...s,
    heroImage: resolveHeroImage(s, currentDay > 0 ? currentDay : 1),
    currentDay,
    totalDays: 7,
    dayIndex,
    episodes: s.episodes.map((ep) => ({
      ...ep,
      status: computeEpisodeStatus(ep.day, dayIndex),
      publishDate: getEpisodePublishDate(s.startDate, ep.day),
      weekdayLabel: WEEKDAY_LABELS[ep.day - 1],
      contentStatus: getEpisodeContentStatus(ep),
    })),
    recapStatus: isRecapAvailable(s.startDate, now) ? 'available' : 'locked',
    recapPublishDate: getRecapPublishInfo(s.startDate).publishDate,
    recapPublishTime: '16:00',
    isComplete: dayIndex > 7,
    showAllEpisodes: false,
  };
}

/** Publikus API — locked tartalom kiszűrése */
export function sanitizeForPublic(enriched) {
  return {
    ...enriched,
    episodes: enriched.episodes.map((ep) => sanitizeEpisodeForPublic(ep, enriched.startDate)),
    weeklyRecap: sanitizeRecapForPublic(enriched),
  };
}

function sanitizeEpisodeForPublic(ep, startDate) {
  const publishDate = ep.publishDate || getEpisodePublishDate(startDate, ep.day);
  const title = ep.title?.trim() || `${ep.day}. rész`;

  if (ep.status === 'locked') {
    return { day: ep.day, title, status: 'locked', publishDate };
  }

  const contentStatus = ep.contentStatus || getEpisodeContentStatus(ep);

  if (contentStatus !== 'complete') {
    return {
      day: ep.day,
      title,
      status: ep.status,
      publishDate,
      contentStatus,
      image: ep.image || '',
      scripture: '',
      thought: '',
      question: '',
      prayer: '',
      teaser: '',
    };
  }

  return {
    day: ep.day,
    title: ep.title,
    scripture: ep.scripture,
    thought: ep.thought,
    question: ep.question,
    prayer: ep.prayer,
    teaser: ep.teaser,
    image: ep.image,
    status: ep.status,
    publishDate,
    contentStatus: 'complete',
  };
}

function sanitizeRecapForPublic(enriched) {
  const recap = enriched.weeklyRecap || { title: '', text: '', video: '' };
  const recapInfo = getRecapPublishInfo(enriched.startDate);
  if (enriched.recapStatus === 'locked') {
    return {
      title: recap.title || enriched.title,
      text: '',
      video: '',
      status: 'locked',
      publishDate: recapInfo.publishDate,
      publishTime: recapInfo.publishTime,
      timezone: recapInfo.timezone,
    };
  }
  const contentStatus = getRecapContentStatus(recap);
  if (contentStatus !== 'complete') {
    return {
      title: recap.title || enriched.title,
      text: '',
      video: '',
      contentStatus,
      status: 'available',
      publishDate: recapInfo.publishDate,
      publishTime: recapInfo.publishTime,
      timezone: recapInfo.timezone,
    };
  }
  return {
    ...recap,
    contentStatus: 'complete',
    status: 'available',
    publishDate: recapInfo.publishDate,
    publishTime: recapInfo.publishTime,
    timezone: recapInfo.timezone,
  };
}

/** Admin — teljes tartalom + publikálási meta */
export function enrichForAdmin(series, opts = {}) {
  const enriched = enrichSeries(series, opts);
  const recapInfo = getRecapPublishInfo(enriched.startDate);
  const startDateValidation = validateStartDate(enriched.startDate);
  return {
    ...enriched,
    startDateIsMonday: startDateValidation.isMonday,
    startDateWeekday: startDateValidation.weekday,
    startDateWarning: startDateValidation.ok ? '' : startDateValidation.message,
    recapContentStatus: getRecapContentStatus(enriched.weeklyRecap),
    recapAdminStatus: getAdminRecapStatus(
      enriched.status,
      enriched.recapStatus,
      enriched.weeklyRecap
    ),
    recapPublishDate: recapInfo.publishDate,
    recapPublishTime: recapInfo.publishTime,
    recapPublishTimezone: recapInfo.timezone,
    episodes: enriched.episodes.map((ep) => ({
      ...ep,
      publishStatus: ep.status,
      adminStatus: getAdminEpisodeStatus(enriched.status, ep),
      missingFields: getMissingEpisodeFields(ep),
    })),
  };
}

export function getNextMonday(from = new Date()) {
  const today = calendarDateInTz(from);
  const [y, m, d] = today.split('-').map(Number);
  const date = new Date(Date.UTC(y, m - 1, d, 12, 0, 0));
  const dow = date.getUTCDay();
  if (dow === 1) return today;
  const daysUntil = dow === 0 ? 1 : 8 - dow;
  return addDaysToDateStr(today, daysUntil);
}

function getMissingEpisodeFields(ep) {
  const missing = [];
  for (const field of CORE_EPISODE_FIELDS) {
    if (!ep[field]?.trim()) missing.push(field);
  }
  if (!ep.image) missing.push('image');
  return missing;
}

function getAdminEpisodeStatus(seriesStatus, ep) {
  if (seriesStatus === 'draft') return 'draft';
  const contentStatus = getEpisodeContentStatus(ep);
  if (contentStatus === 'missing') return 'missing';
  if (contentStatus === 'incomplete') return 'incomplete';
  return ep.status;
}

function getAdminRecapStatus(seriesStatus, recapStatus, recap) {
  if (seriesStatus === 'draft') return 'draft';
  const contentStatus = getRecapContentStatus(recap);
  if (recapStatus === 'locked') return 'locked';
  if (contentStatus === 'missing') return 'missing';
  if (contentStatus === 'incomplete') return 'incomplete';
  return 'available';
}
