// =========================================================================
// 1. KHỞI TẠO ĐỐI TƯỢNG VÀ THIẾT LẬP WIDGET ĐIỀU KHIỂN GIAO DIỆN
// =========================================================================

// --- Widget Quạt Thông Gió ---
const fanIcon = document.getElementById("fanIcon");
const fanStatus = document.getElementById("fanStatus");
let isFanOn = false;

fanIcon.addEventListener("click", () => {
  isFanOn = !isFanOn;
  if (isFanOn) {
    fanIcon.classList.add("active");
    fanStatus.textContent = "ON";
    if (actionFanOn) eraWidget.triggerAction(actionFanOn.action, null);
  } else {
    fanIcon.classList.remove("active");
    fanStatus.textContent = "OFF";
    if (actionFanOff) eraWidget.triggerAction(actionFanOff.action, null);
  }
});

// --- Widget Máy Bơm Nước Slider ---
const pumpSlider = document.getElementById("pumpSlider");
const pumpValue = document.getElementById("pumpValue");
const sliderFill = document.querySelector(".slider-fill");

pumpSlider.addEventListener("input", function () {
  const val = parseInt(this.value);
  if (val === 1) {
    sliderFill.style.width = "100%";
    pumpValue.textContent = "BẬT";
    if (actionPumpOn) eraWidget.triggerAction(actionPumpOn.action, null);
  } else {
    sliderFill.style.width = "0%";
    pumpValue.textContent = "TẮT";
    if (actionPumpOff) eraWidget.triggerAction(actionPumpOff.action, null);
  }
});

// --- Widget Chế Độ Hệ Thống Slider ---
const modeSlider = document.getElementById("modeSlider");
const modeStatus = document.getElementById("modeStatus");
const sliderFillMode = document.querySelector(".slider-fill-livingRoom");

modeSlider.addEventListener("input", function () {
  const val = parseInt(this.value);
  if (val === 1) {
    sliderFillMode.style.width = "100%";
    modeStatus.textContent = "TỰ ĐỘNG";
    if (actionAutoOn) eraWidget.triggerAction(actionAutoOn.action, null);
  } else {
    sliderFillMode.style.width = "0%";
    modeStatus.textContent = "BẰNG TAY";
    if (actionAutoOff) eraWidget.triggerAction(actionAutoOff.action, null);
  }
});

// --- Widget Đèn Giả Lập NeoPixel Ring (MỚI THÊM) ---
const ledIcon = document.getElementById("ledIcon");
const ledStatus = document.getElementById("ledStatus");
let isLedOn = false;

ledIcon.addEventListener("click", () => {
  isLedOn = !isLedOn;
  if (isLedOn) {
    ledIcon.classList.add("active");
    ledStatus.textContent = "ON";
    if (actionLedOn) eraWidget.triggerAction(actionLedOn.action, null);
  } else {
    ledIcon.classList.remove("active");
    ledStatus.textContent = "OFF";
    if (actionLedOff) eraWidget.triggerAction(actionLedOff.action, null);
  }
});

// =========================================================================
// 2. KHỞI TẠO VÀ XỬ LÝ ĐỒ THỊ THỜI GIAN THỰC (REALTIME CHART)
// =========================================================================
let myChart;
let chartData = [];
const maxDataPoints = 20;
let allChartData = [];
let currentTimeRange = 0; 

