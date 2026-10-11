const API = "http://localhost:5000/api";

const ACCOUNTS = [
  { role: "citizen", email: "citizen@demo.in", password: "demo123", expectedRole: "citizen" },
  { role: "surveyor", email: "surveyor@demo.in", password: "demo123", expectedRole: "surveyor" },
  { role: "officer", email: "officer@demo.in", password: "demo123", expectedRole: "officer" },
  { role: "lawyer", email: "lawyer@demo.in", password: "demo123", expectedRole: "lawyer" },
  { role: "admin", email: "admin@demo.in", password: "demo123", expectedRole: "admin" },
];

async function verifyAllLogins() {
  console.log("=== VERIFYING 5 CORE CREDENTIAL LOGINS ===");
  let passed = 0;

  for (const acct of ACCOUNTS) {
    try {
      const res = await fetch(`${API}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: acct.email, password: acct.password, role: acct.role }),
      });
      const data = await res.json();
      if (res.ok && data.success && data.token && data.user) {
        console.log(`[PASS] ${acct.role.toUpperCase()}: ${acct.email} -> Logged in as ${data.user.fullName} (${data.user.role})`);
        passed++;
      } else {
        console.error(`[FAIL] ${acct.role.toUpperCase()}: ${acct.email} ->`, data.message);
      }
    } catch (e) {
      console.error(`[ERROR] ${acct.role.toUpperCase()}:`, e.message);
    }
  }

  console.log(`\nResult: ${passed}/${ACCOUNTS.length} roles logged in successfully.`);
  if (passed !== ACCOUNTS.length) process.exit(1);
}

verifyAllLogins();
