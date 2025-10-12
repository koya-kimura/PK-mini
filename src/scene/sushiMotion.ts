// --------------------------------------------------------------
// SushiMotion
// 皿に乗った寿司を複数パターンでアニメーションさせるシーン。
// コンベア風の流れから渦まで、シーケンサー値ごとに挙動を切り替える。
// --------------------------------------------------------------

import p5 from 'p5'
// 外部のユーティリティクラスをインポート
import { Easing } from '../utils/easing';
import { ColorPalette } from '../utils/colorPalette';

type SushiPalette = typeof ColorPalette.scenes.sushi;
type NetaPalette = SushiPalette['neta'];
type NetaKey = keyof NetaPalette;

/**
 * 画面を流れる寿司の列の描画を管理するクラス。
 */
export class SushiMotion {
    private p: p5;
    private readonly palette: SushiPalette = ColorPalette.scenes.sushi;
    private readonly netaPalette: NetaPalette = ColorPalette.scenes.sushi.neta;

    // 定数定義
    private readonly SUSHI_COUNT = 10;     // 画面内に表示される寿司の基準個数
    private readonly BUFFERED_COUNT = 12;  // Seq 6/7で使用: 画面外描画用のバッファを含めた総個数
    private readonly SCATTER_COUNT = 20;   // ランダム散布時に利用する最大寿司数
    private readonly GRID_ROWS = 9;        // タイポグリッドの縦行数
    private readonly GRID_COLS = 16;       // タイポグリッドの横列数
    private readonly BEAT_SEED_MULTIPLIER = 41270; // ビートごとの乱数シード算出に利用
    private readonly STRIPE_COUNT = 5;     // マグロ/サーモンのストライプ本数

    // --- アニメーション速度/時間 ---
    private readonly GRID_ANIM_SPEED = 0.5;

    constructor(p: p5) {
        this.p = p;
    }

    // 寿司のネタの定義
    private readonly NETA_TYPES = {
        MAGURO: 'maguro',
        SALMON: 'salmon',
        TAMAGO: 'tamago',
    } as const;

