import jwt from "jsonwebtoken";

export async function handler(event) {
  const auth = event.headers.authorization || "";
  const token = auth.split(" ")[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "sekretnyklucz");
    return {
      statusCode: 200,
      body: JSON.stringify({ message: `Dostęp przyznany dla ${decoded.email}` })
    };
  } catch {
    return {
      statusCode: 401,
      body: JSON.stringify({ message: "Nieautoryzowany" })
    };
  }
}
