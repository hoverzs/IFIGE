export type EpisodePublishStatus = 'available' | 'current' | 'locked';
export type ComputedSeriesStatus = 'upcoming' | 'current' | 'archived' | 'draft';
export type DisplayPhase = 'current' | 'upcoming';
export type SchedulePhase = 'draft' | 'archived' | 'upcoming' | 'current' | 'past' | 'always';
export type CurrentPhase = 'current' | 'upcoming' | 'archived' | 'empty';
export type EpisodeContentStatus = 'missing' | 'incomplete' | 'complete';
export type EpisodeAdminStatus = 'draft' | 'locked' | 'current' | 'available' | 'incomplete' | 'missing';
export type EpisodeEditStatus = 'empty' | 'in_progress' | 'complete';
export type SeriesStatus = 'draft' | 'active' | 'archived';
export type ReleaseMode = 'all' | 'daily';
export type RecapStatus = 'available' | 'locked';

export interface Episode {
  day: number;
  title: string;
  scripture: string;
  thought: string;
  question: string;
  prayer: string;
  teaser: string;
  image: string;
  status?: EpisodePublishStatus;
  publishDate?: string;
  weekdayLabel?: string;
  contentStatus?: EpisodeContentStatus;
  publishStatus?: EpisodePublishStatus;
  adminStatus?: EpisodeAdminStatus;
  missingFields?: string[];
}

export interface WeeklyRecap {
  title: string;
  text: string;
  video?: string;
  contentStatus?: EpisodeContentStatus;
  status?: RecapStatus | 'available';
  publishDate?: string;
  publishTime?: string;
  timezone?: string;
}

export type Recap = WeeklyRecap;

export interface Series {
  id: string;
  slug?: string;
  title: string;
  subtitle: string;
  description: string;
  biblicalBasis: string;
  weeklySentence: string;
  weeklyMessage: string;
  coverImage: string;
  startDate: string;
  releaseMode?: ReleaseMode;
  status: SeriesStatus;
  recap: Recap;
  weeklyRecap: WeeklyRecap;
  episodes: Episode[];
  heroImage?: string;
  currentDay?: number;
  totalDays?: number;
  recapStatus?: RecapStatus;
  recapPublishDate?: string;
  recapPublishTime?: string;
  recapPublishTimezone?: string;
  recapContentStatus?: EpisodeContentStatus;
  recapAdminStatus?: EpisodeAdminStatus | 'available';
  dayIndex?: number;
  startDateIsMonday?: boolean;
  startDateWeekday?: string;
  startDateWarning?: string;
  schedulePhase?: SchedulePhase;
  computedStatus?: ComputedSeriesStatus | null;
  displayPhase?: DisplayPhase;
  recapHasUpload?: boolean;
  isComplete?: boolean;
  showAllEpisodes?: boolean;
}

const CORE_EPISODE_FIELDS = ['title', 'scripture', 'thought', 'question', 'prayer'] as const;

function emptyRecap(title = ''): WeeklyRecap {
  return { title, text: '', video: '' };
}

function emptyEpisode(day: number): Episode {
  return {
    day,
    title: '',
    scripture: '',
    thought: '',
    question: '',
    prayer: '',
    teaser: '',
    image: '',
  };
}

/** Régi API válaszok és hiányos adatok javítása */
export function normalizeSeries(raw: Partial<Series> & { id: string }): Series {
  const episodes = (raw.episodes || []).map((ep, i) => {
    const { animation: _removed, ...rest } = ep as Episode & { animation?: string };
    return {
      ...emptyEpisode(ep.day ?? i + 1),
      ...rest,
      teaser: ep.teaser || '',
    };
  });
  while (episodes.length < 7) {
    episodes.push(emptyEpisode(episodes.length + 1));
  }

  const title = raw.title || '';
  const recapRaw = (raw.recap || raw.weeklyRecap) as Recap | undefined;
  const recap = recapRaw
    ? { ...emptyRecap(title), title: recapRaw.title || title, text: recapRaw.text || '', video: recapRaw.video || '' }
    : emptyRecap(title);

  return {
    id: raw.id,
    slug: raw.slug || '',
    title,
    subtitle: raw.subtitle || raw.biblicalBasis || (raw as { mainScripture?: string }).mainScripture || '',
    description: raw.description || '',
    biblicalBasis: raw.subtitle || raw.biblicalBasis || (raw as { mainScripture?: string }).mainScripture || '',
    weeklySentence: raw.weeklySentence || raw.weeklyMessage || (raw as { weeklyTagline?: string }).weeklyTagline || '',
    weeklyMessage: raw.weeklySentence || raw.weeklyMessage || (raw as { weeklyTagline?: string }).weeklyTagline || '',
    coverImage: raw.coverImage || '',
    startDate: raw.startDate || new Date().toISOString().split('T')[0],
    releaseMode: raw.releaseMode === 'all' ? 'all' : 'daily',
    status: raw.status || 'draft',
    recap,
    weeklyRecap: recap,
    episodes: episodes.slice(0, 7),
    heroImage: raw.heroImage || raw.coverImage || episodes[0]?.image || '',
    currentDay: raw.currentDay,
    totalDays: raw.totalDays ?? 7,
    recapStatus: raw.recapStatus,
    recapPublishDate: raw.recapPublishDate,
    recapPublishTime: raw.recapPublishTime,
    recapPublishTimezone: raw.recapPublishTimezone,
    recapContentStatus: raw.recapContentStatus,
    recapAdminStatus: raw.recapAdminStatus,
    dayIndex: raw.dayIndex,
    startDateIsMonday: raw.startDateIsMonday,
    startDateWeekday: raw.startDateWeekday,
    startDateWarning: raw.startDateWarning,
    schedulePhase: raw.schedulePhase,
    computedStatus: raw.computedStatus,
    displayPhase: raw.displayPhase,
    recapHasUpload: raw.recapHasUpload,
    isComplete: raw.isComplete,
    showAllEpisodes: raw.showAllEpisodes,
  };
}

