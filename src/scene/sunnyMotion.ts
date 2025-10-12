// --------------------------------------------------------------
// SunnyMotion
// キャンバス下端を中心としたサンバースト背景を生成する。
// シーケンサーの値に応じて扇形の出方や半径アニメーションを切り替える。
// --------------------------------------------------------------

import p5 from 'p5'
import { Easing } from '../utils/easing';
import { ColorPalette } from '../utils/colorPalette';

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
        const p = this.p;
        const colorBase = ColorPalette.scenes.sunny.base;
        const colorHighlight = ColorPalette.scenes.sunny.highlight;

        // 描画パラメータの定義
        // p.frameCount * 0.002 は回転速度
        const rotationOffset = beat * 0.05;
        // tex の幅よりも大きな半径で tex 全体を覆う
        const drawingRadius = tex.width * 0.8;

        // tex に描画を開始
        p.push();
        // beatが有効な数値であることを確認し、安全なシード値を生成
        const safeBeat = isNaN(beat) ? 0 : beat;
        const seedValue = Math.floor(Math.abs(safeBeat * 17692)) % 89731;
        p.randomSeed(seedValue);
        tex.push();
        // 描画の中心を tex の下辺の中央に設定
        tex.translate(tex.width / 2, tex.height);
        // 線の描画を無効にする
        tex.noStroke();

        // showType: 表示パターンを制御 (none/random/sequence)
        // ここでシーケンサー値をモードに読み替えておくことで、後段の判定を見通しよくする。
        let showType = "all";
        if (sequenceValue == 0) showType = "none";
        if (sequenceValue == 1) showType = "random";
        if (sequenceValue == 2) showType = "sequence";

        // moveType: 半径アニメーションの種類 (静止 / 全体脈動 / 波打ち)
        // 半径の伸縮パターンを後段の switch で切り替えるためのキーワード。
        let moveType = "none";
        if (sequenceValue == 4) moveType = "all";
        if (sequenceValue == 5) moveType = "wave";

        for (let i = 0; i < this.SEGMENT_COUNT; i++) {
            // 各セグメントの開始角・終了角を決定。jitter 的に回転オフセットを加えることで全体がゆっくり回転して見える。
            const startAngle = p.map(i, 0, this.SEGMENT_COUNT, 0, p.TAU) + rotationOffset;
            const endAngle = p.map((i + 1), 0, this.SEGMENT_COUNT, 0, p.TAU) + rotationOffset;

            // 表示判定に使うフラグ群。条件を分解しておくと視覚的に挙動を追いやすい。
            const isNoneShow = showType != "none";
            const isHalfShow = i % 2 == 0;
            const isRandomShow = showType == "random" ? p.random() < 0.5 : true;
            const isSequenceShow = showType == "sequence" ? p.floor(beat * 2) % p.floor(this.SEGMENT_COUNT/2) == p.floor(i/2) : true

            let radiusScale = 1.0;
            switch (moveType) {
                case "all":
                    // 全体脈動: ビートに合わせて扇の長さを同期的に伸縮させる。
                    radiusScale = p.map(Easing.easeInOutQuart(p.abs((beat) % 2 - 1)), 0, 1, 0.5, 1.0);
                    break;
                case "wave":
                    // 波打ち: セグメントごとに位相をずらしたサイン波で揺らす。
                    radiusScale = 0.75 + 0.25 * p.sin(i + beat * 3);
                    break;
            }

            // シーケンサー値が0以上ならハイライト色を適用。偶数番セグメントのみ色を変えてリズムを強調する。
            const segmentHex = (sequenceValue >= 0 && isHalfShow)
                ? colorHighlight
                : colorBase;
            tex.fill(segmentHex);

            // 扇形を描画
            if (isNoneShow && isRandomShow && isSequenceShow){
                // 半径倍率を掛けた円弧を描画し、連続する扇形としてサンバーストを形成する。
                tex.arc(0, 0, drawingRadius * 2 * radiusScale, drawingRadius * 2 * radiusScale, startAngle, endAngle);
            }
        }
        tex.pop();
        p.pop();
    }
}