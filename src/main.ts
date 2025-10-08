// main.ts
import p5 from 'p5';

import { SceneManager } from './scene/sceneManager';

let sceneManager: SceneManager;
let postShader: p5.Shader;

const sketch = (p: p5) => {

  p.setup = async () => {
    p.createCanvas(p.windowWidth, p.windowHeight, p.WEBGL);

    postShader = await p.loadShader('./shader/post.vert', './shader/post.frag');

    p.noCursor();

    sceneManager = new SceneManager(p);
  }

  p.draw = () => {
    sceneManager.update();

    p.shader(postShader);
    postShader.setUniform('u_resolution', [p.width, p.height]);
    postShader.setUniform('u_tex', sceneManager.getDrawTexture());
    postShader.setUniform('u_uitex', sceneManager.getUITexture());
    postShader.setUniform('u_time', p.millis() / 1000.0);
    postShader.setUniform("u_invert", sceneManager.midiSequencer.getFaderValues()[0]);
    postShader.setUniform("u_mosaic", sceneManager.midiSequencer.getFaderValues()[1]);
    postShader.setUniform("u_noise", sceneManager.midiSequencer.getFaderValues()[2]);
    postShader.setUniform("u_tile", sceneManager.midiSequencer.getFaderValues()[3]);
    postShader.setUniform("u_monochrome", sceneManager.midiSequencer.getFaderValues()[7]);
    p.rect(0, 0, p.width, p.height);

    // FPS表示
    // if(p.frameCount % 60 == 0){
    //   console.log(`FPS: ${p.frameRate().toFixed(2)}`);
    // }
  }

  p.windowResized = () => {
    p.resizeCanvas(p.windowWidth, p.windowHeight);
    sceneManager.resize();
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