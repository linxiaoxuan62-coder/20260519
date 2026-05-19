// Hand Pose Detection with ml5.js
// https://thecodingtrain.com/tracks/ml5js-beginners-guide/ml5/hand-pose

let video;
let handPose;
let hands = [];

function preload() {
  // 初始化 HandPose 模型
  handPose = ml5.handPose();
}

function mousePressed() {
  console.log(hands);
}

function gotHands(results) {
  hands = results;
}

function setup() {
  // 第一步驟：產生一個全螢幕的畫布
  createCanvas(windowWidth, windowHeight);
  // 擷取攝影機影像內容
  video = createCapture(VIDEO);
  video.hide();

  // Start detecting hands
  handPose.detectStart(video, gotHands);
}

function draw() {
  // 畫布的背景顏色為 ffe5ec
  background('#ffe5ec');

  // 計算顯示影像的寬高 (整個畫布寬高的 50%)
  let displayW = width * 0.5;
  let displayH = height * 0.5;

  push();
  // 將繪圖原點移至畫布中心
  translate(width / 2, height / 2);
  // 左右顛倒處理 (達成鏡像效果)
  scale(-1, 1);

  // 顯示影像，置中對齊並縮放
  imageMode(CENTER);
  image(video, 0, 0, displayW, displayH);

  // Ensure at least one hand is detected
  if (hands.length > 0) {
    for (let hand of hands) {
      if (hand.confidence > 0.1) {
        // Loop through keypoints and draw circles
        for (let i = 0; i < hand.keypoints.length; i++) {
          let keypoint = hand.keypoints[i];

          // Color-code based on left or right hand
          if (hand.handedness == "Left") {
            fill(255, 0, 255);
          } else {
            fill(255, 255, 0);
          }

          noStroke();
          // 將特徵點座標從影片原始尺寸映射到畫布上的顯示尺寸
          // 因為原點已在中心，映射範圍需對應至 [-displayW/2, displayW/2]
          let x = map(keypoint.x, 0, video.width, -displayW / 2, displayW / 2);
          let y = map(keypoint.y, 0, video.height, -displayH / 2, displayH / 2);
          
          circle(x, y, 12);
        }
      }
    }
  }
  pop();
}

function windowResized() {
  // 當視窗大小改變時，自動調整畫布大小
  resizeCanvas(windowWidth, windowHeight);
}
