// --------------------------------------------------------------
// SushiTypographyMotion
// 「寿司」「司」の交互グリッドでタイポグラフィ演出を行うシーン。
// セルごとに計算されるモーションを 7 パターン切り替えで再生する。
// --------------------------------------------------------------

import p5 from 'p5';
import { Easing } from '../utils/easing';
import { ColorPalette } from '../utils/colorPalette';

interface CellAnimationResult {
    offsetX: number;
    offsetY: number;
    rotation: number;
    scale: number;
}

/**
 * シーン7用: グリッド状に並んだ「寿司」文字をダイナミックに動かすモーション。
 */
export class SushiTypographyMotion {
    private readonly p: p5;
    private readonly GRID_ROWS = 4;
    private readonly GRID_COLS = 8;
    private readonly BEAT_COLOR_SEED = 7919;

    constructor(p: p5) {
        this.p = p;
    }

    /**
     * target: SceneManager のバッファ。ここに和文グリッドを描く。
     * sequenceValue: APC からのモード番号。0 で非表示。
     * beat: BPMManager の拍位置。整数でカラーシード、小数でアニメ進行。
     */
    update(target: p5.Graphics, sequenceValue: number, beat: number): void {
        if (sequenceValue <= 0) {
            return;
        }

        const p = this.p;
        const beatFloor = p.floor(beat);
        const beatFrac = beat - beatFloor;
        const cellWidth = target.width / this.GRID_COLS;
        const cellHeight = target.height / this.GRID_ROWS;
        const palette = ColorPalette.scenes.sushiText;
        // 許可された配色（橙・赤・黄・白・黒・波の青）のみをローテーション。
        const glyphColors = palette.palette;

        target.push();
        target.textAlign(p.CENTER, p.CENTER);
        target.noStroke();

    for (let row = 0; row < this.GRID_ROWS; row++) {
            for (let col = 0; col < this.GRID_COLS; col++) {
                const cellIndex = row * this.GRID_COLS + col;
        // 縞模様のように「寿」「司」を交互に配置して視覚的リズムを作る。
                const glyph = (row + col) % 2 === 0 ? '寿' : '司';

                const animation = this.computeAnimation(
                    sequenceValue,
                    row,
                    col,
                    cellIndex,
                    beat,
                    beatFloor,
                    beatFrac,
                    cellWidth,
                    cellHeight,
                );

                const colorIndex = (cellIndex + beatFloor) % glyphColors.length; // 拍頭ごとに色列がスライド
                const fillColor = p.color(glyphColors[colorIndex]);
                const brightnessPulse = 0.4 + Easing.easeOutSine((beatFrac + cellIndex * 0.07) % 1) * 0.6;
                // ほんのり明滅して紙芝居っぽさを出す。アルファで調整。
                fillColor.setAlpha(155 + brightnessPulse * 90);

                const baseSize = cellHeight * 0.7;
                const textSize = baseSize * animation.scale;
                target.push();
                // セル中心に移動してからオフセットを適用。
                target.translate(
                    col * cellWidth + cellWidth / 2 + animation.offsetX,
                    row * cellHeight + cellHeight / 2 + animation.offsetY,
                );
                target.rotate(animation.rotation);
                target.fill(fillColor);
                target.textSize(textSize);
                target.textStyle(p.BOLD);
                target.text(glyph, 0, 0);
                target.pop();
            }
        }

        target.pop();
    }

