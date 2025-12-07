import React, { Component } from "react";
import { Card, Button } from "react-bootstrap";

class SeatComponent extends Component {
  render() {
    return (
      <div style={{ maxWidth: 900, margin: "0 auto" }}>
        <h2>노트북 열람실 좌석</h2>
        <p style={{ color: "#666" }}>원하는 예약 방식을 선택하세요.</p>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          <Card>
            <Card.Body>
              <Card.Title>좌석 지정 예약</Card.Title>
              <Card.Text>좌석 배치도에서 1~70번 좌석을 선택해 예약합니다.</Card.Text>
              <Button variant="success" disabled>
                (다음 단계) 지정 예약
              </Button>
            </Card.Body>
          </Card>

          <Card>
            <Card.Body>
              <Card.Title>좌석 랜덤 예약</Card.Title>
              <Card.Text>가능한 좌석 중 임의의 좌석을 배정받아 예약합니다.</Card.Text>
              <Button variant="warning" disabled>
                (다음 단계) 랜덤 예약
              </Button>
            </Card.Body>
          </Card>
        </div>
      </div>
    );
  }
}

export default SeatComponent;
