/* =========================================
   AMPLIAR IMAGEM · páginas de case

   As imagens do portfólio (galeria, vitrine de peças, showcase e a
   grade do herói) abrem ampliadas numa camada por cima da página.
   O fundo continua visível, só que desfocado — quem faz isso é o
   backdrop-filter no CSS, não uma cortina opaca.

   Dentro da imagem ampliada dá pra navegar pelas outras peças da
   mesma página com as setas (ou as teclas ← →), sem fechar o popup.
   As setas somem sozinhas quando só existe uma imagem no grupo.

   Só entram imagens do trabalho em si: as capas de "outros projetos"
   são links de navegação e continuam levando pra outra página.
========================================= */
(function(){
  const SELETOR = [
    '.case-gallery img',
    '.case-showcase img',
    '.case-hero-img--grid img'
  ].join(', ');

  const imagens = [...document.querySelectorAll(SELETOR)];
  if(!imagens.length) return;

  const caixa = document.createElement('div');
  caixa.className = 'lightbox';
  caixa.setAttribute('role', 'dialog');
  caixa.setAttribute('aria-modal', 'true');
  caixa.setAttribute('aria-hidden', 'true');
  caixa.innerHTML =
    '<button class="lightbox-nav lightbox-prev" type="button" aria-label="Peça anterior">' +
      '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg>' +
    '</button>' +
    '<button class="lightbox-fechar" type="button" aria-label="Fechar imagem ampliada">&#10005;</button>' +
    '<img alt="">' +
    '<button class="lightbox-nav lightbox-next" type="button" aria-label="Próxima peça">' +
      '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>' +
    '</button>';
  document.body.appendChild(caixa);

  const ampliada = caixa.querySelector('img');
  const btnFechar = caixa.querySelector('.lightbox-fechar');
  const btnPrev = caixa.querySelector('.lightbox-prev');
  const btnNext = caixa.querySelector('.lightbox-next');
  let ultimoFoco = null;
  let indiceAtual = 0;

  /* só uma imagem no grupo (caso do Hard Flow): não há pra onde navegar */
  if(imagens.length < 2){
    btnPrev.hidden = true;
    btnNext.hidden = true;
  }

  function mostrar(indice){
    indiceAtual = (indice + imagens.length) % imagens.length;
    const img = imagens[indiceAtual];
    ampliada.src = img.currentSrc || img.src;
    ampliada.alt = img.alt || '';
  }

  function abrir(indice){
    mostrar(indice);
    ultimoFoco = document.activeElement;
    caixa.classList.add('aberto');
    caixa.setAttribute('aria-hidden', 'false');
    /* trava a rolagem do fundo enquanto a imagem está aberta */
    document.body.style.overflow = 'hidden';
    btnFechar.focus();
  }

  function fechar(){
    if(!caixa.classList.contains('aberto')) return;
    caixa.classList.remove('aberto');
    caixa.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    if(ultimoFoco && typeof ultimoFoco.focus === 'function') ultimoFoco.focus();
  }

  imagens.forEach((img, indice) => {
    img.classList.add('zoomavel');
    img.tabIndex = 0;
    img.setAttribute('role', 'button');
    img.addEventListener('click', () => abrir(indice));
    img.addEventListener('keydown', (e) => {
      if(e.key === 'Enter' || e.key === ' '){
        e.preventDefault();
        abrir(indice);
      }
    });
  });

  btnFechar.addEventListener('click', fechar);
  btnPrev.addEventListener('click', (e) => { e.stopPropagation(); mostrar(indiceAtual - 1); });
  btnNext.addEventListener('click', (e) => { e.stopPropagation(); mostrar(indiceAtual + 1); });

  /* clicar no fundo fecha; clicar na própria imagem ou nas setas, não */
  caixa.addEventListener('click', (e) => {
    if(e.target === caixa) fechar();
  });

  document.addEventListener('keydown', (e) => {
    if(!caixa.classList.contains('aberto')) return;
    if(e.key === 'Escape') fechar();
    if(e.key === 'ArrowLeft') mostrar(indiceAtual - 1);
    if(e.key === 'ArrowRight') mostrar(indiceAtual + 1);
  });
})();

/* =========================================
   MENU MOBILE · páginas de case

   Mesmo comportamento do menu da home: no desktop os links da nav ficam
   sempre visíveis e este botão está escondido por CSS, então aqui só o
   que o mobile precisa — abrir e fechar o painel de links.

   O estado mora no `aria-expanded` do botão (o CSS lê ele pra virar o
   hamburger em "x"); a classe no painel é só o liga/desliga.
========================================= */
(function(){
  const botao = document.querySelector('.nav-menu');
  const links = document.querySelector('.nav-links');
  if(!botao || !links) return;

  function fechar(){
    botao.setAttribute('aria-expanded', 'false');
    links.classList.remove('is-aberto');
  }

  botao.addEventListener('click', function(){
    const aberto = botao.getAttribute('aria-expanded') === 'true';
    botao.setAttribute('aria-expanded', String(!aberto));
    links.classList.toggle('is-aberto', !aberto);
  });

  /* clicar num link sai da página: o painel não pode ficar aberto por cima */
  links.addEventListener('click', function(e){
    if(e.target.closest('a')) fechar();
  });

  /* voltar pro desktop com o menu aberto deixaria o `is-aberto` preso */
  window.matchMedia('(min-width: 641px)').addEventListener('change', function(e){
    if(e.matches) fechar();
  });
})();
