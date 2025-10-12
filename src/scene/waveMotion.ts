// --------------------------------------------------------------
// WaveMotion
// 伝統模様「青海波」をベースにした 7 種のアニメーションを描画。
// モノの陰影を強調するため、許可された白と藍色のコントラストで構成。
// --------------------------------------------------------------

import p5 from 'p5';
import { ColorPalette } from '../utils/colorPalette';

/**
 * 青海波（せいがいは）アニメーションを管理するクラス
 * 7つの異なるシーケンスに対応した、青海波模様の多彩な動きを表現
 * キャンバス下部40%を中心に描画
 */
export class WaveMotion {
    private p: p5;
    private readonly CANVAS_BOTTOM_RATIO = 0.6; // キャンバス下部40%の開始位置
    private readonly ARC_SEGMENTS = 8; // 青海波ユニットを構成する同心円の数
    private readonly BASE_RADIUS_RATIO = 0.1; // 基本半径の割合を少し小さくして波幅を狭める

    constructor(p: p5) {
        this.p = p;
    }

    /**
     * sequencer からの値に応じて 7 パターンの青海波モーションを切り替える。
     * tex: p.graphics … 描画先のバッファ。シーンマネージャーが用意した仮想キャンバス。
     * sequenceValue: number … APC MINI のパッド or クリップ番号。0 のときは無効。
     * currentBeat: number … BPMManager から渡される連続したビート。小数部が進行度。
     */
    update(tex: p5.Graphics, sequenceValue: number, currentBeat: number): void {
        if (sequenceValue <= 0) {
            return;
        }

        // 1〜7 の離散値を switch で選択。裏で `SceneManager` がパッド割り当て済み。
        switch (sequenceValue) {
            case 1:
                this.gentleWave(tex, currentBeat);
                break;
            case 2:
                this.layeredFlow(tex, currentBeat);
                break;
            case 3:
                this.spiralSeigaiha(tex, currentBeat);
                break;
            case 4:
                this.growingWaves(tex, currentBeat);
                break;
            case 5:
                this.horizontalWaveFlow(tex, currentBeat);
                break;
            case 6:
                this.cascadingReveal(tex, currentBeat);
                break;
            case 7:
                this.burstingPattern(tex, currentBeat);
                break;
        }
    }

    // シーケンス1: 列ごとに時差のある波打ち（波を大きく）
    private gentleWave(tex: p5.Graphics, beat: number): void {
        // 画面サイズから波ユニットの基準半径を計算。stepX/stepY は横方向・縦方向のタイル間隔。
        const baseRadius = this.p.min(tex.width, tex.height) * this.BASE_RADIUS_RATIO;
        const stepX = baseRadius * 1.4;
        const stepY = baseRadius * 0.28;
        const startY = tex.height * this.CANVAS_BOTTOM_RATIO;

        // 列ごとにフェーズをずらしながら波を揺らす。
        this.drawSeigaihaPatternWithColumnDelay(tex, baseRadius, stepX, stepY, startY, beat);
    }

    // シーケンス2: 波紋のように中心から外側へ広がる（波を大きく）
    private layeredFlow(tex: p5.Graphics, beat: number): void {
        const baseRadius = this.p.min(tex.width, tex.height) * this.BASE_RADIUS_RATIO;
        const stepX = baseRadius * 1.4;
        const stepY = baseRadius * 0.28;
        const startY = tex.height * this.CANVAS_BOTTOM_RATIO;

        this.drawSeigaihaPatternWithRipple(tex, baseRadius, stepX, stepY, startY, beat);
    }

    // シーケンス3: 螺旋状に回転しながら拡散（波を大きく）
    private spiralSeigaiha(tex: p5.Graphics, beat: number): void {
        const baseRadius = this.p.min(tex.width, tex.height) * this.BASE_RADIUS_RATIO;
        const stepX = baseRadius * 1.4;
        const stepY = baseRadius * 0.28;
        const startY = tex.height * this.CANVAS_BOTTOM_RATIO;

        this.drawSeigaihaPatternWithSpiral(tex, baseRadius, stepX, stepY, startY, beat);
    }

    // シーケンス4: カウントに合わせて波が下から上に伸びる
    private growingWaves(tex: p5.Graphics, beat: number): void {
        const baseRadius = this.p.min(tex.width, tex.height) * this.BASE_RADIUS_RATIO;
        const stepX = baseRadius * 1.4;
        const stepY = baseRadius * 0.28;
        const startY = tex.height; // 画面下端から開始

        const beatProgress = beat % 1; // 1ビート内の進行度
        const growthHeight = beatProgress * tex.height * 0.5; // 画面の50%まで成長

        this.drawGrowingSeigaihaPattern(tex, baseRadius, stepX, stepY, startY, growthHeight);
    }

