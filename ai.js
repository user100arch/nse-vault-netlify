exports.handler = async function (event) {
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Content-Type": "application/json",
  };

  if (event.httpMethod === "OPTIONS") return { statusCode: 200, headers, body: "" };
  if (event.httpMethod !== "POST") return { statusCode: 405, headers, body: JSON.stringify({ error: "Method not allowed" }) };

  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) return { statusCode: 500, headers, body: JSON.stringify({ text: "API key not configured." }) };

  let messages;
  try {
    const body = JSON.parse(event.body || "{}");
    messages = body.messages;
  } catch {
    return { statusCode: 400, headers, body: JSON.stringify({ error: "Invalid request body" }) };
  }
  if (!messages) return { statusCode: 400, headers, body: JSON.stringify({ error: "messages required" }) };

  try {
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
        "HTTP-Referer": "https://nse-vault.netlify.app",
        "X-Title": "NSE Vault",
      },
      body: JSON.stringify({ model: "openrouter/free", messages, max_tokens: 1000 }),
    });

    const data = await response.json();
    if (data.error) return { statusCode: 200, headers, body: JSON.stringify({ text: "AI advisor unavailable right now. Please try again." }) };
    const text = data.choices?.[0]?.message?.content || "Analysis unavailable.";
    return { statusCode: 200, headers, body: JSON.stringify({ text }) };
  } catch (e) {
    return { statusCode: 500, headers, body: JSON.stringify({ text: "Could not connect. Please try again." }) };
  }
};
