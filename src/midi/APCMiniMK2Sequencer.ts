import { APCMiniMK2Manager } from "./APCMiniMK2Manager";

const MIDI_STATUS = {
    NOTE_ON: 0x90,
    NOTE_OFF: 0x80,
    CONTROL_CHANGE: 0xB0,
};

const NOTE_RANGES = {
    GRID: { START: 0, END: 63 },
};

const GRID_COLS = 8;
const GRID_ROWS = 8;

// APC Mini MK2 の LED カラー ベロシティ値 (マニュアル参照)
const APC_COLORS = {
    OFF: 0,
    WHITE: 3,
    RED: 5,
    AMBER: 100, // オレンジ
    YELLOW: 10,
    GREEN: 22,
    CYAN: 41, // 水色
    BLUE: 45,
    MAGENTA: 53, // 紫

    // 8つのパターンに対応する色 (P1-P8)
    PATTERN_COLORS: [
        5,  // P1: Red
        22, // P2: Green
        100,  // P3: Amber (Orange)
        45, // P4: Blue
        10, // P5: Yellow
        41, // P6: Cyan
        53, // P7: Magenta
        3,  // P8: White
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

    // --- MIDI出力 (LED制御) の拡張 ---

    /**
     * グリッドとコントロール（サイドボタン、フェーダーボタン）のLEDフィードバックを送信します。
     */
    protected sendSequencerLEDs(currentStep: number): void {
        if (!this.midiSuccess) return;

        const currentPatternIndex = this.sideButtonRadioNum;
        const currentPattern = this.sequencePatterns[currentPatternIndex];
        const gridColorBase = APC_COLORS.PATTERN_COLORS[currentPatternIndex];
        const MAX_INTENSITY_OFFSET = 124;

        // 1. グリッドの状態を送信
        for (let col = 0; col < GRID_COLS; col++) {
            const activeRow = currentPattern[col];

            for (let row = 0; row < GRID_ROWS; row++) {
                const midiNote = col + (7 - row) * 8;
                let intensity = APC_COLORS.OFF;

                // 設定されている行のボタン
                if (row === activeRow) {
                    if (col === currentStep) {
                        // 設定行 & 現在ステップ: 最強輝度 (127にクランプ)
                        intensity = gridColorBase + MAX_INTENSITY_OFFSET;
                        if (intensity > 127) { intensity = 127; }
                    } else {
                        // 設定行 & 他のステップ: 選択パターンの色で通常輝度
                        intensity = gridColorBase;
                    }
                }
                // 設定されていない行のボタン
                else if (col === currentStep) {
                    // 現在ステップのその他の行: 白で薄くハイライト
                    intensity = APC_COLORS.WHITE;
                }

                this.sendMessage([MIDI_STATUS.NOTE_ON, midiNote, intensity]);
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
            this.sendMessage([MIDI_STATUS.NOTE_ON, midiNote, colorIntensity]);
        }

        // 3. フェーダーボタンの状態を送信 (シンプルに白のトグルで維持)
        this.faderButtonToggleState.forEach((state, i) => {
            const midiNote = i < 8 ? 100 + i : 122;
            // トグルオンの場合は白の最強輝度
            const color = state ? APC_COLORS.WHITE + MAX_INTENSITY_OFFSET : APC_COLORS.OFF;
            this.sendMessage([MIDI_STATUS.NOTE_ON, midiNote, color]);
        });
    }
}