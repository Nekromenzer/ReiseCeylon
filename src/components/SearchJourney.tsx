'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export function SearchJourney() {
  const [where, setWhere] = useState('Ella & the hill country');
  const router = useRouter();
  const routes: Record<string, string> = {
    'Ella & the hill country': 'ella',
    'Sigiriya & ancient cities': 'sigiriya-rock-fortress',
    'Mirissa & the south coast': 'mirissa-beach',
    'Yala & the wild south': 'yala-national-park'
  };

  return (
    <form className="search-card" onSubmit={(event) => { event.preventDefault(); router.push(`/destinations/${routes[where]}`); }}>
      <label>
        <span>Where to?</span>
        <select value={where} onChange={(event) => setWhere(event.target.value)}>
          <option>Ella & the hill country</option>
          <option>Sigiriya & ancient cities</option>
          <option>Mirissa & the south coast</option>
          <option>Yala & the wild south</option>
        </select>
      </label>
      <label>
        <span>When?</span>
        <input type="text" placeholder="Choose your season" />
      </label>
      <label>
        <span>Travellers</span>
        <select defaultValue="2 travellers"><option>2 travellers</option><option>Solo traveller</option><option>3–5 travellers</option><option>6+ travellers</option></select>
      </label>
      <button type="submit">Explore <span>↗</span></button>
    </form>
  );
}
