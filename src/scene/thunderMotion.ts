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
        this.thunders = [];
        this.lastBeatFloor = -1;
    }

    /**
     * 動きの更新と描画を行います。
     * @param tex 描画書き込み先の p5.Graphics インスタンス。
     * @param sequenceValue シーケンスの値。0より大きければ新しい雷を生成する可能性があります。
     * @param currentBeat 現在のビート値。
     */
    update(tex: p5.Graphics, sequenceValue: number, currentBeat: number): void {
        const p = this.p;
        const shouldGenerateNewThunder = sequenceValue > 0;
        const beatFloor = p.floor(currentBeat);

        // ビートが変化した & 生成フラグが立っている場合のみ新しい雷を生成
        if (this.lastBeatFloor !== beatFloor && shouldGenerateNewThunder) {
            // 生成する雷の数は1から3の間 (ランダム)
            const count = p.random(1, 3);
            for (let i = 0; i < count; i++) {
                // Thunder コンストラクタ内では p.width/height を使用しているため、ここでは tex は不要
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

        // 描画 (tex に描画するため、Thunder の draw に tex を渡す)
        for (const thunder of this.thunders) {
            thunder.draw(tex);
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
        // p.width, p.height を使用して初期位置とサイズを決定
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

        // 1. 落下進行度の計算 (p.map, p.min は p を使用)
        this.currentYProgress = p.map(p.min(timeElapsed, this.DURATION_DROP), 0, this.DURATION_DROP, 0, 1);

        // 2. 透明度の計算
        const fadeStartTime = this.DURATION_DROP;
        const fadeDuration = this.DURATION_FADE;

        if (timeElapsed >= fadeStartTime) {
            // フェードアウトの進行度を計算 (p.map, p.min は p を使用)
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
     * @param tex 描画書き込み先の p5.Graphics インスタンス。
     */
    draw(tex: p5.Graphics): void {
        const p = this.p;
        if (!this.isAlive) return;

        tex.push();
        // 描画設定を tex に適用
        tex.stroke(255, 255, 0, this.alpha); // 鮮やかな黄色と透明度
        tex.strokeWeight(this.finalStrokeWeight);
        tex.strokeJoin(p.MITER); // 尖った角を設定 (p.MITER は p を使用)
        tex.strokeCap(p.SQUARE);
        tex.noFill();

        // 描画ヘルパー関数にも tex を渡す
        this.drawLightning(tex, this.startX, this.startY, this.endY);
        tex.pop();
    }

    /**
     * 雷のギザギザした形状をランダムウォークで描画します。
     * @param tex 描画書き込み先の p5.Graphics インスタンス。
     */
    private drawLightning(tex: p5.Graphics, xStart: number, yStart: number, yEnd: number): void {
        const p = this.p;

        p.randomSeed(this.seed); // シード固定で毎回同じ形状の雷を描画

        // 雷が到達すべき現在のY位置 (p.lerp は p を使用)
        const currentReachY = p.lerp(yStart, yEnd, this.currentYProgress);

        // --- 描画ロジック ---
        tex.beginShape();

        let currentX = xStart;
        let currentY = yStart;

        // 雷の横方向の揺れ幅
        const zigZagRange = this.finalStrokeWeight * 10;
        // Y方向のステップ (p.height を p.p.height/tex.height とせず、コンストラクタで使われた p.height に基づく固定値とする)
        // ただし、drawLightning内では p.height を使えないため、p.p.height と p.constrain に置き換える
        const yStep = this.p.height * 0.03;

        tex.vertex(currentX, currentY); // 開始点

        // Y軸の現在到達点までギザギザな線を描画
        while (currentY < currentReachY) {
            // Y座標をランダムなステップで進行
            currentY += yStep;

            // X座標をランダムなジグザグで動かす (p.random は p を使用)
            currentX += p.random(-zigZagRange, zigZagRange);

            // X座標が画面外に出ないようにクランプ (p.constrain は p を使用)
            // ここでの画面幅は、コンストラクタで p.width を使用して初期位置が設定されているため、p.width を使用するのが適切
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