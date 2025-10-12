// --------------------------------------------------------------
// BPMManager
// 進行中の BPM をもとに連続ビート値を算出し、タップテンポによる変更も受け付ける。
// シーン全体のタイミングを司るので、SceneManager から毎フレーム update() が呼ばれる。
// --------------------------------------------------------------

/**
 * BPM（Beats Per Minute）に基づいてカウントを管理するクラス。
 * タップテンポ機能も備えています。
 */
export class BPMManager {
    private bpm: number;
    private interval: number;
    private lastUpdateTime: number;
    private elapsed: number;
    private beatCount: number;
    private isPlaying: boolean;
    private isBeatUpdated: boolean = false;

    private pendingBPM: number | null = null;
    private pendingBPMChange: boolean = false;

    private tapTimes: number[] = [];
    private readonly TAP_HISTORY_SIZE: number = 4;
    private readonly TAP_TIMEOUT: number = 2000;

    constructor(initialBPM: number = 120) {
        this.bpm = initialBPM;
        this.interval = 60000 / initialBPM;
        this.beatCount = 0;
        this.isPlaying = false;
        this.lastUpdateTime = 0;
        this.elapsed = 0;

        this.start();
    }

    // --- BPM管理機能 ---

    public setBPM(newBPM: number): void {
        if (newBPM !== this.bpm) {
            this.pendingBPM = newBPM;
            this.pendingBPMChange = true;
            console.log(`BPM change to ${newBPM} scheduled for the next beat.`);
        }
    }

    public start(): void {
        if (!this.isPlaying) {
            this.isPlaying = true;
            this.lastUpdateTime = performance.now();
            this.beatCount = 0;
            console.log("BPM Manager started.");
        }
    }

    public stop(): void {
        this.isPlaying = false;
        console.log("BPM Manager stopped.");
    }

    public update(): void {
        const currentTime = performance.now();
        if (!this.isPlaying) {
            this.isBeatUpdated = false;
            return;
        }

        const delta = currentTime - this.lastUpdateTime;
        this.elapsed += delta;
        this.lastUpdateTime = currentTime;

        this.isBeatUpdated = false;

        if (this.elapsed >= this.interval) {
            const beatIncrements = Math.floor(this.elapsed / this.interval);
            this.beatCount += beatIncrements;
            this.elapsed %= this.interval;

            if (this.pendingBPMChange && this.pendingBPM !== null) {
                this.bpm = this.pendingBPM;
                this.interval = 60000 / this.bpm;
                this.pendingBPM = null;
                this.pendingBPMChange = false;
                console.log(`BPM successfully changed to ${this.bpm}`);
            }

            this.isBeatUpdated = true;
        }
    }

    /**
     * 現在のビートを連続的な値で取得します。
     * 例：ビート0の開始時: 0.0, ビート0の途中: 0.5, ビート1の開始時: 1.0
     * @returns ビートの連続値（整数部がビートカウント、小数部が進捗度）
     */
    public getBeat(): number {
        return this.beatCount + (this.elapsed / this.interval);
    }

    /**
     * update()がビート更新を検知したかどうかを返します。
     * @returns ビートが更新された場合にtrue、それ以外はfalse
     */
    public isBeatUpdatedNow(): boolean {
        return this.isBeatUpdated;
    }

    public getBPM(): number {
        return this.bpm;
    }

    // --- タップテンポ機能 ---

    public tapTempo(): void {
        const currentTime = performance.now();
        if (this.tapTimes.length > 0 && currentTime - this.tapTimes[this.tapTimes.length - 1] > this.TAP_TIMEOUT) {
            console.log('Tap tempo history reset due to timeout.');
            this.tapTimes = [];
        }
        this.tapTimes.push(currentTime);
        if (this.tapTimes.length > this.TAP_HISTORY_SIZE) {
            this.tapTimes.shift();
        }
        if (this.tapTimes.length >= 2) {
            this.calculateBPMFromTaps();
        }
    }

    private calculateBPMFromTaps(): void {
        if (this.tapTimes.length < 2) return;
        const intervals: number[] = [];
        for (let i = 1; i < this.tapTimes.length; i++) {
            intervals.push(this.tapTimes[i] - this.tapTimes[i - 1]);
        }
        const sum = intervals.reduce((a, b) => a + b, 0);
        const averageInterval = sum / intervals.length;
        const newBPM = Math.round(60000 / averageInterval);
        console.log(`Calculated new BPM: ${newBPM}`);
        this.setBPM(newBPM);
    }
}