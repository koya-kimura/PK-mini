import p5 from 'p5'

/**
 * 雲の動き全体を管理するクラス。
 * ビートに合わせて新しい雲を生成し、描画を更新します。
 */
export class CloudMotion {
    private p: p5;
    private clouds: Cloud[];          // 現在表示中の雲オブジェクトの配列
    private lastBeatFloor: number;    // 最後に雲を生成したビートの整数部分

    constructor(p: p5) {
        this.p = p;
        this.clouds = [];
        this.lastBeatFloor = -1;
    }

    /**
     * 動きの更新と描画を行います。
     * @param tex 描画書き込み先の p5.Graphics インスタンス。
     * @param sequenceValue シーケンスの値。0より大きければ新しい雲を生成する可能性があります。
     * @param currentBeat 現在のビート値。
     */
    update(tex: p5.Graphics, sequenceValue: number, currentBeat: number): void {
        const p = this.p;
        const shouldGenerateNewCloud = sequenceValue > 0;
        const beatFloor = p.floor(currentBeat); // 現在のビートの整数部分

        // ビートが変化した & 生成フラグが立っている場合のみ新しい雲を生成
        if (this.lastBeatFloor !== beatFloor && shouldGenerateNewCloud) {
            // 生成する雲の数は1から5の間 (ランダム)
            const count = p.random(1, 5);
            for (let i = 0; i < count; i++) {
                this.clouds.push(new Cloud(p, currentBeat));
            }
        }

        // 雲の更新と寿命切れのチェック
        // 生存している雲のみをフィルタリングして新しい配列に格納
        const nextClouds: Cloud[] = [];
        for (const cloud of this.clouds) {
            cloud.update(currentBeat);
            if (cloud.isAlive) {
                nextClouds.push(cloud);
            }
        }
        this.clouds = nextClouds; // 配列を更新

        // 描画 (tex に描画するため、Cloud の draw に tex を渡す)
        // ここでの p.push() / p.pop() は tex に描画を移すため削除
        for (const cloud of this.clouds) {
            cloud.draw(tex);
        }

        // 次のフレームのために現在のビートの整数部分を保持
        this.lastBeatFloor = beatFloor;
    }
}

/**
 * 個々の雲のオブジェクトを管理するクラス。
 * 動きと描画ロジックを含みます。
 */
export class Cloud {
    private p: p5;
    private positionX: number;     // 雲の中心X座標
    private positionY: number;     // 雲の中心Y座標
    private width: number;         // 雲の基準幅
    private height: number;        // 雲の基準高さ
    private startBeat: number;     // 雲が生成されたビート
    public isAlive: boolean;       // 雲が生存しているかどうかのフラグ
    private alpha: number;         // 描画時の透明度 (0-255)
    private seed: number;          // 雲の形状を固定するための乱数シード
    private scaleFactor: number;   // 描画時のスケール倍率

    // 雲のアニメーション継続時間 (ビート単位)
    private readonly DURATION_TOTAL = 1.1;              // 完全にフェードアウトするまでの全時間
    private readonly DURATION_SCALE_UP = this.DURATION_TOTAL * 0.25; // 拡大アニメーションの時間

    constructor(p: p5, startBeat: number) {
        this.p = p;
        this.positionX = p.random(p.width);
        this.positionY = p.random(p.height * 0.5);
        this.alpha = 255;
        // 画面サイズに基づいたランダムな幅と高さ
        const minDim = p.min(p.width, p.height);
        this.width = minDim * p.random(0.3, 0.4);
        this.height = minDim * p.random(0.1, 0.15);
        this.scaleFactor = 1;
        this.seed = p.random(1000); // 描画ロジックで使用
        this.startBeat = startBeat;
        this.isAlive = true;
    }

    /**
     * 雲の状態を更新します。
     * @param currentBeat 現在のビート値。
     */
    update(currentBeat: number): void {
        const p = this.p;
        const timeElapsed = currentBeat - this.startBeat;

        // 1. 透明度の計算
        this.alpha = p.map(p.min(timeElapsed, this.DURATION_TOTAL), 0, this.DURATION_TOTAL, 255, 0);

        // 2. スケールの計算
        this.scaleFactor = p.map(p.min(timeElapsed, this.DURATION_SCALE_UP), 0, this.DURATION_SCALE_UP, 1, 1.2);

        // 寿命チェック
        if (this.alpha <= 0) {
            this.isAlive = false;
        }
    }

    /**
     * 雲を描画します。
     * @param tex 描画書き込み先の p5.Graphics インスタンス。
     */
    draw(tex: p5.Graphics): void {
        const p = this.p;
        if (!this.isAlive) return;

        tex.push();
        // 雲の色と透明度を設定 (p.color() は p を使用)
        tex.fill(p.color(255, this.alpha));
        // 描画ヘルパー関数にも tex を渡す
        this.drawCloudShape(tex, this.positionX, this.positionY, this.width, this.height);
        tex.pop();
    }

    /**
     * 雲の形状を複数のランダムな角丸長方形として描画します。
     * @param tex 描画書き込み先の p5.Graphics インスタンス。
     */
    private drawCloudShape(tex: p5.Graphics, x: number, y: number, w: number, h: number): void {
        const p = this.p;

        tex.push();
        // シードを設定し、雲の形状を毎回同じにする (p.randomSeed() は p を使用)
        p.randomSeed(this.seed);

        // 雲を構成するランダムな長方形の数 (p.floor(), p.random() は p を使用)
        const rectCount = p.floor(p.random(3, 6));

        // 描画位置を矩形の中心に設定し、スケールを適用
        tex.translate(x, y);
        tex.scale(this.scaleFactor);
        tex.noStroke();
        tex.rectMode(p.CENTER); // rectMode の定数 (p.CENTER) は p を使用

        for (let i = 0; i < rectCount; i++) {
            // 個々の矩形の幅と高さをランダムに設定 (p.random() は p を使用)
            const rectW = w * p.random(0.5, 0.7);
            const rectH = h / rectCount;

            // 矩形のX座標をランダムなオフセットで設定
            const rectX = p.random(- (w - rectW) / 2, (w - rectW) / 2);

            // 矩形のY座標を rectCount で分割した位置に配置
            const rectY = rectH * i - (h / 2) + (rectH / 2);

            // 角丸長方形を描画
            const cornerRadius = rectH / 2;
            tex.rect(rectX, rectY, rectW, rectH, cornerRadius);
        }
        tex.pop();
    }
}