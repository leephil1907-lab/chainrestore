document.addEventListener("DOMContentLoaded", async () => {
  const welcome = document.getElementById("welcome");
  const list = document.getElementById("cases");
  try {
    if (window.chainRestoreAgeGate && !(await window.chainRestoreAgeGate())) return;
    const session = await window.hatchable.auth.getSession();
    if (!session || !session.user) {
      location.href = "/login?next=" + encodeURIComponent("/account.html");
      return;
    }
    welcome.textContent = "Signed in as " + session.user.email;
    const response = await fetch("/api/cases/list");
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "Could not load cases.");
    if (!Array.isArray(data.cases)) throw new Error("The case response was not valid.");
    if (!data.cases.length) {
      list.innerHTML = "<p class='muted'>No incident records yet. Open a case to create your first private record.</p>";
    } else {
      list.innerHTML = data.cases.map(item => "<article class='panel glass'><div style='display:flex;justify-content:space-between;gap:12px;flex-wrap:wrap'><strong>" + safe(item.network) + " · " + safe(item.incident_type) + "</strong><span class='eyebrow'>" + safe(item.status) + "</span></div><p class='muted' style='font-size:12px'>Reference: " + safe(item.id) + "</p><p class='muted' style='font-size:12px'>Created: " + new Date(item.created_at).toLocaleString() + "</p></article>").join("");
    }
  } catch (error) { welcome.textContent = error.message || "Account unavailable."; }
  document.getElementById("signout")?.addEventListener("click", async () => {
    await window.hatchable.auth.signOut();
    location.href = "/";
  });
});
function safe(value) { return String(value || "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c])); }