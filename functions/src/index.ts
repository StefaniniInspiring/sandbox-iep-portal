import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin'
//JSON to XML parser
var js2xmlparser = require('js2xmlparser')

//firebase stuff
admin.initializeApp(functions.config().firebase);
admin.firestore().settings({ timestampsInSnapshots: true })
export const firestoreInstance = admin.firestore()

let data
let configuration

function buildConfigObj() {
    data = {};
    configuration = {
        '@':{
            'activeTime': '2018-10-19T00:00:00.000-03:00',
            'componentId': 'campaign'
         },
    }
}

//express function
export const publish = functions.https.onRequest(async (request, response) => {
    const element = request.query.el
    const id = request.query.id

    buildConfigObj()
    
    let result = await firestoreInstance.doc(`${element}/${id}`).get()
        .then(async resp => {
            data = resp.data()
            console.log(data)
            await fetchExternalRelationships(data, '')
            return data
        })
        .catch(err => {
            console.log(err)
            return {}
        })

    configuration[element] = result
    response.set('Content-Type', 'text/xml');
    response.send(js2xmlparser.parse('configuration', configuration));
});

//recursive function to iterate over complex ovjects
async function fetchExternalRelationships(obj: any, stack: string) {
    for (let property in obj) {
        if (obj.hasOwnProperty(property)) {
            if (typeof obj[property] === 'object') {
                //this might get slow if we have multiple external info and/or queries does not run locally
                await fetchExternalRelationships(obj[property], stack + '.' + property);
            } else {
                //fetches data from other tables if needed
                if (property === 'extRef') {
                    const extData = await firestoreInstance.doc(`${obj[property]}`).get()
                        .then(resp => { return resp.data() })
                    updateObject(data, extData, stack)
                }
            }
        }
    }
}

//updates an object by given string path
function updateObject(object: any, newValue: any, path: string) {
    //removes first dot from stack path
    let stack = path.substring(1).split('.')

    while (stack.length > 1) {
        object = object[stack.shift()]
    }

    object[stack.shift()] = newValue
}