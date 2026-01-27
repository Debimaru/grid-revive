import { useState, useEffect } from 'react'
import './App.css'

// チュートリアルのパズルデータ
// 0:道, 1:壁, 2:スタート地点, 3:ゴール地点, 4:ノルマ(チェックポイント), 5以降:規制マス
const INITIAL_TUTORIAL_DATA = [
  [1, 1, 0, 1, 1, 1, 1, 1],
  [2, 1, 4, 1, 0, 1, 4, 4],
  [1, 1, 0, 1, 1, 1, 4, 1],
  [1, 1, 1, 1, 1, 1, 4, 1],
  [1, 1, 1, 1, 1, 1, 3, 1]
];

const ALL_STAGES_DATA = {
  tutorial: INITIAL_TUTORIAL_DATA,

  stage1: [
    [1, 1, 1, 1, 3],
    [4, 0, 0, 0, 4],
    [1, 1, 0, 1, 1],
    [0, 0, 4, 0, 4],
    [2, 1, 1, 1, 1]
  ],

  stage2: [
    [1, 1, 1, 1, 3],
    [4, 1, 1, 4, 1],
    [1, 0, 4, 0, 1],
    [1, 1, 4, 0, 1],
    [2, 1, 1, 1, 1]
  ],
  
  stage3: [
    [1, 1, 1, 2],
    [1, 1, 4, 1],
    [4, 1, 4, 4],
    [1, 4, 4, 1],
    [3, 1, 1, 1]
  ],
  
  stage4: [
    [5, 1, 1, 5, 4, 1],
    [1, 1, 1, 1, 4, 1],
    [1, 4, 4, 1, 4, 1],
    [2, 4, 4, 1, 4, 3]
  ],
  
  stage5: [
    [3, 4, 6, 1, 0, 0, 0],
    [1, 1, 0, 1, 0, 1, 1],
    [4, 0, 0, 4, 4, 0, 2],
    [6, 1, 0, 1, 5, 1, 4],
    [0, 1, 0, 1, 0, 1, 5]
  ],

  // AとBの位置を入れ替えました_2026/01/27
  
  stage6: [
    [7, 1, 6, 1, 1, 1, 1, 1, 1, 1, 1],
    [4, 1, 8, 4, 4, 8, 1, 11, 4, 12, 12],
    [1, 7, 4, 9, 1, 4, 9, 1, 4, 1, 4],
    [4, 4, 6, 4, 1, 1, 1, 1, 11, 1, 1],
    [1, 1, 1, 5, 1, 10, 4, 4, 1, 4, 1],
    [1, 4, 0, 1, 1, 4, 1, 10, 1, 13, 1],
    [2, 13, 5, 1, 1, 4, 1, 1, 1, 4, 4],
    [1, 4, 4, 4, 1, 1, 1, 1, 1, 1, 0],
    [1, 4, 1, 1, 1, 1, 1, 1, 1, 1, 3]
  ],
}

// 各ステージの操作回数（仮設定）
const STAGE_MOVES_LIMIT = { 
  tutorial: 99,
  stage1: 2,
  stage2: 2,
  stage3: 3,
  stage4: 3,
  stage5: 4,
  stage6: 13 };

