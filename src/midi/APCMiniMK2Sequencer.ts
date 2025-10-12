// --------------------------------------------------------------
// APCMiniMK2Sequencer
// APC Mini MK2 のパッドを 8x8 ステップシーケンサーとして扱う高レベルラッパー。
// グリッド入力の状態管理と LED フィードバックの送信を担当する。
// --------------------------------------------------------------

import { APCMiniMK2Manager } from "./APCMiniMK2Manager";

const MIDI_STATUS = {
    NOTE_ON: 0x90,
    NOTE_OFF: 0x80,
    CONTROL_CHANGE: 0xB0,
    // LED出力用にチャンネル10を使用（より明るい光）
    LED_NOTE_ON: 0x99,
};

const NOTE_RANGES = {
    GRID: { START: 0, END: 63 },
};

const GRID_COLS = 8;
const GRID_ROWS = 8;

// APC Mini MK2 の LED カラー ベロシティ値 (ユーザー指定)
const APC_COLORS = {
    OFF: 0,
    WHITE: 3,

    // シーン固有の色（8パターン）
    PATTERN_COLORS: [
        5,   // P1
        60,  // P2
        56,  // P3
        53,  // P4
        45,  // P5
        37,  // P6
        32,  // P7
        21,  // P8
    ]
};

/**
 * APC Mini MK2を8パターンのシーケンサーとして機能させるためのクラス
 */
export class APCMiniMK2Sequencer extends APCMiniMK2Manager {
    /**
     * 8つのシーケンスパターンを保持する
     * sequencePatterns[パターン番号 (0-7)][カラム番号 (0-7)] = 行インデックス (0-7)
     */
    public sequencePatterns: number[][] = [];

    constructor() {
        super();
        this.initializeSequencePatterns();
    }

    private initializeSequencePatterns(): void {
        for (let i = 0; i < GRID_COLS; i++) {
            this.sequencePatterns[i] = new Array(GRID_ROWS).fill(0);
        }
    }

    // --- 公開メソッド ---

    /**
     * フレームごとの更新処理 (p5.jsのdraw()などから呼ばれる)
     * @param columnIndex 外部リズムに同期した現在のステップ（0〜7）
     * @returns 現在選択中のパターン、現在のステップで設定されている行インデックス (0〜7)
     */
    public override update(columnIndex: number): void {
        // 親クラスの update は空だが、互換性のため呼び出しは維持
        super.update();

        // グリッドとコントロールの LED フィードバックを送信 (Sequencerが全責務を持つ)
        this.sendSequencerLEDs(columnIndex);
    }

    /**
     * 指定されたパターンの、現在のステップでの値を取得します。
     */
    public getSequenceValue(patternIndex: number, columnIndex: number): number {
        if (patternIndex < 0 || patternIndex >= 8 || columnIndex < 0 || columnIndex >= GRID_COLS) {
            return 0;
        }
        return this.sequencePatterns[patternIndex][columnIndex];
    }

    // --- MIDIメッセージハンドラのオーバーライド ---

    protected override handleMIDIMessage(message: WebMidi.MIDIMessageEvent): void {
        const [status, data1, data2] = message.data;
        const velocity = data2;

        // 親クラスの処理を実行（サイドボタン、フェーダーなどの状態更新）
        super.handleMIDIMessage(message);

        // グリッドボタンの処理: シーケンスステップの値設定 (ラジオボタン動作)
        if (velocity > 0 &&
            (status === MIDI_STATUS.NOTE_ON || status === MIDI_STATUS.NOTE_OFF) &&
            data1 >= NOTE_RANGES.GRID.START && data1 <= NOTE_RANGES.GRID.END) {
            const currentPatternIndex = this.sideButtonRadioNum;
            const midiNote = data1;
            const col = midiNote % GRID_COLS;
            const row = 7 - Math.floor(midiNote / GRID_COLS); // 行を反転 (下から0, 上から7)

            this.sequencePatterns[currentPatternIndex][col] = row;
        }
    }

    public getFaderValues(): number[] {
        return this.faderValues;
    }

    /**
     * 現在選択中のパターンの全シーケンスを0に設定します
     */
    public clearCurrentPattern(): void {
        const currentPatternIndex = this.sideButtonRadioNum;
        this.sequencePatterns[currentPatternIndex].fill(0);
    }

    /**
     * 指定されたパターンの全シーケンスを0に設定します
     */
    public clearPattern(patternIndex: number): void {
        if (patternIndex >= 0 && patternIndex < 8) {
            this.sequencePatterns[patternIndex].fill(0);
        }
    }

