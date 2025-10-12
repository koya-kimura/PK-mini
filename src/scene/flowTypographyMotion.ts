// --------------------------------------------------------------
// FlowTypographyMotion
// 「FLOW」「FOW」の単語を全画面でモーションタイポに展開するシーン。
// シーケンサーの行ごとに 7 つの演出パターンを切り替える。
// --------------------------------------------------------------

import p5 from 'p5';
import { Easing } from '../utils/easing';
import { ColorPalette } from '../utils/colorPalette';

interface WordStyle {
    fill: string;
    stroke?: string;
    strokeWeight?: number;
    alpha?: number;
}

interface DrawOptions {
    angle?: number;
    scale?: number;
    shearX?: number;
    shearY?: number;
    tracking?: number;
    style?: WordStyle;
}

interface ColorScheme {
    background: string;
    primary: string;
    secondary: string;
    highlight: string;
    shadow: string;
}

// 表示に使う語彙セット。交互に配置してリズムを付ける。
const WORDS = ['FLOW', 'FOW'];

export class FlowTypographyMotion {
    private readonly p: p5;
    private readonly allowedColors = ColorPalette.scenes.flowText.allowed;
    private currentScheme: ColorScheme;

    constructor(p: p5) {
        this.p = p;
        this.currentScheme = this.generateColorScheme(0, 0);
    }

    /**
     * シーケンサー値に応じて 7 種のタイポ演出のいずれかを描画する。
     * tex: SceneManager が持つ p5.Graphics。
     * sequenceValue: APC から届く行番号 (0 なら非表示)。
     * beat: BPMManager からの経過拍。整数部でカラーパレットを変化させ、小数部でアニメを進める。
     * 触る場合は WORDS 配列と各パターンが参照するカラーパレットの整合性に注意。
     */
    update(tex: p5.Graphics, sequenceValue: number, beat: number): void {
        if (sequenceValue <= 0) {
            return;
        }

        const p = this.p;
        const beatFloor = p.floor(beat);
        const beatFrac = beat - beatFloor;
        const minDim = Math.min(tex.width, tex.height);
        // ビートとシーケンスの組み合わせで配色をシャッフル。演出切り替え時に雰囲気が変わる。
        const scheme = this.generateColorScheme(sequenceValue, beat);
        this.currentScheme = scheme;

        tex.push();
        tex.clear();
        tex.background(scheme.background);
        tex.textAlign(p.CENTER, p.CENTER);
        tex.textFont('sans-serif');
        tex.textStyle(p.BOLD);

        switch (sequenceValue) {
            case 1:
                this.centralPulse(tex, beat, beatFrac, minDim, scheme);
                break;
            case 2:
                this.stackedSlide(tex, beat, beatFrac, minDim, scheme);
                break;
            case 3:
                this.orbitalGlyphs(tex, beat, beatFrac, minDim, scheme);
                break;
            case 4:
                this.mirrorWave(tex, beat, beatFrac, minDim, scheme);
                break;
            case 5:
                this.glitchSweep(tex, beat, beatFrac, minDim, scheme);
                break;
            case 6:
                this.ribbonStream(tex, beat, minDim, scheme);
                break;
            case 7:
                this.spiralBloom(tex, beat, beatFrac, minDim, scheme);
                break;
            default:
                this.centralPulse(tex, beat, beatFrac, minDim, scheme);
                break;
        }

        tex.pop();
    }

    // パターン1: 中央で脈動し、残像を重ねるタイプ
    private centralPulse(tex: p5.Graphics, beat: number, beatFrac: number, minDim: number, scheme: ColorScheme): void {
    const pulse = Easing.easeOutExpo(beatFrac); // 拍頭で膨らみ、終端でゆっくり戻る
        const baseSize = minDim * 0.55;
        const scale = 0.85 + pulse * 0.35;
        const rotation = Math.sin(beat * 0.5) * 0.08;

        this.drawGradientBackground(tex, scheme.primary, scheme.shadow, 0.35);

        this.drawWord(tex, 'FLOW', tex.width / 2, tex.height / 2, baseSize, {
            angle: rotation,
            scale,
            style: {
                fill: scheme.primary,
                stroke: scheme.highlight,
                strokeWeight: minDim * 0.02,
            },
        });

        const echoCount = 3;
        for (let i = 1; i <= echoCount; i++) {
            const echoScale = scale * (1 + i * 0.08);
            const alpha = 160 - i * 40;
            // 遅延したゴーストを重ねて脈動の余韻を演出。
            this.drawWord(tex, 'FOW', tex.width / 2, tex.height / 2, baseSize, {
                angle: rotation + i * 0.03,
                scale: echoScale,
                style: {
                    fill: scheme.secondary,
                    alpha,
                },
            });
        }
    }

