import dynamic from 'next/dynamic';

const KrakenClient = dynamic(() => import('./KrakenClient'), { ssr: false });

export default function Home() {
  return <KrakenClient />;
}
