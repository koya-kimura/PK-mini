import p5 from 'p5';
import { ColorPalette } from '../utils/colorPalette';
import { APCMiniMK2Sequencer } from '../midi/APCMiniMK2Sequencer';
import type { APCMiniMK2Manager } from '../midi/APCMiniMK2Manager';
import type { BPMManager } from '../rhythm/BPMManager';
import type { IUIOverlay, UIContext } from './IUIOverlay';

export class UI_GridOverlay implements IUIOverlay {
  public readonly name = 'UI: Grid Overview';
  private readonly fillColor: p5.Color;
  private readonly highlightColor: p5.Color;
  private readonly scheduledColor: p5.Color;

  constructor(p: p5) {
    this.fillColor = p.color(ColorPalette.common.white);
    this.highlightColor = p.color(ColorPalette.common.white);
    this.scheduledColor = p.color(180);
    this.scheduledColor.setAlpha(160);
  }

  /**
   * 8x8 のマトリクスを描き、現在のシーケンス状態を可視化する。
   * tex: UI レイヤーのバッファ / midiManager: 現在のパターン情報を読み出すために使用。
   */
  draw(
    _p: p5,
    tex: p5.Graphics,
    midiManager: APCMiniMK2Manager,
    _bpmManager: BPMManager,
    context: UIContext
  ): void {
    tex.push();
    tex.clear();

    const w = tex.width;
    const h = tex.height;
  const gridSize = Math.min(w, h) * 0.45; // 縦横どちらでも収まる最大サイズ
  const cellSize = gridSize / 8;
    const originX = w * 0.5 - gridSize * 0.5;
    const originY = h * 0.5 - gridSize * 0.5;

  const sequencer = midiManager instanceof APCMiniMK2Sequencer ? midiManager : null;
  const patternIndex = context.patternIndex;
  // Sequencer から現在のパターンを取得。未接続時はゼロ配列でフォールバック。
  const pattern = sequencer ? sequencer.sequencePatterns[patternIndex] : new Array(8).fill(0);
    const currentStep = context.step;

    tex.push();
    tex.noStroke();
    tex.fill(0, 200);
    tex.rectMode(_p.CENTER);
      tex.rect(_p.width / 2, _p.height / 2, _p.min(_p.width, _p.height) * 0.5, _p.min(_p.width, _p.height) * 0.5, _p.min(_p.width, _p.height) * 0.003, _p.min(_p.width, _p.height) * 0.003);
    tex.pop();

    for (let col = 0; col < 8; col++) {
      const activeRow = pattern[col] ?? 0;
      for (let row = 0; row < 8; row++) {
        const displayRow = row;
        const x = originX + col * cellSize;
        const y = originY + displayRow * cellSize;
        const isActive = row === activeRow;
        const isCurrentStep = col === currentStep;
        const isCurrentCell = isActive && isCurrentStep;

        tex.push();
        if (isCurrentCell) {
          // 再生中セル: 白で強調。
          tex.fill(this.highlightColor);
        } else if (isCurrentStep) {
          // 現在のステップ列: 薄い塗りで予告。
          tex.fill(this.scheduledColor);
        } else {
          tex.noFill();
        }

        tex.stroke(this.fillColor);
        tex.strokeWeight(isCurrentCell ? 3 : 1.2);
        tex.rect(x + cellSize * 0.1, y + cellSize * 0.1, cellSize * 0.8, cellSize * 0.8, cellSize * 0.02);
        tex.pop();
      }
    }

    tex.pop();
  }
}
