'use strict';
const fs = require('fs');
const CYRILIC = "йцукенгшщзхъфывапролджэячсмитьбю";
const LATIN = "qwertyuiop[]asdfghjkl;'zxcvbnm,.";
const CYRILIC_CODE = [12, 13, 14, 15, 17, 16, 32, 34, 31, 35, 33, 30, 0, 1, 2, 3, 5, 4, 38, 40, 37, 41, 39, 6, 7, 8, 9, 11, 45, 46, 43, 47];
const RUSSIAN = fs
    .readFileSync('100000-russian-words.txt').toString().split("\n").filter(l => l.length > 4)
    .map(w => w.split("")
        .map(c => CYRILIC_CODE[CYRILIC.indexOf(c)]));

let CURRENT = "LATIN";
const RUSSIAN_DICT = {}

for (let i in RUSSIAN) {
    RUSSIAN_DICT[RUSSIAN[i].reduce((acc, el) => acc * 37 + el)] = RUSSIAN[i];
}
console.log(LATIN.length, CYRILIC.length, CYRILIC_CODE.length);
// Import Websocket library.
const Websocket = require('ws');

function _equal(a1, a2) {
    if (a1.length != a2.length) return false;

    for (let i = 0; i < a1.length; i++) {
        if (a1[i] != a2[i]) return false;
    }
    return true
}
// OS library
const os = require('os');

// Unit testing h
const assert = require('chai').assert;

const serverUrl = 'ws://localhost:9876';

const sleep = timeoutMs => {
    return new Promise(resolve => {
        setTimeout(resolve, timeoutMs);
    });
};
GLOBAL = {};

GLOBAL.RUSSIAN = {}





const vkey = os.type() == 'Windows_NT' ? 0x34 : 51; // '4' on Windows
const pressed = true;
// Connect to websocket server
const ws = new Websocket(serverUrl);

Websocket.prototype.delChar = function () {
    const vkey = os.type() == 'Windows_NT' ? 0x34 : 51; // '4' on Windows
    const pressed = true;
    this.send(JSON.stringify({
        verb: 'send_input',
        path: 'key',
        args: {
            vkey,
            pressed
        }
    }));
}

Websocket.prototype.delWord = function () {
    let len = GLOBAL.word ? GLOBAL.word.length : 0;
    console.log("ha a delword ", len, GLOBAL.word)

    while (len-- >= 0) this.delChar();
    GLOBAL.word = [];

}

ws.on('open', async () => {
    // console.log('Connected to server', RUSSIAN[0], RUSSIAN[0].reduce((acc,el) => acc * 37 + el), RUSSIAN_DICT[943487504205399]);
    const unitId = 187708546; // Replace with your device's unitId
    // Spy all
    ws.send(JSON.stringify({
        verb: 'set',
        path: 'spyConfig',
        args: {
            value: {
                unitId,
                spyButtons: false,
                spyKeys: true,
                spyWheel: false,
                spyThumbWheel: false,
                spyPointer: false
            }
        }
    }));
    ws.on('error', error => {
        console.log('An error occurred');
        console.error(error);
    });

    ws.on('message', messageJson => {

        // Parse received message
        const message = JSON.parse(messageJson);
        assert.isTrue(message.success);
        assert.equal(message.verb, 'event');
        // Dump event
        if (message.value.pressed == false) return; // one call per press
        if (message.value.vkey == 0) return; // no responce on 

        console.log('%O: %O', message.path, message.value);

        GLOBAL.word = GLOBAL.word || []

        if (message.value.vkey == 51)
            GLOBAL.word.pop(); // todo
        else if (message.value.vkey == 49) {
            if (GLOBAL.word.length != 0)
                // console.log("word", GLOBAL.word.reduce((acc, el) => acc * 37 + el), RUSSIAN_DICT[GLOBAL.word.reduce((acc, el) => acc * 37 + el)]);
                if (RUSSIAN_DICT[GLOBAL.word.reduce((acc, el) => acc * 37 + el)]) {
                    let word = RUSSIAN_DICT[GLOBAL.word.reduce((acc, el) => acc * 37 + el)];
                    ws.delWord();
                    console.log(word.map(code => CYRILIC[CYRILIC_CODE.indexOf(code)]));
                    ws.send(JSON.stringify({
                        verb: 'send_input',
                        path: 'text',
                        args: {
                            value: word.map(code => CYRILIC[CYRILIC_CODE.indexOf(code)]).join('') + " "
                        }
                    }));
                    CURRENT = "CYRILIC";
                }
            GLOBAL.word = [];
        } else {
            GLOBAL.word.push(message.value.vkey);
            if (CYRILIC_CODE.indexOf(message.value.vkey) != -1)
                switch (CURRENT) {
                    case "LATIN":
                        break;
                    case "CYRILIC":
                        ws.delChar();
                        ws.send(JSON.stringify({
                            verb: 'send_input',
                            path: 'text',
                            args: {
                                value: CYRILIC[CYRILIC_CODE.indexOf(message.value.vkey)]
                            }
                        }));

                        break;
                }

        }

        if (_equal(GLOBAL.word, [6, 2, 15, 0, 9, 1, 17, 9, 32, 16, 17, 14])) {
            ws.delWord();
            ws.send(JSON.stringify({
                verb: 'send_input',
                path: 'text',
                args: {
                    value: "Здравствуйте"
                }
            }));

        }

    });
});

ws.on('close', () => {
    console.log('Connection closed');
});