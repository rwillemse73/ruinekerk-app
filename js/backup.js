/*
 * Reisblik 8.0 — Backup module
 * Stap 1: alleen de interfaceknop toevoegen.
 * De daadwerkelijke backupfunctionaliteit wordt in volgende stappen toegevoegd.
 */
(function () {
  "use strict";

  const button = document.getElementById("backupOpenBtn");
  if (!button) return;

  button.addEventListener("click", function () {
    const status = document.getElementById("status");
    if (status) {
      status.textContent = "Backupfunctie 8.0: voorbereiding gestart.";
    }
  });
})();
