// === Parte 3: Salvamento Avançado, Segurança Chat, Validação, UI, Animações RGB, Tutorial Completo ===

// === Salvamento automático e manual avançado ===
function autoSave() {
  saveGame();
  notify("Jogo salvo automaticamente.");
}

setInterval(autoSave, 30000); // salva a cada 30s

window.manualSave = function() {
  saveGame();
  notify("Jogo salvo manualmente!");
};

window.manualLoad = function() {
  const data = localStorage.getItem("clickerSave");
  if (!data) {
    notify("Nenhum salvamento encontrado.");
    return;
  }
  Object.assign(gameState, JSON.parse(data));
  updateDisplay();
  renderUpgrades();
  renderPets();
  renderSkins();
  renderAchievements();
  renderMissions();
  notify("Jogo carregado com sucesso!");
};

// === Validação e sanitização do chat ===
function sanitizeText(text) {
  const tempDiv = document.createElement("div");
  tempDiv.textContent = text;
  return tempDiv.innerHTML;
}

let chatCooldown = false;

function sendChatMessage() {
  if (chatCooldown) {
    notify("Aguarde antes de enviar outra mensagem.");
    playGameSound("error");
    return;
  }
  const input = $("chatInput");
  let text = input.value.trim();
  if (!text) {
    notify("Mensagem vazia não é permitida.");
    playGameSound("error");
    return;
  }
  if (text.length > 150) {
    notify("Mensagem muito longa (máx 150 caracteres).");
    playGameSound("error");
    return;
  }
  text = sanitizeText(text);
  if (!gameState.playerName) {
    notify("Defina seu nome para usar o chat.");
    playGameSound("error");
    return;
  }

  push(chatRef, {
    playerName: sanitizeText(gameState.playerName),
    text,
    timestamp: Date.now()
  });

  input.value = "";
  chatCooldown = true;
  setTimeout(() => { chatCooldown = false; }, 5000);
}

$("chatSendBtn").addEventListener("click", sendChatMessage);
$("chatInput").addEventListener("keypress", e => {
  if (e.key === "Enter") sendChatMessage();
});

// === Prevenir spam: Limita mensagens repetidas consecutivas ===
let lastMessage = "";

onValue(query(chatRef, orderByChild("timestamp"), limitToLast(50)), snapshot => {
  const data = snapshot.val();
  if (!data) return;
  const messages = Object.values(data).sort((a, b) => a.timestamp - b.timestamp);

  // Remove mensagens consecutivas iguais do mesmo usuário
  let filteredMessages = [];
  let lastMsgText = null;
  messages.forEach(msg => {
    if (!(msg.text === lastMsgText && filteredMessages.length > 0 && filteredMessages[filteredMessages.length-1].playerName === msg.playerName)) {
      filteredMessages.push(msg);
      lastMsgText = msg.text;
    }
  });

  renderChat(filteredMessages);
});

// === Animações e efeitos RGB para botões e elementos ===
function animateRGB(element) {
  let hue = 0;
  setInterval(() => {
    hue = (hue + 1) % 360;
    element.style.backgroundColor = `hsl(${hue}, 80%, 50%)`;
    element.style.boxShadow = `0 0 10px hsl(${hue}, 80%, 60%)`;
  }, 40);
}

document.querySelectorAll(".btn-rgb").forEach(el => animateRGB(el));

// === Tooltip dinâmico para upgrades e pets ===
function createTooltip(element, text) {
  let tooltip = document.createElement("div");
  tooltip.className = "tooltip";
  tooltip.textContent = text;
  document.body.appendChild(tooltip);

  element.addEventListener("mouseenter", e => {
    tooltip.style.opacity = "1";
    tooltip.style.left = `${e.pageX + 10}px`;
    tooltip.style.top = `${e.pageY + 10}px`;
  });
  element.addEventListener("mousemove", e => {
    tooltip.style.left = `${e.pageX + 10}px`;
    tooltip.style.top = `${e.pageY + 10}px`;
  });
  element.addEventListener("mouseleave", () => {
    tooltip.style.opacity = "0";
  });
}

