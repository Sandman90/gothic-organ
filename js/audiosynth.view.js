function AudioSynthView() {

    var isMobile = !!navigator.userAgent.match(/Android|BlackBerry|iPhone|iPad|iPod|Opera Mini|IEMobile/i);
    if(isMobile) { var evtListener = ['touchstart', 'touchend']; } else { var evtListener = ['mousedown', 'mouseup']; }

    var __audioSynth = new AudioSynth();
    __audioSynth.setVolume(0.5);
    var __octave = 3;
    /* Melodia Tetra (Tritoni e Note Basse) */
    var tetraMelody = [
        // Basso costante e lento (C in ottava bassa)
        ['C,-1', 4],
        ['C,-1', 8],
        ['C,-1', 4],

        // Arpeggio inquietante (C minore)
        ['C,0', 8],
        ['Eb,0', 8],
        ['G,0', 4],

        // Pausa e Tensione (Tritono D-G#)
        ['D,0', 8],
        ['G#,0', 4],

        // Risoluzione lenta e minacciosa
        ['C,0', 2],

        // Suono finale prolungato e basso
        ['B,-1', 1]
    ];

    // =============================================================
    // MODIFICHE RICHIESTE: TASTI SEGRETI SEQUENZIALI E DARK MODE
    // =============================================================
    var keysDown = {}; // Traccia lo stato dei tasti premuti (per la normale funzione piano)
    var SECRET_KEYS_SEQUENCE = [90, 88, 67]; // KeyCodes per Z, X, C (nell'ordine)
    var sequenceIndex = 0; // Indice per tracciare il progresso nella sequenza
    var isDark = false;
    var audioPortone = null;

    // Funzione per inizializzare l'Audio del portone
    var initSecretAudio = function() {
        // ASSICURATI che il file 'portone-cigolante.wav' o '.mp3' sia nel percorso corretto
        audioPortone = new Audio('noisy-door-230898.mp3');
    };

    // Funzione per attivare/disattivare l'oscuramento della tastiera
    var toggleDarkness = function() {
        var keyboardHolder = document.getElementById('keyboard');
        if (keyboardHolder) {
            keyboardHolder.classList.toggle('dark-mode');
            isDark = keyboardHolder.classList.contains('dark-mode');
        }

        // Suona il portone e la melodia tetra solo quando l'oscuramento si attiva
        if (isDark) {
            if (audioPortone) {
                audioPortone.currentTime = 0;
                audioPortone.play().catch(function(e) {
                    console.warn("Errore riproduzione portone:", e);
                });
            }

            // --- CHIAMATA ALLA MELODIA TETRA ---
            // Avvia la riproduzione della melodia tetra dopo un breve ritardo per non sovrapporsi subito al portone
            setTimeout(function() {
                fnPlaySong(tetraMelody.slice(0)); // Usiamo .slice(0) per passare una copia dell'array
            }, 3000); // Ritardo di 500ms
            // --- FINE CHIAMATA ---

        } else {
            // Opzionale: Aggiungere qui logica per fermare la canzone se si disattiva il dark mode
        }
    };

    // Funzione per resettare la sequenza dopo un breve timeout
    var resetSequenceTimeout = null;
    var resetSequence = function() {
        sequenceIndex = 0;
        clearTimeout(resetSequenceTimeout);
    };
    // =============================================================


    // Change octave
    var fnChangeOctave = function(x) {

        x |= 0;

        __octave += x;

        __octave = Math.min(5, Math.max(3, __octave));

        var octaveName = document.getElementsByName('OCTAVE_LABEL');
        var i = octaveName.length;
        while(i--) {
            var val = parseInt(octaveName[i].getAttribute('value'));
            octaveName[i].innerHTML = (val + __octave);
        }

        document.getElementById('OCTAVE_LOWER').innerHTML = __octave-1;
        document.getElementById('OCTAVE_UPPER').innerHTML = __octave+1;

    };

    // Key bindings, notes to keyCodes.
    var keyboard = {

        /* 1 */
        49: 'C#,-1',

        /* 2 */
        50: 'D#,-1',

        /* 3 */
        51: 'F#,-1',

        /* 4 */
        52: 'G#,-1',

        /* 5 */
        53: 'A#,-1',

        /* 6 */
        54: 'C#,0',

        /* 7 */
        55: 'D#,0',

        /* 8 */
        56: 'F#,0',

        /* Q */
        81: 'C,-1',

        /* W */
        87: 'D,-1',

        /* E */
        69: 'E,-1',

        /* R */
        82: 'F,-1',

        /* T */
        84: 'G,-1',

        /* Y */
        89: 'A,-1',

        /* U */
        85: 'B,-1',

        /* I */
        73: 'C,0',

        /* O */
        79: 'D,0',

        /* P */
        80: 'E,0',

        /* [ */
        65: 'F,0',

        /* ] */
        83: 'G,0',

        /* A */
        57: 'G#,0',

        /* S */
        48: 'A#,0',

        /* F */
        71: 'C#,1',

        /* G */
        72: 'D#,1',

        /* J */
        74: 'F#,1',

        /* K */
        75: 'G#,1',

        /* L */
        76: 'A#,1',

        /* Z */
        68: 'A,0', // Tasto Z per la sequenza
        /* X */
        70: 'B,0', // Tasto X per la sequenza
        /* C */
        90: 'C,1', // Tasto C per la sequenza

        /* V */
        88: 'D,1',

        /* B */
        67: 'E,1',

        /* N */
        86: 'F,1',

        /* M */
        66: 'G,1',

        /* , */
        78: 'A,1',

        /* . */
        77: 'B,1'

    };

    var reverseLookupText = {};
    var reverseLookup = {};

    // Create a reverse lookup table.
    for(var i in keyboard) {

        var val;

        switch(i|0) {

            case 187:
                val = 61;
                break;

            case 219:
                val = 91;
                break;

            case 221:
                val = 93;
                break;

            case 188:
                val = 44;
                break;

            case 190:
                val = 46;
                break;

            default:
                val = i;
                break;

        }

        reverseLookupText[keyboard[i]] = val;
        reverseLookup[keyboard[i]] = i;

    }

    // Keys you have pressed down.
    var keysPressed = [];
    var visualKeyboard = null;
    var selectSound = null;

    var fnCreateKeyboard = function(keyboardElement) {
        // Generate keyboard
        // This is our main keyboard element! It's populated dynamically based on what you've set above.
        visualKeyboard = document.getElementById('keyboard');
        selectSound = document.getElementById('sound');

        var iKeys = 0;
        var iWhite = 0;
        var notes = __audioSynth._notes;

        for(var i=-1;i<=1;i++) {
            for(var n in notes) {
                if(n[2]!='b') {
                    var thisKey = document.createElement('div');
                    if(n.length>1) {
                        thisKey.className = 'black key';
                        thisKey.style.width = '30px';
                        thisKey.style.height = '120px';
                        thisKey.style.left = (40 * (iWhite - 1)) + 25 + 'px';
                    } else {
                        thisKey.className = 'white key';
                        thisKey.style.width = '40px';
                        thisKey.style.height = '200px';
                        thisKey.style.left = 40 * iWhite + 'px';
                        iWhite++;
                    }
                    var label = document.createElement('div');
                    label.className = 'label';
                    label.innerHTML = '<b>' + String.fromCharCode(reverseLookupText[n + ',' + i]) + '</b>' + '<br /><br />' + n.substr(0,1) +
                        '<span name="OCTAVE_LABEL" value="' + i + '">' + (__octave + parseInt(i)) + '</span>' + (n.substr(1,1)?n.substr(1,1):'');
                    thisKey.appendChild(label);
                    thisKey.setAttribute('ID', 'KEY_' + n + ',' + i);
                    thisKey.addEventListener(evtListener[0], (function(_temp) { return function() { fnPlayKeyboard({keyCode:_temp}); } })(reverseLookup[n + ',' + i]));
                    visualKeyboard[n + ',' + i] = thisKey;
                    visualKeyboard.appendChild(thisKey);
                    iKeys++;
                }
            }
        }

        visualKeyboard.style.width = iWhite * 40 + 'px';

        window.addEventListener(evtListener[1], function() { n = keysPressed.length; while(n--) { fnRemoveKeyBinding({keyCode:keysPressed[n]}); } });

        // Inizializza l'audio del portone dopo la creazione del DOM
        initSecretAudio();
    };

    // Creates our audio player
    var fnPlayNote = function(note, octave) {

        src = __audioSynth.generate('1', note, octave, 2);
        container = new Audio(src);
        container.addEventListener('ended', function() { container = null; });
        container.addEventListener('loadeddata', function(e) { e.target.play(); });
        container.autoplay = false;
        container.setAttribute('type', 'audio/wav');
        /*document.body.appendChild(container);*/
        container.load();
        return container;

    };

    // Detect keypresses, play notes.

    var fnPlayKeyboard = function(e) {

        var i = keysPressed.length;
        while(i--) {
            if(keysPressed[i]==e.keyCode) {
                return false;
            }
        }
        console.log('TASTO? ', e.keyCode);
        keysPressed.push(e.keyCode);

        // =============================================================
        // MODIFICA: LOGICA TASTI SEGRETI SEQUENZIALI
        // =============================================================
        var keyCode = e.keyCode;

        // Se il tasto premuto è quello atteso nella sequenza
        if (keyCode === SECRET_KEYS_SEQUENCE[sequenceIndex]) {
            sequenceIndex++;
            clearTimeout(resetSequenceTimeout); // Resetta il timeout se il tasto è corretto

            // Se l'intera sequenza è completata (Z -> X -> C)
            if (sequenceIndex === SECRET_KEYS_SEQUENCE.length) {
                toggleDarkness(); // Attiva/Disattiva l'oscuramento e suona
                resetSequence();  // Resetta la sequenza
            } else {
                // Imposta un timeout per resettare la sequenza se il prossimo tasto non viene premuto velocemente
                resetSequenceTimeout = setTimeout(resetSequence, 1500); // 1.5 secondi
            }
        } else if (SECRET_KEYS_SEQUENCE.includes(keyCode)) {
            // Se il tasto premuto fa parte della sequenza ma è sbagliato, resetta la sequenza
            resetSequence();
        }
        // =============================================================


        switch(e.keyCode) {

            // left
            case 37:
                fnChangeOctave(-1);
                break;

            // right
            case 39:
                fnChangeOctave(1);
                break;

            // space
            case 16:
                fnPlaySong([
                    ['E,0', 8],
                    ['D,0', 8],
                    ['C,0', 2],
                    ['C,0', 8],
                    ['D,0', 8],
                    ['C,0', 8],
                    ['E,0', 8],
                    ['D,0', 1],
                    ['C,0', 8],
                    ['D,0', 8],
                    ['E,0', 2],
                    ['A,0', 8],
                    ['G,0', 8],
                    ['E,0', 8],
                    ['C,0', 8],
                    ['D,0', 1],
                    ['A,0', 8],
                    ['B,0', 8],
                    ['C,1', 2],
                    ['B,0', 8],
                    ['C,1', 8],
                    ['D,1', 8],
                    ['C,1', 8],
                    ['A,0', 1],
                    ['G,0', 8],
                    ['A,0', 8],
                    ['B,0', 2],
                    ['C,1', 8],
                    ['B,0', 8],
                    ['A,0', 8],
                    ['G,0', 8],
                    ['A,0', 1]
                ]);
                break;

        }

        if(keyboard[e.keyCode]) {
            if(visualKeyboard[keyboard[e.keyCode]]) {
                visualKeyboard[keyboard[e.keyCode]].style.backgroundColor = '#645f5f';
                visualKeyboard[keyboard[e.keyCode]].style.marginTop = '';
                visualKeyboard[keyboard[e.keyCode]].style.paddingTop = '5px';
                visualKeyboard[keyboard[e.keyCode]].style.boxShadow = 'none';
            }
            var arrPlayNote = keyboard[e.keyCode].split(',');
            var note = arrPlayNote[0];
            var octaveModifier = arrPlayNote[1]|0;
            fnPlayNote(note, __octave + octaveModifier);
        } else {
            return false;
        }

    }

    // Remove key bindings once note is done.

    var fnRemoveKeyBinding = function(e) {

        // Non interferisce con la logica sequenziale
        var keyCode = e.keyCode;
        delete keysDown[keyCode];

        var i = keysPressed.length;
        while(i--) {
            if(keysPressed[i]==e.keyCode) {
                if(visualKeyboard[keyboard[e.keyCode]]) {
                    visualKeyboard[keyboard[e.keyCode]].style.backgroundColor = '';
                    visualKeyboard[keyboard[e.keyCode]].style.marginTop = '';
                    visualKeyboard[keyboard[e.keyCode]].style.paddingTop = '';
                    visualKeyboard[keyboard[e.keyCode]].style.boxShadow = '';
                }
                keysPressed.splice(i, 1);
            }
        }

    }

    var fnPlaySong = function(arr) {

        if(arr.length>0) {

            var noteLen = 1000*(1/parseInt(arr[0][1]));
            if(!(arr[0][0] instanceof Array)) {
                arr[0][0] = [arr[0][0]];
            }
            var i = arr[0][0].length;
            var keys = [];
            while(i--) {
                keys.unshift(reverseLookup[arr[0][0][i]]);
                fnPlayKeyboard({keyCode:keys[0]});
            }
            arr.shift();
            setTimeout(function(array, val){ return function() { var i = val.length; while(i--) { fnRemoveKeyBinding({keyCode:val[i]}); } fnPlaySong(array); } }(arr, keys), noteLen);

        }

    };

    // Set up global event listeners

    window.addEventListener('keydown', fnPlayKeyboard);
    window.addEventListener('keyup', fnRemoveKeyBinding);

    Object.defineProperty(this, 'draw', {
        value: fnCreateKeyboard
    });

}





