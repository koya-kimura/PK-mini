// --------------------------------------------------------------
// main.ts
// エントリーポイントとなる p5.js スケッチ。
// キャンバスとポストエフェクト用シェーダーを初期化し、
// シーン管理とUIオーバーレイ描画を 1 フレームごとに更新する。
// --------------------------------------------------------------

import p5 from 'p5';

import { SceneManager } from './scene/sceneManager';

let sceneManager: SceneManager;
let postShader: p5.Shader;

// p5 のライフサイクルを定義する無名関数。
// new p5(sketch) で実行され、setup/draw などが呼び出される。
const sketch = (p: p5) => {

  p.setup = async () => {
    // フルスクリーンの WEBGL キャンバスを作成。
    p.createCanvas(p.windowWidth, p.windowHeight, p.WEBGL);

    // ポストプロセス用シェーダーを非同期で読み込む。
    postShader = await p.loadShader('./shader/post.vert', './shader/post.frag');

    p.noCursor();

    // アニメーション全体を管理する SceneManager と
    // MIDI フィードバック表示用の UI オーバーレイを初期化。
    sceneManager = new SceneManager(p);
  }

  p.draw = () => {
    // 各シーンと MIDI 状態を更新し、描画用テクスチャを構築。
    sceneManager.update();

    // ポストエフェクト用シェーダーに描画結果とパラメータを渡し、
    // 最終的なフレームをキャンバスへ出力。
    p.shader(postShader);
    postShader.setUniform('u_resolution', [p.width, p.height]);
    postShader.setUniform('u_tex', sceneManager.getDrawTexture());
    postShader.setUniform('u_uitex', sceneManager.getUITexture());
    postShader.setUniform('u_time', p.millis() / 1000.0);

  const faders = sceneManager.midiSequencer.getFaderValues();

  // MIDI フェーダー -> ポストエフェクトの割り当て
  postShader.setUniform('u_invert', faders[0]);          // フェーダー1: 白黒反転
  postShader.setUniform('u_mosaic', faders[1]);          // フェーダー2: モザイク強度
  postShader.setUniform('u_noise', faders[2]);           // フェーダー3: ノイズ揺らぎ
  postShader.setUniform('u_tile', faders[3]);            // フェーダー4: タイル反復
  postShader.setUniform('u_rgbSplit', faders[4]);        // フェーダー5: RGB 分離
  postShader.setUniform('u_zoom', faders[5]);            // フェーダー6: ズームイン
  postShader.setUniform('u_blockRotate', faders[6]);     // フェーダー7: ブロック回転
  postShader.setUniform('u_monochrome', faders[7]);      // フェーダー8: モノクロ化
  // フェーダー9 はシーケンスクリア専用。ポストエフェクトには割り当てない。
    p.rect(0, 0, p.width, p.height);

    // FPS表示
    // if(p.frameCount % 60 == 0){
    //   console.log(`FPS: ${p.frameRate().toFixed(2)}`);
    // }
  }

  p.windowResized = () => {
    // ウィンドウサイズ変更時にキャンバスと内部テクスチャをリサイズ。
    p.resizeCanvas(p.windowWidth, p.windowHeight);
    sceneManager.resize();
  }

  p.keyPressed = () => {
    // スペース: フルスクリーン、Enter: タップテンポ、1: UI 表示切り替え。
    if (p.keyCode === 32) {
      p.fullscreen(true);
    }
    if (p.key === 'Enter') {
      sceneManager.tapTempo();
    }
    if (p.key === '0') {
      sceneManager.selectUI(0);
    }
    if (p.key === '1') {
      sceneManager.selectUI(1);
    }
    if (p.key === '2') {
      sceneManager.selectUI(2);
    }
    if (p.key === '3') {
      sceneManager.selectUI(3);
    }
    if (p.key === '4') {
      sceneManager.selectUI(4);
    }
  }
}

// 🚨 new p5(sketch) でスケッチを実行
new p5(sketch);