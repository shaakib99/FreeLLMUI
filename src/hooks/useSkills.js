// Hook that loads the skills once on mount and caches them in component state.
// It also exposes loading / error status for better UX.
import { useEffect, useState } from 'react';
import { loadAllSkills } from '../agent/skills/loadSkills';

export function useSkills() {
  const [skills, setSkills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false; // for race‑condition safety

    loadAllSkills()
      .then(list => {
        if (!cancelled) {
          setSkills(list);
          setLoading(false);
        }
      })
      .catch(err => {
        if (!cancelled) {
          setError(err);
          setLoading(false);
        }
      });

    return () => {
      cancelled = true; // clean‑up in case component unmounts quickly
    };
  }, []);

  return { skills, loading, error };
}