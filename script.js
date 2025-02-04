// Global variables
let highPrice = parseFloat(localStorage.getItem('highPrice')) || null;
let lowPrice = parseFloat(localStorage.getItem('lowPrice')) || null;
let dailyHigh = null;
let dailyLow = null;
let previousPrice = null; // Track previous price for percentage change
let predictionStartPrice = null; // Track the price when the prediction starts

// Initialize Chart.js for real-time Bitcoin price trend
const ctx = document.getElementById('priceChart').getContext('2d');
const priceChart = new Chart(ctx, {
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
      x: { title: { display: true, text: 'Time' } },
      y: { title: { display: true, text: 'Price (USD)' } }
    }
  }
});

// Update threshold display
function updateThresholdDisplay() {
  document.getElementById('currentHigh').textContent = highPrice ? `$${highPrice.toFixed(2)}` : 'Not set';
  document.getElementById('currentLow').textContent = lowPrice ? `$${lowPrice.toFixed(2)}` : 'Not set';
}

// Fetch Bitcoin price and update the chart
async function fetchBitcoinPrice() {
  try {
    const response = await fetch('https://api.coindesk.com/v1/bpi/currentprice/BTC.json');
    if (!response.ok) throw new Error('Failed to fetch Bitcoin price');
    const data = await response.json();
    const currentPrice = data.bpi.USD.rate_float;

    // Calculate percentage change
    let percentageChange = 0;
    if (previousPrice !== null) {
      percentageChange = ((currentPrice - previousPrice) / previousPrice) * 100;
    }
    previousPrice = currentPrice; // Update previous price

    // Update daily high and low
    dailyHigh = dailyHigh === null || currentPrice > dailyHigh ? currentPrice : dailyHigh;
    dailyLow = dailyLow === null || currentPrice < dailyLow ? currentPrice : dailyLow;

    // Update DOM elements
    const currentPriceElement = document.getElementById('currentPrice');
    const dailyHighElement = document.getElementById('dailyHigh');
    const dailyLowElement = document.getElementById('dailyLow');
    const percentageChangeElement = document.getElementById('percentageChange');

    if (currentPriceElement) currentPriceElement.textContent = `$${currentPrice.toFixed(2)}`;
    if (dailyHighElement) dailyHighElement.textContent = `$${dailyHigh.toFixed(2)}`;
    if (dailyLowElement) dailyLowElement.textContent = `$${dailyLow.toFixed(2)}`;
    if (percentageChangeElement) {
      percentageChangeElement.textContent = `${percentageChange.toFixed(2)}%`;
      percentageChangeElement.style.color = percentageChange >= 0 ? '#4caf50' : '#f44336'; // Green for positive, red for negative
    }

    // Update price chart
    const timestamp = new Date().toLocaleTimeString();
    priceChart.data.labels.push(timestamp);
    priceChart.data.datasets[0].data.push(currentPrice);

    // Keep only the last 10 data points
    if (priceChart.data.labels.length > 10) {
      priceChart.data.labels.shift();
      priceChart.data.datasets[0].data.shift();
    }

    priceChart.update();
  } catch (error) {
    console.error('Error fetching Bitcoin price:', error);
    const currentPriceElement = document.getElementById('currentPrice');
    if (currentPriceElement) currentPriceElement.textContent = 'Failed to load price';
  }
}

// Historical Data Chart
const historicalCtx = document.getElementById('historicalPriceChart').getContext('2d');
const historicalPriceChart = new Chart(historicalCtx, {
  type: 'line',
  data: {
    labels: [],
    datasets: [{
      label: 'Bitcoin Historical Price (USD)',
      data: [],
      borderColor: '#007bff',
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

// Fetch Historical Price Data
async function fetchHistoricalData(days) {
  try {
    const response = await fetch(`https://api.coingecko.com/api/v3/coins/bitcoin/market_chart?vs_currency=usd&days=${days}`);
    if (!response.ok) throw new Error('Failed to fetch historical data');
    const data = await response.json();

    const labels = data.prices.map(price => new Date(price[0]).toLocaleDateString());
    const dataPoints = data.prices.map(price => price[1]);

    historicalPriceChart.data.labels = labels;
    historicalPriceChart.data.datasets[0].data = dataPoints;
    historicalPriceChart.update();
  } catch (error) {
    console.error('Error fetching historical data:', error);
  }
}

// Fetch Fun Fact
async function fetchFunFact() {
  try {
    const response = await fetch('https://api.coingecko.com/api/v3/coins/bitcoin');
    if (!response.ok) throw new Error('Failed to fetch fun fact');
    const data = await response.json();
    const funFact = data.description.en.split('. ')[0]; // Get the first sentence of the description

    const funFactElement = document.getElementById('funFact');
    if (funFactElement) funFactElement.textContent = funFact;
  } catch (error) {
    console.error('Error fetching fun fact:', error);
    const funFactElement = document.getElementById('funFact');
    if (funFactElement) funFactElement.textContent = 'Failed to load fun fact';
  }
}

// Event Listeners
document.getElementById('priceForm').addEventListener('submit', function (e) {
  e.preventDefault();
  const highPriceInput = parseFloat(document.getElementById('highPrice').value);
  const lowPriceInput = parseFloat(document.getElementById('lowPrice').value);

  // Validate inputs
  if (isNaN(highPriceInput) || isNaN(lowPriceInput)) {
    alert('Please enter valid numbers for high and low prices.');
    return;
  }

  highPrice = highPriceInput;
  lowPrice = lowPriceInput;

  localStorage.setItem('highPrice', highPrice);
  localStorage.setItem('lowPrice', lowPrice);
  updateThresholdDisplay();
});

document.getElementById('loadHistoricalData').addEventListener('click', function () {
  const timeRange = document.getElementById('timeRange').value;
  fetchHistoricalData(timeRange);
});

document.getElementById('predictForm').addEventListener('submit', function (e) {
  e.preventDefault();
  const prediction = document.querySelector('input[name="prediction"]:checked').value; // Get selected radio button value
  predictionStartPrice = parseFloat(document.getElementById('currentPrice').textContent.replace('$', '')); // Record the starting price

  // Disable the form while waiting
  document.getElementById('predictForm').querySelector('button').disabled = true;

  // Wait for 1 minute, then check the result
  setTimeout(async () => {
    try {
      const response = await fetch('https://api.coindesk.com/v1/bpi/currentprice/BTC.json');
      if (!response.ok) throw new Error('Failed to fetch Bitcoin price');
      const data = await response.json();
      const newPrice = data.bpi.USD.rate_float;

      // Determine if the price went up or down
      const actualMovement = newPrice > predictionStartPrice ? 'up' : 'down';

      // Compare prediction with actual movement
      let resultMessage = '';
      if (prediction === actualMovement) {
        resultMessage = 'You win! The price moved ' + actualMovement + '.';
      } else {
        resultMessage = 'You lose. The price moved ' + actualMovement + '.';
      }

      document.getElementById('predictionResult').textContent = resultMessage;
    } catch (error) {
      console.error('Error fetching updated Bitcoin price:', error);
      document.getElementById('predictionResult').textContent = 'Failed to check prediction.';
    } finally {
      // Re-enable the form
      document.getElementById('predictForm').querySelector('button').disabled = false;
    }
  }, 60000); // Wait 1 minute before checking the price
});

// Initialize on page load
window.onload = function () {
  updateThresholdDisplay();
  fetchBitcoinPrice();
  setInterval(fetchBitcoinPrice, 60000); // Fetch price every 60 seconds
  fetchFunFact(); // Fetch fun fact on load
};