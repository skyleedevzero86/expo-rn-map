import type { ILocationService } from '../ports/ILocationService';
import type { IMessageApi } from '../ports/IMessageApi';
import type { INotificationService } from '../ports/INotificationService';

export interface StartLocationTrackingOptions {

  onUploadError?: (error: Error) => void;
}

function toError(value: unknown): Error {
  if (value instanceof Error) return value;
  if (value != null && typeof value === 'object' && 'message' in value && typeof (value as { message: unknown }).message === 'string') {
    return new Error((value as { message: string }).message);
  }
  return new Error(String(value));
}

export function createStartLocationTracking(
  locationService: ILocationService,
  messageApi: IMessageApi,
  notificationService: INotificationService
) {
  return async function startLocationTracking(options?: StartLocationTrackingOptions): Promise<void> {
    const onUploadError = options?.onUploadError;

  
    let granted: boolean;
    try {
      granted = await notificationService.requestPermission();
    } catch (e) {
      const err = toError(e);
      throw new Error(`알림 권한 요청 실패: ${err.message}`);
    }
    if (!granted) {
      throw new Error('알림 권한이 필요합니다. 설정에서 알림을 허용해 주세요.');
    }


    try {
      await locationService.startWatching(async (coords) => {
       
        let messages;
        try {
          messages = await messageApi.uploadLocationAndGetMessages(coords);
        } catch (e) {
          onUploadError?.(toError(e));
          return;
        }
        if (!messages?.message?.length) return;

        
        let notificationErrorReported = false;
        for (const message of messages.message) {
          try {
            await notificationService.showMessageNotification(message);
          } catch (e) {
            if (!notificationErrorReported) {
              notificationErrorReported = true;
              onUploadError?.(new Error('메시지 알림 표시에 실패했습니다.'));
            }
          }
        }
      });
    } catch (e) {
      const err = toError(e);
      if (err.message.indexOf('권한') !== -1 || err.message.indexOf('permission') !== -1) throw err;
      throw new Error(`위치 추적 시작 실패: ${err.message}`);
    }
  };
}
