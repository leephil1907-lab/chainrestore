import { db } from "hatchable";

export const access = "user";
export const methods = ["POST"];

const allowedNetworks = new Set(["Bitcoin","Ethereum","BNB Chain","Solana","TRON","XRP Ledger","Polygon","Avalanche","Other"]);
const allowedTypes = new Set(["Unauthorised transfer","Investment or impersonation scam","Exchange account compromise","Phishing or malicious approval","Other / unsure"]);

export default async function (req, res) {
  const body = req.body || {};
  const network = String(body.network || "").trim();
  const incidentType = String(body.incident_type || "").trim();
  const reference = String(body.public_reference || "").trim().slice(0,180);
  const incidentDate = body.incident_date ? String(body.incident_date).slice(0,10) : null;
  const details = String(body.details || "").trim().slice(0,5000);
  if (!allowedNetworks.has(network) || !allowedTypes.has(incidentType) || details.length < 12) {
    return res.status(400).json({ error: "Please provide a valid network, incident type and at least 12 characters of incident detail." });
  }
  if (incidentDate && !/^\d{4}-\d{2}-\d{2}$/.test(incidentDate)) {
    return res.status(400).json({ error: "The incident date is invalid." });
  }
  if (/seed phrase|private key|recovery phrase|password/i.test(details)) {
    return res.status(400).json({ error: "Remove any secret wallet credentials before submitting. Public transaction references are sufficient." });
  }
  const result = await db.query(
    "INSERT INTO case_reports (user_id, network, incident_type, public_reference, incident_date, details) VALUES ($1,$2,$3,$4,$5,$6) RETURNING id, status, created_at",
    [req.user.id, network, incidentType, reference || null, incidentDate, details]
  );
  return res.status(201).json({ ok: true, case: result.rows[0] });
}