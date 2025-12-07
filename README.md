# Frontend (React) - 좌석/회의실 예약 시스템

이 폴더는 React(CRA: react-scripts) 기반 프론트엔드입니다.
회의실 예약 / 노트북 열람실 좌석 예약 / 내 예약 조회(데모) 화면을 제공합니다.

프론트는 아래 API 경로들을 호출합니다.
백엔드 개발자는 이 문서의 API 스펙을 그대로 구현하면 프론트가 바로 동작합니다.

------------------------------------------------------------
1. 실행 방법
------------------------------------------------------------

1) 폴더 이동
cd frontend

2) 의존성 설치
npm install

3) 개발 서버 실행
npm start

접속
http://localhost:3000

개발 환경에서 프론트는 package.json의 proxy 설정을 이용합니다.
프록시가 설정되어 있으면, 프론트에서 /api 로 시작하는 호출은 자동으로 백엔드로 전달됩니다.

package.json (frontend)
"proxy": "http://localhost:8080"

즉, 백엔드는 기본적으로 아래에서 실행 중이어야 합니다.
http://localhost:8080

------------------------------------------------------------
2. 공통 규칙(프론트가 기대하는 입력/검증)
------------------------------------------------------------

2.1 학번(studentId) 규칙(하드코딩 인증)
- "202099999", "202288888" 는 잘못된 학번으로 처리되어야 함 (유효하지 않음)
- 그 외 9자리 정수 문자열은 모두 유효한 학번으로 가정
- 프론트는 요청 바디/쿼리에 studentId를 그대로 전달하며, 백엔드도 동일 규칙으로 검증하면 됨

2.2 시간/날짜 포맷
- date: YYYY-MM-DD (예: 2025-12-10)
- startTime/endTime: HH:mm (예: 09:00)
- 프론트는 시간 비교를 위해 문자열을 HH:mm으로 사용하며, 서버는 동일 포맷을 반환하는 것을 권장

2.3 운영 시간
- 운영 시간: 09:00 ~ 18:00
- 회의실: 1시간 단위, 최대 2시간
- 좌석: 2시간 단위, 최대 4시간
- 프론트에서도 기본 검증하지만, 백엔드에서 최종 검증/에러 처리가 필요

2.4 에러 응답 형태(중요)
프론트는 axios 에러에서 아래 경로로 메시지를 읽습니다.
e.response.data.message

따라서 백엔드는 에러 상황에서 다음 형태로 내려주면 프론트에 그대로 표시됩니다.

예:
HTTP 400
{
  "message": "예약 가능한 좌석이 없습니다."
}

성공 메시지도 동일하게 message를 내려주면 프론트가 그대로 노출합니다.

예:
HTTP 200
{
  "message": "예약 완료"
}

------------------------------------------------------------
3. 라우팅(프론트 페이지 경로)
------------------------------------------------------------

- /                 : HomePage
- /meeting          : MeetingMainPage (회의실 예약)
- /seat             : SeatMainPage (좌석 예약)
- /my               : MyReservationsPage (데모/하드코딩)

------------------------------------------------------------
4. 백엔드 API 명세(프론트가 호출하는 전체 목록)
------------------------------------------------------------

Base URL(개발 기준): http://localhost:8080
프론트 호출은 /api 로 시작하며, proxy를 통해 Base URL로 전달됩니다.

------------------------------------------------------------
4.1 회의실 예약 API
------------------------------------------------------------

A) 회의실 예약 현황 조회(일정표)
요청
- Method: GET
- Path: /api/meeting/reservations
- Query:
  - date (필수): YYYY-MM-DD

예시
GET /api/meeting/reservations?date=2025-12-10

응답(권장)
- HTTP 200
- Body: Reservation 배열

Reservation 필드(프론트가 사용하는 최소 필드)
- id: number
- roomId: number (1~3)
- date: string (YYYY-MM-DD)
- startTime: string (HH:mm 또는 HH:mm:ss여도 프론트는 앞 5글자만 사용)
- endTime: string (HH:mm 또는 HH:mm:ss)
- leaderStudentId: string

예시 응답
[
  {
    "id": 10,
    "roomId": 1,
    "date": "2025-12-10",
    "startTime": "09:00",
    "endTime": "11:00",
    "leaderStudentId": "202100001"
  }
]

