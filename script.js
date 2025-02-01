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
      icon: 'https://cdn-icons-png.flaticon.com/512/1490/1490849.png', // Optional: Add an icon
    });
  }
}

document.getElementById('priceForm').addEventListener('submit', function (e) {
  e.preventDefault();
  const highPrice = parseFloat(document.getElementById('highPrice').value);
  const lowPrice = parseFloat(document.getElementById('lowPrice').value);

  if (isNaN(highPrice) || isNaN(lowPrice)) {
    alert('Please enter valid numbers for the price thresholds.');
    return;
  }

  // Save thresholds to localStorage
  localStorage.setItem('highPrice', highPrice);
  localStorage.setItem('lowPrice', lowPrice);

  // Update the displayed thresholds
  updateThresholdDisplay(highPrice, lowPrice);

  // Fetch Bitcoin price every 10 seconds
  setInterval(() => checkBitcoinPrice(highPrice, lowPrice), 10000);
});

document.getElementById('refreshButton').addEventListener('click', function () {
  fetchBitcoinPrice();
});

document.getElementById('clearThresholds').addEventListener('click', function () {
  // Remove thresholds from localStorage
  localStorage.removeItem('highPrice');
  localStorage.removeItem('lowPrice');

  // Update the displayed thresholds to "Not set"
  updateThresholdDisplay(null, null);

  // Clear any active alerts
  document.getElementById('alert').textContent = '';
});

// Load thresholds from localStorage on page load
let highPrice = parseFloat(localStorage.getItem('highPrice')) || null;
let lowPrice = parseFloat(localStorage.getItem('lowPrice')) || null;

// Update the displayed thresholds on page load
updateThresholdDisplay(highPrice, lowPrice);

let dailyHigh = null;
let dailyLow = null;

const priceData = []; // Store last 10 prices
const labels = [];    // Store timestamps for the chart

// Initialize Chart.js
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

// Update chart data
function updateChart(newPrice) {
  const timestamp = new Date().toLocaleTimeString();
  if (priceData.length >= 10) {
    priceData.shift();  // Remove the oldest price
    labels.shift();     // Remove the oldest timestamp
  }
  priceData.push(newPrice);
  labels.push(timestamp);

  priceChart.update();
}

async function fetchBitcoinPrice() {
  try {
    const response = await fetch('https://api.coindesk.com/v1/bpi/currentprice/BTC.json');
    const data = await response.json();
    const currentPrice = data.bpi.USD.rate_float;

    // Update daily high and low
    if (dailyHigh === null || currentPrice > dailyHigh) {
      dailyHigh = currentPrice;
    }
    if (dailyLow === null || currentPrice < dailyLow) {
      dailyLow = currentPrice;
    }

    // Update the UI
    document.getElementById('currentPrice').textContent = `$${currentPrice}`;
    document.getElementById('dailyHigh').textContent = `$${dailyHigh}`;
    document.getElementById('dailyLow').textContent = `$${dailyLow}`;

    // Update chart
    updateChart(currentPrice);

    return currentPrice;
  } catch (error) {
    console.error('Error fetching Bitcoin price:', error);
  }
}

async function checkBitcoinPrice(highPrice, lowPrice) {
  const currentPrice = await fetchBitcoinPrice();

  const alertDiv = document.getElementById('alert');
  if (currentPrice > highPrice) {
    const message = `Bitcoin is above $${highPrice}! Current price: $${currentPrice}`;
    alertDiv.textContent = `Alert: ${message}`;
    sendNotification(message); // Send desktop notification
  } else if (currentPrice < lowPrice) {
    const message = `Bitcoin is below $${lowPrice}! Current price: $${currentPrice}`;
    alertDiv.textContent = `Alert: ${message}`;
    sendNotification(message); // Send desktop notification
  } else {
    alertDiv.textContent = '';
  }
}

function updateThresholdDisplay(highPrice, lowPrice) {
  document.getElementById('currentHigh').textContent = highPrice ? `$${highPrice}` : 'Not set';
  document.getElementById('currentLow').textContent = lowPrice ? `$${lowPrice}` : 'Not set';
}

// Prediction Game Logic
let currentPriceAtPrediction = null;
let predictionTimeout = null;

document.getElementById('predictUp').addEventListener('click', function () {
  startPrediction('up');
});

document.getElementById('predictDown').addEventListener('click', function () {
  startPrediction('down');
});

function startPrediction(prediction) {
  if (predictionTimeout) {
    alert('A prediction is already in progress. Wait for the result!');
    return;
  }

  currentPriceAtPrediction = parseFloat(document.getElementById('currentPrice').textContent.replace('$', ''));
  document.getElementById('gameResult').textContent = 'Waiting for the result...';

  predictionTimeout = setTimeout(() => {
    const currentPrice = parseFloat(document.getElementById('currentPrice').textContent.replace('$', ''));
    const result = currentPrice > currentPriceAtPrediction ? 'up' : 'down';

    if (result === prediction) {
      document.getElementById('gameResult').textContent = 'You win! 🎉';
    } else {
      document.getElementById('gameResult').textContent = 'You lose! 😢';
    }

    predictionTimeout = null;
  }, 10000); // 10 seconds
}

// Bitcoin Fun Facts
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

// Function to get a random fact
function getRandomFact() {
  const randomIndex = Math.floor(Math.random() * bitcoinFacts.length);
  return bitcoinFacts[randomIndex];
}

// Display a random fact on page load
document.getElementById('funFact').textContent = getRandomFact();

// Add event listener for the "Get New Fact" button
document.getElementById('newFactButton').addEventListener('click', function () {
  document.getElementById('funFact').textContent = getRandomFact();
});

// Request notification permission when the page loads
window.onload = requestNotificationPermission;

// Initial fetch
fetchBitcoinPrice();

// Historical Price Data Logic
document.getElementById('loadHistoricalData').addEventListener('click', function () {
  const timeRange = document.getElementById('timeRange').value;
  fetchHistoricalData(timeRange);
});

async function fetchHistoricalData(days) {
  try {
    const response = await fetch(
      `https://api.coingecko.com/api/v3/coins/bitcoin/market_chart?vs_currency=usd&days=${days}`
    );
    const data = await response.json();
    const prices = data.prices;

    // Extract dates and prices
    const labels = prices.map(price => new Date(price[0]).toLocaleDateString());
    const dataPoints = prices.map(price => price[1]);

    // Update the historical price chart
    updateHistoricalChart(labels, dataPoints);
  } catch (error) {
    console.error('Error fetching historical data:', error);
  }
}

// Initialize Historical Price Chart
const historicalCtx = document.getElementById('historicalPriceChart').getContext('2d');
const historicalPriceChart = new Chart(historicalCtx, {
  type: 'line',
  data: {
    labels: [],
    datasets: [{
      label: 'Bitcoin Price (USD)',
      data: [],
      borderColor: '#ff6f61',
      borderWidth: 2,
      fill: false,
      tension: 0.1,
    }]
  },
  options: {
    responsive: true,
    scales: {
      x: { title: { display: true, text: 'Date' } },
      y: { title: { display: true, text: 'Price (USD)' } }
    }
  }
});

// Update Historical Price Chart
function updateHistoricalChart(labels, dataPoints) {
  historicalPriceChart.data.labels = labels;
  historicalPriceChart.data.datasets[0].data = dataPoints;
  historicalPriceChart.update();
}