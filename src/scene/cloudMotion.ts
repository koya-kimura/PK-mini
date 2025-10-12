// --------------------------------------------------------------
// CloudMotion
// 風情ある和風雲を複数パターンで描画するシーンモジュール。
// シーケンサーの値に応じて 7 種のモーションを切り替える。
// --------------------------------------------------------------

import p5 from 'p5';
import { ColorPalette } from '../utils/colorPalette';
import { Easing } from '../utils/easing';

/**
 * 和風の雲アニメーションを管理するクラス
 * 7つの異なるシーケンスに対応した、控えめで上品な雲の動きを表現
 */
export class CloudMotion {
    private p: p5;
    private readonly CANVAS_TOP_RATIO = 0.4; // キャンバス上部40%の範囲で描画

    constructor(p: p5) {
        this.p = p;
    }

    /**
     * tex: SceneManager から渡される p5.Graphics。実際のフレーム合成前のバッファ。
     * sequenceValue: APC Mini から届くシーン番号。0 の場合は雲シーンを非表示。
     * currentBeat: BPMManager が供給する拍位置。小数部を easing や sin 波の進行に利用。
     */
    update(tex: p5.Graphics, sequenceValue: number, currentBeat: number): void {
        if (sequenceValue <= 0) {
            return;
        }

        // 1〜7 の値に応じてアニメーションを分岐。SceneManager 側のマッピングと同期している。
        switch (sequenceValue) {
            case 1:
                this.singleFloatingCloud(tex, currentBeat);
                break;
            case 2:
                this.gentleDrift(tex, currentBeat);
                break;
            case 3:
                this.layeredFlow(tex, currentBeat);
                break;
            case 4:
                this.crossingPaths(tex, currentBeat);
                break;
            case 5:
                this.wavyFormation(tex, currentBeat);
                break;
            case 6:
                this.circularMotion(tex, currentBeat);
                break;
            case 7:
                this.scatteredGather(tex, currentBeat);
                break;
        }
    }

    // シーケンス1: 単体の雲がゆっくりと浮遊
    private singleFloatingCloud(tex: p5.Graphics, beat: number): void {
    const centerX = tex.width * 0.5;
    const baseY = tex.height * this.CANVAS_TOP_RATIO * 0.6;
    const floatY = baseY + this.p.sin(beat * 0.5) * 20; // ゆっくり上下
        
        this.drawWafuCloud(tex, centerX, floatY, 120, 0.8);
    }

    // シーケンス2: 複数の雲が左右にゆったりと流れる
    private gentleDrift(tex: p5.Graphics, beat: number): void {
        const positions = [
            { x: 0.2, y: 0.3 },
            { x: 0.7, y: 0.2 },
            { x: 0.4, y: 0.35 }
        ];

        positions.forEach((pos, i) => {
            const baseX = tex.width * pos.x;
            const driftX = baseX + this.p.sin(beat * 0.3 + i * 2) * 30; // 位相ずらしで互い違いの揺れ
            const y = tex.height * this.CANVAS_TOP_RATIO * pos.y;
            
            this.drawWafuCloud(tex, driftX, y, 90, 0.7);
        });
    }

    // シーケンス3: 3層の雲が異なる速度で流れる
    private layeredFlow(tex: p5.Graphics, beat: number): void {
        const layers = [
            { y: 0.15, speed: 0.4, size: 75, alpha: 0.5 },
            { y: 0.25, speed: 0.6, size: 105, alpha: 0.7 },
            { y: 0.35, speed: 0.8, size: 135, alpha: 0.9 }
        ];

        layers.forEach((layer) => {
            const positions = 3;
            for (let j = 0; j < positions; j++) {
                const baseX = (tex.width / positions) * (j + 0.5);
                const flowX = baseX + (beat * layer.speed * 20) % tex.width;
                const x = flowX > tex.width ? flowX - tex.width : flowX; // 画面端を超えたら巻き戻す
                const y = tex.height * this.CANVAS_TOP_RATIO * layer.y;
                
                this.drawWafuCloud(tex, x, y, layer.size, layer.alpha);
            }
        });
    }

