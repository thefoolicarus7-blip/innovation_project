import dotenv from "dotenv";

dotenv.config({ path: "./.env" });

const key = process.env.GEMINI_API_KEY;

async function testModel(modelName: string) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${key}`;
  console.log("Testing:", modelName);
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: "Hello" }] }],
    })
  });
  console.log(modelName, response.status, response.statusText);
  if (!response.ok) {
    const text = await response.text();
    console.log("Error:", text);
  }
}

async function main() {
  await testModel("gemini-1.5-flash");
  await testModel("gemini-pro");
  await testModel("gemini-1.5-pro");
  
  // Also try to list models
  const listUrl = `https://generativelanguage.googleapis.com/v1beta/models?key=${key}`;
  const res = await fetch(listUrl);
  if (res.ok) {
    const data = await res.json();
    console.log("Available models:", data.models.map((m: any) => m.name));
  } else {
    console.log("List models error:", await res.text());
  }
}

main();
