// ============================================================
// CONTROLAR ACADEMY — PROTÓTIPO
// Lógica do jogo. O conteúdo fica em content.js.
// ============================================================

const CHAVE_BASE = "controlar-academy-v1";
const CHAVE_MODO = "controlar-academy-modo";
let CHAVE = null;          // definida ao entrar (por conta Google ou modo teste)
let CONTA = null;          // { tipo: "google" | "teste", uid, nome, email, foto }
const DICAS_INICIAIS = 2;
const BONUS_TRILHA = 500;

// ---------- estado ----------
function estadoNovo() {
  return {
    perfil: null,
    fases: {},            // f1: { concluida, melhorPontos, melhorAprov, jogadas }
    emAndamento: null,    // { faseId, dados }
    dicas: DICAS_INICIAIS,
    tempoSeg: 0,
    tempoPorFase: {},
    diario: {},           // "2026-11-17": { acertos, medalha, pontos, feito }
    bonusTrilha: false,
    criadoEm: new Date().toISOString()
  };
}
let E = estadoNovo();
function carregar() {
  if (!CHAVE) return estadoNovo();
  try {
    const s = JSON.parse(localStorage.getItem(CHAVE));
    if (s && typeof s === "object") return Object.assign(estadoNovo(), s);
  } catch (e) {}
  return estadoNovo();
}
function salvar() {
  if (!CHAVE) return;
  try { localStorage.setItem(CHAVE, JSON.stringify(E)); } catch (e) {}
}

// ---------- utilidades ----------
const $app = () => document.getElementById("app");
function esc(s) {
  return String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}