export function isEpisodeContentReady(ep: Episode): boolean {
  return !ep.contentStatus || ep.contentStatus === 'complete';
}

export function getEpisodePublicMessage(ep: Episode): string {
  if (ep.contentStatus === 'missing') return CONTENT_STATUS_MESSAGES.missing;
  if (ep.contentStatus === 'incomplete') return CONTENT_STATUS_MESSAGES.incomplete;
  return '';
}

export function getEpisodeEditStatus(ep: Episode): EpisodeEditStatus {
  const filled = CORE_EPISODE_FIELDS.filter((k) => ep[k]?.trim()).length;
  if (filled === 0 && !ep.image) return 'empty';
  if (filled === CORE_EPISODE_FIELDS.length && ep.image) return 'complete';
  return 'in_progress';
}

export function getRecapEditStatus(recap?: WeeklyRecap | null): EpisodeEditStatus {
  if (!recap) return 'empty';
  if (!recap.text?.trim()) return 'empty';
  if (recap.text?.trim() && recap.title?.trim()) return 'complete';
  return 'in_progress';
}

export interface SeriesReadiness {
  episodesComplete: number;
  imagesUploaded: number;
  teasersFilled: number;
  recapStatus: EpisodeEditStatus;
  recapVideo: boolean;
  total: number;
}

export function getSeriesReadiness(series: Series): SeriesReadiness {
  return {
    episodesComplete: series.episodes.filter((e) => getEpisodeEditStatus(e) === 'complete').length,
    imagesUploaded: series.episodes.filter((e) => e.image).length,
    teasersFilled: series.episodes.filter((e) => e.teaser?.trim()).length,
    recapStatus: getRecapEditStatus(series.weeklyRecap),
    recapVideo: !!series.weeklyRecap?.video,
    total: 7,
  };
}

export const EDIT_STATUS_LABELS: Record<EpisodeEditStatus, string> = {
  empty: 'Üres',
  in_progress: 'Szerkesztés alatt',
  complete: 'Kész',
};

export const SERIES_STATUS_LABELS: Record<SeriesStatus, string> = {
  draft: 'Vázlat',
  active: 'Ütemezve',
  archived: 'Archív',
};

export const SCHEDULE_PHASE_LABELS: Record<SchedulePhase, string> = {
  draft: 'Vázlat',
  archived: 'Archív',
  upcoming: 'Következő hét',
  current: 'Aktuális hét',
  past: 'Lezárult',
  always: 'Nyitó sorozat',
};

export const COMPUTED_STATUS_LABELS: Record<ComputedSeriesStatus, string> = {
  draft: 'Vázlat',
  upcoming: 'Következő',
  current: 'Aktuális',
  archived: 'Archív',
};

export interface HomeResponse {
  phase: CurrentPhase;
  series: Series | null;
  message?: string;
  archivedSeries: Series[];
}

export type CurrentResponse = HomeResponse;

export const EMPTY_SERIES_MESSAGE = 'A következő sorozat hamarosan érkezik.';

export const RELEASE_MODE_LABELS: Record<ReleaseMode, string> = {
  all: 'Mind azonnal elérhető',
  daily: 'Naponta egy rész',
};

export const ADMIN_STATUS_LABELS: Record<EpisodeAdminStatus | 'available', string> = {
  draft: 'Vázlat',
  locked: 'Zárolt',
  current: 'Mai rész',
  available: 'Elérhető',
  incomplete: 'Hiányos',
  missing: 'Hiányzik',
};

export const CONTENT_STATUS_MESSAGES: Record<EpisodeContentStatus, string> = {
  missing: 'Ez a rész még készül.',
  incomplete: 'Hamarosan elérhető.',
  complete: '',
};

async function readApiError(res: Response): Promise<string> {
  try {
    const data = await res.json();
    return data.error || `Szerver hiba (${res.status})`;
  } catch {
    return `Szerver hiba (${res.status}) — indítsd újra: npm run dev`;
  }
}

