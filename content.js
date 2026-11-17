// ============================================================
// CONTROLAR ACADEMY — CONTEÚDO DO JOGO
// Este arquivo concentra todo o conteúdo técnico. Para revisar
// ou trocar perguntas, edite apenas este arquivo.
// Status: PROTÓTIPO — conteúdo pendente de validação técnica.
// Referências: ANVISA, OMS e CDC (ver lista REFERENCIAS no fim).
// ============================================================

const TRILHA = {
  id: "higiene-maos",
  titulo: "Higiene das Mãos",
  subtitulo: "Trilha Prevenção de Infecção",
  icone: "🧼",
  publico: "Equipe de enfermagem · CTI adulto, pediátrico e neonatal",
  fases: [
    {
      id: "f1",
      nivel: "Nível 1 · Básico",
      tipo: "quiz",
      titulo: "Primeiros passos",
      descricao: "Perguntas rápidas para aquecer. Sem tempo, sem pressão.",
      icone: "💡",
      minimo: 0.8,
      perguntasPorRodada: 5
    },
    {
      id: "f2",
      nivel: "Nível 2 · Intermediário",
      tipo: "pares",
      titulo: "Ligue os pares",
      descricao: "Toque em duas peças que combinam: a situação e o momento ou a conduta certa.",
      icone: "🀄",
      minimo: 0.8,
      paresPorRodada: 6
    },
    {
      id: "f3",
      nivel: "Nível 3 · Avançado",
      tipo: "caso",
      titulo: "Plantão no leito 7",
      descricao: "Um caso de ensino: tome as decisões do plantão ao lado da enfermeira Ana.",
      icone: "🏥",
      minimo: 0.8
    }
  ]
};

// ------------------------------------------------------------
// NÍVEL 1 — BANCO DE PERGUNTAS (a cada rodada sorteia 5)
// correta = índice da opção certa (0 = primeira)
// ------------------------------------------------------------
const PERGUNTAS = [
  {
    q: "Quanto tempo deve durar a fricção antisséptica das mãos com preparação alcoólica?",
    opcoes: ["5 segundos", "20 a 30 segundos", "40 a 60 segundos", "2 minutos"],
    correta: 1,
    explicacao: "A fricção com preparação alcoólica leva de 20 a 30 segundos, friccionando todas as superfícies até as mãos secarem."
  },
  {
    q: "E a lavagem das mãos com água e sabonete, quanto tempo leva?",
    opcoes: ["10 a 15 segundos", "20 a 30 segundos", "40 a 60 segundos", "3 minutos"],
    correta: 2,
    explicacao: "A higiene simples com água e sabonete leva de 40 a 60 segundos, do molhar ao secar com papel-toalha."
  },
  {
    q: "Quantos são os momentos para a higiene das mãos definidos pela OMS?",
    opcoes: ["3", "4", "5", "7"],
    correta: 2,
    explicacao: "São 5 momentos: antes de tocar o paciente, antes de procedimento limpo/asséptico, após risco de exposição a fluidos, após tocar o paciente e após tocar superfícies próximas a ele."
  },
  {
    q: "Quando você deve preferir água e sabonete em vez da preparação alcoólica?",
    opcoes: ["Sempre que der tempo", "Quando as mãos estiverem visivelmente sujas", "Antes de tocar o paciente", "Só no fim do plantão"],
    correta: 1,
    explicacao: "Mãos visivelmente sujas ou contaminadas com sangue e fluidos pedem água e sabonete. No restante, a preparação alcoólica é a escolha prática."
  },
  {
    q: "Usar luvas dispensa a higiene das mãos?",
    opcoes: ["Sim, a luva protege", "Só se a luva for estéril", "Não: higienize antes de calçar e depois de retirar", "Só dispensa em isolamento"],
    correta: 2,
    explicacao: "Luvas não substituem a higiene das mãos. Elas podem ter microfuros e as mãos se contaminam ao retirá-las."
  },
  {
    q: "Qual é a principal forma de transmissão de microrganismos entre pacientes no hospital?",
    opcoes: ["O ar-condicionado", "As mãos dos profissionais", "Os alimentos", "As visitas"],
    correta: 1,
    explicacao: "As mãos dos profissionais são o principal veículo de transmissão cruzada. Por isso a higiene das mãos é a medida mais simples e eficaz."
  },
  {
    q: "Anéis, pulseiras e relógio durante a assistência:",
    opcoes: ["Podem, se forem lisos", "São proibidos pela NR-32", "Só o relógio é permitido", "Podem, cobertos pela luva"],
    correta: 1,
    explicacao: "A NR-32 proíbe adornos para quem presta assistência. Eles acumulam microrganismos e atrapalham a higiene correta."
  },
  {
    q: "Como devem estar as unhas de quem presta assistência?",
    opcoes: ["Curtas e naturais", "Com esmalte claro", "Com unhas artificiais bem feitas", "Tanto faz, se usar luva"],
    correta: 0,
    explicacao: "Unhas naturais e curtas. Unhas artificiais e em gel acumulam microrganismos, mesmo após a higiene."
  },
  {
    q: "Você ajustou a bomba de infusão do leito, mas não tocou no paciente. Precisa higienizar as mãos ao sair?",
    opcoes: ["Não, não toquei no paciente", "Sim: é o 5º momento", "Só se estiver de luva", "Só se for isolamento"],
    correta: 1,
    explicacao: "O 5º momento vale para superfícies e equipamentos próximos ao paciente, mesmo sem contato direto com ele."
  },
  {
    q: "Após aplicar a preparação alcoólica, o que fazer?",
    opcoes: ["Enxugar com papel-toalha", "Friccionar até secar naturalmente", "Enxaguar com água", "Abanar as mãos"],
    correta: 1,
    explicacao: "Friccione até a evaporação completa. Enxugar ou enxaguar reduz a ação do álcool."
  },
  {
    q: "No paciente com diarreia por Clostridioides difficile, qual a melhor higiene das mãos?",
    opcoes: ["Preparação alcoólica", "Água e sabonete", "Só luvas", "Álcool duas vezes"],
    correta: 1,
    explicacao: "O álcool não elimina os esporos do C. difficile. A lavagem com água e sabonete os remove mecanicamente."
  },
  {
    q: "A RDC 42/2010 da ANVISA determina que os serviços de saúde:",
    opcoes: ["Usem só sabonete antisséptico", "Disponibilizem preparação alcoólica nos pontos de assistência", "Proíbam o uso de álcool", "Façam lavagem cirúrgica em toda a UTI"],
    correta: 1,
    explicacao: "A RDC 42/2010 obriga a disponibilizar preparação alcoólica para fricção antisséptica das mãos nos pontos de assistência."
  }
];

