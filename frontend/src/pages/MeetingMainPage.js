import React, { useEffect, useMemo, useState, useCallback } from "react";
import axios from "axios";
import { validateStudentId } from "../utils/studentId";
import {
  Alert,
  Badge,
  Button,
  Card,
  Col,
  Form,
  Row,
  Table,
  Tabs,
  Tab,
  Spinner,
} from "react-bootstrap";

const OPER_START = "09:00";
const OPER_END = "18:00";

function timeToMin(t) {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}
function minToTime(min) {
  const h = String(Math.floor(min / 60)).padStart(2, "0");
  const m = String(min % 60).padStart(2, "0");
  return `${h}:${m}`;
}
function addHours(t, hours) {
  return minToTime(timeToMin(t) + hours * 60);
}
function todayISO() {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}
function parseStudentIds(raw) {
  return raw
    .split(/[\s,]+/g)
    .map((s) => s.trim())
    .filter(Boolean);
}
function asDateTime(dateISO, timeHHMM) {
  return new Date(`${dateISO}T${timeHHMM}:00`);
}

export default function MeetingMainPage() {
  const [tab, setTab] = useState("create");

  const [studentId, setStudentId] = useState(
    () => localStorage.getItem("studentId") || ""
  );

  const [date, setDate] = useState(todayISO);
  const [roomId, setRoomId] = useState(1);
  const [startTime, setStartTime] = useState("09:00");
  const [duration, setDuration] = useState(1); // 1 or 2
  const [participantsRaw, setParticipantsRaw] = useState("");

  const [info, setInfo] = useState(null);
  const [error, setError] = useState(null);

  const [loadingSchedule, setLoadingSchedule] = useState(false);
  const [scheduleReservations, setScheduleReservations] = useState([]);

  const [loadingMine, setLoadingMine] = useState(false);
  const [myReservations, setMyReservations] = useState([]);

  useEffect(() => {
    localStorage.setItem("studentId", studentId);
  }, [studentId]);

  const timeOptions = useMemo(() => {
    const list = [];
    for (let m = timeToMin(OPER_START); m <= timeToMin("17:00"); m += 60) {
      list.push(minToTime(m));
    }
    return list;
  }, []);

  const endTime = useMemo(
    () => addHours(startTime, duration),
    [startTime, duration]
  );

  useEffect(() => {
    if (duration === 2 && timeToMin(startTime) > timeToMin("16:00")) {
      setStartTime("16:00");
    }
  }, [duration, startTime]);

  const loadSchedule = useCallback(async () => {
    setError(null);
    setInfo(null);
    setLoadingSchedule(true);
    try {
      const res = await axios.get("/api/meeting/reservations", {
        params: { date },
      });
      setScheduleReservations(res.data || []);
    } catch (e) {
      setError(
        e?.response?.data?.message ||
          "회의실 일정표를 불러오지 못했습니다. (서버 연결/엔드포인트 확인)"
      );
      setScheduleReservations([]);
    } finally {
      setLoadingSchedule(false);
    }
  }, [date]);

  const loadMine = useCallback(async () => {
    const id = studentId.trim();
    if (!id) {
      setMyReservations([]);
      return;
    }

    // ✅ 학번 하드코딩 인증 적용
    const v = validateStudentId(id);
    if (!v.ok) {
      setError(v.message);
      setMyReservations([]);
      return;
    }

    setError(null);
    setInfo(null);
    setLoadingMine(true);
    try {
      const res = await axios.get("/api/meeting/reservations", {
        params: { studentId: id },
      });
      setMyReservations(res.data || []);
    } catch (e) {
      setError(
        e?.response?.data?.message ||
          "내 회의실 예약을 불러오지 못했습니다. (서버 연결/엔드포인트 확인)"
      );
      setMyReservations([]);
    } finally {
      setLoadingMine(false);
    }
  }, [studentId]);

  useEffect(() => {
    loadSchedule();
  }, [loadSchedule]);

  useEffect(() => {
    loadMine();
  }, [loadMine]);

  const validateCreate = () => {
    setError(null);
    setInfo(null);

    const id = studentId.trim();
    if (!id) return "대표자 학번(본인)을 먼저 입력하세요.";

    // ✅ 학번 하드코딩 인증 적용
    const v = validateStudentId(id);
    if (!v.ok) return v.message;

    const s = timeToMin(startTime);
    const e = timeToMin(endTime);
    if (s < timeToMin(OPER_START) || e > timeToMin(OPER_END)) {
      return `운영시간(09:00~18:00) 범위 안에서만 예약할 수 있어요.`;
    }

    const participants = parseStudentIds(participantsRaw);
    const merged = Array.from(new Set([id, ...participants]));
    if (merged.length < 3) return "회의실 예약은 최소 3명의 참가자가 필요합니다.";

    if (![1, 2].includes(duration))
      return "이용 시간은 1시간 또는 2시간만 선택 가능합니다.";
    if (![1, 2, 3].includes(Number(roomId)))
      return "회의실 번호는 1~3번만 가능합니다.";

    return null;
  };

  const createReservation = async () => {
    const msg = validateCreate();
    if (msg) {
      setError(msg);
      return;
    }

    const id = studentId.trim();
    const participants = Array.from(new Set([id, ...parseStudentIds(participantsRaw)]));

    try {
      setError(null);
      setInfo(null);

      const res = await axios.post("/api/meeting/reservations", {
        roomId: Number(roomId),
        date,
        startTime,
        durationHours: duration,
        leaderStudentId: id,
        participantStudentIds: participants,
      });

      setInfo(
        res?.data?.message ||
          `예약 완료! (회의실 ${roomId} / ${date} ${startTime}~${endTime})`
      );

      await loadSchedule();
      await loadMine();
    } catch (e) {
      setError(
        e?.response?.data?.message ||
          "예약 실패: 입력/시간/중복/한도 조건을 확인하세요."
      );
    }
  };

  const buildGridRows = () => {
    const rows = [];
    for (let m = timeToMin(OPER_START); m < timeToMin(OPER_END); m += 60) {
      rows.push({ start: minToTime(m), end: minToTime(m + 60) });
    }
    return rows;
  };

  const isOccupied = (room, slotStart) => {
    const slotS = timeToMin(slotStart);
    const slotE = slotS + 60;
    return scheduleReservations.some((r) => {
      if (Number(r.roomId) !== Number(room)) return false;
      if (String(r.date) !== String(date)) return false;
      const rs = timeToMin(String(r.startTime).slice(0, 5));
      const re = timeToMin(String(r.endTime).slice(0, 5));
      return rs < slotE && re > slotS;
    });
  };

  const cancelReservation = async (r) => {
    setError(null);
    setInfo(null);

    const id = studentId.trim();
    const v = validateStudentId(id);
    if (!v.ok) {
      setError(v.message);
      return;
    }

    if (String(r.leaderStudentId) !== String(id)) {
      setError("예약 취소 권한은 대표자에게만 있습니다.");
      return;
    }

    const now = new Date();
    const startDT = asDateTime(r.date, String(r.startTime).slice(0, 5));
    const endDT = asDateTime(r.date, String(r.endTime).slice(0, 5));

    if (now > endDT) {
      setError("이미 종료된 예약입니다.");
      return;
    }

    const before = now < startDT;
    const warningBase = `예약을 취소하면 동반 이용자를 포함한 전체 예약이 취소됩니다.`;
    const warningRefund = before
      ? `예약 시작 전 취소로, 참여자 전원의 사용 시간이 환급됩니다.`
      : `시간이 환급되지 않습니다.`;

    const ok = window.confirm(`${warningBase}\n${warningRefund}\n\n정말 취소할까요?`);
    if (!ok) return;

    try {
      await axios.delete(`/api/meeting/reservations/${r.id}`, {
        params: { studentId: id },
      });

      setInfo("예약이 취소되었습니다.");
      await loadSchedule();
      await loadMine();
    } catch (e) {
      setError(
        e?.response?.data?.message ||
          "취소 실패: 서버 엔드포인트/권한을 확인하세요."
      );
    }
  };

  return (
    <div style={{ maxWidth: 920, margin: "0 auto" }}>
      <h3 style={{ marginBottom: 8 }}>회의실 예약</h3>
      <div style={{ color: "#666", marginBottom: 12 }}>
        운영시간 {OPER_START}~{OPER_END}, 1시간 단위(최대 2시간), 본인 포함 최소 3명
      </div>

      {error && <Alert variant="danger">{error}</Alert>}
      {info && <Alert variant="success">{info}</Alert>}

      <Card className="mb-3">
        <Card.Body>
          <Row className="g-2 align-items-end">
            <Col xs={12} md={4}>
              <Form.Label>대표자 학번</Form.Label>
              <Form.Control
                value={studentId}
                onChange={(e) => setStudentId(e.target.value)}
                placeholder="9자리 숫자 학번"
              />
            </Col>
            <Col xs={12} md={4}>
              <Form.Label>예약 날짜</Form.Label>
              <Form.Control
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </Col>
            <Col xs={12} md={4}>
              <Button
                variant="outline-secondary"
                onClick={loadMine}
                className="w-100"
              >
                내 예약 새로고침
              </Button>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      <Tabs activeKey={tab} onSelect={(k) => setTab(k)} className="mb-3">
        <Tab eventKey="create" title="예약 생성">
          <Card className="mb-3">
            <Card.Body>
              <Row className="g-2">
                <Col xs={12} md={4}>
                  <Form.Label>회의실 번호(1~3)</Form.Label>
                  <Form.Select
                    value={roomId}
                    onChange={(e) => setRoomId(Number(e.target.value))}
                  >
                    <option value={1}>1번</option>
                    <option value={2}>2번</option>
                    <option value={3}>3번</option>
                  </Form.Select>
                </Col>

                <Col xs={12} md={4}>
                  <Form.Label>시작 시간</Form.Label>
                  <Form.Select
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                  >
                    {timeOptions.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </Form.Select>
                </Col>

                <Col xs={12} md={4}>
                  <Form.Label>이용 시간(1시간 단위, 최대 2시간)</Form.Label>
                  <Form.Select
                    value={duration}
                    onChange={(e) => setDuration(Number(e.target.value))}
                  >
                    <option value={1}>1시간</option>
                    <option value={2}>2시간</option>
                  </Form.Select>
                  <div style={{ fontSize: 12, color: "#888", marginTop: 4 }}>
                    종료 시간: <b>{endTime}</b>
                  </div>
                </Col>

                <Col xs={12}>
                  <Form.Label>참가자 학번(본인 포함 최소 3명)</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={2}
                    value={participantsRaw}
                    onChange={(e) => setParticipantsRaw(e.target.value)}
                    placeholder="예: 202100001 202100002 (콤마/공백/줄바꿈 OK)"
                  />
                  <div style={{ fontSize: 12, color: "#888", marginTop: 4 }}>
                    * 본인 학번은 자동 포함됩니다.
                  </div>
                </Col>

                <Col xs={12} md={4}>
                  <Button
                    onClick={createReservation}
                    className="w-100"
                    variant="primary"
                  >
                    회의실 예약 생성
                  </Button>
                </Col>
              </Row>
            </Card.Body>
          </Card>

          <Card>
            <Card.Body>
              <div className="d-flex align-items-center justify-content-between">
                <div>
                  <b>{date}</b> 회의실 일정표{" "}
                  <span style={{ color: "#666" }}>(예약 가능/예약됨 표시)</span>
                </div>
                <Button
                  variant="outline-secondary"
                  size="sm"
                  onClick={loadSchedule}
                >
                  새로고침
                </Button>
              </div>

              <div style={{ marginTop: 12 }}>
                {loadingSchedule ? (
                  <div className="d-flex align-items-center gap-2">
                    <Spinner animation="border" size="sm" /> 불러오는 중...
                  </div>
                ) : (
                  <Table bordered responsive>
                    <thead>
                      <tr>
                        <th style={{ width: 160 }}>시간</th>
                        <th>회의실 1</th>
                        <th>회의실 2</th>
                        <th>회의실 3</th>
                      </tr>
                    </thead>
                    <tbody>
                      {buildGridRows().map((slot) => (
                        <tr key={slot.start}>
                          <td>
                            {slot.start}~{slot.end}
                          </td>
                          {[1, 2, 3].map((room) => {
                            const occ = isOccupied(room, slot.start);
                            return (
                              <td key={room}>
                                {occ ? (
                                  <Badge bg="danger">예약됨</Badge>
                                ) : (
                                  <Badge bg="success">예약 가능</Badge>
                                )}
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                )}
              </div>
            </Card.Body>
          </Card>
        </Tab>

        <Tab eventKey="mine" title="예약 조회/취소">
          <Card>
            <Card.Body>
              <div style={{ marginBottom: 10 }}>
                학번으로 내 예약을 조회하고, 대표자면 취소할 수 있어요.
              </div>

              {loadingMine ? (
                <div className="d-flex align-items-center gap-2">
                  <Spinner animation="border" size="sm" /> 불러오는 중...
                </div>
              ) : myReservations.length === 0 ? (
                <Alert variant="secondary" className="mb-0">
                  현재 등록된 회의실 예약이 없습니다.
                </Alert>
              ) : (
                <Table bordered responsive>
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>회의실</th>
                      <th>날짜</th>
                      <th>시간</th>
                      <th>대표자</th>
                      <th>취소</th>
                    </tr>
                  </thead>
                  <tbody>
                    {myReservations.map((r) => {
                      const isLeader =
                        String(r.leaderStudentId) === String(studentId.trim());
                      return (
                        <tr key={r.id}>
                          <td>{r.id}</td>
                          <td>{r.roomId}</td>
                          <td>{r.date}</td>
                          <td>
                            {String(r.startTime).slice(0, 5)}~
                            {String(r.endTime).slice(0, 5)}
                          </td>
                          <td>{r.leaderStudentId}</td>
                          <td>
                            <Button
                              variant={isLeader ? "danger" : "secondary"}
                              size="sm"
                              disabled={!isLeader}
                              onClick={() => cancelReservation(r)}
                            >
                              취소
                            </Button>
                            {!isLeader && (
                              <div
                                style={{
                                  fontSize: 12,
                                  color: "#888",
                                  marginTop: 4,
                                }}
                              >
                                대표자만 취소 가능
                              </div>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </Table>
              )}
            </Card.Body>
          </Card>
        </Tab>
      </Tabs>
    </div>
  );
}
