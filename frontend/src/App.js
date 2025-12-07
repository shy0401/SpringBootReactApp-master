import "bootstrap/dist/css/bootstrap.min.css";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import TopMenuComponent from "./components/TopMenuComponent";

import HomePage from "./pages/HomePage";
import MeetingMainPage from "./pages/MeetingMainPage";
import SeatMainPage from "./pages/SeatMainPage";
import MyReservationsPage from "./pages/MyReservationsPage"; // ✅ 추가

export default function App() {
  return (
    <BrowserRouter>
      <TopMenuComponent />

      <div style={{ maxWidth: 920, margin: "0 auto", padding: 20 }}>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/meeting" element={<MeetingMainPage />} />
          <Route path="/seat" element={<SeatMainPage />} />
          <Route path="/my" element={<MyReservationsPage />} /> {/* 예약 현황 추가  이 부분은 SRS에는 없음 */}

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}
