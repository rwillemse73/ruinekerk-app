/*
 * Reisblik 8.0.9 — Backup content
 * Stap 3: alleen persoonlijke/lokale Reisblik-content verzamelen.
 * Vaste HTML-content en applicatiebestanden worden NIET geback-upt.
 */
(function () {
  "use strict";

  const BACKUP_KEYS = [
    { key: "reisblik_visited_v1", label: "Bezocht" },
    { key: "ruinekerk_extra_info_v1", label: "Extra informatie" },
    { key: "ruinekerk_extra_simple_v1", label: "Eenvoudige Extra informatie" },
    { key: "ruinekerk_notes_v1", label: "Persoonlijke notities en ervaringen" },
    { key: "ruinekerk_user_locations_v1", label: "Eigen locaties" },
    { key: "reisblik_agenda_evenementen_v1", label: "Mijn agenda evenementen" }
  ];

  function readLocalValue(key) {
    const raw = localStorage.getItem(key);
    if (raw === null) return null;
    try {
      return JSON.parse(raw);
    } catch (e) {
      return raw;
    }
  }

  function countItems(value) {
    if (Array.isArray(value)) return value.length;
    if (value && typeof value === "object") {
      return Object.values(value).reduce(function (total, item) {
        if (Array.isArray(item)) return total + item.length;
        return total + 1;
      }, 0);
    }
    return value === null ? 0 : 1;
  }

  function makeBackupData() {
    const data = {};
    let total = 0;

    BACKUP_KEYS.forEach(function (item) {
      const value = readLocalValue(item.key);
      data[item.key] = value;
      total += countItems(value);
    });

    return {
      backupFormatVersion: "1.0",
      applicationVersion: "8.8.9",
      backupType: "Reisblik persoonlijke lokale content",
      backupCreatedAt: new Date().toISOString(),
      includes: [
        "Bezocht en bezoekdatum/tijd",
        "Extra informatie",
        "Eenvoudige Extra informatie",
        "Persoonlijke notities en ervaringen",
        "Eigen locaties en hun locatiegegevens",
        "Mijn agenda: permanent bewaarde evenementen"
      ],
      excludes: [
        "Vaste HTML-content",
        "Applicatiebestanden"
      ],
      data: data,
      summary: {
        categories: BACKUP_KEYS.map(function (item) {
          const value = data[item.key];
          return {
            name: item.label,
            storageKey: item.key,
            itemCount: countItems(value),
            present: value !== null
          };
        }),
        totalItems: total
      }
    };
  }

  function fileDate() {
    const d = new Date();
    const pad = function (n) { return String(n).padStart(2, "0"); };
    return d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate()) +
      "_" + pad(d.getHours()) + "-" + pad(d.getMinutes());
  }

  function validateBackup(backup) {
    const required = ["backupFormatVersion", "applicationVersion", "backupType", "backupCreatedAt", "includes", "excludes", "data", "summary"];
    const missing = required.filter(function (key) { return !(key in backup); });
    if (missing.length) {
      throw new Error("Ontbrekende backupvelden: " + missing.join(", "));
    }
    if (backup.backupType !== "Reisblik persoonlijke lokale content") {
      throw new Error("Onjuiste backupsoort");
    }
    if (!backup.data || typeof backup.data !== "object") {
      throw new Error("Backupgegevens ontbreken");
    }
    if (!backup.summary || !Array.isArray(backup.summary.categories)) {
      throw new Error("Backupsamenvatting ontbreekt");
    }
    JSON.stringify(backup);
    return true;
  }

  function downloadBackup() {
    const backup = makeBackupData();
    validateBackup(backup);
    const json = JSON.stringify(backup, null, 2);
    const blob = new Blob([json], { type: "application/json;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "Reisblik_content_backup_" + fileDate() + ".json";
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
    return backup;
  }

  function initBackupUi() {
    const openButton = document.getElementById("backupOpenBtn");
    const modal = document.getElementById("backupModal");
    const closeButton = document.getElementById("backupCloseBtn");
    const createButton = document.getElementById("backupCreateBtn");
    const status = document.getElementById("backupStatus");

    if (!openButton || !modal || !closeButton || !createButton) return;
    if (openButton.dataset.backupBound === "true") return;
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
      if (event.target === modal) closeBackup();
    });

    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape" && modal.style.display !== "none") closeBackup();
    });

    createButton.addEventListener("click", function () {
      try {
        const backup = downloadBackup();
        if (status) {
          const present = backup.summary.categories.filter(function (c) { return c.present; }).length;
          status.textContent = "✅ Backup gecontroleerd en gemaakt: " + backup.summary.totalItems +
            " gegevensitems in " + present + " aanwezige categorie(ën).";
        }
      } catch (error) {
        console.error("Reisblik backup mislukt", error);
        if (status) status.textContent = "⚠️ Backup maken is niet gelukt.";
      }
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initBackupUi, { once: true });
  } else {
    initBackupUi();
  }
})();
