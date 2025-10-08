import p5 from 'p5'

/**
 * 画面を流れる寿司の列の描画を管理するクラス。
 * ビートの整数部分に基づいてネタの種類を固定し、フレームごとに水平に移動させます。
 */
export class SushiMotion {
    private p: p5;

    // 定数定義
    private readonly SUSHI_COUNT = 10;     // 一度に描画する寿司の個数
    private readonly BEAT_SEED_MULTIPLIER = 41270; // 乱数シード生成用の乗数
    private readonly STRIPE_COUNT = 5; // 模様（縞）の数

    // 寿司のネタの定義
    private readonly NETA_TYPES = {
        MAGURO: 'maguro',
        SALMON: 'salmon',
        TAMAGO: 'tamago',
    } as const;

    // ネタの色定義
    private readonly NETA_COLORS = {
        [this.NETA_TYPES.MAGURO]: { base: [255, 100, 100], stripe: [255, 230, 230] }, // マグロ: ベース色と縞模様の色
        [this.NETA_TYPES.SALMON]: { base: [255, 150, 100], stripe: [255, 220, 200] }, // サーモン: ベース色と縞模様の色
        [this.NETA_TYPES.TAMAGO]: { base: [255, 255, 100] }, // 玉子
    } as const;

    constructor(p: p5) {
        this.p = p;
    }

    /**
     * 寿司の列を更新・描画します。
     * @param tex 描画書き込み先の p5.Graphics インスタンス。
     * @param sequenceValue シーケンスの値。0より大きければ描画します。
     * @param currentBeat 現在のビート値。
     */
    update(tex: p5.Graphics, sequenceValue: number, currentBeat: number): void {
        const p = this.p;
        const shouldShow = sequenceValue > 0;

        if (!shouldShow) {
            return;
        }

        const beatFloor = p.floor(currentBeat);

        // ビートの整数部分をシードとして乱数生成器を初期化し、寿司のネタをビートごとに固定する
        p.randomSeed(beatFloor * this.BEAT_SEED_MULTIPLIER);

        // 描画範囲と移動量を計算 (p.width を tex.width に変更)
        const drawingRange = tex.width * 1.5; // 寿司が流れる幅 (texの150%)
        const baseSpacing = drawingRange / this.SUSHI_COUNT; // 寿司間の基本間隔
        const horizontalMovement = p.frameCount * 2; // フレームごとの水平移動量 (速度)
        const startOffsetX = tex.width * 0.25; // 画面左側からのオフセット

        // ここでの p.push/pop は不要
        for (let i = 0; i < this.SUSHI_COUNT; i++) {
            // 寿司のX座標を計算 (画面外から画面外へループ)
            const positionX = (i * baseSpacing + horizontalMovement) % drawingRange - startOffsetX;
            const positionY = tex.height * 0.5; // tex の中央 (Y) に固定

            // 寿司のサイズを決定
            const sushiScale = drawingRange / (this.SUSHI_COUNT * 1.2);

            // ネタをランダムに決定 (p.random() は p を使用)
            const netaType = p.random(Object.values(this.NETA_TYPES));

            // 舎利とネタを描画 (tex を渡す)
            this.drawSumeshi(tex, positionX, positionY, sushiScale);
            this.drawSushiNeta(tex, netaType, positionX, positionY, sushiScale);
        }
    }

    /**
     * 舎利（ご飯部分）を描画します。
     * @param tex 描画書き込み先の p5.Graphics インスタンス。
     */
    private drawSumeshi(tex: p5.Graphics, x: number, y: number, s: number): void {
        const p = this.p;

        tex.push();
        tex.translate(x, y);
        tex.rectMode(p.CENTER); // rectMode の定数 (p.CENTER) は p を使用
        tex.noStroke();
        tex.fill(255); // 白
        // 舎利の形状 (ネタの下に位置)
        tex.rect(0, s * 0.4, s * 0.7, s * 0.4, s * 0.02, s * 0.02);
        tex.pop();
    }

    /**
     * ネタの種類に基づいて描画関数を呼び出します。
     * @param tex 描画書き込み先の p5.Graphics インスタンス。
     */
    private drawSushiNeta(tex: p5.Graphics, neta: string, x: number, y: number, s: number): void {
        switch (neta) {
            case this.NETA_TYPES.MAGURO:
                this.drawNetaShape(tex, this.NETA_TYPES.MAGURO, x, y, s);
                break;
            case this.NETA_TYPES.SALMON:
                this.drawNetaShape(tex, this.NETA_TYPES.SALMON, x, y, s);
                break;
            case this.NETA_TYPES.TAMAGO:
                this.drawNetaShape(tex, this.NETA_TYPES.TAMAGO, x, y, s);
                break;
            default:
                this.drawNetaShape(tex, this.NETA_TYPES.MAGURO, x, y, s);
                break;
        }
    }

    /**
     * マグロ、サーモン、玉子など、共通の形状を持つネタを描画します。
     * マグロとサーモンには幾何学的な模様（縞模様）を追加します。
     * @param tex 描画書き込み先の p5.Graphics インスタンス。
     */
    private drawNetaShape(tex: p5.Graphics, netaType: string, x: number, y: number, s: number): void {
        const p = this.p;

        // 色情報を取得
        const colorData = this.NETA_COLORS[netaType as keyof typeof this.NETA_COLORS];
        const baseColor = colorData.base;

        // ネタの寸法
        const netaWidth = s;
        const netaHeight = s * 0.3;
        const netaYOffset = s * 0.2;

        tex.push();
        tex.translate(x, y);
        tex.rectMode(p.CENTER); // rectMode の定数 (p.CENTER) は p を使用
        tex.noStroke();

        // 1. ベースとなるネタの形状を描画
        tex.fill(baseColor[0], baseColor[1], baseColor[2]);
        // p.min() は p を使用
        tex.rect(0, netaYOffset, netaWidth, netaHeight, p.min(netaHeight, netaWidth) * 0.05);

        // 2. マグロとサーモンの縞模様を描画
        if (netaType === this.NETA_TYPES.MAGURO || netaType === this.NETA_TYPES.SALMON) {
            const patternedColorData = colorData as { base: readonly number[], stripe: readonly number[] };
            const stripeColor = patternedColorData.stripe;

            tex.fill(stripeColor[0], stripeColor[1], stripeColor[2]);

            // 縞模様の幅
            const stripeWidth = netaWidth / this.STRIPE_COUNT;

            for (let i = 0; i < this.STRIPE_COUNT; i++) {
                // 縞模様のX座標を計算
                const stripeX = i * stripeWidth - netaWidth / 2 + stripeWidth / 2;

                // 縞模様は幅全体に広がる線として描画
                // 縞を細い矩形として描画しています
                tex.rect(stripeX, netaYOffset, stripeWidth * 0.2, netaHeight);
            }
        }

        // 3. 玉子の場合のみ特殊な黒い帯を追加
        if (netaType === this.NETA_TYPES.TAMAGO) {
            tex.fill(0); // 黒
            tex.rect(0, netaYOffset, s * 0.2, netaHeight);
        }

        tex.pop();
    }
}