    /**
     * 各セルの変形量を算出して返すヘルパー。戻り値は offset/rotation/scale のセット。
     */
    private computeAnimation(
        sequenceValue: number,
        row: number,
        col: number,
        index: number,
        beat: number,
        beatFloor: number,
        beatFrac: number,
        cellWidth: number,
        cellHeight: number,
    ): CellAnimationResult {
    // 各セルのオフセット・回転・スケールを計算するメインロジック。
    // sequenceValue ごとに異なるモーションを返し、UI グリッド全体を同期させる。
        const p = this.p;
    const wavePhase = beat * 0.8 + index * 0.13; // 各セルで位相ずらし
        const centerCol = (this.GRID_COLS - 1) / 2;
        const centerRow = (this.GRID_ROWS - 1) / 2;
    const dx = col - centerCol;
    const dy = row - centerRow;
    const distance = Math.sqrt(dx * dx + dy * dy) + 1e-3; // 0除算回避の微小値

        let offsetX = 0;
        let offsetY = 0;
        let rotation = 0;
        let scale = 1;

        switch (sequenceValue) {
            case 1: {
                // case1: 行単位で縦ゆらぎ。掛け軸が揺れるイメージ。
                const sway = Math.sin(wavePhase) * 0.18;
                offsetY = sway * cellHeight;
                scale = 1 + Easing.easeInOutSine((beatFrac + row * 0.12) % 1) * 0.18;
                break;
            }
            case 2: {
                // case2: 左右に滑りながら回転。
                const slide = Math.sin(wavePhase * 1.1) * 0.25;
                offsetX = slide * cellWidth;
                rotation = Math.sin(wavePhase * 0.9) * 0.2;
                break;
            }
            case 3: {
                // case3: 各セルが渦を描いて周回。
                const swirlAngle = wavePhase + beatFrac * p.TWO_PI;
                offsetX = Math.cos(swirlAngle) * cellWidth * 0.18;
                offsetY = Math.sin(swirlAngle) * cellHeight * 0.18;
                rotation = swirlAngle * 0.35;
                scale = 1 + Easing.easeInOutSine((beatFrac + index * 0.05) % 1) * 0.24;
                break;
            }
            case 4: {
                // case4: 呼吸のように上下へ膨らむ。
                const breathing = Easing.easeInOutBack((beatFrac + (row + col) * 0.07) % 1);
                offsetY = (0.5 - breathing) * cellHeight * 0.22;
                scale = 0.85 + breathing * 0.55;
                break;
            }
            case 5: {
                // case5: Perlin noise でランダムに揺らす。静かなざわめき。
                const noiseBase = index * 0.37;
                offsetX = (p.noise(beat * 0.6, noiseBase) - 0.5) * cellWidth * 0.35;
                offsetY = (p.noise(beat * 0.6, noiseBase + 42) - 0.5) * cellHeight * 0.35;
                rotation = (p.noise(beat * 0.6, noiseBase + 71) - 0.5) * 0.7;
                scale = 0.9 + (p.noise(beat * 0.6, noiseBase + 133)) * 0.6;
                break;
            }
            case 6: {
                // case6: グリッド中心から渦巻き方向へ拡張。
                const baseAngle = Math.atan2(dy, dx) + beat * 0.45;
                const spiral = Easing.easeInOutSine((beatFrac + distance * 0.08) % 1);
                const radius = Math.min(cellWidth, cellHeight) * distance * 0.28 * spiral;
                offsetX = Math.cos(baseAngle) * radius;
                offsetY = Math.sin(baseAngle) * radius;
                rotation = baseAngle * 0.45;
                scale = 0.95 + spiral * 0.45;
                break;
            }
            case 7: {
                // case7: 拍の勢いで爆ぜるように拡散。ランダム角を pre-compute。
                const pulse = Easing.easeOutExpo(beatFrac);
                const randomAngle = (index * 1423 + beatFloor * this.BEAT_COLOR_SEED) % p.TWO_PI;
                offsetX = Math.cos(randomAngle + beat * 0.35) * cellWidth * (0.22 + pulse * 0.55);
                offsetY = Math.sin(randomAngle + beat * 0.35) * cellHeight * (0.22 + pulse * 0.55);
                rotation = (randomAngle + beat * 0.6) * 0.6;
                scale = 1 + pulse * 0.65;
                break;
            }
            default: {
                // safety: デフォルトは軽い縦揺れのみ。
                offsetY = Math.sin(wavePhase) * cellHeight * 0.1;
                scale = 1;
                break;
            }
        }

        return { offsetX, offsetY, rotation, scale };
    }
}
