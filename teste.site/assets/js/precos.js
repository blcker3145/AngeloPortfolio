/* ==========================================================================
   TABELA DE PREÇOS — busca e filtro

   São ~60 linhas em 6 categorias. Sem um jeito de achar a linha certa, a
   pessoa rola a página inteira procurando com o olho.

   A tabela inteira já vem no HTML: sem JS, a página continua completa e
   legível. Isto aqui só esconde o que não interessa.
   ========================================================================== */
(function(){
  'use strict';

  var campo   = document.querySelector('.precos-busca input');
  var limpar  = document.querySelector('.precos-limpar');
  var chips   = [].slice.call(document.querySelectorAll('.precos-chip'));
  var cats    = [].slice.call(document.querySelectorAll('.precos-cat'));
  var vazio   = document.querySelector('.precos-vazio');
  var contagem= document.querySelector('.precos-contagem');
  if(!campo || !cats.length) return;

  /* o texto de busca de cada linha é montado uma vez só, aqui. Fazer isso a
     cada tecla obrigaria a ler o DOM de 60 linhas por caractere digitado. */
  var linhas = [];
  cats.forEach(function(cat){
    [].slice.call(cat.querySelectorAll('tbody tr')).forEach(function(tr){
      /* a seção 07 são regras de orçamento, não serviços: entra na busca
         (quem procura "urgência" precisa achar) mas fica fora da contagem */
      linhas.push({
        tr: tr,
        cat: cat,
        servico: !cat.classList.contains('precos-regras'),
        texto: normalizar(tr.textContent)
      });
    });
  });

  var total = linhas.filter(function(l){ return l.servico; }).length;
  var categoriaAtiva = 'tudo';

  /* sem acento e em minúscula dos dois lados: quem digita "grafico" precisa
     achar "gráfico", e quem digita "Thumbnail" precisa achar "thumbnail" */
  function normalizar(t){
    return t.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
  }

  function filtrar(){
    var termo = normalizar(campo.value.trim());
    var termos = termo ? termo.split(/\s+/) : [];
    var visiveis = 0;

    linhas.forEach(function(l){
      var daCategoria = categoriaAtiva === 'tudo' || l.cat.id === categoriaAtiva;
      /* todos os termos precisam bater, em qualquer ordem: "banner 500"
         acha a linha que tem as duas coisas */
      var bate = termos.every(function(t){ return l.texto.indexOf(t) !== -1; });
      var mostrar = daCategoria && bate;
      l.tr.hidden = !mostrar;
      if(mostrar && l.servico) visiveis++;
    });

    /* categoria sem nenhuma linha visível sai de cena inteira, com título e
       tudo — senão sobra um cabeçalho órfão sobre uma tabela vazia */
    cats.forEach(function(cat){
      var alguma = [].slice.call(cat.querySelectorAll('tbody tr')).some(function(tr){ return !tr.hidden; });
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

  /* ---------- encaixe da barra sob o menu ----------
     Os dois são sticky no topo. O menu muda de altura entre desktop,
     tablet e celular, então em vez de chutar um valor por breakpoint a
     altura real é medida e entregue pela variável. */
  function medirTopo(){
    var cabecalho = document.querySelector('.header-wrap');
    var barra = document.querySelector('.precos-barra');
    if(!cabecalho) return;

    var alturaMenu = Math.round(cabecalho.getBoundingClientRect().height);
    document.documentElement.style.setProperty('--topo-header', alturaMenu + 'px');

    /* as duas barras somadas dão o quanto uma âncora precisa descer pra o
       título da categoria não parar atrás delas. A barra de filtros quebra
       em duas linhas no celular, então a altura dela também é medida. */
    if(barra){
      var alturaBarra = Math.round(barra.getBoundingClientRect().height);
      document.documentElement.style.setProperty('--topo-total', (alturaMenu + alturaBarra) + 'px');
    }
  }

  medirTopo();
  if(document.fonts && document.fonts.ready) document.fonts.ready.then(medirTopo);
  var remedir;
  window.addEventListener('resize', function(){ clearTimeout(remedir); remedir = setTimeout(medirTopo, 150); });

  filtrar();
})();
