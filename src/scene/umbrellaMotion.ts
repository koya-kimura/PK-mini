import p5 from 'p5'

/**
 * 傘の動き全体を管理するクラス。
 * ビートに合わせて新しい傘を生成し、描画を更新します。
 */
export class UmbrellaMotion {
    private p: p5;
    private umbrellas: Umbrella[];          // 現在表示中の傘オブジェクトの配列
    private lastBeatFloor: number;         // 最後に傘を生成したビートの整数部分

    constructor(p: p5) {
        this.p = p;
        this.umbrellas = [];
        this.lastBeatFloor = -1;
    }

    /**
     * 動きの更新と描画を行います。
     * @param sequenceValue シーケンスの値。0より大きければ新しい傘を生成する可能性があります。
     * @param currentBeat 現在のビート値。
     */
    update(sequenceValue: number, currentBeat: number): void {
        const p = this.p;
        const shouldGenerateNewUmbrella = sequenceValue > 0;
        const beatFloor = p.floor(currentBeat); // 現在のビートの整数部分

        // ビートが変化した & 生成フラグが立っている場合のみ新しい傘を生成
        if (this.lastBeatFloor !== beatFloor && shouldGenerateNewUmbrella) {
            // 生成する傘の数は1から2の間 (ランダム)
            const count = p.random(1, 2);
            for (let i = 0; i < count; i++) {
                this.umbrellas.push(new Umbrella(p, currentBeat));
            }
        }

        // 傘の更新と寿命切れのチェック
        // 生存している傘のみをフィルタリングして新しい配列に格納
        const nextUmbrellas: Umbrella[] = [];
        for (const umbrella of this.umbrellas) {
            umbrella.update(currentBeat);
            if (umbrella.isAlive) {
                nextUmbrellas.push(umbrella);
            }
        }
        this.umbrellas = nextUmbrellas; // 配列を更新

        // 描画
        p.push();
        for (const umbrella of this.umbrellas) {
            umbrella.draw();
        }
        p.pop();

        // 次のフレームのために現在のビートの整数部分を保持
        this.lastBeatFloor = beatFloor;
    }
}

/**
 * 個々の傘のオブジェクトを管理するクラス。
 * 動きと描画ロジックを含みます。
 */
export class Umbrella {
    private p: p5;
    private positionX: number;     // 傘の中心X座標
    private positionY: number;     // 傘の中心Y座標
    private radius: number;        // 傘の半径
    private segmentCount: number;  // 傘を構成するセグメントの総数
    private drawnSegments: number; // 現在描画されているセグメントの数 (アニメーション用)
    private angle: number;         // 傘の初期回転角度
    private startBeat: number;     // 傘が生成されたビート
    public isAlive: boolean;       // 傘が生存しているかどうかのフラグ
    private alpha: number;         // 描画時の透明度 (0-255)
    private scaleFactor: number;   // 描画時のスケール倍率

    // 傘のアニメーション継続時間 (ビート単位)
    private readonly DURATION_TOTAL = 1.05;              // 完全にフェードアウトするまでの全時間
    private readonly DURATION_APPEARANCE = this.DURATION_TOTAL * 0.25; // 拡大アニメーションの時間
    private readonly DURATION_SEGMENT_DRAW = this.DURATION_TOTAL * 0.5; // セグメントが描き切るまでの時間

    constructor(p: p5, startBeat: number) {
        this.p = p;
        this.positionX = p.random(p.width);
        this.positionY = p.random(p.height * 0.6);
        // segmentCount: 8から15の間で、低い値が出やすいランダム分布
        this.segmentCount = p.floor(p.map(p.pow(p.random(), 2), 0, 1, 4, 7)) * 2;
        this.drawnSegments = 0;
        this.angle = p.random(p.TAU);
        this.alpha = 255;
        this.radius = p.min(p.width, p.height) * p.random(0.05, 0.1);
        this.scaleFactor = 1;
        this.startBeat = startBeat;
        this.isAlive = true;
    }

    /**
     * 傘の状態を更新します。
     * @param currentBeat 現在のビート値。
     */
    update(currentBeat: number): void {
        const p = this.p;
        const timeElapsed = currentBeat - this.startBeat;

        // 1. 透明度の計算: DURATION_TOTALまでで255から0へ。p.pow(..., 3)で終盤に急激にフェードアウト
        const alphaTimeNorm = p.map(p.min(timeElapsed, this.DURATION_TOTAL), 0, this.DURATION_TOTAL, 0, 1);
        this.alpha = p.map(p.pow(alphaTimeNorm, 3), 0, 1, 255, 0);

        // 2. スケールの計算: DURATION_APPEARANCEまでで1から1.2にスケールアップ
        this.scaleFactor = p.map(p.min(timeElapsed, this.DURATION_APPEARANCE), 0, this.DURATION_APPEARANCE, 1, 1.2);

        // 3. 描画セグメント数の計算: DURATION_SEGMENT_DRAWまでで0からsegmentCountまで増加
        this.drawnSegments = p.map(p.min(timeElapsed, this.DURATION_SEGMENT_DRAW), 0, this.DURATION_SEGMENT_DRAW, 0, this.segmentCount);

        // 寿命チェック: 透明度が0以下になったら生存フラグをfalseにする
        if (this.alpha <= 0) {
            this.isAlive = false;
        }
    }

    /**
     * 傘を描画します。
     */
    draw(): void {
        const p = this.p;
        if (!this.isAlive) return;

        p.push();
        // fill(255, alpha) は drawUmbrella 内で処理する方が、線や他の要素にも反映しやすいが、
        // オリジナルコードの動作を維持するため、ここでは透明度のみの設定とする
        p.fill(255, this.alpha);
        this.drawUmbrella(this.positionX, this.positionY, this.radius);
        p.pop();
    }

    /**
     * 傘の形状を個々のセグメントとして描画します。
     */
    private drawUmbrella(x: number, y: number, r: number): void {
        const p = this.p;

        p.push();

        p.translate(x, y);
        p.rotate(this.angle);
        p.scale(this.scaleFactor); // スケール適用

        const totalSegments = this.segmentCount;
        const segmentAngle = p.TAU / totalSegments;
        const centerCircleRadius = r * 0.1;
        const outerLineLength = r * 1.05;
        // 線の太さを画面サイズに基づいて設定
        const strokeW = r * 0.04;

        for (let i = 0; i < totalSegments; i++) {
            // アニメーション中の描画セグメント数を超えたらスキップ
            if (i > this.drawnSegments) {
                continue;
            }

            const currentAngle = p.TAU * i / totalSegments;
            const nextAngle = currentAngle + segmentAngle;
            const umbrellaColor = i % 2 == 0 ? p.color(100, this.alpha) : p.color(20, 30, 20, this.alpha);

            // 1. 傘の赤いセグメント
            p.stroke(10, this.alpha);             // 縁取りの色と透明度
            p.strokeCap(p.SQUARE);
            p.fill(umbrellaColor);
            p.strokeWeight(strokeW);
            p.arc(0, 0, r * 2, r * 2, currentAngle, nextAngle);

            // 2. 骨組みの線 (中心から外側へ)
            p.line(0, 0, p.cos(currentAngle) * outerLineLength, p.sin(currentAngle) * outerLineLength);

            // 3. 中心部の黒い円
            p.fill(0, 0, 0, this.alpha);
            p.arc(0, 0, centerCircleRadius * 2, centerCircleRadius * 2, currentAngle, nextAngle);
        }
        p.pop();
    }
}