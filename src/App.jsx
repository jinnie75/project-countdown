import { Navigate, Route, Routes } from 'react-router-dom';
import DisplayPage from './pages/DisplayPage';
import EditPage from './pages/EditPage';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/display" replace />} />
      <Route path="/display" element={<DisplayPage />} />
      <Route path="/edit" element={<EditPage />} />
    </Routes>
  );
}

