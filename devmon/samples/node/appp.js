'use strict';
const fs = require('fs');

let SOFT_DEL = false;
let MiddleWare = class {
    constructor(ws) {
        this.ws = ws;
        this.PRIME = 37;
        this.ALPHABETS = [
            "1234567890-=qwertyuiop[]asdfghjkl;'zxcvbnm,.",
            "1234567890-=йцукенгшщзхъфывапролджэячсмитьбю",
            "էթփձջեւրչճ-ժքոեռտըւիօպխծասդֆգհյկլ;'զղցվբնմ,։"
        ];
        this.CODE = [18, 19, 20, 21, 23, 22, 26, 28, 25, 29, 27, 24, 12, 13, 14, 15, 17, 16, 32, 34, 31, 35, 33, 30, 0, 1, 2, 3, 5, 4, 38, 40, 37, 41, 39, 6, 7, 8, 9, 11, 45, 46, 43, 47];
        this.current_layout = 1; // latin i.e. index in ALPHABET array
        this.word = []; // word in codes

        let RUSSIAN = fs
            .readFileSync('100000-russian-words.txt').toString().split("\n").filter(l => l.length > 4)
            .map(w => w.split("")
                .map(c => this.CODE[this.ALPHABETS[1].indexOf(c)]));
        let ENGLISH = fs
            .readFileSync('100000-english-mit.txt').toString().split("\n").filter(l => l.length > 4)
            .map(w => w.split("")
                .map(c => this.CODE[this.ALPHABETS[0].indexOf(c)]));
        let RUSSIAN_DICT = {};
        let ENGLISH_DICT = {};

        for (let i in RUSSIAN) {
            RUSSIAN_DICT[RUSSIAN[i].reduce((acc, el) => acc + this.PRIME * el)] = RUSSIAN[i];
        }
        for (let i in ENGLISH) {
            ENGLISH_DICT[ENGLISH[i].reduce((acc, el) => acc + this.PRIME * el)] = ENGLISH[i];
        }

        this.DICTS = [ENGLISH_DICT, RUSSIAN_DICT];

    }

    delChar() {
        const vkey = os.type() == 'Windows_NT' ? 0x34 : 51; // '4' on Windows
        const pressed = true;
        this.ws.send(JSON.stringify({
            verb: 'send_input',
            path: 'key',
            args: {
                vkey,
                pressed
            }
        }));
    }

    delCharSoft() {
        const vkey = os.type() == 'Windows_NT' ? 0x34 : 51; // '4' on Windows
        const pressed = true;
        SOFT_DEL = true;
        this.ws.send(JSON.stringify({
            verb: 'send_input',
            path: 'key',
            args: {
                vkey,
                pressed,
                "hh": "tt"
            }
        }), function () {
            SOFT_DEL = false;
        });
    }


    delWord() {
        let len = this.word ? this.word.length : 0;
        // console.log("ha a delword ", len, this.word)

        while (len-- >= 0) this.delChar();
        this.word = [];
    }
    // HELPERS BEGIN *****************************************
    wordInLang(word, lang) {
        if (word.length == 0) return null;
        return lang[word.reduce((acc, el) => acc + this.PRIME * el)];
    }
    // HELPERS END *****************************************


    handleMessage(messageJson) {
        // Parse received message
        const message = JSON.parse(messageJson);
        assert.isTrue(message.success);
        assert.equal(message.verb, 'event');
        // Dump event
        if (message.value.pressed == false) return; // one call per press
        if (message.value.vkey == 0) return; // no responce on
        console.log(messageJson, this.word, this.wordInLang(this.word, this.DICTS[0]));

        console.log('%O: %O', message.path, message.value);

        if (message.value.vkey == 51) { // backspace
            this.word.pop();
        } else if (message.value.vkey == 49) { // space aka new word
            if (this.word.length == 0) return;
            for (let lang in this.DICTS) {

                if (this.wordInLang(this.word, this.DICTS[lang])) {
                    let word = this.word;
                    App.delWord();
                    console.log(word.map(code => this.ALPHABETS[0][this.CODE.indexOf(code)]));

                    ws.send(JSON.stringify({
                        verb: 'send_input',
                        path: 'text',
                        args: {
                            value: word.map(code => this.ALPHABETS[lang][this.CODE.indexOf(code)]).join('') + " "
                        }
                    }));
                    this.current_layout = lang;
                    break;
                }
            }
            this.word = [];


        } else {
            this.word.push(message.value.vkey);
            if (this.CODE.indexOf(message.value.vkey) != -1) {
                if (this.current_layout == 0) return; // latin
                // App.delCharSoft();
                // console.log("he yooo", this.word)
                // ws.send(JSON.stringify({
                //     verb: 'send_input',
                //     path: 'text',
                //     args: {
                //         value: this.ALPHABETS[this.current_layout][this.CODE.indexOf(message.value.vkey)]
                //     }
                // }));
                // console.log("he yooo", this.word)

            }
        }
    }
}

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





const vkey = os.type() == 'Windows_NT' ? 0x34 : 51; // '4' on Windows
const pressed = true;
// Connect to websocket server
const ws = new Websocket(serverUrl);

const App = new MiddleWare(ws);

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

    ws.on('message', App.handleMessage.bind(App));
});

ws.on('close', () => {
    console.log('Connection closed');
});