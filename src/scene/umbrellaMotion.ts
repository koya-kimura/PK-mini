// --------------------------------------------------------------
// UmbrellaMotion
// 和傘を動的に生成・更新するシーン。複数パターンをビート同期で演出する。
// 傘1本ごとに Umbrella インスタンスを持ち、寿命やアニメーションを管理。
// --------------------------------------------------------------

import p5 from 'p5';
import { ColorPalette } from '../utils/colorPalette';
import { easeInOutCubic, easeOutBack } from '../utils/easing';

type UmbrellaPalette = typeof ColorPalette.scenes.umbrella;

// 傘の生成オプション型を外部に定義
interface UmbrellaOptions {
    x?: number;
    y?: number;
    vx?: number;
    vy?: number;
    targetScale?: number;
    initialRadius?: number;
    prioritized?: boolean;
    stationary?: boolean;
}

/**
 * 傘の動き全体を管理するクラス。
 * ビートに合わせて新しい傘を生成し、描画を更新します。
 */
export class UmbrellaMotion {
    private p: p5;
    private umbrellas: Umbrella[];
    private lastBeatFloor: number;
    private readonly palette: UmbrellaPalette;

    constructor(p: p5, palette: UmbrellaPalette) {
        this.p = p;
        this.palette = palette;
        this.umbrellas = [];
        this.lastBeatFloor = -1;
    }

    /**
     * 現在のシーケンス値とビート番号から、生成する傘のパラメーターセットを返す。
     * 1 本のみ／行列／リング配置など、ライブ中の選択肢をここで一元管理する。
     */
    private createSequenceSpawns(beatFloor: number, sequenceValue: number): UmbrellaOptions[] {
        const p = this.p;
        const w = p.width;
        const h = p.height;
        const minSize = Math.min(w, h);

        switch (sequenceValue) {
            case 0:
                return [];
            case 1:
                return [
                    {
                        x: w * 0.5,
                        y: h * 0.58,
                        targetScale: 1.8,
                        initialRadius: minSize * 0.12,
                        prioritized: true,
                        stationary: true
                    }
                ];
            case 2: {
                const results: UmbrellaOptions[] = [];
                const spacing = w * 0.14;
                const baseX = w * 0.5;
                const baseY = h * 0.68;
                for (let offset = -2; offset <= 2; offset++) {
                    results.push({
                        x: baseX + offset * spacing,
                        y: baseY + (Math.abs(offset) % 2 === 0 ? 0 : h * 0.025),
                        targetScale: 1.0,
                        initialRadius: minSize * 0.075,
                        stationary: true
                    });
                }
                return results;
            }
            case 3:
                return [
                    {
                        x: -0.15 * w,
                        y: h * 0.48,
                        vx: 0.42,
                        vy: -0.05,
                        targetScale: 1.2,
                        initialRadius: minSize * 0.09,
                        prioritized: true
                    }
                ];
            case 4:
                return [
                    {
                        x: -0.12 * w,
                        y: h * 0.58,
                        vx: 0.42,
                        vy: -0.04,
                        targetScale: 1.3,
                        initialRadius: minSize * 0.085
                    },
                    {
                        x: w * 1.12,
                        y: h * 0.52,
                        vx: -0.42,
                        vy: -0.06,
                        targetScale: 1.3,
                        initialRadius: minSize * 0.085
                    }
                ];
            case 5: {
                const results: UmbrellaOptions[] = [];
                const spawnCount = 4 + (beatFloor % 3); // 4〜6 本出現
                for (let i = 0; i < spawnCount; i++) {
                    const phase = beatFloor * 0.47 + i * 0.73;
                    const fromLeft = ((beatFloor + i) % 2 === 0);
                    const yNorm = 0.5 + 0.35 * ((Math.sin(phase) + 1) / 2);
                    const speedNorm = 0.42 + 0.18 * ((Math.cos(phase) + 1) / 2);
                    const vy = -0.08 + 0.1 * Math.sin(phase * 1.31);
                    const scale = 0.95 + 0.3 * ((Math.sin(phase * 0.8) + 1) / 2);
                    const radiusRatio = 0.055 + 0.04 * ((Math.cos(phase * 1.17) + 1) / 2);

                    results.push({
                        x: fromLeft ? -0.16 * w : w * 1.16,
                        y: h * yNorm,
                        vx: fromLeft ? speedNorm : -speedNorm,
                        vy,
                        targetScale: scale,
                        initialRadius: minSize * radiusRatio
                    });
                }
                return results;
            }
            case 6:
                return [
                    {
                        x: -0.12 * w,
                        y: h * 0.94,
                        vx: 0.38,
                        vy: -0.46,
                        targetScale: 1.25,
                        initialRadius: minSize * 0.09,
                        prioritized: true
                    },
                    {
                        x: w * 1.12,
                        y: h * 0.94,
                        vx: -0.38,
                        vy: -0.46,
                        targetScale: 1.25,
                        initialRadius: minSize * 0.09,
                        prioritized: true
                    },
                    {
                        x: w * 0.2,
                        y: h * 0.96,
                        vx: 0.24,
                        vy: -0.42,
                        targetScale: 1.05,
                        initialRadius: minSize * 0.08
                    },
                    {
                        x: w * 0.8,
                        y: h * 0.96,
                        vx: -0.24,
                        vy: -0.42,
                        targetScale: 1.05,
                        initialRadius: minSize * 0.08
                    }
                ];
            case 7: {
                const results: UmbrellaOptions[] = [
                    {
                        x: w * 0.5,
                        y: h * 0.5,
                        targetScale: 2.1,
                        initialRadius: minSize * 0.13,
                        prioritized: true,
                        stationary: true
                    }
                ];
                const ringCount = 6;
                const radius = minSize * 0.22;
                const baseY = h * 0.58;
                for (let i = 0; i < ringCount; i++) {
                    const angle = (p.TWO_PI * i) / ringCount;
                    const posX = w * 0.5 + Math.cos(angle) * radius;
                    const posY = baseY + Math.sin(angle) * radius * 0.6;
                    const velocityScale = 0.32;
                    results.push({
                        x: posX,
                        y: posY,
                        vx: Math.cos(angle) * velocityScale,
                        vy: Math.sin(angle) * velocityScale - 0.18,
                        targetScale: 0.95,
                        initialRadius: minSize * 0.07
                    });
                }
                return results;
            }
            default:
                return [];
        }
    }

