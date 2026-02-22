// js/audio.js
'use strict';

// Audio logging system
const AUDIO_DEBUG_LEVEL = {
    NONE: 0,
    ERROR: 1,
    WARN: 2,
    INFO: 3,
    DEBUG: 4,
    TRACE: 5
};

const AUDIO_CURRENT_LOG_LEVEL = AUDIO_DEBUG_LEVEL.DEBUG;

function audioLog(level, message, data = null) {
    if (level > AUDIO_CURRENT_LOG_LEVEL) return;

    const timestamp = new Date().toISOString().substr(11, 8);
    const levelStr = Object.keys(AUDIO_DEBUG_LEVEL)[level].padEnd(5);
    const prefix = `[${timestamp}] [${levelStr}] AUDIO: `;

    if (data) {
        console.log(`${prefix} ${message}`, data);
    } else {
        console.log(`${prefix} ${message}`);
    }
}

let actx = null;
let makeNoiseSource = null;

const AM = {
    seaFade: null,
    rainFade: null,
    oceanGain: null,
    rainGain: null,
    masterGain: null
};

function initAudio() {
    audioLog(AUDIO_DEBUG_LEVEL.INFO, 'Initializing audio system...');

    if (actx) {
        audioLog(AUDIO_DEBUG_LEVEL.DEBUG, 'Audio context already initialized');
        return;
    }

    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) {
        audioLog(AUDIO_DEBUG_LEVEL.ERROR, 'AudioContext not supported in this browser');
        return;
    }

    try {
        actx = new AudioContext();
        audioLog(AUDIO_DEBUG_LEVEL.INFO, `Audio context created, state: ${actx.state}`);

        // Utility: create looping white/pink noise source for ambience and one-shot SFX.
        makeNoiseSource = (isPink) => {
            audioLog(AUDIO_DEBUG_LEVEL.TRACE, `Creating ${isPink ? 'pink' : 'white'} noise source`);

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
                    out[i] *= 0.11;
                    b6 = w * 0.115926;
                } else {
                    out[i] = w;
                }
            }

            let src = actx.createBufferSource();
            src.buffer = buf;
            src.loop = true;

            audioLog(AUDIO_DEBUG_LEVEL.TRACE, `Noise source created (${isPink ? 'pink' : 'white'})`);
            return src;
        };

        audioLog(AUDIO_DEBUG_LEVEL.INFO, 'Audio system initialized successfully');

        // Set up ambient audio environment
        const seaSrc = makeNoiseSource(true);
        const seaFilt = actx.createBiquadFilter();
        seaFilt.type = 'lowpass';
        seaFilt.frequency.value = 400;
        AM.oceanGain = actx.createGain();
        AM.oceanGain.gain.value = 0;

        const swell = actx.createOscillator();
        swell.type = 'sine';
        swell.frequency.value = 0.05;
        const swellGain = actx.createGain();
        swellGain.gain.value = 200;
        swell.connect(swellGain);
        swellGain.connect(seaFilt.frequency);

        AM.masterGain = actx.createGain();
        AM.masterGain.gain.value = 4.0;
        AM.masterGain.connect(actx.destination);

        const droneOsc = actx.createOscillator();
        droneOsc.type = 'sawtooth';
        droneOsc.frequency.value = 40;

        const droneLfo = actx.createOscillator();
        droneLfo.frequency.value = 0.1;
        const droneLfoGain = actx.createGain();
        droneLfoGain.gain.value = 5;
        droneLfo.connect(droneLfoGain).connect(droneOsc.frequency);

        const droneGain = actx.createGain();
        droneGain.gain.value = 0.5;

        droneOsc.connect(droneGain).connect(AM.oceanGain);
        droneOsc.start();
        droneLfo.start();

        const subDrone = actx.createOscillator();
        subDrone.type = 'triangle';
        subDrone.frequency.value = 25;
        const subGain = actx.createGain();
        subGain.gain.value = 0.2;

        const subLfo = actx.createOscillator();
        subLfo.frequency.value = 0.05;
        const subLfoGain = actx.createGain();
        subLfoGain.gain.value = 0.05;
        subLfo.connect(subLfoGain).connect(subGain.gain);

        subDrone.connect(subGain).connect(AM.masterGain);
        subDrone.start();
        subLfo.start();

        const highDrone = actx.createOscillator();
        highDrone.type = 'triangle';
        highDrone.frequency.value = 120;

        const highFilt = actx.createBiquadFilter();
        highFilt.type = 'lowpass';
        highFilt.frequency.value = 600;

        const highGain = actx.createGain();
        highGain.gain.value = 0.2;

        const highLfo = actx.createOscillator();
        highLfo.frequency.value = 0.15;
        const highLfoGain = actx.createGain();
        highLfoGain.gain.value = 10;
        highLfo.connect(highLfoGain).connect(highDrone.frequency);

        highDrone.connect(highFilt).connect(highGain).connect(AM.masterGain);
        highDrone.start();
        highLfo.start();

        // Low frequency drone for sanity horror
        AM.infraDrone = actx.createOscillator();
        AM.infraDrone.type = 'sine';
        AM.infraDrone.frequency.value = 17; // Infrasound range
        AM.infraGain = actx.createGain();
        AM.infraGain.gain.value = 0;
        AM.infraDrone.connect(AM.infraGain).connect(AM.masterGain);
        AM.infraDrone.start();
    } catch (error) {
        audioLog(AUDIO_DEBUG_LEVEL.ERROR, 'Failed to initialize audio system', error);
    }
}

