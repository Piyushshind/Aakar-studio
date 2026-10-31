import App from './App.tsx';
import { MotionProvider } from './components/common/MotionProvider';
import { SmoothScrollProvider } from './components/common/SmoothScrollProvider';

/** The app with its providers: rendered by main.tsx in the browser and entry-server.tsx at build. */
export function Root() {
  return (
    <MotionProvider>
      <SmoothScrollProvider>
        <App />
      </SmoothScrollProvider>
    </MotionProvider>
  );
}