    // シーケンス5: 横方向に流れながら波打つ
    private horizontalWaveFlow(tex: p5.Graphics, beat: number): void {
        const baseRadius = this.p.min(tex.width, tex.height) * this.BASE_RADIUS_RATIO;
        const stepX = baseRadius * 1.4;
        const stepY = baseRadius * 0.28;
        const startY = tex.height * this.CANVAS_BOTTOM_RATIO;

        this.drawHorizontalWaveFlowPattern(tex, baseRadius, stepX, stepY, startY, beat);
    }

    // シーケンス6: 段階的に波が現れる（カスケード）
    private cascadingReveal(tex: p5.Graphics, beat: number): void {
        const baseRadius = this.p.min(tex.width, tex.height) * this.BASE_RADIUS_RATIO;
        const stepX = baseRadius * 1.4;
        const stepY = baseRadius * 0.28;
        const startY = tex.height;

        this.drawCascadingRevealPattern(tex, baseRadius, stepX, stepY, startY, beat);
    }

    // シーケンス7: 爆発的に波が噴出する
    private burstingPattern(tex: p5.Graphics, beat: number): void {
        const baseRadius = this.p.min(tex.width, tex.height) * this.BASE_RADIUS_RATIO;
        const stepX = baseRadius * 1.4;
        const stepY = baseRadius * 0.28;
        const startY = tex.height;

        this.drawBurstingPattern(tex, baseRadius, stepX, stepY, startY, beat);
    }

    // 列ごとに時差のある波打ち（波を大きく）- 下にあるものほど手前に描画
    private drawSeigaihaPatternWithColumnDelay(tex: p5.Graphics, baseRadius: number, stepX: number, stepY: number, startY: number, beat: number): void {
        const rows = this.p.floor((tex.height * (1 - this.CANVAS_BOTTOM_RATIO) / stepY) * 1.5) + 2;
        const cols = this.p.floor(tex.width / stepX) + 2;

        // 下から上に描画（キャンバスの下にあるものほど手前に描画）
        for (let j = 0; j < rows; j++) {
            for (let i = -1; i < cols; i++) {
                let centerX = i * stepX;
                
                // 列ごとに時差を設けた波動（波を大きく）
                const columnDelay = i * 0.3;
                const waveOffset = this.p.sin(beat * 0.6 + columnDelay) * stepY * 0.8; // 0.4 → 0.8
                let centerY = startY + j * stepY + waveOffset;

                let radiusW = baseRadius;
                let radiusH = baseRadius * (j % 2 === 0 ? 1 : 0.85);

                if (j % 2 === 1) {
                    centerX += baseRadius;
                }

                // 描画そのものはヘルパーに委譲。alpha は現状固定。
                this.drawSeigaihaUnit(tex, centerX, centerY, radiusW, radiusH, 1.0);
            }
        }
    }

    // 波紋のように中心から外側へ広がる（波を大きく）- 下にあるものほど手前に描画
    private drawSeigaihaPatternWithRipple(tex: p5.Graphics, baseRadius: number, stepX: number, stepY: number, startY: number, beat: number): void {
    const rows = this.p.floor((tex.height * (1 - this.CANVAS_BOTTOM_RATIO) / stepY) * 1.5) + 2;
    const cols = this.p.floor(tex.width / stepX) + 2;
    const centerCol = cols / 2;
    const centerRow = rows / 2;

        // 下から上に描画（キャンバスの下にあるものほど手前に描画）
        for (let j = 0; j < rows; j++) {
            for (let i = -1; i < cols; i++) {
                let centerX = i * stepX;
                
                // 中心からの距離に基づく波動（波を大きく）
                const distance = this.p.sqrt((i - centerCol) * (i - centerCol) + (j - centerRow) * (j - centerRow));
                const rippleOffset = this.p.sin(beat * 0.8 - distance * 0.5) * stepY * 0.6; // 0.3 → 0.6
                let centerY = startY + j * stepY + rippleOffset;

                let radiusW = baseRadius;
                let radiusH = baseRadius * (j % 2 === 0 ? 1 : 0.85);

                if (j % 2 === 1) {
                    centerX += baseRadius;
                }

                this.drawSeigaihaUnit(tex, centerX, centerY, radiusW, radiusH, 1.0);
            }
        }
    }

