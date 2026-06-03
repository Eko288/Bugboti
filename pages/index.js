// pages/index.js
import { useState } from 'react';

export default function Home() {
  const [target, setTarget] = useState('');
  const [results, setResults] = useState(null);
  const scan = async () => {
    const res = await fetch(`/api/scan?target=${encodeURIComponent(target)}`);
    const data = await res.json();
    setResults(data);
  };
  return (
    <div>
      <h1>Web Vulnerability Scanner</h1>
      <input value={target} onChange={e => setTarget(e.target.value)} placeholder="https://example.com" />
      <button onClick={scan}>Scan</button>
      {results && (
        <div>
          {results.map((r, i) => (
            <div key={i}>
              <h3>{r.vulnerability}</h3>
              <p><strong>Exploitation:</strong> {r.exploitation}</p>
              <p><strong>Fix:</strong> {r.fix}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