B) 내 회의실 예약 조회(학번 기준)
요청
- Method: GET
- Path: /api/meeting/reservations
- Query:
  - studentId (필수): 9자리 문자열

예시
GET /api/meeting/reservations?studentId=202100001

응답
- HTTP 200
- Body: Reservation 배열 (위와 동일 스키마)

주의
- 위 A와 B는 같은 엔드포인트를 쿼리 파라미터로 구분합니다.
- 백엔드는 date 또는 studentId 중 하나로 필터링해서 내려주면 됩니다.
- 둘 다 들어오면 AND 조건으로 처리하거나 400으로 처리해도 되지만, 프론트는 현재 둘 중 하나만 보냅니다.

C) 회의실 예약 생성
요청
- Method: POST
- Path: /api/meeting/reservations
- Content-Type: application/json
- Body:
  - roomId: number (1~3)
  - date: string (YYYY-MM-DD)
  - startTime: string (HH:mm)
  - durationHours: number (1 또는 2)
  - leaderStudentId: string (대표자 학번)
  - participantStudentIds: string[] (대표자 포함 최소 3명, 중복 제거 권장)

예시 요청
POST /api/meeting/reservations
{
  "roomId": 1,
  "date": "2025-12-10",
  "startTime": "09:00",
  "durationHours": 2,
  "leaderStudentId": "202100001",
  "participantStudentIds": ["202100001", "202100010", "202100011"]
}

백엔드 검증 요구(권장)
- 운영시간(09:00~18:00) 범위 내
- durationHours는 1 또는 2
- roomId는 1~3
- participantStudentIds는 대표자를 포함하며, 유니크 기준 3명 이상
- 동일 회의실/시간대 중복 예약 금지
- (선택) 개인별 예약 시간 한도(일/주) 등 추가 정책은 백엔드에서 처리하고 message로 안내

응답(권장)
- HTTP 200 또는 201
- Body: { message: string } 또는 생성된 Reservation
프론트는 message가 있으면 노출합니다.

예시 응답
{
  "message": "예약 완료"
}

에러(권장)
- HTTP 400/409 등
{
  "message": "이미 예약된 시간입니다."
}

D) 회의실 예약 취소
요청
- Method: DELETE
- Path: /api/meeting/reservations/{id}
- Query:
  - studentId: string (취소 요청자 학번)

예시
DELETE /api/meeting/reservations/10?studentId=202100001

백엔드 검증 요구(권장)
- 취소 권한: 대표자(leaderStudentId)만 가능
- 이미 종료된 예약은 취소 불가
- 예약 시작 전/후에 따른 환급 정책은 백엔드에서 처리(프론트는 confirm 문구만 보여줌)

응답(권장)
- HTTP 200
{ "message": "예약이 취소되었습니다." }

에러 예시
- HTTP 403
{ "message": "예약 취소 권한은 대표자에게만 있습니다." }

------------------------------------------------------------
4.2 좌석(노트북 열람실) 예약 API
------------------------------------------------------------

A) 좌석 예약 현황 조회(해당 시간대 예약된 좌석 리스트)
요청
- Method: GET
- Path: /api/seats/availability
- Query:
  - date: YYYY-MM-DD
  - startTime: HH:mm
  - durationHours: number (2 또는 4)

예시
GET /api/seats/availability?date=2025-12-10&startTime=09:00&durationHours=2

응답은 아래 둘 중 아무거나 가능하도록 프론트가 처리합니다.

형태 1) 예약된 좌석 번호 배열
[1, 2, 10, 11]

형태 2) 객체로 래핑
{ "reservedSeatIds": [1, 2, 10, 11] }

주의
- 프론트는 reservedSeatIds를 Set으로 만들어서 버튼 disabled 처리합니다.

B) 내 좌석 예약 조회(학번 기준)
요청
- Method: GET
- Path: /api/seats/reservations
- Query:
  - studentId: string

예시
GET /api/seats/reservations?studentId=202100002

응답(권장) SeatReservation 배열

SeatReservation 필드(프론트가 사용하는 최소 필드)
- id: number
- seatId: number (1~70)
- date: string (YYYY-MM-DD)
- startTime: string (HH:mm 또는 HH:mm:ss)
- endTime: string (HH:mm 또는 HH:mm:ss)
- studentId: string

