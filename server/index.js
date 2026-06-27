import express from 'express';
import cors from 'cors';
import multer from 'multer';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  enrichSeries,
  sanitizeForPublic,
  enrichForAdmin,
  getDayIndex,
  getNextMonday,
  validateStartDate,
  resolveCurrentDisplay,
  resolveHomeDisplay,
  getPastSeriesCandidates,
  getComputedStatus,
  getAdminComputedStatus,
} from './publish.js';
import {
  buildEpisodeShareMeta,
  injectOgTags,
  parseEpisodePath,
  getRequestBaseUrl,
} from './share.js';
import { v4 as uuidv4 } from 'uuid';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const DATA_DIR = process.env.DATA_DIR || path.join(ROOT, 'data');
const UPLOADS_DIR = process.env.UPLOADS_DIR || path.join(ROOT, 'uploads');
const DIST_DIR = path.join(ROOT, 'dist');
const DATA_FILE = path.join(DATA_DIR, 'series.json');
const CONFIG_FILE = path.join(DATA_DIR, 'config.json');
const IS_PRODUCTION = process.env.NODE_ENV === 'production';
const SEED_DIR = path.join(ROOT, 'seed');

fs.mkdirSync(DATA_DIR, { recursive: true });
fs.mkdirSync(UPLOADS_DIR, { recursive: true });

function copyDirContents(srcDir, destDir, { overwrite = false } = {}) {
  if (!fs.existsSync(srcDir)) return;
  fs.mkdirSync(destDir, { recursive: true });
  for (const name of fs.readdirSync(srcDir)) {
    const src = path.join(srcDir, name);
    const dest = path.join(destDir, name);
    if (fs.statSync(src).isDirectory()) {
      copyDirContents(src, dest, { overwrite });
      continue;
    }
    if (overwrite || !fs.existsSync(dest)) {
      fs.copyFileSync(src, dest);
    }
  }
}

function isPersistentStorage() {
  const dataPath = path.resolve(DATA_DIR);
  const uploadsPath = path.resolve(UPLOADS_DIR);
  return dataPath.startsWith('/data') && uploadsPath.startsWith('/data');
}

function bootstrapFromSeed() {
  const seedDataDir = path.join(SEED_DIR, 'data');
  const seedUploadsDir = path.join(SEED_DIR, 'uploads');
  const seedSeriesFile = path.join(seedDataDir, 'series.json');
  if (!fs.existsSync(seedSeriesFile)) return;

  const force = process.env.FORCE_SEED === 'true';
  // Csak első induláskor vagy kézi FORCE_SEED — soha ne írjuk felül a meglévő tartalmat automatikusan.
  const importData = !fs.existsSync(DATA_FILE) || force;

  if (importData) {
    copyDirContents(seedDataDir, DATA_DIR, { overwrite: true });
    console.warn(
      '[IFIge] Seed sorozat betöltve →',
      DATA_DIR,
      force ? '(FORCE_SEED)' : '(új adatkönyvtár)',
    );
  }

  if (fs.existsSync(seedUploadsDir)) {
    copyDirContents(seedUploadsDir, UPLOADS_DIR, { overwrite: force });
  }
}

bootstrapFromSeed();

if (IS_PRODUCTION && !isPersistentStorage()) {
  console.error(
    '[IFIge] FIGYELEM: nincs perzisztens tárhely (Volume). ' +
      'A sorozatok és feltöltések ELVESZNEK minden Railway redeploy-nál. ' +
      'Állíts be Volume mount /data + DATA_DIR=/data/data + UPLOADS_DIR=/data/uploads',
  );
}

const storage = multer.diskStorage({
  destination: UPLOADS_DIR,
  filename: (_req, file, cb) => {
    cb(null, `${uuidv4()}${path.extname(file.originalname).toLowerCase()}`);
  },
});

const imageUpload = multer({
  storage,
  limits: { fileSize: 20 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const ok = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'].includes(file.mimetype);
    if (ok) cb(null, true);
    else cb(new Error('Csak JPG, PNG, WebP vagy GIF kép'));
  },
});

function readData() {
  if (!fs.existsSync(DATA_FILE)) {
    const seed = createSeedData();
    writeData(seed);
    return seed;
  }
  const data = JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));
  data.series = (data.series || []).map((s) => migrateSeries({ ...s }));
  assignSlugs(data);
  return data;
}

function writeData(data) {
  assignSlugs(data);
  data.series = data.series.map((s) => migrateSeries({ ...s }));
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}

