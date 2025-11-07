import jwt from "jsonwebtoken";

export async function handler(event) {
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
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ success: true, token })
    };
  }

  // 🔹 Jeśli dane niepoprawne
  return {
    statusCode: 401,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ success: false, message: "Invalid credentials" })
  };
}
