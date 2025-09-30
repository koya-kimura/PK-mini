// src/managers/SceneManager.ts (デバッグ対応版)

import p5 from 'p5'

// APCMiniMK2Manager の代わりに APCMiniMK2Sequencer を使用
import { APCMiniMK2Sequencer } from '../midi/APCMiniMK2Sequencer';
import { BPMManager } from '../rhythm/BPMManager';
import { SunnyMotion } from './sunnyMotion';
import { CloudMotion } from './cloudMotion';
import { SushiMotion } from './sushiMotion';
import { WaveMotion } from './waveMotion';
import { UmbrellaMotion } from './umbrellaMotion';
import { ThunderMotion } from './thunderMotion';

export class SceneManager {
    // クラス名を APCMiniMK2Sequencer に変更
    private midiSequencer: APCMiniMK2Sequencer;
    private bpmManager: BPMManager;
    private sunnyMotion: SunnyMotion;
    private cloudMotion: CloudMotion;
    private sushiMotion: SushiMotion;
    private waveMotion: WaveMotion;
    private umbrellaMotion: UmbrellaMotion;
    private thunderMotion: ThunderMotion;
    private p: p5;

    // 現在のステップ（0-7）を保持
    private currentStep: number = 0;

    constructor(p: p5) {
        this.p = p;
        // Sequencer のインスタンス化
        this.midiSequencer = new APCMiniMK2Sequencer();
        this.bpmManager = new BPMManager();
        this.sunnyMotion = new SunnyMotion(p);
        this.cloudMotion = new CloudMotion(p);
        this.sushiMotion = new SushiMotion(p);
        this.waveMotion = new WaveMotion(p);
        this.umbrellaMotion = new UmbrellaMotion(p);
        this.thunderMotion = new ThunderMotion(p);
    }

    /**
     * 毎フレームの更新処理
     */
    update(): void {
        this.bpmManager.update();

        this.currentStep = this.p.floor(this.bpmManager.getBeat()) % 8;
        this.midiSequencer.update(this.currentStep);

        // this.midiSequencer.getSequenceValue(i, this.currentStep);

        this.p.background(0);

        this.sunnyMotion.update(1, this.bpmManager.getBeat());
        this.waveMotion.update(1, this.bpmManager.getBeat());
        this.cloudMotion.update(1, this.bpmManager.getBeat());
        this.umbrellaMotion.update(1, this.bpmManager.getBeat());
        this.sushiMotion.update(1, this.bpmManager.getBeat());
        this.thunderMotion.update(1, this.bpmManager.getBeat());

        // this.sunnyMotion.update(this.midiSequencer.getSequenceValue(0, this.currentStep), this.bpmManager.getBeat());
        // this.waveMotion.update(this.midiSequencer.getSequenceValue(3, this.currentStep), this.bpmManager.getBeat());
        // this.cloudMotion.update(this.midiSequencer.getSequenceValue(1, this.currentStep), this.bpmManager.getBeat());
        // this.umbrellaMotion.update(this.midiSequencer.getSequenceValue(4, this.currentStep), this.bpmManager.getBeat());
        // this.sushiMotion.update(this.midiSequencer.getSequenceValue(2, this.currentStep), this.bpmManager.getBeat());
        // this.thunderMotion.update(this.midiSequencer.getSequenceValue(5, this.currentStep), this.bpmManager.getBeat());
    }

    /**
     * テンポ設定
     */
    tapTempo(): void {
        this.bpmManager.tapTempo();
    }

    /**
     * デバッグ情報を画面に表示する
     * @param sequenceValue update()で取得した現在のシーケンス値
     */
    private drawDebugInfo(sequenceValue: number): void {
        const p = this.p;
        p.push();
        p.textAlign(p.LEFT, p.TOP);
        p.textSize(16);
        p.fill(255);
        p.noStroke();

        let debugText = "--- MIDI / SEQUENCER DEBUG ---\n";
        debugText += `MIDI Connected: ${this.midiSequencer.midiSuccess ? "✅ YES" : "❌ NO"}\n`;
        debugText += `BPM: ${this.p.nf(this.bpmManager.getBPM(), 0, 2)}\n`;
        debugText += `Current Step: ${this.currentStep + 1} / 8\n`;
        debugText += `Selected Pattern: ${this.midiSequencer.sideButtonRadioNum + 1} / 8\n`;
        debugText += `Sequence Value (0-7): ${sequenceValue}\n`;
        debugText += "------------------------------\n";

        // 全フェーダーの値（0-8）を表示
        debugText += "Faders:\n";
        this.midiSequencer.faderValues.forEach((val, i) => {
            debugText += ` Fader ${i + 1}: ${p.nf(val, 0, 2)}${i === 8 ? " (Master)" : ""}\n`;
        });

        // 全8パターンの現在のステップの値（デバッグ用）
        debugText += "\nAll Pattern Values (Current Step):\n";
        for (let i = 0; i < 8; i++) {
            const val = this.midiSequencer.getSequenceValue(i, this.currentStep);
            debugText += ` P${i + 1}: ${val}${i < 7 ? " | " : ""}`;
        }

        p.text(debugText, 10, 10);
        p.pop();
    }
}