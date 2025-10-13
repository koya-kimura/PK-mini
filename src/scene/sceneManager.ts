// --------------------------------------------------------------
// SceneManager
// APC Mini MK2 からの入力を受け取り、各シーンモーションを束ねる中枢クラス。
// drawTexture / uiTexture の 2 枚のバッファを更新し、ポストプロセス側へ渡す。
// --------------------------------------------------------------

import p5 from 'p5'

// APCMiniMK2Manager の代わりに APCMiniMK2Sequencer を使用
import { APCMiniMK2Sequencer } from '../midi/APCMiniMK2Sequencer';
import { BPMManager } from '../rhythm/BPMManager';
import { ColorPalette } from '../utils/colorPalette';
import { UmbrellaMotion } from './umbrellaMotion';
import { SunnyMotion } from './sunnyMotion';
import { WaveMotion } from './waveMotion';
import { CloudMotion } from './cloudMotion';
import { SushiMotion } from './sushiMotion';
import { ThunderMotion } from './thunderMotion';
import { SushiTypographyMotion } from './sushiTypographyMotion';
import { TypographyMotion } from './typographyMotion';
import { UIManager } from '../ui/UIManager';
import { UI_None } from '../ui/UI_None';
import { UI_StatusOverlay } from '../ui/visualSequenceOverlay';
import { UI_GridOverlay } from '../ui/UI_GridOverlay';
import { UI_Pattern3 } from '../ui/UI_CameraFrameOverlay';
import { UI_FoWxFlowOverlay } from '../ui/UI_FoWxFlowOverlay';

export class SceneManager {
    // クラス名を APCMiniMK2Sequencer に変更
    public midiSequencer: APCMiniMK2Sequencer;
    private bpmManager: BPMManager;
    private p: p5;
    private drawTexture: p5.Graphics;
    private uiTexture: p5.Graphics;
    private uiManager: UIManager;

    // 現在のステップ（0-7）を保持
    private currentStep: number = 0;
    
    // フェーダー9（右端）の前回値を保持し、上限到達を検知する
    private prevClearFaderValue: number = 0;

    private umbrellaMotion: UmbrellaMotion;
    private sunnyMotion: SunnyMotion;
    private waveMotion: WaveMotion;
    private cloudMotion: CloudMotion;
    private sushiMotion: SushiMotion;
    private thunderMotion: ThunderMotion;
    private sushiTypographyMotion: SushiTypographyMotion;
    private typographyMotion: TypographyMotion;

    constructor(p: p5) {
        // 描画先のグラフィクスバッファと、同期情報を扱うマネージャを初期化。
        this.p = p;
        this.drawTexture = p.createGraphics(p.width, p.height);
        this.uiTexture = p.createGraphics(p.width, p.height);
        // Sequencer のインスタンス化
        this.midiSequencer = new APCMiniMK2Sequencer();
        this.bpmManager = new BPMManager();
        this.umbrellaMotion = new UmbrellaMotion(this.p, ColorPalette.scenes.umbrella);
        this.sunnyMotion = new SunnyMotion(p);
        this.waveMotion = new WaveMotion(p);
        this.cloudMotion = new CloudMotion(p);
        this.sushiMotion = new SushiMotion(p);
        this.thunderMotion = new ThunderMotion(p);
        this.sushiTypographyMotion = new SushiTypographyMotion(p);
        this.typographyMotion = new TypographyMotion(p);

        this.uiManager = new UIManager(this.midiSequencer, this.bpmManager);
        this.uiManager.setup(this.p, [
            new UI_None(),
            new UI_StatusOverlay(p),
            new UI_GridOverlay(p),
            new UI_Pattern3(),
            new UI_FoWxFlowOverlay(p),
        ]);
        const uiTexture = this.uiManager.getUITexture();
        if (uiTexture) {
            this.uiTexture = uiTexture;
        }
    }

