import jwt from "jsonwebtoken";

export async function handler(event, context) {
  const { email, password } = JSON.parse(event.body);

  // 🔹 Weryfikacja danych (na razie hardkodowana)
  if (email === "admin@example.com" && password === "1234") {
    // 🔹 Tworzymy token JWT (czyli podpisany „bilet”)
    const token = jwt.sign({ email }, "sekretnyklucz", { expiresIn: "1h" });

    return {
      statusCode: 200,
      body: JSON.stringify({ success: true, token })
    };
  }

  // 🔹 Jeśli złe dane:
  return {
    statusCode: 401,
    body: JSON.stringify({ success: false, message: "Invalid credentials" })
  };
}