function App() {
  // ------------------------------------------------------------
  // 状態管理（State）（JavaScriptで書く）
  // ------------------------------------------------------------

  // 表示中の画面の状態を管理する変数
  // 'title'（タイトル）, 'select'（ステージ選択）, 'game'（ゲーム中）のどれかが入る
  const [screen, setScreen] = useState('title');

  // プレイヤーが選んだステージIDを入れる変数
  const [currentStage, setCurrentStage] = useState(null);

  // クリア済みのステージIDをリストで保存する変数（初期値は空っぽの配列）
  const [clearedStages, setClearedStages] = useState([]);

  const [tutorialMessages, setTutorialMessages] = useState([]); // メッセージのリスト
  const [currentMessageIndex, setCurrentMessageIndex] = useState(0); // 今何番目を表示中か

  //チュートリアル初期データを書き換えられるようにしてる
  const [mazeData, setMazeData] = useState(INITIAL_TUTORIAL_DATA);

  // パズルフェーズの操作関係
  const [initialMazeData, setInitialMazeData] = useState(INITIAL_TUTORIAL_DATA); // リセット用
  const [cursorPos, setCursorPos] = useState({ x: 0, y: 0 }); // カーソル位置
  const [movesLeft, setMovesLeft] = useState(0); // 残り操作回数

  // 迷路フェーズの状態管理
  const [gamePhase, setGamePhase] = useState('puzzle'); // 'puzzle' か 'maze'
  const [playerPos, setPlayerPos] = useState({ x: -1, y: -1 }); // プレイヤー座標
  const [regulationState, setRegulationState] = useState(0); // 同じ規制マスを踏んだ回数(0, 1, 2)
  const [collectedCheckpoints, setCollectedCheckpoints] = useState(0); // 回収したチェックポイント数
  const [totalCheckpoints, setTotalCheckpoints] = useState(0); // そのステージのチェックポイント総数

  // ヒントの処理
  const [isHintOpen, setIsHintOpen] = useState(false); // ヒントボタンの処理. アップデートにより追加_2026/01/27

  // ------------------------------------------------------------
  // ロード処理（useEffect）（同じくJavaScript）
  // ------------------------------------------------------------

  // アプリ起動時に1回だけ実行される処理
  // ブラウザのLocal Storageからセーブデータを読み込む
  useEffect(() => {
    const savedData = localStorage.getItem("shiftLabyrinthSave");

    // データが残っていれば、それを読み込んで復元する
    if (savedData) {
      setClearedStages(JSON.parse(savedData));
    }
  }, []); // []がついているので最初の一回だけ実行


  //チュートリアルの時にメッセージを出す
  useEffect(() => {
    if (screen === 'game' && currentStage === 'tutorial') {
      // チュートリアルの場合のみメッセージをセット
      setTutorialMessages([
        // \nで改行だったが, 「`」にしたら普通の改行でも行けるようになったので消した 2026/01/06
        // 改行後になぞの空白が出ていたので「"」に戻した. 2026/01/06
        "パズルゲーム「エイリアンシフト」へようこそ！このゲームは、\n" +
        "宇宙人の間で流行っている高度なパズルゲームだよ！", 
        // なんか黄色くなってるけど, 動くので放置（多分\nの影響）（壊れたら対処）2026/01/06
        "ルールは簡単！マス目上の迷路に挑戦するんだけど、迷路は壊れていて\n" +
        "クリアできないんだ。限られた回数だけ、3x3の9マスを操作できるから、その能力で\n" +
        "クリア可能な迷路を復元するんだ！",

        "操作は常にキーボードの[W][A][S][D]のキーを使うよ！紫のカーソルに囲われた9マスに\n" +
        "操作ができるよ！できる操作は2種類で、[H][L]キーで回転！9つのマスが\n" +
        "90度回転するイメージだよ！[J][K]で反転！上下反転と左右反転だよ！",

        "さて、次はマスの説明だね！緑のマスがスタート地点、赤がゴールだよ！\n" +
        "灰色のマスは通れない壁で、白いマスが道だよ！一度通ると引き返せないよ！\n" +
        "スタートから始まってオレンジ色のマスをすべて通ってゴールにつくとクリアだよ！",

        // 文章の変更が行われた_2026/01/27
        "迷路の残りの操作回数がなくなるか、「challenge」っていうボタンをクリックすると\n" +
        "迷路に挑戦できるよ！そこでも同じく[W][A][S][D]で移動だよ。\n" +
        "まぁ、くわしいことはやってみればわかるよ！操作方法を忘れたら、\n" +
        "右上のボタンのクリックでいつでも確認できるからね。それじゃあ、いってらっしゃい！"
      ]);
      setCurrentMessageIndex(0); // 最初（0番目）から表示

    } else if (screen === 'game' && currentStage === 'stage4'){
      setTutorialMessages([
        "新しい要素が出てきたので説明します。\n" +
        "水色のマスは、同じ文字が書いてある水色のマスにのみ移動できます。"
      ])
      setCurrentMessageIndex(0);
    } else {
      // それ以外ならメッセージは空にする
      setTutorialMessages([]);
    }
  }, [screen, currentStage]); // 画面かステージが変わるたびにチェック


  // ------------------------------------------------------------
  // パズル操作用ロジック（3x3マスの操作）
  // ------------------------------------------------------------

  //簡単だと思ってたけど, マジ大変だった_2026/01/03

  /* 54 68 69 73 20 69 73 20
     54 61 6b 75 6d 69 20
     4b 6f 6a 69 6d 61 27 73 20
     70 72 6f 67 72 61 6d 2e */

  // 迷路フェーズを開始
  const startMazePhase = () => {
    let startX = 0; 
    let startY = 0;
    let cpCount = 0;

    // スタート地点(2)とチェックポイント(4)を数える
    for (let y = 0; y < mazeData.length; y++) {
      for (let x = 0; x < mazeData[0].length; x++) {
        if (mazeData[y][x] === 2) { startX = x; startY = y; }
        if (mazeData[y][x] === 4) { cpCount++; }
      }
    }

    setPlayerPos({ x: startX, y: startY });
    setTotalCheckpoints(cpCount);
    setCollectedCheckpoints(0);
    setRegulationState(0);
    setGamePhase('maze');
  };

  // 迷路モードの時のプレイヤーの移動処理！！！
  const handlePlayerMove = (dx, dy) => {
    const currentX = playerPos.x;
    const currentY = playerPos.y;
    const nextX = currentX + dx;
    const nextY = currentY + dy;

    // 範囲外かのチェック
    if (nextY < 0 || nextY >= mazeData.length || nextX < 0 || nextX >= mazeData[0].length) return;

    const currentVal = mazeData[currentY][currentX];
    const nextVal = mazeData[nextY][nextX];

    // 移動不可マス（壁:1, 通行済み:-1）
    if (nextVal === 1 || nextVal === -1) return;

    // 規制マスのルール判定
    // 状態1（ロック中）: 同じ数字の規制マスにしか行けない
    if (regulationState === 1 && currentVal >= 5) {
      if (nextVal !== currentVal) return;
    }
    
    // 状態の更新ロジック
    let nextRegState = 0;

    if (regulationState === 1) {
      // 状態1から移動できたなら、次は自由に移動できる状態2になる（これがないと規制マスに閉じ込められてしまう）
      nextRegState = 2;
    } else if (regulationState === 2) {
      // 状態2から移動したら、基本はリセット(0)。ただし移動先が規制マスなら新規ロック(1)
      if (nextVal >= 5) nextRegState = 1;
      else nextRegState = 0;
    } else {
      // 状態0から移動
      if (nextVal >= 5) nextRegState = 1; // 規制マスに入ったらロック開始
      else nextRegState = 0;
    }
    setRegulationState(nextRegState);

    // データ更新 （通った場所を-1にする）
    const newMaze = JSON.parse(JSON.stringify(mazeData));
    newMaze[currentY][currentX] = -1; // 足跡をつける
    setMazeData(newMaze);
    setPlayerPos({ x: nextX, y: nextY });

    // チェックポイント回収
    if (nextVal === 4) setCollectedCheckpoints(prev => prev + 1);

    // ゴール判定
    if (nextVal === 3) {
      if (collectedCheckpoints >= totalCheckpoints) {
        setTimeout(() => {
          handleStageClear(currentStage);

          if (currentStage === 'stage6') {
             alert("おめでとう。あなたの勝ちです。");
          } else {
             alert("ステージクリア！");
          }

          setScreen('select');
        }, 100);
      }
    }
  };


  // 迷路の一部（3x3）を操作する処理のステージ共通関数
  // 'rotate-right'(右回転), 'rotate-left'(左回転), 'flip-h'(左右反転), 'flip-v'(上下反転)
  // startX, startY: 3x3の左上の座標
  const operateMaze3x3 = (type, startX, startY) => {
    
    // 1. 現在の迷路データをコピーする
    const newMaze = JSON.parse(JSON.stringify(mazeData));

    // 2. 変更前の3x3エリアのデータを取り出しておく
    const original3x3 = [
      [0, 0, 0],
      [0, 0, 0],
      [0, 0, 0]
    ];

    for (let y = 0; y < 3; y++) {
      for (let x = 0; x < 3; x++) {
        original3x3[y][x] = newMaze[startY + y][startX + x];
      }
    }

    // 3. 操作の種類によって、新しい場所に値を書き込む
    for (let y = 0; y < 3; y++) {
      for (let x = 0; x < 3; x++) {
        let val = original3x3[y][x];

        if (type === 'rotate-right') {
          // 時計回り
          newMaze[startY + x][startX + (2 - y)] = val;
        } 
        else if (type === 'rotate-left') {
          // 反時計回り
          newMaze[startY + (2 - x)][startX + y] = val;
        } 
        else if (type === 'flip-h') {
          // 左右反転
          newMaze[startY + y][startX + (2 - x)] = val;
        } 
        else if (type === 'flip-v') {
          // 上下反転
          newMaze[startY + (2 - y)][startX + x] = val;
        }
      }
    }

    // 4. 画面更新
    setMazeData(newMaze);
    setMovesLeft(movesLeft - 1); // 制限の回数を減らす
  };

  // テスト用：ボタンを押したら中央(1,1)を右回転させてみる関数
  const testRotate = () => {
    operateMaze3x3('rotate-right', 1, 1);
  };


  // ------------------------------------------------------------
  // 関数定義（ロジック）（JavaScript）
  // ------------------------------------------------------------

  // 操作プログラム (WASD移動, LHJK変形)
  useEffect(() => {
    if (screen !== 'game') return;

    const handleKeyDown = (e) => {
      const key = e.key.toLowerCase();

      //パズルフェーズと全部込みのバージョン
      if (gamePhase === 'puzzle') {

        // 迷路のサイズを取得する
        const h = mazeData.length;
        const w = mazeData[0].length;

        // WASD: カーソル移動
        if (key === 'w') setCursorPos(p => ({ ...p, y: Math.max(0, p.y - 1) }));
        if (key === 's') setCursorPos(p => ({ ...p, y: Math.min(h - 3, p.y + 1) }));
        if (key === 'a') setCursorPos(p => ({ ...p, x: Math.max(0, p.x - 1) }));
        if (key === 'd') setCursorPos(p => ({ ...p, x: Math.min(w - 3, p.x + 1) }));

        // LHJK: 変形操作（残り回数がある時のみ実行可）
        if (movesLeft > 0) {
          if (['l','h','k','j'].includes(key)) {
             let type = '';
             if(key==='l') type='rotate-right';
             if(key==='h') type='rotate-left';
             if(key==='k') type='flip-h';
             if(key==='j') type='flip-v';
             operateMaze3x3(type, cursorPos.x, cursorPos.y);
          }
        }
      } 
      // もし「迷路フェーズ」なら、プレイヤーの移動処理だけをする. という条件分岐だ
      else if (gamePhase === 'maze') {
        if (key === 'w') handlePlayerMove(0, -1); // 上へ
        if (key === 's') handlePlayerMove(0, 1); // 下へ
        if (key === 'a') handlePlayerMove(-1, 0); // 左へ
        if (key === 'd') handlePlayerMove(1, 0); // 右へ
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);

  }, [screen, mazeData, cursorPos, movesLeft, gamePhase, playerPos, regulationState, collectedCheckpoints]);
    
  useEffect(() => {
    if (screen === 'game' && gamePhase === 'puzzle' && movesLeft === 0) {
      startMazePhase();
    }
  }, [movesLeft, screen, gamePhase]);

  
  
  // リセット機能
  const handleResetPuzzle = () => {
    setMazeData(JSON.parse(JSON.stringify(initialMazeData)));
    setMovesLeft(STAGE_MOVES_LIMIT[currentStage] || 10);
    setCursorPos({ x: 0, y: 0 });
    setGamePhase('puzzle'); //やり直ししたときにパズルフェーズにする
  };


  // ステージをクリアした時に呼び出す関数
  const handleStageClear = (stageId) => {
    // まだそのステージIDがクリアリストになければ追加する処理
    if (!clearedStages.includes(stageId)) {
      const newList = [...clearedStages, stageId];
      
      setClearedStages(newList); // 画面上のデータを更新
      
      // ブラウザに保存（Local Storage APIを使用）
      localStorage.setItem("shiftLabyrinthSave", JSON.stringify(newList));
    }
  };

  // 進捗リセット機能（半分デバッグ用なので削除するかも）
  const handleResetData = () => {
    // 誤処理防止のため, ユーザーに確認する
    const isConfirmed = window.confirm("進捗状況がリセットされます。本当によろしいですか？");

    if (isConfirmed) {
      // 1. ブラウザの保存データを消す
      localStorage.removeItem("shiftLabyrinthSave");
      // 2. 画面上の記憶もリセットする
      setClearedStages([]);
      // 3. 完了メッセージ
      alert("データをリセットしました。");
    }
  };

  // ステージの状態（クリア済み、開放、ロック）を判定する関数
  const getStageStatus = (stageId) => {
    // 1. 既にクリア済みリストに含まれている場合
    if (clearedStages.includes(stageId)) {
      return 'cleared';
    }

    // 2. 最初から遊べるステージ（チュートリアルとStage1）
    if (stageId === 'tutorial' || stageId === 'stage1') {
      return 'open';
    }

    // 3. 前のステージをクリアしているかチェックして開放するロジック
    if (stageId === 'stage2' && clearedStages.includes('stage1')) return 'open';
    if (stageId === 'stage3' && clearedStages.includes('stage2')) return 'open';
    if (stageId === 'stage4' && clearedStages.includes('stage3')) return 'open';
    if (stageId === 'stage5' && clearedStages.includes('stage4')) return 'open';
    if (stageId === 'stage6' && clearedStages.includes('stage5')) return 'open';

    // 4. 上記以外はまだ遊べないのでロック状態
    return 'locked';
  };

  // ステージボタンが押された時の処理
  const handleStageSelect = (stageId) => {
    const status = getStageStatus(stageId);

    // もしロックされていたら、ここで処理を終了する（画面遷移させない）
    if (status === 'locked') {
      return; 
    }

    // パズルの初期化処理
    const loadData = ALL_STAGES_DATA[stageId] || INITIAL_TUTORIAL_DATA;
    const dataCopy = JSON.parse(JSON.stringify(loadData));
    
    setMazeData(dataCopy);
    setInitialMazeData(dataCopy); // リセット用に保存
    setCursorPos({ x: 0, y: 0 }); // カーソルを左上へ
    setMovesLeft(STAGE_MOVES_LIMIT[stageId] || 10); // 回数制限セット

    setGamePhase('puzzle'); //ステージが始まるときにパズルフェーズから開始にする

    setCurrentStage(stageId);
    setScreen('game');
  };

  // タイトル画面に戻る処理
  const handleBackToTitle = () => {
    setScreen('title');
    setCurrentStage(null);
  };

  // デバッグ用の強制的にクリア扱いにする関数（後で消す）
  const debugClearStage = () => {
    if (currentStage) {
      handleStageClear(currentStage);
      alert(`${currentStage} をクリアしました！次のステージが遊べます。`);
      setScreen('select'); // 選択画面に戻す
    }
  };

  //メッセージボックスの「次へ」ボタンの処理
  const handleNextMessage = () => {
    // 次のメッセージ番号に進める
    setCurrentMessageIndex(currentMessageIndex + 1);
  };

  // ------------------------------------------------------------
  // 画面描画（レンダリング）（JSXですわよ）
  // ------------------------------------------------------------

  const CELL_SIZE = currentStage === 'stage6' ? 30 : 40;

  return (
    <div className="app-container">
      
      {/* 画面ごとの表示切り替え. screen変数の値によって表示する内容を変える */}


      {/* ゲーム画面の状態を示す3つのパターン別に管理する. */}
      {/* パターン1: タイトル画面 */}
      {screen === 'title' && (
        <div className="title-screen">
          <h1 className="game-title">エイリアンシフト</h1>
          <p className="sub-title">復元迷路パズル</p>
          
          <button className="start-button" onClick={() => setScreen('select')}>
            START
          </button>
        </div>
      )}


      {/* パターン2: ステージ選択画面 */}
      {screen === 'select' && (
        <div className="select-screen">
          <h2>ステージを選択</h2>
          
          {/* チュートリアルボタンエリア */}
          <div className="tutorial-area">
            {/* 即時関数を使ってボタンのクラス名を動的に決定する */}
            {(() => {
              const status = getStageStatus('tutorial');
              const btnClass = `stage-btn tutorial-btn is-${status}`;
              
              return (
                <button 
                  className={btnClass}
                  onClick={() => handleStageSelect('tutorial')}
                >
                  {/* クリア済みなら王冠マークをつける */}
                  {(() => {
                    if (status === 'cleared') {
                      return '🔰 チュートリアル 👑';
                    } else {
                      return '🔰 チュートリアル 🚩';
                    }
                  })()}
                </button>
              );
            })()}
          </div>

          <p className="tutorial-hint">↑はじめての人はこれをクリック！</p>

          {/* 本編ステージ一覧（mapを使った表示） */}
          <div className="stage-grid">
            {[1, 2, 3, 4, 5, 6].map((num) => {
              const stageId = `stage${num}`;
              const status = getStageStatus(stageId);
              
              // ステージ6 かつ まだlockedなら、ボタンを表示しない
              if (num === 6 && status === 'locked') {
                // 透明な箱だけ置いて空白の作成
                return <div key={num} className="stage-placeholder"></div>;
              }
              
              // ステージ6用の特別クラスを追加するか判定
              // numが6なら 'final-stage' を追加、それ以外は空文字
              let finalClass = '';
              if (num === 6) {
                finalClass = 'final-stage';
              }

              // クラス名を連結: 元のクラス + 最終ステージ用クラス
              // 正直これは何の処理なのかあまりよくわかってない. 要復習！
              const btnClass = `stage-btn is-${status} ${finalClass}`;

              return (
                <button 
                  key={num} 
                  className={btnClass}
                  onClick={() => handleStageSelect(stageId)}
                >
                  {/* 状態によってボタンの文字を変える */}
                  {(() => {
                    if (status === 'cleared') {
                      return `Stage ${num} 👑`;
                    } else if (status === 'locked') {
                      return `Stage ${num} 🔒`;
                    } else {
                      return `Stage ${num} 🚩`;
                    }
                  })()}
                </button>
              );
            })}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px', marginTop: '15px' }}>
            <button className="back-btn" onClick={handleBackToTitle}>
              タイトルに戻る
            </button>

            <button className="back-btn" onClick={handleResetData} style={{ fontSize: '0.7rem', opacity: 0.8}}>
              全進捗をリセットする
            </button>
          </div>
        </div>
      )}


      {/* パターン3: ゲームプレイ画面 */}
      {screen === 'game' && (
        <div className="game-screen">
          {/* 新規追加したヒントボタン_2026/01/27_23:02 */}
          <button className="hint-toggle-btn" onClick={() => setIsHintOpen(true)}>
            操作方法
          </button>
          
          <h2>プレイ中: {currentStage}</h2>

          {/* メッセージボックスの表示 */}
          {/* メッセージリストがあり、かつ、今の番号がリストの長さ未満のときだけ表示 */}
          {(() => {
            if (tutorialMessages.length > 0 && currentMessageIndex < tutorialMessages.length) {
              return (
                <div className="message-overlay">
                  <div className="message-box">
                    <p className="message-text">
                      {tutorialMessages[currentMessageIndex]}
                    </p>
                    <button className="next-msg-btn" onClick={handleNextMessage}>
                      次へ ▼
                    </button>
                  </div>
                </div>
              );
            }
          })()}

          {isHintOpen && (
            <div className="message-overlay" style={{ alignItems: 'center' }}>
              <div className="message-box" style={{ width: '60%', border: '4px solid #d000ff' }}>
                
                <p className="message-text">
                  【操作方法】<br/>
                  [W][A][S][D]：カーソル/プレイヤー移動<br/>
                  [H]：カーソル内左回転<br/>
                  [L]：カーソル内右回転<br/>
                  [J]：カーソル内上下反転<br/>
                  [k]：カーソル内左右反転<br/>
                  <br/>
                  クリアを目指して頑張ってください！
                </p>

                <button className="next-msg-btn" onClick={() => setIsHintOpen(false)}>
                  OK
                </button>
              </div>
            </div>
          )}

          <div className="maze-board" style={{ 
            display: 'grid', 
            gridTemplateColumns: `repeat(${mazeData[0].length}, ${CELL_SIZE}px)`, /* 横40pxがn個の迷路. nが迷路の横のマス数. CELL_SIZEは６の時だけ30 */
            gridTemplateRows: `repeat(${mazeData.length}, ${CELL_SIZE}px)`, /* 縦も40px（CELL_SIZE. ６だと30px）n個の迷路. これは縦のマス */
            gap: '0',
            position: 'relative',
            width: 'fit-content',
            margin: '20px auto',
            justifyContent: 'center',
          }}>
            {mazeData.map((row, y) => (
              row.map((cell, x) => (
                // 即時関数を使って、マスの数字に応じたクラスと文字を決定する
                (() => {
                  let className = 'maze-cell'; // 基本のクラス
                  let displayText = ''; // 表示する文字（基本は空っぽ）

                  // マスの数字(cell)によって分岐
                  if (cell === 0) {
                    className += ' cell-path'; // 道
                  } else if (cell === 1) {
                    className += ' cell-wall'; // 壁
                  } else if (cell === 2) {
                    className += ' cell-start'; // スタート
                  } else if (cell === 3) {
                    className += ' cell-goal'; // ゴール
                  } else if (cell === 4) {
                    className += ' cell-checkpoint'; // チェックポイント
                  } else if (cell >= 5) {
                    // 5以上は規制マス
                    className += ' cell-kisei';
                    // 数字をアルファベットに変換する魔法の計算
                    // 65は 'A' の文字コード。5のときA(65+0), 6のときB(65+1)となる
                    displayText = String.fromCharCode(65 + (cell - 5));
                  }

                  // 決定したクラスと文字でマスを描画
                  return (
                    <div key={`${x}-${y}`} className={className}>
                      {displayText}
                    </div>
                  );
                })()
              ))
            ))}
            {/* パズルフェーズの操作カーソル */}
            {gamePhase === 'puzzle' && (
              <div className="cursor-overlay" style={{
                left: `${cursorPos.x * CELL_SIZE}px`,
                top: `${cursorPos.y * CELL_SIZE}px`,
                width: `${CELL_SIZE * 3}px`, 
                height: `${CELL_SIZE * 3}px`
              }} />
            )}

            {/* 迷路フェーズのプレイヤー */}
            {gamePhase === 'maze' && (
              <div className="player-char" style={{
                left: `${playerPos.x * CELL_SIZE}px`,
                top: `${playerPos.y * CELL_SIZE}px`,
                width: `${CELL_SIZE}px`,
                height: `${CELL_SIZE}px`
              }} />
            )}
          </div>

          
          <div style={{ marginTop: '20px', textAlign: 'center' }}>
            
            {/* パズルフェーズの表示 */}
            {gamePhase === 'puzzle' ? (
              <>
                <div style={{ fontSize: '1.2rem', marginBottom: '5px' }}>
                  残り回数: <span style={{ color: '#00e5ff', fontWeight: 'bold', fontSize: '1.5rem' }}>{movesLeft}</span>
                </div>
                <div style={{ fontSize: '0.8rem', color: '#aaa', marginBottom: '10px' }}>
                  [WASD] 移動 [L/H] 回転 [K/J] 反転
                </div>

                <div style={{ display:'flex', gap:'15px', justifyContent:'center', alignItems:'center' }}>
                  <button onClick={handleResetPuzzle} className="back-btn">
                    ↺ 最初に戻す
                  </button>
                  
                  <button className="challenge-btn" onClick={startMazePhase}>
                    Challenge
                  </button>
                </div>
              </> /* 複数の要素の表示とかをまとめるやつです. 
                     表示されない囲いでまとめることでデザイン崩れを防止するってやつですが, 
                     たぶんあなたは忘れるので今見てるサイトのURL貼っとくね */
                  // https://qiita.com/kaba/items/b681ffe3412a9af32f92
                  // そんな難しいことではないからサイト見たらすぐ思い出す
            ) : (
              /* 迷路フェーズの表示 */
              <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:'10px' }}>
                <div style={{ color: '#d000ff', fontWeight: 'bold', fontSize: '1.2rem' }}>
                   CHALLENGE MODE
                </div>
                <div style={{ color: '#ccc' }}>
                   Checkpoint: {collectedCheckpoints} / {totalCheckpoints}
                </div>
                <button onClick={handleResetPuzzle} className="back-btn" style={{borderColor:'#d000ff', color:'#d000ff'}}>
                  あきらめて配置を直す
                </button>
              </div>
            )}

            {/* フェーズ共通のステー選択画面に戻るボタン */}
            <div style={{ marginTop: '20px' }}>
               <button className="back-btn" onClick={() => setScreen('select')}>
                 ステージ選択へ戻る
               </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

export default App;