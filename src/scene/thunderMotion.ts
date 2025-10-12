// --------------------------------------------------------------
// ThunderMotion
// 雷エフェクトの生成と寿命管理を担うシーンモジュール。
// シーケンサーの強度に応じて分岐する描画スタイルを備える。
// --------------------------------------------------------------

import p5 from 'p5'
import { ColorPalette } from '../utils/colorPalette'

/**
 * 雷の動き全体を管理するクラス。
 * ビートに合わせて新しい雷を生成し、描画を更新します。
 */
export class ThunderMotion {
    private p: p5;
    private thunders: Thunder[];          // 現在表示中の雷オブジェクトの配列
    private lastBeatFloor: number;    // 最後に雷を生成したビートの整数部分
    private readonly BEAT_SEED_MULTIPLIER = 41270;

    constructor(p: p5) {
        this.p = p;
        this.thunders = [];
        this.lastBeatFloor = -1;
    }

    /**
     * 雷シーンのメインループ。
     * tex: SceneManager が用意した描画先バッファ。
     * sequenceValue: APC 側から渡されるモード番号。0 は非表示。
     * currentBeat: BPMManager からの経過拍。整数部=トリガー、小数部=フェード処理に利用。
     */
    update(tex: p5.Graphics, sequenceValue: number, currentBeat: number): void {
        const p = this.p;

        // sequenceValueが1以上で、ビートが変わった時に雷を生成
        const shouldGenerateNewThunder = sequenceValue >= 1;

        const beatFloor = p.floor(currentBeat);
    p.randomSeed(beatFloor * this.BEAT_SEED_MULTIPLIER); // 拍頭ごとに雷の軌跡を固定

        // ビートが変化した & 生成フラグが立っている場合のみ新しい雷を生成
        if (this.lastBeatFloor !== beatFloor && shouldGenerateNewThunder) {
            // 拍頭でのみ新規生成する。ディテールが高いモードほど複数本降らせる。
            let count = 1;
            if (sequenceValue >= 5) {
                // 5以降は複数本生成の可能性
                count = p.floor(p.random(1, 3));
            } else {
                count = 1; // 4以下は基本的に1本
            }

            for (let i = 0; i < count; i++) {
                this.thunders.push(new Thunder(p, currentBeat, sequenceValue)); // sequenceValue を渡す
            }
        }

        // 雷の更新と寿命切れのチェック
    // 生き残った雷のみ次フレームに持ち越す。
    const nextThunders: Thunder[] = [];
        for (const thunder of this.thunders) {
            thunder.update(currentBeat);
            if (thunder.isAlive) {
                nextThunders.push(thunder);
            }
        }
        this.thunders = nextThunders; // 配列を更新

        // 描画 (sequenceValue=0の場合は描画自体を行わないため、tex.clear()や背景描画は呼び出し元で行う)
        // ここでは、sequenceValueが0より大きい場合のみ描画を試みる
        if (sequenceValue >= 1) {
            for (const thunder of this.thunders) {
                thunder.draw(tex, sequenceValue); // sequenceValue を渡す
            }
        }

        // 次のフレームのために現在のビートの整数部分を保持
        this.lastBeatFloor = beatFloor;
    }
}

// ---------------------------------------------------------------------------------------------------------------------

/**
 * 個々の雷（サンダー）のオブジェクトを管理するクラス。
 * 動きと描画ロジックを含みます。
 */
export class Thunder {
    private p: p5;
    private startX: number;        // 雷の開始X座標（画面上部）
    private startY: number;        // 雷の開始Y座標
    private endY: number;          // 雷の最終Y座標
    private startBeat: number;     // 雷が生成されたビート
    public isAlive: boolean;       // 雷が生存しているかどうかのフラグ
    private alpha: number;         // 描画時の透明度 (0-255)
    private seed: number;          // 雷のギザギザ形状を固定するための乱数シード
    private currentYProgress: number; // 現在のY軸の進行度 (0.0〜1.0)
    private finalStrokeWeight: number; // 最終的な線の太さ

    // 雷のアニメーション継続時間 (ビート単位)
    // 1拍で落ち、残りの時間でフェードアウト
    private readonly DURATION_DROP = 1.0;              // 1拍（1ビート）で完全に落ちる
    private readonly DURATION_FADE = 0.5;              // 落ちた後、0.5ビートでフェードアウト

