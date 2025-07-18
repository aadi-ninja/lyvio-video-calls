import { generateStreamToken } from "../lib/stream.js";



export async function getStreamToken(req, res) {
  try {
    const token = await generateStreamToken(req.user.id);
    res.json({ token });
  } catch (error) {
    console.error("Error generating stream token:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}
