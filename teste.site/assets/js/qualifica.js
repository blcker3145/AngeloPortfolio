/* ==========================================================================
   QUALIFICA — formulário de qualificação em etapas

   Objetivo: quem clica num CTA ("Começar meu projeto", "Solicitar
   orçamento", "Entrar em contato"...) responde 4 perguntas curtas antes de
   cair no WhatsApp. Assim a conversa já começa com contexto: momento,
   problema, tipo de projeto e segmento.

   Uma pergunta por vez, de propósito: pergunta única na tela tem taxa de
   conclusão bem maior que um formulão com tudo aberto, e cada clique já
   avança sozinho pra não custar um segundo a mais do que precisa.

   Injeta a própria marcação no DOM, então basta linkar este arquivo e o
   qualifica.css em qualquer página do site.
   ========================================================================== */
(function(){
  'use strict';

  var WHATSAPP = '5521992268562';   // +55 21 99226-8562

  /* Os dados de contato ficam por último de propósito: a pessoa chega no
     campo do telefone já tendo investido 4 cliques, e a desistência aí é
     muito menor do que se ele fosse a primeira coisa da tela. */
  var PERGUNTAS = [
    {
      chave: 'momento',
      titulo: 'Qual é o seu momento agora?',
      opcoes: [
        'Estou começando do zero',
        'Já tenho marca, mas quero melhorar',
        'Preciso de material para uma campanha',
        'Quero renovar tudo'
      ]
    },
    {
      chave: 'problema',
      titulo: 'O que você mais quer resolver?',
      opcoes: [
        'Minha marca não passa profissionalismo',
        'Meu material não traz cliente',
        'Cada peça tem uma cara diferente',
        'Não sei como me apresentar'
      ]
    },
    {
      chave: 'projeto',
      titulo: 'Que tipo de projeto você precisa?',
      opcoes: [
        'Identidade visual',
        'Landing page ou site',
        'Social media',
        'Ainda não sei, preciso de orientação'
      ]
    },
    {
      chave: 'segmento',
      titulo: 'Em que área o seu negócio atua?',
      opcoes: [
        'Saúde e estética',
        'Serviços e consultoria',
        'Tecnologia',
        'Comércio e varejo',
        'Outro'
      ],
      /* "Outro" abre um campo livre — sem isso a resposta vira uma caixa
         genérica que não qualifica nada. */
      livre: 'Outro'
    },
    {
      chave: 'contato',
      titulo: 'Só falta como te chamar.',
      ajuda: 'Vou te responder por aqui mesmo, no WhatsApp.',
      campos: [
        { nome: 'nome',     rotulo: 'Seu nome',      tipo: 'text' },
        { nome: 'telefone', rotulo: 'Seu WhatsApp',  tipo: 'tel'  }
      ]
    }
  ];

  var respostas = {};
  var atual = 0;
  var overlay = null;
  var focoAnterior = null;

  /* ---------- montagem ---------- */

  function montar(){
    overlay = document.createElement('div');
    overlay.className = 'qz-overlay';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    overlay.setAttribute('aria-label', 'Formulário de orçamento');
    overlay.innerHTML =
      '<div class="qz-card">' +
        '<div class="qz-topo">' +
          '<span class="qz-passo"></span>' +
          '<span class="qz-barra"><i></i></span>' +
          '<button type="button" class="qz-fechar" aria-label="Fechar">&times;</button>' +
        '</div>' +
        '<div class="qz-corpo"></div>' +
        '<div class="qz-rodape">' +
          '<button type="button" class="qz-voltar" hidden>&larr; Voltar</button>' +
          '<button type="button" class="qz-enviar" hidden>Enviar no WhatsApp</button>' +
        '</div>' +
      '</div>';
    document.body.appendChild(overlay);

    overlay.querySelector('.qz-fechar').addEventListener('click', fechar);
    overlay.querySelector('.qz-voltar').addEventListener('click', voltar);
    overlay.querySelector('.qz-enviar').addEventListener('click', enviar);

    // clique no fundo escuro fecha; clique dentro do card, não
    overlay.addEventListener('mousedown', function(e){
      if(e.target === overlay) fechar();
    });

    document.addEventListener('keydown', function(e){
      if(!overlay.classList.contains('is-aberto')) return;
      if(e.key === 'Escape') fechar();
      if(e.key === 'Tab') prenderFoco(e);
    });
  }

  /* mantém o Tab circulando dentro do modal enquanto ele está aberto */
  function prenderFoco(e){
    var focaveis = overlay.querySelectorAll('button:not([hidden]), input, a[href]');
    if(!focaveis.length) return;
    var primeiro = focaveis[0];
    var ultimo = focaveis[focaveis.length - 1];
    if(e.shiftKey && document.activeElement === primeiro){
      e.preventDefault(); ultimo.focus();
    } else if(!e.shiftKey && document.activeElement === ultimo){
      e.preventDefault(); primeiro.focus();
    }
  }

  /* ---------- render de cada etapa ---------- */

  function desenhar(){
    var p = PERGUNTAS[atual];
    var corpo = overlay.querySelector('.qz-corpo');
    var voltarBtn = overlay.querySelector('.qz-voltar');
    var enviarBtn = overlay.querySelector('.qz-enviar');

    overlay.querySelector('.qz-passo').textContent = 'Passo ' + (atual + 1) + ' de ' + PERGUNTAS.length;
    overlay.querySelector('.qz-barra i').style.width = ((atual) / PERGUNTAS.length * 100) + '%';

    corpo.innerHTML = '';

    var titulo = document.createElement('h2');
    titulo.className = 'qz-titulo';
    titulo.textContent = p.titulo;
    corpo.appendChild(titulo);

    if(p.ajuda){
      var ajuda = document.createElement('p');
      ajuda.className = 'qz-ajuda';
      ajuda.textContent = p.ajuda;
      corpo.appendChild(ajuda);
    }

    if(p.opcoes) desenharOpcoes(p, corpo);
    if(p.campos) desenharCampos(p, corpo);

    voltarBtn.hidden = atual === 0;
    enviarBtn.hidden = !p.campos;

    // foco no primeiro elemento útil da etapa
    var alvo = corpo.querySelector('input, .qz-opcao');
    if(alvo) alvo.focus();
  }

  function desenharOpcoes(p, corpo){
    var lista = document.createElement('div');
    lista.className = 'qz-opcoes';

    p.opcoes.forEach(function(texto){
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'qz-opcao';
      b.textContent = texto;
      if(respostas[p.chave] === texto || (p.livre === texto && respostas[p.chave + '_livre'])){
        b.classList.add('is-marcada');
      }
      b.addEventListener('click', function(){
        if(p.livre === texto){ abrirCampoLivre(p, lista, b); return; }
        respostas[p.chave] = texto;
        delete respostas[p.chave + '_livre'];
        avancar();
      });
      lista.appendChild(b);
    });

    corpo.appendChild(lista);
  }

  /* troca a lista de opções por um campo aberto quando a pessoa escolhe
     "Outro", já com o valor anterior se ela voltou pra editar */
  function abrirCampoLivre(p, lista, botao){
    lista.querySelectorAll('.qz-opcao').forEach(function(o){ o.classList.remove('is-marcada'); });
    botao.classList.add('is-marcada');

    if(lista.parentNode.querySelector('.qz-campos')) return;

    var caixa = document.createElement('div');
    caixa.className = 'qz-campos';

    var input = document.createElement('input');
    input.className = 'qz-campo';
    input.type = 'text';
    input.placeholder = 'Qual área?';
    input.value = respostas[p.chave + '_livre'] || '';

    var ok = document.createElement('button');
    ok.type = 'button';
    ok.className = 'qz-opcao';
    ok.textContent = 'Continuar';

    function confirmar(){
      var v = input.value.trim();
      if(!v){ input.classList.add('qz-erro'); input.focus(); return; }
      respostas[p.chave] = v;
      respostas[p.chave + '_livre'] = v;
      avancar();
    }
    ok.addEventListener('click', confirmar);
    input.addEventListener('keydown', function(e){ if(e.key === 'Enter') confirmar(); });
    input.addEventListener('input', function(){ input.classList.remove('qz-erro'); });

    caixa.appendChild(input);
    caixa.appendChild(ok);
    lista.parentNode.appendChild(caixa);
    input.focus();
  }

  function desenharCampos(p, corpo){
    var caixa = document.createElement('div');
    caixa.className = 'qz-campos';

    p.campos.forEach(function(c){
      var input = document.createElement('input');
      input.className = 'qz-campo';
      input.type = c.tipo;
      input.name = c.nome;
      input.placeholder = c.rotulo;
      input.setAttribute('aria-label', c.rotulo);
      input.value = respostas[c.nome] || '';
      input.addEventListener('input', function(){
        input.classList.remove('qz-erro');
        overlay.querySelector('.qz-aviso').textContent = '';
      });
      input.addEventListener('keydown', function(e){ if(e.key === 'Enter') enviar(); });
      caixa.appendChild(input);
    });

    var aviso = document.createElement('p');
    aviso.className = 'qz-aviso';
    caixa.appendChild(aviso);

    var nota = document.createElement('p');
    nota.className = 'qz-nota';
    nota.textContent = 'Ao enviar, abre a conversa no WhatsApp com tudo isso já escrito.';
    caixa.appendChild(nota);

    corpo.appendChild(caixa);
  }

  /* ---------- navegação ---------- */

  function avancar(){
    if(atual < PERGUNTAS.length - 1){ atual++; desenhar(); }
  }

  function voltar(){
    if(atual > 0){ atual--; desenhar(); }
  }

  function abrir(){
    focoAnterior = document.activeElement;
    atual = 0;
    desenhar();
    overlay.classList.add('is-aberto');
    document.documentElement.classList.add('qz-travado');
    document.body.classList.add('qz-travado');
  }

  function fechar(){
    overlay.classList.remove('is-aberto');
    document.documentElement.classList.remove('qz-travado');
    document.body.classList.remove('qz-travado');
    if(focoAnterior && focoAnterior.focus) focoAnterior.focus();
  }

  /* ---------- envio ---------- */

  function enviar(){
    var p = PERGUNTAS[atual];
    if(!p.campos) return;

    var nome = overlay.querySelector('input[name="nome"]');
    var tel  = overlay.querySelector('input[name="telefone"]');
    var aviso = overlay.querySelector('.qz-aviso');

    var digitos = tel.value.replace(/[^0-9]/g, '');

    if(!nome.value.trim()){
      nome.classList.add('qz-erro'); aviso.textContent = 'Me diz seu nome pra eu saber com quem falo.'; nome.focus(); return;
    }
    if(digitos.length < 10){
      tel.classList.add('qz-erro'); aviso.textContent = 'Confere o WhatsApp: precisa do DDD e do número completo.'; tel.focus(); return;
    }

    respostas.nome = nome.value.trim();
    respostas.telefone = tel.value.trim();

    var url = 'https://wa.me/' + WHATSAPP + '?text=' + encodeURIComponent(mensagem());

    /* abre em aba nova pra não derrubar o site de quem está no desktop e
       não tem o WhatsApp instalado */
    window.open(url, '_blank', 'noopener');
    telaFinal(url);
  }

  function mensagem(){
    var l = [];
    l.push('Olá, Angelo! Vim pelo site e respondi as perguntas:');
    l.push('');
    l.push('*Nome:* ' + respostas.nome);
    l.push('*WhatsApp:* ' + respostas.telefone);
    l.push('');
    l.push('*Momento:* ' + (respostas.momento || '-'));
    l.push('*Principal problema:* ' + (respostas.problema || '-'));
    l.push('*Tipo de projeto:* ' + (respostas.projeto || '-'));
    l.push('*Segmento:* ' + (respostas.segmento || '-'));
    return l.join('\n');
  }

  /* se o navegador bloquear o pop-up, a pessoa ainda tem um link clicável */
  function telaFinal(url){
    overlay.querySelector('.qz-barra i').style.width = '100%';
    overlay.querySelector('.qz-passo').textContent = 'Tudo certo';
    overlay.querySelector('.qz-voltar').hidden = true;
    overlay.querySelector('.qz-enviar').hidden = true;
    overlay.querySelector('.qz-corpo').innerHTML =
      '<div class="qz-fim">' +
        '<h2 class="qz-titulo">Pronto, ' + escapar(respostas.nome.split(' ')[0]) + '!</h2>' +
        '<p>Abri o WhatsApp com suas respostas já escritas. Se a janela não abriu, ' +
        '<a href="' + url + '" target="_blank" rel="noopener noreferrer">clique aqui</a>.</p>' +
      '</div>';
  }

  function escapar(t){
    var d = document.createElement('div');
    d.textContent = t || '';
    return d.innerHTML;
  }

  /* ---------- ligação com os botões da página ---------- */

  function ligar(){
    montar();
    document.querySelectorAll('[data-qualifica]').forEach(function(el){
      el.addEventListener('click', function(e){
        e.preventDefault();
        abrir();
      });
    });
  }

  if(document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', ligar);
  } else {
    ligar();
  }
})();