    /**
     * SceneManager から呼び出されるメインループ。傘の生成/更新/描画までを一括で面倒見る。
     * tex: メインフレームにブレンドされる p5.Graphics。
     * sequenceValue: APC 側で選択されたモーション番号。
     * currentBeat: BPMManager の経過拍。整数部でタイミング、少数部で進行度を扱う。
     */
    update(tex: p5.Graphics, sequenceValue: number, currentBeat: number): void {
        const p = this.p;
        const shouldGenerateNewUmbrella = sequenceValue > 0;
        const beatFloor = p.floor(currentBeat);

        if (this.lastBeatFloor !== beatFloor && shouldGenerateNewUmbrella) {
            // 1 拍ごとの立ち上がりでスポーン情報を生成し、配列に積む。
            const spawns = this.createSequenceSpawns(beatFloor, sequenceValue);
            for (const opts of spawns) {
                this.umbrellas.push(new Umbrella(p, currentBeat, sequenceValue, this.palette, opts));
            }
        }

        const nextUmbrellas: Umbrella[] = [];
        for (const umbrella of this.umbrellas) {
            umbrella.update(currentBeat);
            if (umbrella.isAlive) {
                nextUmbrellas.push(umbrella);
            }
        }
        this.umbrellas = nextUmbrellas;

        if (sequenceValue > 0) {
            // `_priority` フラグ付きの傘は前面に描画したいので 2 パスに分ける。
            const normal = this.umbrellas.filter(u => !u['_priority']);
            const priority = this.umbrellas.filter(u => u['_priority']);
            for (const umbrella of normal) umbrella.draw(tex, sequenceValue);
            for (const umbrella of priority) umbrella.draw(tex, sequenceValue);
        }

        this.lastBeatFloor = beatFloor;
    }
}

/**
 * 個々の傘のオブジェクトを管理するクラス。
 */
export class Umbrella {
    private p: p5;
    private positionX: number;
    private positionY: number;
    private radius: number;
    private segmentCount: number;
    private drawnSegments: number;
    private angle: number;
    private startBeat: number;
    public isAlive: boolean;
    private alpha: number;
    private scaleFactor: number;
    private readonly sequenceValue: number;
    private readonly palette: UmbrellaPalette;