// Aplica tooltips
function applyTooltips() {
  document.querySelectorAll(".upgrade, .pet, .skin").forEach(el => {
    const desc = el.getAttribute("data-desc");
    if (desc) createTooltip(el, desc);
  });
}

// Chama após renderizações
setTimeout(applyTooltips, 1000);

// === Tutorial completo com etapas interativas ===
const fullTutorialSteps = [
  { text: "Clique no botão grande para ganhar cliques.", highlight: "#clickArea" },
  { text: "Compre upgrades para aumentar seus cliques por segundo.", highlight: "#upgradesList" },
  { text: "Adquira pets para ajudar a clicar automaticamente.", highlight: "#petsList" },
  { text: "Explore as skins para personalizar o visual.", highlight: "#skinsList" },
  { text: "Use o chat para conversar com outros jogadores.", highlight: "#chatContainer" },
  { text: "Veja seu ranking entre os melhores jogadores.", highlight: "#rankingList" },
  { text: "Complete missões para ganhar recompensas extras.", highlight: "#missionsList" },
  { text: "Faça rebirth para começar do zero com bônus.", highlight: "#rebirthBtn" },
  { text: "Ajuste o tema e configurações ao seu gosto.", highlight: "#settings" },
  { text: "Divirta-se e continue clicando muito!", highlight: null }
];

let tutorialIndex = 0;

function showFullTutorialStep() {
  const step = fullTutorialSteps[tutorialIndex];
  const tutorialBox = $("tutorialBox");
  tutorialBox.textContent = step.text;

  // Remove highlights anteriores
  document.querySelectorAll(".highlighted").forEach(el => el.classList.remove("highlighted"));

  if (step.highlight) {
    const targetEl = document.querySelector(step.highlight);
    if (targetEl) targetEl.classList.add("highlighted");
  }
}

$("tutorialNextBtn").addEventListener("click", () => {
  tutorialIndex++;
  if (tutorialIndex >= fullTutorialSteps.length) {
    $("tutorialBox").style.display = "none";
    document.querySelectorAll(".highlighted").forEach(el => el.classList.remove("highlighted"));
  } else {
    showFullTutorialStep();
  }
});

// Inicia tutorial completo ao carregar
document.addEventListener("DOMContentLoaded", () => {
  const tutorialBox = $("tutorialBox");
  if (tutorialBox) {
    tutorialBox.style.display = "block";
    showFullTutorialStep();
  }
});

// === Atualização visual do XP bar a cada 1s para garantir fluidez ===
setInterval(() => {
  animateXPBar();
}, 1000);

// === Suporte ao resize para responsividade das partículas ===
window.addEventListener("resize", () => {
  // Pode adaptar partículas e UI aqui se precisar
});

// === Eventos extras para melhor UX ===
// Impede seleção de texto ao clicar no botão grande
$("clickArea").addEventListener("mousedown", e => e.preventDefault());

// Foco no input do chat ao abrir a aba chat
document.querySelectorAll(".tab-btn").forEach(btn => {
  btn.addEventListener("click", () => {
    if (btn.dataset.target === "chatContainer") {
      setTimeout(() => $("chatInput").focus(), 200);
    }
  });
});

// === Finalização do carregamento do jogo ===
document.addEventListener("DOMContentLoaded", () => {
  loadGame();
  renderUpgrades();
  renderPets();
  renderSkins();
  renderAchievements();
  renderMissions();
  updateDisplay();
  renderSettings();

  if (!gameState.playerName) {
    let name = prompt("Digite seu nome para o ranking e chat:");
    if (!name) name = "Jogador" + Math.floor(Math.random() * 1000);
    gameState.playerName = name;
    saveGame();
  }

  // Começa loop de atualização contínua
  setInterval(() => {
    updateRanking();
    saveGame();
  }, 10000);
});