    // 螺旋状に回転しながら拡散（波を大きく）- 下にあるものほど手前に描画
    private drawSeigaihaPatternWithSpiral(tex: p5.Graphics, baseRadius: number, stepX: number, stepY: number, startY: number, beat: number): void {
    const rows = this.p.floor((tex.height * (1 - this.CANVAS_BOTTOM_RATIO) / stepY) * 1.5) + 2;
    const cols = this.p.floor(tex.width / stepX) + 2;
    const centerCol = cols / 2;
    const centerRow = rows / 2;

        // 下から上に描画（キャンバスの下にあるものほど手前に描画）
        for (let j = 0; j < rows; j++) {
            for (let i = -1; i < cols; i++) {
                let centerX = i * stepX;
                
                // 螺旋状の回転運動（波を大きく）
                const distance = this.p.sqrt((i - centerCol) * (i - centerCol) + (j - centerRow) * (j - centerRow));
                const angle = this.p.atan2(j - centerRow, i - centerCol);
                const spiralOffset = this.p.sin(beat * 0.5 + angle + distance * 0.3) * stepY * 0.8; // 0.4 → 0.8
                
                let centerY = startY + j * stepY + spiralOffset;

                let radiusW = baseRadius;
                let radiusH = baseRadius * (j % 2 === 0 ? 1 : 0.85);

                if (j % 2 === 1) {
                    centerX += baseRadius;
                }

                this.drawSeigaihaUnit(tex, centerX, centerY, radiusW, radiusH, 1.0);
            }
        }
    }

    // 新しいパターン4: カウントに合わせて波が下から上に伸びる - 下にあるものほど手前に描画
    private drawGrowingSeigaihaPattern(tex: p5.Graphics, baseRadius: number, stepX: number, stepY: number, startY: number, growthHeight: number): void {
        const cols = this.p.floor(tex.width / stepX) + 2;
        const maxRows = this.p.floor(growthHeight / stepY);

        // 上から下に描画（下にあるものが後から描画されて手前に来る）
        for (let j = maxRows; j >= 0; j--) {
            for (let i = -1; i < cols; i++) {
                let centerX = i * stepX;
                let centerY = startY - j * stepY;

                let radiusW = baseRadius;
                let radiusH = baseRadius * (j % 2 === 0 ? 1 : 0.85);

                if (j % 2 === 1) {
                    centerX += baseRadius;
                }

                this.drawSeigaihaUnit(tex, centerX, centerY, radiusW, radiusH, 1.0);
            }
        }
    }

    // 新しいパターン5: 横方向に流れながら波打つ - 下にあるものほど手前に描画
    private drawHorizontalWaveFlowPattern(tex: p5.Graphics, baseRadius: number, stepX: number, stepY: number, startY: number, beat: number): void {
        const cols = this.p.floor(tex.width / stepX) + 3;
        const rows = this.p.floor((tex.height * (1 - this.CANVAS_BOTTOM_RATIO) / stepY) * 1.5) + 2;
        const totalWidth = cols * stepX;

        // 時間に応じて横方向へスクロール
        const flowSpeed = stepX * 0.8;
        const time = beat;
        const horizontalShift = (time * flowSpeed) % totalWidth;

        // 波の振幅を時間と列ごとに変化させる
        const baseAmplitude = stepY * 0.6;
        const amplitudeVariationSpeed = 0.15;

        // 下にあるものを手前に描画するため、上から下へループ
        for (let j = 0; j < rows; j++) {
            for (let i = -1; i < cols; i++) {
                let centerX = (i * stepX + horizontalShift) % totalWidth;
                if (centerX < -stepX) {
                    centerX += totalWidth;
                }
                centerX -= stepX; // 左端を画面外から開始

                // 列と時間に応じて振幅を変化させる（0.3〜1.0倍）
                const noiseInputX = (i + cols) * 0.1;
                const noiseInputT = time * amplitudeVariationSpeed;
                const amplitudeFactor = this.p.map(this.p.noise(noiseInputX, noiseInputT + j * 0.05), 0, 1, 0.3, 1.0);
                const amplitude = baseAmplitude * amplitudeFactor;

                const wavePhase = time * 1.4 + i * 0.6 + j * 0.25;
                const waveOffset = this.p.sin(wavePhase) * amplitude;

                let centerY = startY + j * stepY + waveOffset;

                let radiusW = baseRadius;
                let radiusH = baseRadius * (j % 2 === 0 ? 1 : 0.85);

                if (j % 2 === 1) {
                    centerX += baseRadius;
                }

                // 画面外に出た要素はスキップ（十分なバッファを持たせた上で）
                if (centerX > -stepX * 2 && centerX < tex.width + stepX * 2) {
                    this.drawSeigaihaUnit(tex, centerX, centerY, radiusW, radiusH, 1.0);
                }
            }
        }
    }

