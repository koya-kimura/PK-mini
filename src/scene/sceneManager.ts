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
    public midiSequencer: APCMiniMK2Sequencer;
    private bpmManager: BPMManager;
    private sunnyMotion: SunnyMotion;
    private cloudMotion: CloudMotion;
    private sushiMotion: SushiMotion;
    private waveMotion: WaveMotion;
    private umbrellaMotion: UmbrellaMotion;
    private thunderMotion: ThunderMotion;
    private p: p5;
    private drawTexture: p5.Graphics;
    private uiTexture: p5.Graphics;

    // 現在のステップ（0-7）を保持
    private currentStep: number = 0;

    constructor(p: p5) {
        this.p = p;
        this.drawTexture = p.createGraphics(p.width, p.height);
        this.uiTexture = p.createGraphics(p.width, p.height);
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

        this.drawTexture.background(0, this.p.map(this.midiSequencer.getFaderValues()[8], 0, 1, 255, 0));

        // TODO:以下のオブジェクトに関してbackgroundの透明度が適用されるように修正
        this.sunnyMotion.update(this.drawTexture, 1, this.bpmManager.getBeat());
        this.waveMotion.update(this.drawTexture, 1, this.bpmManager.getBeat());
        this.cloudMotion.update(this.drawTexture, 1, this.bpmManager.getBeat());
        this.umbrellaMotion.update(this.drawTexture, 1, this.bpmManager.getBeat());
        this.sushiMotion.update(this.drawTexture, 1, this.bpmManager.getBeat());
        this.thunderMotion.update(this.drawTexture, 1, this.bpmManager.getBeat());

        // this.sunnyMotion.update(this.midiSequencer.getSequenceValue(0, this.currentStep), this.bpmManager.getBeat());
        // this.waveMotion.update(this.midiSequencer.getSequenceValue(3, this.currentStep), this.bpmManager.getBeat());
        // this.cloudMotion.update(this.midiSequencer.getSequenceValue(1, this.currentStep), this.bpmManager.getBeat());
        // this.umbrellaMotion.update(this.midiSequencer.getSequenceValue(4, this.currentStep), this.bpmManager.getBeat());
        // this.sushiMotion.update(this.midiSequencer.getSequenceValue(2, this.currentStep), this.bpmManager.getBeat());
        // this.thunderMotion.update(this.midiSequencer.getSequenceValue(5, this.currentStep), this.bpmManager.getBeat());

        this.uiTexture.clear();
        this.drawDebugInfo(this.midiSequencer.getSequenceValue(this.midiSequencer.sideButtonRadioNum, this.currentStep));
    }

    getDrawTexture(): p5.Graphics {
        return this.drawTexture;
    }

    getUITexture(): p5.Graphics {
        return this.uiTexture;
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

        this.uiTexture.push();
        this.uiTexture.fill(255);
        this.uiTexture.textSize(16);
        this.uiTexture.textAlign(p.LEFT, p.TOP);
        this.uiTexture.text(`BPM: ${this.bpmManager.getBPM().toFixed(2)}`, 10, 10);
        this.uiTexture.text(`Beat: ${this.bpmManager.getBeat().toFixed(2)}`, 10, 30);
        this.uiTexture.text(`Step: ${this.currentStep}`, 10, 50);
        this.uiTexture.text(`Sequence Value: ${sequenceValue.toFixed(2)}`, 10, 70);
        this.uiTexture.text(`Faders: [${this.midiSequencer.getFaderValues().map(v => v.toFixed(2)).join(', ')}]`, 10, 90);
        this.uiTexture.pop();
    }

    resize(): void {
        this.drawTexture.resizeCanvas(this.p.width, this.p.height);
        this.uiTexture.resizeCanvas(this.p.width, this.p.height);
    }
}