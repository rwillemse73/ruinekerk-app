// Reisblik 8.2 — Zoekfunctie stap 2
// Alleen de zoekpopup. De daadwerkelijke zoekfunctie wordt later toegevoegd.
document.addEventListener("DOMContentLoaded", () => {
  const openBtn = document.getElementById("searchContentBtn");
  const modal = document.getElementById("searchModal");
  const closeBtn = document.getElementById("searchCloseBtn");
  const input = document.getElementById("searchInput");
  const startBtn = document.getElementById("searchStartBtn");
  const status = document.getElementById("searchStatus");

  if (!openBtn || !modal || !closeBtn || !input || !startBtn || !status) return;

  function closeSearch(){
    modal.style.display = "none";
    input.value = "";
    status.textContent = "";
  }

  openBtn.addEventListener("click", () => {
    modal.style.display = "block";
    input.focus();
  });

  closeBtn.addEventListener("click", closeSearch);

  modal.addEventListener("click", (event) => {
    if (event.target === modal) closeSearch();
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && modal.style.display !== "none") closeSearch();
  });

  startBtn.addEventListener("click", () => {
    // Stap 2: alleen interface. Zoeken wordt in stap 3 gebouwd.
    status.textContent = "De zoekfunctie wordt in de volgende stap toegevoegd.";
  });
});