    private initialX: number;
    private initialY: number;
    private vx: number;
    private vy: number;
    private targetScale: number;
    private readonly DURATION_TOTAL = 2.4;
    private readonly DURATION_APPEARANCE = this.DURATION_TOTAL * 0.25;
    private readonly DURATION_SEGMENT_DRAW = this.DURATION_TOTAL * 0.5;

    ['_priority']?: boolean;

    private scaleX: number; // 横方向のスケール
    private scaleY: number; // 縦方向のスケール
    private primaryColor: string;
    private secondaryColor: string;
    private outlineColor: string;
    private ribsColor: string;
    private hubColor: string;
    private highlightColor: string;
    private handleColor: string;
    private stationary: boolean;

    constructor(p: p5, startBeat: number, sequenceValue: number, palette: UmbrellaPalette, opts: UmbrellaOptions = {}) {
        this.p = p;
        this.sequenceValue = sequenceValue;
        this.palette = palette;

        const w = p.width, h = p.height;
        this.positionX = opts.x ?? p.random(w);
        this.positionY = opts.y ?? p.random(h * 0.6, h * 0.9);
        this.initialX = this.positionX;
        this.initialY = this.positionY;
        this.vx = opts.vx ?? 0;
        this.vy = opts.vy ?? 0;
        this.stationary = opts.stationary ?? false;

        if (!this.stationary && this.vx === 0 && this.vy === 0) {
            this.vx = p.random(-0.5, -0.2);
            this.vy = p.random(-0.25, -0.08);
        }

        this.radius = opts.initialRadius ?? p.min(w, h) * p.random(0.05, 0.1) * (sequenceValue <= 2 ? 0.8 : 1.0);
        this.segmentCount = sequenceValue <= 2 ? 4 : sequenceValue <= 4 ? 8 : p.floor(p.random(10, 16));
        this.drawnSegments = 0;
        this.angle = p.random(p.TAU);
        this.alpha = 255;
        this.scaleFactor = 0.6;
        this.targetScale = opts.targetScale ?? (sequenceValue >= 6 ? 1.5 : 1.2);
        this.startBeat = startBeat;
        this.isAlive = true;

        this.scaleX = 1; // 初期スケール
        this.scaleY = 1; // 初期スケール

        // カラーパレットからベース/アクセント色を抽選。白が含まれていればハイライトにも活用。
        const allowedColors = [...this.palette.allowed];
        if (allowedColors.length === 0) {
            allowedColors.push('#FFFFFF');
        }

        const WHITE_HEX = '#FFFFFF';
        const hasWhite = allowedColors.some((c) => c.toUpperCase() === WHITE_HEX);

        if (this.sequenceValue <= 3) {
            // 円のみのシーケンスはガチャポン風に 1 色 + 白で構成
            const accentCandidates = allowedColors.filter((c) => c.toUpperCase() !== WHITE_HEX);
            const accentColor = accentCandidates.length > 0 ? p.random(accentCandidates) : allowedColors[0];

            this.primaryColor = accentColor;
            this.secondaryColor = WHITE_HEX;
            this.outlineColor = accentColor;
            this.ribsColor = WHITE_HEX;
            this.hubColor = WHITE_HEX;
            this.highlightColor = accentColor;
            this.handleColor = WHITE_HEX;
        } else {
            if (allowedColors.length === 1) {
                allowedColors.push(allowedColors[0]);
            }
            const shuffled = p.shuffle(allowedColors);
            this.primaryColor = shuffled[0];
            this.secondaryColor = shuffled[1 % shuffled.length];
            if (this.primaryColor === this.secondaryColor && allowedColors.length > 1) {
                const alternative = allowedColors.find((c) => c !== this.primaryColor);
                if (alternative) {
                    this.secondaryColor = alternative;
                }
            }

            this.outlineColor = this.primaryColor;
            this.ribsColor = this.secondaryColor;
            this.hubColor = hasWhite ? WHITE_HEX : this.secondaryColor;
            this.highlightColor = this.secondaryColor;
            this.handleColor = hasWhite ? WHITE_HEX : this.primaryColor;
        }

        if (opts.prioritized) {
            this['_priority'] = true;
        }
    }

