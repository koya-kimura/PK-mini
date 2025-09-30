import p5 from 'p5'

/**
 * 雷の動き全体を管理するクラス。
 * ビートに合わせて新しい雷を生成し、描画を更新します。
 */
export class ThunderMotion { // クラス名をThunderMotionに変更
    private p: p5;
    private thunders: Thunder[];          // 現在表示中の雷オブジェクトの配列
    private lastBeatFloor: number;    // 最後に雷を生成したビートの整数部分

    constructor(p: p5) {
        this.p = p;
        this.thunders = []; // thunderArray -> thunders
        this.lastBeatFloor = -1;
    }

    /**
     * 動きの更新と描画を行います。
     * @param sequenceValue シーケンスの値。0より大きければ新しい雷を生成する可能性があります。
     * @param currentBeat 現在のビート値。
     */
    update(sequenceValue: number, currentBeat: number): void {
        const p = this.p;
        const shouldGenerateNewThunder = sequenceValue > 0; // shouldGenerateNewCloud -> shouldGenerateNewThunder
        const beatFloor = p.floor(currentBeat);

        // ビートが変化した & 生成フラグが立っている場合のみ新しい雷を生成
        if (this.lastBeatFloor !== beatFloor && shouldGenerateNewThunder) {
            // 生成する雷の数は1から3の間 (ランダム)
            const count = p.random(1, 3);
            for (let i = 0; i < count; i++) {
                this.thunders.push(new Thunder(p, currentBeat));
            }
        }

        // 雷の更新と寿命切れのチェック
        // 生存している雷のみをフィルタリングして新しい配列に格納
        const nextThunders: Thunder[] = [];
        for (const thunder of this.thunders) {
            thunder.update(currentBeat);
            if (thunder.isAlive) {
                nextThunders.push(thunder);
            }
        }
        this.thunders = nextThunders; // 配列を更新

        // 描画
        p.push();
        for (const thunder of this.thunders) {
            thunder.draw();
        }
        p.pop();

        // 次のフレームのために現在のビートの整数部分を保持
        this.lastBeatFloor = beatFloor;
    }
}

// ---

/**
 * 個々の雷（サンダー）のオブジェクトを管理するクラス。
 * 動きと描画ロジックを含みます。
 */
export class Thunder { // クラス名をThunderに変更
    private p: p5;
    private startX: number;        // 雷の開始X座標（画面上部）
    private startY: number;        // 雷の開始Y座標（常に0に近い値）
    private endY: number;          // 雷の最終Y座標
    private startBeat: number;     // 雷が生成されたビート
    public isAlive: boolean;       // 雷が生存しているかどうかのフラグ
    private alpha: number;         // 描画時の透明度 (0-255)
    private seed: number;          // 雷のギザギザ形状を固定するための乱数シード
    private currentYProgress: number; // 現在のY軸の進行度 (0.0〜1.0)
    private finalStrokeWeight: number; // 最終的な線の太さ

    // 雷のアニメーション継続時間 (ビート単位)
    private readonly DURATION_TOTAL = 0.5;              // 完全にフェードアウトするまでの全時間
    private readonly DURATION_DROP = this.DURATION_TOTAL * 0.4; // 雷が落ちる時間 (Y軸の移動時間)
    private readonly DURATION_FADE = this.DURATION_TOTAL * 0.6; // 雷がフェードアウトする時間 (残りの時間)

    constructor(p: p5, startBeat: number) {
        this.p = p;
        this.startX = p.random(p.width * 0.1, p.width * 0.9);
        this.startY = - p.random(p.height * 0.05, p.height * 0.1); // 画面上部から開始
        this.endY = p.height * p.random(0.5, 0.9); // 画面中央より下に到達
        this.alpha = 255;
        this.finalStrokeWeight = p.min(p.width, p.height) * p.map(p.pow(p.random(), 2), 0, 1, 0.01, 0.05);
        this.currentYProgress = 0;
        this.seed = p.random(1000);
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

        // 1. 落下進行度の計算 (DURATION_DROP=0.2までで0から1へ)
        this.currentYProgress = p.map(p.min(timeElapsed, this.DURATION_DROP), 0, this.DURATION_DROP, 0, 1);

        // 2. 透明度の計算
        // DURATION_DROP以降(0.2から0.5)で255から0へ急激にフェードアウト
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

        // 寿命チェック: 透明度が0以下になったら生存フラグをfalseにする
        if (this.alpha <= 0) {
            this.isAlive = false;
        }
    }

    /**
     * 雷を描画します。
     */
    draw(): void {
        const p = this.p;
        if (!this.isAlive) return;

        p.push();
        p.stroke(255, 255, 0, this.alpha); // 鮮やかな黄色と透明度
        p.strokeWeight(this.finalStrokeWeight);
        p.strokeJoin(p.MITER); // 尖った角を設定
        p.strokeCap(p.SQUARE);
        p.noFill();

        this.drawLightning(this.startX, this.startY, this.endY);
        p.pop();
    }

    /**
     * 雷のギザギザした形状をランダムウォークで描画します。
     */
    private drawLightning(xStart: number, yStart: number, yEnd: number): void {
        const p = this.p;

        p.randomSeed(this.seed); // シード固定で毎回同じ形状の雷を描画

        // 雷が到達すべき現在のY位置
        const currentReachY = p.lerp(yStart, yEnd, this.currentYProgress);

        // --- 描画ロジック ---
        p.beginShape();

        let currentX = xStart;
        let currentY = yStart;

        // 雷の横方向の揺れ幅
        const zigZagRange = this.finalStrokeWeight * 10;
        // Y方向のステップ
        const yStep = p.height * 0.03;

        p.vertex(currentX, currentY); // 開始点

        // Y軸の現在到達点までギザギザな線を描画
        while (currentY < currentReachY) {
            // Y座標をランダムなステップで進行
            currentY += yStep;

            // X座標をランダムなジグザグで動かす
            currentX += p.random(-zigZagRange, zigZagRange);

            // X座標が画面外に出ないようにクランプ
            currentX = p.constrain(currentX, 0, p.width);

            // currentYがcurrentReachYを超えないように調整
            if (currentY > currentReachY) {
                currentY = currentReachY;
            }

            p.vertex(currentX, currentY);
        }

        p.endShape();
    }
}