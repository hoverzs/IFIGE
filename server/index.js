import express from 'express';
import cors from 'cors';
import multer from 'multer';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { v4 as uuidv4 } from 'uuid';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const DATA_DIR = path.join(ROOT, 'data');
const UPLOADS_DIR = path.join(ROOT, 'uploads');
const DATA_FILE = path.join(DATA_DIR, 'series.json');
const CONFIG_FILE = path.join(DATA_DIR, 'config.json');

fs.mkdirSync(DATA_DIR, { recursive: true });
fs.mkdirSync(UPLOADS_DIR, { recursive: true });

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
    const seed = { showAllEpisodes: true };
    writeConfig(seed);
    return seed;
  }
  return JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf-8'));
}

function writeConfig(config) {
  fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2));
}

function unlockAllForTest(s) {
  return {
    ...s,
    heroImage: resolveHeroImage(s, 1),
    currentDay: 7,
    totalDays: 7,
    episodes: s.episodes.map((ep) => ({ ...ep, status: 'available' })),
    recapStatus: 'available',
    isComplete: true,
    showAllEpisodes: true,
  };
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
  const full = path.join(ROOT, filePath.replace(/^\//, ''));
  if (fs.existsSync(full)) fs.unlinkSync(full);
}

function getDayIndex(startDate, today = new Date()) {
  const start = new Date(startDate + 'T00:00:00');
  const now = new Date(today);
  now.setHours(0, 0, 0, 0);
  return Math.floor((now - start) / (1000 * 60 * 60 * 24)) + 1;
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

function enrichSeries(series, today = new Date()) {
  const s = migrateSeries({ ...series });
  const dayIndex = getDayIndex(s.startDate, today);

  if (s.status === 'draft') {
    return {
      ...s,
      heroImage: resolveHeroImage(s, 1),
      currentDay: 0,
      totalDays: 7,
      episodes: s.episodes.map((ep) => ({ ...ep, status: 'locked' })),
      recapStatus: 'locked',
      isComplete: false,
      showAllEpisodes: false,
    };
  }

  if (readConfig().showAllEpisodes) {
    return unlockAllForTest(s);
  }

  if (s.releaseMode === 'all') {
    return {
      ...s,
      heroImage: resolveHeroImage(s, 1),
      currentDay: 7,
      totalDays: 7,
      episodes: s.episodes.map((ep) => ({ ...ep, status: 'available' })),
      recapStatus: 'available',
      isComplete: true,
      showAllEpisodes: false,
    };
  }

  const clampedDay = Math.min(Math.max(dayIndex, 1), 7);

  return {
    ...s,
    heroImage: resolveHeroImage(s, clampedDay),
    currentDay: clampedDay,
    totalDays: 7,
    episodes: s.episodes.map((ep) => {
      let status = 'locked';
      if (ep.day < clampedDay) status = 'available';
      else if (ep.day === clampedDay) status = 'current';
      return { ...ep, status };
    }),
    recapStatus: dayIndex > 7 ? 'available' : 'locked',
    isComplete: dayIndex > 7,
    showAllEpisodes: false,
  };
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
  res.json(enrichSeries(active));
});

app.get('/api/series', (_req, res) => {
  const data = readData();
  res.json(
    data.series
      .filter((s) => s.status === 'archived' || (s.status === 'active' && getDayIndex(s.startDate) > 7))
      .map((s) => enrichSeries(s))
      .sort((a, b) => new Date(b.startDate) - new Date(a.startDate))
  );
});

app.get('/api/series/:id', (req, res) => {
  const data = readData();
  const series = data.series.find((s) => s.id === req.params.id);
  if (!series) return res.status(404).json({ error: 'Sorozat nem található' });
  res.json(enrichSeries(series));
});

app.get('/api/admin/series', (_req, res) => {
  const data = readData();
  res.json(
    data.series.map((s) => enrichSeries(s)).sort((a, b) => new Date(b.startDate) - new Date(a.startDate))
  );
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
    res.status(201).json(enrichSeries(newSeries));
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
    res.json(enrichSeries(series));
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
    res.json(enrichSeries(series));
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
    res.json(enrichSeries(series));
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
  res.json(enrichSeries(series));
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

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: err.message || 'Belső szerverhiba' });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`IFIge API: http://localhost:${PORT}`));