    /**
     * 傘インスタンス 1 本分の状態を進める。寿命管理・位置移動・段階的な描画フェーズなどを制御。
     */
    update(currentBeat: number): void {
        const p = this.p;
        const timeElapsed = currentBeat - this.startBeat;
        const tTotal = p.min(timeElapsed, this.DURATION_TOTAL) / this.DURATION_TOTAL;
        const tAppear = p.min(timeElapsed, this.DURATION_APPEARANCE) / this.DURATION_APPEARANCE;

        // tSeg を定義（セグメント描画の進行度）
        const tSeg = p.min(timeElapsed, this.DURATION_SEGMENT_DRAW) / this.DURATION_SEGMENT_DRAW;

        const fadeInNorm = p.constrain(timeElapsed / this.DURATION_APPEARANCE, 0, 1);
        const fadeOutStart = this.DURATION_TOTAL * 0.7;
        const fadeOutNorm = timeElapsed <= fadeOutStart
            ? 0
            : p.constrain((timeElapsed - fadeOutStart) / (this.DURATION_TOTAL - fadeOutStart), 0, 1);
        const fadeInFactor = 1 - p.pow(1 - fadeInNorm, 2.1);
        const fadeOutFactor = p.pow(1 - fadeOutNorm, 2.2);
        const alphaFactor = p.constrain(fadeInFactor * fadeOutFactor, 0, 1);
        this.alpha = 255 * alphaFactor;

        const easedScale = easeOutBack(tAppear * 0.95, 1.2);
        this.scaleFactor = p.map(easedScale, 0, 1, 0.6, this.targetScale);

        this.scaleX = this.scaleFactor;
        this.scaleY = this.scaleFactor;

        // 進行方向に応じたスケールの変化
        const hasVelocity = this.vx !== 0 || this.vy !== 0;
        if (hasVelocity && !this.stationary) {
            const directionFactor = p.atan2(this.vy, this.vx); // 進行方向の角度
            const scaleVariation = p.sin(tTotal * p.TWO_PI * 2); // スケールの振動
            this.scaleX = this.scaleFactor * (1 + 0.1 * scaleVariation * p.cos(directionFactor));
            this.scaleY = this.scaleFactor * (1 + 0.1 * scaleVariation * p.sin(directionFactor));
        }

        // easedSeg を計算して描画セグメント数を更新
        const easedSeg = easeInOutCubic(tSeg);
        this.drawnSegments = Math.max(0, Math.min(this.segmentCount, Math.floor(easedSeg * this.segmentCount)));

        if (this.sequenceValue >= 3) {
            const rotBase = this.sequenceValue >= 5 ? 1.0 : 0.5;
            const easedRot = easeInOutCubic(tTotal);
            this.angle += p.TWO_PI * 0.08 * rotBase * easedRot;
        }

        if (!this.stationary && hasVelocity) {
            // 初期位置から速度成分を積分し、フレーム単位で追従させる。
            this.positionX = this.initialX + this.vx * timeElapsed * p.width;
            this.positionY = this.initialY + this.vy * timeElapsed * p.height;
        }

        if (!this.stationary && (this.positionX < -p.width * 0.3 || this.positionY < -p.height * 0.4)) {
            this.isAlive = false;
        }

        if (timeElapsed >= this.DURATION_TOTAL) {
            this.isAlive = false;
        }
    }

    /**
     * render パス。優先描画順のため UmbrellaMotion 側で複数回呼ばれることを想定。
     */
    draw(tex: p5.Graphics, sequenceValue: number): void {
        if (!this.isAlive) return;

        tex.push();
        this.drawUmbrella(tex, this.positionX, this.positionY, this.radius, sequenceValue);
        if (sequenceValue >= 4) {
            this.drawHandle(tex, this.positionX, this.positionY, this.radius, sequenceValue);
        }
        tex.pop();
    }

