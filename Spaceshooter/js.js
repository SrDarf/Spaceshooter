const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

var audio = new Audio('eff.mp3');

canvas.width = 800;
canvas.height = 600;

let filtroBrancoAtivo = false; 
let tempoUltimoFiltro = 0; 
let cooldownFiltro = 5000; 

let personagem = {
  x: 100,
  y: 500,
  largura: 50,
  altura: 50,
  velocidadeMaxima: 5,
  aceleração: 0.2,
  velocidadeX: 0,
  velocidadeY: 0,
  img: new Image(),
  morto: false,
  vidasAzul: 3, 
  cooldownTiro: 100, 
  tempoUltimoTiro: 0 
};

let objetos = [];
let objetoVelocidade = 2;
let tempoSobrevivido = 0; 
let filtroAtivo = false; 
let tamanhoOriginal = { largura: personagem.largura, altura: personagem.altura }; 
let particulasFogo = []; 

personagem.img.src = 'playerobj.png'; 

let teclasPressionadas = {};

function desenharFundo() {
  ctx.fillStyle = '#000000';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
}

window.addEventListener('keydown', function (event) {
  teclasPressionadas[event.key] = true;

  if (event.key === 'Backspace' && Date.now() - tempoUltimoFiltro >= cooldownFiltro) {
    filtroBrancoAtivo = true; 
    alert('Modo dificil: Ativado')
    tempoFiltroAtivo = Date.now(); 
    tempoUltimoFiltro = Date.now(); 
  }
});

window.addEventListener('keyup', function (event) {
  teclasPressionadas[event.key] = false;
});

function desenharPersonagem() {
  ctx.save(); 

  if (filtroBrancoAtivo) {

    ctx.filter = 'brightness(200%)'; 
  }

  if (!personagem.morto) {
    ctx.drawImage(personagem.img, personagem.x, personagem.y, personagem.largura, personagem.altura);
  }

  ctx.restore(); 
}

function criarParticulasFogo() {
  if (!personagem.morto) {
    particulasFogo.push({
      x: personagem.x + personagem.largura / 2,
      y: personagem.y + personagem.altura,
      largura: 5,
      altura: 5,
      velocidadeX: (Math.random() - 0.5) * 2,
      velocidadeY: Math.random() * 2 + 1,
      cor: 'orange',
      tempoVida: 0
    });
  }
}

function desenharParticulasFogo() {
  for (let i = 0; i < particulasFogo.length; i++) {
    let particula = particulasFogo[i];
    ctx.fillStyle = particula.cor;
    ctx.fillRect(particula.x, particula.y, particula.largura, particula.altura);

    particula.x += particula.velocidadeX;
    particula.y += particula.velocidadeY;
    particula.tempoVida++;

    if (particula.tempoVida > 20) { 
      particulasFogo.splice(i, 1);
      i--;
    }
  }
}

function morreu() {
  for (let i = 0; i < objetos.length; i++) {
    if (
      personagem.x < objetos[i].x + objetos[i].largura &&
      personagem.x + personagem.largura > objetos[i].x &&
      personagem.y < objetos[i].y + objetos[i].altura &&
      personagem.y + personagem.altura > objetos[i].y
    ) {
      if (filtroAtivo) {

        objetos.splice(i, 1);
        i--;
      } else {
        if (objetos[i].tipo === 'vermelho') {

          audio.play();
          personagem.morto = true;
          setTimeout(() => {
            window.location.reload();
          }, 1000);
          break;
        } else if (objetos[i].tipo === 'azul') {

          personagem.vidasAzul--;
          objetos.splice(i, 1);
          i--;
          if (personagem.vidasAzul <= 0) {
            audio.play();
            personagem.morto = true;
            setTimeout(() => {
              window.location.reload();
            }, 1000);
            break;
          }
        }
      }
    }
  }
}

function desenharObjetos() {
  for (let i = 0; i < objetos.length; i++) {
    let objImg = new Image();
    objImg.src = objetos[i].tipo === 'vermelho' ? 'red_meteor.png' : 'meteor.png';

    let centroX = objetos[i].x + objetos[i].largura / 2;
    let centroY = objetos[i].y + objetos[i].altura / 2;

    ctx.save();
    ctx.translate(centroX, centroY);
    ctx.rotate(objetos[i].rotacao);
    ctx.drawImage(objImg, -objetos[i].largura / 2, -objetos[i].altura / 2, objetos[i].largura, objetos[i].altura);
    ctx.restore();
    objetos[i].rotacao += 0.02;
  }
}

function movimentarPersonagem() {
  if (teclasPressionadas['ArrowRight'] || teclasPressionadas['d']) {
    personagem.velocidadeX = Math.min(personagem.velocidadeX + personagem.aceleração, personagem.velocidadeMaxima);
  } else if (teclasPressionadas['ArrowLeft'] || teclasPressionadas['a']) {
    personagem.velocidadeX = Math.max(personagem.velocidadeX - personagem.aceleração, -personagem.velocidadeMaxima);
  } else {
    personagem.velocidadeX *= 0.9; 
  }

  if (teclasPressionadas['ArrowUp'] || teclasPressionadas['w']) {
    personagem.velocidadeY = Math.max(personagem.velocidadeY - personagem.aceleração, -personagem.velocidadeMaxima);
  } else if (teclasPressionadas['ArrowDown'] || teclasPressionadas['s']) {
    personagem.velocidadeY = Math.min(personagem.velocidadeY + personagem.aceleração, personagem.velocidadeMaxima);
  } else {
    personagem.velocidadeY *= 0.9;
  }

  personagem.x += personagem.velocidadeX;
  personagem.y += personagem.velocidadeY;

  personagem.x = Math.max(0, Math.min(canvas.width - personagem.largura, personagem.x));
  personagem.y = Math.max(0, Math.min(canvas.height - personagem.altura, personagem.y));
}

