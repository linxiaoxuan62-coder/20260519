let capture;

function setup() {
  // 產生一個全螢幕的畫布
  createCanvas(windowWidth, windowHeight);
  // 擷取攝影機影像內容
  capture = createCapture(VIDEO);
  // 隱藏預設產生的 HTML5 video 元件，只在畫布上顯示
  capture.hide();
}

function draw() {
  // 畫布的背景顏色為 bde0fe
  background('#ffe5ec');

  // 計算影像顯示的寬高（畫布寬高的 50%）
  let displayW = width * 0.5;
  let displayH = height * 0.5;

  push();
  // 將原點移動到畫布中心
  translate(width / 2, height / 2);
  // 左右顛倒處理：在 X 軸套用 -1 的縮放
  scale(-1, 1);
  // 設定影像繪製模式為中心
  imageMode(CENTER);
  // 顯示影像
  image(capture, 0, 0, displayW, displayH);
  pop();
}

function windowResized() {
  // 當視窗大小改變時，同步調整畫布大小
  resizeCanvas(windowWidth, windowHeight);
}