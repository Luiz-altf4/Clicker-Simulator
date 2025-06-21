<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Clicker Simulator FULL</title>
  <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;700&display=swap" rel="stylesheet" />
  <link rel="stylesheet" href="style.css" />
</head>
<body>
  <div class="container">
    <header>
      <h1>🚀 Clicker do Luiz - FULL</h1>
      <button id="toggleThemeBtn" title="Trocar tema">🌙</button>
    </header>

    <div class="stats">
      <div class="score-section">
        <div id="score">0</div>
        <div id="cps">Clicks por segundo: 0</div>
        <div id="xpBarContainer">
          <div id="xpBar"></div>
          <div id="levelDisplay">Nível: 1</div>
        </div>
      </div>
      <button id="clickBtn">Clique Aqui!</button>
    </div>

    <section class="upgrades">
      <h2>Upgrades</h2>

      <div class="upgrade-box">
        <p>Clicks por clique: <span id="clickPower">1</span></p>
        <button id="upgradeClickPowerBtn">Comprar Upgrade (Custa: <span id="upgradeClickPowerCost">10</span>)</button>
      </div>

      <div class="upgrade-box">
        <p>Auto Clickers: <span id="autoClickers">0</span></p>
        <button id="buyAutoClickerBtn">Comprar Auto Clicker (Custa: <span id="autoClickerCost">50</span>)</button>
      </div>

      <div class="upgrade-box">
        <p>Multiplicador x2: <span id="multiplierCount">0</span></p>
        <button id="buyMultiplierBtn">Comprar Multiplicador (Custa: <span id="multiplierCost">100</span>)</button>
      </div>
    </section>

    <section class="boosts">
      <h2>Boosts Temporários</h2>
      <button id="speedBoostBtn">Boost de Velocidade (20 Gemas) - 30s</button>
      <button id="multiplierBoostBtn">Boost Multiplicador x5 (50 Gemas) - 30s</button>
    </section>

    <section class="missions">
      <h2>Missões Diárias</h2>
      <ul id="missionsList"></ul>
    </section>

    <section class="achievements">
      <h2>Conquistas</h2>
      <ul id="achievementsList"></ul>
    </section>

    <section class="shop">
      <h2>Loja</h2>
      <div>Gemas: <span id="gemsCount">0</span></div>
      <button id="buyGemsBtn">Comprar 100 Gemas (Simulado)</button>
    </section>

    <section class="ranking">
      <h2>Ranking Global</h2>
      <ul id="rankingList"></ul>
      <button onclick="pedirNomeESalvarScore()">Salvar Score no Ranking</button>
    </section>
  </div>

  <audio id="clickSound" src="https://actions.google.com/sounds/v1/cartoon/wood_plank_flicks.ogg"></audio>
  <audio id="buySound" src="https://actions.google.com/sounds/v1/cartoon/clang_and_wobble.ogg"></audio>
  <audio id="boostSound" src="https://actions.google.com/sounds/v1/cartoon/wood_plank_flicks.ogg"></audio>

  <!-- Firebase SDK -->
  <script src="https://www.gstatic.com/firebasejs/9.22.2/firebase-app-compat.js"></script>
  <script src="https://www.gstatic.com/firebasejs/9.22.2/firebase-firestore-compat.js"></script>

  <!-- Config Firebase -->
  <script>
    const firebaseConfig = {
      apiKey: "AIzaSyAT4F4_k9zmi9PtqUST8oiOHw5k7f1uPfg",
      authDomain: "clicker-ranking.firebaseapp.com",
      projectId: "clicker-ranking",
      storageBucket: "clicker-ranking.appspot.com",
      messagingSenderId: "72533988657",
      appId: "1:72533988657:web:b3afb73f21926b0a1ccc10",
      measurementId: "G-JPPX1JJ5VC"
    };
    firebase.initializeApp(firebaseConfig);
    var db = firebase.firestore();
  </script>

  <script src="script.js"></script>
</body>
</html>
