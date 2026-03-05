import React from 'react';
import { View, Text, StyleSheet, Pressable, Alert } from 'react-native';
import { useLocationTracking } from '../hooks/useLocationTracking';

export function HomeScreen() {
  const { status, error, start, stop } = useLocationTracking();

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