function readConfig() {
  if (!fs.existsSync(CONFIG_FILE)) {
    const seed = { showAllEpisodes: false };
    writeConfig(seed);
    return seed;
  }
  const config = JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf-8'));
  if (typeof config.showAllEpisodes !== 'boolean') {
    config.showAllEpisodes = false;
  }
  return config;
}

function writeConfig(config) {
  fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2));
}

function enrichOpts() {
  const opts = {
    showAllEpisodes: !!readConfig().showAllEpisodes,
    resolveHeroImage,
  };
  if (process.env.PUBLISH_TEST_NOW) {
    if (IS_PRODUCTION) {
      console.warn('[IFIge] PUBLISH_TEST_NOW be van állítva, de production módban FIGYELMEN KÍVÜL HAGYJUK — ne használd Railway-en.');
    } else {
      opts.now = new Date(process.env.PUBLISH_TEST_NOW);
      console.log('[IFIge] Dev teszt idő:', process.env.PUBLISH_TEST_NOW);
    }
  }
  return opts;
}

function toPublic(series) {
  return sanitizeForPublic(enrichSeries(migrateSeries({ ...series }), enrichOpts()));
}

function toAdmin(series) {
  return enrichForAdmin(migrateSeries({ ...series }), enrichOpts());
}

function emptyEpisode(day) {
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

function emptyRecap() {
  return { title: '', text: '', video: '' };
}

function resolveHeroImage(series, preferredDay = 1) {
  if (series.coverImage?.trim()) return series.coverImage;
  const preferred = series.episodes.find((ep) => ep.day === preferredDay);
  if (preferred?.image) return preferred.image;
  const firstWithImage = series.episodes.find((ep) => ep.image);
  return firstWithImage?.image || '';
}

const videoUpload = multer({
  storage,
  limits: { fileSize: 100 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const ok = ['video/mp4', 'video/webm', 'video/quicktime'].includes(file.mimetype);
    if (ok) cb(null, true);
    else cb(new Error('Csak MP4, WebM vagy MOV videó'));
  },
});

function createSeedData() {
  const start = new Date().toISOString().split('T')[0];
  return {
    series: [{
      id: uuidv4(),
      title: 'Amikor megtagadsz',
      description: 'Egy hét Péter történetén keresztül.',
      biblicalBasis: 'Péter tagadása és helyreállítása (Lk 22; Jn 21)',
      weeklyMessage: 'Isten többet lát benned annál, amit te már szégyellsz magadban.',
      coverImage: '',
      startDate: start,
      status: 'active',
      weeklyRecap: { title: 'Amikor megtagadsz', text: 'A hét narrációs szövege — külső programmal készül belőle videó.' },
      episodes: Array.from({ length: 7 }, (_, i) => ({
        ...emptyEpisode(i + 1),
        title: i === 0 ? 'A bizalom csúcsán' : '',
        scripture: i === 0 ? 'Lk 22:33' : '',
      })),
    }],
  };
}

function assertMondayStartDate(startDate, releaseMode) {
  if (releaseMode === 'all') return null;
  const validation = validateStartDate(startDate);
  return validation.ok ? null : validation.message;
}

function deleteFile(filePath) {
  if (!filePath?.startsWith('/uploads/')) return;
  const full = path.join(UPLOADS_DIR, path.basename(filePath));
  if (fs.existsSync(full)) fs.unlinkSync(full);
}

function slugify(title) {
  const map = {
    á: 'a', à: 'a', ä: 'a', é: 'e', è: 'e', ë: 'e', í: 'i', ó: 'o', ö: 'o', ő: 'o',
    ú: 'u', ü: 'u', ű: 'u', Á: 'a', É: 'e', Í: 'i', Ó: 'o', Ö: 'o', Ő: 'o', Ú: 'u', Ü: 'u', Ű: 'u',
  };
  const raw = (title || 'sorozat')
    .trim()
    .split('')
    .map((c) => map[c] || c)
    .join('')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
  return raw.replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 80) || 'sorozat';
}

function assignSlugs(data) {
  const used = new Set();
  for (const series of data.series) {
    if (series.slug && !used.has(series.slug)) {
      used.add(series.slug);
      continue;
    }
    let base = slugify(series.title);
    let slug = base;
    let n = 2;
    while (used.has(slug)) slug = `${base}-${n++}`;
    series.slug = slug;
    used.add(slug);
  }
}

function findSeriesByRef(data, ref) {
  return data.series.find((s) => s.slug === ref) || data.series.find((s) => s.id === ref);
}

