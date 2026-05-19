// Hand Pose Detection with ml5.js
// https://thecodingtrain.com/tracks/ml5js-beginners-guide/ml5/hand-pose

let video;
let handPose;
let hands = [];
let currentGesture = "等待手勢...";
let lastDetected = "";
let gestureTimer = 0;
const STABLE_FRAMES = 10; // 手勢需持續 10 幀才確認
let modelLoaded = false; // 用於判斷 AI 是否載入完成
let bgPatterns = []; // 存儲背景裝飾圖案

let playerScore = 0;
let aiScore = 0;
let drawCount = 0; // 新增平手計數
let aiChoice = "";
let resultMessage = "準備好了嗎？";
let lastHandledGesture = ""; // 避免同一手勢重複得分
let isCountingDown = false;
let countdownCounter = 0;
let gameState = "playing"; // 預設為遊戲進行中

function preload() {
  // 初始化 HandPose 模型
  handPose = ml5.handPose(() => {
    modelLoaded = true;
    console.log("AI 模型載入完成！");
  });
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

  // 初始化背景圖案 (固定 5 個)
  for (let i = 0; i < 5; i++) {
    bgPatterns.push({
      x: random(width),
      y: random(height),
      size: random(20, 50),
      symbol: random(['✨', '💖', '☁️', '🌸', '🍬']),
      angle: random(TWO_PI)
    });
  }

  // Start detecting hands
  handPose.detectStart(video, gotHands);
}

function draw() {
  // 背景與可愛裝飾
  background('#ffe5ec');
  drawCuteBackground(); 
  
  if (!modelLoaded) {
    drawLoadingAnimation();
    return;
  }

  // 計算顯示影像的寬高 (整個畫布寬高的 50%)
  let displayW = width * 0.5;
  let displayH = height * 0.5;

  // 繪製中間可愛卡片 (Glassmorphism 風格)
  rectMode(CENTER);
  push();
  fill(255, 255, 255, 140);
  drawingContext.shadowBlur = 40;
  drawingContext.shadowColor = 'rgba(255, 133, 161, 0.5)';
  rect(width / 2, height / 2, displayW + 60, displayH + 220, 40);
  pop();

  // 繪製擷取的影像內容
  push();
  translate(width / 2, height / 2);
  scale(-1, -1);
  imageMode(CENTER);
  // 影像外框發光
  drawingContext.shadowBlur = 15;
  drawingContext.shadowColor = 'white';
  image(video, 0, 0, displayW, displayH);
  stroke(255);
  strokeWeight(4);
  noFill();
  rect(0, 0, displayW, displayH, 15);
  pop();

  // 根據遊戲狀態繪製 UI
  if (gameState === "gameOver") {
    drawGameOverUI(displayW, displayH);
  } else if (gameState === "playing") {
    drawGamePlayingUI(displayW, displayH);
  }

  if (hands.length > 0) {
    let result = classifyGesture(hands[0]);
    
    // 1. 處理 VR 按鈕互動 (僅在遊戲結束畫面)
    if (gameState === "gameOver") {
      checkVRButtons(hands[0], result);
    }

    // 2. 處理遊戲對決邏輯 (僅在遊戲中)
    if (gameState === "playing") {
      if (result === lastDetected && result !== "---") {
        gestureTimer++;
        if (gestureTimer >= STABLE_FRAMES) {
          if (currentGesture !== result) {
            currentGesture = result;
            if (["石頭 (Rock)", "布 (Paper)", "剪刀 (Scissors)"].includes(result) && !isCountingDown) {
              if (result !== lastHandledGesture) {
                isCountingDown = true;
                countdownCounter = 0;
                lastHandledGesture = result;
                aiChoice = ""; // 開始倒數時清除上局 AI 出拳
                resultMessage = "對決倒數中...";
              }
            }
          }
        }
      } else {
        gestureTimer = 0;
        lastDetected = result;
        if (result === "---") lastHandledGesture = "";
      }
    }

    // 繪製手部特徵點
    drawHandPoints(displayW, displayH);
  }

  if (isCountingDown) {
    drawCountdown();
  }
}

/**
 * 繪製 VR 遊戲結束畫面 UI
 */
function drawGameOverUI(displayW, displayH) {
  let cardW = 600;
  let cardH = 400;
  
  rectMode(CENTER);
  textAlign(CENTER, CENTER);

  // 標題
  fill('#ff4d6d');
  textSize(48);
  textStyle(BOLD);
  drawingContext.shadowBlur = 10;
  drawingContext.shadowColor = 'white';
  text(playerScore >= 3 ? "🏆 你贏了！" : "🤖 AI 獲勝！", width / 2, height / 2 - 130);
  
  textSize(32);
  fill('#ff758c');
  text("再玩一局？", width / 2, height / 2 - 80);

  // 戰績統計
  textSize(24);
  fill('#757bc8');
  text(`${playerScore} 勝、${aiScore} 敗、${drawCount} 平`, width / 2, height / 2 - 30);

  // 左側按鈕：結束 (紅色發光)
  drawVRButton(width / 2 - 140, height / 2 + 80, 220, 80, "🏠 結束", '#ff4d6d', true);
  
  // 右側按鈕：繼續 (白色帶綠光)
  drawVRButton(width / 2 + 140, height / 2 + 80, 220, 80, "🎮 繼續", '#ffffff', false, '#00ff88');

  // 下方操作提示
  fill(255, 255, 255, 150);
  textSize(18);
  text("右手比 👍 繼續，左手比 👍 結束", width / 2, height / 2 + 170);
}

