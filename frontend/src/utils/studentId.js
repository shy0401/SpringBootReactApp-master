// src/utils/studentId.js
const INVALID_IDS = new Set(["202099999", "202288888"]);

export function validateStudentId(studentId) {
  const id = String(studentId || "").trim();

  // 9자리 정수만 허용
  if (!/^\d{9}$/.test(id)) {
    return { ok: false, message: "학번은 9자리 숫자만 입력하세요." };
  }

  // 하드코딩으로 무효 처리할 학번
  if (INVALID_IDS.has(id)) {
    return { ok: false, message: "유효하지 않은 학번입니다." };
  }

  // 그 외 9자리 숫자는 모두 유효(요구사항)
  return { ok: true, message: "" };
}