    /**
     * 寿司の列を更新・描画します。
     * sequenceValue の行ごとに以下の挙動を切り替える:
     * 1: 水平コンベア, 2: 回転寿司, 3: グリッド, 4: ビート交換, 5: ランダム散布,
     * 6: 縦一列エレベータ, 7: 渦巻き。
     */
    /**
     * tex: シーン合成用の p5.Graphics。ここに寿司を全部描き込んで SceneManager が合成する。
     * sequenceValue: APC Mini のパッド番号に対応したモーション切り替え値。
     * currentBeat: BPMManager からの連続拍。小数部を ease/loop に流用する。
     */
    update(tex: p5.Graphics, sequenceValue: number, currentBeat: number): void {
        const p = this.p;

        // 0: 寿司を表示しない。
    if (sequenceValue === 0) return;

        const beatFloor = p.floor(currentBeat);

        // シードは、ネタ切り替え以外でのみ設定
        // これにより同じビート内ではネタが暴れず、拍頭でだけ切り替わる。
        if (sequenceValue !== 3) {
            p.randomSeed(beatFloor * this.BEAT_SEED_MULTIPLIER);
        }

        // --- パラメータ設定 ---
    const centerX = tex.width / 2;

    // シーケンスごとに必要となる寿司数を決定。グリッド/散布などで大きく変動する。
    let totalSushiCount: number;
        if (sequenceValue === 1 || sequenceValue === 2) {
            totalSushiCount = this.SUSHI_COUNT;
        } else if (sequenceValue === 3) {
            totalSushiCount = this.GRID_ROWS * this.GRID_COLS;
        } else if (sequenceValue === 4) {
            totalSushiCount = 2;
        } else if (sequenceValue === 5 || sequenceValue === 7) {
            totalSushiCount = this.SCATTER_COUNT;
        } else if (sequenceValue === 6) {
            totalSushiCount = this.BUFFERED_COUNT; // 画面外描画のために12個使用
        } else {
            return;
        }

        // --- 🍣 スケール計算 ---
    const referenceSushiScale = p.min(tex.width, tex.height) / 6.5; // 画面比が変わってもおおよそ同サイズ

        // 描画
        for (let i = 0; i < totalSushiCount; i++) {
            let positionX: number | undefined, positionY: number | undefined;
            let netaType: string = this.NETA_TYPES.MAGURO;
            let sushiScale = referenceSushiScale;
            let currentRot = 0;
            let scaleX = 1.0;

            const beatFrac = p.fract(currentBeat); // 0〜1: 現在ビート内の進行度

            // --- 配置と移動のロジック ---
            if (sequenceValue === 1) {
                // 1: 横に流れる (コンベア、画面中央)
                // frameCount を利用し、常に一定速度で右方向へ流す。beat同期ではなく常時モーション。
                const flowDirection = 1;
                const speed = 2.0;
                const drawingRange = tex.width * 1.5;
                const baseSpacing = drawingRange / this.SUSHI_COUNT;
                const horizontalMovement = p.frameCount * speed * flowDirection;
                const startOffsetX = tex.width * 0.25;

                positionX = (i * baseSpacing + horizontalMovement) % drawingRange - startOffsetX;
                if (positionX < -startOffsetX) positionX += drawingRange;
                positionY = tex.height / 2;

                p.randomSeed(beatFloor * this.BEAT_SEED_MULTIPLIER + i * 123);
                netaType = p.random(Object.values(this.NETA_TYPES));

            } else if (sequenceValue === 2) {
                // 2: 円形に回る (回転寿司)
                // 画面中央に大きな回転テーブルを想定。Y 方向は楕円にして奥行き表現。
                const flowDirection = 1;
                const radius = p.min(tex.width, tex.height) * 0.35;
                const rotationSpeed = 0.05;
                const totalRotation = p.frameCount * rotationSpeed * flowDirection * p.PI / 180;
                const angle = p.TAU / this.SUSHI_COUNT * i + totalRotation;

                positionX = centerX + p.cos(angle) * radius;
                positionY = tex.height / 2 + p.sin(angle) * radius * 0.6;

                p.randomSeed(beatFloor * this.BEAT_SEED_MULTIPLIER + i * 123);
                netaType = p.random(Object.values(this.NETA_TYPES));

            } else if (sequenceValue === 3) {
                // 3: グリッド配置 (9x16) + ネタ切り替えアニメーション
                // タイポグラフィ風のマトリクス。beat に応じて列ごとにネタが滑らかに切り替わる。
                const row = p.floor(i / this.GRID_COLS);
                const col = i % this.GRID_COLS;
                const spacingX = tex.width / (this.GRID_COLS + 1);
                const spacingY = tex.height / (this.GRID_ROWS + 1);
                const startY = tex.height * 0.1;

                positionX = spacingX * (col + 1);
                positionY = startY + spacingY * row;

                const numTypes = Object.keys(this.NETA_TYPES).length;
                const normalizedIndex = (row / this.GRID_ROWS) + (col / this.GRID_COLS) * 0.5;
                const beatProgress = p.fract(currentBeat * this.GRID_ANIM_SPEED);
                const phase = p.fract(normalizedIndex + beatProgress);
                const netaIndex = p.floor(phase * numTypes);

                const netaTypesArray = Object.values(this.NETA_TYPES);
                netaType = netaTypesArray[netaIndex];

            } else if (sequenceValue === 4) {
                // 4: 2つの寿司が1ビートごとに位置を交換するアニメーション
                // 中央で向かい合って跳ねる寿司を演出。1 拍ごとに anchor を交換しながら ease で移動。
                sushiScale = referenceSushiScale * 2.4;

                const anchors = [
                    { x: centerX - tex.width * 0.22, y: tex.height * 0.58 },
                    { x: centerX + tex.width * 0.22, y: tex.height * 0.58 },
                ];

                const isEvenBeat = beatFloor % 2 === 0;
                const startAnchor = isEvenBeat ? anchors[i] : anchors[1 - i];
                const targetAnchor = isEvenBeat ? anchors[1 - i] : anchors[i];

                const easedT = Easing.easeInOutCubic(p.constrain(beatFrac, 0, 1));
                positionX = p.lerp(startAnchor.x, targetAnchor.x, easedT);
                positionY = p.lerp(startAnchor.y, targetAnchor.y, easedT);

                // 少しだけ上下に弾む動きを加える
                const bounce = (i === 0 ? 1 : -1) * (isEvenBeat ? -1 : 1) * Easing.easeInOutSine(beatFrac) * tex.height * 0.015;
                positionY += bounce;

                // ビートに合わせた呼吸するようなスケール変化
                const scalePulse = p.map(Easing.easeInOutSine(beatFrac), 0, 1, 0.94, 1.06);
                sushiScale *= scalePulse;

                netaType = i === 0 ? this.NETA_TYPES.MAGURO : this.NETA_TYPES.SALMON;

            } else if (sequenceValue === 5) {
                // 5: ランダムな位置・角度に散るアニメーション
                // beat 毎に乱数シードを変えて拡散先を決定。easeOutExpo で素早く散る。
                sushiScale = referenceSushiScale;

                p.randomSeed(beatFloor * this.BEAT_SEED_MULTIPLIER + i * 1234);

                const easedT = Easing.easeOutExpo(beatFrac);

                const targetX = p.random(tex.width * 0.05, tex.width * 0.95);
                const targetY = p.random(tex.height * 0.05, tex.height * 0.95);

                positionX = p.lerp(centerX, targetX, easedT);
                positionY = p.lerp(tex.height / 2, targetY, easedT);

                const targetRot = p.random(-p.TAU * 2, p.TAU * 2);
                currentRot = p.lerp(0, targetRot, easedT);

                const scaleTime = p.sin(beatFrac * p.PI);
                const scaleFactor = p.lerp(1.0, 1.5, scaleTime);
                sushiScale *= scaleFactor;

                p.randomSeed(beatFloor * this.BEAT_SEED_MULTIPLIER + i * 123);
                netaType = p.random(Object.values(this.NETA_TYPES));

            } else if (sequenceValue === 6) {
                // 6: 縦一列並び + 伸縮 & 縦移動 (統合版)
                // 画面外から順々に降りてくるエレベータ演出。1 段進むたびにネタ列がローテーション。

                // 1. 基本となる段の間隔 (画面全体+バッファ2個分)
                // 10個分で画面の高さを占めるようにする。
                const spacingY = tex.height / this.SUSHI_COUNT;

                // 2. 縦方向の移動 (1段分)
                const t = p.constrain(beatFrac, 0, 1); // 0から1への補間時間
                const easedT = Easing.easeInOutQuint(t); // 滑らかな移動

                // i番目の寿司の基準位置 (i=0が画面外上部)
                const basePosition = -spacingY;

                // 現在の段 (beatFloor + i) から次の段へ移動
                const currentY = basePosition + spacingY * i;
                const nextY = basePosition + spacingY * (i + 1);

                positionX = centerX;
                // currentYからnextYへlerpで補間
                positionY = p.lerp(currentY, nextY, easedT);

                // 3. ネタの決定 (ビートごとに段全体で切り替わる)
                // i番目の寿司は、前のビートで i-1番目の位置にいた寿司のネタを継承
                // i-1 の段が持っていたネタを計算
                const netaSourceIndex = (i === 0) ? this.BUFFERED_COUNT - 1 : i - 1; // 常に1つ上の段のネタを参照
                const netaBeatFloor = beatFloor - 1;

                p.randomSeed(netaBeatFloor * this.BEAT_SEED_MULTIPLIER + netaSourceIndex * 123);
                netaType = ["maguro", "salmon", "tamago"][(p.map(i, 0, this.SUSHI_COUNT - 1, this.SUSHI_COUNT-1, 0) + p.floor(currentBeat)) % Object.values(this.NETA_TYPES).length];

                // 4. 横方向の伸縮アニメーション (最大1.5倍)
                const maxStretch = 1.5;
                const elasticProgress = (t === 0) ? 0 : Easing.easeOutExpo(t);
                scaleX = p.lerp(1.0, maxStretch, elasticProgress);

                // 5. 画面外に出た寿司は描画しない (ただしバッファ分は描画する)
                if (positionY > tex.height + spacingY || positionY < -spacingY * 2) {
                    positionY = undefined;
                    positionX = undefined;
                }
            } else if (sequenceValue === 7) {
                // 7: 大きな渦巻き状のアニメーション + 寿司自体の1拍ごとの回転
                // 盤面全体を使った螺旋エフェクト。半径はビート小数部でループする。
                const centerY = tex.height / 2;
                const maxRadius = p.min(tex.width, tex.height) * 0.6; // 渦巻きの最大半径
                const spiralSpeed = 0.05; // 渦巻きの回転速度
                const expansionSpeed = 0.02; // 渦巻きの拡大速度

                const angle = p.TAU / this.SCATTER_COUNT * i + currentBeat * spiralSpeed;
                const radius = maxRadius * p.fract(currentBeat * expansionSpeed);

                positionX = centerX + p.cos(angle) * radius;
                positionY = centerY + p.sin(angle) * radius;

                p.randomSeed(beatFloor * this.BEAT_SEED_MULTIPLIER + i * 123);
                netaType = p.random(Object.values(this.NETA_TYPES));

                const scaleTime = p.sin(beatFrac * p.PI);
                const scaleFactor = p.lerp(1.0, 1.3, scaleTime);
                sushiScale *= scaleFactor;

                // 寿司自体の1拍ごとの回転
                const rotationOffset = p.map(p.sin(beatFrac * p.TWO_PI), -1, 1, -p.QUARTER_PI, p.QUARTER_PI);
                currentRot = angle + rotationOffset;
            }


            // --- 描画 ---
            if (positionX !== undefined && positionY !== undefined) {
                this.drawSumeshi(tex, positionX, positionY, sushiScale, currentRot, scaleX);
                this.drawSushiNeta(tex, netaType, positionX, positionY, sushiScale, currentRot, scaleX);
            }
        }
    }

