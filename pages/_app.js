import '@/styles/globals.css';
import { Manrope } from 'next/font/google';

const manrope = Manrope({
  subsets: ['latin'],
  variable: '--font-sans',
});

export default function App({ Component, pageProps }) {
  return (
    <div className={manrope.variable}>
      <Component {...pageProps} />
    </div>
  );
}
