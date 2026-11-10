document.addEventListener("DOMContentLoaded", async () => {
  const form = document.getElementById("caseForm");
  if (!form) return;
  const message = document.getElementById("caseMsg");
  try {
    if (window.chainRestoreAgeGate && !(await window.chainRestoreAgeGate())) return;
    const session = await window.hatchable.auth.getSession();
    if (!session || !session.user) {
      message.textContent = "Sign in is required before a private case can be saved.";
    }
  } catch (_) { message.textContent = "Age check or account verification is required before submitting a case."; return; }
  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    try {
      if (window.chainRestoreAgeGate && !(await window.chainRestoreAgeGate())) return;
      const current = await window.hatchable.auth.getSession();
      if (!current || !current.user) {
        location.href = "/login?next=" + encodeURIComponent("/recovery.html");
        return;
      }
      const payload = {
        network: document.getElementById("network").value,
        incident_type: document.getElementById("type").value,
        public_reference: document.getElementById("tx").value,
        incident_date: document.getElementById("date").value || null,
        details: document.getElementById("details").value
      };
      message.textContent = "Saving your private case…";
      const response = await fetch("/api/cases/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "The case could not be saved.");
      message.textContent = "Case saved. Reference: " + data.case.id + ". Status: " + data.case.status + ".";
      form.reset();
    } catch (error) {
      message.textContent = error.message || "Something went wrong. Please try again.";
    }
  });
});