    /**
     * 舎利（ご飯部分）を描画します。**回転角と横方向スケールを受け取る**
     * 寿司の基礎となる角丸長方形を白で描画し、シーケンスによる拡縮を適用。
     */
    /**
     * 舟皿のライス部分。回転/スケール済みの座標系で角丸矩形を描く。
     * x,y: ワールド座標 / s: ベースサイズ / rotation: 全体の角度 / scaleX: 横方向の伸縮率。
     */
    private drawSumeshi(tex: p5.Graphics, x: number, y: number, s: number, rotation: number, scaleX: number): void {
        const p = this.p;
        tex.push();
        tex.translate(x, y);
        tex.rotate(rotation);
        tex.rectMode(p.CENTER);
        tex.noStroke();

        const sumeshiW = s * 0.7 * scaleX;
        const sumeshiH = s * 0.4;
        const sumeshiY = s * 0.4;
        const cornerRadius = s * 0.05;

        tex.fill(this.palette.rice);
        tex.rect(0, sumeshiY, sumeshiW, sumeshiH, cornerRadius);

        tex.pop();
    }

    /**
     * ネタの種類に基づいて描画関数を呼び出します。**回転角と横方向スケールを渡す**
     * 将来的にネタ毎の描画手法が増えてもこの窓口を経由する。
     */
    /**
     * ネタ描画のエントリーポイント。ネタ種類に応じたバリエーションをまとめて呼び出す。
     */
    private drawSushiNeta(tex: p5.Graphics, neta: string, x: number, y: number, s: number, rotation: number, scaleX: number): void {
        this.drawNetaShape(tex, neta, x, y, s, rotation, scaleX);
    }