    /**
     * 和傘の柄部分を描画。シーケンス 4 以降で出現させ、5 以上で鉤先を追加。
     */
    private drawHandle(tex: p5.Graphics, x: number, y: number, r: number, sequenceValue: number): void {
        const p = this.p;
        const handleColor = p.color(this.handleColor);
        handleColor.setAlpha(this.alpha);

        tex.push();
        tex.translate(x, y);
        tex.scale(this.scaleFactor);

        const handleLength = r * 1.5;
        const handleThickness = r * 0.05;
        const hookRadius = r * 0.3;

        tex.strokeWeight(handleThickness);

        if (sequenceValue >= 5) {
            tex.stroke(handleColor);
            tex.line(0, 0, 0, handleLength);
            tex.noFill();
            // U 字フックは右方向に開く。PI〜TWO_PI+HALF_PI まで回し込んで末端を作る。
            tex.arc(hookRadius, handleLength, hookRadius * 2, hookRadius * 2, p.PI, p.TWO_PI + p.HALF_PI);
        } else if (sequenceValue >= 4) {
            tex.stroke(handleColor);
            tex.line(0, 0, 0, handleLength);
        }

        tex.pop();
    }

    /**
     * 傘の天幕部分の描画。シーケンス番号に応じて配色や線装飾を増やしていく。
     */
    private drawUmbrella(tex: p5.Graphics, x: number, y: number, r: number, sequenceValue: number): void {
        const p = this.p;

        tex.push();
        tex.translate(x, y);
        tex.rotate(this.angle);
        tex.scale(this.scaleX, this.scaleY); // 縦横スケールを適用

        if (sequenceValue <= 3) {
            // シーケンスナンバー 1~3: 2 色で構成された半円を描画
            const primaryColor = p.color(this.primaryColor);
            const secondaryColor = p.color(this.secondaryColor);
            primaryColor.setAlpha(this.alpha);
            secondaryColor.setAlpha(this.alpha);
            tex.noStroke();
            tex.fill(primaryColor);
            tex.arc(0, 0, r * 2, r * 2, -p.HALF_PI, p.HALF_PI, p.PIE);
            tex.fill(secondaryColor);
            tex.arc(0, 0, r * 2, r * 2, p.HALF_PI, p.HALF_PI + p.PI, p.PIE);
        } else {
            const totalSegments = this.segmentCount;
            const segmentAngle = p.TAU / totalSegments;
            const centerCircleRadius = r * 0.1;
            const outerLineLength = r * 1.05;
            const strokeW = r * 0.04 * (sequenceValue <= 2 ? 1.5 : 1);

            for (let i = 0; i < totalSegments; i++) {
                // `drawnSegments` はアニメーションで徐々に増える本数。未達分はスキップ。
                if (i > this.drawnSegments) {
                    continue;
                }

                const currentAngle = p.TAU * i / totalSegments;
                const nextAngle = currentAngle + segmentAngle;

                const segmentHex = (i % 2 === 0) ? this.primaryColor : this.secondaryColor;

                const umbrellaColor = p.color(segmentHex);
                umbrellaColor.setAlpha(this.alpha);

                const outlineColor = p.color(this.outlineColor);
                outlineColor.setAlpha(this.alpha);
                tex.stroke(outlineColor);
                tex.strokeCap(p.SQUARE);
                tex.fill(umbrellaColor);
                tex.strokeWeight(strokeW);

                if (sequenceValue <= 1) {
                    tex.arc(0, 0, r * 2, r * 2, currentAngle, nextAngle, p.CHORD);
                } else {
                    tex.arc(0, 0, r * 2, r * 2, currentAngle, nextAngle);
                }

                 if (sequenceValue >= 2) {
                    const ribColor = p.color(this.ribsColor);
                    ribColor.setAlpha(this.alpha);
                    tex.stroke(ribColor);
                    tex.strokeWeight(strokeW * 0.5);
                    tex.line(0, 0, p.cos(currentAngle) * outerLineLength, p.sin(currentAngle) * outerLineLength);
                }

                if (sequenceValue >= 4) {
                    const hubColor = p.color(this.hubColor);
                    hubColor.setAlpha(this.alpha);
                    tex.fill(hubColor);
                    tex.noStroke();
                    tex.arc(0, 0, centerCircleRadius * 2, centerCircleRadius * 2, currentAngle, nextAngle);
                }
            }

            if (sequenceValue === 7) {
                // フィナーレ用の光輪。外周に薄いハイライトを一周させる。
                const highlightColor = p.color(this.highlightColor);
                highlightColor.setAlpha(this.alpha);
                tex.stroke(highlightColor);
                tex.strokeWeight(r * 0.02);
                tex.noFill();
                tex.arc(0, 0, r * 2 * 1.1, r * 2 * 1.1, 0, p.TAU);
            }
        }

        tex.pop();
    }
}