    // パターン2: 行ごとにスライドするストライプ状レイアウト
    private stackedSlide(tex: p5.Graphics, beat: number, beatFrac: number, minDim: number, scheme: ColorScheme): void {
    const rows = 5;
        const textSize = minDim * 0.28;
        const slide = Math.sin(beat * 0.9) * tex.width * 0.18;
        const drift = Easing.easeInOutSine((beatFrac + 0.25) % 1) * tex.height * 0.12;

        for (let i = -1; i <= rows + 1; i++) {
            const y = tex.height / 2 + (i - rows / 2) * (textSize * 0.6) + drift * (i % 2 === 0 ? 1 : -1);
            const wordIndex = Math.abs(i) % WORDS.length;
            const x = tex.width / 2 + slide * (i % 2 === 0 ? 1 : -1);
            const fill = i % 2 === 0 ? scheme.primary : scheme.secondary;
            const alpha = 220 - Math.abs(i - rows / 2) * 35;

            // 奇数行で向きを反転させることで布地のような流れを演出。
            this.drawWord(tex, WORDS[wordIndex], x, y, textSize, {
                shearX: Math.sin(beat * 0.6 + i) * 0.2,
                style: {
                    fill,
                    alpha,
                },
            });
        }
    }

    // パターン3: 単語が周回軌道を描くプラネット風演出
    private orbitalGlyphs(tex: p5.Graphics, beat: number, beatFrac: number, minDim: number, scheme: ColorScheme): void {
    const p = this.p;
        const count = 8;
        const radius = minDim * (0.25 + 0.1 * Math.sin(beat * 0.7));
        const centerX = tex.width / 2;
        const centerY = tex.height / 2;
        const textSize = minDim * 0.22;
        const beatFloor = Math.floor(beat);

        for (let i = 0; i < count; i++) {
            const angle = beat * 0.4 + (p.TWO_PI / count) * i;
            const x = centerX + Math.cos(angle) * radius;
            const y = centerY + Math.sin(angle) * radius * 0.7;
            const word = WORDS[(i + beatFloor) % WORDS.length];
            const offsetAngle = angle + Math.sin(beat * 0.8 + i) * 0.3;

            // 軌道上で僅かに回転させて惑星の自転っぽさを加える。
            this.drawWord(tex, word, x, y, textSize, {
                angle: offsetAngle + p.HALF_PI,
                scale: 0.9 + 0.1 * Math.sin(beat * 1.2 + i),
                style: {
                    fill: i % 2 === 0 ? scheme.highlight : scheme.primary,
                    stroke: scheme.secondary,
                    strokeWeight: minDim * 0.008,
                },
            });
        }

        const innerPulse = 0.5 + 0.5 * Easing.easeInOutSine(beatFrac);
        this.drawWord(tex, 'FLOW', centerX, centerY, minDim * 0.4, {
            scale: innerPulse,
            style: {
                fill: scheme.secondary,
                alpha: 160,
            },
        });
    }

    // パターン4: 上下の単語を鏡写しに並べ、中央に波線を描画
    private mirrorWave(tex: p5.Graphics, beat: number, beatFrac: number, minDim: number, scheme: ColorScheme): void {
    const p = this.p;
        const baseSize = minDim * 0.3;
        const waveHeight = minDim * 0.08;
        const skew = Math.sin(beat * 0.6) * 0.25;

        const words = ['FLOW', 'FOW'];
        words.forEach((word, index) => {
            const direction = index === 0 ? 1 : -1;
            const y = tex.height / 2 + direction * minDim * 0.22;
            const shear = skew * direction;
            const color = index === 0 ? scheme.primary : scheme.highlight;

            this.drawWord(tex, word, tex.width / 2, y, baseSize, {
                shearX: shear,
                angle: direction * 0.02 * Math.sin(beat * 1.1),
                style: {
                    fill: color,
                    stroke: scheme.shadow,
                    strokeWeight: minDim * 0.01,
                },
            });
        });

        const bridgeCount = 24;
        const bridgeWidth = tex.width / bridgeCount;
        const bridgeBaseY = tex.height / 2;

        tex.push();
        tex.stroke(scheme.secondary);
        tex.noFill();
        tex.strokeWeight(minDim * 0.005);

        let prevX = 0;
        let prevY = bridgeBaseY;
        // サンプル点を細かく結び、波打つ橋を作成。
        for (let i = 0; i <= bridgeCount; i++) {
            const x = i * bridgeWidth;
            const t = i / bridgeCount + beatFrac;
            const y = bridgeBaseY + Math.sin(t * p.TWO_PI + beat * 0.8) * waveHeight;
            if (i > 0) {
                tex.line(prevX, prevY, x, y);
            }
            prevX = x;
            prevY = y;
        }
        tex.pop();
    }

