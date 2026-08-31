/*
 * Reisblik 8.0 — Backup module
 * Stap 2: backupvenster.
 * De daadwerkelijke backupfunctionaliteit wordt in volgende stappen toegevoegd.
 */
(function () {
  "use strict";

  const openButton = document.getElementById("backupOpenBtn");
  const modal = document.getElementById("backupModal");
  const closeButton = document.getElementById("backupCloseBtn");
  const createButton = document.getElementById("backupCreateBtn");
  const status = document.getElementById("backupStatus");

  if (!openButton || !modal || !closeButton || !createButton) return;

  function openBackup() {
    modal.style.display = "block";
    if (status) status.textContent = "";
    openButton.setAttribute("aria-expanded", "true");
  }

  function closeBackup() {
    modal.style.display = "none";
    openButton.setAttribute("aria-expanded", "false");
  }

  openButton.setAttribute("aria-expanded", "false");
  openButton.addEventListener("click", openBackup);
  closeButton.addEventListener("click", closeBackup);

  modal.addEventListener("click", function (event) {
    if (event.target === modal) closeBackup();
  });

  document.addEventListener("keydown", function (event) {
    if (event.key === "Escape" && modal.style.display !== "none") {
      closeBackup();
    }
  });

  createButton.addEventListener("click", function () {
    if (status) {
      status.textContent = "Backup maken wordt in stap 3 toegevoegd.";
    }
  });
})();
