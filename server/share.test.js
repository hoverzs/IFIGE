import {
  buildEpisodeShareMeta,
  injectOgTags,
  getEpisodeShareSummary,
  parseEpisodePath,
} from './share.js';

function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

const episode = {
  day: 1,
  title: 'Teszt epizód',
  teaser: '',
  thought: 'Első bekezdés.\n\nMásodik.',
  question: '',
  image: '',
};
const series = {
  title: 'Sorozat',
  slug: 'sorozat',
  description: '',
  coverImage: '/uploads/cover.jpg',
};

assert(getEpisodeShareSummary(episode) === 'Első bekezdés.', 'gondolat első bekezdése');

const meta = buildEpisodeShareMeta(series, episode, 'https://ifige.textus.ro');
assert(meta.title.includes('Teszt epizód'), 'cím');
assert(meta.description === 'Első bekezdés.', 'leírás');
assert(meta.url === 'https://ifige.textus.ro/series/sorozat/episode/1', 'url');
assert(meta.image === 'https://ifige.textus.ro/uploads/cover.jpg', 'kép');

const html = injectOgTags(
  '<html><head><title>IFIge</title><meta name="description" content="x" /></head></html>',
  meta,
);
assert(html.includes('property="og:title"'), 'og:title');
assert(html.includes('Első bekezdés.'), 'og leírás');

const parsed = parseEpisodePath('/series/a-nem-fogadott-hivas/episode/3');
assert(parsed?.slug === 'a-nem-fogadott-hivas' && parsed.day === 3, 'útvonal parse');

console.log('✓ share teszt sikeres');
