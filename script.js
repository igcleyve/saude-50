(function () {
  var size = 112.5, root = document.documentElement;
  function set(v) { size = Math.max(100, Math.min(150, v)); root.style.fontSize = size + '%'; }
  document.getElementById('mais').addEventListener('click', function () { set(size + 12.5); });
  document.getElementById('menos').addEventListener('click', function () { set(size - 12.5); });
})();

/* Desafio: encontre os pares */
(function () {
  var palavras = ['Sol', 'Lua', 'Flor', 'Casa'];
  var grade = document.getElementById('pares-grade');
  var status = document.getElementById('pares-status');
  var abertas = [], tentativas = 0, acertos = 0, travado = false;

  function embaralhar(lista) {
    for (var i = lista.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1)), t = lista[i];
      lista[i] = lista[j]; lista[j] = t;
    }
    return lista;
  }

  function mostrar(b, aberta) {
    b.textContent = aberta ? b.dataset.palavra : '?';
    b.setAttribute('aria-label', aberta
      ? 'Carta ' + b.dataset.n + ': ' + b.dataset.palavra
      : 'Carta ' + b.dataset.n + ', virada para baixo');
  }

  function iniciar() {
    grade.innerHTML = '';
    abertas = []; tentativas = 0; acertos = 0; travado = false;
    status.textContent = 'Toque em duas cartas para encontrar os pares. Tentativas: 0';
    embaralhar(palavras.concat(palavras)).forEach(function (p, i) {
      var b = document.createElement('button');
      b.type = 'button'; b.className = 'carta';
      b.dataset.palavra = p; b.dataset.n = i + 1;
      mostrar(b, false);
      b.addEventListener('click', function () { virar(b); });
      grade.appendChild(b);
    });
  }

  function virar(b) {
    if (travado || b.classList.contains('aberta') || b.classList.contains('par')) return;
    b.classList.add('aberta'); mostrar(b, true); abertas.push(b);
    if (abertas.length < 2) return;

    tentativas++;
    var a = abertas[0], c = abertas[1];
    if (a.dataset.palavra === c.dataset.palavra) {
      [a, c].forEach(function (x) { x.classList.remove('aberta'); x.classList.add('par'); });
      acertos++; abertas = [];
      status.textContent = acertos === palavras.length
        ? 'Parabéns! Você encontrou todos os pares em ' + tentativas + ' tentativas.'
        : 'Muito bem, par encontrado! Tentativas: ' + tentativas;
    } else {
      travado = true;
      status.textContent = 'Não é um par. Tentativas: ' + tentativas;
      setTimeout(function () {
        [a, c].forEach(function (x) { x.classList.remove('aberta'); mostrar(x, false); });
        abertas = []; travado = false;
      }, 1500);
    }
  }

  document.getElementById('pares-reiniciar').addEventListener('click', iniciar);
  iniciar();
})();

/* Formulário de interesse com validação */
(function () {
  var form = document.getElementById('form-teste');
  var regras = {
    nome: function (el) { return el.value.trim().length >= 3 ? '' : 'Digite seu nome completo.'; },
    email: function (el) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(el.value.trim()) ? '' : 'Digite um e-mail válido, como nome@exemplo.com.'; },
    perfil: function (el) { return el.value ? '' : 'Escolha uma das opções.'; },
    aceite: function (el) { return el.checked ? '' : 'Para continuar, marque a caixa de concordância.'; }
  };

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var primeiroErro = null;
    Object.keys(regras).forEach(function (id) {
      var el = document.getElementById(id), msg = regras[id](el);
      document.getElementById('erro-' + id).textContent = msg;
      el.setAttribute('aria-invalid', msg ? 'true' : 'false');
      if (msg && !primeiroErro) primeiroErro = el;
    });

    var st = document.getElementById('form-status');
    if (primeiroErro) {
      st.textContent = 'Corrija os campos indicados e envie novamente.';
      primeiroErro.focus();
      return;
    }
    // TODO: enviar os dados (Formspree, Google Forms, API da pesquisa etc.)
    st.textContent = 'Obrigado, ' + form.elements.nome.value.trim().split(' ')[0] + '! Recebemos seu interesse e a equipe entrará em contato por e-mail.';
    form.reset();
  });
})();