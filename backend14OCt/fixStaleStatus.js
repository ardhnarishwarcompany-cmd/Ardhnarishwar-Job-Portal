import { connection } from "./models/dbModels.js";

async function fix() {
  try {
    await connection.promise().query("ALTER TABLE employer_profile_edit_requests MODIFY COLUMN status ENUM('pending','approved','rejected','completed') DEFAULT 'pending'");
    await connection.promise().query("UPDATE users SET profileEditStatus = 'none', profileEditReason = NULL, profileEditRemarks = NULL WHERE profileEditStatus = 'approved' OR profileEditStatus IS NULL");
    await connection.promise().query("UPDATE employer_profile_edit_requests SET status = 'completed' WHERE status = 'approved'");
    console.log("Database schema & status cleaned up successfully!");
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

fix();
