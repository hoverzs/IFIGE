/**
 * Heti publikálási dátum tesztek — futtatás: npm run test:publish
 */
import {
  getDayIndex,
  isRecapAvailable,
  enrichSeries,
  getEpisodePublishDate,
  getRecapPublishInfo,
  isMondayStartDate,
  getWeekdayNameForDate,
  validateStartDate,
} from './publish.js';

const START = '2026-06-22';

function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

function mk(dateStr, hour = 12) {
  return new Date(`${dateStr}T${String(hour).padStart(2, '0')}:00:00+03:00`);
}

function statuses(series, now) {
  const e = enrichSeries(series, { now });
  return {
    dayIndex: getDayIndex(START, now),
    episodes: Object.fromEntries(e.episodes.map((ep) => [ep.day, ep.status])),
    recap: e.recapStatus,
  };
}

const baseSeries = {
  startDate: START,
  status: 'active',
  releaseMode: 'daily',
  title: 'Teszt',
  episodes: Array.from({ length: 7 }, (_, i) => ({
    day: i + 1,
    title: 't',
    scripture: 's',
    thought: 'th',
    question: 'q',
    prayer: 'p',
    teaser: '',
    image: '/x.jpg',
  })),
  weeklyRecap: { title: 'R', text: 'x', video: '/v.mp4' },
};

// --- Naptár ellenőrzés ---
assert(isMondayStartDate('2026-06-22'), '2026-06-22 legyen hétfő');
assert(!isMondayStartDate('2026-06-16'), '2026-06-16 NEM hétfő');
assert(getWeekdayNameForDate('2026-06-16') === 'Kedd', '2026-06-16 = Kedd');
assert(getWeekdayNameForDate('2026-06-22') === 'Hétfő', '2026-06-22 = Hétfő');
assert(getWeekdayNameForDate('2026-06-28') === 'Vasárnap', '2026-06-28 = Vasárnap');

const bad = validateStartDate('2026-06-16');
assert(!bad.ok && bad.weekday === 'Kedd', '2026-06-16 validáció hibát jelez');

// --- Publikálási dátumok ---
assert(getEpisodePublishDate(START, 1) === '2026-06-22', '1. rész = hétfő');
assert(getEpisodePublishDate(START, 7) === '2026-06-28', '7. rész = vasárnap');
const recap = getRecapPublishInfo(START);
assert(recap.publishDate === '2026-06-28', 'finálé dátuma vasárnap');
assert(recap.publishTime === '16:00', 'finálé időpont 16:00');
assert(recap.timezone === 'Europe/Bucharest', 'időzóna Europe/Bucharest');

// --- Ütemezési forgatókönyvek (startDate: 2026-06-22) ---
const s = (d) => statuses(baseSeries, mk(d));
const sh = (d, h) => statuses(baseSeries, mk(d, h));

let r = s('2026-06-21');
assert(r.dayIndex === 0, 'vasárnap előtt dayIndex=0');
assert(Object.values(r.episodes).every((st) => st === 'locked'), 'vasárnap előtt mind locked');
assert(r.recap === 'locked', 'vasárnap előtt recap locked');

r = s('2026-06-22');
assert(r.episodes[1] === 'current' && r.episodes[2] === 'locked', 'hétfő: 1 current');
assert(r.recap === 'locked', 'hétfő recap locked');

r = s('2026-06-23');
assert(r.episodes[1] === 'available' && r.episodes[2] === 'current', 'kedd');
assert(r.episodes[3] === 'locked', 'kedd: 3–7 locked');

r = s('2026-06-24');
assert(r.episodes[1] === 'available' && r.episodes[2] === 'available' && r.episodes[3] === 'current', 'szerda');
assert(r.episodes[4] === 'locked', 'szerda: 4–7 locked');

r = sh('2026-06-28', 10);
assert(r.episodes[7] === 'current', 'vasárnap délelőtt: 7 current');
assert(r.episodes[6] === 'available', 'vasárnap délelőtt: 6 available');
assert(r.recap === 'locked', 'vasárnap délelőtt recap locked');

assert(!isRecapAvailable(START, mk('2026-06-28', 15)), '15:59 előtt recap locked');
assert(isRecapAvailable(START, mk('2026-06-28', 16)), '16:00 után recap available');

r = sh('2026-06-28', 16);
assert(r.recap === 'available', 'enrichSeries recap 16:00-kor available');

console.log('✓ publish.test.js — minden dátumteszt sikeres');
console.log(`  startDate ${START} (${getWeekdayNameForDate(START)}) → finálé ${recap.publishDate} 16:00 ${recap.timezone}`);
