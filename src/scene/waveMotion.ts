import p5 from 'p5'

/**
 * 日本の伝統的な文様である青海波（せいがいは）を描画・アニメーションさせるクラス。
 * 画面下部を中心に、模様全体を時間経過とともに波打たせます。
 */
export class WaveMotion {
    private p: p5;

    // 描画定数
    private readonly ARC_SEGMENTS = 8;        // 青海波ユニットを構成する同心円の数
    private readonly BASE_RADIUS_RATIO = 0.1; // 画面の短い辺に対する基本半径の割合
    private readonly Y_STEP_RATIO = 0.35;     // Y方向のステップ幅を半径に対する割合で定義
    private readonly BASE_Y_START_RATIO = 0.8; // 描画開始Y座標の画面高さに対する割合

    constructor(p: p5) {
        this.p = p;
    }

    /**
     * 青海波の基本ユニット（波一つ）を描画するヘルパー関数
     * @param tex 描画書き込み先の p5.Graphics インスタンス。
     * @param centerX ユニットの中心X座標
     * @param centerY ユニットの中心Y座標
     * @param radiusW 弧の基準幅（X方向の半径）
     * @param radiusH 弧の基準高さ（Y方向の半径、デフォルトは radiusW）
     */
    private drawSeigaihaUnit(tex: p5.Graphics, centerX: number, centerY: number, radiusW: number, radiusH: number = radiusW): void {
        const p = this.p; // p5 環境に依存する関数（color, maxなど）のために保持

        // tex に描画を開始
        tex.push();
        tex.translate(centerX, centerY);

        // 中心から外側へ向かって弧を描画
        for (let i = 0; i < this.ARC_SEGMENTS; i++) {
            // 同心円の現在の半径を計算
            const currentRadiusW = radiusW * (i + 1) / this.ARC_SEGMENTS;
            const currentRadiusH = radiusH * (i + 1) / this.ARC_SEGMENTS;

            // 線の太さを計算 (外側ほど太くなる)
            const strokeThickness = p.max(radiusW, radiusH) / this.ARC_SEGMENTS;

            // 交互に色を設定 (偶数: 青、奇数: 白)
            // p.color() は p を使用
            const segmentColor = i % 2 == 0 ? p.color(0, 150, 255) : p.color(255);

            // tex に描画設定を適用
            tex.strokeCap(p.SQUARE);
            tex.stroke(segmentColor);
            tex.strokeWeight(strokeThickness);
            tex.noFill();

            // 弧を描画（下半分のみ：PI から TWO_PI）
            // arc は tex のメソッドを使用
            tex.arc(0, 0, currentRadiusW * 2, currentRadiusH * 2, p.PI, p.TWO_PI);
        }
        tex.pop();
    }

    /**
     * 青海波パターンをアニメーション付きで描画します。
     * @param tex 描画書き込み先の p5.Graphics インスタンス。
     * @param sequenceValue パターンを表示するかどうかを制御する値
     * @param currentBeat 現在のビート値
     */
    update(tex: p5.Graphics, sequenceValue: number, currentBeat: number): void {
        const p = this.p;
        const shouldShow = sequenceValue > 0;

        if (!shouldShow) {
            return;
        }

        // 基本サイズと間隔の計算 (p.width, p.height を tex.width, tex.height に変更)
        const baseRadius = p.min(tex.width, tex.height) * this.BASE_RADIUS_RATIO; // ユニットの基準半径
        const stepX = baseRadius * 2;             // X方向の間隔（直径）
        const stepY = baseRadius * this.Y_STEP_RATIO; // Y方向の間隔

        // 描画する行数と列数を計算（tex を覆うのに十分な数）
        // tex.height, tex.width を使用
        const rows = p.floor((tex.height * (1 - this.BASE_Y_START_RATIO) / stepY) * 1.5) + 2;
        const cols = p.floor(tex.width / stepX) + 2;

        // tex に描画設定を適用
        tex.push();

        // --- 波のアニメーションパラメータ ---
        const waveSpeed = 0.5; // 波の移動速度 (フレームまたはビートに依存)
        const waveMagnitude = stepY * 1.2; // 波の振幅（Y方向のずれ幅）
        const waveDensity = 0.1; // 波の密度（空間的な周波数）

        // 縦方向の繰り返し (画面下部から上部へ)
        for (let j = 0; j < rows; j++) {
            // Y座標に基づくアニメーションオフセットを計算
            // p.sin() は p を使用
            const timeOffset = currentBeat * waveSpeed;
            const positionOffset = j * waveDensity;
            const waveOffset = p.sin(timeOffset + positionOffset) * waveMagnitude;

            // 横方向の繰り返し
            for (let i = -1; i < cols; i++) {

                let centerX = i * stepX;
                // 描画開始Y座標 + 行の間隔 + アニメーションオフセット
                // tex.height を使用
                let centerY = tex.height * this.BASE_Y_START_RATIO + j * stepY + waveOffset;

                let radiusW = baseRadius;
                // 奇数行 (j=1, 3...) のみY方向の半径を小さくする（オリジナルコードの動作）
                let radiusH = baseRadius * (j % 2 == 0 ? 1 : 0.85);

                // 奇数行 (j=1, 3, 5...) はX座標を半ステップずらす
                if (j % 2 === 1) {
                    centerX += baseRadius;
                }

                // 青海波の基本ユニットを描画 (tex を渡す)
                this.drawSeigaihaUnit(tex, centerX, centerY, radiusW, radiusH);
            }
        }

        tex.pop();
    }
}