/**
 * 繪製遊戲進行中的 UI
 */
function drawGamePlayingUI(displayW, displayH) {
  textAlign(CENTER, CENTER);
  // 顯示上方標題
  fill('#ff4d6d');
  textSize(32);
  textStyle(BOLD);
  text(resultMessage, width / 2, 80);
  
  // 顯示分數
  textSize(24);
  fill('#757bc8');
  text(`玩家: ${playerScore}  🆚  AI: ${aiScore}  (平手: ${drawCount})`, width / 2, 140);

  // 影像視窗正下方的文字提示
  textSize(28);
  fill('#ff758c');
  text("✊ 石頭  ✋ 布  ✌️ 剪刀", width / 2, height / 2 + displayH / 2 + 45);

  // 目前辨識結果
  textSize(22);
  fill('#ff4d6d');
  text("目前辨識：" + getFormattedGestureDisplay(currentGesture), width / 2, height - 130);
  textStyle(NORMAL);
}

/**
 * 繪製 VR 專用按鈕
 */
function drawVRButton(x, y, w, h, txt, col, isRed, glowCol) {
  push();
  drawingContext.shadowBlur = 20;
  drawingContext.shadowColor = isRed ? 'rgba(255, 77, 109, 0.6)' : (glowCol || 'rgba(255,255,255,0.4)');
  
  fill(isRed ? color(255, 77, 109, 180) : color(255, 255, 255, 200));
  noStroke();
  rect(x, y, w, h, 15);
  
  fill(isRed ? 255 : 0);
  textSize(28);
  text(txt, x, y);
  pop();
}

/**
 * 檢查手勢與 VR 按鈕的交互
 */
function checkVRButtons(hand, gesture) {
  if (gesture === "開始 (Start 👍)") {
    if (hand.handedness === "Right") {
      // 右手 👍 -> 繼續遊戲
      resetGame();
    } else if (hand.handedness === "Left") {
      // 左手 👍 -> 結束（此處可導向首頁或關閉視窗）
      window.location.reload(); 
    }
  }
}

/**
 * 重置遊戲邏輯
 */
function resetGame() {
  gameState = "playing";
  playerScore = 0;
  aiScore = 0;
  drawCount = 0;
  resultMessage = "準備出拳！";
  isCountingDown = false;
}

/**
 * 繪製 HUD 裝飾線條
 */
function drawHUDDecor() {
  stroke(0, 242, 255, 100);
  strokeWeight(1);
  noFill();
  // 四角裝飾
  let offset = 40;
  line(offset, offset, offset + 100, offset);
  line(offset, offset, offset, offset + 100);
  line(width - offset, height - offset, width - offset - 100, height - offset);
  line(width - offset, height - offset, width - offset, height - offset - 100);
}

/**
 * 繪製霓虹手部點位
 */
function drawHandPoints(displayW, displayH) {
  push();
  translate(width / 2, height / 2);
  scale(-1, -1); // 需與影像鏡像同步

  for (let hand of hands) {
    for (let kp of hand.keypoints) {
      // 修正座標映射，確保點位落在 50% 縮放的影像上
      let x = map(kp.x, 0, video.width, -displayW / 2, displayW / 2);
      let y = map(kp.y, 0, video.height, -displayH / 2, displayH / 2);
      
      // 恢復可愛黃色圓點
      drawingContext.shadowBlur = 10;
      drawingContext.shadowColor = 'white';
      fill(255, 255, 0);
      noStroke();
      circle(x, y, 10);
    }
  }
  pop();
}

/**
 * 繪製背景的可愛裝飾圖案 (固定 5 個)
 */
function drawCuteBackground() {
  push();
  textAlign(CENTER, CENTER);
  for (let p of bgPatterns) {
    push();
    translate(p.x, p.y);
    rotate(p.angle);
    textSize(p.size);
    text(p.symbol, 0, 0);
    pop();
  }
  pop();
}

/**
 * 處理並繪製倒數動畫
 */
function drawCountdown() {
  countdownCounter++;
  let val = "";
  let col = color('#ff4d6d'); // 預設粉紅色

  if (countdownCounter < 30) {
    val = "3";
  } else if (countdownCounter < 60) {
    val = "2";
  } else if (countdownCounter < 90) {
    val = "1";
  } else if (countdownCounter < 120) {
    val = "開始！";
    col = color('#ff758c'); // 「開始」變換色調
    if (countdownCounter === 91) {
      let finalMove = (hands.length > 0) ? classifyGesture(hands[0]) : "---";
      playRound(finalMove);
    }
  } else {
    isCountingDown = false;
    countdownCounter = 0;
    return;
  }

  push();
  translate(width / 2, height / 2);
  
  // 動畫效果：縮放從大變小，產生「跳出來」的視覺律動感
  let progress = (countdownCounter % 30) / 30;
  let s = lerp(2.5, 1.0, progress); 
  
  scale(s);
  textAlign(CENTER, CENTER);
  textSize(160);
  
  // 文字發光效果
  drawingContext.shadowBlur = 30;
  drawingContext.shadowColor = 'white';
  
  fill(col);
  stroke(255);
  strokeWeight(12);
  text(val, 0, 0);
  pop();
}

