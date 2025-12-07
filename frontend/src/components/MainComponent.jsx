import React, { Component } from "react";
import { Card, Button } from "react-bootstrap";
import { Link } from "react-router-dom";

class MainComponent extends Component {
  render() {
    return (
      <div style={{ maxWidth: 900, margin: "0 auto" }}>
        <h2 style={{ marginBottom: 10 }}>무한상상실 예약 시스템</h2>
        <p style={{ color: "#666" }}>
          회의실 예약 또는 노트북 열람실 좌석 예약을 선택하세요.
        </p>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginTop: 16 }}>
          <Card>
            <Card.Body>
              <Card.Title>회의실 예약</Card.Title>
              <Card.Text>회의실(1~3) 예약/조회/취소 기능</Card.Text>
              <Button as={Link} to="/meeting" variant="primary">
                회의실로 이동
              </Button>
            </Card.Body>
          </Card>

          <Card>
            <Card.Body>
              <Card.Title>노트북 열람실 좌석</Card.Title>
              <Card.Text>좌석(1~70) 지정/랜덤 예약 기능</Card.Text>
              <Button as={Link} to="/seat" variant="success">
                좌석으로 이동
              </Button>
            </Card.Body>
          </Card>
        </div>
      </div>
    );
  }
}

export default MainComponent;
