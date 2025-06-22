// Variáveis e DOM
let score = 0, clickPower = 1, autoClickers = 0, multiplierCount = 0, multiplier = 1;
let cps = 0, level = 1, xp = 0, gems = 0, rebirths = 0;
const els = id => document.getElementById(id);
const scoreEl = els('score'), cpEl = els('clickPower'), acEl = els('autoClickers'),
      mcEl = els('multiplierCount'), mEl = els('multiplier'), cpsEl = els('cps'),
      lvlEl = els('levelDisplay'), xpBar = els('xpBar'),
      gemsEl = els('gemsCount'), rebEl = els('rebirthCount'),
      ucCostEl = els('upgradeClickPowerCost'),
      acCostEl = els('autoClickerCost'),
      mcCostEl = els('multiplierCost');
let upgradeAmount = 1;

// Custos (BigInt)
const bCP = 10n, gNum = 15n, gDen = 10n; // 1.5^n scale
const bAC = 50n, bM = 100n;

// Potencia BigInt decimal
function powBI(base, exp, den) {
  let res = den, b = base, e=BigInt(exp);
  while(e>0n){ if(e&1n) res = res*b/den; b = b*b/den; e>>=1n; }
  return res;
}
const fmt = n => {
  if(n<1e3) return n.toString();
  const u = ['','K','M','B','T','Qa','Qi','Sx','Sp','Oc'];
  let e = Math.min(Math.floor(Math.log10(n)/3),u.length-1);
  return (n/Math.pow(1000,e)).toFixed(2)+u[e];
};

// Cálculos custo
const itemC = n => Number(bCP * powBI(gNum, n-1, gDen));
const totC = (q, a) => {
  let first = bCP * powBI(gNum, BigInt(a), gDen);
  let r= powBI(gNum,1n,gDen), rn=powBI(gNum,BigInt(q),gDen);
  return Number(((first*rn-first)/(r-1n)));
};
const totAC = (q,a)=>{
  q=BigInt(q); let a1=bAC*(BigInt(a)+1n),d=1n;
  return Number((q*(2n*a1+(q-1n)*d))/2n);
};
const totM = (q,a)=>{
  q=BigInt(q); let a1=bM*(BigInt(a)+1n),d=bM;
  return Number((q*(2n*a1+(q-1n)*d))/2n);
};

// Busca binária
function maxBuy(calc, score, a){
  let l=0,r=1e6,m,ans=0;
  while(l<=r){
    m=(l+r)/2|0;
    if(calc(m, a)<=score){ ans=m; l=m+1; }
    else r=m-1;
  }
  return ans;
}

// Atualizar UI
function update(){
  scoreEl.textContent = fmt(score);
  cpEl.textContent = fmt(clickPower);
  acEl.textContent = autoClickers;
  mcEl.textContent = multiplierCount;
  mEl.textContent = multiplier;
  cps = clickPower*multiplier*autoClickers;
  cpsEl.textContent = `CPS: ${fmt(cps)}`;
  lvlEl.textContent = level;
  gemsEl.textContent = fmt(gems);
  rebEl.textContent = rebirths;
  ucCostEl.textContent = fmt(totC(1, clickPower));
  acCostEl.textContent = fmt(totAC(1, autoClickers));
  mcCostEl.textContent = fmt(totM(1, multiplierCount));
  xpBar.style.width = `${Math.min(100,(xp/(level*100))*100)}%`;
  localStorage.setItem('clickerSave', JSON.stringify({score,clickPower,autoClickers,multiplierCount,multiplier,level,xp,gems, rebirths}));
}

// Seleção upgradeAmount
document.querySelectorAll('.upgradeAmountBtn').forEach(b=>{
  b.addEventListener('click',()=>{
    document.querySelectorAll('.upgradeAmountBtn').forEach(x=>x.classList.remove('active'));
    b.classList.add('active');
    upgradeAmount = b.dataset.amount=='max'? 'max': +b.dataset.amount;
  });
});

// Ações botões
els('clickBtn').onclick = ()=>{ score += clickPower*multiplier; xp++; update(); };
function buy(type){
  let qty = upgradeAmount=='max'?
    maxBuy(type=='cp'?totC:type=='ac'?totAC:totM, score, type=='cp'?clickPower:type=='ac'?autoClickers:multiplierCount)
    : upgradeAmount;
  if(qty<=0){ alert('Sem saldo suficiente'); return; }
  let cost = type=='cp'?totC(qty,clickPower): type=='ac'?totAC(qty,autoClickers):totM(qty,multiplierCount);
  if(cost>score){ alert('Saldo insuficiente'); return; }
  score -= cost;
  if(type=='cp') clickPower += qty;
  if(type=='ac') autoClickers += qty;
  if(type=='m'){
    multiplierCount += qty;
    multiplier = (multiplierCount+1)*(rebirths*2||1);
  }
  update();
}
els('upgradeClickPowerBtn').onclick = ()=>buy('cp');
els('buyAutoClickerBtn').onclick = ()=>buy('ac');
els('buyMultiplierBtn').onclick = ()=>buy('m');

// Boosts
els('speedBoostBtn').onclick = ()=>{
  if(gems<20){ alert('Gemas insuficientes'); return; }
  gems-=20;
  let orig = autoClickers;
  autoClickers*=2;
  update();
  setTimeout(()=>{ autoClickers=orig; update(); },30000);
};
els('multiplierBoostBtn').onclick = ()=>{
  if(gems<50){ alert('Gemas insuficientes'); return; }
  gems-=50;
  let orig = multiplier;
  multiplier*=2;
  update();
  setTimeout(()=>{ multiplier=orig; update(); },30000);
};
els('buyGemsBtn').onclick = ()=>{
  if(score<10000){ alert('Score insuficiente'); return; }
  score-=10000; gems+=100;
  update();
};

// Rebirth & reset
els('rebirthBtn').onclick = ()=>{
  if(level<10){ alert('Alcance nível 10 para rebirth'); return; }
  rebirths++; score=0; clickPower=1; autoClickers=0; multiplierCount=0;
  multiplier = (multiplierCount+1)*(rebirths*2||1);
  xp=0; update();
};
els('resetBtn').onclick = ()=>{
  if(confirm('Resetar tudo?')){ localStorage.clear(); location.reload(); }
};

// Auto clickers geram score
setInterval(()=>{
  score += autoClickers*clickPower*multiplier;
  xp += autoClickers;
  update();
},1000);

// Carregar save
window.onload = ()=>{
  let s = JSON.parse(localStorage.getItem('clickerSave'));
  if(s){ Object.assign(this, s); update(); }
};
