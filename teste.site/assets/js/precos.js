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

    recalcularPrateleiras();
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

/* ==========================================================================
     PRATELEIRAS

     Cada categoria rola pro lado. O trilho já rola sozinho por toque e
     trackpad; isto aqui acrescenta as setas, o arrastar com o mouse e o
     aviso de que ainda tem coisa fora da tela.
     ========================================================================== */
  function prateleiras(){
    cats.forEach(function(cat){
      var carrossel = cat.querySelector('.precos-carrossel');
      var trilho    = cat.querySelector('.precos-trilho');
      var setas     = cat.querySelector('.precos-setas');
      if(!trilho || !carrossel) return;

      var botoes = [].slice.call(setas ? setas.querySelectorAll('.precos-seta') : []);

      /* 1px de folga na comparação: a largura do trilho costuma cair em
         valores fracionados, e sem isso a seta do fim nunca desliga */
      function atualizar(){
        var sobra = trilho.scrollWidth - trilho.clientWidth;
        var rolavel = sobra > 1;

        if(setas) setas.hidden = !rolavel;
        carrossel.classList.toggle('tem-mais', rolavel && trilho.scrollLeft < sobra - 1);

        botoes.forEach(function(b){
          var paraFrente = b.dataset.dir === '1';
          b.disabled = paraFrente ? trilho.scrollLeft >= sobra - 1 : trilho.scrollLeft <= 1;
        });
      }

      /* rola quase uma tela cheia de cada vez, deixando um cartão de
         sobra como referência visual de onde a pessoa estava */
      botoes.forEach(function(b){
        b.addEventListener('click', function(){
          trilho.scrollBy({ left: trilho.clientWidth * 0.8 * Number(b.dataset.dir), behavior: 'smooth' });
        });
      });

      var agendado = false;
      trilho.addEventListener('scroll', function(){
        if(agendado) return;
        agendado = true;
        requestAnimationFrame(function(){ agendado = false; atualizar(); });
      }, { passive: true });

      /* ---------- arrastar com o mouse ----------
         Quem está no desktop sem trackpad não tem como rolar de lado a não
         ser pelas setas. Arrastar resolve, mas precisa distinguir arrasto
         de clique: sem isso, soltar o mouse em cima de um cartão dispararia
         o botão "Solicitar". */
      var arrastando = false, partiuEm = 0, scrollInicial = 0, andou = false;

      trilho.addEventListener('pointerdown', function(e){
        if(e.pointerType !== 'mouse') return;
        arrastando = true; andou = false;
        partiuEm = e.clientX;
        scrollInicial = trilho.scrollLeft;
        /* prende o ponteiro ao trilho: sem isso, arrastar pra fora da
           caixa faz os eventos irem pro elemento de baixo e a rolagem
           trava no meio do gesto */
        try{ trilho.setPointerCapture(e.pointerId); }catch(err){}
      });

      trilho.addEventListener('pointermove', function(e){
        if(!arrastando) return;
        var dx = e.clientX - partiuEm;
        if(Math.abs(dx) > 4){
          andou = true;
          trilho.style.scrollSnapType = 'none';   /* o encaixe atrapalha durante o arrasto */
          trilho.scrollLeft = scrollInicial - dx;
        }
      });

      function soltar(e){
        if(!arrastando) return;
        arrastando = false;
        trilho.style.scrollSnapType = '';
        if(e && e.pointerId !== undefined){
          try{ trilho.releasePointerCapture(e.pointerId); }catch(err){}
        }
      }
      trilho.addEventListener('pointerup', soltar);
      trilho.addEventListener('pointercancel', soltar);
      /* pointerleave saiu daqui: com a captura, sair da caixa não termina
         mais o arrasto — era exatamente isso que travava a rolagem */

      /* o clique que fecha um arrasto não deve virar clique de botão */
      trilho.addEventListener('click', function(e){
        if(andou){ e.preventDefault(); e.stopPropagation(); andou = false; }
      }, true);

      cat._atualizarPrateleira = atualizar;
      atualizar();
    });
  }

  /* depois de filtrar, a prateleira tem outro tamanho: volta pro começo e
     recalcula seta e névoa */
  function recalcularPrateleiras(){
    cats.forEach(function(cat){
      var trilho = cat.querySelector('.precos-trilho');
      if(trilho) trilho.scrollLeft = 0;
      if(cat._atualizarPrateleira) cat._atualizarPrateleira();
    });
  }

  /* ---------- altura do menu ----------
     As âncoras das categorias precisam parar abaixo do menu, que é sticky
     e muda de altura entre desktop, tablet e celular. Em vez de chutar um
     valor por breakpoint, a altura real é medida e entregue pela variável. */
  function medirTopo(){
    var cabecalho = document.querySelector('.header-wrap');
    if(!cabecalho) return;
    document.documentElement.style.setProperty('--topo-header', Math.round(cabecalho.getBoundingClientRect().height) + 'px');
  }

  prateleiras();

  medirTopo();
  if(document.fonts && document.fonts.ready) document.fonts.ready.then(medirTopo);
  /* as fontes mudam a largura dos textos, e com ela a do trilho */
  if(document.fonts && document.fonts.ready) document.fonts.ready.then(recalcularPrateleiras);
  var reajuste;
  window.addEventListener('resize', function(){ clearTimeout(reajuste); reajuste = setTimeout(recalcularPrateleiras, 150); });
  var remedir;
  window.addEventListener('resize', function(){ clearTimeout(remedir); remedir = setTimeout(medirTopo, 150); });

  filtrar();
})();
