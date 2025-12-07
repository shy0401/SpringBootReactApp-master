import React from "react";
import { Navbar, Nav, Container } from "react-bootstrap";
import { NavLink } from "react-router-dom";

export default function TopMenuComponent() {
  const linkStyle = ({ isActive }) => ({
    color: "white",
    textDecoration: "none",
    marginRight: 14,
    fontWeight: isActive ? 700 : 400,
    opacity: isActive ? 1 : 0.85,
  });

  return (
    <Navbar bg="dark" variant="dark" className="mb-3">
      <Container style={{ maxWidth: 920 }}>
        <Navbar.Brand as={NavLink} to="/" style={{ color: "white", textDecoration: "none" }}>
          좌석예약시스템
        </Navbar.Brand>

        <Nav>
          <NavLink to="/meeting" style={linkStyle}>
            회의실
          </NavLink>
          <NavLink to="/seat" style={linkStyle}>
            노트북 열람실
          </NavLink>
        </Nav>
      </Container>
    </Navbar>
  );
}
