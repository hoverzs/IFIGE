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
} from './publish.js';
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

function isEmptySeedData(data) {
  const series = data?.series?.[0];
  if (!series) return true;
  if (series.title === 'Amikor megtagadsz') return true;
  return !series.episodes?.some((ep) => ep.image);
}

function bootstrapFromSeed() {
  const seedDataDir = path.join(SEED_DIR, 'data');
  const seedUploadsDir = path.join(SEED_DIR, 'uploads');
  const seedSeriesFile = path.join(seedDataDir, 'series.json');
  if (!fs.existsSync(seedSeriesFile)) return;

  const force = process.env.FORCE_SEED === 'true';
  let importData = !fs.existsSync(DATA_FILE);

  if (!importData && (force || fs.existsSync(DATA_FILE))) {
    try {
      const existing = JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));
      if (force || isEmptySeedData(existing)) importData = true;
    } catch {
      importData = true;
    }
  }

  if (importData) {
    copyDirContents(seedDataDir, DATA_DIR, { overwrite: true });
    console.log('[IFIge] Seed sorozat betöltve →', DATA_DIR);
  }

  if (fs.existsSync(seedUploadsDir)) {
    copyDirContents(seedUploadsDir, UPLOADS_DIR, { overwrite: force });
    console.log('[IFIge] Seed média ellenőrizve →', UPLOADS_DIR);
  }
}

bootstrapFromSeed();

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
  return JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));
}

function writeData(data) {
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
  if (!IS_PRODUCTION && process.env.PUBLISH_TEST_NOW) {
    opts.now = new Date(process.env.PUBLISH_TEST_NOW);
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
  const preferred = series.episodes.find((ep) => ep.day === preferredDay);
  if (preferred?.image) return preferred.image;
  if (series.episodes[0]?.image) return series.episodes[0].image;
  return series.coverImage || '';
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

function deleteFile(filePath) {
  if (!filePath?.startsWith('/uploads/')) return;
  const full = path.join(UPLOADS_DIR, path.basename(filePath));
  if (fs.existsSync(full)) fs.unlinkSync(full);
}

function getActiveSeries(data) {
  const active = data.series.filter((s) => s.status === 'active');
  if (!active.length) return null;
  return active.sort((a, b) => new Date(b.startDate) - new Date(a.startDate))[0];
}

function migrateSeries(series) {
  series.biblicalBasis = series.biblicalBasis || series.mainScripture || '';
  series.weeklyMessage = series.weeklyMessage || series.weeklyTagline || '';
  series.coverImage = series.coverImage || '';
  delete series.mainScripture;
  delete series.weeklyTagline;
  delete series.coverAnimation;
  delete series.weeklyVideoNarration;

  if (!['draft', 'active', 'archived'].includes(series.status)) {
    series.status = series.status === 'archived' ? 'archived' : 'active';
  }

  if (!['all', 'daily'].includes(series.releaseMode)) {
    series.releaseMode = 'daily';
  }

  if (!series.weeklyRecap || typeof series.weeklyRecap !== 'object') {
    series.weeklyRecap = emptyRecap();
  } else {
    series.weeklyRecap = { ...emptyRecap(), ...series.weeklyRecap, video: series.weeklyRecap.video || '' };
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

function setActiveSeries(data, seriesId) {
  data.series.forEach((s) => {
    if (s.id !== seriesId && s.status === 'active') s.status = 'archived';
  });
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

const app = express();
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(UPLOADS_DIR));

app.get('/api/health', (_req, res) => res.json({ ok: true }));

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
  const active = getActiveSeries(data);
  if (!active) return res.json(null);
  res.json(toPublic(active));
});

app.get('/api/series', (_req, res) => {
  const data = readData();
  res.json(
    data.series
      .filter((s) => s.status === 'archived' || (s.status === 'active' && getDayIndex(s.startDate) > 7))
      .map((s) => toPublic(s))
      .sort((a, b) => new Date(b.startDate) - new Date(a.startDate))
  );
});

app.get('/api/series/:id', (req, res) => {
  const data = readData();
  const series = data.series.find((s) => s.id === req.params.id);
  if (!series) return res.status(404).json({ error: 'Sorozat nem található' });
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
    const { title, description, biblicalBasis, weeklyMessage, startDate, status, releaseMode } = req.body;
    if (!title?.trim()) return res.status(400).json({ error: 'A cím kötelező' });

    const newStatus = status || 'draft';
    if (newStatus === 'active') {
      data.series.forEach((s) => { if (s.status === 'active') s.status = 'archived'; });
    }

    const newSeries = migrateSeries({
      id: uuidv4(),
      title: title.trim(),
      description: (description || '').trim(),
      biblicalBasis: (biblicalBasis || '').trim(),
      weeklyMessage: (weeklyMessage || '').trim(),
      coverImage: req.file ? `/uploads/${req.file.filename}` : '',
      startDate: startDate || new Date().toISOString().split('T')[0],
      releaseMode: ['all', 'daily'].includes(releaseMode) ? releaseMode : 'daily',
      status: newStatus,
      weeklyRecap: { ...emptyRecap(), title: title.trim() },
      episodes: Array.from({ length: 7 }, (_, i) => emptyEpisode(i + 1)),
    });

    if (newStatus === 'active') setActiveSeries(data, newSeries.id);
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
    const { title, description, biblicalBasis, weeklyMessage, startDate, status, releaseMode, removeCover } = req.body;

    if (title !== undefined) series.title = title.trim();
    if (description !== undefined) series.description = description.trim();
    if (biblicalBasis !== undefined) series.biblicalBasis = biblicalBasis.trim();
    if (weeklyMessage !== undefined) series.weeklyMessage = weeklyMessage.trim();
    if (startDate !== undefined) series.startDate = startDate;
    if (releaseMode !== undefined && ['all', 'daily'].includes(releaseMode)) {
      series.releaseMode = releaseMode;
    }

    if (removeCover === 'true' && series.coverImage) {
      deleteFile(series.coverImage);
      series.coverImage = '';
    }
    if (req.file) {
      if (series.coverImage) deleteFile(series.coverImage);
      series.coverImage = `/uploads/${req.file.filename}`;
    }

    if (status !== undefined && ['draft', 'active', 'archived'].includes(status)) {
      if (status === 'active') setActiveSeries(data, series.id);
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
    app.use(express.static(DIST_DIR));
    app.get('*', (req, res, next) => {
      if (req.path.startsWith('/api') || req.path.startsWith('/uploads')) {
        return next();
      }
      res.sendFile(path.join(DIST_DIR, 'index.html'), (err) => {
        if (err) next(err);
      });
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
