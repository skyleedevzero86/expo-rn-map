import React from 'react';
import { View, Text, StyleSheet, Pressable, Alert } from 'react-native';
import { useLocationTracking } from '../hooks/useLocationTracking';

declare const process: { env?: { EXPO_PUBLIC_API_BASE_URL?: string } };

function getApiHint(): string {
  const url = process.env?.EXPO_PUBLIC_API_BASE_URL;
  if (url && typeof url === 'string' && url.trim() !== '' && url.indexOf('localhost') === -1) {
    return '서버 연결됨';
  }
  return '실기기: .env에 EXPO_PUBLIC_API_BASE_URL=http://PC IP:8080 설정 후 앱을 완전 종료했다가 다시 실행하세요. (핫 리로드만으로는 반영 안 됨)';
}

function getApiBaseDisplay(): string {
  const url = process.env?.EXPO_PUBLIC_API_BASE_URL;
  if (url && typeof url === 'string') {
    const t = url.trim().replace(/\/+$/, '');
    return t || 'http://localhost:8080';
  }
  return 'http://localhost:8080';
}

export function HomeScreen() {
  const { status, error, start, stop } = useLocationTracking();
  const apiHint = getApiHint();
  const apiBase = getApiBaseDisplay();

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
        <Text style={styles.hint}>위치 추적 중입니다. 메시지는 알림으로 표시됩니다.</Text>
      )}
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
});