    // シーケンス4: 2つの雲が交差するように移動
    private crossingPaths(tex: p5.Graphics, beat: number): void {
    const progress = (beat * 0.3) % 1;
    const eased = Easing.easeInOutSine(progress); // クロス時は滑らかな往復
        
        // 左から右へ
        const cloud1X = this.p.lerp(tex.width * 0.1, tex.width * 0.9, eased);
        const cloud1Y = tex.height * this.CANVAS_TOP_RATIO * 0.2;
        
        // 右から左へ
        const cloud2X = this.p.lerp(tex.width * 0.9, tex.width * 0.1, eased);
        const cloud2Y = tex.height * this.CANVAS_TOP_RATIO * 0.3;
        
        this.drawWafuCloud(tex, cloud1X, cloud1Y, 105, 0.8);
        this.drawWafuCloud(tex, cloud2X, cloud2Y, 95, 0.7);
    }

    // シーケンス5: 波状の動きで雲が連なって流れる
    private wavyFormation(tex: p5.Graphics, beat: number): void {
        const cloudCount = 5;
        
        for (let i = 0; i < cloudCount; i++) {
            const baseX = (tex.width / cloudCount) * i;
            const waveX = baseX + this.p.sin(beat * 0.4 + i * 0.8) * 40;
            const waveY = tex.height * this.CANVAS_TOP_RATIO * (0.2 + this.p.sin(beat * 0.6 + i * 1.2) * 0.1);
            
            this.drawWafuCloud(tex, waveX, waveY, 85, 0.6 + i * 0.08);
        }
    }

    // シーケンス6: 円形の軌道で雲が回転
    private circularMotion(tex: p5.Graphics, beat: number): void {
        const centerX = tex.width * 0.5;
        const centerY = tex.height * this.CANVAS_TOP_RATIO * 0.3;
        const radius = 80;
        const cloudCount = 4;
        
        for (let i = 0; i < cloudCount; i++) {
            const angle = (beat * 0.2 + (i / cloudCount) * this.p.TWO_PI) % this.p.TWO_PI;
            const x = centerX + this.p.cos(angle) * radius;
            const y = centerY + this.p.sin(angle) * radius * 0.5; // 楕円形に
            
            this.drawWafuCloud(tex, x, y, 75, 0.7);
        }
    }

    // シーケンス7: 散らばった雲が集まったり離れたりする
    private scatteredGather(tex: p5.Graphics, beat: number): void {
    const progress = (beat * 0.25) % 2; // 2ビートで1サイクル
    const gathering = progress < 1 ? progress : 2 - progress; // 集まる→離れるを三角波で表現
    const eased = Easing.easeInOutQuad(gathering);
        
        const centerX = tex.width * 0.5;
        const centerY = tex.height * this.CANVAS_TOP_RATIO * 0.3;
        
        const positions = [
            { x: 0.2, y: 0.1 },
            { x: 0.8, y: 0.15 },
            { x: 0.1, y: 0.35 },
            { x: 0.9, y: 0.25 },
            { x: 0.5, y: 0.1 }
        ];
        
        positions.forEach((pos) => {
            const targetX = tex.width * pos.x;
            const targetY = tex.height * this.CANVAS_TOP_RATIO * pos.y;
            
            const x = this.p.lerp(targetX, centerX, eased);
            const y = this.p.lerp(targetY, centerY, eased);
            
            this.drawWafuCloud(tex, x, y, 80, 0.6 + eased * 0.3);
        });
    }

    // 和風の雲を描画するヘルパーメソッド
    /**
     * 和風雲の描画。縦方向に連なる矩形で花びら状のシルエットを構成する。
     * size は全体ボリュームの基準。alpha は 0〜1。
     */
    private drawWafuCloud(tex: p5.Graphics, x: number, y: number, size: number, alpha: number): void {
        tex.push();
        tex.translate(x, y);
        tex.noStroke();
        
        const cloudColor = this.p.color(ColorPalette.scenes.cloud.base);
        cloudColor.setAlpha(alpha * 255);
        tex.fill(cloudColor);
        
        // 和風雲の形状：縦に連なる角丸四角形
        const segments = 3;
        const segmentHeight = size * 0.35;
        const baseWidth = size * 3.2; // 0.9から3.2に変更（約3.5倍）
        
        for (let i = 0; i < segments; i++) {
            // 各セグメントが接するように配置（重なりを避ける）
            const segmentY = (i - 1) * segmentHeight; // 0.7を1.0に変更してピッタリ接する
            const segmentWidth = baseWidth * (1 - i * 0.12); // 上に行くほど少し小さく
            const offsetX = (i % 2 === 0 ? 1 : -1) * size * 0.08; // 左右のずらしを少し小さく
            
            const cornerRadius = segmentHeight * 0.4; // 角丸を少し小さく
            tex.rect(offsetX, segmentY, segmentWidth, segmentHeight, cornerRadius);
        }
        
        tex.pop();
    }
}