    // パターン5: グリッチ風に複数枚を重ねる演出
    private glitchSweep(tex: p5.Graphics, beat: number, beatFrac: number, minDim: number, scheme: ColorScheme): void {
        const p = this.p;
        const baseSize = minDim * 0.42;
        const shake = Easing.easeOutExpo(beatFrac);
    const seed = Math.floor(beat * 13); // ビートごとに乱数テーブルを切り替える

        p.randomSeed(seed);

        for (let i = 0; i < 6; i++) {
            const jitterX = (p.random() - 0.5) * minDim * 0.08 * shake;
            const jitterY = (p.random() - 0.5) * minDim * 0.08 * shake;
            const skew = (p.random() - 0.5) * 0.4 * shake;
            const alpha = 220 - i * 30;
            const fill = i % 2 === 0 ? scheme.primary : scheme.highlight;

            // ランダムなジッターを加えてグリッチ感を演出。seed を固定して拍内で揺れを保つ。
            this.drawWord(tex, 'FLOW', tex.width / 2 + jitterX, tex.height / 2 + jitterY, baseSize, {
                shearX: skew,
                angle: (p.random() - 0.5) * 0.12 * shake,
                style: {
                    fill,
                    alpha,
                },
            });
        }

        tex.push();
        tex.stroke(scheme.secondary);
        tex.noFill();
        tex.strokeWeight(minDim * 0.01);

        const lineCount = 9;
        for (let i = 0; i < lineCount; i++) {
            const y = tex.height * (0.2 + 0.6 * (i / (lineCount - 1)));
            const offset = (p.random() - 0.5) * minDim * 0.1 * shake;
            // リード線の上下に揺らぎを入れて VHS 的な走査線に。
            tex.line(0, y + offset, tex.width, y - offset);
        }
        tex.pop();
    }

    // パターン6: 流れるリボン上を移動させる
    private ribbonStream(tex: p5.Graphics, beat: number, minDim: number, scheme: ColorScheme): void {
        const p = this.p;
        const segments = 12;
        const textSize = minDim * 0.22;
    const pathRadius = minDim * (0.2 + 0.05 * Math.sin(beat * 0.7)); // 緩やかに膨張する半径

        for (let i = 0; i < segments; i++) {
            const t = (i / segments + beat * 0.12) % 1;
            const angle = p.TWO_PI * t;
            const x = tex.width / 2 + Math.cos(angle) * pathRadius * (1 + 0.35 * Math.sin(beat * 0.9 + i));
            const y = tex.height / 2 + Math.sin(angle) * pathRadius * (1 + 0.25 * Math.cos(beat * 0.6 + i));
            const word = WORDS[i % WORDS.length];
            const size = textSize * (0.6 + 0.4 * Math.sin(angle * 2 + beat));
            const color = i % 3 === 0 ? scheme.highlight : i % 3 === 1 ? scheme.primary : scheme.secondary;

            // リボンに沿って文字が回り込む。角度 + HALF_PI で接線方向を維持。
            this.drawWord(tex, word, x, y, size, {
                angle: angle + p.HALF_PI,
                style: {
                    fill: color,
                    alpha: 200,
                },
            });
        }
    }

