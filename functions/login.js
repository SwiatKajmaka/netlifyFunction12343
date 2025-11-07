import jwt from "jsonwebtoken";

// 🔹 Nagłówki CORS (możesz wpisać tu swoją domenę GitHub Pages)
const headers = {
  "Access-Control-Allow-Origin": "*", // lub np. "https://twoj-login-test.github.io"
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization"
};

export async function handler(event) {
  // 🔹 Obsługa zapytań OPTIONS (CORS preflight)
  if (event.httpMethod === "OPTIONS") {
    return {
      statusCode: 200,
      headers,
      body: "OK"
    };
  }

  // 🔹 Odbierz dane z frontendu
  const { email, password } = JSON.parse(event.body || "{}");

  // 🔹 Prosta weryfikacja użytkownika (na sztywno)
  if (email === "admin@example.com" && password === "1234") {
    // 🔹 Tworzymy token JWT
    const token = jwt.sign({ email }, process.env.JWT_SECRET || "sekretnyklucz", {
      expiresIn: "1h"
    });

    // 🔹 Zwracamy token do frontendu
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ success: true, token })
    };
  }

  // 🔹 Jeśli dane niepoprawne
  return {
    statusCode: 401,
    headers,
    body: JSON.stringify({ success: false, message: "Invalid credentials" })
  };
}
