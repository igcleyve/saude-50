(function () {
  var KM = 'ma_meds', KL = 'ma_log';
  var $ = function (id) { return document.getElementById(id); };

  /* ---------- Armazenamento (localStorage) ---------- */
  function ler(k, padrao) {
    try { return JSON.parse(localStorage.getItem(k)) || padrao; } catch (e) { return padrao; }
  }
  function gravar(k, v) {
    try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {}
  }
  var meds = ler(KM, []);   // [{id, nome, dose, hora}]
  var log = ler(KL, {});    // {'2026-09-30': {idDoRemedio: 'HH:MM'}}
  var avisados = {};        // avisos já mostrados nesta sessão

  /* ---------- Utilidades ---------- */
  function pad(n) { return (n < 10 ? '0' : '') + n; }
  function chave(d) { return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); }
  function horaAgora() { var d = new Date(); return pad(d.getHours()) + ':' + pad(d.getMinutes()); }
  function esc(s) { var p = document.createElement('p'); p.textContent = s; return p.innerHTML; }
  function ordenados() { return meds.slice().sort(function (a, b) { return a.hora < b.hora ? -1 : a.hora > b.hora ? 1 : 0; }); }

  /* ---------- Hoje ---------- */
  function renderHoje() {
    var reg = log[chave(new Date())] || {}, lista = $('lista-hoje'), tomadas = 0;
    $('data-hoje').textContent = new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' });

    if (!meds.length) {
      lista.innerHTML = '<li class="text-xl">Nenhum remédio cadastrado ainda. Use o formulário abaixo para começar.</li>';
      $('resumo-hoje').textContent = '';
      return;
    }
    lista.innerHTML = ordenados().map(function (m) {
      var tomado = reg[m.id], atrasado = !tomado && m.hora < horaAgora();
      if (tomado) tomadas++;
      var estado = tomado ? 'Tomado às ' + tomado : (atrasado ? 'Atrasado' : 'Aguardando');
      return '<li class="rounded-2xl border-2 border-ink p-5 flex flex-wrap items-center justify-between gap-4' + (tomado ? ' bg-mist' : '') + '">' +
        '<div><p class="text-2xl font-bold">' + esc(m.nome) + '</p>' +
        '<p class="text-lg text-soft">' + esc(m.dose) + ' · às ' + m.hora + '</p>' +
        '<p class="text-lg font-bold">' + estado + '</p></div>' +
        '<button type="button" class="btn ' + (tomado ? 'bg-white text-ink border-2 border-ink' : 'bg-teal text-white') +
        '" data-acao="' + (tomado ? 'desfazer' : 'tomar') + '" data-id="' + m.id + '">' +
        (tomado ? 'Desfazer' : 'Já tomei') + '</button></li>';
    }).join('');
    $('resumo-hoje').textContent = tomadas + ' de ' + meds.length + ' doses registradas hoje.';
  }

  function marcar(id, tomou) {
    var k = chave(new Date());
    log[k] = log[k] || {};
    if (tomou) log[k][id] = horaAgora(); else delete log[k][id];
    gravar(KL, log);
    renderTudo();
  }

  $('lista-hoje').addEventListener('click', function (e) {
    var b = e.target.closest('button[data-id]');
    if (b) marcar(b.dataset.id, b.dataset.acao === 'tomar');
  });

  /* ---------- Semana ---------- */
  function renderSemana() {
    var ids = meds.map(function (m) { return m.id; }), html = '';
    for (var i = 6; i >= 0; i--) {
      var d = new Date(); d.setDate(d.getDate() - i);
      var reg = log[chave(d)] || {};
      var feitas = ids.filter(function (id) { return reg[id]; }).length;
      var pct = ids.length ? Math.round(feitas / ids.length * 100) : 0;
      var nome = i === 0 ? 'Hoje' : d.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'numeric' });
      html += '<li><div class="flex flex-wrap justify-between gap-2 text-xl"><span class="font-bold capitalize">' + nome + '</span>' +
        '<span>' + (ids.length ? feitas + ' de ' + ids.length + ' doses' : 'Sem remédios cadastrados') + '</span></div>' +
        '<div class="mt-2 h-5 rounded-full border-2 border-ink bg-white overflow-hidden" aria-hidden="true">' +
        '<div class="h-full bg-teal" style="width:' + pct + '%"></div></div></li>';
    }
    $('lista-semana').innerHTML = html;
  }

  /* ---------- Cadastro ---------- */
  function renderCadastro() {
    $('lista-cadastro').innerHTML = meds.length ? ordenados().map(function (m) {
      return '<li class="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-white border-2 border-ink p-4 text-lg">' +
        '<span><strong>' + esc(m.nome) + '</strong> · ' + esc(m.dose) + ' · às ' + m.hora + '</span>' +
        '<button type="button" class="btn !min-h-[48px] !px-4 bg-white text-ink border-2 border-ink" data-remover="' + m.id +
        '" aria-label="Remover ' + esc(m.nome) + ' das ' + m.hora + '">Remover</button></li>';
    }).join('') : '<li class="text-lg">Ainda não há remédios cadastrados.</li>';
  }

  $('lista-cadastro').addEventListener('click', function (e) {
    var b = e.target.closest('button[data-remover]');
    if (!b || !confirm('Remover este remédio da lista?')) return;
    meds = meds.filter(function (m) { return m.id !== b.dataset.remover; });
    gravar(KM, meds);
    renderTudo();
  });

  $('form-med').addEventListener('submit', function (e) {
    e.preventDefault();
    var campos = {
      nome: function (v) { return v.trim().length >= 2 ? '' : 'Digite o nome do remédio.'; },
      dose: function (v) { return v.trim() ? '' : 'Digite a quantidade, como está na receita.'; },
      hora: function (v) { return v ? '' : 'Escolha o horário.'; }
    }, primeiro = null;

    Object.keys(campos).forEach(function (id) {
      var el = $(id), msg = campos[id](el.value);
      $('erro-' + id).textContent = msg;
      el.setAttribute('aria-invalid', msg ? 'true' : 'false');
      if (msg && !primeiro) primeiro = el;
    });
    if (primeiro) { $('form-status').textContent = 'Corrija os campos indicados.'; primeiro.focus(); return; }

    meds.push({ id: Date.now().toString(36), nome: $('nome').value.trim(), dose: $('dose').value.trim(), hora: $('hora').value });
    gravar(KM, meds);
    $('form-status').textContent = $('nome').value.trim() + ' foi salvo. Ele aparece na lista de hoje.';
    $('form-med').reset();
    renderTudo();
  });

  /* ---------- Aviso na hora do remédio ---------- */
  var alertaId = null;

  function bipe() {
    try {
      var ctx = new (window.AudioContext || window.webkitAudioContext)();
      [0, 0.5, 1].forEach(function (t) {
        var o = ctx.createOscillator(), g = ctx.createGain();
        o.frequency.value = 880; o.connect(g); g.connect(ctx.destination);
        g.gain.value = 0.2; o.start(ctx.currentTime + t); o.stop(ctx.currentTime + t + 0.3);
      });
    } catch (e) {}
  }

  function avisar(m) {
    alertaId = m.id;
    $('alerta-texto').textContent = 'Hora do remédio: ' + m.nome + ' (' + m.dose + '), às ' + m.hora + '.';
    $('alerta').classList.remove('hidden');
    bipe();
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('Hora do remédio', { body: m.nome + ' — ' + m.dose });
    }
  }

  function verificar() {
    var k = chave(new Date()), reg = log[k] || {}, agora = horaAgora();
    meds.forEach(function (m) {
      var marca = k + m.id + m.hora;
      if (m.hora === agora && !reg[m.id] && !avisados[marca]) { avisados[marca] = true; avisar(m); }
    });
    renderHoje();
  }

  $('alerta-fechar').addEventListener('click', function () { $('alerta').classList.add('hidden'); });
  $('alerta-tomei').addEventListener('click', function () {
    if (alertaId) marcar(alertaId, true);
    $('alerta').classList.add('hidden');
  });

  $('ativar-avisos').addEventListener('click', function () {
    var st = $('avisos-status');
    if (!('Notification' in window)) { st.textContent = 'Este navegador não oferece avisos. Os avisos na tela continuam funcionando.'; return; }
    Notification.requestPermission().then(function (r) {
      st.textContent = r === 'granted' ? 'Avisos do navegador ativados.' : 'Avisos do navegador não foram ativados.';
    });
  });

  /* ---------- Dados e tamanho da letra ---------- */
  $('apagar').addEventListener('click', function () {
    if (!confirm('Apagar todos os remédios e o histórico deste aparelho? Isso não pode ser desfeito.')) return;
    meds = []; log = {};
    try { localStorage.removeItem(KM); localStorage.removeItem(KL); } catch (e) {}
    renderTudo();
  });

  var tam = 112.5;
  function letra(v) { tam = Math.max(100, Math.min(150, v)); document.documentElement.style.fontSize = tam + '%'; }
  $('mais').addEventListener('click', function () { letra(tam + 12.5); });
  $('menos').addEventListener('click', function () { letra(tam - 12.5); });

  function renderTudo() { renderHoje(); renderCadastro(); renderSemana(); }
  renderTudo();
  setInterval(verificar, 20000);
})();