/**
 * 勝負判定邏輯
 */
function playRound(playerMove) {
  const options = ["石頭 (Rock)", "布 (Paper)", "剪刀 (Scissors)"];
  aiChoice = random(options);
  
  if (playerMove === aiChoice) {
    resultMessage = "平手！再試一次 😮";
    drawCount++;
  } else if (
    (playerMove === "石頭 (Rock)" && aiChoice === "剪刀 (Scissors)") ||
    (playerMove === "布 (Paper)" && aiChoice === "石頭 (Rock)") ||
    (playerMove === "剪刀 (Scissors)" && aiChoice === "布 (Paper)")
  ) {
    resultMessage = "你贏了！太棒了 ✨";
    playerScore++;
  } else {
    resultMessage = "AI 贏了！加油 🤖";
    aiScore++;
  }

  // 勝負判定：當其中一方先達到 3 分時，判定最終勝負並結束遊戲切換至結算畫面
  if (playerScore >= 3 || aiScore >= 3) {
    gameState = "gameOver";
  }
}

/**
 * AI 載入動畫
 */
function drawLoadingAnimation() {
  push();
  translate(width / 2, height / 2);
  noFill();
  stroke('#ff758c');
  strokeWeight(4);
  rotate(frameCount * 0.1);
  arc(0, 0, 50, 50, 0, PI + QUARTER_PI);
  rotate(-frameCount * 0.1);
  noStroke();
  fill('#ff758c');
  textSize(18);
  textAlign(CENTER, CENTER);
  text("AI 正在預熱中...", 0, 80);
  pop();
}

/**
 * 1 & 2 & 5. 手勢辨識函式 (包含原本功能與新增 👍 👎)
 */
function classifyGesture(hand) {
  let kp = hand.keypoints;
  let wrist = kp[0];

  // 判斷手指是否伸直 (利用指尖到手腕距離 vs 關節到手腕距離)
  let isIndexOpen = dist(kp[8].x, kp[8].y, wrist.x, wrist.y) > dist(kp[6].x, kp[6].y, wrist.x, wrist.y);
  let isMiddleOpen = dist(kp[12].x, kp[12].y, wrist.x, wrist.y) > dist(kp[10].x, kp[10].y, wrist.x, wrist.y);
  let isRingOpen = dist(kp[16].x, kp[16].y, wrist.x, wrist.y) > dist(kp[14].x, kp[14].y, wrist.x, wrist.y);
  let isPinkyOpen = dist(kp[20].x, kp[20].y, wrist.x, wrist.y) > dist(kp[18].x, kp[18].y, wrist.x, wrist.y);

  // 針對 scale(-1, -1) 反轉環境判斷大拇指朝向
  // 在此設置下，實體世界朝上 = 原始影像座標 Y 較大
  let thumbIsUp = kp[4].y > kp[2].y + 20; 
  let thumbIsDown = kp[4].y < kp[2].y - 20;

  // 判斷手勢
  // 布: 四指皆開
  if (isIndexOpen && isMiddleOpen && isRingOpen && isPinkyOpen) return "布 (Paper)";
  
  // 剪刀: 食指中指開，其餘閉合
  if (isIndexOpen && isMiddleOpen && !isRingOpen && !isPinkyOpen) return "剪刀 (Scissors)";
  
  // 👍 大拇指朝上 = 開始 (排除其他手指以增加準確度)
  if (thumbIsUp && !isIndexOpen && !isMiddleOpen && !isRingOpen && !isPinkyOpen) return "開始 (Start 👍)";
  
  // 👎 大拇指朝下 = 結束
  if (thumbIsDown && !isIndexOpen && !isMiddleOpen && !isRingOpen && !isPinkyOpen) return "結束 (End 👎)";

  // 石頭: 四指閉合且拇指未朝上或朝下
  if (!isIndexOpen && !isMiddleOpen && !isRingOpen && !isPinkyOpen) return "石頭 (Rock)";

  return "---";
}

/**
 * 輔助函式：根據手勢名稱返回帶有表情符號的格式化字串
 */
function getFormattedGestureDisplay(gesture) {
  switch (gesture) {
    case "石頭 (Rock)":
      return "✊ 石頭";
    case "布 (Paper)":
      return "✋ 布";
    case "剪刀 (Scissors)":
      return "✌️ 剪刀";
    case "開始 (Start 👍)":
      return "👍 開始";
    case "結束 (End 👎)":
      return "👎 結束";
    default:
      return "--- 未辨識 ---";
  }
}

function windowResized() {
  // 當視窗大小改變時，自動調整畫布大小
  resizeCanvas(windowWidth, windowHeight);
}