function initChart() {
  const ctx = document.getElementById("dataChart").getContext("2d");
  myChart = new Chart(ctx, {
    type: "line",
    data: {
      labels: [],
      datasets: [
        {
          label: "Độ ẩm (%)",
          data: [],
          borderColor: "#FF5500",
          backgroundColor: "rgba(255,85,0,0.1)",
          tension: 0.4,
          borderWidth: 2,
          spanGaps: true,
        },
        {
          label: "Nhiệt độ (°C)",
          data: [],
          borderColor: "#2196F3",
          backgroundColor: "rgba(33,150,243,0.1)",
          tension: 0.4,
          borderWidth: 2,
          spanGaps: true,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { labels: { color: "#fff", font: { size: 12 } } },
      },
      scales: {
        x: { grid: { color: "rgba(255,255,255,0.1)" }, ticks: { color: "#fff", size: 10 } },
        y: { grid: { color: "rgba(255,255,255,0.1)" }, ticks: { color: "#fff", font: { size: 11 } } },
      },
    },
  });
}

function updateChart(humidVal, tempVal) {
  const now = new Date();
  const timestamp = now.getTime();
  const timeLabel = `${now.getHours().toString().padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}:${now.getSeconds().toString().padStart(2, "0")}`;

  const newData = {
    time: timeLabel,
    humidifier: typeof humidVal === "number" ? humidVal : NaN,
    temp: typeof tempVal === "number" ? tempVal : NaN,
    timestamp: timestamp,
  };

  chartData.push(newData);
  allChartData.push(newData);

  if (chartData.length > maxDataPoints) {
    chartData.shift();
  }

  myChart.data.labels = chartData.map((item) => item.time);
  myChart.data.datasets[0].data = chartData.map((item) => item.humidifier);
  myChart.data.datasets[1].data = chartData.map((item) => item.temp);
  myChart.update();
}

function updateTempGauge(newVal) {
  const gauge = document.getElementById("gaugeTemp");
  if (gauge) {
    gauge.style.setProperty("--value", newVal);
    document.getElementById("valTemp").textContent = newVal + "°C";
  }
}

function updateHumidGauge(newVal) {
  const gauge = document.getElementById("gaugeHumid");
  if (gauge) {
    gauge.style.setProperty("--value", newVal);
    document.getElementById("valHumid").textContent = newVal + "%";
  }
}

document.querySelectorAll(".time-range").forEach((button) => {
  button.addEventListener("click", function () {
    document.querySelectorAll(".time-range").forEach((btn) => btn.classList.remove("active"));
    this.classList.add("active");

    const minutes = parseInt(this.dataset.minutes);
    currentTimeRange = minutes;
    if (minutes !== 0) {
      showStatsModal(minutes);
    }
  });
});

function showStatsModal(minutes) {
  const modal = document.getElementById("statsModal");
  const cutoffTime = new Date(Date.now() - minutes * 60 * 1000);
  const filteredData = allChartData.filter((item) => new Date(item.timestamp) >= cutoffTime);

  const tableBody = document.getElementById("statsTableBody");
  tableBody.innerHTML = filteredData
    .map((item) => `<tr><td>${item.time}</td><td>${item.humidifier}</td><td>${item.temp}</td></tr>`)
    .join("");

  modal.style.display = "block";
  document.querySelector(".close").onclick = () => (modal.style.display = "none");
}

document.addEventListener("DOMContentLoaded", () => {
  initChart();
});

// =========================================================================
// 3. KẾT NỐI VÀ ĐỒNG BỘ DỮ LIỆU QUA DỊCH VỤ E-RA PLATFORM
// =========================================================================
const eraWidget = new EraWidget();
let configTemp = null, configHumi = null, configLux = null, configSoil = null, configWater = null; 
let actionFanOn = null, actionFanOff = null;
let actionPumpOn = null, actionPumpOff = null;
let actionAutoOn = null, actionAutoOff = null;
let actionLedOn = null, actionLedOff = null; // Khai báo thêm cặp Action điều khiển LED

eraWidget.init({
  onConfiguration: (configuration) => {
    // --- Các chân cấu hình cảm biến (Giữ nguyên thứ tự cũ) ---
    configTemp = configuration.realtime_configs[0]; 
    configHumi = configuration.realtime_configs[1]; 
    configLux  = configuration.realtime_configs[2]; 
    configSoil = configuration.realtime_configs[3]; 
    configWater = configuration.realtime_configs[4]; 

    // --- Các cặp Action điều khiển thiết bị đầu ra ---
    actionFanOn   = configuration.actions[0];
    actionFanOff  = configuration.actions[1];
    actionPumpOn  = configuration.actions[2];
    actionPumpOff = configuration.actions[3];
    actionAutoOn  = configuration.actions[4];
    actionAutoOff = configuration.actions[5];
    
    // Gán hành động Bật/Tắt Đèn NeoPixel tương ứng với vị trí thứ 7 và thứ 8 trên Era
    actionLedOn   = configuration.actions[6];
    actionLedOff  = configuration.actions[7];
  },
  onValues: (values) => {
    let currentTempRaw = NaN;
    let currentHumRaw = NaN;

    if (configTemp && values[configTemp.id]) {
      currentTempRaw = values[configTemp.id].value;
      const roundedTemp = Number(currentTempRaw).toFixed(1);
      updateTempGauge(roundedTemp);
    }

    if (configHumi && values[configHumi.id]) {
      currentHumRaw = values[configHumi.id].value;
      const roundedHum = Number(currentHumRaw).toFixed(1);
      updateHumidGauge(roundedHum);
    }

    if (configLux && values[configLux.id]) {
      const luxValue = Number(values[configLux.id].value).toFixed(1);
      const valLuxElement = document.getElementById("valLux");
      if (valLuxElement) valLuxElement.textContent = luxValue + " lx";
    }

    if (configSoil && values[configSoil.id]) {
      const soilValue = Number(values[configSoil.id].value).toFixed(1);
      const valSoilElement = document.getElementById("valSoil");
      if (valSoilElement) valSoilElement.textContent = soilValue + " %";
    }

    if (configWater && values[configWater.id]) {
      const waterValue = Number(values[configWater.id].value).toFixed(1);
      const waterLevelDisplay = document.getElementById("waterLevelDisplay");
      if (waterLevelDisplay) {
        waterLevelDisplay.innerHTML = `<i class="fas fa-water"></i> Mực nước: ${waterValue} %`;
      }
    }

    if (!isNaN(currentTempRaw) || !isNaN(currentHumRaw)) {
      updateChart(Number(currentHumRaw), Number(currentTempRaw));
    }
  },
});

// =========================================================================
// 4. TÍNH NĂNG TOÀN MÀN HÌNH (FULLSCREEN FEATURE)
// =========================================================================
const fullscreenButton = document.createElement("button");
fullscreenButton.innerHTML = '<i class="fas fa-expand"></i>';
fullscreenButton.className = "fullscreen-button";
document.body.appendChild(fullscreenButton);

let isFullscreen = false;
function toggleFullscreen() {
  if (!isFullscreen) {
    if (document.documentElement.requestFullscreen) document.documentElement.requestFullscreen();
    fullscreenButton.innerHTML = '<i class="fas fa-compress"></i>';
  } else {
    if (document.exitFullscreen) document.exitFullscreen();
    fullscreenButton.innerHTML = '<i class="fas fa-expand"></i>';
  }
  isFullscreen = !isFullscreen;
}
fullscreenButton.addEventListener("click", toggleFullscreen);