    /**
     * ネタを描画します。**回転角と横方向スケールを受け取る**
     * マグロ/サーモンは縞模様、玉子は海苔帯を追加。色は `ColorPalette.scenes.sushi` から取得。
     */
    /**
     * 実際のネタ描画本体。`netaPalette` から base/stripe 色を取得し、寿司タイプごとの装飾を足す。
     */
    private drawNetaShape(tex: p5.Graphics, netaType: string, x: number, y: number, s: number, rotation: number, scaleX: number): void {
        const p = this.p;

        const netaPalette = this.netaPalette[netaType as NetaKey];
        const alpha = 255;

        const netaWidth = s * scaleX;
        const netaHeight = s * 0.3;
        const netaYOffset = s * 0.2;
        const cornerRadius = p.min(netaHeight, netaWidth) * 0.05;

        tex.push();
        tex.translate(x, y);
        tex.rotate(rotation);
        tex.rectMode(p.CENTER);
        tex.noStroke();

        // 1. ベースとなるネタの形状を描画: 角丸長方形に固定
        const baseColor = p.color(netaPalette.base);
        baseColor.setAlpha(alpha);
        tex.fill(baseColor);
        tex.rect(0, netaYOffset, netaWidth, netaHeight, cornerRadius);

        // 2. マグロとサーモンの縞模様を描画
        if ('stripe' in netaPalette && netaPalette.stripe) {
            const stripeColor = p.color(netaPalette.stripe);
            stripeColor.setAlpha(alpha);
            tex.fill(stripeColor);

            const stripeWidth = netaWidth / this.STRIPE_COUNT;
            const stripeThickness = netaWidth * 0.02 / scaleX;

            // 縞模様は等間隔。scaleX で伸ばしても縞太さが見た目一定になるよう調整。
            for (let i = 0; i < this.STRIPE_COUNT; i++) {
                const stripeX = i * stripeWidth - netaWidth / 2 + stripeWidth / 2;
                tex.rect(stripeX, netaYOffset, stripeThickness, netaHeight * 0.8);
            }
        }

        // 3. 玉子の場合のみ特殊な黒い帯を追加
        if (netaType === this.NETA_TYPES.TAMAGO) {
            const noriColor = p.color(this.palette.nori);
            noriColor.setAlpha(alpha);
            tex.fill(noriColor);
            // 玉子のみ海苔帯を追加して違いを明確化。
            tex.rect(0, netaYOffset, s * 0.2, netaHeight * 0.8);
        }

        tex.pop();
    }
}