import p5 from 'p5';
import { APCMiniMK2Manager } from '../midi/APCMiniMK2Manager';
import { BPMManager } from '../rhythm/BPMManager';

/**
 * UI オーバーレイに渡される文脈情報。beat/step や現在パターンを含む。
 */
export interface UIContext {
  beat: number;
  step: number;
  patternIndex: number;
  sequenceValue: number;
}

/**
 * すべての UI オーバーレイが実装すべきインターフェース。
 */
export interface IUIOverlay {
  name: string;
  /**
   * p: 呼び出し元の p5 インスタンス / tex: 直接描画するオフスクリーンバッファ。
   * midiManager/bpmManager/context から必要な情報を抜き取って HUD を描画する。
   */
  draw(
    p: p5,
    tex: p5.Graphics,
    midiManager: APCMiniMK2Manager,
    bpmManager: BPMManager,
    context: UIContext
  ): void;
}
