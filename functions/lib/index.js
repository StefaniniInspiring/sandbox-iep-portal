"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const functions = require("firebase-functions");
const admin = require("firebase-admin");
//JSON to XML parser
var js2xmlparser = require('js2xmlparser');
//firebase stuff
admin.initializeApp(functions.config().firebase);
admin.firestore().settings({ timestampsInSnapshots: true });
exports.firestoreInstance = admin.firestore();
let data;
let configuration;
function buildConfig() {
    data = {};
    configuration = {
        '@': {
            'activeTime': '2018-10-19T00:00:00.000-03:00',
            'componentId': 'campaign'
        },
    };
}
//express function
exports.publish = functions.https.onRequest((request, response) => __awaiter(this, void 0, void 0, function* () {
    const element = request.query.el;
    const id = request.query.id;
    buildConfig();
    let result = yield exports.firestoreInstance.doc(`${element}/${id}`).get()
        .then((resp) => __awaiter(this, void 0, void 0, function* () {
        data = resp.data();
        console.log(data);
        yield fetchExternalRelationships(data, '');
        return data;
    }))
        .catch(err => {
        console.log(err);
        return {};
    });
    configuration[element] = result;
    response.set('Content-Type', 'text/xml');
    response.send(js2xmlparser.parse('configuration', configuration));
}));
//recursive function to iterate over complex ovjects
function fetchExternalRelationships(obj, stack) {
    return __awaiter(this, void 0, void 0, function* () {
        for (let property in obj) {
            if (obj.hasOwnProperty(property)) {
                if (typeof obj[property] === 'object') {
                    yield fetchExternalRelationships(obj[property], stack + '.' + property);
                }
                else {
                    if (property === 'extRef') {
                        const extData = yield exports.firestoreInstance.doc(`${obj[property]}`).get()
                            .then(resp => { return resp.data(); });
                        updateObject(data, extData, stack);
                    }
                }
            }
        }
    });
}
//updates an object by given string path
function updateObject(object, newValue, path) {
    let stack = path.substring(1).split('.');
    while (stack.length > 1) {
        object = object[stack.shift()];
    }
    object[stack.shift()] = newValue;
}
//# sourceMappingURL=index.js.map