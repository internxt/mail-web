import { useEffect, useState } from 'react';

const TOTAL_STEPS = 20;
const STEP_INTERVAL_MS = 100;

export interface AppLoaderAnimation {
  isFlapOpen: boolean;
  filesOut: boolean;
}
export const useAppLoaderAnimation = (): AppLoaderAnimation => {
  const [step, setStep] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setStep((steps) => (steps >= TOTAL_STEPS ? 0 : steps + 1));
    }, STEP_INTERVAL_MS);
    return () => clearInterval(interval);
  }, []);

  return {
    isFlapOpen: step >= 2 && step <= 17,
    filesOut: step >= 5 && step <= 15,
  };
};
