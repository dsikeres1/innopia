# Innopia 배포 가이드

## 시스템 요구사항

- Python 3.12+
- Node.js 20+
- PostgreSQL 16+

## 프로젝트 구조

```
innopia/
├── ai-pmp-was/     # Flask 백엔드 API
│   ├── was/                     # 애플리케이션 코드
│   ├── alembic/                 # 데이터베이스 마이그레이션
│   └── Makefile                 # 개발 명령어
└── ai-pmp-web/    # Next.js 프론트엔드
    ├── src/                     # 소스 코드
    └── package.json             # NPM 스크립트
```

## 로컬 개발 환경 설정

### 1. 데이터베이스 설정

```bash
cd ai-pmp-was
make dev  # PostgreSQL을 Docker로 실행 (포트 40501)
```

### 2. 백엔드 설정

```bash
cd ai-pmp-was

# Python 가상환경 생성 및 패키지 설치
make setup

# 데이터베이스 마이그레이션 + 테스트 데이터 생성
make dev-reinitialize
```

### 3. 프론트엔드 설정

```bash
cd ai-pmp-web
npm install
```

### 4. 로컬 실행

**터미널 1** - 백엔드 타입 체크 및 코드 생성:
```bash
cd ai-pmp-was
make watch  # 파일 변경 시 자동 타입 체크 + API 클라이언트 생성
```

**터미널 2** - 프론트엔드 URL 자동 생성:
```bash
cd ai-pmp-web
npm run watch  # 파일 변경 시 자동 URL 타입 생성
```

**터미널 3** - 백엔드 서버:
```bash
cd ai-pmp-was
source venv/bin/activate
PORT=5001 python was/main.py
```

**터미널 4** - 프론트엔드 서버:
```bash
cd ai-pmp-web
npm run dev
```

접속: http://localhost:3000

## 환경 변수

### 백엔드 (ai-pmp-was/.env)

```bash
# 로컬 개발용
SQLALCHEMY_DATABASE_URI=postgresql://postgres@localhost:40501/innopia

# 프로덕션용
SQLALCHEMY_DATABASE_URI=postgresql://postgres:password@localhost:5432/innopia
```

### 프론트엔드 (ai-pmp-web/.env)

```bash
# API 서버 주소
NEXT_PUBLIC_API_BASE_URL=http://localhost:5001

# API 지연 시뮬레이션 (개발용, 선택)
NEXT_PUBLIC_API_DELAY=0
```

## 프로덕션 배포 (Dokku)

### 서버 정보

- **서버 IP**: 15.165.179.76
- **SSH 키**: ai-pmp-aws.pem (별도 제공)
- **앱 이름**: ai-pmp

### SSH 설정

`~/.ssh/config` 파일에 추가:

```
Host ai-pmp
  HostName 15.165.179.76
  User ubuntu
  IdentityFile ~/.ssh/ai-pmp-aws.pem
  IdentitiesOnly yes

Host 15.165.179.76
  HostName 15.165.179.76
  User dokku
  IdentityFile ~/.ssh/ai-pmp-aws.pem
  IdentitiesOnly yes
```

키 파일 권한 설정:
```bash
chmod 400 ~/.ssh/ai-pmp-aws.pem
```

### 배포하기

#### 1. Git 리모트 추가

```bash
git remote add dokku dokku@15.165.179.76:ai-pmp
```

#### 2. 배포 실행

```bash
# main 브랜치를 Dokku로 푸시
git push dokku main
```

### 서버 관리 명령어

```bash
# 서버 접속
ssh ai-pmp

# 앱 재시작
dokku ps:restart ai-pmp

# 로그 확인
dokku logs ai-pmp --tail

# 환경 변수 확인
dokku config ai-pmp
