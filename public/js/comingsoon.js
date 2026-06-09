const launchDate = new Date();
launchDate.setDate(launchDate.getDate() + 35);

const updateCountdown = () => {
  const now = new Date().getTime();
  const distance = launchDate.getTime() - now;

  const days = Math.max(Math.floor(distance / (1000 * 60 * 60 * 24)), 0);
  const hours = Math.max(Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)), 0);
  const minutes = Math.max(Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)), 0);
  const seconds = Math.max(Math.floor((distance % (1000 * 60)) / 1000), 0);

  document.getElementById('days').textContent = String(days).padStart(2, '0');
  document.getElementById('hours').textContent = String(hours).padStart(2, '0');
  document.getElementById('minutes').textContent = String(minutes).padStart(2, '0');
  document.getElementById('seconds').textContent = String(seconds).padStart(2, '0');

  if (distance <= 0) {
    document.querySelector('.coming-soon-copy').textContent = 'We are live now. Stay tuned for the next update.';
    clearInterval(timerInterval);
  }
};

const timerInterval = setInterval(updateCountdown, 1000);
updateCountdown();