function checkAudio() {
    if (actx && actx.state === 'suspended') actx.resume();
}

function updateAudioEnv() {
    if (!actx) return;
    let tSea = 0.2, tRain = 0, tInfra = 0;

    if (G.wx === 'Storm') { tSea = 0.6; tRain = 0.4; }
    else if (G.wx === 'Gale') { tSea = 0.4; tRain = 0.1; }
    else if (G.wx === 'Calm') { tSea = 0.05; }
    if (typeof G.beaufort === 'number') tSea = Math.max(tSea, Math.min(0.7, G.beaufort * 0.06));
    if (G.state === 'Anchored') tSea *= 0.7;

    // Infrasound for low sanity
    if ((G.san ?? 100) < 20) tInfra = 0.3;

    const rmp = (node, tval) => {
        if (node) node.gain.linearRampToValueAtTime(tval, actx.currentTime + 3);
    };
    rmp(AM.oceanGain, tSea * 2.0);
    rmp(AM.rainGain, tRain * 2.0);
    rmp(AM.infraGain, tInfra);
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
    filt.type = 'bandpass';
    filt.frequency.value = 100 + Math.random() * 200;

    osc.connect(filt).connect(gain).connect(AM.masterGain || actx.destination);
    osc.start();
    osc.stop(actx.currentTime + 0.5);
}

function playBell() {
    if (!actx) {
        audioLog(AUDIO_DEBUG_LEVEL.WARN, 'Cannot play bell - audio not initialized');
        return;
    }

    audioLog(AUDIO_DEBUG_LEVEL.DEBUG, 'Playing bell sound');

    const t = actx.currentTime;
    const osc1 = actx.createOscillator();
    const osc2 = actx.createOscillator();
    const gain = actx.createGain();

    osc1.frequency.setValueAtTime(440, t);
    osc2.frequency.setValueAtTime(880, t);

    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(0.08, t + 0.05);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 1.0);

    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(AM.masterGain || actx.destination);

    osc1.start(t);
    osc1.stop(t + 1.0);
    osc2.start(t);
    osc2.stop(t + 1.0);
}

function playSplash() {
    if (!actx || !makeNoiseSource) {
        audioLog(AUDIO_DEBUG_LEVEL.WARN, 'Cannot play splash - audio not initialized');
        return;
    }

    audioLog(AUDIO_DEBUG_LEVEL.DEBUG, 'Playing splash sound');

    const t = actx.currentTime;
    const noise = makeNoiseSource(false);
    const filt = actx.createBiquadFilter();
    const gain = actx.createGain();

    filt.type = 'bandpass';
    filt.frequency.setValueAtTime(800, t);
    filt.frequency.exponentialRampToValueAtTime(200, t + 0.2);

    gain.gain.setValueAtTime(0.2, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.3);

    noise.connect(filt).connect(gain).connect(AM.masterGain || actx.destination);
    noise.start(t);
    noise.stop(t + 0.3);
}