    // パターン7: 螺旋状に花が咲くよう展開
    private spiralBloom(tex: p5.Graphics, beat: number, _beatFrac: number, minDim: number, scheme: ColorScheme): void {
        const p = this.p;
        const layers = 18;
        const maxRadius = minDim * 0.45;
        const baseSize = minDim * 0.16;
        const centerX = tex.width / 2;
        const centerY = tex.height / 2;

        for (let i = 0; i < layers; i++) {
            const t = i / layers;
            const radius = t * maxRadius;
            const angle = beat * 0.5 + t * p.TWO_PI * 2;
            const x = centerX + Math.cos(angle) * radius;
            const y = centerY + Math.sin(angle) * radius;
            const size = baseSize * (0.8 + 0.6 * (1 - t));
            const word = WORDS[(i + Math.floor(beat)) % WORDS.length];
            const alpha = 90 + 160 * (1 - t);

            // 外周に行くほどサイズとアルファを落とし、花弁が広がる印象を作る。
            this.drawWord(tex, word, x, y, size, {
                angle,
                scale: 0.9 + 0.3 * (1 - t),
                style: {
                    fill: i % 2 === 0 ? scheme.primary : scheme.secondary,
                    alpha,
                },
            });
        }

        // 中央に太めのコアを置いて螺旋の収束点を明確化。
        this.drawWord(tex, 'FLOW', centerX, centerY, baseSize * 1.8, {
            angle: Math.sin(beat * 0.7) * 0.2,
            style: {
                fill: scheme.highlight,
                stroke: scheme.shadow,
                strokeWeight: minDim * 0.015,
            },
        });
    }

    private generateColorScheme(sequenceValue: number, beat: number): ColorScheme {
        const colors = [...this.allowedColors];
        const len = colors.length;

        if (len === 0) {
            return {
                background: '#000000',
                primary: '#FFFFFF',
                secondary: '#FF7A1F',
                highlight: '#FFD100',
                shadow: '#003B8E',
            };
        }

    // beat 整数部とシーケンス値からシードを生成してパレットを決定。
    let seed = Math.floor(beat) * 9973 + sequenceValue * 101;
        const rand = () => {
            const x = Math.sin(seed) * 10000;
            seed += 1;
            return x - Math.floor(x);
        };

        for (let i = len - 1; i > 0; i--) {
            const j = Math.floor(rand() * (i + 1)) % (i + 1);
            [colors[i], colors[j]] = [colors[j], colors[i]];
        }

        const pick = (index: number) => colors[index % len];

        return {
            background: pick(0),
            primary: pick(1),
            secondary: pick(2),
            highlight: pick(3),
            shadow: pick(4),
        };
    }

    /**
     * 単語描画のユーティリティ。回転やシアー、トラッキングなどをまとめて扱う。
     */
    private drawWord(tex: p5.Graphics, word: string, x: number, y: number, size: number, options: DrawOptions = {}): void {
        const p = this.p;
        const { angle = 0, scale = 1, shearX = 0, shearY = 0, tracking = 0, style } = options;
        tex.push();
        tex.translate(x, y);
        tex.rotate(angle);
        tex.scale(scale);
        if (shearX !== 0) {
            tex.shearX(shearX);
        }
        if (shearY !== 0) {
            tex.shearY(shearY);
        }

        if (style?.stroke) {
            tex.stroke(style.stroke);
            tex.strokeWeight(style.strokeWeight ?? size * 0.04);
        } else {
            tex.noStroke();
        }

        // スタイル未指定の場合は現在の配色から primary を選択。
        const fallbackFill = this.currentScheme ? this.currentScheme.primary : this.allowedColors[0];
        const fillColor = style?.fill ?? fallbackFill;
        const color = p.color(fillColor);
        if (style?.alpha !== undefined) {
            color.setAlpha(style.alpha);
        }
        tex.fill(color);

        if (tracking === 0) {
            tex.textSize(size);
            tex.text(word, 0, 0);
        } else {
            tex.textSize(size);
            let offsetX = -((word.length - 1) * tracking * size) / 2;
            // tracking > 0 のときは手動で文字間隔を設定。
            for (const char of word) {
                tex.text(char, offsetX, 0);
                offsetX += tracking * size;
            }
        }

        tex.pop();
    }

    /**
     * 背景に縦グラデーションを描画してタイポのコントラストを調節。
     */
    private drawGradientBackground(tex: p5.Graphics, fromColor: string, toColor: string, alpha: number): void {
        const p = this.p;
        const steps = 24;
        const c1 = p.color(fromColor);
        const c2 = p.color(toColor);
        c1.setAlpha(alpha * 255);
        c2.setAlpha(alpha * 255);

        // 縦方向に薄い帯を重ねてグラデーションを擬似的に表現。
        for (let i = 0; i < steps; i++) {
            const t = i / (steps - 1);
            const inter = p.lerpColor(c1, c2, t);
            tex.fill(inter);
            const y = tex.height * t;
            tex.noStroke();
            tex.rect(0, y, tex.width, tex.height / steps + 1);
        }
    }
}
