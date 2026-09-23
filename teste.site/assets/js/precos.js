/* ==========================================================================
   TABELA DE PREÇOS — busca e filtro

   São 64 serviços em 6 categorias. Sem um jeito de achar o que interessa,
   a pessoa rola a página inteira procurando com o olho.

   Todos os cartões já vêm no HTML: sem JS, a página continua completa e
   legível. Isto aqui só esconde o que não interessa.
   ========================================================================== */
(function(){
  'use strict';

  var campo    = document.querySelector('.precos-busca input');
  var limpar   = document.querySelector('.precos-limpar');
  var chips    = [].slice.call(document.querySelectorAll('.precos-chip'));
  var cats     = [].slice.call(document.querySelectorAll('.precos-cat'));
  var vazio    = document.querySelector('.precos-vazio');
  var contagem = document.querySelector('.precos-contagem');
  if(!campo || !cats.length) return;

  /* sem acento e em minúscula dos dois lados: quem digita "grafico"
     precisa achar "gráfico", e quem digita "Thumbnail" precisa achar
     "thumbnail" */
  function normalizar(t){
    return t.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
  }

  /* o texto de busca de cada cartão é montado uma vez só, aqui. Fazer isso
     a cada tecla obrigaria a ler o DOM de 64 cartões por caractere. */
  var itens = [];
  cats.forEach(function(cat){
    [].slice.call(cat.querySelectorAll('.precos-card')).forEach(function(card){
      itens.push({ el: card, cat: cat, texto: normalizar(card.textContent) });
    });
  });

  var total = itens.length;
  var categoriaAtiva = 'tudo';

  function filtrar(){
    var termo = normalizar(campo.value.trim());
    var termos = termo ? termo.split(/\s+/) : [];
    var visiveis = 0;

    itens.forEach(function(i){
      var daCategoria = categoriaAtiva === 'tudo' || i.cat.id === categoriaAtiva;
      /* todos os termos precisam bater, em qualquer ordem: "banner pack"
         acha o cartão que tem as duas palavras */
      var bate = termos.every(function(t){ return i.texto.indexOf(t) !== -1; });
      var mostrar = daCategoria && bate;
      i.el.hidden = !mostrar;
      if(mostrar) visiveis++;
    });

    /* categoria sem nenhum cartão visível sai de cena inteira, com título e
       tudo — senão sobra um cabeçalho órfão sobre um espaço vazio */
    cats.forEach(function(cat){
      var alguma = [].slice.call(cat.querySelectorAll('.precos-card')).some(function(c){ return !c.hidden; });
      cat.hidden = !alguma;
    });

    vazio.classList.toggle('is-visivel', visiveis === 0);
    limpar.classList.toggle('is-visivel', campo.value !== '');
    contagem.textContent = visiveis === total
      ? total + ' serviços'
      : visiveis + ' de ' + total + ' serviços';
  }

  campo.addEventListener('input', filtrar);

  campo.addEventListener('keydown', function(e){
    if(e.key === 'Escape'){ campo.value = ''; filtrar(); }
  });

  limpar.addEventListener('click', function(){
    campo.value = '';
    campo.focus();
    filtrar();
  });

  chips.forEach(function(chip){
    chip.addEventListener('click', function(){
      categoriaAtiva = chip.dataset.cat;
      chips.forEach(function(c){
        var ativo = c === chip;
        c.classList.toggle('is-ativo', ativo);
        c.setAttribute('aria-pressed', ativo ? 'true' : 'false');
      });
      filtrar();
    });
  });

  /* ---------- altura do menu ----------
     As âncoras das categorias precisam parar abaixo do menu, que é sticky
     e muda de altura entre desktop, tablet e celular. Em vez de chutar um
     valor por breakpoint, a altura real é medida e entregue pela variável. */
  function medirTopo(){
    var cabecalho = document.querySelector('.header-wrap');
    if(!cabecalho) return;
    document.documentElement.style.setProperty('--topo-header', Math.round(cabecalho.getBoundingClientRect().height) + 'px');
  }

  medirTopo();
  if(document.fonts && document.fonts.ready) document.fonts.ready.then(medirTopo);
  var remedir;
  window.addEventListener('resize', function(){ clearTimeout(remedir); remedir = setTimeout(medirTopo, 150); });

  filtrar();
})();
