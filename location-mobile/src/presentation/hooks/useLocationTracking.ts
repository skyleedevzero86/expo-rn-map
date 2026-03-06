import { useState, useCallback } from 'react';
import { Alert } from 'react-native';
import { startLocationTracking, stopLocationTracking } from '@application/composition/useCases';

type TrackingStatus = 'idle' | 'starting' | 'active' | 'stopping' | 'error';

export function useLocationTracking() {
  const [status, setStatus] = useState<TrackingStatus>('idle');
  const [error, setError] = useState<string | null>(null);

  const start = useCallback(async () => {
    setError(null);
    setStatus('starting');
    try {
      await startLocationTracking({
        onUploadError: (err) => {
          setError(err.message);
          Alert.alert('위치 전송 실패', err.message);
        },
      });
      setStatus('active');
    } catch (e) {
      const message = e instanceof Error ? e.message : '시작할 수 없습니다.';
      setError(message);
      setStatus('error');
    }
  }, []);

  const stop = useCallback(() => {
    setStatus('stopping');
    setError(null);
    try {
      stopLocationTracking();
    } catch (e) {
      setError(e instanceof Error ? e.message : '종료 중 오류가 발생했습니다.');
    } finally {
      setStatus('idle');
    }
  }, []);

  return { status, error, start, stop };
}
