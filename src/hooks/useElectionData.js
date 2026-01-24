import { useState, useEffect, useRef } from 'react';

const cache = {};

export function useElectionData(raceType = 'presidential') {
  const [nationalData, setNationalData] = useState(null);
  const [stateData, setStateData] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const loadingStates = useRef(new Set());

  useEffect(() => {
    const cacheKey = `national_${raceType}`;
    if (cache[cacheKey]) {
      setNationalData(cache[cacheKey]);
      setLoading(false);
      return;
    }

    setLoading(true);
    fetch(`/data/results/${raceType}/national.json`)
      .then((res) => {
        if (!res.ok) throw new Error(`Failed to load national data: ${res.status}`);
        return res.json();
      })
      .then((data) => {
        cache[cacheKey] = data;
        setNationalData(data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, [raceType]);

  const loadStateData = (stateAbbr) => {
    const cacheKey = `${raceType}_${stateAbbr}`;
    if (cache[cacheKey]) {
      setStateData((prev) => ({ ...prev, [stateAbbr]: cache[cacheKey] }));
      return;
    }
    if (loadingStates.current.has(cacheKey)) return;
    loadingStates.current.add(cacheKey);

    fetch(`/data/results/${raceType}/states/${stateAbbr}.json`)
      .then((res) => {
        if (!res.ok) throw new Error(`Failed to load ${stateAbbr} data`);
        return res.json();
      })
      .then((data) => {
        cache[cacheKey] = data;
        setStateData((prev) => ({ ...prev, [stateAbbr]: data }));
        loadingStates.current.delete(cacheKey);
      })
      .catch(() => {
        loadingStates.current.delete(cacheKey);
      });
  };

  return { nationalData, stateData, loading, error, loadStateData };
}
