// src/midi/midiManager.ts

/**
 * MIDIデバイスの管理を行うクラス
 * MIDIの入出力の初期化、メッセージの処理を担当します。
 */
export class MIDIManager {
    private midiOutput: WebMidi.MIDIOutput | null = null;
    public midiSuccess: boolean = false;
    private readonly MIDI_ACCESS_DELAY: number = 1000; // 1秒の遅延

    // MIDIメッセージ受信時に実行されるコールバック関数
    public onMidiMessageCallback: ((message: WebMidi.MIDIMessageEvent) => void) | null = null;

    /**
     * コンストラクタ
     * インスタンス生成時にMIDIデバイスの初期化を開始します。
     */
    constructor() {
        this.initializeMIDIDevices();
    }

    /**
     * MIDIデバイスの初期化を行うメソッド
     * Web MIDI APIを使用してMIDIアクセスをリクエストします。
     */
    private async initializeMIDIDevices(): Promise<void> {
        // 1秒の遅延
        await new Promise(resolve => setTimeout(resolve, this.MIDI_ACCESS_DELAY));

        if (!navigator.requestMIDIAccess) {
            console.error("Web MIDI API is not supported in this browser.");
            return;
        }

        try {
            const midiAccess = await navigator.requestMIDIAccess();
            this.onMIDISuccess(midiAccess);
        } catch (error) {
            this.onMIDIFailure(error);
        }
    }

    /**
     * MIDI接続成功時の処理
     * @param midiAccess MIDIAccessインターフェースのインスタンス
     */
    private onMIDISuccess(midiAccess: WebMidi.MIDIAccess): void {
        const inputs = Array.from(midiAccess.inputs.values());
        const input = inputs[0];

        if (!input) {
            console.log("MIDI device not found");
            this.midiSuccess = false;
            return;
        }

        try {
            console.log("MIDI device ready!");
            console.log("Manufacturer:", input.manufacturer);
            console.log("Input:", input.name);

            // MIDIメッセージ受信時のハンドラを設定
            input.onmidimessage = this.onMIDIMessage.bind(this);

            const outputs = Array.from(midiAccess.outputs.values());
            if (outputs.length > 0) {
                this.midiOutput = outputs[0];
                console.log("MIDI output port:", this.midiOutput.name);
                this.midiSuccess = true;
            } else {
                console.log("MIDI output port not found");
                this.midiSuccess = false;
            }
        } catch (error) {
            console.error("MIDI device access error:", error);
            this.midiSuccess = false;
        }
    }

    /**
     * MIDI接続失敗時の処理
     * @param error エラーオブジェクト
     */
    private onMIDIFailure(error: any): void {
        console.error("MIDI access failed. -", error);
        this.midiSuccess = false;
    }

    /**
     * MIDIメッセージ受信時のハンドラ
     * @param message MIDIメッセージイベント
     */
    private onMIDIMessage(message: WebMidi.MIDIMessageEvent): void {
        // 外部から設定されたコールバックがあれば実行
        if (this.onMidiMessageCallback) {
            this.onMidiMessageCallback(message);
        }
    }

    /**
     * MIDI出力ポートにメッセージを送信
     * @param message 送信するMIDIメッセージのバイト配列
     */
    public sendMessage(message: number[]): void {
        if (this.midiSuccess && this.midiOutput) {
            this.midiOutput.send(message);
        }
    }
}