    /**
     * LED制御専用のMIDI送信メソッド（明るさ最適化）
     */
    private sendLEDMessage(midiNote: number, intensity: number): void {
        // グリッド（パッド）用はステータスを 0x96 にする
        // サイドボタン（112-119）とフェーダーボタン（100-107 / 122）は 0x90 のままにする
        const GRID_START = NOTE_RANGES.GRID.START;
        const GRID_END = NOTE_RANGES.GRID.END;

        const isGrid = midiNote >= GRID_START && midiNote <= GRID_END;
        const isSideButton = midiNote >= 112 && midiNote <= 119;
        const isFaderButton = (midiNote >= 100 && midiNote <= 107) || midiNote === 122;

        // ベロシティ（ここでは色コードとして扱う）をそのまま送る。
        // ただし MIDI のレンジにクランプする（0-127）。
        const outIntensity = Math.min(Math.max(Math.floor(intensity), 0), 127);

        if (isGrid) {
            // Grid pads: use 0x96
            this.sendMessage([0x96, midiNote, outIntensity]);
        } else if (isSideButton || isFaderButton) {
            // Side / Fader controls: keep 0x90
            this.sendMessage([MIDI_STATUS.NOTE_ON, midiNote, outIntensity]);
        } else {
            // その他: 保守的な選択として 0x90 を使う（レビュー対象として注意）
            this.sendMessage([MIDI_STATUS.NOTE_ON, midiNote, outIntensity]);
        }
    }

    // --- MIDI出力 (LED制御) の拡張 ---

    /**
     * グリッドとコントロール（サイドボタン、フェーダーボタン）のLEDフィードバックを送信します。
     */
    protected sendSequencerLEDs(currentStep: number): void {
        if (!this.midiSuccess) return;

    const currentPatternIndex = this.sideButtonRadioNum;
    const currentPattern = this.sequencePatterns[currentPatternIndex];
    // Akai の仕様上 0-127 で輝度/色合いを指定できるため、
    // パターン色をベースに上乗せして発光量を最大化する。
    const MAX_INTENSITY_OFFSET = 124;

        // 1. グリッドの状態を送信
        for (let col = 0; col < GRID_COLS; col++) {
            const activeRow = currentPattern[col];

            for (let row = 0; row < GRID_ROWS; row++) {
                const midiNote = col + (7 - row) * 8;
                let intensity = APC_COLORS.OFF;

                // カラー優先順位:
                // 1) 実行中のセル（選択されていて進行中） -> color 52
                // 2) 選択されている行 -> color 5
                // 3) 進行中のカラム -> color 41
                // それ以外は OFF
                if (row === activeRow && col === currentStep) {
                    // 実行中のセル: パターン色（現在のパターンの色）
                    intensity = APC_COLORS.PATTERN_COLORS[currentPatternIndex];
                } else if (row === activeRow) {
                    // 選択されている行: パターン色
                    intensity = APC_COLORS.PATTERN_COLORS[currentPatternIndex];
                } else if (col === currentStep) {
                    // 進行中のカラム（実行中セル以外）: WHITE
                    intensity = APC_COLORS.WHITE;
                }

                this.sendLEDMessage(midiNote, intensity);
            }
        }

        // 2. サイドボタンの状態を送信（選択中のパターンを対応する色でハイライト）
        for (let i = 0; i < 8; i++) {
            const midiNote = 112 + i;
            let colorIntensity = APC_COLORS.OFF;

            if (this.sideButtonRadioNum === i) {
                // 選択中のパターンボタン: 対応する色で最強輝度
                colorIntensity = APC_COLORS.PATTERN_COLORS[i] + MAX_INTENSITY_OFFSET;
                if (colorIntensity > 127) {
                    colorIntensity = 127;
                }
            } else {
                // 非選択のパターンボタン: 完全に OFF
                colorIntensity = APC_COLORS.OFF;
            }
            this.sendLEDMessage(midiNote, colorIntensity);
        }

        // 3. フェーダーボタンの状態を送信 (シンプルに白のトグルで維持)
        this.faderButtonToggleState.forEach((state, i) => {
            const midiNote = i < 8 ? 100 + i : 122;
            // トグルオンの場合は白の最強輝度
            const color = state ? APC_COLORS.WHITE + MAX_INTENSITY_OFFSET : APC_COLORS.OFF;
            this.sendLEDMessage(midiNote, color);
        });
    }
}