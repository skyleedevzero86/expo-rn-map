import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, Pressable, Alert } from 'react-native';
import { useLocationTracking } from '../hooks/useLocationTracking';

declare const process: { env?: { EXPO_PUBLIC_API_BASE_URL?: string } };

function getApiBaseDisplay(): string {
  const url = process.env?.EXPO_PUBLIC_API_BASE_URL;
  if (url && typeof url === 'string') {
    const t = url.trim().replace(/\/+$/, '');
    return t || 'http://localhost:8080';
  }
  return 'http://localhost:8080';
}

function getApiHint(connectionOk: boolean | null): string {
  const base = getApiBaseDisplay();
  if (base.indexOf('localhost') !== -1) {
    return '실기기: .env에 EXPO_PUBLIC_API_BASE_URL=http://PC IP:8080 설정 후 앱 재시작.';
  }
  if (connectionOk === true) return '서버 연결됨';
  if (connectionOk === false) return '연결 실패. start:tunnel 쓰는 중이면 pnpm run tunnel:api 후 .env에 https 주소 넣기.';
  const isLan = base.startsWith('http://192.168.') || base.startsWith('http://10.');
  if (isLan) return 'start:tunnel로 앱 열었으면 API도 터널 필요 → tunnel:api 후 .env에 https 넣기.';
  return '아래 연결 테스트로 확인.';
}

export function HomeScreen() {
  const { status, error, start, stop } = useLocationTracking();
  const [connectionOk, setConnectionOk] = useState<boolean | null>(null);
  const [testing, setTesting] = useState(false);
  const apiHint = getApiHint(connectionOk);
  const apiBase = getApiBaseDisplay();

  const testConnection = useCallback(async () => {
    const base = getApiBaseDisplay();
    if (base.indexOf('localhost') !== -1) {
      Alert.alert('연결 테스트', '실기기: .env에 EXPO_PUBLIC_API_BASE_URL=http://PC IP:8080 설정 후 앱 재시작.');
      return;
    }
    setTesting(true);
    setConnectionOk(null);
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);
    try {
      const res = await fetch(`${base}/api/health`, { method: 'GET', signal: controller.signal });
      clearTimeout(timeoutId);
      if (res.ok) {
        setConnectionOk(true);
      } else {
        setConnectionOk(false);
      }
    } catch (e) {
      clearTimeout(timeoutId);
      setConnectionOk(false);
      const msg = e instanceof Error ? e.message : String(e);
      Alert.alert(
        '연결 실패',
        `지금 start:tunnel로 앱 띄웠으면 192.168.x.x는 휴대폰에서 접속 불가.\n\n해결: 터미널에서 "pnpm run tunnel:api" 실행 → 나온 https://xxx.ngrok.io 를 .env에 EXPO_PUBLIC_API_BASE_URL=https://xxx.ngrok.io 로 넣고 → 앱 완전 종료 후 다시 실행.\n\n${msg}`
      );
    } finally {
      setTesting(false);
    }
  }, []);

  const handleStart = () => {
    start().catch((e) => {
      const message = e instanceof Error ? e.message : '위치 추적 서비스를 시작할 수 없습니다.';
      Alert.alert('오류', message);
    });
  };

  const handleStop = () => {
    stop();
  };

  const isActive = status === 'active';
  const isBusy = status === 'starting' || status === 'stopping';

  return (
    <View style={styles.container}>
      <Text style={styles.title}>위치 추적</Text>

      <Text style={styles.apiHint}>{apiHint}</Text>
      <Text style={styles.apiUrl}>연결 주소: {apiBase}</Text>

      <Pressable
        style={[styles.button, styles.buttonSecondary, testing && styles.buttonDisabled]}
        onPress={testConnection}
        disabled={testing}
      >
        <Text style={styles.buttonText}>{testing ? '연결 확인 중...' : '연결 테스트'}</Text>
      </Pressable>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <Pressable
        style={[styles.button, (isActive || isBusy) && styles.buttonDisabled]}
        onPress={handleStart}
        disabled={isActive || isBusy}
      >
        <Text style={styles.buttonText}>위치 추적 서비스 시작</Text>
      </Pressable>

      <Pressable
        style={[styles.button, styles.buttonStop, !isActive && styles.buttonDisabled]}
        onPress={handleStop}
        disabled={!isActive || isBusy}
      >
        <Text style={styles.buttonText}>위치 추적 서비스 종료</Text>
      </Pressable>

      {status === 'starting' && (
        <Text style={styles.hint}>위치 추적 시작 중...</Text>
      )}
      {status === 'active' && (
        <Text style={styles.hint}>위치 추적 중. 웹에서 보낸 메시지는 팝업으로 표시됩니다.</Text>
      )}
      <Text style={styles.footHint}>Expo Go에서는 알림 배너 제한. 전체 알림은 npx expo run:android (개발 빌드) 사용.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 24,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 22,
    fontWeight: '600',
    marginBottom: 24,
    textAlign: 'center',
  },
  apiHint: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
    textAlign: 'center',
    paddingHorizontal: 16,
  },
  apiUrl: {
    fontSize: 11,
    color: '#999',
    marginBottom: 16,
    textAlign: 'center',
    paddingHorizontal: 16,
  },
  error: {
    color: '#c00',
    marginBottom: 12,
    textAlign: 'center',
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 16,
    borderRadius: 10,
    marginBottom: 12,
  },
  buttonSecondary: {
    backgroundColor: '#5856D6',
  },
  buttonStop: {
    backgroundColor: '#FF3B30',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    textAlign: 'center',
  },
  hint: {
    marginTop: 16,
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  footHint: {
    marginTop: 24,
    fontSize: 11,
    color: '#999',
    textAlign: 'center',
    paddingHorizontal: 16,
  },
});
