import React from "react";
import { Link } from "react-router-dom";
import { Card, Button, Row, Col } from "react-bootstrap";

export default function HomePage() {
  return (
    <div style={{ maxWidth: 920, margin: "0 auto" }}>
      <h2 style={{ marginBottom: 8 }}>무한상상실 예약</h2>
      <p style={{ marginTop: 0, color: "#666" }}>
        회의실 예약 또는 노트북 열람실 좌석 예약을 선택하세요.
      </p>

      <Row className="g-3" style={{ marginTop: 12 }}>
        <Col xs={12} md={6}>
          <Card className="h-100">
            <Card.Body>
              <Card.Title>회의실 예약</Card.Title>
              <Card.Text style={{ color: "#666" }}>
                회의실(1~3) 예약/조회/취소 기능으로 이동합니다.
              </Card.Text>

              <Button as={Link} to="/meeting" variant="primary">
                회의실 페이지로
              </Button>
            </Card.Body>
          </Card>
        </Col>

        <Col xs={12} md={6}>
          <Card className="h-100">
            <Card.Body>
              <Card.Title>노트북 열람실 좌석</Card.Title>
              <Card.Text style={{ color: "#666" }}>
                좌석(1~70) 지정 예약 / 랜덤 예약 기능으로 이동합니다.
              </Card.Text>

              <Button as={Link} to="/seat" variant="success">
                좌석 페이지로
              </Button>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <hr style={{ margin: "20px 0" }} />
      <hr style={{ margin: "20px 0" }} />

      <Card>
        <Card.Body className="d-flex align-items-center justify-content-between">
          <div>
            <div style={{ fontWeight: 700 }}>내 예약 현황 조회</div>
            <div style={{ color: "#666" }}>학번으로 현재 예약 상태를 확인합니다.</div>
          </div>
          <Button as={Link} to="/my" variant="dark">
            내 예약 보러가기
          </Button>
        </Card.Body>
      </Card>

      <div style={{ color: "#888", fontSize: 14 }}>
        <div>운영시간: 09:00 ~ 18:00</div>
        <div>회의실: 1시간 단위(최대 2시간), 본인 포함 최소 3명</div>
        <div>노트북 좌석: 2시간 단위(최대 4시간), 좌석 1~70</div>
      </div>
    </div>
  );
}