function migrateSeries(series) {
  series.subtitle = series.subtitle || series.biblicalBasis || series.mainScripture || '';
  series.weeklySentence = series.weeklySentence || series.weeklyMessage || series.weeklyTagline || '';
  series.weeklyMessage = series.weeklySentence;
  series.biblicalBasis = series.subtitle;
  series.coverImage = series.coverImage || '';
  series.heroImage = series.heroImage || '';
  delete series.mainScripture;
  delete series.weeklyTagline;
  delete series.coverAnimation;
  delete series.weeklyVideoNarration;

  const recapSrc = series.recap || series.weeklyRecap;
  series.recap = { ...emptyRecap(), ...(recapSrc || {}), video: recapSrc?.video || '' };
  series.weeklyRecap = series.recap;

  if (!['draft', 'active', 'archived'].includes(series.status)) {
    series.status = series.status === 'archived' ? 'archived' : 'active';
  }

  if (!['all', 'daily'].includes(series.releaseMode)) {
    series.releaseMode = 'daily';
  }

  series.episodes = (series.episodes || []).map((ep, i) => {
    const base = emptyEpisode(ep.day || i + 1);
    if (ep.animation) deleteFile(ep.animation);
    const { animation: _a, ...rest } = ep;
    return { ...base, ...rest, teaser: ep.teaser || '' };
  });

  while (series.episodes.length < 7) {
    series.episodes.push(emptyEpisode(series.episodes.length + 1));
  }
  series.episodes = series.episodes.slice(0, 7);
  return series;
}

function withUpload(uploadMiddleware) {
  return (req, res, next) => {
    uploadMiddleware(req, res, (err) => {
      if (!err) return next();
      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return res.status(400).json({ error: 'A fájl túl nagy (max. 100 MB)' });
        }
        if (err.code === 'LIMIT_UNEXPECTED_FILE') {
          return res.status(400).json({ error: `Váratlan fájlmező: ${err.field}` });
        }
        return res.status(400).json({ error: 'Feltöltési hiba: ' + err.message });
      }
      return res.status(400).json({ error: err.message || 'Feltöltési hiba' });
    });
  };
}

let cachedIndexHtml = null;

function loadIndexHtml() {
  const indexPath = path.join(DIST_DIR, 'index.html');
  if (!cachedIndexHtml) {
    cachedIndexHtml = fs.readFileSync(indexPath, 'utf-8');
  }
  return cachedIndexHtml;
}

function sendSpaIndex(req, res, next) {
  try {
    let html = loadIndexHtml();
    const episodeRef = parseEpisodePath(req.path);
    if (episodeRef) {
      const data = readData();
      const series = findSeriesByRef(data, episodeRef.slug);
      if (series && series.status !== 'draft') {
        migrateSeries(series);
        const episode = series.episodes.find((ep) => ep.day === episodeRef.day);
        if (episode?.title?.trim()) {
          const meta = buildEpisodeShareMeta(series, episode, getRequestBaseUrl(req));
          html = injectOgTags(html, meta);
        }
      }
    }
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.send(html);
  } catch (err) {
    next(err);
  }
}

const app = express();
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(UPLOADS_DIR));

app.get('/api/health', (_req, res) => {
  let seriesCount = 0;
  try {
    seriesCount = readData().series?.length || 0;
  } catch {
    seriesCount = -1;
  }
  const persistent = isPersistentStorage();
  res.json({
    ok: true,
    dataDir: DATA_DIR,
    uploadsDir: UPLOADS_DIR,
    seriesCount,
    persistent,
    storageWarning: persistent
      ? null
      : 'Az adatok nem maradnak meg redeploy után. Railway Volume szükséges (/data).',
  });
});

