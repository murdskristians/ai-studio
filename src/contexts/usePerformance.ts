import { useContext } from 'react';
import { PerformanceContext } from './PerformanceContextDef';

export function usePerformance() {
  const context = useContext(PerformanceContext);
  if (!context) {
    throw new Error('usePerformance must be used within a PerformanceProvider');
  }
  return context;
}
