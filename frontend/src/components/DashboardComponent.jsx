import React, { Component } from "react";
import { Card, Button } from "react-bootstrap";

class DashboardComponent extends Component {
  render() {
    return (
      <div style={{ maxWidth: 900, margin: "0 auto" }}>
        <h2>회의실 예약</h2>
        <p style={{ color: "#666" }}>원하는 메뉴를 선택하세요.</p>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          <Card>
            <Card.Body>
              <Card.Title>회의실 예약하기</Card.Title>
              <Card.Text>날짜/시간/참여자 학번을 입력해 예약합니다.</Card.Text>
              <Button variant="primary" disabled>
                (다음 단계) 예약 폼
              </Button>
            </Card.Body>
          </Card>

          <Card>
            <Card.Body>
              <Card.Title>내 회의실 예약 조회</Card.Title>
              <Card.Text>학번으로 내 예약 목록을 확인합니다.</Card.Text>
              <Button variant="secondary" disabled>
                (다음 단계) 예약 조회
              </Button>
            </Card.Body>
          </Card>
        </div>
      </div>
    );
  }
}

export default DashboardComponent;
