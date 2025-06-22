(() => {
  window.tgl = function(id) {
    const el = document.getElementById(id);
    if (el) el.classList.toggle('show');
  };
})();
