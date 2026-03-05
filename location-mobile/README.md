# Location Tracking App (Expo)

위치 추적 모바일 앱. **React Native + Expo 52**, **pnpm**, **TypeScript**

## Quick start

```bash
pnpm install   # 이미 실행됨
pnpm start     # Expo 개발 서버
```

Expo CLI에서 `a`(Android) 또는 `i`(iOS) 입력.

## 설정

- `.env.example`을 복사해 `.env` 생성 후 `EXPO_PUBLIC_API_BASE_URL` 등 설정.
- 아이콘: `assets/`에 기본 placeholder가 있습니다. 실제 앱 아이콘으로 교체하려면 1024x1024 `icon.png`, `splash-icon.png`, `adaptive-icon.png`, `notification-icon.png` 등을 넣으세요.

## Scripts

| 명령어         | 설명           |
| -------------- | -------------- |
| `pnpm start`   | Expo 개발 서버 |
| `pnpm android` | Android 실행   |
| `pnpm ios`     | iOS 실행       |
| `pnpm lint`    | ESLint         |
| `pnpm test`    | Jest           |
