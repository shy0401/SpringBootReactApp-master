import React, { useMemo, useState } from "react";
import { validateStudentId } from "../utils/studentId";
import { Alert, Button, Card, Col, Form, Row, Badge } from "react-bootstrap";

export default function MyReservationsPage() {
  const [studentId, setStudentId] = useState("");
  const [searchedId, setSearchedId] = useState(""); // 조회 버튼 눌렀을 때 확정값

  const fakeDB = useMemo(
    () => ({
      "202100001": [
        {
          type: "MEETING",
          title: "회의실 예약",
          roomName: "회의실 1",
          date: "2025-12-10",
          startTime: "09:00",
          endTime: "11:00",
        },
      ],
      "202100002": [
        {
          type: "SEAT",
          title: "노트북 열람실 좌석 예약",
          seatNo: 12,
          date: "2025-12-10",
          startTime: "09:00",
          endTime: "11:00",
        },
      ],
    }),
    []
  );

  const v = searchedId ? validateStudentId(searchedId) : null;
  const reservations =
    searchedId && v?.ok ? fakeDB[searchedId.trim()] || [] : [];

  const onSearch = () => {
    setSearchedId(studentId.trim());
  };

  return (
    <div style={{ maxWidth: 920, margin: "0 auto" }}>
      <h3 style={{ marginBottom: 8 }}>내 예약 현황 조회</h3>
      <div style={{ color: "#666", marginBottom: 16 }}>
        학번을 입력하면 현재 예약 중인 회의실/좌석 정보를 보여줍니다. (데모 하드코딩)
      </div>

      <Card className="mb-3">
        <Card.Body>
          <Row className="g-2 align-items-end">
            <Col xs={12} md={8}>
              <Form.Label>학번 입력</Form.Label>
              <Form.Control
                value={studentId}
                onChange={(e) => setStudentId(e.target.value)}
                placeholder="예: 202100001 또는 202100002"
              />
            </Col>
            <Col xs={12} md={4}>
              <Button variant="outline-secondary" className="w-100" onClick={onSearch}>
                조회
              </Button>
            </Col>
          </Row>

          <div style={{ marginTop: 10, fontSize: 13, color: "#888" }}>
            테스트용 학번: <b>202100001</b>(회의실), <b>202100002</b>(좌석) /
            무효 학번: <b>202099999</b>, <b>202288888</b>
          </div>
        </Card.Body>
      </Card>

      {!searchedId ? (
        <Alert variant="secondary">학번을 입력하고 “조회”를 누르면 표시됩니다.</Alert>
      ) : !v?.ok ? (
        <Alert variant="danger">{v.message}</Alert>
      ) : reservations.length === 0 ? (
        <Alert variant="warning">
          <b>{searchedId}</b> 학번의 예약 데이터가 없습니다.
        </Alert>
      ) : (
        <div style={{ display: "grid", gap: 12 }}>
          {reservations.map((r, idx) => (
            <Card key={idx}>
              <Card.Body>
                <div className="d-flex align-items-center justify-content-between">
                  <div style={{ fontSize: 18, fontWeight: 700 }}>{r.title}</div>
                  <Badge bg={r.type === "MEETING" ? "primary" : "success"}>
                    {r.type === "MEETING" ? "회의실" : "좌석"}
                  </Badge>
                </div>

                <hr style={{ margin: "12px 0" }} />

                <Row className="g-2">
                  <Col xs={12} md={6}>
                    <div style={{ color: "#666", fontSize: 13 }}>예약 대상</div>
                    <div style={{ fontSize: 16, fontWeight: 600 }}>
                      {r.type === "MEETING" ? r.roomName : `좌석 ${r.seatNo}번`}
                    </div>
                  </Col>

                  <Col xs={12} md={6}>
                    <div style={{ color: "#666", fontSize: 13 }}>예약 일시</div>
                    <div style={{ fontSize: 16, fontWeight: 600 }}>
                      {r.date} {r.startTime} ~ {r.endTime}
                    </div>
                  </Col>
                </Row>
              </Card.Body>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
