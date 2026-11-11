
'use client';

import { useState } from 'react';

const courses = [
  { id: 1, name: 'NEET 2027 Classroom Programme', centre: 'Aakash Learning Hub', category: 'NEET', area: 'Salt Lake', fee: 7200, seats: 8, rating: 4.8 },
  { id: 2, name: 'JEE Main + Advanced', centre: 'Prime JEE Academy', category: 'JEE', area: 'Ballygunge', fee: 8500, seats: 5, rating: 4.7 },
  { id: 3, name: 'CAT 2027 Preparation', centre: 'CareerEdge Institute', category: 'CAT', area: 'Park Street', fee: 5500, seats: 14, rating: 4.6 },
  { id: 4, name: 'CBSE Class 10 Maths & Science', centre: 'Bright Future Classes', category: 'K-12', area: 'New Town', fee: 3200, seats: 11, rating: 4.9 },
  { id: 5, name: 'CLAT 2027 Preparation', centre: 'Lexicon Law Prep', category: 'CLAT', area: 'Gariahat', fee: 4800, seats: 9, rating: 4.5 },
  { id: 6, name: 'GATE Computer Science', centre: 'GateCraft Academy', category: 'GATE', area: 'Sector V', fee: 6200, seats: 6, rating: 4.7 }
];

export default function Home() {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const [booking, setBooking] = useState<number[]>([]);
  const [page, setPage] = useState('Discover');

  const filtered = courses.filter(c =>
    (category === 'All' || c.category === category) &&
    (c.name + c.centre + c.area).toLowerCase().includes(search.toLowerCase())
  );

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <header className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto p-4 flex justify-between items-center">
          <h1 className="text-2xl font-black text-blue-700">ClassOrbit</h1>
          <span className="text-sm font-semibold">Learn. Choose. Grow.</span>
        </div>
        <nav className="flex gap-2 px-4 pb-3 overflow-x-auto max-w-7xl mx-auto">
          {['Discover', 'My Bookings', 'For Centres', 'Admin'].map(p =>
            <button key={p} onClick={() => setPage(p)}
              className={`px-4 py-2 rounded-xl text-sm font-bold whitespace-nowrap ${page === p ? 'bg-blue-600 text-white' : 'bg-slate-100'}`}>
              {p}
            </button>
          )}
        </nav>
      </header>

      <div className="max-w-7xl mx-auto p-4 md:p-8">
        {page === 'Discover' && <>
          <section className="rounded-3xl bg-slate-900 text-white p-7 md:p-12">
            <p className="text-blue-300 font-bold mb-3">INDIA'S COACHING MARKETPLACE</p>
            <h2 className="text-3xl md:text-5xl font-black leading-tight">
              Find the right coaching. Book your future.
            </h2>
            <p className="mt-4 text-slate-300">Discover institutes, compare courses and reserve your seat.</p>
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search courses, exams or institutes..."
              className="mt-7 w-full rounded-xl p-4 text-slate-900 outline-none" />
          </section>

          <section className="mt-8">
            <h2 className="text-2xl font-black mb-4">Explore Categories</h2>
            <div className="flex gap-2 overflow-x-auto pb-3">
              {['All', 'K-12', 'NEET', 'JEE', 'CAT', 'CLAT', 'GATE'].map(c =>
                <button key={c} onClick={() => setCategory(c)}
                  className={`px-5 py-2 rounded-full font-bold ${category === c ? 'bg-blue-600 text-white' : 'bg-white border'}`}>
                  {c}
                </button>
              )}
            </div>
          </section>

          <section className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map(c =>
              <article key={c.id} className="bg-white rounded-2xl border p-5 shadow-sm">
                <div className="flex justify-between">
                  <span className="bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-xs font-bold">{c.category}</span>
                  <span className="text-amber-600 font-bold">★ {c.rating}</span>
                </div>
                <h3 className="text-lg font-black mt-4">{c.name}</h3>
                <p className="text-sm text-slate-500 mt-2">{c.centre}</p>
                <p className="text-sm text-slate-500 mt-1">{c.area}, Kolkata</p>
                <div className="border-t mt-5 pt-4">
                  <p className="text-sm text-slate-500">Monthly fee</p>
                  <p className="text-2xl font-black">₹{c.fee.toLocaleString('en-IN')}</p>
                  <p className="text-sm text-green-700 mt-2">{c.seats} seats available</p>
                  <p className="text-sm mt-1">Minimum booking: 6 months</p>
                  <p className="font-bold mt-2">Total: ₹{(c.fee * 6).toLocaleString('en-IN')}</p>
                  <button onClick={() => setBooking(old => [...old, c.id])}
                    className="mt-4 w-full bg-blue-600 text-white rounded-xl p-3 font-bold">
                    {booking.includes(c.id) ? 'Request Submitted' : 'Book Your Seat'}
                  </button>
                </div>
              </article>
            )}
          </section>
        </>}

        {page === 'My Bookings' && <>
          <h2 className="text-3xl font-black">My Bookings</h2>
          <div className="mt-6 space-y-4">
            {booking.length === 0 && <p>No bookings yet. Explore courses first.</p>}
            {booking.map((id, i) => {
              const c = courses.find(x => x.id === id)!;
              return <div key={i} className="bg-white rounded-xl p-5 border">
                <h3 className="font-bold">{c.name}</h3>
                <p className="text-sm text-slate-500">{c.centre}</p>
                <p className="mt-2 text-green-700 font-bold">Booking request pending</p>
              </div>;
            })}
          </div>
        </>}

        {page === 'For Centres' && <>
          <h2 className="text-3xl font-black">Coaching Partner Portal</h2>
          <p className="mt-3 text-slate-600">Manage your courses and student bookings.</p>
          <div className="grid sm:grid-cols-3 gap-4 mt-6">
            {['Add Courses', 'Manage Batches', 'Update Seat Availability'].map(x =>
              <div key={x} className="bg-white border rounded-xl p-6 font-bold">{x}</div>
            )}
          </div>
          <p className="mt-5 text-sm text-slate-500">Partner registration and database integration will be added in the next development phase.</p>
        </>}

        {page === 'Admin' && <>
          <h2 className="text-3xl font-black">Platform Admin</h2>
          <div className="grid sm:grid-cols-3 gap-4 mt-6">
            {[
              ['Demo Centres', '350'],
              ['Demo Bookings', '1,240'],
              ['Commission Rate', '15%']
            ].map(([a,b]) =>
              <div key={a} className="bg-white border rounded-xl p-6">
                <p className="text-slate-500">{a}</p>
                <p className="text-3xl font-black mt-2">{b}</p>
              </div>
            )}
          </div>
        </>}
      </div>

      <footer className="text-center text-sm text-slate-400 p-8">
        © 2026 ClassOrbit. All rights reserved.
      </footer>
    </main>
  );
                                                                 }
