// Global variables
let highPrice = parseFloat(localStorage.getItem('highPrice')) || null;
let lowPrice = parseFloat(localStorage.getItem('lowPrice')) || null;
let dailyHigh = null;
let dailyLow = null;
let previousPrice = null; // Track previous price for percentage change
let predictionStartPrice = null; // Track the price when the prediction starts

// Initialize Chart.js for real-time Bitcoin price trend
document.addEventListener('DOMContentLoaded', () => {
  // Bitcoin Chart
  const btcCtx = document.getElementById('priceChart');
  if (btcCtx) {
    const btcChart = new Chart(btcCtx.getContext('2d'), {
      type: 'line',
      data: { labels: [], datasets: [{ label: 'Bitcoin Price (USD)', data: [], borderColor: '#ff6f61', borderWidth: 2 }] },
      options: { responsive: true, scales: { x: { title: { display: true, text: 'Time' } }, y: { title: { display: true, text: 'Price (USD)' } } } }
    });
    setInterval(() => fetchCryptoPrice('bitcoin', 'currentPrice', btcChart), 60000);
    fetchCryptoPrice('bitcoin', 'currentPrice', btcChart);
  }

  // Dogecoin Chart
  const dogeCtx = document.getElementById('priceChart');
  if (dogeCtx) {
    const dogeChart = new Chart(dogeCtx.getContext('2d'), {
      type: 'line',
      data: { labels: [], datasets: [{ label: 'Dogecoin Price (USD)', data: [], borderColor: '#fcbf49', borderWidth: 2 }] },
      options: { responsive: true, scales: { x: { title: { display: true, text: 'Time' } }, y: { title: { display: true, text: 'Price (USD)' } } } }
    });
    setInterval(() => fetchCryptoPrice('dogecoin', 'currentPrice', dogeChart), 60000);
    fetchCryptoPrice('dogecoin', 'currentPrice', dogeChart);
  }
});

// Function to toggle between light and dark modes
function toggleMode() {
  const body = document.body;
  const modeIcon = document.getElementById('modeIcon');
  body.classList.toggle('dark-mode');
  body.classList.toggle('light-mode');

  if (body.classList.contains('dark-mode')) {
    modeIcon.className = 'bi bi-sun';
  } else {
    modeIcon.className = 'bi bi-moon';
  }
}

// Add event listener to the toggle button
document.getElementById('toggleMode').addEventListener('click', toggleMode);

// Set initial mode based on user preference or default to light mode
document.addEventListener('DOMContentLoaded', () => {
  const prefersDarkScheme = window.matchMedia('(prefers-color-scheme: dark)').matches;
  if (prefersDarkScheme) {
    document.body.classList.add('dark-mode');
    document.getElementById('modeIcon').className = 'bi bi-sun';
  } else {
    document.body.classList.add('light-mode');
  }
});

// Update threshold display
function updateThresholdDisplay() {
  document.getElementById('currentHigh').textContent = highPrice ? `$${highPrice.toFixed(2)}` : 'Not set';
  document.getElementById('currentLow').textContent = lowPrice ? `$${lowPrice.toFixed(2)}` : 'Not set';
}

// Fetch Bitcoin price and update the chart
async function fetchCryptoPrice(cryptoId, priceElementId, chart) {
  try {
    const response = await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${cryptoId}&vs_currencies=usd`);
    if (!response.ok) throw new Error(`Failed to fetch ${cryptoId} price`);
    const data = await response.json();
    const currentPrice = data[cryptoId].usd;

    // Update Price on the Page
    document.getElementById(priceElementId).textContent = `$${currentPrice.toFixed(4)}`;

    // Update Chart
    const timestamp = new Date().toLocaleTimeString();
    chart.data.labels.push(timestamp);
    chart.data.datasets[0].data.push(currentPrice);

    if (chart.data.labels.length > 10) {
      chart.data.labels.shift();
      chart.data.datasets[0].data.shift();
    }
    
    chart.update();
  } catch (error) {
    console.error(`Error fetching ${cryptoId} price:`, error);
    document.getElementById(priceElementId).textContent = 'Failed to load price';
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