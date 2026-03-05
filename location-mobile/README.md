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

| 명령어              | 설명                          |
| ------------------- | ----------------------------- |
| `pnpm start`        | Expo 개발 서버 (포트 9080)    |
| `pnpm android`      | Android 실행                  |
| `pnpm start:android`| adb reverse 후 Android 실행  |
| `pnpm adb-reverse`  | 에뮬레이터 ↔ PC 9080 포트 연결 |
| `pnpm ios`          | iOS 실행                      |
| `pnpm lint`         | ESLint                        |
| `pnpm test`         | Jest                          |

## 에뮬레이터에서 앱이 안 뜰 때 (Troubleshooting)

**1. adb reverse (가장 흔한 원인)**  
에뮬레이터가 `exp://PC_IP:9080`에 접속하지 못하면 흰 화면/로드 실패가 납니다.

```bash
pnpm adb-reverse
```

또는 한 번에: `pnpm start:android`

**2. Expo Go 재설치**  
SDK와 Expo Go 버전이 안 맞으면:

```bash
adb uninstall host.exp.exponent
pnpm start --clear
# 터미널에서 a 눌러 에뮬레이터에서 다시 설치
```

**3. Metro 캐시 초기화**

```bash
pnpm start -- --clear
```

**4. 방화벽**  
Windows 방화벽에서 Node.js 인바운드(포트 9080) 허용.

**5. `device 'emulator-5554' not found` / Expo Go 재설치 실패**  
Expo가 기기에서 Expo Go를 재설치하려다 adb가 기기를 못 찾을 때 납니다.

- **Expo Go 재설치 물어보면 `no` 입력** → 기존 Expo Go로 계속 사용 (가장 간단).
- 그래도 안 되면:
  ```bash
  adb kill-server
  adb start-server
  adb devices   # 에뮬레이터가 보이는지 확인
  ```
  에뮬레이터가 완전히 부팅된 뒤에 `pnpm start:android` 다시 실행.

**6. Port 9080 is being used**  
다른 터미널에서 이미 Expo/Metro가 떠 있으면 9080이 사용 중입니다.  
기존 프로세스를 종료하거나, 물어보면 9081 사용해도 됨 (그때는 `pnpm adb-reverse` 후 에뮬레이터에서 `exp://PC_IP:9081`로 열기).
