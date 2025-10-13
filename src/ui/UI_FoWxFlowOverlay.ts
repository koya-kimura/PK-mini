import p5 from 'p5';
import { ColorPalette } from '../utils/colorPalette';
import type { APCMiniMK2Manager } from '../midi/APCMiniMK2Manager';
import type { BPMManager } from '../rhythm/BPMManager';
import type { IUIOverlay, UIContext } from './IUIOverlay';

export class UI_FoWxFlowOverlay implements IUIOverlay {
  public readonly name = 'UI: sushi x p5js';
  private readonly primaryColor: p5.Color;

  constructor(p: p5) {
    this.primaryColor = p.color(ColorPalette.common.white);
  }

  /**
   * sushi × p5js のタイポを中央に配置するシンプルなオーバーレイ。
   * 軽い点滅を入れて動きを感じさせる。
   */
  draw(
    p: p5,
    tex: p5.Graphics,
    _midiManager: APCMiniMK2Manager,
    _bpmManager: BPMManager,
    _context: UIContext
  ): void {
    tex.clear();
    tex.push();

    const w = tex.width;
    const h = tex.height;
    const minDim = Math.min(w, h);

    tex.textAlign(p.CENTER, p.CENTER);
    tex.textStyle('bold');
    tex.fill(this.primaryColor);
    tex.noStroke();

  const mainText = 'sushi x p5js';
    const mainSize = minDim * 0.22;
    tex.textSize(mainSize);
    const baseY = h * 0.36;
    // サイン波 + ランダム位相で時々テキストを非表示にし、薄いグリッチ感を演出。
    if (p.sin(p.frameCount * 0.05 + p.random(p.TAU)) < 0.98) {
      tex.text(mainText, w * 0.5, baseY);
    }
    tex.pop();
  }
}