    constructor(p: p5, startBeat: number, sequenceValue: number) {
        this.p = p;
        // p.width, p.height を使用して初期位置とサイズを決定
        this.startX = p.random(p.width * 0.1, p.width * 0.9);
        this.startY = - p.random(p.height * 0.05, p.height * 0.1); // 画面上部から開始
        this.endY = p.height * p.random(0.5, 0.9); // 画面中央より下に到達
        this.alpha = 255;

        // sequenceValue に応じて線の太さを調整
        if (sequenceValue === 1 || sequenceValue === 2) {
            // 抽象度高: 太めの線
            this.finalStrokeWeight = p.min(p.width, p.height) * p.map(p.pow(p.random(), 2), 0, 1, 0.03, 0.08);
        } else if (sequenceValue >= 5) {
            // ディテール高: 細めの線
            this.finalStrokeWeight = p.min(p.width, p.height) * p.map(p.pow(p.random(), 2), 0, 1, 0.005, 0.015);
        } else {
            // 標準: 中くらいの線
            this.finalStrokeWeight = p.min(p.width, p.height) * p.map(p.pow(p.random(), 2), 0, 1, 0.01, 0.04);
        }

        // sequenceValue=2では、線をさらに太くする（1の線が太くなるという指示に合わせる）
        if (sequenceValue === 2) {
            this.finalStrokeWeight *= 1.5;
        }

        this.currentYProgress = 0;
    this.seed = p.random(1000); // 雷一本ごとの形状乱数キー
        this.startBeat = startBeat;
        this.isAlive = true;
    }

    /**
     * 雷の状態を更新します。
     * @param currentBeat 現在のビート値。
     */
    update(currentBeat: number): void {
        const p = this.p;
        const timeElapsed = currentBeat - this.startBeat;

        // 1. 落下進行度の計算 (1拍で1.0に到達)
        this.currentYProgress = p.map(p.min(timeElapsed, this.DURATION_DROP), 0, this.DURATION_DROP, 0, 1);

        // 2. 透明度の計算
    // 落下しきった地点からフェードに移行。各 duration はビート基準。
    const fadeStartTime = this.DURATION_DROP;
    const fadeDuration = this.DURATION_FADE;

        if (timeElapsed >= fadeStartTime) {
            // フェードアウトの進行度を計算
            const fadeTimeElapsed = timeElapsed - fadeStartTime;
            this.alpha = p.map(p.min(fadeTimeElapsed, fadeDuration), 0, fadeDuration, 255, 0);
        } else {
            // 落下中は完全に見える
            this.alpha = 255;
        }

        // 寿命チェック
        if (this.alpha <= 0) {
            this.isAlive = false;
        }
    }

    /**
     * 雷を描画します。
     * @param tex 描画書き込み先の p5.Graphics インスタンス。
     * @param sequenceValue シーケンスの値。
     */
    draw(tex: p5.Graphics, sequenceValue: number): void {
        const p = this.p;
        if (!this.isAlive) return;

        tex.push();
        const palette = ColorPalette.scenes.thunder;

        // 描画設定を tex に適用
        const boltColor = p.color(palette.bolt);
        boltColor.setAlpha(this.alpha);
        tex.stroke(boltColor);
        tex.strokeWeight(this.finalStrokeWeight);
        tex.strokeJoin(p.MITER);
        tex.strokeCap(p.SQUARE);
        tex.noFill();

    // sequenceValue に応じて描画のディテールを段階的に増やしていく。
    switch (sequenceValue) {
            case 1: // 太めの線が垂直に伸びる (最も抽象的)
                this.drawAbstractLine(tex, this.startX, this.startY, this.endY);
                break;
            case 2: // 綺麗な形の雷（折れ曲がりの幅が等しい）
                // 線の太さはコンストラクタで太く設定済み
                this.drawLightning(tex, this.startX, this.startY, this.endY, 2);
                break;
            case 3: // 標準的な雷（ランダム性が増す）
                this.drawLightning(tex, this.startX, this.startY, this.endY, 3);
                break;
            case 4: // ランダム性が非常に高く、より細かくギザギザした雷
                this.drawLightning(tex, this.startX, this.startY, this.endY, 4);
                break;
            case 5: // 4の雷 + 微小な枝分かれ (ディテールUP)
                this.drawLightning(tex, this.startX, this.startY, this.endY, 4);
                // 枝分かれ
                p.randomSeed(this.seed + 100);
                for (let i = 0; i < 1; i++) {
                    const branchStartProgress = p.random(0.5, 0.8);
                    // 主幹の途中から横方向に振り出す位置を計算
                    const branchStartX = p.lerp(this.startX, this.startX + (p.random(-1, 1) * this.finalStrokeWeight * 10), branchStartProgress);
                    const branchStartY = p.lerp(this.startY, this.endY, branchStartProgress);
                    // 枝は細く、短く、ランダム性の高い雷として描画
                    this.drawLightning(tex, branchStartX, branchStartY, this.endY * p.random(0.8, 0.95), 4, true);
                }
                break;
            case 6: // 複数本の細かい雷がほぼ同時に落ちる (密度UP)
                // このシーケンスでは ThunderMotion で複数本生成される
                this.drawLightning(tex, this.startX, this.startY, this.endY, 5);
                break;
            case 7: // 非常に細い線で構成された、複雑でディテールの高い雷 (最も具体的)
                this.drawLightning(tex, this.startX, this.startY, this.endY, 6);
                // 細かいディテールを追加
                const highlightColor = p.color(palette.highlight);
                highlightColor.setAlpha(this.alpha * 0.5);
                tex.stroke(highlightColor);
                tex.strokeWeight(this.finalStrokeWeight * 0.3);
                this.drawLightning(tex, this.startX, this.startY, this.endY, 6, true);
                break;
        }

        tex.pop();
    }