    /**
     * 毎フレームの更新処理
     */
    update(): void {
        // BPM を進めて現在のビート値を算出。
        this.bpmManager.update();

        this.currentStep = this.p.floor(this.bpmManager.getBeat()) % 8;
        this.midiSequencer.update(this.currentStep);

        // フェーダー9の監視とシーケンスクリア処理
        const currentClearFaderValue = this.midiSequencer.getFaderValues()[8];
        if (currentClearFaderValue >= 1 && this.prevClearFaderValue < 1) {
            // フェーダー9が1になった瞬間に現在のパターンをクリア
            this.midiSequencer.clearCurrentPattern();
        }
        this.prevClearFaderValue = currentClearFaderValue;

        // 背景は常に不透明な黒を設定。
        this.drawTexture.background(0);

        this.drawTexture.push();

        // main
        // MIDI の行列 (行=シーン, 列=ステップ) から現在のステップ値を取り出して各モーションに引き渡す。
        this.sunnyMotion.update(this.drawTexture, this.midiSequencer.getSequenceValue(0, this.currentStep), this.bpmManager.getBeat());
        this.waveMotion.update(this.drawTexture, this.midiSequencer.getSequenceValue(3, this.currentStep), this.bpmManager.getBeat());
        this.cloudMotion.update(this.drawTexture, this.midiSequencer.getSequenceValue(1, this.currentStep), this.bpmManager.getBeat());
        this.umbrellaMotion.update(this.drawTexture, this.midiSequencer.getSequenceValue(4, this.currentStep), this.bpmManager.getBeat());
        this.sushiMotion.update(this.drawTexture, this.midiSequencer.getSequenceValue(2, this.currentStep), this.bpmManager.getBeat());
        this.thunderMotion.update(this.drawTexture, this.midiSequencer.getSequenceValue(5, this.currentStep), this.bpmManager.getBeat());
        this.sushiTypographyMotion.update(this.drawTexture, this.midiSequencer.getSequenceValue(6, this.currentStep), this.bpmManager.getBeat());
        this.typographyMotion.update(this.drawTexture, this.midiSequencer.getSequenceValue(7, this.currentStep), this.bpmManager.getBeat());

        // debug
        // this.sunnyMotion.update(this.drawTexture, this.p.floor(this.bpmManager.getBeat() / 4) % 8, this.bpmManager.getBeat());
        // this.waveMotion.update(this.drawTexture, this.p.floor(this.bpmManager.getBeat() / 4) % 8, this.bpmManager.getBeat());
        // this.cloudMotion.update(this.drawTexture, this.p.floor(this.bpmManager.getBeat() / 4) % 8, this.bpmManager.getBeat());
        // this.umbrellaMotion.update(this.drawTexture,this.p.floor(this.bpmManager.getBeat() / 4) % 8, this.bpmManager.getBeat());
        // this.sushiMotion.update(this.drawTexture, this.p.floor(this.bpmManager.getBeat() / 4) % 8, this.bpmManager.getBeat());
        // this.thunderMotion.update(this.drawTexture, this.p.floor(this.bpmManager.getBeat() / 4) % 8, this.bpmManager.getBeat());

        this.drawTexture.pop();

        this.uiManager.draw(this.p, this.bpmManager.getBeat(), this.currentStep);
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
     * 現在時点を beat=0 としてリセットする（キーボード Shift 用）
     */
    resetBeat(): void {
        this.bpmManager.resetBeatToNow();
    }

    getBeat(): number {
        return this.bpmManager.getBeat();
    }

    getBPM(): number {
        return this.bpmManager.getBPM();
    }

    getCurrentStep(): number {
        return this.currentStep;
    }

    getCurrentPatternIndex(): number {
        return this.midiSequencer.sideButtonRadioNum ?? 0;
    }

    getCurrentSequenceValue(patternIndex = this.getCurrentPatternIndex()): number {
        return this.midiSequencer.getSequenceValue(patternIndex, this.currentStep);
    }

    resize(): void {
        this.drawTexture.resizeCanvas(this.p.width, this.p.height);
        this.uiManager.resize(this.p);
        const uiTexture = this.uiManager.getUITexture();
        if (uiTexture) {
            this.uiTexture = uiTexture;
        }
    }

    selectUI(index: number): void {
        this.uiManager.selectUI(index);
    }
}