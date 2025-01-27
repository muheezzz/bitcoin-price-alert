document.getElementById('priceForm').addEventListener('submit', function (e) {
  e.preventDefault();
  const highPrice = parseFloat(document.getElementById('highPrice').value);
  const lowPrice = parseFloat(document.getElementById('lowPrice').value);

  if (isNaN(highPrice) || isNaN(lowPrice)) {
    alert('Please enter valid numbers for the price thresholds.');
    return;
  }

  // Fetch Bitcoin price every 10 seconds
  setInterval(() => checkBitcoinPrice(highPrice, lowPrice), 10000);
});

document.getElementById('refreshButton').addEventListener('click', function () {
  fetchBitcoinPrice();
});

// Load daily high and low from localStorage (if they exist)
let dailyHigh = parseFloat(localStorage.getItem('dailyHigh')) || null;
let dailyLow = parseFloat(localStorage.getItem('dailyLow')) || null;

// Display saved values on page load
document.getElementById('dailyHigh').textContent = dailyHigh ? `$${dailyHigh}` : 'Loading...';
document.getElementById('dailyLow').textContent = dailyLow ? `$${dailyLow}` : 'Loading...';

async function fetchBitcoinPrice() {
  try {
    const response = await fetch('https://api.coindesk.com/v1/bpi/currentprice/BTC.json');
    const data = await response.json();
    const currentPrice = data.bpi.USD.rate_float;

    // Update daily high and low
    if (dailyHigh === null || currentPrice > dailyHigh) {
      dailyHigh = currentPrice;
      localStorage.setItem('dailyHigh', dailyHigh); // Save to localStorage
    }
    if (dailyLow === null || currentPrice < dailyLow) {
      dailyLow = currentPrice;
      localStorage.setItem('dailyLow', dailyLow); // Save to localStorage
    }

    // Update the UI
    document.getElementById('currentPrice').textContent = `$${currentPrice}`;
    document.getElementById('dailyHigh').textContent = `$${dailyHigh}`;
    document.getElementById('dailyLow').textContent = `$${dailyLow}`;

    return currentPrice;
  } catch (error) {
    console.error('Error fetching Bitcoin price:', error);
  }
}

async function checkBitcoinPrice(highPrice, lowPrice) {
  const currentPrice = await fetchBitcoinPrice();

  const alertDiv = document.getElementById('alert');
  if (currentPrice > highPrice) {
    alertDiv.textContent = `Alert: Bitcoin is above $${highPrice}! Current price: $${currentPrice}`;
  } else if (currentPrice < lowPrice) {
    alertDiv.textContent = `Alert: Bitcoin is below $${lowPrice}! Current price: $${currentPrice}`;
  } else {
    alertDiv.textContent = '';
  }
}

// Initial fetch
fetchBitcoinPrice();