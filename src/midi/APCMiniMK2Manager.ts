// --------------------------------------------------------------
// APCMiniMK2Manager
// APC Mini MK2 の生 MIDI 入力を監視し、フェーダーやボタン状態を標準化する基底クラス。
// LED などの出力処理は派生クラス (Sequencer) に委ねる。
// --------------------------------------------------------------

import { MIDIManager } from "./midiManager";

// マジックナンバーを定数として定義
const MIDI_STATUS = {
    NOTE_ON: 0x90,
    NOTE_OFF: 0x80,
    CONTROL_CHANGE: 0xB0,
};

const NOTE_RANGES = {
    GRID: { START: 0, END: 63 },
    FADER_BUTTONS: { START: 100, END: 107 },
    SIDE_BUTTONS: { START: 112, END: 119 },
    FADERS: { START: 48, END: 56 },
    SCENE_LAUNCH: 82,
    SOLO_CUE: 83,
    SHIFT: 98,
    STOP_ALL_CLIPS: 99,
    FADER_BUTTON_8: 122,
};

/**
 * APC Mini MK2 MIDIコントローラーを管理する基底クラス
 * 外部デバイスの状態管理のみを行い、LED出力は継承先の Sequencer に完全に委譲します。
 */
export class APCMiniMK2Manager extends MIDIManager {

    public faderValues: number[];
    private faderValuesPrev: number[];
    public faderButtonToggleState: number[];
    private faderRandomModeActive: boolean[];
    public sideButtonToggleState: number[];
    public sideButtonRadioNum: number;
    private readonly FADER_RANDOM_TRIGGER_PROB = 0.05;

    constructor() {
        super();
    this.faderValues = new Array(9).fill(0);
    this.faderValuesPrev = new Array(9).fill(0);
        this.faderButtonToggleState = new Array(9).fill(0);
        this.faderRandomModeActive = new Array(9).fill(false);
        this.sideButtonToggleState = new Array(8).fill(0);
        this.sideButtonRadioNum = 0;
        this.onMidiMessageCallback = this.handleMIDIMessage.bind(this);
    }

    /**
     * フレームごとの更新処理。MIDI出力をしないように変更しました。
     */
    public update(_index?: number): void {
        // フェーダーボタン押下中はランダムにフェーダー値を揺らす。
        for (let i = 0; i < this.faderRandomModeActive.length; i++) {
            if (this.faderRandomModeActive[i]) {
                // 低確率で 1→0 を行き来させて、押し込み中のパルス感を演出する。
                if (Math.random() < this.FADER_RANDOM_TRIGGER_PROB) {
                    this.faderValues[i] = 1;
                    continue;
                }

                if (Math.random() < this.FADER_RANDOM_TRIGGER_PROB) {
                    this.faderValues[i] = 0;
                }
            } else {
                this.faderValues[i] = this.faderValuesPrev[i];
            }
        }
    }

    /**
     * MIDIメッセージを受信した際の処理（入力処理のみ）
     */
    protected handleMIDIMessage(message: WebMidi.MIDIMessageEvent): void {
        const [status, data1, data2] = message.data;
        const velocity = data2;

        // フェーダーボタンの処理 (入力)
        if ((status === MIDI_STATUS.NOTE_ON || status === MIDI_STATUS.NOTE_OFF) && (
            (data1 >= NOTE_RANGES.FADER_BUTTONS.START && data1 <= NOTE_RANGES.FADER_BUTTONS.END) ||
            data1 === NOTE_RANGES.FADER_BUTTON_8
        )) {
            const index = (data1 >= NOTE_RANGES.FADER_BUTTONS.START) ? data1 - NOTE_RANGES.FADER_BUTTONS.START : 8;
            if (velocity > 0) {
                this.faderRandomModeActive[index] = !this.faderRandomModeActive[index];
                this.faderButtonToggleState[index] = this.faderRandomModeActive[index] ? 1 : 0;

                if (!this.faderRandomModeActive[index]) {
                    this.updateFaderValue(index);
                }
            }
        }

        // サイドボタンの処理 (入力)
        else if (status === MIDI_STATUS.NOTE_ON && data1 >= NOTE_RANGES.SIDE_BUTTONS.START && data1 <= NOTE_RANGES.SIDE_BUTTONS.END) {
            const index = data1 - NOTE_RANGES.SIDE_BUTTONS.START;
            if (velocity > 0) {
                this.sideButtonRadioNum = index;
                this.sideButtonToggleState.fill(0);
                this.sideButtonToggleState[index] = 1;
            }
        }

        // フェーダーの処理 (入力)
        else if (status === MIDI_STATUS.CONTROL_CHANGE && data1 >= NOTE_RANGES.FADERS.START && data1 <= NOTE_RANGES.FADERS.END) {
            const index = data1 - NOTE_RANGES.FADERS.START;
            const normalizedValue = data2 / 127;
            this.faderValuesPrev[index] = normalizedValue;
            this.updateFaderValue(index);
        }
    }

    protected updateFaderValue(index: number): void {
        if (!this.faderRandomModeActive[index]) {
            this.faderValues[index] = this.faderValuesPrev[index];
        }
    }

    /**
     * MIDI出力を送信するメソッド (APCMiniMK2Managerでは処理を行わない)
     */
    protected midiOutputSendControls(): void {
        // 意図的に空にする。
    }
}