예시 응답
[
  {
    "id": 200,
    "seatId": 12,
    "date": "2025-12-10",
    "startTime": "09:00",
    "endTime": "11:00",
    "studentId": "202100002"
  }
]

C) 좌석 지정 예약 생성
요청
- Method: POST
- Path: /api/seats/reservations
- Content-Type: application/json
- Body:
  - seatId: number (1~70)
  - date: string (YYYY-MM-DD)
  - startTime: string (HH:mm)
  - durationHours: number (2 또는 4)
  - studentId: string

예시 요청
POST /api/seats/reservations
{
  "seatId": 12,
  "date": "2025-12-10",
  "startTime": "09:00",
  "durationHours": 2,
  "studentId": "202100002"
}

백엔드 검증 요구(권장)
- 운영시간(09:00~18:00) 범위 내
- durationHours는 2 또는 4
- seatId는 1~70
- 해당 시간대 이미 예약된 seatId면 409로 처리
- (선택) 일 최대 사용 시간 등의 정책은 백엔드에서 처리

응답(권장)
- HTTP 200 또는 201
{ "message": "좌석 예약 완료" }

D) 좌석 랜덤 예약 생성
요청
- Method: POST
- Path: /api/seats/reservations/random
- Content-Type: application/json
- Body:
  - date: string (YYYY-MM-DD)
  - startTime: string (HH:mm)
  - durationHours: number (2 또는 4)
  - studentId: string

예시 요청
POST /api/seats/reservations/random
{
  "date": "2025-12-10",
  "startTime": "09:00",
  "durationHours": 2,
  "studentId": "202100002"
}

응답(권장)
- HTTP 200 또는 201
- Body: seatId를 내려주면 프론트가 “선택 좌석”으로 표시합니다.

예시 응답
{
  "seatId": 37,
  "message": "랜덤 예약 완료"
}

빈 좌석이 없는 경우(권장)
- HTTP 409 또는 400
{ "message": "예약 가능한 좌석이 없습니다." }

E) 좌석 예약 취소
요청
- Method: DELETE
- Path: /api/seats/reservations/{id}
- Query:
  - studentId: string

예시
DELETE /api/seats/reservations/200?studentId=202100002

백엔드 검증 요구(권장)
- 예약자 본인만 취소 가능
- 예약 시작 시간 이후(now >= startTime)이면 취소 불가
  - 이 경우 프론트는 "이미 이용이 시작되어 취소할 수 없습니다." 를 기대합니다.

응답(권장)
- HTTP 200
{ "message": "예약이 취소되었습니다. (시간 환급)" }

에러 예시
- HTTP 400
{ "message": "이미 이용이 시작되어 취소할 수 없습니다." }

------------------------------------------------------------
5. 프론트에서 API 메시지를 표시하는 방식
------------------------------------------------------------

- 성공 시: res.data.message가 있으면 그대로 화면에 표시
- 실패 시: e.response.data.message가 있으면 그대로 화면에 표시
- message가 없으면 프론트 기본 문구가 표시됨

따라서 백엔드는 각 실패 케이스마다 사람이 이해할 수 있는 message를 내려주는 것이 중요합니다.

------------------------------------------------------------
6. 참고: MyReservationsPage (데모/하드코딩)
------------------------------------------------------------

/my 페이지는 현재 하드코딩 데이터로 동작합니다.
백엔드 API 없이도 데모가 가능하도록 만든 페이지입니다.

테스트 하드코딩
- 202100001: 2025-12-10 09:00~11:00 회의실 예약
- 202100002: 2025-12-10 09:00~11:00 좌석 12번 예약

실제 연동을 원하면 백엔드에서 통합 조회 API를 만들고 /my 페이지에서 호출하도록 변경하면 됩니다.
예: GET /api/reservations?studentId=...

------------------------------------------------------------
7. 개발 체크리스트(백엔드)
------------------------------------------------------------

- 위 API 경로/메서드로 라우팅 구현
- request body / query 파라미터 처리
- message 필드를 포함한 에러 응답 통일
- startTime/endTime 포맷 HH:mm 권장 (HH:mm:ss여도 프론트는 앞 5자리만 사용)
- 중복 예약/권한/운영시간/취소 정책을 서버에서 최종 보장
