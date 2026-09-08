/* ==========================================================================
   ANIMAÇÕES — disparo

   Só faz três coisas: mede o quanto da página já foi lida, marca elementos
   como "vistos" quando entram na tela, e injeta a trilha do Método. Todo o
   movimento em si está no CSS.

   Sem GSAP de propósito: tudo aqui são transições e keyframes que o próprio
   navegador roda na GPU, e o IntersectionObserver custa perto de zero.
   Puxar uma biblioteca de animação por CDN pra fazer o mesmo somaria peso e
   uma requisição bloqueante num site cujo argumento de venda é acabamento.
   ========================================================================== */
(function(){
  'use strict';

  var menosMovimento = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- 1. fio de progresso ---------- */

  function fioDeProgresso(){
    if(menosMovimento) return;

    var fio = document.createElement('div');
    fio.className = 'fio-progresso';
    fio.setAttribute('aria-hidden', 'true');
    document.body.appendChild(fio);

    var agendado = false;

    function medir(){
      agendado = false;
      var altura = document.documentElement.scrollHeight - window.innerHeight;
      var lido = altura > 0 ? window.scrollY / altura : 0;
      fio.style.setProperty('--lido', Math.min(1, Math.max(0, lido)));
    }

    /* rAF pra não recalcular a cada evento de scroll — a home já tem duas
       dobras presas ao scroll, não vale somar trabalho por frame */
    window.addEventListener('scroll', function(){
      if(!agendado){ agendado = true; requestAnimationFrame(medir); }
    }, { passive: true });
    window.addEventListener('resize', medir);
    medir();
  }

  /* ---------- 2. marcar o que entrou na tela ---------- */

  function revelar(){
    var alvos = document.querySelectorAll('.frente, .etapa, [data-anima]');
    if(!alvos.length) return;

    if(menosMovimento || !('IntersectionObserver' in window)){
      alvos.forEach(function(el){ el.classList.add('is-vista'); });
      return;
    }

    var observador = new IntersectionObserver(function(entradas){
      entradas.forEach(function(e){
        if(!e.isIntersecting) return;
        e.target.classList.add('is-vista');
        observador.unobserve(e.target);   /* anima uma vez só */
      });
    }, { threshold: 0.2, rootMargin: '0px 0px -8% 0px' });

    alvos.forEach(function(el){ observador.observe(el); });
  }

  /* ---------- 3. trilha do Método ---------- */

  /* Os cartões do Método são absolutos e empilhados pelo scroll, então não
     dá pra pendurar a trilha neles. Ela entra no bloco do título, que fica
     parado, e é alimentada pelo --progresso que o scroll da dobra escreve
     na seção. */
  function trilhaDoMetodo(){
    var secao = document.querySelector('.pedido-section');
    var titulo = secao ? secao.querySelector('.pedido-titulo') : null;
    if(!secao || !titulo) return;

    var etapas = secao.querySelectorAll('.etapa').length;
    if(etapas < 2) return;

    var trilha = document.createElement('div');
    trilha.className = 'metodo-trilha';
    trilha.setAttribute('aria-hidden', 'true');
    for(var i = 0; i < etapas; i++){
      var no = document.createElement('span');
      no.className = 'metodo-no';
      trilha.appendChild(no);
    }
    titulo.appendChild(trilha);

    var nos = [].slice.call(trilha.querySelectorAll('.metodo-no'));

    /* o primeiro nó já nasce alcançado: a etapa 01 está visível desde que
       a dobra entra na tela */
    function pintar(){
      var p = parseFloat(getComputedStyle(secao).getPropertyValue('--progresso')) || 0;
      var alcancados = Math.round(p * (etapas - 1));
      nos.forEach(function(no, i){
        no.classList.toggle('is-alcancado', i <= alcancados);
      });
    }

    /* sem pin (tablet, mobile ou movimento reduzido) os quatro cartões já
       estão todos à mostra, então a trilha nasce completa */
    if(secao.classList.contains('no-scrub') || menosMovimento){
      secao.style.setProperty('--progresso', 1);
      pintar();
      return;
    }

    var agendado = false;
    window.addEventListener('scroll', function(){
      if(!agendado){
        agendado = true;
        requestAnimationFrame(function(){ agendado = false; pintar(); });
      }
    }, { passive: true });
    pintar();
  }

  /* ---------- 4. medida do marquee ----------
     A faixa rola metade da própria largura (o conteúdo é duplicado). Em
     porcentagem isso depende do tamanho da caixa, e o Chrome não consegue
     compor a animação — ela volta pra main thread a cada quadro. Medindo
     em px e entregando pela variável, a mesma animação roda na GPU. */
  function medirMarquee(){
    var faixas = document.querySelectorAll('.sobre-marquee-track');
    if(!faixas.length) return;

    function medir(){
      faixas.forEach(function(f){
        f.style.setProperty('--marquee', '-' + Math.round(f.scrollWidth / 2) + 'px');
      });
    }

    medir();
    // as fontes mudam a largura do texto; remede quando elas chegam
    if(document.fonts && document.fonts.ready) document.fonts.ready.then(medir);
    var t;
    window.addEventListener('resize', function(){ clearTimeout(t); t = setTimeout(medir, 150); });
  }

  function iniciar(){
    fioDeProgresso();
    revelar();
    trilhaDoMetodo();
    medirMarquee();
  }

  if(document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', iniciar);
  } else {
    iniciar();
  }
})();
