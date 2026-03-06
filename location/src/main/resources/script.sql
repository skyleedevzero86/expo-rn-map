-- =============================================================================
-- finsight DB 스키마 (application.yml의 spring.datasource.url과 동일 DB 사용)
-- 10만 명 동시 접속 가정: PK BIGINT, 인덱스 최소화·조회 패턴 기준 설계

-- 조인: message.location_no = location.no (메시지 발송 위치)
-- 예) SELECT m.*, l.latitude, l.longitude FROM message m LEFT JOIN location l ON m.location_no = l.no;
-- =============================================================================

use finsight;

-- -----------------------------------------------------------------------------
-- location: 사용자/디바이스 위치 이력 (INSERT 다수, 최근 N건 조회 위주)
-- 10만 동시 접속 시 row 수 급증 → no는 BIGINT (INT 한도 초과 방지)
-- -----------------------------------------------------------------------------
create table if not exists location (
    no bigint primary key auto_increment comment 'PK, 자동 증가',
    latitude double not null comment '위도 (-90 ~ 90)',
    longitude double not null comment '경도 (-180 ~ 180)',
    upload_date datetime not null comment '업로드 시각, 최근순 조회·인덱스 사용',
    source varchar(20) null comment 'web | mobile — PC 갱신 vs 모바일 갱신'
) engine=InnoDB default charset=utf8mb4 comment '위치 좌표 저장 (동시 접속 대량 INSERT 대비)';


-- 최근순 목록/지도 마커 조회용 (ORDER BY upload_date DESC LIMIT N)
create index idx_location_upload_date on location (upload_date desc);
-- 좌표 범위/지도 영역 조회용 (선택)
create index idx_location_coords on location (latitude, longitude);

-- 기존 DB에 source 컬럼 없을 때만 실행 (신규 설치 시 create table에 이미 있으면 주석 처리)
ALTER TABLE location ADD COLUMN source varchar(20) NULL COMMENT 'web | mobile' AFTER upload_date;

-- -----------------------------------------------------------------------------
-- message: 메시지 (발신자, 본문, 발송 시각, 상태, 위치 FK)
-- location_no로 location 테이블과 조인 → "이 메시지를 보낸 위치"
-- -----------------------------------------------------------------------------
create table if not exists message (
    no bigint primary key auto_increment comment 'PK, 자동 증가',
    sender varchar(1000) comment '발신자 식별(닉네임/ID 등)',
    message varchar(5000) comment '메시지 본문',
    send_date datetime not null comment '발송 시각',
    status int not null comment '0:UNREAD 1:READ',
    location_no bigint null comment 'FK, 발송 시 위치 (location.no와 조인)',
    constraint fk_message_location foreign key (location_no) references location (no) on delete set null
) engine=InnoDB default charset=utf8mb4 comment '메시지 저장 (동시 접속 대비)';

-- 최근순 목록/페이징 조회용
create index idx_message_send_date on message (send_date desc);
-- 상태별 필터/대시보드용
create index idx_message_status on message (status);
-- 위치 조인용
create index idx_message_location_no on message (location_no);

-- =============================================================================
-- 더미 데이터 (개발/테스트용, 10만 명 시나리오 참고용)
-- =============================================================================

insert into location (latitude, longitude, upload_date, source) values
    (37.5665, 126.9780, date_sub(now(), interval 1 minute), 'web'),
    (37.5666, 126.9782, date_sub(now(), interval 2 minute), 'web'),
    (37.5667, 126.9784, date_sub(now(), interval 3 minute), 'web'),
    (37.5668, 126.9786, date_sub(now(), interval 5 minute), 'web'),
    (37.5670, 126.9790, date_sub(now(), interval 10 minute), 'web'),
    (37.5672, 126.9792, date_sub(now(), interval 15 minute), 'web'),
    (37.5675, 126.9795, date_sub(now(), interval 20 minute), 'web'),
    (37.5680, 126.9800, date_sub(now(), interval 30 minute), 'web'),
    (37.5685, 126.9805, date_sub(now(), interval 1 hour), 'web'),
    (37.5690, 126.9810, date_sub(now(), interval 2 hour), 'web'),
    (37.5700, 126.9820, date_sub(now(), interval 3 hour), 'web'),
    (37.5710, 126.9830, date_sub(now(), interval 6 hour), 'web'),
    (37.5720, 126.9840, date_sub(now(), interval 12 hour), 'web'),
    (37.5730, 126.9850, date_sub(now(), interval 1 day), 'web'),
    (37.5740, 126.9860, date_sub(now(), interval 2 day), 'web'),
    (37.5750, 126.9870, date_sub(now(), interval 3 day), 'web'),
    (37.5760, 126.9880, date_sub(now(), interval 5 day), 'web'),
    (37.5770, 126.9890, date_sub(now(), interval 7 day), 'web'),
    (37.5780, 126.9900, date_sub(now(), interval 14 day), 'web'),
    (37.5790, 126.9910, date_sub(now(), interval 30 day), 'web');

-- message.location_no ↔ location.no 로 조인 (예: 메시지가 발송된 위치)
insert into message (sender, message, send_date, status, location_no) values
    ('user_001', '첫 번째 테스트 메시지입니다.', date_sub(now(), interval 1 minute), 1, 1),
    ('user_002', '안녕하세요, 위치 공유 확인해 주세요.', date_sub(now(), interval 2 minute), 1, 2),
    ('user_003', '도착했습니다.', date_sub(now(), interval 5 minute), 1, 3),
    ('user_004', '곧 도착할 예정이에요.', date_sub(now(), interval 10 minute), 1, 4),
    ('user_005', '주변 맛집 추천 부탁드려요.', date_sub(now(), interval 15 minute), 1, 5),
    ('user_006', '날씨 좋네요!', date_sub(now(), interval 20 minute), 1, 6),
    ('user_007', '비 오기 전에 와주세요.', date_sub(now(), interval 30 minute), 0, 7),
    ('user_008', '예약 확인했습니다.', date_sub(now(), interval 1 hour), 1, 8),
    ('user_009', '늦을 것 같아요.', date_sub(now(), interval 2 hour), 1, 9),
    ('user_010', '여기서 만나요.', date_sub(now(), interval 3 hour), 1, 10),
    ('user_011', '메시지 전송 실패 테스트', date_sub(now(), interval 5 minute), 0, 11),
    ('user_012', '대기 중인 메시지', date_sub(now(), interval 1 minute), 0, 12);
