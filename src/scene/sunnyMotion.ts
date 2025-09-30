import p5 from 'p5'

/**
 * サンバースト（放射状の扇形模様）の描画を管理するクラス。
 * 画面下部を中心に回転するシンプルな背景効果を描画します。
 */
export class SunnyMotion {
    private p: p5;
    private readonly SEGMENT_COUNT = 20; // 扇形を構成するセグメントの数 (n)

    constructor(p: p5) {
        this.p = p;
    }

    /**
     * 模様の更新と描画を行います。
     * @param sequenceValue シーケンスの値。0より大きければ描画します。
     * @param beat 現在のビート値 (描画自体には使用されていません)。
     */
    update(sequenceValue: number, beat: number): void {
        const p = this.p;
        const shouldShow = sequenceValue > 0;

        // sequenceValue が 0 以下の場合、描画をスキップ
        if (!shouldShow) {
            return;
        }

        // 描画パラメータの定義
        // p.frameCount * 0.002 は回転速度
        const rotationOffset = -p.frameCount * 0.002;
        const drawingRadius = p.width * 1.5; // 画面幅よりも大きな半径で画面全体を覆う

        p.push();
        // 描画の中心を画面下辺の中央に設定
        p.translate(p.width / 2, p.height);

        for (let i = 0; i < this.SEGMENT_COUNT; i++) {
            // 各セグメントの開始角度と終了角度を計算
            const startAngle = p.map(i, 0, this.SEGMENT_COUNT, 0, p.TAU) + rotationOffset;
            const endAngle = p.map((i + 1), 0, this.SEGMENT_COUNT, 0, p.TAU) + rotationOffset;

            // 交互に色を設定 (5: 濃いグレー, 10, 10, 25: 濃い青)
            const segmentColor = i % 2 === 0
                ? p.color(5)
                : p.color(10, 10, 25);

            p.fill(segmentColor);
            // 扇形を描画
            p.arc(0, 0, drawingRadius * 2, drawingRadius * 2, startAngle, endAngle);
        }
        p.pop();
    }
}