// =============================================================
// SEZIONE: FULLSCREEN E ORIENTAMENTO MOBILE
// =============================================================

document.addEventListener('DOMContentLoaded', function() {
    var fsButton = document.getElementById('fullscreenButton');

    // Funzione per verificare se si tratta di un dispositivo mobile (approssimazione)
    var isMobile = /Mobi|Android/i.test(navigator.userAgent);

    // Mostra il bottone solo sui dispositivi mobili (o presunti tali)
    // if (isMobile) {
    //     fsButton.style.display = 'block';
    // }
    fsButton.style.display = 'block';

    fsButton.addEventListener('click', function() {
        fsButton.style.display = 'none';
        var docElm = document.documentElement;

        // Richiesta Fullscreen cross-browser
        if (docElm.requestFullscreen) {
            docElm.requestFullscreen();
        } else if (docElm.mozRequestFullScreen) { /* Firefox */
            docElm.mozRequestFullScreen();
        } else if (docElm.webkitRequestFullScreen) { /* Chrome, Safari and Opera */
            docElm.webkitRequestFullScreen();
        } else if (docElm.msRequestFullscreen) { /* IE/Edge */
            docElm.msRequestFullscreen();
        }

        // Blocco in modalità Landscape (orizzontale)
        if (screen.orientation && screen.orientation.lock) {
            screen.orientation.lock('landscape').catch(function(err) {
                console.log("Impossibile bloccare l'orientamento:", err);
            });
        }
    });
});