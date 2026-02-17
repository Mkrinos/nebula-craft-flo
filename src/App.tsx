import { Routes, Route } from 'react-router-dom';
import { Toaster } from 'sonner';
import { MusicProvider } from '@/contexts/MusicContext';
import { MiniPlayerBar } from '@/components/music/MiniPlayerBar';
import Landing from '@/pages/Landing';

function App() {
  return (
    <MusicProvider>
      <div className="min-h-screen bg-background text-foreground">
        <Routes>
          <Route path="/" element={<Landing />} />
        </Routes>
        <MiniPlayerBar />
        <Toaster position="top-center" richColors />
      </div>
    </MusicProvider>
  );
}

export default App;
