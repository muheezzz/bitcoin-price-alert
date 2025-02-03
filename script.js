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
      priceData.shift(); // Remove oldest price
      labels.shift(); // Remove oldest timestamp
    }
    priceData.push(currentPrice);
    labels.push(timestamp);
    priceChart.update();

    return currentPrice;
  } catch (error) {
    console.error('Error fetching Bitcoin price:', error);
  }
}

// Check price against thresholds
async function checkBitcoinPrice() {
  const currentPrice = await fetchBitcoinPrice();
  const alertDiv = document.getElementById('alert');

  if (highPrice && currentPrice > highPrice) {
    alertDiv.textContent = `Bitcoin is above $${highPrice}! Current price: $${currentPrice}`;
    sendNotification(alertDiv.textContent);
  } else if (lowPrice && currentPrice < lowPrice) {
    alertDiv.textContent = `Bitcoin is below $${lowPrice}! Current price: $${currentPrice}`;
    sendNotification(alertDiv.textContent);
  } else {
    alertDiv.textContent = '';
  }
}

// Set up event listeners
document.getElementById('priceForm').addEventListener('submit', function (e) {
  e.preventDefault();
  highPrice = parseFloat(document.getElementById('highPrice').value);
  lowPrice = parseFloat(document.getElementById('lowPrice').value);

  localStorage.setItem('highPrice', highPrice);
  localStorage.setItem('lowPrice', lowPrice);
  updateThresholdDisplay();
});

// Clear thresholds
document.getElementById('clearThresholds').addEventListener('click', function () {
  localStorage.removeItem('highPrice');
  localStorage.removeItem('lowPrice');
  highPrice = null;
  lowPrice = null;
  updateThresholdDisplay();
});

// Periodic updates
setInterval(checkBitcoinPrice, 10000);

// Request notification permission
window.onload = function () {
  requestNotificationPermission();
  updateThresholdDisplay();
  fetchBitcoinPrice();
};

// Historical Price Data Logic
document.getElementById('loadHistoricalData').addEventListener('click', function () {
  const timeRange = document.getElementById('timeRange').value;
  fetchHistoricalData(timeRange);
});

// Initialize Chart.js for historical price data
const historicalCtx = document.getElementById('historicalPriceChart').getContext('2d');
const historicalPriceChart = new Chart(historicalCtx, {
  type: 'line',
  data: {
    labels: [],
    datasets: [{
      label: 'Bitcoin Historical Price (USD)',
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

// Fetch and update historical price chart
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

    updateHistoricalChart(labels, dataPoints);
  } catch (error) {
    console.error('Error fetching historical data:', error);
  }
}

// Update Historical Price Chart
function updateHistoricalChart(labels, dataPoints) {
  historicalPriceChart.data.labels = labels;
  historicalPriceChart.data.datasets[0].data = dataPoints;
  historicalPriceChart.update();
}