// ------------------------------------------------------------
// NÍVEL 2 — PARES (a cada rodada sorteia 6)
// ------------------------------------------------------------
const PARES = [
  { a: "Vou aferir a pressão do paciente", ia: "🩺", b: "1º momento: antes de tocar o paciente", ib: "1️⃣" },
  { a: "Vou manipular o cateter venoso central", ia: "💉", b: "2º momento: antes de procedimento asséptico", ib: "2️⃣" },
  { a: "Acabei de aspirar o tubo orotraqueal", ia: "🫁", b: "3º momento: após risco de exposição a fluidos", ib: "3️⃣" },
  { a: "Terminei a mudança de decúbito", ia: "🛏️", b: "4º momento: após tocar o paciente", ib: "4️⃣" },
  { a: "Ajustei a bomba de infusão e saí do box", ia: "📟", b: "5º momento: após tocar superfícies próximas", ib: "5️⃣" },
  { a: "Paciente com C. difficile", ia: "🦠", b: "Álcool não elimina esporos: lave com água e sabonete", ib: "🚰" },
  { a: "Fricção com preparação alcoólica", ia: "🧴", b: "20 a 30 segundos", ib: "⏱️" },
  { a: "Lavagem com água e sabonete", ia: "🧼", b: "40 a 60 segundos", ib: "⏳" },
  { a: "Anéis, pulseiras e relógio", ia: "💍", b: "Proibidos na assistência (NR-32)", ib: "🚫" },
  { a: "Calcei luvas para o procedimento", ia: "🧤", b: "Luva não substitui a higiene das mãos", ib: "✋" },
  { a: "Desinfecção do conector do cateter", ia: "🔌", b: "Álcool 70% por 5 a 15 segundos", ib: "🧪" }
];

