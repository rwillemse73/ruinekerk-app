/*
 * Reisblik 8.0.1 — Backup module
 * Stap 2: backupvenster.
 * De daadwerkelijke backupfunctionaliteit wordt in volgende stappen toegevoegd.
 */
(function () {
  "use strict";

  function initBackupUi() {
    const openButton = document.getElementById("backupOpenBtn");
    const modal = document.getElementById("backupModal");
    const closeButton = document.getElementById("backupCloseBtn");
    const createButton = document.getElementById("backupCreateBtn");
    const status = document.getElementById("backupStatus");

    if (!openButton || !modal || !closeButton || !createButton) {
      return;
    }

    if (openButton.dataset.backupBound === "true") {
      return;
    }
    openButton.dataset.backupBound = "true";

    function openBackup() {
      modal.style.display = "block";
      if (status) status.textContent = "";
      openButton.setAttribute("aria-expanded", "true");
      closeButton.focus();
    }

    function closeBackup() {
      modal.style.display = "none";
      openButton.setAttribute("aria-expanded", "false");
      openButton.focus();
    }

    openButton.setAttribute("aria-expanded", "false");
    openButton.addEventListener("click", openBackup);
    closeButton.addEventListener("click", closeBackup);

    modal.addEventListener("click", function (event) {
      if (event.target === modal) {
        closeBackup();
      }
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
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initBackupUi, { once: true });
  } else {
    initBackupUi();
  }
})();