function playGull() {
    if (!actx) {
        audioLog(AUDIO_DEBUG_LEVEL.WARN, 'Cannot play gull - audio not initialized');
        return;
    }

    audioLog(AUDIO_DEBUG_LEVEL.DEBUG, 'Playing gull sound');

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
    osc.start(t);
    osc.stop(t + 0.4);
}

function playGust() {
    if (!actx || !makeNoiseSource) {
        audioLog(AUDIO_DEBUG_LEVEL.WARN, 'Cannot play gust - audio not initialized');
        return;
    }

    audioLog(AUDIO_DEBUG_LEVEL.DEBUG, 'Playing gust sound');

    const t = actx.currentTime;
    const noise = makeNoiseSource(true);

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
    noise.start(t);
    noise.stop(t + 3);
}

function playMadness() {
    if (!actx) {
        audioLog(AUDIO_DEBUG_LEVEL.WARN, 'Cannot play madness - audio not initialized');
        return;
    }

    audioLog(AUDIO_DEBUG_LEVEL.DEBUG, 'Playing madness sound');

    const t = actx.currentTime;
    const osc = actx.createOscillator();
    const gain = actx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(300, t);
    osc.frequency.exponentialRampToValueAtTime(80, t + 1);

    gain.gain.setValueAtTime(0.4, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 1);

    osc.connect(gain).connect(AM.masterGain || actx.destination);
    osc.start(t);
    osc.stop(t + 1);
}

function playWhisper() {
    if (!actx || !makeNoiseSource) {
        audioLog(AUDIO_DEBUG_LEVEL.WARN, 'Cannot play whisper - audio not initialized');
        return;
    }

    audioLog(AUDIO_DEBUG_LEVEL.DEBUG, 'Playing whisper sound');

    const t = actx.currentTime;
    const noise = makeNoiseSource(true);
    const filt = actx.createBiquadFilter();
    const gain = actx.createGain();

    filt.type = 'bandpass';
    filt.frequency.setValueAtTime(2000, t);
    filt.frequency.exponentialRampToValueAtTime(3000, t + 0.5);

    gain.gain.setValueAtTime(0.1, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.8);

    noise.connect(filt).connect(gain).connect(AM.masterGain || actx.destination);
    noise.start(t);
    noise.stop(t + 0.8);
}

function playScream() {
    if (!actx) {
        audioLog(AUDIO_DEBUG_LEVEL.WARN, 'Cannot play scream - audio not initialized');
        return;
    }

    audioLog(AUDIO_DEBUG_LEVEL.DEBUG, 'Playing scream sound');

    const t = actx.currentTime;
    const dur = 1.5; // Longer duration

    // Multiple oscillators for harsh, shrill sound
    const osc1 = actx.createOscillator();
    osc1.type = 'sawtooth';
    osc1.frequency.setValueAtTime(2000, t); // Higher start
    osc1.frequency.setValueAtTime(2000, t + dur); // Constant pitch, no ramp

    const osc2 = actx.createOscillator();
    osc2.type = 'square';
    osc2.frequency.setValueAtTime(3000, t); // Even higher
    osc2.frequency.setValueAtTime(3000, t + dur); // Constant

    const gain = actx.createGain();
    gain.gain.setValueAtTime(0.6, t); // Higher volume
    gain.gain.setValueAtTime(0.6, t + dur); // No fade

    // Add heavy distortion
    const dist = actx.createWaveShaper();
    const curve = new Float32Array(44100);
    for (let i = 0; i < 44100; i++) {
        curve[i] = Math.tanh((i / 44100 - 0.5) * 8); // Harder distortion
    }
    dist.curve = curve;
    dist.oversample = '4x';

    osc1.connect(dist);
    osc2.connect(dist);
    dist.connect(gain);
    gain.connect(AM.masterGain || actx.destination);

    osc1.start(t);
    osc2.start(t);
    osc1.stop(t + dur);
    osc2.stop(t + dur);
}