function criarObjetos() {
  if (Math.random() < 0.1) {

    let tipo = filtroBrancoAtivo ? 'vermelho' : (Math.random() < 0.5 ? 'vermelho' : 'azul');

    let novoObjeto = {
      x: Math.random() * canvas.width,
      y: 0,
      largura: 30,
      altura: 30,
      rotacao: 0,
      tipo: tipo,
      direcaoInicialCalculada: false,  
      direcaoX: 0,  
      direcaoY: 0,  
      tempoInicio: Date.now()  
    };
    objetos.push(novoObjeto);
  }
}

function moverObjetos() {
  for (let i = 0; i < objetos.length; i++) {

    if (objetos[i].tipo === 'vermelho') {
      let agora = Date.now();

      if (!objetos[i].direcaoInicialCalculada) {

        let dx = personagem.x - objetos[i].x;
        let dy = personagem.y - objetos[i].y;
        let distancia = Math.sqrt(dx * dx + dy * dy);
        objetos[i].direcaoX = dx / distancia; 
        objetos[i].direcaoY = dy / distancia; 
        objetos[i].direcaoInicialCalculada = true;
      }

      if (agora - objetos[i].tempoInicio > 500) {
        objetos[i].x += objetos[i].direcaoX * objetoVelocidade;
        objetos[i].y += objetos[i].direcaoY * objetoVelocidade;
      }
    } else {

      objetos[i].y += objetoVelocidade;
    }

    if (objetos[i].y > canvas.height) {
      objetos.splice(i, 1);
      i--;
    }
  }
}

let balasRestantes = 100; 

function disparar() {
  let agora = Date.now();
  if (agora - personagem.tempoUltimoTiro >= personagem.cooldownTiro && balasRestantes > 0) { 
    let tiro = {
      x: personagem.x + personagem.largura / 2,
      y: personagem.y,
      raio: 5,
      cor: 'orange',
      velocidadeY: -10,
      esferasAzuis: []
    };

    for (let i = 0; i < 5; i++) {
      tiro.esferasAzuis.push({
        x: tiro.x + Math.random() * 20 - 10,
        y: tiro.y + Math.random() * 20 - 10,
        raio: Math.random() * 5 + 3,
        cor: 'blue'
      });
    }

    objetos.push(tiro);
    personagem.tempoUltimoTiro = agora; 
    balasRestantes--; 
  }
}

function desenharHUD() {
  ctx.fillStyle = '#fff';
  ctx.font = '20px Arial';
  ctx.fillText(`Tempo: ${Math.floor(tempoSobrevivido)}s`, 10, 30);
  ctx.fillText(`Vida: ${personagem.vidasAzul}`, 10, 60);
  ctx.fillText(`Balas: ${balasRestantes}`, 10, 90); 
}

function desenharTiros() {
  for (let i = 0; i < objetos.length; i++) {
    if (objetos[i].cor === 'orange') {

      ctx.beginPath();
      ctx.arc(objetos[i].x, objetos[i].y, objetos[i].raio, 0, Math.PI * 2);
      ctx.fillStyle = objetos[i].cor;
      ctx.fill();

      for (let esfera of objetos[i].esferasAzuis) {
        ctx.beginPath();
        ctx.arc(esfera.x, esfera.y, esfera.raio, 0, Math.PI * 0);
        ctx.fillStyle = esfera.cor;
        ctx.fill();
      }

      objetos[i].y += objetos[i].velocidadeY;

      if (objetos[i].y < 0) {
        objetos.splice(i, 1);
        i--;
      }
    }
  }
}

function verificarColisaoTiro() {
  for (let i = 0; i < objetos.length; i++) {
    if (objetos[i].cor === 'orange') { 
      for (let j = 0; j < objetos.length; j++) {
        if (objetos[j].tipo === 'vermelho' || objetos[j].tipo === 'azul') {
          let dist = Math.sqrt(Math.pow(objetos[i].x - objetos[j].x, 2) + Math.pow(objetos[i].y - objetos[j].y, 2));
          if (dist < objetos[i].raio + objetos[j].largura / 2) {
            objetos.splice(j, 1); 
            i--;
            break;
          }
        }
      }
    }
  }
}

function atualizar() {
  if (!personagem.morto) {
    desenharFundo();
    criarParticulasFogo();
    movimentarPersonagem();
    criarObjetos();
    moverObjetos();
    morreu();
    desenharParticulasFogo();
    desenharPersonagem();
    desenharObjetos();
    verificarColisaoTiro(); 
    desenharTiros();
    desenharHUD();
    tempoSobrevivido += 0.1;
  } else {
    ctx.fillStyle = '#fff';
    ctx.font = '30px Arial';
    ctx.fillText('Você morreu! Reiniciando...', canvas.width / 2 - 150, canvas.height / 2);
  }
  requestAnimationFrame(atualizar);
}

window.addEventListener('keydown', function (event) {
  teclasPressionadas[event.key] = true;
});

window.addEventListener('keyup', function (event) {
  teclasPressionadas[event.key] = false;
});

window.addEventListener('keydown', function (event) {
  if (event.key === 'g') {
    disparar();
  }
});

atualizar();