// ------------------------------------------------------------
// NÍVEL 3 — CASO DE ENSINO
// tipo da opção: "certa" (100%), "aceitavel" (50%), "errada" (0%)
// "aceitavel" = conduta possível quando faltam recursos
// ------------------------------------------------------------
const CASO = {
  titulo: "Plantão no leito 7",
  cenario: "CTI adulto, 7h da manhã. Você assume o Sr. José, 68 anos, no 3º dia de pós-operatório, em ventilação mecânica, com cateter venoso central e sonda vesical. A enfermeira Ana, supervisora do plantão, acompanha você.",
  personagens: [
    { nome: "Enf. Ana", papel: "Supervisora do plantão", avatar: "👩‍⚕️" },
    { nome: "Sr. José", papel: "Paciente do leito 7", avatar: "👴" },
    { nome: "Téc. Bruno", papel: "Colega de plantão", avatar: "🧑‍⚕️" }
  ],
  etapas: [
    {
      quem: 0,
      fala: "Bom dia! Vamos começar pelos sinais vitais do Sr. José. O que você faz ao entrar no box?",
      dica: "Pense no que vem ANTES do primeiro contato com o paciente.",
      opcoes: [
        { t: "Friccionar as mãos com preparação alcoólica e depois tocar o paciente", tipo: "certa", fb: "Isso! É o 1º momento: antes de tocar o paciente. Protege o Sr. José dos microrganismos que você traz do corredor." },
        { t: "Calçar luvas direto, sem higienizar as mãos", tipo: "errada", fb: "A luva não substitui a higiene das mãos, e aferir sinais vitais em pele íntegra nem exige luva. Higienize antes de tocar o paciente." },
        { t: "Aferir os sinais e higienizar as mãos só ao sair", tipo: "errada", fb: "Higienizar ao sair protege você e o ambiente, mas o paciente fica desprotegido. O 1º momento é antes do contato." }
      ]
    },
    {
      quem: 0,
      fala: "Agora o antibiótico das 8h, pelo cateter venoso central. Como você prepara a administração?",
      dica: "Cateter central é porta de entrada para infecção de corrente sanguínea.",
      opcoes: [
        { t: "Higienizar as mãos e desinfetar o conector com álcool 70% por 5 a 15 segundos antes de conectar", tipo: "certa", fb: "Perfeito. 2º momento (antes de procedimento asséptico) mais a desinfecção do conector: as duas barreiras juntas previnem infecção de corrente sanguínea." },
        { t: "Desinfetar só o conector, já que vou usar luvas", tipo: "aceitavel", fb: "A desinfecção do conector está certa, mas faltou higienizar as mãos antes de calçar as luvas. As duas medidas se completam." },
        { t: "Conectar direto, porque o conector está tampado", tipo: "errada", fb: "A tampa não garante que o conector esteja livre de contaminação. Sempre higienize as mãos e desinfete o conector antes de manipular." }
      ]
    },
    {
      quem: 1,
      fala: "Durante a aspiração, o Sr. José tosse forte. A luva rasga e a secreção atinge sua mão.",
      narrador: true,
      dica: "Suas mãos agora estão visivelmente sujas.",
      opcoes: [
        { t: "Retirar as luvas e lavar as mãos com água e sabonete", tipo: "certa", fb: "Correto. É o 3º momento, e com as mãos visivelmente sujas a escolha é água e sabonete, de 40 a 60 segundos." },
        { t: "Retirar as luvas e passar preparação alcoólica", tipo: "errada", fb: "O álcool não age bem sobre sujidade visível. Com secreção nas mãos, lave com água e sabonete." },
        { t: "Calçar outra luva por cima e terminar a aspiração", tipo: "errada", fb: "Calçar luva sobre a mão contaminada espalha os microrganismos. Interrompa, lave as mãos e recomece com luvas novas." }
      ]
    },
    {
      quem: 0,
      fala: "Tudo certo com você? Agora reparei: o dispensador de álcool do leito 7 está vazio, e a pia fica fora do box. O que fazemos?",
      dica: "Nem toda unidade tem os mesmos recursos. Qual a saída mais segura com o que você tem?",
      opcoes: [
        { t: "Usar meu frasco individual de preparação alcoólica e avisar para repor o dispensador", tipo: "certa", fb: "Ótima saída. O frasco de bolso mantém a higiene no ponto de assistência, e avisar a reposição protege o próximo plantão." },
        { t: "Ir até a pia lavar as mãos sempre que precisar", tipo: "aceitavel", fb: "Funciona e é seguro, mas toma tempo e, na correria, a adesão cai. Vale também pedir a reposição do dispensador." },
        { t: "Seguir o atendimento e higienizar as mãos tudo de uma vez no final", tipo: "errada", fb: "Juntar tudo no final deixa vários momentos sem proteção. A higiene precisa acontecer em cada momento indicado." }
      ]
    },
    {
      quem: 2,
      fala: "Ei, me ajuda a reposicionar o Sr. José? Ah, e fiz as unhas em gel ontem, ficaram boas, né?",
      dica: "Como orientar um colega sem constranger?",
      opcoes: [
        { t: "Depois da tarefa, conversar com o Bruno em particular sobre o risco da unha em gel", tipo: "certa", fb: "Muito bem. Uma conversa respeitosa e reservada funciona melhor que bronca. Unhas artificiais acumulam microrganismos mesmo após a higiene." },
        { t: "Comunicar à enfermeira Ana para que ela oriente", tipo: "aceitavel", fb: "A supervisão pode e deve orientar, mas uma conversa direta entre colegas costuma ser mais rápida e cria um ambiente de cuidado mútuo." },
        { t: "Elogiar e não falar nada, para não criar clima", tipo: "errada", fb: "Calar mantém o risco para os pacientes. Dá para orientar com gentileza: segurança do paciente é responsabilidade de toda a equipe." }
      ]
    },
    {
      quem: 0,
      fala: "Antes de sair, você ajustou a bomba de infusão e arrumou o lençol, sem tocar no Sr. José. E agora?",
      dica: "Superfícies ao redor do paciente também contam.",
      opcoes: [
        { t: "Higienizar as mãos ao sair do box", tipo: "certa", fb: "Exato! 5º momento: após tocar superfícies próximas ao paciente. Assim você não leva microrganismos para o próximo leito." },
        { t: "Não precisa, não toquei no paciente", tipo: "errada", fb: "A cama, a bomba e o monitor ficam contaminados com a flora do paciente. O 5º momento existe por isso." },
        { t: "Só se eu estivesse de luvas", tipo: "errada", fb: "Com ou sem luvas, as mãos precisam ser higienizadas após tocar o entorno do paciente." }
      ]
    }
  ],
  encerramento: "Você aplicou os 5 momentos em situações reais do CTI. Cada higiene no momento certo é uma infecção a menos."
};

