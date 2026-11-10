import { db } from "hatchable";
export const access = "user";
export const methods = ["GET"];
export default async function (req,res) {
 const result=await db.query("SELECT id, network, incident_type, public_reference, incident_date, status, created_at FROM case_reports WHERE user_id = $1 ORDER BY created_at DESC LIMIT 50",[req.user.id]);
 return res.json({cases:result.rows});
}