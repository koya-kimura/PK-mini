// --------------------------------------------------------------
// VisualSequenceOverlay
// MIDI シーケンスの状態を HUD として表示する UI 層。
// SceneManager から渡される数値を読み、演出テキストと共にオーバーレイ描画する。
// --------------------------------------------------------------

import p5 from 'p5';
import { ColorPalette } from '../utils/colorPalette';
import type { APCMiniMK2Manager } from '../midi/APCMiniMK2Manager';
import type { BPMManager } from '../rhythm/BPMManager';
import type { IUIOverlay, UIContext } from './IUIOverlay';

/**
 * ライブ序盤で使用する簡易 HUD。「SUSHI」のロゴのみを強調表示する。
 */
export class UI_StatusOverlay implements IUIOverlay {
	private readonly white: p5.Color;
	public readonly name = 'UI: Status Overlay';

	constructor(p: p5) {
		this.white = p.color(ColorPalette.common.white);
	}

	/**
	 * p: 呼び出し元の p5 インスタンス / target: 上書き先の UI バッファ。
	 * MIDI や BPM 情報は現状利用せず、巨大なロゴ文字を ADD ブレンドで表示する。
	 */
	draw(
		p: p5,
		target: p5.Graphics,
		_midiManager: APCMiniMK2Manager,
		_bpmManager: BPMManager,
		_context: UIContext
	): void {
		target.push();
		target.clear();
		target.blendMode(p.ADD);

		const w = target.width;
		const h = target.height;
		const minDim = Math.min(w, h);
		const sushiLabel = 'SUSHI';

		target.fill(this.white);
		target.noStroke();

		target.push();
		// 画面上部 3 割付近にロゴを配置。
		target.translate(w * 0.5, h * 0.32);
		target.textAlign('center', 'center');
		target.textStyle('bold');
		target.textSize(minDim * 0.36); // 画面サイズに依存させてスケール
		target.text(sushiLabel, 0, 0);
		target.pop();

			target.pop();
		target.blendMode(p.BLEND);
	}
}
