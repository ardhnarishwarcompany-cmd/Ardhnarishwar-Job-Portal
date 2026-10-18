import { connection } from "./models/dbModels.js";

async function check() {
  try {
    const [users] = await connection.promise().query("SELECT id, fullname, email, profileEditStatus, profileEditReason, profileEditRemarks FROM users WHERE role = 'Recruiter'");
    console.log("=== USERS TABLE ===");
    console.log(users);

    const [requests] = await connection.promise().query("SELECT * FROM employer_profile_edit_requests ORDER BY created_at DESC");
    console.log("=== REQUESTS TABLE ===");
    console.log(requests);

    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

check();
