import type { AppProps } from 'next/app';
import { Bricolage_Grotesque, DM_Mono, Fraunces } from 'next/font/google';
// The project does not declare side-effect CSS modules, but Next.js handles this import.
// @ts-expect-error CSS is loaded by the Next.js pages runtime.
import '@/styles/globals.css';

const bricolage = Bricolage_Grotesque({
  subsets: ['latin'],
  variable: '--font-body',
});

const fraunces = Fraunces({
  subsets: ['latin'],
  variable: '--font-display',
});

const dmMono = DM_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  weight: ['400', '500'],
});

export default function App({ Component, pageProps }: AppProps) {
  return (
    <div className={`${bricolage.variable} ${fraunces.variable} ${dmMono.variable}`}>
      <Component {...pageProps} />
    </div>
  );
}
