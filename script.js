(function () {
  var size = 112.5, root = document.documentElement;
  function set(v) { size = Math.max(100, Math.min(150, v)); root.style.fontSize = size + '%'; }
  document.getElementById('mais').addEventListener('click', function () { set(size + 12.5); });
  document.getElementById('menos').addEventListener('click', function () { set(size - 12.5); });
})();