// ------------------------------------------------------------
// RECURSO "VÍDEO INSTRUTIVO" (simulado no protótipo)
// Na versão final, aqui entra um vídeo curto gerado por IA.
// ------------------------------------------------------------
const VIDEO_PASSOS = [
  { i: "🧴", t: "Aplique o produto na palma da mão em concha" },
  { i: "🤲", t: "Palma com palma" },
  { i: "✋", t: "Palma direita sobre o dorso esquerdo, e vice-versa" },
  { i: "🙌", t: "Entre os dedos, com os dedos entrelaçados" },
  { i: "👍", t: "Polegares, em movimento circular" },
  { i: "☝️", t: "Pontas dos dedos e unhas na palma oposta" },
  { i: "✨", t: "Friccione até secar: 20 a 30 segundos" }
];

// ------------------------------------------------------------
// LIGAS / SALAS (classificação por pontos acumulados)
// ------------------------------------------------------------
const LIGAS = [
  { nome: "Bronze", min: 0, cor: "#b07a4a", icone: "🥉" },
  { nome: "Prata", min: 800, cor: "#8d99a6", icone: "🥈" },
  { nome: "Ouro", min: 1800, cor: "#d4a017", icone: "🥇" },
  { nome: "Platina", min: 3200, cor: "#4fb3bf", icone: "💠" },
  { nome: "Diamante", min: 5000, cor: "#6c63ff", icone: "💎" }
];

const CATEGORIAS = ["Enfermeiro(a)", "Técnico(a) de enfermagem", "Médico(a)", "Fisioterapeuta", "Residente", "Acadêmico(a)"];
const UNIDADES = ["CTI adulto", "CTI pediátrico", "CTI neonatal"];

const REFERENCIAS = [
  "ANVISA. Segurança do Paciente em Serviços de Saúde: Higienização das Mãos. Brasília, 2009.",
  "ANVISA. RDC nº 42/2010: preparação alcoólica para fricção antisséptica das mãos.",
  "OMS. Diretrizes sobre higiene das mãos na assistência à saúde e os 5 Momentos, 2009.",
  "CDC. Guideline for Hand Hygiene in Health-Care Settings, 2002.",
  "Ministério do Trabalho. NR-32: Segurança e Saúde no Trabalho em Serviços de Saúde."
];