app.get('/api/admin/backup', (_req, res) => {
  const data = readData();
  const stamp = new Date().toISOString().slice(0, 10);
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="ifige-backup-${stamp}.json"`);
  res.send(JSON.stringify(data, null, 2));
});

app.get('/api/admin/config', (_req, res) => {
  res.json(readConfig());
});

app.put('/api/admin/config', (req, res) => {
  const config = readConfig();
  if (typeof req.body.showAllEpisodes === 'boolean') {
    config.showAllEpisodes = req.body.showAllEpisodes;
  }
  writeConfig(config);
  res.json(config);
});

app.get('/api/current', (_req, res) => {
  const data = readData();
  res.json(resolveHomeDisplay(data.series, enrichOpts()));
});

app.get('/api/series', (_req, res) => {
  const data = readData();
  const opts = enrichOpts();
  res.json(
    getPastSeriesCandidates(data.series, opts.now || new Date())
      .map((s) => toPublic(s))
      .sort((a, b) => new Date(b.startDate) - new Date(a.startDate))
  );
});

app.get('/api/series/:ref', (req, res) => {
  const data = readData();
  const series = findSeriesByRef(data, req.params.ref);
  if (!series) return res.status(404).json({ error: 'Sorozat nem található' });
  if (series.status === 'draft') return res.status(404).json({ error: 'Sorozat nem található' });
  res.json(toPublic(series));
});

app.get('/api/admin/series', (_req, res) => {
  const data = readData();
  res.json(
    data.series.map((s) => toAdmin(s)).sort((a, b) => new Date(b.startDate) - new Date(a.startDate))
  );
});

app.get('/api/admin/series/:id', (req, res) => {
  const data = readData();
  const series = data.series.find((s) => s.id === req.params.id);
  if (!series) return res.status(404).json({ error: 'Sorozat nem található' });
  res.json(toAdmin(series));
});

app.get('/api/admin/next-monday', (_req, res) => {
  res.json({ startDate: getNextMonday() });
});

app.post(
  '/api/series',
  withUpload(imageUpload.single('coverImage')),
  (req, res) => {
    const data = readData();
    const { title, description, biblicalBasis, weeklyMessage, startDate, status, releaseMode, subtitle, weeklySentence, slug } = req.body;
    if (!title?.trim()) return res.status(400).json({ error: 'A cím kötelező' });

    const newStatus = status || 'draft';
    const mode = ['all', 'daily'].includes(releaseMode) ? releaseMode : 'daily';
    const resolvedStart = startDate || getNextMonday();
    const mondayErr = assertMondayStartDate(resolvedStart, mode);
    if (mondayErr) return res.status(400).json({ error: mondayErr });

    const newSeries = migrateSeries({
      id: uuidv4(),
      title: title.trim(),
      subtitle: (subtitle || biblicalBasis || '').trim(),
      description: (description || '').trim(),
      biblicalBasis: (subtitle || biblicalBasis || '').trim(),
      weeklySentence: (weeklySentence || weeklyMessage || '').trim(),
      weeklyMessage: (weeklySentence || weeklyMessage || '').trim(),
      slug: slug?.trim() || '',
      coverImage: req.file ? `/uploads/${req.file.filename}` : '',
      startDate: resolvedStart,
      releaseMode: mode,
      status: newStatus,
      weeklyRecap: { ...emptyRecap(), title: title.trim() },
      episodes: Array.from({ length: 7 }, (_, i) => emptyEpisode(i + 1)),
    });

    data.series.push(newSeries);
    writeData(data);
    res.status(201).json(toAdmin(newSeries));
  }
);

app.put(
  '/api/series/:id',
  withUpload(imageUpload.single('coverImage')),
  (req, res) => {
    const data = readData();
    const idx = data.series.findIndex((s) => s.id === req.params.id);
    if (idx === -1) return res.status(404).json({ error: 'Sorozat nem található' });

    const series = migrateSeries(data.series[idx]);
    const { title, description, biblicalBasis, weeklyMessage, startDate, status, releaseMode, removeCover, subtitle, weeklySentence, slug } = req.body;

    if (title !== undefined) series.title = title.trim();
    if (subtitle !== undefined) series.subtitle = subtitle.trim();
    if (biblicalBasis !== undefined) series.subtitle = biblicalBasis.trim();
    if (description !== undefined) series.description = description.trim();
    if (weeklySentence !== undefined) series.weeklySentence = weeklySentence.trim();
    if (weeklyMessage !== undefined) series.weeklySentence = weeklyMessage.trim();
    series.biblicalBasis = series.subtitle;
    series.weeklyMessage = series.weeklySentence;
    if (slug !== undefined && slug.trim()) series.slug = slug.trim();
    if (startDate !== undefined) series.startDate = startDate;
    if (releaseMode !== undefined && ['all', 'daily'].includes(releaseMode)) {
      series.releaseMode = releaseMode;
    }

    const mondayErr = assertMondayStartDate(series.startDate, series.releaseMode);
    if (mondayErr) return res.status(400).json({ error: mondayErr });

    if (removeCover === 'true' && series.coverImage) {
      deleteFile(series.coverImage);
      series.coverImage = '';
    }
    if (req.file) {
      if (series.coverImage) deleteFile(series.coverImage);
      series.coverImage = `/uploads/${req.file.filename}`;
    }

    if (status !== undefined && ['draft', 'active', 'archived'].includes(status)) {
      series.status = status;
    }

    data.series[idx] = series;
    writeData(data);
    res.json(toAdmin(series));
  }
);

app.put(
  '/api/series/:id/recap',
  withUpload(videoUpload.single('video')),
  (req, res) => {
    const data = readData();
    const series = data.series.find((s) => s.id === req.params.id);
    if (!series) return res.status(404).json({ error: 'Sorozat nem található' });

    migrateSeries(series);
    const { title, text, removeVideo } = req.body;

    if (title !== undefined) series.weeklyRecap.title = title.trim();
    if (text !== undefined) series.weeklyRecap.text = text.trim();

    if (removeVideo === 'true' && series.weeklyRecap.video) {
      deleteFile(series.weeklyRecap.video);
      series.weeklyRecap.video = '';
    }
    if (req.file) {
      if (series.weeklyRecap.video) deleteFile(series.weeklyRecap.video);
      series.weeklyRecap.video = `/uploads/${req.file.filename}`;
    }

    writeData(data);
    res.json(toAdmin(series));
  }
);

app.put(
  '/api/series/:id/episodes/:day',
  withUpload(imageUpload.single('image')),
  (req, res) => {
    const data = readData();
    const series = data.series.find((s) => s.id === req.params.id);
    if (!series) return res.status(404).json({ error: 'Sorozat nem található' });

    migrateSeries(series);
    const day = parseInt(req.params.day, 10);
    const ep = series.episodes.find((e) => e.day === day);
    if (!ep) return res.status(404).json({ error: 'Epizód nem található' });

    const { title, scripture, thought, question, prayer, teaser, removeImage } = req.body;

    if (title !== undefined) ep.title = title;
    if (scripture !== undefined) ep.scripture = scripture;
    if (thought !== undefined) ep.thought = thought;
    if (question !== undefined) ep.question = question;
    if (prayer !== undefined) ep.prayer = prayer;
    if (teaser !== undefined) ep.teaser = teaser;

    if (removeImage === 'true' && ep.image) { deleteFile(ep.image); ep.image = ''; }
    if (req.file) {
      if (ep.image) deleteFile(ep.image);
      ep.image = `/uploads/${req.file.filename}`;
    }

    writeData(data);
    res.json(toAdmin(series));
  }
);

app.delete('/api/series/:id/episodes/:day', (req, res) => {
  const data = readData();
  const series = data.series.find((s) => s.id === req.params.id);
  if (!series) return res.status(404).json({ error: 'Sorozat nem található' });

  migrateSeries(series);
  const day = parseInt(req.params.day, 10);
  const ep = series.episodes.find((e) => e.day === day);
  if (!ep) return res.status(404).json({ error: 'Epizód nem található' });

  deleteFile(ep.image);
  Object.assign(ep, emptyEpisode(day));
  writeData(data);
  res.json(toAdmin(series));
});

app.delete('/api/series/:id', (req, res) => {
  const data = readData();
  const idx = data.series.findIndex((s) => s.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Sorozat nem található' });

  const series = migrateSeries(data.series[idx]);
  deleteFile(series.coverImage);
  deleteFile(series.weeklyRecap?.video);
  series.episodes.forEach((ep) => {
    deleteFile(ep.image);
  });

  data.series.splice(idx, 1);
  writeData(data);
  res.json({ ok: true });
});

if (IS_PRODUCTION) {
  if (fs.existsSync(DIST_DIR)) {
    app.use(
      express.static(DIST_DIR, {
        setHeaders(res, filePath) {
          if (filePath.endsWith('index.html')) {
            res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
          }
        },
      }),
    );
    app.get('*', (req, res, next) => {
      if (req.path.startsWith('/api') || req.path.startsWith('/uploads')) {
        return next();
      }
      sendSpaIndex(req, res, next);
    });
  } else {
    console.warn('[IFIge] dist/ hiányzik — futtasd: npm run build');
  }
}

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: err.message || 'Belső szerverhiba' });
});

const PORT = process.env.PORT || 3001;
const HOST = process.env.HOST || '0.0.0.0';

app.listen(PORT, HOST, () => {
  console.log(`IFIge ${IS_PRODUCTION ? 'production' : 'development'}: http://${HOST}:${PORT}`);
  console.log(`  data:    ${DATA_DIR}`);
  console.log(`  uploads: ${UPLOADS_DIR}`);
});
