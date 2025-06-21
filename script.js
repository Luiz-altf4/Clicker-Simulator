let score = 0;

const scoreDisplay = document.getElementById('score');
const clickBtn = document.getElementById('clickBtn');

clickBtn.addEventListener('click', () => {
  score++;
  scoreDisplay.textContent = score;
});
