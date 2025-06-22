// Game state
let score = 0, clickPower = 1, autoClickers = 0, multiplierCount = 0, multiplier = 1;
let cps = 0, level = 1, xp = 0, gems = 0, rebirths = 0;
let world = 'earth';
let upgradeAmount = 1;

const els = id => document.getElementById(id);
const worldNames = {earth:'Terra', moon:'Lua', mars:'Marte'};

// Utility
const fmt = n => {
  if(n<1e3) return n.toString();
  const u = ['','K','M','B','T'];
  let e = Math.floor(Math.log10(n)/3);
  return (n/Math.pow(1000,e)).toFixed(2) + u[e];
};

function updateUI(){
  els('score').textContent = fmt(score);
  els('clickPower').textContent = fmt(clickPower);
  els('autoClickers').textContent = autoClickers;
  els('multiplierCount').textContent = multiplierCount;
  els('multiplier').textContent = multiplier;
  cps = clickPower * multiplier * autoClickers;
  els('cps').textContent = fmt(cps);
  els('worldName').textContent = worldNames[world];
  els('level').textContent = level;
  els('xpBar').style.width = `${Math.min(100,(xp/(level*100))*100)}%`;
  els('gems').textContent = fmt(gems);
  els('rebirths').textContent = rebirths;

  // Dynamic costs
  els('cpCost').textContent = fmt(calcCost(cpGrowth, clickPower));
  els('acCost').textContent = fmt(calcCostLin(acBase, autoClickers));
  els('mCost').textContent = fmt(calcCostLin(mBase, multiplierCount));

  saveGame();
}

// Cost models
const cpBase=10, cpGrowth=1.5;
const acBase=50, mBase=100;

const calcCost = (g,n) => Math.floor(cpBase * Math.pow(g, n));
const calcCostLin = (base, n) => base * (n+1);

// Button click
els('clickBtn').onclick = () => {
  score += clickPower * multiplier;
  xp++; updateUI();
};

// Multi-buy logic
document.querySelectorAll('.upgradeAmountBtn').forEach(b=>{
  b.onclick = ()=>{
    document.querySelectorAll('.upgradeAmountBtn').forEach(x=>x.classList.remove('active'));
    b.classList.add('active');
    upgradeAmount = b.dataset.amount === 'max' ? 'max' : +b.dataset.amount;
  };
});

// Buy actions
function maxBuy(calcF,n){
  let low=0,high=1e5,mid,best=0;
  while(low<=high){
    mid=(low+high)/2|0;
    if(calcF(n+mid)-calcF(n)*mid <= score){ best=mid; low=mid+1; }
    else high=mid-1;
  }
  return best;
}

function buy(type){
  let costF, attr, growth;
  if(type=='cp'){costF=n=>calcCost(cpGrowth,n); attr='clickPower'; }
  if(type=='ac'){costF=n=>calcCostLin(acBase,n); attr='autoClickers'}
  if(type=='m'){costF=n=>calcCostLin(mBase,n); attr='multiplierCount'}

  let cur = window[attr], qty = upgradeAmount==='max'? maxBuy(costF,cur): upgradeAmount;
  let cost = costF(cur) * qty;
  if(qty<=0 || cost>score){ alert('Saldo insuficiente'); return; }

  score -= cost;
  window[attr] += qty;
  if(type==='m') multiplier = (multiplierCount+1)*(rebirths*2||1);
  updateUI();
}
els('cpBtn').onclick = ()=>buy('cp');
els('acBtn').onclick = ()=>buy('ac');
els('mBtn').onclick = ()=>buy('m');

// Boosts & Rebirth
els('speedBtn').onclick = ()=>{
  if(gems<20){ alert('Gemas insuficientes'); return; }
  gems-=20; autoClickers *=2; setTimeout(()=>{autoClickers/=2;updateUI()},30000); updateUI();
};
els('multiBtn').onclick = ()=>{
  if(gems<50){ alert('Gemas insuficientes'); return; }
  gems-=50; multiplier*=2; setTimeout(()=>{multiplier/=2;updateUI()},30000); updateUI();
};
els('gemBtn').onclick = ()=>{
  if(score<10000){ alert('Precisar 10k clicks'); return; }
  score-=10000; gems+=100; updateUI();
};
els('rebirthBtn').onclick = ()=>{
  if(level<10){ alert('Alcance nível 10'); return; }
  rebirths++;score=0;clickPower=1;autoClickers=0;multiplierCount=0;
  multiplier=(multiplierCount+1)*(rebirths*2||1); xp=0; updateUI();
};
els('resetBtn').onclick = ()=>{if(confirm('Resetar tudo?')){localStorage.clear(); location.reload()}};

// World switch
document.querySelectorAll('.world-switch-btn').forEach(b=>{
  b.onclick = ()=>{
    if(b.dataset.world === world) return;
    world = b.dataset.world;
    let boost = {earth:1, moon:1.5, mars:2}[world];
    clickPower *= boost;
    alert(`Bem-vindo a ${worldNames[world]}! Power aumentado x${boost}`);
    updateUI();
  };
});

// Auto income
setInterval(()=>{
  score += cps;
  xp += autoClickers;
  if(xp >= level*100){ xp -= level*100; level++; gems+=5; }
  updateUI();
},1000);

// Save/load
function saveGame(){
  localStorage.setItem('cs2', JSON.stringify({score,clickPower,autoClickers,multiplierCount,multiplier,level,xp,gems,rebirths,world}));
}
function loadGame(){
  let d = JSON.parse(localStorage.getItem('cs2'));
  if(d){ Object.assign(this, d); updateUI(); }
}
window.onload = loadGame;

