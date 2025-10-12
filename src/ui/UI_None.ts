import p5 from 'p5';
import type { APCMiniMK2Manager } from '../midi/APCMiniMK2Manager';
import type { BPMManager } from '../rhythm/BPMManager';
import type { IUIOverlay, UIContext } from './IUIOverlay';

export class UI_None implements IUIOverlay {
  public name = 'UI: None';

  /**
   * 完全に UI を表示しないダミーオーバーレイ。バッファをクリアするだけ。
   */
  draw(
    _p: p5,
    tex: p5.Graphics,
    _midiManager: APCMiniMK2Manager,
    _bpmManager: BPMManager,
    _context: UIContext
  ): void {
    tex.clear();
  }
}