function embaralhar(arr, rnd = Math.random) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
}
function semente(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); }
  return function () { h += 0x6D2B79F5; let t = h; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
function hoje() {
  const d = new Date();
  return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
}
function fmtTempo(seg) {
  const h = Math.floor(seg / 3600), m = Math.floor((seg % 3600) / 60), s = seg % 60;
  if (h) return `${h}h ${String(m).padStart(2, "0")}min`;
  if (m) return `${m}min ${String(s).padStart(2, "0")}s`;
  return `${s}s`;
}
function fmtCurto(seg) { return seg < 60 ? seg + "s" : Math.round(seg / 60) + " min"; }
function pct(x) { return Math.round(x * 100) + "%"; }
function toast(msg) {
  document.querySelectorAll(".toast").forEach(t => t.remove());
  const t = document.createElement("div");
  t.className = "toast"; t.textContent = msg;
  document.body.appendChild(t);
  setTimeout(() => t.remove(), 2600);
}
function fase(id) { return TRILHA.fases.find(f => f.id === id); }
function idxFase(id) { return TRILHA.fases.findIndex(f => f.id === id); }

// ---------- pontos e ligas ----------
function pontosTotais() {
  let p = 0;
  for (const f of TRILHA.fases) p += (E.fases[f.id]?.melhorPontos || 0);
  for (const d of Object.values(E.diario)) p += (d.pontos || 0);
  if (E.bonusTrilha) p += BONUS_TRILHA;
  return p;
}
function ligaDe(p) {
  let l = LIGAS[0];
  for (const x of LIGAS) if (p >= x.min) l = x;
  return l;
}
function proximaLiga(p) { return LIGAS.find(x => x.min > p) || null; }
function grupoCategoria(cat) {
  if (!cat) return "Enfermagem";
  if (cat.startsWith("Enfermeiro")) return "Enfermeiros";
  if (cat.startsWith("Técnico")) return "Técnicos de enfermagem";
  if (cat.startsWith("Médico")) return "Médicos";
  if (cat.startsWith("Fisio")) return "Fisioterapeutas";
  if (cat.startsWith("Residente")) return "Residentes";
  return "Acadêmicos";
}
function faseLiberada(id) {
  const i = idxFase(id);
  if (i === 0) return true;
  return !!E.fases[TRILHA.fases[i - 1].id]?.concluida;
}
function trilhaConcluida() { return TRILHA.fases.every(f => E.fases[f.id]?.concluida); }
function aproveitamentoTrilha() {
  const v = TRILHA.fases.map(f => E.fases[f.id]?.melhorAprov || 0);
  return v.reduce((a, b) => a + b, 0) / v.length;
}

// ---------- tempo de treinamento ----------
let telaAtual = "inicio";
let emJogo = false;
let faseAtiva = null;
setInterval(() => {
  if (emJogo && document.visibilityState === "visible") {
    E.tempoSeg++;
    if (faseAtiva) E.tempoPorFase[faseAtiva] = (E.tempoPorFase[faseAtiva] || 0) + 1;
    if (E.tempoSeg % 5 === 0) salvar();
  }
}, 1000);
document.addEventListener("visibilitychange", salvar);

// ---------- navegação ----------
function ir(tela, arg) {
  telaAtual = tela;
  emJogo = ["quiz", "pares", "caso", "diario-jogo"].includes(tela);
  if (!emJogo) faseAtiva = null;
  const r = TELAS[tela];
  $app().innerHTML = r(arg);
  window.scrollTo(0, 0);
  salvar();
}
function nav(ativa) {
  const itens = [["inicio", "🏠", "Início"], ["diario", "📅", "Desafio"], ["sala", "🏆", "Sala"], ["perfil", "👤", "Perfil"]];
  return `<nav class="nav"><div class="dentro">${itens.map(([t, i, n]) =>
    `<button data-a="ir" data-t="${t}" class="${t === ativa ? "ativo" : ""}"><span class="ic">${i}</span>${n}</button>`).join("")}</div></nav>`;
}
function barraJogo(titulo, progresso, extra = "") {
  return `<div class="barra-jogo">
    <button class="btn-icone" data-a="pausar" aria-label="Pausar">⏸</button>
    <div class="grow"><div class="titulo">${esc(titulo)}</div>
    <div class="progresso"><div style="width:${Math.round(progresso * 100)}%"></div></div></div>
    ${extra}
  </div>`;
}
function botaoDica() {
  return `<button class="btn-dica" data-a="usarDica">💡 Dica (${E.dicas})</button>`;
}

// ============================================================
// TELAS
// ============================================================
const TELAS = {};

// ---------- entrada (login) ----------
let entrando = false;
TELAS.entrada = (estado) => {
  const cfg = !!window.FIREBASE_CONFIG;
  const carregando = estado === "carregando";
  return `
  <div class="topo" style="padding-bottom:30px"><div class="marca">Controlar Academy</div>
    <h1>Treinamento em segurança, um jogo de cada vez</h1>
    <p style="margin:0;opacity:.9">Prevenção de infecção e segurança do paciente em fases de 2 a 3 minutos.</p></div>
  <main>
    <div class="card centro" style="margin-top:8px">
      <div class="grande" style="font-size:56px">🧼</div>
      <h2 class="mt">Entre para começar</h2>
      <p class="suave pequeno">Com sua conta Google, seu progresso, seus pontos e seu certificado ficam ligados a você.</p>
      ${carregando ? `<p class="suave">Verificando seu acesso…</p>` : `
      <button class="btn branco" data-a="loginGoogle" ${cfg && !entrando ? "" : "disabled"} style="gap:12px">
        <svg width="22" height="22" viewBox="0 0 48 48" aria-hidden="true"><path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z"/><path fill="#FF3D00" d="m6.3 14.7 6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/><path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z"/><path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z"/></svg>
        ${entrando ? "Entrando…" : "Entrar com Google"}</button>
      ${cfg ? "" : `<p class="pequeno suave mt" style="margin-bottom:0">Login com Google em configuração.</p>`}`}
    </div>
    ${carregando ? "" : `<button class="btn claro" data-a="modoTeste">Testar sem login</button>
    <p class="pequeno suave centro" style="margin-top:8px">No modo teste, o progresso fica só neste aparelho.</p>`}
    <div class="aviso mt">Protótipo para demonstração. O conteúdo ainda passa por validação técnica.</div>
  </main>`;
};

function abrirConta(conta) {
  CONTA = conta;
  CHAVE = CHAVE_BASE + ":" + (conta.tipo === "google" ? conta.uid : "teste");
  // migra o progresso do protótipo anterior (sem login) para o modo teste
  if (conta.tipo === "teste" && !localStorage.getItem(CHAVE) && localStorage.getItem(CHAVE_BASE)) {
    try { localStorage.setItem(CHAVE, localStorage.getItem(CHAVE_BASE)); } catch (e) {}
  }
  try { localStorage.setItem(CHAVE_MODO, conta.tipo); } catch (e) {}
  E = carregar();
  if (conta.tipo === "google" && E.perfil && !E.perfil.nome && conta.nome) E.perfil.nome = conta.nome;
  if (E.perfil && E.perfil.apelido) ir("inicio");
  else {
    cad = { categoria: "Enfermeiro(a)", unidade: "CTI adulto" };
    if (conta.tipo === "google" && conta.nome) cad.apelido = conta.nome.split(" ")[0];
    ir("cadastro");
  }
}
function sairConta() {
  salvar();
  CHAVE = null; CONTA = null; E = estadoNovo();
  try { localStorage.removeItem(CHAVE_MODO); } catch (e) {}
  ir("entrada");
}
// chamado por auth.js sempre que o estado do login muda
window.caAoMudarLogin = (usuario) => {
  entrando = false;
  if (usuario) {
    if (CONTA && CONTA.tipo === "google" && CONTA.uid === usuario.uid) return;
    abrirConta({ tipo: "google", uid: usuario.uid, nome: usuario.displayName || "", email: usuario.email || "", foto: usuario.photoURL || "" });
  } else if (!CONTA || CONTA.tipo === "google") {
    if (localStorage.getItem(CHAVE_MODO) === "teste") abrirConta({ tipo: "teste" });
    else { CHAVE = null; CONTA = null; ir("entrada"); }
  }
};
window.caErroLogin = (msg) => { entrando = false; if (telaAtual === "entrada") ir("entrada"); toast(msg); };

// ---------- cadastro ----------
let cad = { categoria: "Enfermeiro(a)", unidade: "CTI adulto" };
TELAS.cadastro = () => `
  <div class="topo"><div class="marca">Controlar Academy</div>
    <h1>Treinamento em segurança, um jogo de cada vez</h1>
    <p style="margin:0;opacity:.9">Fases de 2 a 3 minutos para jogar no seu ritmo, no plantão ou em casa.</p></div>
  <main>
    <div class="card">
      <h2>Crie seu perfil</h2>
      ${CONTA?.tipo === "google" ? `<div class="linha pequeno suave">${CONTA.foto ? `<img src="${esc(CONTA.foto)}" alt="" width="28" height="28" style="border-radius:50%" referrerpolicy="no-referrer">` : "👤"}<span>Conectado como <b>${esc(CONTA.email)}</b></span></div>` : `<p class="pequeno suave" style="margin:0">Modo teste · sem login</p>`}
      <label for="apelido">Apelido no jogo</label>
      <input id="apelido" maxlength="20" placeholder="Ex.: Enf_Simone" value="${esc(cad.apelido ?? E.perfil?.apelido ?? "")}">
      <label>Categoria profissional</label>
      <div class="opcoes-grade">${CATEGORIAS.map(c => `<button class="opcao-sel ${cad.categoria === c ? "ativa" : ""}" data-a="cadCat" data-v="${esc(c)}">${esc(c)}</button>`).join("")}</div>
      <label>Unidade</label>
      <div class="opcoes-grade">${UNIDADES.map(c => `<button class="opcao-sel ${cad.unidade === c ? "ativa" : ""}" data-a="cadUni" data-v="${esc(c)}">${esc(c)}</button>`).join("")}</div>
      <p class="pequeno suave mt">Você vai disputar a sala com profissionais da mesma categoria e do mesmo nível.</p>
      <button class="btn coral mt" data-a="cadastrar">Começar</button>
    </div>
    <div class="aviso">Protótipo para demonstração. O conteúdo ainda passa por validação técnica.</div>
  </main>`;

// ---------- início ----------
TELAS.inicio = () => {
  const p = pontosTotais(), liga = ligaDe(p);
  const and = E.emAndamento;
  const diarioFeito = E.diario[hoje()]?.feito;
  const fasesHtml = TRILHA.fases.map((f, i) => {
    const st = E.fases[f.id];
    const lib = faseLiberada(f.id);
    const atual = lib && !st?.concluida;
    const cls = st?.concluida ? "feita" : (lib ? (atual ? "atual" : "") : "bloqueada");
    const info = st?.concluida
      ? `✅ Concluída · ${st.melhorPontos} pts · ${pct(st.melhorAprov)}`
      : (lib ? "Toque para jogar" : "🔒 Conclua a fase anterior");
    return `<button class="fase ${cls}" data-a="${lib ? "abrirFase" : "bloq"}" data-f="${f.id}">
      <div class="bolha">${st?.concluida ? "✅" : f.icone}</div>
      <div class="grow"><div class="nivel">${esc(f.nivel)}</div><div class="nome">${esc(f.titulo)}</div>
      <div class="estrelas">${info}</div></div></button>`;
  }).join("");
  return `
  <div class="topo"><div class="marca">Controlar Academy</div>
    <h1>Olá, ${esc(E.perfil.apelido)}!</h1>
    <div class="chips"><span class="chip">${liga.icone} Liga ${liga.nome}</span><span class="chip">⭐ ${p} pts</span><span class="chip">💡 ${E.dicas} ${E.dicas === 1 ? "dica" : "dicas"}</span></div>
  </div>
  <main>
    ${and ? `<div class="card destaque"><div class="linha"><div class="grande" style="font-size:40px">⏯️</div><div class="grow">
      <h3>Continue de onde parou</h3><p class="pequeno suave" style="margin:0">${esc(fase(and.faseId).titulo)}: seu progresso está salvo.</p></div></div>
      <button class="btn mt" data-a="continuar">Continuar</button></div>` : ""}
    ${!diarioFeito ? `<button class="card amarelo linha" style="width:100%;border:0;text-align:left;cursor:pointer;color:inherit" data-a="ir" data-t="diario">
      <div style="font-size:38px">📅</div><div class="grow"><h3 style="margin:0">Desafio do dia</h3>
      <div class="pequeno">5 perguntas · ganhe sua medalha de hoje</div></div><div>›</div></button>` : ""}
    <div class="linha entre mt"><div><div class="pequeno suave">${esc(TRILHA.subtitulo)}</div><h2 style="margin:0">${TRILHA.icone} ${esc(TRILHA.titulo)}</h2></div></div>
    <p class="pequeno suave">${esc(TRILHA.publico)}</p>
    ${fasesHtml}
    ${trilhaConcluida() ? `<button class="btn coral" data-a="ir" data-t="certificado">🎓 Ver meu certificado</button>` : ""}
    <div class="card mt"><h3>Próximas trilhas</h3>
      ${["🩸 Prevenção de infecção de corrente sanguínea", "🫁 Prevenção de pneumonia associada à ventilação", "🚻 Prevenção de infecção do trato urinário", "🩹 Prevenção de infecção de sítio cirúrgico"]
        .map(t => `<div class="em-breve"><span class="grow">${t}</span><span class="pequeno">Em breve</span></div>`).join("")}
    </div>
  </main>${nav("inicio")}`;
};

// ---------- abertura da fase ----------
TELAS.abertura = (id) => {
  const f = fase(id), st = E.fases[id];
  const tipo = { quiz: "Perguntas e respostas", pares: "Combine as peças", caso: "Caso de ensino com decisões" }[f.tipo];
  return `${barraJogoSimples(f.nivel)}
  <main>
    <div class="centro"><div class="grande">${f.icone}</div><h1 class="mt">${esc(f.titulo)}</h1>
    <p class="suave">${esc(tipo)}</p></div>
    <div class="card"><p>${esc(f.descricao)}</p>
      <p class="pequeno suave" style="margin:0">Objetivo: pelo menos ${pct(f.minimo)} de aproveitamento. ${st?.concluida ? `Seu melhor: ${st.melhorPontos} pts.` : ""}</p></div>
    ${f.tipo === "caso" ? `<div class="card"><h3>Personagens</h3>${CASO.personagens.map(p => `<div class="linha" style="margin:8px 0"><span style="font-size:32px">${p.avatar}</span><div><b>${esc(p.nome)}</b><div class="pequeno suave">${esc(p.papel)}</div></div></div>`).join("")}</div>` : ""}
    <button class="btn coral" data-a="iniciarFase" data-f="${id}">${st?.concluida ? "Jogar de novo" : "Começar"}</button>
    <button class="btn branco" data-a="ir" data-t="inicio">Voltar</button>
  </main>`;
};
function barraJogoSimples(titulo) {
  return `<div class="barra-jogo"><button class="btn-icone" data-a="ir" data-t="inicio" aria-label="Voltar">←</button><div class="titulo">${esc(titulo)}</div></div>`;
}

// ============================================================
// NÍVEL 1 — QUIZ
// ============================================================
function novoQuiz(n, rnd) {
  return { ordem: embaralhar(PERGUNTAS.map((_, i) => i), rnd).slice(0, n).map(qi => ({ qi, perm: embaralhar([0, 1, 2, 3], rnd) })), i: 0, acertos: 0, pontos: 0, resp: null, elim: [] };
}
function telaQuizGenerica(d, titulo, acaoResp, acaoProx, mostrarDica) {
  const item = d.ordem[d.i];
  const P = PERGUNTAS[item.qi];
  const respondida = d.resp !== null;
  const certaPos = item.perm.indexOf(P.correta);
  const botoes = item.perm.map((oi, pos) => {
    let cls = "";
    if (respondida) { if (pos === certaPos) cls = "certa"; else if (pos === d.resp) cls = "errada"; }
    else if (d.elim.includes(pos)) cls = "eliminada";
    return `<button class="resp ${cls}" data-a="${acaoResp}" data-p="${pos}" ${respondida ? "disabled" : ""}>${esc(P.opcoes[oi])}</button>`;
  }).join("");
  const acertou = respondida && d.resp === certaPos;
  return `${barraJogo(titulo, (d.i + (respondida ? 1 : 0)) / d.ordem.length, mostrarDica && !respondida ? botaoDica() : "")}
  <main>
    <div class="pequeno suave">Pergunta ${d.i + 1} de ${d.ordem.length} · ⭐ ${d.pontos} pts</div>
    <div class="pergunta">${esc(P.q)}</div>
    ${botoes}
    ${respondida ? `<div class="feedback ${acertou ? "ok" : "nao"}"><strong>${acertou ? pick(["Mandou bem! 🎉", "Isso aí! 👏", "Certinho! ✨"]) : "Quase! Vamos entender 💬"}</strong>${esc(P.explicacao)}</div>
      <button class="btn" data-a="${acaoProx}">${d.i + 1 < d.ordem.length ? "Próxima" : "Ver resultado"}</button>` : ""}
  </main>`;
}
function pick(a) { return a[Math.floor(Math.random() * a.length)]; }

TELAS.quiz = () => { faseAtiva = "f1"; return telaQuizGenerica(E.emAndamento.dados, fase("f1").titulo, "respQuiz", "proxQuiz", true); };

// ============================================================
// NÍVEL 2 — PARES
// ============================================================
function novoPares(n) {
  const escolhidos = embaralhar(PARES.map((_, i) => i)).slice(0, n);
  const pecas = [];
  escolhidos.forEach(pi => { pecas.push({ par: pi, lado: "a" }); pecas.push({ par: pi, lado: "b" }); });
  return { pecas: embaralhar(pecas), feitos: [], erros: 0, pontos: 0, sel: null, total: n };
}
TELAS.pares = () => {
  faseAtiva = "f2";
  const d = E.emAndamento.dados;
  const pecas = d.pecas.map((pc, i) => {
    const P = PARES[pc.par];
    const feita = d.feitos.includes(pc.par);
    return `<button class="peca ${pc.lado === "b" ? "tipo-b" : ""} ${feita ? "feita" : ""} ${d.sel === i ? "sel" : ""}" data-a="tocarPeca" data-i="${i}" id="peca${i}">
      <span class="ic">${pc.lado === "a" ? P.ia : P.ib}</span><span>${esc(pc.lado === "a" ? P.a : P.b)}</span></button>`;
  }).join("");
  return `${barraJogo(fase("f2").titulo, d.feitos.length / d.total, botaoDica())}
  <main>
    <div class="linha entre pequeno suave"><span>Pares: ${d.feitos.length}/${d.total}</span><span>Erros: ${d.erros}</span><span>⭐ ${d.pontos} pts</span></div>
    <p class="pequeno suave" style="margin:8px 0 0">Peças claras são situações; peças verdes, a resposta. Toque em uma de cada.</p>
    <div class="tabuleiro">${pecas}</div>
  </main>`;
};

// ============================================================
// NÍVEL 3 — CASO
// ============================================================
function novoCaso() { return { i: 0, pontos: 0, resp: null, escolhas: [], dicaVista: false, ordens: CASO.etapas.map(et => embaralhar(et.opcoes.map((_, k) => k))) }; }
TELAS.caso = () => {
  faseAtiva = "f3";
  const d = E.emAndamento.dados;
  if (d.i === -1) return telaIntroCaso();
  const et = CASO.etapas[d.i];
  const p = CASO.personagens[et.quem];
  const respondida = d.resp !== null;
  const ordem = d.ordens[d.i];
  const opcoes = ordem.map(k => {
    const o = et.opcoes[k];
    let cls = "";
    if (respondida) { if (o.tipo === "certa") cls = "certa"; else if (k === d.resp) cls = o.tipo === "aceitavel" ? "" : "errada"; }
    const estilo = respondida && k === d.resp && o.tipo === "aceitavel" ? 'style="border-color:#d4a017;background:#fef3c7"' : "";
    return `<button class="resp ${cls}" ${estilo} data-a="respCaso" data-k="${k}" ${respondida ? "disabled" : ""}>${esc(o.t)}</button>`;
  }).join("");
  let fb = "";
  if (respondida) {
    const o = et.opcoes[d.resp];
    const tit = { certa: "Boa decisão", aceitavel: "Funciona, mas dá para melhorar", errada: "Vamos rever essa decisão" }[o.tipo];
    fb = `<div class="feedback ${o.tipo === "certa" ? "ok" : o.tipo === "aceitavel" ? "meio" : "nao"}"><strong>${tit}</strong>${esc(o.fb)}</div>
      <button class="btn" data-a="proxCaso">${d.i + 1 < CASO.etapas.length ? "Continuar o plantão" : "Encerrar o plantão"}</button>`;
  }
  return `${barraJogo(CASO.titulo, (d.i + (respondida ? 1 : 0)) / CASO.etapas.length, !respondida ? botaoDica() : "")}
  <main>
    <div class="pequeno suave">Decisão ${d.i + 1} de ${CASO.etapas.length} · ⭐ ${d.pontos} pts</div>
    <div class="cena">
      <div class="elenco">${CASO.personagens.map(x => `<span class="ator"><span class="av">${x.avatar}</span>${esc(x.nome)}</span>`).join("")}</div>
      ${et.narrador ? `<div class="narracao">🎬 ${esc(et.fala)}</div>` :
        `<div class="balao"><div class="av">${p.avatar}</div><div class="fala"><div class="quem">${esc(p.nome)}</div>${esc(et.fala)}</div></div>`}
      ${d.dicaVista && !respondida ? `<div class="feedback meio"><strong>💡 Dica</strong>${esc(et.dica)}</div>` : ""}
    </div>
    ${opcoes}
    ${fb}
  </main>`;
};
function telaIntroCaso() {
  return `${barraJogo(CASO.titulo, 0)}
  <main>
    <div class="cena"><div class="elenco">${CASO.personagens.map(x => `<span class="ator"><span class="av">${x.avatar}</span>${esc(x.nome)}</span>`).join("")}</div>
    <div class="narracao">🎬 ${esc(CASO.cenario)}</div></div>
    <div class="card pequeno">Aqui não há uma única resposta possível: algumas condutas funcionam quando faltam recursos e valem metade dos pontos. A melhor conduta vale a pontuação inteira.</div>
    <button class="btn coral" data-a="iniciarCasoEtapas">Assumir o plantão</button>
  </main>`;
}

// ============================================================
// RESULTADO E FALHA
// ============================================================
let ultimoResultado = null;
TELAS.resultado = () => {
  const r = ultimoResultado, f = fase(r.faseId);
  const prox = TRILHA.fases[idxFase(r.faseId) + 1];
  const titulo = f.tipo === "caso" ? "Plantão concluído!" : "Fase concluída!";
  return `${barraJogoSimples(f.nivel)}
  <main class="centro">
    <div class="grande mt">${r.aprov >= 0.999 ? "🏆" : "🎉"}</div>
    <h1 class="mt">${titulo}</h1>
    ${f.tipo === "caso" ? `<p>${esc(CASO.encerramento)}</p>` : `<p class="suave">Você alcançou o objetivo de ${esc(f.titulo)}.</p>`}
    <div class="placar"><div><b>${r.pontos}</b><span>pontos</span></div><div><b>${pct(r.aprov)}</b><span>aproveitamento</span></div><div><b>${fmtTempo(E.tempoPorFase[r.faseId] || 0)}</b><span>tempo total</span></div></div>
    ${r.recorde ? `<div class="feedback ok" style="text-align:left"><strong>Novo recorde!</strong>Seus pontos foram registrados e somados à sua sala.</div>` : `<p class="pequeno suave">Seu melhor resultado nesta fase continua sendo ${E.fases[r.faseId].melhorPontos} pts.</p>`}
    ${r.trilhaAgora ? `<div class="feedback ok" style="text-align:left"><strong>Trilha concluída! +${BONUS_TRILHA} pts classificatórios</strong>Você terminou a trilha ${esc(TRILHA.titulo)}${aproveitamentoTrilha() >= 0.8 ? " e já pode emitir o certificado." : "."}</div>` : ""}
    ${trilhaConcluida() && r.faseId === "f3" ? `<button class="btn coral mt" data-a="ir" data-t="certificado">🎓 Ver certificado</button>` :
      prox ? `<button class="btn coral mt" data-a="abrirFase" data-f="${prox.id}">Próxima fase: ${esc(prox.titulo)}</button>` : ""}
    <button class="btn branco" data-a="ir" data-t="inicio">Voltar ao início</button>
  </main>`;
};
function modalFalha(faseId, aprov, pontos) {
  const f = fase(faseId), i = idxFase(faseId);
  const ant = TRILHA.fases[i - 1];
  const html = `<div class="fundo-modal"><div class="modal">
    <div class="centro"><div class="grande">💪</div><h2 class="mt">Ainda não foi desta vez</h2>
    <p>Você chegou a <b>${pct(aprov)}</b> de aproveitamento (${pontos} pts). O objetivo é ${pct(f.minimo)}. Cada tentativa ensina!</p></div>
    <button class="btn coral" data-a="reiniciarFase" data-f="${faseId}">🔄 Reiniciar a fase</button>
    <p class="pequeno suave centro" style="margin:6px 0 4px">Zera os pontos desta jogada.</p>
    ${ant ? `<button class="btn claro" data-a="voltarNivel" data-f="${ant.id}">⬇️ Voltar ao nível anterior</button>
      <p class="pequeno suave centro" style="margin:6px 0 4px">Revise ${esc(ant.titulo)} sem perder os pontos já conquistados.</p>`
      : `<button class="btn claro" data-a="verVideo" data-volta="abertura" data-f="${faseId}">🎬 Rever com o vídeo instrutivo</button>`}
    <button class="btn branco mt" data-a="fecharFalha">Voltar ao início</button>
  </div></div>`;
  emJogo = false;
  $app().insertAdjacentHTML("beforeend", html);
}
function finalizarFase(faseId, pontos, aprov) {
  const f = fase(faseId);
  E.emAndamento = null;
  const st = E.fases[faseId] || { concluida: false, melhorPontos: 0, melhorAprov: 0, jogadas: 0 };
  st.jogadas++;
  E.fases[faseId] = st;
  if (aprov < f.minimo) { salvar(); modalFalha(faseId, aprov, pontos); return; }
  const recorde = pontos > st.melhorPontos;
  st.concluida = true;
  st.melhorPontos = Math.max(st.melhorPontos, pontos);
  st.melhorAprov = Math.max(st.melhorAprov, aprov);
  let trilhaAgora = false;
  if (trilhaConcluida() && !E.bonusTrilha) { E.bonusTrilha = true; trilhaAgora = true; }
  ultimoResultado = { faseId, pontos, aprov, recorde, trilhaAgora };
  ir("resultado");
}

// ============================================================
// DESAFIO DO DIA
// ============================================================
const MEDALHAS = [null, "Bronze", "Prata", "Ouro", "Platina", "Diamante"];
const ICONE_MEDALHA = { Bronze: "🥉", Prata: "🥈", Ouro: "🥇", Platina: "💠", Diamante: "💎" };
let diarioDados = null;
TELAS.diario = () => {
  const d = E.diario[hoje()];
  if (d?.feito) {
    return `<div class="topo"><div class="marca">Desafio do dia</div><h1>Desafio de hoje concluído</h1></div>
    <main class="centro">
      <div class="grande mt">${d.medalha ? ICONE_MEDALHA[d.medalha] : "🌱"}</div>
      <h2 class="mt">${d.medalha ? "Medalha " + d.medalha : "Sem medalha hoje"}</h2>
      <p>Você acertou ${d.acertos} de 5 e ganhou ${d.pontos} pts.</p>
      <p class="suave pequeno">Volte amanhã: as perguntas mudam todo dia.</p>
      ${historicoMedalhas()}
    </main>${nav("diario")}`;
  }
  return `<div class="topo"><div class="marca">Desafio do dia</div><h1>5 perguntas, uma medalha</h1>
    <p style="margin:0;opacity:.9">As perguntas mudam a cada dia. Sem dicas aqui!</p></div>
  <main>
    <div class="card"><h3>Classificação do desempenho</h3>
      ${[1, 2, 3, 4, 5].map(n => `<div class="linha" style="margin:6px 0"><span style="font-size:26px">${ICONE_MEDALHA[MEDALHAS[n]]}</span><span class="grow">${MEDALHAS[n]}</span><span class="suave pequeno">${n} acerto${n > 1 ? "s" : ""}</span></div>`).join("")}
    </div>
    <button class="btn coral" data-a="iniciarDiario">Começar o desafio</button>
    ${historicoMedalhas()}
  </main>${nav("diario")}`;
};
function historicoMedalhas() {
  const lista = Object.entries(E.diario).filter(([, v]) => v.feito && v.medalha).sort((a, b) => b[0].localeCompare(a[0])).slice(0, 7);
  if (!lista.length) return "";
  return `<div class="card mt" style="text-align:left"><h3>Suas medalhas</h3>${lista.map(([dia, v]) => `<div class="linha" style="margin:6px 0"><span style="font-size:24px">${ICONE_MEDALHA[v.medalha]}</span><span class="grow">${dia.split("-").reverse().join("/")}</span><span class="pequeno suave">${v.acertos}/5</span></div>`).join("")}</div>`;
}
TELAS["diario-jogo"] = () => { faseAtiva = "diario"; return telaQuizGenerica(diarioDados, "Desafio do dia", "respDiario", "proxDiario", false); };

// ============================================================
// SALA / RANKING (simulado)
// ============================================================
const NOMES_FICTICIOS = ["Enf_Carla", "Plantão_Noturno", "Luiz.CTI", "Mari_Neo", "TecAna", "Rafa_UTI", "Joana.Enf", "Biossegura", "Dr_Paulo", "Fisio_Bia", "Leo_Plantão", "Sol.Ped", "Gabi_CTI", "Marcos.T", "Nina_Enf"];
const AVATARES = ["👩‍⚕️", "🧑‍⚕️", "👨‍⚕️", "👩🏽‍⚕️", "👨🏾‍⚕️", "👩🏻‍⚕️", "🧑🏿‍⚕️"];
function salaFicticia(liga, grupo, meus) {
  const rnd = semente(liga.nome + grupo + hoje().slice(0, 7));
  const prox = proximaLiga(liga.min);
  const teto = prox ? prox.min - 1 : liga.min + 3000;
  const nomes = embaralhar(NOMES_FICTICIOS, rnd).slice(0, 9);
  const dia = new Date().getDate();
  const lista = nomes.map((n, i) => ({
    nome: n, av: AVATARES[Math.floor(rnd() * AVATARES.length)],
    pts: Math.min(teto, Math.round(liga.min + rnd() * (teto - liga.min) * 0.85 + dia * rnd() * 8)), eu: false
  }));
  lista.push({ nome: E.perfil.apelido, av: "⭐", pts: meus, eu: true });
  return lista.sort((a, b) => b.pts - a.pts);
}
TELAS.sala = () => {
  const p = pontosTotais(), liga = ligaDe(p), prox = proximaLiga(p);
  const grupo = grupoCategoria(E.perfil.categoria);
  const lista = salaFicticia(liga, grupo, p);
  return `<div class="topo"><div class="marca">Sua sala</div><h1>${liga.icone} Sala ${liga.nome} · ${esc(grupo)}</h1>
    <p style="margin:0;opacity:.9">Você disputa com profissionais da sua categoria e do seu nível.</p></div>
  <main>
    <div class="liga-faixa">${LIGAS.map(l => `<div class="${l.nome === liga.nome ? "ativa" : ""}" title="${l.nome}">${l.icone}</div>`).join("")}</div>
    <p class="pequeno suave centro">${prox ? `Faltam <b>${prox.min - p} pts</b> para subir para a liga ${prox.nome}.` : "Você está na liga mais alta!"}</p>
    <div class="card">${lista.map((x, i) => `<div class="rank ${x.eu ? "eu" : ""}"><div class="pos">${i + 1}º</div><div class="av">${x.av}</div><div class="grow"><b>${esc(x.nome)}</b>${x.eu ? ' <span class="pequeno suave">(você)</span>' : ""}</div><div><b>${x.pts}</b> <span class="pequeno suave">pts</span></div></div>`).join("")}</div>
    <div class="aviso">No protótipo, os outros jogadores da sala são fictícios. Na versão final, a sala reúne jogadores reais do seu hospital ou de várias instituições.</div>
  </main>${nav("sala")}`;
};

// ============================================================
// PERFIL, CERTIFICADO, GESTOR, VÍDEO, REFERÊNCIAS
// ============================================================
TELAS.perfil = () => {
  const p = pontosTotais(), liga = ligaDe(p);
  const medalhas = Object.values(E.diario).filter(v => v.medalha).length;
  return `<div class="topo"><div class="marca">Perfil</div><h1>⭐ ${esc(E.perfil.apelido)}</h1>
    <div class="chips"><span class="chip">${esc(E.perfil.categoria)}</span><span class="chip">${esc(E.perfil.unidade)}</span></div></div>
  <main>
    <div class="placar"><div><b>${p}</b><span>pontos</span></div><div><b>${liga.icone}</b><span>Liga ${liga.nome}</span></div><div><b>${medalhas}</b><span>medalhas</span></div></div>
    <div class="card"><h3>Tempo de treinamento</h3><p style="font-size:28px;font-weight:800;color:var(--teal-escuro);margin:0">${fmtTempo(E.tempoSeg)}</p>
      <p class="pequeno suave" style="margin:0">Registrado automaticamente enquanto você joga. É a base do indicador hora/homem de treinamento.</p></div>
    <div class="card"><h3>Trilha ${esc(TRILHA.titulo)}</h3>
      ${TRILHA.fases.map(f => { const st = E.fases[f.id]; return `<div class="linha entre" style="margin:6px 0"><span>${f.icone} ${esc(f.titulo)}</span><span class="pequeno ${st?.concluida ? "" : "suave"}">${st?.concluida ? `${pct(st.melhorAprov)} · ${st.melhorPontos} pts` : "pendente"}</span></div>`; }).join("")}
      ${trilhaConcluida() ? `<button class="btn mt" data-a="ir" data-t="certificado">🎓 Certificado</button>` : ""}
    </div>
    <button class="btn claro" data-a="ir" data-t="gestor">📊 Visão do gestor (demonstração)</button>
    <button class="btn claro" data-a="verVideo" data-volta="perfil">🎬 Vídeo instrutivo (ganhe 1 dica)</button>
    <button class="btn claro" data-a="ir" data-t="refs">📚 Referências e sobre o protótipo</button>
    <button class="btn branco" data-a="editarPerfil">✏️ Editar perfil</button>
    <div class="card mt"><h3>Conta</h3>
      ${CONTA?.tipo === "google" ? `<div class="linha">${CONTA.foto ? `<img src="${esc(CONTA.foto)}" alt="" width="40" height="40" style="border-radius:50%" referrerpolicy="no-referrer">` : "👤"}<div><b>${esc(CONTA.nome || E.perfil.apelido)}</b><div class="pequeno suave">${esc(CONTA.email)}</div></div></div>`
        : `<p class="pequeno suave" style="margin:0">Modo teste, sem login. Entre com Google para ligar seu progresso à sua conta.</p>`}
      <button class="btn branco mt" data-a="sair">${CONTA?.tipo === "google" ? "Sair da conta" : "Entrar com Google"}</button>
    </div>
    <button class="btn branco" data-a="zerar">🗑️ Apagar meu progresso</button>
  </main>${nav("perfil")}`;
};

TELAS.certificado = () => {
  const aprov = aproveitamentoTrilha();
  if (!trilhaConcluida()) return `${barraJogoSimples("Certificado")}<main><p>Conclua as três fases da trilha para emitir o certificado.</p></main>`;
  if (aprov < 0.8) return `${barraJogoSimples("Certificado")}<main class="centro"><div class="grande">📈</div><h2 class="mt">Quase lá!</h2>
    <p>O certificado exige pelo menos 80% de aproveitamento na trilha. O seu está em ${pct(aprov)}. Jogue as fases de novo para melhorar seu melhor resultado.</p>
    <button class="btn" data-a="ir" data-t="inicio">Voltar à trilha</button></main>`;
  if (!E.perfil.nome) return `${barraJogoSimples("Certificado")}<main>
    <div class="card"><h2>🎓 Seu certificado está pronto</h2><p>Como seu nome deve aparecer no certificado?</p>
    <label for="nomeCert">Nome completo</label><input id="nomeCert" placeholder="Nome e sobrenome">
    <button class="btn coral mt" data-a="salvarNome">Emitir certificado</button></div></main>`;
  const data = new Date().toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" });
  const tempoTrilha = TRILHA.fases.reduce((s, f) => s + (E.tempoPorFase[f.id] || 0), 0);
  return `${barraJogoSimples("Certificado")}
  <main>
    <div class="certificado">
      <div class="marca" style="color:var(--teal);font-weight:800;letter-spacing:.1em;font-size:14px">CONTROLAR ACADEMY</div>
      <div style="font-size:44px;margin:8px 0">🎓</div>
      <div class="suave">Certificamos que</div>
      <div class="nome-cert">${esc(E.perfil.nome)}</div>
      <div class="suave">${esc(E.perfil.categoria)} · ${esc(E.perfil.unidade)}</div>
      <p class="mt">concluiu a trilha <b>${esc(TRILHA.titulo)}</b> (${esc(TRILHA.subtitulo)}), com aproveitamento de <b>${pct(aprov)}</b>.</p>
      <p>Tempo de treinamento registrado: <b>${fmtTempo(tempoTrilha)}</b></p>
      <p class="suave pequeno">${data}</p>
      <div class="aviso mt">Certificado de demonstração, sem validade.</div>
    </div>
    <button class="btn mt nao-imprimir" data-a="imprimir">🖨️ Salvar ou imprimir</button>
  </main>`;
};

const EQUIPE_FICTICIA = [
  ["10234", "Enfermeiro(a)", "CTI adulto", 1.0, 1460, "ok"], ["10871", "Técnico(a) de enfermagem", "CTI adulto", 0.92, 1080, "ok"],
  ["11002", "Técnico(a) de enfermagem", "CTI adulto", 0.67, 620, "and"], ["11345", "Enfermeiro(a)", "CTI pediátrico", 0.88, 1310, "ok"],
  ["11560", "Técnico(a) de enfermagem", "CTI pediátrico", 0, 0, "nao"], ["11781", "Técnico(a) de enfermagem", "CTI neonatal", 0.95, 990, "ok"],
  ["12004", "Enfermeiro(a)", "CTI neonatal", 0.75, 760, "and"], ["12290", "Técnico(a) de enfermagem", "CTI adulto", 0, 0, "nao"]
];
let filtroSetor = "Todos";
TELAS.gestor = () => {
  const eu = [E.perfil.apelido, E.perfil.categoria, E.perfil.unidade, trilhaConcluida() ? aproveitamentoTrilha() : (Object.keys(E.fases).length ? 0.5 : 0), E.tempoSeg, trilhaConcluida() ? "ok" : (E.tempoSeg > 0 ? "and" : "nao"), true];
  let linhas = EQUIPE_FICTICIA.map(l => [...l, false]).concat([eu]);
  if (filtroSetor !== "Todos") linhas = linhas.filter(l => l[2] === filtroSetor);
  const concl = linhas.filter(l => l[5] === "ok").length;
  const horas = linhas.reduce((s, l) => s + l[4], 0);
  const notas = linhas.filter(l => l[5] === "ok").map(l => l[3]);
  const media = notas.length ? notas.reduce((a, b) => a + b, 0) / notas.length : 0;
  const rot = { ok: "Concluído", and: "Em andamento", nao: "Não iniciado" };
  const ico = { ok: "✅", and: "⏳", nao: "⭕" };
  return `${barraJogoSimples("Visão do gestor")}
  <main>
    <h2>📊 Relatório de treinamento</h2>
    <p class="pequeno suave">Trilha ${esc(TRILHA.titulo)} · Hospital de demonstração</p>
    <div class="opcoes-grade mb" style="grid-template-columns:repeat(4,1fr)">${["Todos", ...UNIDADES].map(s => `<button class="opcao-sel ${filtroSetor === s ? "ativa" : ""}" style="font-size:13px;padding:8px 4px" data-a="filtro" data-v="${esc(s)}">${esc(s.replace("CTI ", ""))}</button>`).join("")}</div>
    <div class="kpis mb"><div><b>${linhas.length ? pct(concl / linhas.length) : "0%"}</b><span>concluíram</span></div><div><b>${fmtTempo(horas)}</b><span>treinamento (h/homem)</span></div><div><b>${pct(media)}</b><span>nota média</span></div></div>
    <div class="card rolagem"><table class="tabela"><thead><tr><th>Matrícula</th><th>Categoria</th><th>Setor</th><th>Nota</th><th>Tempo</th><th></th></tr></thead><tbody>
      ${linhas.map(l => `<tr class="${l[6] ? "eu" : ""}"><td>${esc(l[0])}</td><td>${esc(l[1].startsWith("Enfermeiro") ? "Enf." : l[1].startsWith("Técnico") ? "Téc. enf." : l[1].replace("(a)", ""))}</td><td>${esc(l[2].replace("CTI ", ""))}</td><td>${l[5] === "nao" ? "–" : pct(l[3])}</td><td style="white-space:nowrap">${l[4] ? fmtCurto(l[4]) : "–"}</td><td class="centro" title="${rot[l[5]]}">${ico[l[5]]}</td></tr>`).join("")}
    </tbody></table>
      <p class="pequeno suave" style="margin:10px 0 0">✅ Concluído · ⏳ Em andamento · ⭕ Não iniciado</p></div>
    <div class="aviso">Demonstração: a linha destacada é você, com seus dados reais deste aparelho. As demais são fictícias. Na versão final, o gestor do hospital acessa este relatório com login próprio, por setor ou pela instituição inteira.</div>
  </main>`;
};

let videoVolta = { tela: "inicio", arg: null };
let videoTimer = null;
TELAS.video = () => `${barraJogoSimples("Vídeo instrutivo")}
  <main>
    <div class="tela-video"><div class="pequeno" style="opacity:.8">Técnica de fricção antisséptica das mãos</div>
      <div class="ic" id="vIc">${VIDEO_PASSOS[0].i}</div><div class="passo" id="vTx">${esc(VIDEO_PASSOS[0].t)}</div>
      <div class="progresso" style="background:rgba(255,255,255,.2)"><div id="vBar" style="width:0%"></div></div></div>
    <p class="pequeno suave mt">No protótipo, esta animação representa o vídeo curto. Na versão final, entra um vídeo gerado por IA.</p>
    <button class="btn coral" id="vBtn" data-a="fimVideo" disabled>Assista até o fim para ganhar 1 dica</button>
  </main>`;
function rodarVideo() {
  clearInterval(videoTimer);
  let i = 0;
  const passo = 1600, total = VIDEO_PASSOS.length;
  videoTimer = setInterval(() => {
    i++;
    const bar = document.getElementById("vBar");
    if (!bar) { clearInterval(videoTimer); return; }
    bar.style.width = Math.min(100, (i / total) * 100) + "%";
    if (i < total) {
      document.getElementById("vIc").textContent = VIDEO_PASSOS[i].i;
      document.getElementById("vTx").textContent = VIDEO_PASSOS[i].t;
    } else {
      clearInterval(videoTimer);
      const b = document.getElementById("vBtn");
      b.disabled = false; b.textContent = "🎁 Pegar minha dica";
    }
  }, passo);
}

TELAS.refs = () => `${barraJogoSimples("Referências")}
  <main>
    <div class="card"><h3>Sobre este protótipo</h3>
      <p>Esta é uma versão de demonstração do Controlar Academy, com uma trilha completa (${esc(TRILHA.titulo)}) em três níveis: perguntas e respostas, combinação de peças e caso de ensino com decisões.</p>
      <p style="margin:0">Login, salas com jogadores reais, relatórios do gestor e vídeos gerados por IA estão simulados e entram na versão completa.</p></div>
    <div class="card"><h3>Referências técnicas</h3>${REFERENCIAS.map(r => `<p class="pequeno">• ${esc(r)}</p>`).join("")}
      <div class="aviso">Conteúdo elaborado para o protótipo e pendente de validação pela liderança técnica.</div></div>
  </main>`;

// ============================================================
// AÇÕES
// ============================================================
const A = {};
A.ir = el => ir(el.dataset.t);
A.bloq = () => toast("🔒 Conclua a fase anterior para liberar esta.");
A.cadCat = el => { cad.categoria = el.dataset.v; guardarApelidoDigitado(); ir("cadastro"); };
A.cadUni = el => { cad.unidade = el.dataset.v; guardarApelidoDigitado(); ir("cadastro"); };
function guardarApelidoDigitado() {
  const v = document.getElementById("apelido")?.value;
  if (v !== undefined) cad.apelido = v;
}
A.cadastrar = () => {
  const ap = document.getElementById("apelido").value.trim();
  if (ap.length < 2) { toast("Escolha um apelido com pelo menos 2 letras."); return; }
  const nome = E.perfil?.nome || (CONTA?.tipo === "google" ? CONTA.nome : "") || "";
  E.perfil = { apelido: ap, categoria: cad.categoria, unidade: cad.unidade, nome };
  delete cad.apelido;
  ir("inicio");
  toast(`Bem-vindo(a), ${ap}! Você ganhou ${DICAS_INICIAIS} dicas para começar.`);
};
A.loginGoogle = () => {
  if (!window.caLoginGoogle) { toast("Login com Google ainda não está disponível."); return; }
  entrando = true; ir("entrada"); window.caLoginGoogle();
};
A.modoTeste = () => abrirConta({ tipo: "teste" });
A.sair = () => {
  if (CONTA?.tipo === "google" && window.caLogout) { salvar(); try { localStorage.removeItem(CHAVE_MODO); } catch (e) {} CONTA = null; window.caLogout(); }
  else sairConta();
};
A.editarPerfil = () => { cad = { categoria: E.perfil.categoria, unidade: E.perfil.unidade, apelido: E.perfil.apelido }; ir("cadastro"); };
A.zerar = () => {
  if (!confirm("Apagar todo o seu progresso neste aparelho?")) return;
  E = estadoNovo(); salvar(); cad = { categoria: "Enfermeiro(a)", unidade: "CTI adulto" }; ir("cadastro");
};
A.abrirFase = el => ir("abertura", el.dataset.f);
A.iniciarFase = el => iniciarFase(el.dataset.f);
function iniciarFase(id) {
  const f = fase(id);
  let dados;
  if (f.tipo === "quiz") dados = novoQuiz(f.perguntasPorRodada);
  else if (f.tipo === "pares") dados = novoPares(f.paresPorRodada);
  else { dados = novoCaso(); dados.i = -1; }
  E.emAndamento = { faseId: id, dados };
  ir(f.tipo);
}
A.continuar = () => ir(fase(E.emAndamento.faseId).tipo);
A.pausar = () => {
  if (telaAtual === "diario-jogo") { if (confirm("Sair do desafio? Ele será reiniciado na próxima vez.")) ir("diario"); return; }
  salvar(); ir("inicio"); toast("⏸ Jogo pausado. Seu progresso está salvo.");
};
A.reiniciarFase = el => iniciarFase(el.dataset.f);
A.voltarNivel = el => ir("abertura", el.dataset.f);
A.fecharFalha = () => ir("inicio");

// dicas
A.usarDica = () => {
  if (E.dicas <= 0) {
    if (confirm("Você não tem dicas. Assistir a um vídeo instrutivo curto para ganhar 1 dica?")) {
      videoVolta = { tela: telaAtual, arg: null };
      ir("video"); rodarVideo();
    }
    return;
  }
  const d = E.emAndamento?.dados;
  if (telaAtual === "quiz") {
    if (d.elim.length) { toast("Você já usou uma dica nesta pergunta."); return; }
    const item = d.ordem[d.i], P = PERGUNTAS[item.qi], certaPos = item.perm.indexOf(P.correta);
    d.elim = embaralhar([0, 1, 2, 3].filter(p => p !== certaPos)).slice(0, 2);
    E.dicas--; ir("quiz"); toast("💡 Duas alternativas erradas foram eliminadas.");
  } else if (telaAtual === "pares") {
    const rest = d.pecas.map((pc, i) => ({ pc, i })).filter(x => !d.feitos.includes(x.pc.par));
    if (!rest.length) return;
    const alvo = rest[0].pc.par;
    E.dicas--; ir("pares");
    d.pecas.forEach((pc, i) => { if (pc.par === alvo) document.getElementById("peca" + i)?.classList.add("dica"); });
    toast("💡 Olhe as peças piscando: elas formam um par.");
  } else if (telaAtual === "caso") {
    if (d.i < 0 || d.dicaVista) { toast("A dica desta decisão já está na tela."); return; }
    d.dicaVista = true; E.dicas--; ir("caso");
  }
};
A.verVideo = el => {
  videoVolta = { tela: el.dataset.volta || "inicio", arg: el.dataset.f || null };
  ir("video"); rodarVideo();
};
A.fimVideo = () => {
  E.dicas++;
  ir(videoVolta.tela, videoVolta.arg);
  toast("🎁 +1 dica! Você agora tem " + E.dicas + ".");
};

// quiz
A.respQuiz = el => {
  const d = E.emAndamento.dados, item = d.ordem[d.i], P = PERGUNTAS[item.qi];
  d.resp = Number(el.dataset.p);
  if (item.perm[d.resp] === P.correta) { d.acertos++; d.pontos += d.elim.length ? 50 : 100; }
  ir("quiz");
};
A.proxQuiz = () => {
  const d = E.emAndamento.dados;
  if (d.i + 1 < d.ordem.length) { d.i++; d.resp = null; d.elim = []; ir("quiz"); }
  else finalizarFase("f1", d.pontos, d.acertos / d.ordem.length);
};

// pares
A.tocarPeca = el => {
  const d = E.emAndamento.dados, i = Number(el.dataset.i), pc = d.pecas[i];
  if (d.feitos.includes(pc.par)) return;
  if (d.sel === null) { d.sel = i; el.classList.add("sel"); salvar(); return; }
  if (d.sel === i) { d.sel = null; el.classList.remove("sel"); return; }
  const outra = d.pecas[d.sel], elOutra = document.getElementById("peca" + d.sel);
  if (outra.lado === pc.lado) { elOutra?.classList.remove("sel"); d.sel = i; el.classList.add("sel"); return; }
  if (outra.par === pc.par) {
    d.feitos.push(pc.par); d.pontos += 100; d.sel = null;
    el.classList.add("feita"); elOutra?.classList.add("feita");
    salvar();
    if (d.feitos.length === d.total) {
      setTimeout(() => {
        const aprov = Math.max(0, 1 - d.erros / (2 * d.total));
        finalizarFase("f2", Math.max(0, d.pontos - d.erros * 20), aprov);
      }, 450);
    } else setTimeout(() => ir("pares"), 380);
  } else {
    d.erros++; d.sel = null;
    el.classList.add("tremer"); elOutra?.classList.add("tremer");
    salvar();
    setTimeout(() => ir("pares"), 450);
  }
};

// caso
A.iniciarCasoEtapas = () => { E.emAndamento.dados.i = 0; ir("caso"); };
A.respCaso = el => {
  const d = E.emAndamento.dados, k = Number(el.dataset.k);
  d.resp = k;
  const tipo = CASO.etapas[d.i].opcoes[k].tipo;
  const v = tipo === "certa" ? 200 : tipo === "aceitavel" ? 100 : 0;
  d.pontos += d.dicaVista && v ? v - 25 : v;
  d.escolhas.push(tipo);
  ir("caso");
};
A.proxCaso = () => {
  const d = E.emAndamento.dados;
  if (d.i + 1 < CASO.etapas.length) { d.i++; d.resp = null; d.dicaVista = false; ir("caso"); }
  else {
    const max = CASO.etapas.length * 200;
    const aprov = d.escolhas.reduce((s, t) => s + (t === "certa" ? 1 : t === "aceitavel" ? 0.5 : 0), 0) / CASO.etapas.length;
    finalizarFase("f3", Math.min(d.pontos, max), aprov);
  }
};

// desafio diário
A.iniciarDiario = () => { diarioDados = novoQuiz(5, semente("diario" + hoje())); ir("diario-jogo"); };
A.respDiario = el => {
  const d = diarioDados, item = d.ordem[d.i], P = PERGUNTAS[item.qi];
  d.resp = Number(el.dataset.p);
  if (item.perm[d.resp] === P.correta) { d.acertos++; d.pontos += 50; }
  ir("diario-jogo");
};
A.proxDiario = () => {
  const d = diarioDados;
  if (d.i + 1 < d.ordem.length) { d.i++; d.resp = null; ir("diario-jogo"); return; }
  const medalha = MEDALHAS[d.acertos] || null;
  E.diario[hoje()] = { acertos: d.acertos, medalha, pontos: d.pontos, feito: true };
  ir("diario");
  if (medalha) toast(`${ICONE_MEDALHA[medalha]} Medalha ${medalha} conquistada!`);
};

// sala, gestor, certificado
A.filtro = el => { filtroSetor = el.dataset.v; ir("gestor"); };
A.salvarNome = () => {
  const n = document.getElementById("nomeCert").value.trim();
  if (n.length < 3) { toast("Digite seu nome completo."); return; }
  E.perfil.nome = n; ir("certificado");
};
A.imprimir = () => window.print();

document.addEventListener("click", e => {
  const el = e.target.closest("[data-a]");
  if (!el || el.disabled) return;
  const f = A[el.dataset.a];
  if (f) f(el);
});

// ---------- início ----------
// Com Firebase configurado, auth.js decide (caAoMudarLogin). Sem ele, entra direto.
if (window.FIREBASE_CONFIG) {
  if (localStorage.getItem(CHAVE_MODO) === "teste") abrirConta({ tipo: "teste" });
  else ir("entrada", "carregando");
} else if (localStorage.getItem(CHAVE_MODO) === "teste") abrirConta({ tipo: "teste" });
else ir("entrada");
