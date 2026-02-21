// js/audio.js
'use strict';

let actx = null;
const AM = {
    seaFade: null,
    rainFade: null,
    oceanGain: null,
    rainGain: null,
    masterGain: null
};

function initAudio() {
    if (actx) return;
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    actx = new AudioContext();

    // Utility: Create Noise Buffer
    const makeNoise = (isPink) => {
        let bs = actx.sampleRate * 2;
        let buf = actx.createBuffer(1, bs, actx.sampleRate);
        let out = buf.getChannelData(0);
        let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
        for (let i = 0; i < bs; i++) {
            let w = Math.random() * 2 - 1;
            if (isPink) {
                b0 = 0.99886 * b0 + w * 0.0555179;
                b1 = 0.99332 * b1 + w * 0.0750759;
                b2 = 0.96900 * b2 + w * 0.1538520;
                b3 = 0.86650 * b3 + w * 0.3104856;
                b4 = 0.55000 * b4 + w * 0.5329522;
                b5 = -0.7616 * b5 - w * 0.0168980;
                out[i] = b0 + b1 + b2 + b3 + b4 + b5 + b6 + w * 0.5362;
                out[i] *= 0.11; b6 = w * 0.115926;
            } else out[i] = w; // white
        }
        let src = actx.createBufferSource();
        src.buffer = buf;
        src.loop = true;
        return src;
    };

    // Ocean Setup (Pink noise -> LowPass -> Gain)
    const seaSrc = makeNoise(true);
    const seaFilt = actx.createBiquadFilter();
    seaFilt.type = 'lowpass'; seaFilt.frequency.value = 400;
    AM.oceanGain = actx.createGain(); AM.oceanGain.gain.value = 0;

    // Sea swell modulator
    const swell = actx.createOscillator();
    swell.type = 'sine'; swell.frequency.value = 0.05; // 20s cycle
    const swellGain = actx.createGain(); swellGain.gain.value = 200;
    swell.connect(swellGain);
    swellGain.connect(seaFilt.frequency);

    // Master Gain
    AM.masterGain = actx.createGain();
    AM.masterGain.gain.value = 4.0; // CRANK IT
    AM.masterGain.connect(actx.destination);

    seaSrc.connect(seaFilt).connect(AM.oceanGain).connect(AM.masterGain);
    seaSrc.start(); swell.start();

    // Rain Setup (White noise -> HighPass -> Gain)
    const rainSrc = makeNoise(false);
    const rainFilt = actx.createBiquadFilter();
    rainFilt.type = 'highpass'; rainFilt.frequency.value = 2000;
    AM.rainGain = actx.createGain(); AM.rainGain.gain.value = 0;
    rainSrc.connect(rainFilt).connect(AM.rainGain).connect(AM.masterGain);
    rainSrc.start();
}

function checkAudio() {
    if (actx && actx.state === 'suspended') actx.resume();
}

function updateAudioEnv() {
    if (!actx) return;
    let tSea = 0.2, tRain = 0;

    if (G.wx === 'Storm') { tSea = 0.6; tRain = 0.4; }
    else if (G.wx === 'Gale') { tSea = 0.4; tRain = 0.1; }
    else if (G.wx === 'Calm') { tSea = 0.05; }

    // Ramp
    const rmp = (node, tval) => {
        if (node) node.gain.linearRampToValueAtTime(tval, actx.currentTime + 3);
    };
    rmp(AM.oceanGain, tSea * 1.5);
    rmp(AM.rainGain, tRain * 1.5);
}

function playCreak() {
    if (!actx) return;
    const osc = actx.createOscillator();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(50 + Math.random() * 30, actx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(20 + Math.random() * 10, actx.currentTime + 0.4);

    const gain = actx.createGain();
    gain.gain.setValueAtTime(0, actx.currentTime);
    gain.gain.linearRampToValueAtTime(0.6, actx.currentTime + 0.05);
    gain.gain.exponentialRampToValueAtTime(0.01, actx.currentTime + 0.4);

    const filt = actx.createBiquadFilter();
    filt.type = 'bandpass'; filt.frequency.value = 100 + Math.random() * 200;

    osc.connect(filt).connect(gain).connect(AM.masterGain || actx.destination);
    osc.start(); osc.stop(actx.currentTime + 0.5);
}

function playBell() {
    if (!actx) return;
    const t = actx.currentTime;
    const osc1 = actx.createOscillator();
    const osc2 = actx.createOscillator();
    const gain = actx.createGain();

    osc1.frequency.setValueAtTime(880, t);
    osc2.frequency.setValueAtTime(1440, t); // Overtones

    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(0.3, t + 0.05);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 1.5);

    osc1.connect(gain); osc2.connect(gain);
    gain.connect(AM.masterGain || actx.destination);

    osc1.start(t); osc1.stop(t + 1.5);
    osc2.start(t); osc2.stop(t + 1.5);
}

function playSplash() {
    if (!actx) return;
    const t = actx.currentTime;
    const noise = makeNoise(false);
    const filt = actx.createBiquadFilter();
    const gain = actx.createGain();

    filt.type = 'bandpass';
    filt.frequency.setValueAtTime(800, t);
    filt.frequency.exponentialRampToValueAtTime(200, t + 0.2);

    gain.gain.setValueAtTime(0.2, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.3);

    noise.connect(filt).connect(gain).connect(AM.masterGain || actx.destination);
    noise.start(t); noise.stop(t + 0.3);
}

function playGull() {
    if (!actx || Math.random() > 0.3) return;
    const t = actx.currentTime;
    const osc = actx.createOscillator();
    const gain = actx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(800 + Math.random() * 400, t);
    osc.frequency.exponentialRampToValueAtTime(1200 + Math.random() * 400, t + 0.1);
    osc.frequency.exponentialRampToValueAtTime(800 + Math.random() * 400, t + 0.3);

    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(0.05, t + 0.05);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.4);

    osc.connect(gain).connect(AM.masterGain || actx.destination);
    osc.start(t); osc.stop(t + 0.4);
}

function playGust() {
    if (!actx) return;
    const t = actx.currentTime;
    const noise = (window.makeNoise) ? window.makeNoise(true) : null;
    if (!noise) return;

    const filt = actx.createBiquadFilter();
    filt.type = 'lowpass';
    filt.frequency.setValueAtTime(100, t);
    filt.frequency.exponentialRampToValueAtTime(600 + Math.random() * 400, t + 1);
    filt.frequency.exponentialRampToValueAtTime(100, t + 3);

    const gain = actx.createGain();
    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(0.1, t + 1);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 3);

    noise.connect(filt).connect(gain).connect(AM.masterGain || actx.destination);
    noise.start(t); noise.stop(t + 3);
}

function playGroan() {
    if (!actx) return;
    const t = actx.currentTime;
    const dur = 1 + Math.random();

    const osc = actx.createOscillator();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(40 + Math.random() * 20, t);

    // Modulation
    const lfo = actx.createOscillator();
    lfo.frequency.value = 5 + Math.random() * 10;
    const lfoGain = actx.createGain();
    lfoGain.gain.value = 10;
    lfo.connect(lfoGain).connect(osc.frequency);

    const gain = actx.createGain();
    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(0.2, t + 0.1);
    gain.gain.exponentialRampToValueAtTime(0.001, t + dur);

    const filt = actx.createBiquadFilter();
    filt.type = 'lowpass'; filt.frequency.value = 300;

    osc.connect(filt).connect(gain).connect(AM.masterGain || actx.destination);
    osc.start(t); lfo.start(t);
    osc.stop(t + dur); lfo.stop(t + dur);
}
