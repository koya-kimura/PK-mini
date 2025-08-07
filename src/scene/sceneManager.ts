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

    update(img: p5.Image): void {

        this.bpmManager.update();
        this.midiManager.update(this.p.floor(this.bpmManager.getBeat()) % 8);

        const speed = 0.5;
        const t = this.p.map(this.p.abs(this.p.fract(this.bpmManager.getBeat() * speed) - 0.5), 0, 0.5, 1, 0);
        const index = this.p.floor(this.bpmManager.getBeat() * speed) % 8;

        const alpha = this.p.map(t, 0, 1, 255, 10);
        this.p.background(0, alpha);

        let x = 0;
        let y = 0;
        let scl = 1;
        let angle = 0;

        if(this.midiManager.gridRadioState[index] == 0){
            x = this.p.map(t, 0, 1, 0, this.p.width / 2);
        }
        else if(this.midiManager.gridRadioState[index] == 1){
            x = this.p.map(t, 0, 1, 0, -this.p.width / 2);
        }
        else if(this.midiManager.gridRadioState[index] == 2){
            y = this.p.map(t, 0, 1, 0, -this.p.height / 2);
        }
        else if(this.midiManager.gridRadioState[index] == 3){
            y = this.p.map(t, 0, 1, 0, this.p.height / 2);
        }
        else if(this.midiManager.gridRadioState[index] == 4){
            scl = this.p.map(t, 0, 1, 1, 2);
        }
        else if(this.midiManager.gridRadioState[index] == 5){
            scl = this.p.map(t, 0, 1, 1, 0.5);
        }
        else if(this.midiManager.gridRadioState[index] == 6){
            angle = this.p.map(t, 0, 1, 0, this.p.TAU);
        }
        else if(this.midiManager.gridRadioState[index] == 7){
            angle = this.p.map(t, 0, 1, 0, -this.p.TAU);
        }

        this.p.push();
        this.p.translate(this.p.width / 2 + x, this.p.height / 2 + y);
        this.p.rotate(angle);
        this.p.scale(scl);
        this.p.imageMode(this.p.CENTER);
        this.p.image(img, 0, 0);
        this.p.pop();
    }

    tapTempo(): void {
        this.bpmManager.tapTempo();
    }
}