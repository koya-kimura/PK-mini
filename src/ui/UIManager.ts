import p5 from 'p5';
import { APCMiniMK2Manager } from '../midi/APCMiniMK2Manager';
import { BPMManager } from '../rhythm/BPMManager';
import type { IUIOverlay, UIContext } from './IUIOverlay';

export class UIManager {
  private uiPatterns: IUIOverlay[] = [];
  private currentUIIndex = 0;
  private readonly midiManager: APCMiniMK2Manager;
  private readonly bpmManager: BPMManager;
  private uiTexture: p5.Graphics | null = null;

  constructor(midiManager: APCMiniMK2Manager, bpmManager: BPMManager) {
    this.midiManager = midiManager;
    this.bpmManager = bpmManager;
  }

  /**
   * UI オーバーレイの初期登録。描画用の offscreen バッファもここで生成する。
   */
  setup(p: p5, uiPatterns: IUIOverlay[]): void {
    this.uiPatterns = uiPatterns;
    this.uiTexture = p.createGraphics(p.width, p.height);
    if (this.uiPatterns.length > 0) {
      // デフォルトは 0（非表示）。以降は selectUI で切り替える。
      this.currentUIIndex = 0;
    } else {
      this.currentUIIndex = 0;
    }
  }

  public getUITexture(): p5.Graphics | null {
    return this.uiTexture;
  }

  /**
   * 手動で UI パターンを切り替える。範囲外インデックスは丸める。
   */
  public selectUI(index: number): void {
    if (this.uiPatterns.length === 0) {
      this.currentUIIndex = 0;
      return;
    }
    if (index < 0) {
      this.currentUIIndex = 0;
      return;
    }
    if (index >= this.uiPatterns.length) {
      this.currentUIIndex = this.uiPatterns.length - 1;
      return;
    }
    this.currentUIIndex = index;
  }

  /**
   * 現在選択中の UI を描画する。SceneManager から渡される Beat/Step を文脈に含める。
   */
  public draw(p: p5, currentBeat: number, currentStep: number): void {
    if (!this.uiTexture || this.uiPatterns.length === 0) {
      return;
    }

    const overlay = this.uiPatterns[this.currentUIIndex];
    if (!overlay) {
      this.uiTexture.clear();
      return;
    }

    const patternIndex = this.midiManager.sideButtonRadioNum ?? 0;
    const sequencer = this.midiManager as unknown as {
      getSequenceValue?: (pattern: number, step: number) => number;
    };
    const sequenceValue = sequencer.getSequenceValue
      ? sequencer.getSequenceValue(patternIndex, currentStep)
      : 0;

    // UI 側に渡すコンテキスト情報。オーバーレイはここから必要データを取り出す。
    const context: UIContext = {
      beat: currentBeat,
      step: currentStep,
      patternIndex,
      sequenceValue,
    };

    overlay.draw(p, this.uiTexture, this.midiManager, this.bpmManager, context);
  }

  /**
   * 画面リサイズに合わせて UI バッファをリサイズ。
   */
  public resize(p: p5): void {
    if (this.uiTexture) {
      this.uiTexture.resizeCanvas(p.width, p.height);
    }
  }
}
