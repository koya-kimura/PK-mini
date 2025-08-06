import p5 from 'p5'

import { APCMiniMK2Manager } from '../midi/APCMiniMK2Manager';
import { BPMManager } from '../rhythm/BPMManager';

export class SceneManager {
    private midiManager: APCMiniMK2Manager;
    private bpmManager: BPMManager;
    private p: p5;

    constructor(p: p5) {
        this.p = p;
        this.midiManager = new APCMiniMK2Manager();
        this.bpmManager = new BPMManager();
    }

    update(): void {
        const h = this.p.map(this.midiManager.gridRadioState[this.p.floor(this.bpmManager.getBeat() % this.midiManager.gridRadioState.length)], 0, this.midiManager.gridRadioState.length - 1, 0, 360);
        this.p.background(h, 200, 50);

        this.midiManager.update();
        this.bpmManager.update();
    }

    tapTempo(): void {
        this.bpmManager.tapTempo();
    }
}