    // 新しいパターン6: 段階的に波が現れる（カスケード）- 下にあるものほど手前に描画
    private drawCascadingRevealPattern(tex: p5.Graphics, baseRadius: number, stepX: number, stepY: number, startY: number, beat: number): void {
    const cols = this.p.floor(tex.width / stepX) + 2;
    const rows = this.p.floor((tex.height * 0.6) / stepY);
        const totalElements = cols * rows;
    const revealProgress = (beat * 0.5) % 1; // ゆっくりめの 0.5 倍速で出現数を更新
        const elementsToShow = this.p.floor(revealProgress * totalElements);

        // 要素の配列を作成（上から下、左から右の順）
        const elements: {x: number, y: number, i: number, j: number}[] = [];
        for (let j = 0; j < rows; j++) {
            for (let i = -1; i < cols; i++) {
                let centerX = i * stepX;
                let centerY = startY - j * stepY;

                if (j % 2 === 1) {
                    centerX += baseRadius;
                }

                elements.push({x: centerX, y: centerY, i, j});
            }
        }

        // 表示する要素を下にあるものから描画（重なり順を正しくするため逆順）
        const elementsToRender = elements.slice(0, elementsToShow);
        elementsToRender.sort((a, b) => b.j - a.j); // j（行）の大きい順（下から上）にソート

        for (const element of elementsToRender) {
            let radiusW = baseRadius;
            let radiusH = baseRadius * (element.j % 2 === 0 ? 1 : 0.85);

            this.drawSeigaihaUnit(tex, element.x, element.y, radiusW, radiusH, 1.0);
        }
    }

    // 新しいパターン7: 爆発的に波が噴出する - 下にあるものほど手前に描画
    private drawBurstingPattern(tex: p5.Graphics, baseRadius: number, stepX: number, stepY: number, startY: number, beat: number): void {
    const cols = this.p.floor(tex.width / stepX) + 2;
    const centerCol = cols / 2;
    const burstProgress = (beat * 0.8) % 1;
    const maxRadius = cols;

        // 各列の最大行数を事前に計算
        const columnMaxRows: number[] = [];
        const maxOverallRows = this.p.floor((tex.height * 0.7) / stepY);
        
        for (let i = -1; i < cols; i++) {
            const distanceFromCenter = this.p.abs(i - centerCol);
            const shouldShow = distanceFromCenter <= burstProgress * maxRadius;
            
            if (shouldShow) {
                const columnHeight = (1 - distanceFromCenter / maxRadius) * burstProgress * tex.height * 0.7;
                columnMaxRows[i + 1] = this.p.floor(columnHeight / stepY);
            } else {
                columnMaxRows[i + 1] = -1;
            }
        }

        // 上から下に描画（下にあるものが後から描画されて手前に来る）
        for (let j = maxOverallRows; j >= 0; j--) {
            for (let i = -1; i < cols; i++) {
                const maxRows = columnMaxRows[i + 1];
                if (maxRows >= 0 && j <= maxRows) {
                    let centerX = i * stepX;
                    let centerY = startY - j * stepY;

                    let radiusW = baseRadius;
                    let radiusH = baseRadius * (j % 2 === 0 ? 1 : 0.85);

                    if (j % 2 === 1) {
                        centerX += baseRadius;
                    }

                    this.drawSeigaihaUnit(tex, centerX, centerY, radiusW, radiusH, 1.0);
                }
            }
        }
    }

    // 青海波の基本ユニット（波一つ）を描画するヘルパー関数
    // 新しいカラーパレットでは深い藍 (oceanDark) と鮮やかな青 (oceanLight) を交互に配置。
    private drawSeigaihaUnit(tex: p5.Graphics, centerX: number, centerY: number, radiusW: number, radiusH: number, _alpha: number): void {
        tex.push();
        tex.translate(centerX, centerY);

        // 内側から外側に向かって同心円弧を積み重ねていく
        for (let i = 0; i < this.ARC_SEGMENTS; i++) {
            const currentRadiusW = radiusW * (i + 1) / this.ARC_SEGMENTS;
            const currentRadiusH = radiusH * (i + 1) / this.ARC_SEGMENTS;
            const strokeThickness = this.p.max(radiusW, radiusH) / this.ARC_SEGMENTS;

            // 青海波の伝統的な色使い（青と白の交互）- 透明度は常に255（MAX）
            const baseColor = i % 2 === 0 
                ? ColorPalette.scenes.wave.oceanDark 
                : ColorPalette.scenes.wave.oceanLight;
            
            const segmentColor = this.p.color(baseColor);
            segmentColor.setAlpha(255); // 常に最大透明度

            tex.strokeCap(this.p.SQUARE);
            tex.stroke(segmentColor);
            tex.strokeWeight(strokeThickness);
            tex.noFill();

            // 弧自体は半円を描いて波の模様を構成する
            tex.arc(0, 0, currentRadiusW * 2, currentRadiusH * 2, this.p.PI, this.p.TWO_PI);
        }
        
        tex.pop();
    }
}