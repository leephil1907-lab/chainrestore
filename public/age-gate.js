(() => {
  const KEY = "chainrestore_age_ok";
  function ageFromDate(value) {
    const birth = new Date(value + "T00:00:00");
    if (!value || Number.isNaN(birth.getTime()) || birth > new Date()) return null;
    const now = new Date();
    let age = now.getFullYear() - birth.getFullYear();
    if (now.getMonth() < birth.getMonth() || (now.getMonth() === birth.getMonth() && now.getDate() < birth.getDate())) age--;
    return age;
  }
  window.chainRestoreAgeGate = function () {
    try { if (sessionStorage.getItem(KEY) === "1") return Promise.resolve(true); } catch (_) {}
    return new Promise(resolve => {
      const style = document.createElement("style");
      style.textContent = ".cr-age-shield{position:fixed;inset:0;z-index:99999;display:grid;place-items:center;padding:18px;background:rgba(4,9,13,.96);backdrop-filter:blur(18px)}.cr-age-card{width:min(440px,100%);padding:28px;border:1px solid rgba(145,232,197,.2);border-radius:22px;background:linear-gradient(145deg,#1a2b35,#0e1920);box-shadow:10px 10px 28px #0008,-5px -5px 16px #ffffff08;color:#edf5f2}.cr-age-card h2{font-size:26px;margin:16px 0 8px}.cr-age-card p{color:#9aadb0;line-height:1.65;font-size:14px}.cr-age-card label{display:block;margin:18px 0 7px;font-weight:650;font-size:13px}.cr-age-card input{width:100%;height:49px;padding:0 13px;border-radius:12px;border:1px solid rgba(190,218,220,.2);background:#08131b;color:#edf5f2;font:inherit}.cr-age-card button{width:100%;height:48px;margin-top:14px;border:0;border-radius:12px;background:linear-gradient(145deg,#a8f4d7,#48bd96);color:#082017;font-weight:700}.cr-age-error{display:none;margin-top:14px;padding:13px;border-radius:12px;background:#b38b2518;border:1px solid #d8bd8266;color:#f0dcae;font-size:13px;line-height:1.6}";
      document.head.appendChild(style);
      const shield = document.createElement("div");
      shield.className = "cr-age-shield";
      shield.innerHTML = '<section class="cr-age-card" role="dialog" aria-modal="true" aria-labelledby="crAgeTitle"><div style="font-size:12px;letter-spacing:.14em;color:#91e8c5;text-transform:uppercase">ChainRestore · Age check</div><h2 id="crAgeTitle">Before you continue</h2><p>ChainRestore is not intended for children under 13. Your date of birth is checked in this page only and is not sent to or stored by ChainRestore.</p><label for="crBirth">Date of birth</label><input id="crBirth" type="date" autocomplete="off" max="' + new Date().toISOString().slice(0,10) + '"><button id="crAgeContinue" type="button">Continue</button><div id="crAgeError" class="cr-age-error" role="alert"></div></section>';
      document.body.appendChild(shield);
      const input = shield.querySelector("#crBirth");
      const error = shield.querySelector("#crAgeError");
      shield.querySelector("#crAgeContinue").addEventListener("click", () => {
        const age = ageFromDate(input.value);
        if (age === null) { error.textContent = "Enter a valid date of birth."; error.style.display = "block"; return; }
        if (age < 13) {
          error.textContent = "Access is blocked because ChainRestore is not intended for anyone under 13. No sign-in request or member-data request has been made, and your date of birth has not been saved.";
          error.style.display = "block";
          return;
        }
        try { sessionStorage.setItem(KEY, "1"); } catch (_) {}
        shield.remove();
        resolve(true);
      });
    });
  };
})();