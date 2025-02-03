// Request permission for notifications
function requestNotificationPermission() {
  if (Notification.permission !== 'granted') {
    Notification.requestPermission().then(permission => {
      if (permission === 'granted') {
        console.log('Notification permission granted.');
      }
    });
  }
}

// Send a desktop notification
function sendNotification(message) {
  if (Notification.permission === 'granted') {
    new Notification('Bitcoin Price Alert', {
      body: message,
      icon: 'https://cdn-icons-png.flaticon.com/512/1490/1490849.png',
    });
  }
}

// Global variables
let highPrice = parseFloat(localStorage.getItem('highPrice')) || null;
let lowPrice = parseFloat(localStorage.getItem('lowPrice')) || null;
let dailyHigh = null;
let dailyLow = null;
let currentPriceAtPrediction = null;
let predictionTimeout = null;

// Initialize Chart.js for real-time Bitcoin price trend
const priceData = [];
const labels = [];
const ctx = document.getElementById('priceChart').getContext('2d');

const priceChart = new Chart(ctx, {
  type: 'line',
  data: {
    labels: labels,
    datasets: [{
      label: 'Bitcoin Price (USD)',
      data: priceData,
      borderColor: '#ff6f61',
      borderWidth: 2,
      fill: false,
      tension: 0.1,
    }]
  },
  options: {
    responsive: true,
    scales: {
      x: { title: { display: true, text: 'Time' } },
      y: { title: { display: true, text: 'Price (USD)' } }
    }
  }
});

// Update threshold display
function updateThresholdDisplay() {
  document.getElementById('currentHigh').textContent = highPrice ? `$${highPrice}` : 'Not set';
  document.getElementById('currentLow').textContent = lowPrice ? `$${lowPrice}` : 'Not set';
}

// Fetch Bitcoin price and update the chart
async function fetchBitcoinPrice() {
  try {
    const response = await fetch('https://api.coindesk.com/v1/bpi/currentprice/BTC.json');
    const data = await response.json();
    const currentPrice = data.bpi.USD.rate_float;

    dailyHigh = dailyHigh === null || currentPrice > dailyHigh ? currentPrice : dailyHigh;
    dailyLow = dailyLow === null || currentPrice < dailyLow ? currentPrice : dailyLow;

    document.getElementById('currentPrice').textContent = `$${currentPrice}`;
    document.getElementById('dailyHigh').textContent = `$${dailyHigh}`;
    document.getElementById('dailyLow').textContent = `$${dailyLow}`;

    // Update real-time price trend chart
    const timestamp = new Date().toLocaleTimeString();
    if (priceData.length >= 10) {
      priceData.shift();
      labels.shift();
    }
    priceData.push(currentPrice);
    labels.push(timestamp);
    priceChart.update();

    return currentPrice;
  } catch (error) {
    console.error('Error fetching Bitcoin price:', error);
  }
}

// Bitcoin Price Prediction Game
document.getElementById('predictUp').addEventListener('click', () => startPrediction('up'));
document.getElementById('predictDown').addEventListener('click', () => startPrediction('down'));

function startPrediction(prediction) {
  if (predictionTimeout) {
    alert('A prediction is already in progress. Please wait for the result.');
    return;
  }

  currentPriceAtPrediction = parseFloat(document.getElementById('currentPrice').textContent.replace('$', ''));
  document.getElementById('gameResult').textContent = 'Waiting for the result...';

  predictionTimeout = setTimeout(async () => {
    const currentPrice = await fetchBitcoinPrice();
    const result = currentPrice > currentPriceAtPrediction ? 'up' : 'down';

    if (result === prediction) {
      document.getElementById('gameResult').textContent = 'You win! 🎉';
    } else {
      document.getElementById('gameResult').textContent = 'You lose! 😢';
    }

    predictionTimeout = null;
  }, 10000);
}

// Fun Facts Section
const bitcoinFacts = [
  'Bitcoin was created in 2009 by an unknown person or group using the pseudonym Satoshi Nakamoto.',
  'The smallest unit of Bitcoin is called a Satoshi, named after its creator.',
  'There will only ever be 21 million Bitcoins in existence.',
  'The first real-world Bitcoin transaction was for two pizzas, which cost 10,000 BTC in 2010.',
  'Bitcoin is decentralized, meaning no single entity controls it.',
  'El Salvador became the first country to adopt Bitcoin as legal tender in 2021.',
  'The Bitcoin network consumes a significant amount of energy, comparable to some small countries.',
  'Bitcoin transactions are irreversible once confirmed.',
  'The Bitcoin whitepaper is only 9 pages long.',
  'Bitcoin is often referred to as "digital gold."',
];

function displayRandomFact() {
  const randomIndex = Math.floor(Math.random() * bitcoinFacts.length);
  document.getElementById('funFact').textContent = bitcoinFacts[randomIndex];
}

document.getElementById('newFactButton').addEventListener('click', displayRandomFact);

// Run initial setup
window.onload = function () {
  requestNotificationPermission();
  updateThresholdDisplay();
  fetchBitcoinPrice();
  displayRandomFact();
};