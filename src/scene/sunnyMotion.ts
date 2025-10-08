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
     * @param tex 描画書き込み先の p5.Graphics インスタンス。
     * @param sequenceValue シーケンスの値。0より大きければ描画します。
     * @param beat 現在のビート値 (描画自体には使用されていません)。
     */
    update(tex: p5.Graphics, sequenceValue: number, beat: number): void {
        const p = this.p; // p5 環境に依存する関数（map, colorなど）のために保持
        const shouldShow = sequenceValue > 0;

        // sequenceValue が 0 以下の場合、描画をスキップ
        if (!shouldShow) {
            return;
        }

        // 描画パラメータの定義
        // p.frameCount * 0.002 は回転速度
        const rotationOffset = -p.frameCount * 0.002;
        // tex の幅よりも大きな半径で tex 全体を覆う
        const drawingRadius = tex.width * 1.5;

        // tex に描画を開始
        tex.push();
        // 描画の中心を tex の下辺の中央に設定
        tex.translate(tex.width / 2, tex.height);
        // 線の描画を無効にする
        tex.noStroke();

        for (let i = 0; i < this.SEGMENT_COUNT; i++) {
            // 各セグメントの開始角度と終了角度を計算
            // TAU は p5.js の定数なので p を使用
            const startAngle = p.map(i, 0, this.SEGMENT_COUNT, 0, p.TAU) + rotationOffset;
            const endAngle = p.map((i + 1), 0, this.SEGMENT_COUNT, 0, p.TAU) + rotationOffset;

            // 交互に色を設定 (5: 濃いグレー, 10, 10, 25: 濃い青)
            // p.color() も p を使用
            const segmentColor = p.color(10, 10, 25);

            // tex に色を設定
            tex.fill(segmentColor);

            // 扇形を描画
            if(i % 2 === 0){
                tex.arc(0, 0, drawingRadius * 2, drawingRadius * 2, startAngle, endAngle);
            }
        }
        tex.pop();
        // tex への描画を終了
    }
}