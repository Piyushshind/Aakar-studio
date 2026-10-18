import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '@fontsource-variable/fraunces/opsz.css';
import '@fontsource-variable/manrope';
import './styles/index.css';
import './styles/animations.css';
import App from './App.tsx';
import { MotionProvider } from './components/common/MotionProvider';
import { SmoothScrollProvider } from './components/common/SmoothScrollProvider';

// Dev only: validate the photo manifest once (zod never ships to production).
if (import.meta.env.DEV) {
  void import('./lib/photos.schema').then(({ validateManifest }) => validateManifest());
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <MotionProvider>
      <SmoothScrollProvider>
        <App />
      </SmoothScrollProvider>
    </MotionProvider>
  </StrictMode>,
);
