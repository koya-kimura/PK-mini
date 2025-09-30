// main.ts
import p5 from 'p5';

import { SceneManager } from './scene/sceneManager';

let sceneManager: SceneManager;

const sketch = (p: p5) => {

  p.setup = async () => {
    p.createCanvas(p.windowWidth, p.windowHeight);
    p.noCursor();

    sceneManager = new SceneManager(p);
  }

  p.draw = () => {
    sceneManager.update();
  }

  p.windowResized = () => {
    p.resizeCanvas(p.windowWidth, p.windowHeight);
  }

  p.keyPressed = () => {
    if (p.keyCode === 32) {
      p.fullscreen(true);
    }
    if (p.key === 'Enter') {
      sceneManager.tapTempo();
    }
  }
}

// 🚨 new p5(sketch) でスケッチを実行
new p5(sketch);