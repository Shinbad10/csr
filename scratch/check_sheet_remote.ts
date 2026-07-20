import "dotenv/config";
import { JWT } from "google-auth-library";

async function main() {
  const raw = process.env.GOOGLE_CREDENTIALS?.trim();
  if (!raw) {
    console.log("No GOOGLE_CREDENTIALS");
    return;
  }
  const json = raw.startsWith("{") ? raw : Buffer.from(raw, "base64").toString("utf8");
  const c = JSON.parse(json);
  const client = new JWT({
    email: c.client_email,
    key: c.private_key,
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });
  const token = (await client.getAccessToken()).token;
  const sheetId = process.env.GOOGLE_SHEET_ID?.trim();
  console.log("Checking sheetId:", sheetId);

  const res = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${sheetId}?fields=sheets.properties.title`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  const meta = await res.json();
  console.log("Sheets in spreadsheet:", meta.sheets?.map((s: any) => s.properties?.title));

  // Check row counts in each tab
  if (meta.sheets) {
    for (const s of meta.sheets) {
      const title = s.properties?.title;
      const rangeRes = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/${encodeURIComponent(title + "!A:A")}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const rangeData = await rangeRes.json();
      console.log(`Tab "${title}" has ${rangeData.values?.length || 0} rows.`);
    }
  }
}
main().catch(console.error);
