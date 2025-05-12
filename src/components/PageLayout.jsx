'use client';

import Link from 'next/link';

export default function PageLayout({ title, children }) {
  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <nav className="bg-blue-700 text-white p-4">
        <ul className="flex space-x-4">
          <li><Link href="/">Home</Link></li>
          <li><Link href="/heatmap">Heatmap</Link></li>
          <li><Link href="/trend">Trend Line</Link></li>
        </ul>
      </nav>

      <main className="p-6 max-w-5xl mx-auto">
        <h1 className="text-3xl font-bold mb-4">{title}</h1>
        {children}
      </main>
    </div>
  );
}
