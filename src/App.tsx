import { Routes, Route } from 'react-router-dom';
import HomePage from './pages/HomePage';
import EpisodesPage from './pages/EpisodesPage';
import EpisodePage from './pages/EpisodePage';
import ArchivePage from './pages/ArchivePage';
import SeriesPage from './pages/SeriesPage';
import AdminPage from './pages/admin/AdminPage';
import NewSeriesPage from './pages/admin/NewSeriesPage';
import EditSeriesPage from './pages/admin/EditSeriesPage';
import RecapPage from './pages/RecapPage';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/episodes" element={<EpisodesPage />} />
      <Route path="/archive" element={<ArchivePage />} />
      <Route path="/series/:id" element={<SeriesPage />} />
      <Route path="/series/:id/episode/:day" element={<EpisodePage />} />
      <Route path="/admin" element={<AdminPage />} />
      <Route path="/admin/new" element={<NewSeriesPage />} />
      <Route path="/series/:id/recap" element={<RecapPage />} />
      <Route path="/admin/series/:id" element={<EditSeriesPage />} />
    </Routes>
  );
}