    /**
     * 最も抽象的な描画: 単純な垂直線 (sequenceValue=1)
     */
    private drawAbstractLine(tex: p5.Graphics, xStart: number, yStart: number, yEnd: number): void {
        const p = this.p;
        const currentReachY = p.lerp(yStart, yEnd, this.currentYProgress);
        // 線の太さはコンストラクタで設定済み
        tex.line(xStart, yStart, xStart, currentReachY);
    }


    /**
     * 雷のギザギザした形状をランダムウォークで描画します。
     * tex: 描画バッファ / sequenceLevel: 折れ曲がりの粗さレベル (2〜6) / isBranch: 枝専用なら true。
     */
    private drawLightning(tex: p5.Graphics, xStart: number, yStart: number, yEnd: number, sequenceLevel: number, isBranch: boolean = false): void {
        const p = this.p;

        p.randomSeed(this.seed);

        // 雷が到達すべき現在のY位置
        const currentReachY = p.lerp(yStart, yEnd, this.currentYProgress);

    let zigZagRange = this.finalStrokeWeight * 5; // 横方向の揺れ幅の基本
    let yStep = this.p.height * 0.03;             // Y方向のステップの基本
    let randomFactor = 1.0;                      // ランダム性の倍率

        // sequenceLevelに応じてジグザグのパラメータを調整
        if (sequenceLevel === 2) {
            // 綺麗な形（折れ曲がりの幅が等しい）: 揺れ幅を固定し、ランダム性を抑制
            zigZagRange = this.finalStrokeWeight * 10;
            yStep = this.p.height * 0.04;
            randomFactor = 0.5; // ランダム性を抑え、より一定の幅で折れ曲がるように
        } else if (sequenceLevel === 3) {
            // 標準的な雷
            zigZagRange = this.finalStrokeWeight * 10;
            yStep = this.p.height * 0.03;
            randomFactor = 1.0;
        } else if (sequenceLevel >= 4) {
            // 細かく、ランダム性が高い/複雑な雷
            zigZagRange = this.finalStrokeWeight * 8;
            yStep = this.p.height * 0.015;
            randomFactor = 1.5;
        }

        // 枝分かれやディテール追加の場合はさらに調整
        if (isBranch) {
            zigZagRange *= 0.5; // 枝は揺れを小さく
            yStep *= 0.8;       // 枝はステップを小さく
            randomFactor = 2.0; // 枝先は細かく震えるようにアクセント
        }


        // --- 描画ロジック ---
    // beginShape/vertex で折れ線を構築。currentReachY まで少しずつ伸ばす。
    tex.beginShape();

        let currentX = xStart;
        let currentY = yStart;

        tex.vertex(currentX, currentY); // 開始点

        // Y軸の現在到達点までギザギザな線を描画
        while (currentY < currentReachY) {
            // Y座標をランダムなステップで進行
            currentY += yStep;

            // X座標をランダムなジグザグで動かす
            currentX += p.random(-zigZagRange * randomFactor, zigZagRange * randomFactor);

            // X座標が画面外に出ないようにクランプ
            currentX = p.constrain(currentX, 0, p.width);

            // currentYがcurrentReachYを超えないように調整
            if (currentY > currentReachY) {
                currentY = currentReachY;
            }

            tex.vertex(currentX, currentY);
        }

        tex.endShape();
    }
}