import { useEffect, useRef } from 'react';
import { getMessageApi } from '@application/composition/useCases';
import { showUnreadMessagesOneByOne } from '../utils/messageAlerts';

const POLL_INTERVAL_MS = 15_000;

export function useUnreadMessagePolling(): void {
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    function poll() {
      getMessageApi()
        .getUnreadMessages()
        .then((res) => {
          if (!res?.message?.length) return;
          showUnreadMessagesOneByOne(Array.from(res.message));
        })
        .catch(() => {});
    }

    poll();
    intervalRef.current = setInterval(poll, POLL_INTERVAL_MS);
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, []);
}
