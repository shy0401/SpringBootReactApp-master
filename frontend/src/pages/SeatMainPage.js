import React, { useEffect, useMemo, useState } from "react";
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
function asDateTime(dateISO, timeHHMM) {
  return new Date(`${dateISO}T${timeHHMM}:00`);
}

export default function SeatMainPage() {
  const [tab, setTab] = useState("reserve");

  const [studentId, setStudentId] = useState(
    () => localStorage.getItem("studentId") || ""
  );

  const [date, setDate] = useState(todayISO);
  const [startTime, setStartTime] = useState("09:00");
  const [duration, setDuration] = useState(2); // 2 or 4

  const endTime = useMemo(
    () => addHours(startTime, duration),
    [startTime, duration]
  );

  const [loadingSeats, setLoadingSeats] = useState(false);
  const [reservedSeatIds, setReservedSeatIds] = useState(new Set());
  const [selectedSeatId, setSelectedSeatId] = useState(null);

  const [loadingMine, setLoadingMine] = useState(false);
  const [myReservations, setMyReservations] = useState([]);

  const [info, setInfo] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    localStorage.setItem("studentId", studentId);
  }, [studentId]);

  const timeOptions = useMemo(() => {
    const last = duration === 4 ? "14:00" : "16:00";
    const list = [];
    for (let m = timeToMin(OPER_START); m <= timeToMin(last); m += 60) {
      list.push(minToTime(m));
    }
    return list;
  }, [duration]);

  useEffect(() => {
    if (duration === 4 && timeToMin(startTime) > timeToMin("14:00")) {
      setStartTime("14:00");
    }
  }, [duration, startTime]);

  const validateTime = () => {
    const s = timeToMin(startTime);
    const e = timeToMin(endTime);
    if (s < timeToMin(OPER_START) || e > timeToMin(OPER_END)) {
      return `운영시간(09:00~18:00) 범위 안에서만 예약할 수 있어요.`;
    }
    if (![2, 4].includes(duration))
      return "이용 시간은 2시간 또는 4시간만 선택 가능합니다.";
    return null;
  };

  const loadAvailability = async () => {
    setError(null);
    setInfo(null);

    const tMsg = validateTime();
    if (tMsg) {
      setError(tMsg);
      setReservedSeatIds(new Set());
      return;
    }

    setLoadingSeats(true);
    try {
      const res = await axios.get("/api/seats/availability", {
        params: { date, startTime, durationHours: duration },
      });

      const arr = Array.isArray(res.data)
        ? res.data
        : res.data?.reservedSeatIds || [];
      setReservedSeatIds(new Set(arr.map(Number)));
    } catch (e) {
      setError(
        e?.response?.data?.message ||
          "좌석 현황을 불러오지 못했습니다. (서버 연결/엔드포인트 확인)"
      );
      setReservedSeatIds(new Set());
    } finally {
      setLoadingSeats(false);
    }
  };

  const loadMine = async () => {
    const id = studentId.trim();
    if (!id) {
      setMyReservations([]);
      return;
    }

    const v = validateStudentId(id);
    if (!v.ok) {
      setError(v.message);
      setMyReservations([]);
      return;
    }

    setLoadingMine(true);
    setError(null);
    setInfo(null);
    try {
      const res = await axios.get("/api/seats/reservations", {
        params: { studentId: id },
      });
      setMyReservations(res.data || []);
    } catch (e) {
      setError(
        e?.response?.data?.message ||
          "내 좌석 예약을 불러오지 못했습니다. (서버 연결/엔드포인트 확인)"
      );
      setMyReservations([]);
    } finally {
      setLoadingMine(false);
    }
  };

  useEffect(() => {
    loadAvailability();
  }, [date, startTime, duration]);

  useEffect(() => {
    loadMine();
  }, [studentId]);

  const reserveSelected = async () => {
    setError(null);
    setInfo(null);

    const id = studentId.trim();
    const v = validateStudentId(id);
    if (!v.ok) {
      setError(v.message);
      return;
    }

    const tMsg = validateTime();
    if (tMsg) {
      setError(tMsg);
      return;
    }

    if (!selectedSeatId) {
      setError("좌석을 먼저 선택하세요. (1~70)");
      return;
    }
    if (reservedSeatIds.has(Number(selectedSeatId))) {
      setError("선택한 좌석은 해당 시간에 이미 예약되어 있습니다.");
      return;
    }

    try {
      const res = await axios.post("/api/seats/reservations", {
        seatId: Number(selectedSeatId),
        date,
        startTime,
        durationHours: duration,
        studentId: id,
      });

      setInfo(
        res?.data?.message ||
          `좌석 예약 완료! (좌석 ${selectedSeatId} / ${date} ${startTime}~${endTime})`
      );

      await loadAvailability();
      await loadMine();
    } catch (e) {
      setError(
        e?.response?.data?.message ||
          "예약 실패: 중복/시간/한도 조건을 확인하세요."
      );
    }
  };

  const reserveRandom = async () => {
    setError(null);
    setInfo(null);

    const id = studentId.trim();
    const v = validateStudentId(id);
    if (!v.ok) {
      setError(v.message);
      return;
    }

    const tMsg = validateTime();
    if (tMsg) {
      setError(tMsg);
      return;
    }

    try {
      const res = await axios.post("/api/seats/reservations/random", {
        date,
        startTime,
        durationHours: duration,
        studentId: id,
      });

      const seatId = Number(res?.data?.seatId);
      if (seatId) setSelectedSeatId(seatId);

      setInfo(
        res?.data?.message ||
          (seatId
            ? `랜덤 예약 완료! (배정 좌석 ${seatId} / ${date} ${startTime}~${endTime})`
            : "랜덤 예약 완료!")
      );

      await loadAvailability();
      await loadMine();
    } catch (e) {
      setError(
        e?.response?.data?.message ||
          "랜덤 예약 실패: 예약 가능한 좌석이 없습니다."
      );
    }
  };

  const cancelSeatReservation = async (r) => {
    setError(null);
    setInfo(null);

    const id = studentId.trim();
    const v = validateStudentId(id);
    if (!v.ok) {
      setError(v.message);
      return;
    }

    const now = new Date();
    const startDT = asDateTime(r.date, String(r.startTime).slice(0, 5));

    if (String(r.studentId) !== String(id)) {
      setError("권한이 없습니다.");
      return;
    }

    if (now >= startDT) {
      setError("이미 이용이 시작되어 취소할 수 없습니다.");
      return;
    }

    const ok = window.confirm(`예약을 취소할까요?\n(예약 시간 전 취소 → 시간 환급)`);
    if (!ok) return;

    try {
      await axios.delete(`/api/seats/reservations/${r.id}`, {
        params: { studentId: id },
      });

      setInfo("예약이 취소되었습니다. (시간 환급)");
      await loadAvailability();
      await loadMine();
    } catch (e) {
      setError(
        e?.response?.data?.message ||
          "취소 실패: 서버 엔드포인트/권한을 확인하세요."
      );
    }
  };

  const seats = useMemo(() => Array.from({ length: 70 }, (_, i) => i + 1), []);

  return (
    <div style={{ maxWidth: 920, margin: "0 auto" }}>
      <h3 style={{ marginBottom: 8 }}>노트북 열람실 좌석 예약</h3>
      <div style={{ color: "#666", marginBottom: 12 }}>
        운영시간 {OPER_START}~{OPER_END}, 2시간 단위(최대 4시간), 좌석 1~70
      </div>

      {error && <Alert variant="danger">{error}</Alert>}
      {info && <Alert variant="success">{info}</Alert>}

      <Card className="mb-3">
        <Card.Body>
          <Row className="g-2 align-items-end">
            <Col xs={12} md={4}>
              <Form.Label>학번</Form.Label>
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

          <Row className="g-2 mt-2">
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
              <Form.Label>이용 시간(2시간 단위, 최대 4시간)</Form.Label>
              <Form.Select
                value={duration}
                onChange={(e) => setDuration(Number(e.target.value))}
              >
                <option value={2}>2시간</option>
                <option value={4}>4시간</option>
              </Form.Select>
              <div style={{ fontSize: 12, color: "#888", marginTop: 4 }}>
                종료 시간: <b>{endTime}</b>
              </div>
            </Col>

            <Col xs={12} md={4} className="d-grid">
              <Button variant="outline-secondary" onClick={loadAvailability}>
                좌석 현황 새로고침
              </Button>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      <Tabs activeKey={tab} onSelect={(k) => setTab(k)} className="mb-3">
        <Tab eventKey="reserve" title="지정/랜덤 예약">
          <Row className="g-3">
            <Col xs={12} md={7}>
              <Card>
                <Card.Body>
                  <div className="d-flex align-items-center justify-content-between">
                    <div>좌석 배치도 (예약된 좌석은 선택 불가)</div>
                    {loadingSeats && (
                      <div className="d-flex align-items-center gap-2">
                        <Spinner animation="border" size="sm" /> 로딩중
                      </div>
                    )}
                  </div>

                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(10, 1fr)",
                      gap: 8,
                      marginTop: 12,
                    }}
                  >
                    {seats.map((id) => {
                      const reserved = reservedSeatIds.has(id);
                      const selected = Number(selectedSeatId) === id;
                      return (
                        <button
                          key={id}
                          onClick={() => setSelectedSeatId(id)}
                          disabled={reserved}
                          style={{
                            padding: "10px 0",
                            borderRadius: 10,
                            border: "1px solid #ddd",
                            cursor: reserved ? "not-allowed" : "pointer",
                            background: reserved
                              ? "#f8d7da"
                              : selected
                              ? "#cfe2ff"
                              : "#fff",
                            fontWeight: 700,
                          }}
                          title={reserved ? "예약됨" : "예약 가능"}
                        >
                          {id}
                        </button>
                      );
                    })}
                  </div>

                  <div
                    style={{
                      marginTop: 12,
                      display: "flex",
                      gap: 10,
                      flexWrap: "wrap",
                    }}
                  >
                    <Badge bg="success">예약 가능</Badge>
                    <Badge bg="danger">예약됨</Badge>
                    {selectedSeatId && (
                      <Badge bg="primary">선택: {selectedSeatId}</Badge>
                    )}
                  </div>
                </Card.Body>
              </Card>
            </Col>

            <Col xs={12} md={5}>
              <Card className="mb-3">
                <Card.Body>
                  <div style={{ marginBottom: 10 }}>
                    현재 선택:{" "}
                    <b>{selectedSeatId ? `좌석 ${selectedSeatId}` : "없음"}</b>
                  </div>
                  <Button
                    variant="primary"
                    className="w-100"
                    onClick={reserveSelected}
                  >
                    좌석 지정 예약
                  </Button>
                </Card.Body>
              </Card>

              <Card>
                <Card.Body>
                  <Button
                    variant="success"
                    className="w-100"
                    onClick={reserveRandom}
                  >
                    좌석 랜덤 예약
                  </Button>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </Tab>

        <Tab eventKey="mine" title="예약 조회/취소">
          <Card>
            <Card.Body>
              <div style={{ marginBottom: 10 }}>
                학번으로 예약을 조회하고, 시작 전이면 취소(시간 환급)됩니다.
              </div>

              {loadingMine ? (
                <div className="d-flex align-items-center gap-2">
                  <Spinner animation="border" size="sm" /> 불러오는 중...
                </div>
              ) : myReservations.length === 0 ? (
                <Alert variant="secondary" className="mb-0">
                  예약된 좌석이 없습니다.
                </Alert>
              ) : (
                <Table bordered responsive>
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>좌석</th>
                      <th>날짜</th>
                      <th>시간</th>
                      <th>취소</th>
                    </tr>
                  </thead>
                  <tbody>
                    {myReservations.map((r) => {
                      const now = new Date();
                      const startDT = asDateTime(
                        r.date,
                        String(r.startTime).slice(0, 5)
                      );
                      const canCancel = now < startDT;

                      return (
                        <tr key={r.id}>
                          <td>{r.id}</td>
                          <td>{r.seatId}</td>
                          <td>{r.date}</td>
                          <td>
                            {String(r.startTime).slice(0, 5)}~
                            {String(r.endTime).slice(0, 5)}
                          </td>
                          <td>
                            <Button
                              size="sm"
                              variant={canCancel ? "danger" : "secondary"}
                              disabled={!canCancel}
                              onClick={() => cancelSeatReservation(r)}
                            >
                              취소
                            </Button>
                            {!canCancel && (
                              <div
                                style={{
                                  fontSize: 12,
                                  color: "#888",
                                  marginTop: 4,
                                }}
                              >
                                이미 이용이 시작되어 취소할 수 없습니다.
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
