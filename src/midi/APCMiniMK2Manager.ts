// src/midi/APCMiniMK2Manager.ts

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
 * APC Mini MK2 MIDIコントローラーを管理するクラス
 * MIDIManagerクラスを拡張し、APC Mini MK2の特定の機能を実装します。
 */
export class APCMiniMK2Manager extends MIDIManager {
    // グリッドの状態
    public gridRadioState: number[];

    // フェーダー関連の状態
    public faderValues: number[];
    private faderValuesPrev: number[];
    public faderButtonToggleState: number[];

    // サイドボタンの状態
    public sideButtonToggleState: number[];
    public sideButtonRadioNum: number;

    constructor() {
        super();

        this.gridRadioState = new Array(8).fill(0);
        this.faderValues = new Array(9).fill(0);
        this.faderValuesPrev = new Array(9).fill(1);
        this.faderButtonToggleState = new Array(9).fill(0);
        this.sideButtonToggleState = new Array(8).fill(0);
        this.sideButtonRadioNum = 0;

        // MIDIメッセージ受信ハンドラを上書き
        this.onMidiMessageCallback = this.handleMIDIMessage.bind(this);
    }

    /**
     * フレームごとの更新処理を行うメソッド
     * MIDIコントローラーのLEDなどを更新する役割を担います。
     */
    public update(index : number): void {
        this.midiOutputSend(index);
    }

    /**
     * MIDIメッセージを受信した際の処理
     * @param message 受信したMIDIメッセージ
     */
    private handleMIDIMessage(message: WebMidi.MIDIMessageEvent): void {
        const [status, data1, data2] = message.data;
        const velocity = data2;

        // フェーダーボタンの処理
        if (status === MIDI_STATUS.NOTE_ON && (
            (data1 >= NOTE_RANGES.FADER_BUTTONS.START && data1 <= NOTE_RANGES.FADER_BUTTONS.END) ||
            data1 === NOTE_RANGES.FADER_BUTTON_8
        )) {
            const index = (data1 >= NOTE_RANGES.FADER_BUTTONS.START) ? data1 - NOTE_RANGES.FADER_BUTTONS.START : 8;
            if (velocity > 0) {
                this.faderButtonToggleState[index] = 1 - this.faderButtonToggleState[index];
                this.updateFaderValue(index);
            }
        }
        // サイドボタンの処理
        else if (status === MIDI_STATUS.NOTE_ON && data1 >= NOTE_RANGES.SIDE_BUTTONS.START && data1 <= NOTE_RANGES.SIDE_BUTTONS.END) {
            const index = data1 - NOTE_RANGES.SIDE_BUTTONS.START;
            if (velocity > 0) {
                this.sideButtonToggleState[index] = 1 - this.sideButtonToggleState[index];
                this.sideButtonRadioNum = index; // ラジオボタンの状態を更新
            }
        }
        // グリッドボタンの処理
        else if ((status === MIDI_STATUS.NOTE_ON || status === MIDI_STATUS.NOTE_OFF) && data1 >= NOTE_RANGES.GRID.START && data1 <= NOTE_RANGES.GRID.END) {
            if (velocity > 0) {
                const row = Math.floor(data1 / 8);
                const col = data1 % 8;
                this.gridRadioState[col] = 7 - row; // p5.jsの描画と合わせるため、行を反転
            }
        }
        // フェーダーの処理
        else if (status === MIDI_STATUS.CONTROL_CHANGE && data1 >= NOTE_RANGES.FADERS.START && data1 <= NOTE_RANGES.FADERS.END) {
            const index = data1 - NOTE_RANGES.FADERS.START;
            const normalizedValue = data2 / 127;
            this.faderValuesPrev[index] = normalizedValue;
            this.updateFaderValue(index);
        }
    }

    /**
     * フェーダー値を更新するメソッド
     * @param index フェーダーのインデックス
     */
    private updateFaderValue(index: number): void {
        this.faderValues[index] = this.faderButtonToggleState[index] ? 1 : this.faderValuesPrev[index];
    }

    /**
     * MIDI出力を送信するメソッド
     */
    private midiOutputSend(index : number = 0): void {
        if (!this.midiSuccess) return;

        // フェーダーボタンの状態を送信
        this.faderButtonToggleState.forEach((state, i) => {
            const midiNote = i < 8 ? 100 + i : 122;
            // `sendMessage` メソッドを使ってメッセージを送信
            this.sendMessage([MIDI_STATUS.NOTE_ON, midiNote, state * 127]);
        });

        // サイドボタンの状態を送信（ラジオボタンとして動作）
        for (let i = 0; i < 8; i++) {
            const midiNote = 112 + i;
            const state = this.sideButtonRadioNum === i ? 127 : 0;
            this.sendMessage([MIDI_STATUS.NOTE_ON, midiNote, state]);
        }

        // グリッドの状態を送信
        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                const midiNote = col + (7 - row) * 8;
                const state = this.gridRadioState[col] === row ? (index == col ? 0.9 : 1.0) : 0;
                this.sendMessage([MIDI_STATUS.NOTE_ON, midiNote, Math.round(state * 127)]);
            }
        }

        // フェーダー値の送信
        this.faderValues.forEach((value, i) => {
            this.sendMessage([MIDI_STATUS.CONTROL_CHANGE, NOTE_RANGES.FADERS.START + i, Math.round(value * 127)]);
        });
    }
}