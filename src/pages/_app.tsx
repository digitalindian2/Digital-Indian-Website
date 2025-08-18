// src/pages/_app.tsx
import type { AppProps } from 'next/app';
import '../globals.css'; // Import your global CSS here

function MyApp({ Component, pageProps }: AppProps) {
  return <Component {...pageProps} />;
}

export default MyApp;