export async function fetchCurrent(): Promise<HomeResponse> {
  const res = await fetch('/api/current');
  if (!res.ok) throw new Error('Hiba a betöltés során');
  const data = await res.json();
  if (!data || data.phase === 'empty') {
    return {
      phase: 'empty',
      series: null,
      message: data?.message || EMPTY_SERIES_MESSAGE,
      archivedSeries: (data?.archivedSeries || []).map(normalizeSeries),
    };
  }
  return {
    phase: data.phase,
    series: data.series ? normalizeSeries(data.series) : null,
    message: data.message || undefined,
    archivedSeries: (data.archivedSeries || []).map(normalizeSeries),
  };
}

export function seriesSlug(series: Pick<Series, 'slug' | 'id'>): string {
  return series.slug || series.id;
}

export function seriesUrl(series: Pick<Series, 'slug' | 'id'>, suffix = ''): string {
  return `/series/${seriesSlug(series)}${suffix}`;
}

export async function fetchSeries(ref: string): Promise<Series> {
  const res = await fetch(`/api/series/${ref}`);
  if (!res.ok) throw new Error('Sorozat nem található');
  return normalizeSeries(await res.json());
}

export async function fetchPastSeries(): Promise<Series[]> {
  const res = await fetch('/api/series');
  if (!res.ok) throw new Error('Hiba a betöltés során');
  const data = await res.json();
  return data.map(normalizeSeries);
}

export async function fetchAdminSeries(id: string): Promise<Series> {
  const res = await fetch(`/api/admin/series/${id}`);
  if (!res.ok) throw new Error('Sorozat nem található');
  return normalizeSeries(await res.json());
}

export async function fetchNextMonday(): Promise<string> {
  const res = await fetch('/api/admin/next-monday');
  if (!res.ok) throw new Error('Dátum betöltési hiba');
  const data = await res.json();
  return data.startDate;
}

export async function fetchAllSeries(): Promise<Series[]> {
  const res = await fetch('/api/admin/series');
  if (!res.ok) throw new Error('Hiba a betöltés során');
  const data = await res.json();
  return data.map(normalizeSeries);
}

export interface AppConfig {
  showAllEpisodes: boolean;
}

export async function fetchAppConfig(): Promise<AppConfig> {
  const res = await fetch('/api/admin/config');
  if (!res.ok) throw new Error('Beállítások betöltési hiba');
  return res.json();
}

export async function updateAppConfig(config: Partial<AppConfig>): Promise<AppConfig> {
  const res = await fetch('/api/admin/config', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(config),
  });
  if (!res.ok) throw new Error(await readApiError(res));
  return res.json();
}

export async function createSeries(formData: FormData): Promise<Series> {
  const res = await fetch('/api/series', { method: 'POST', body: formData });
  if (!res.ok) throw new Error(await readApiError(res));
  return normalizeSeries(await res.json());
}

export async function updateSeries(id: string, formData: FormData): Promise<Series> {
  const res = await fetch(`/api/series/${id}`, { method: 'PUT', body: formData });
  if (!res.ok) throw new Error(await readApiError(res));
  return normalizeSeries(await res.json());
}

export async function updateRecap(id: string, data: FormData): Promise<Series> {
  const res = await fetch(`/api/series/${id}/recap`, { method: 'PUT', body: data });
  if (!res.ok) throw new Error(await readApiError(res));
  return normalizeSeries(await res.json());
}

export async function updateEpisode(seriesId: string, day: number, formData: FormData): Promise<Series> {
  const res = await fetch(`/api/series/${seriesId}/episodes/${day}`, { method: 'PUT', body: formData });
  if (!res.ok) throw new Error(await readApiError(res));
  return normalizeSeries(await res.json());
}

export async function clearEpisode(seriesId: string, day: number): Promise<Series> {
  const res = await fetch(`/api/series/${seriesId}/episodes/${day}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Hiba a törlés során');
  return normalizeSeries(await res.json());
}

export async function deleteSeries(id: string): Promise<void> {
  const res = await fetch(`/api/series/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Hiba a törlés során');
}

export function mediaUrl(path: string): string {
  if (!path) return '';
  if (path.startsWith('http')) return path;
  return path;
}

export function heroImageUrl(series: Series): string {
  if (series.heroImage) return mediaUrl(series.heroImage);
  if (series.coverImage) return mediaUrl(series.coverImage);
  if (series.episodes[0]?.image) return mediaUrl(series.episodes[0].image);
  return placeholderCover(series.title);
}

export function placeholderCover(title: string): string {
  const encoded = encodeURIComponent(title.slice(0, 20));
  return `https://placehold.co/800x1200/1a0a0a/e50914?text=${encoded}&font=Outfit`;
}

export function placeholderEpisode(day: number): string {
  return `https://placehold.co/800x600/141414/e50914?text=${day}.+r%C3%A9sz&font=Outfit`;
}

export function episodeFormDataFrom(ep: Episode, overrides: Partial<Episode> = {}): FormData {
  const merged = { ...ep, ...overrides };
  const formData = new FormData();
  formData.append('title', merged.title);
  formData.append('scripture', merged.scripture);
  formData.append('thought', merged.thought);
  formData.append('question', merged.question);
  formData.append('prayer', merged.prayer);
  formData.append('teaser', merged.teaser);
  return formData;
}
