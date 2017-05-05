import IotHub from '../lib/azure/iot-hub.js';
import { Message  as IotHubMessage } from 'azure-iot-device'
import codeFactory from '../data/codeFactory.js'

var hub = null;
var messageId = 0;

function blinkLED() { }

function sendMessage(msgCb, errCb) {
    messageId++;
    var messageFactory = new Function('messageId', codeFactory.getRunCode('getMessage') + '\nreturn getMessage(messageId)');
    var sensorMessage = messageFactory(messageId);
    var message = new IotHubMessage(sensorMessage.content);
    for (var i = 0; i < sensorMessage.properties.length; i++) {
        message.properties.add(sensorMessage.properties[i].key, sensorMessage.properties[i].value);
    }
    msgCb('Sending message: ' + sensorMessage.content);
    hub.sendEvent(message, function (err) {
        if (err) {
            errCb('Failed to send message to Azure IoT Hub: ' + err.message || JSON.stringify(err));
        } else {
            blinkLED();
            msgCb('Message sent to Azure IoT Hub');
        }
    });
}

var interval;
function run(connStr, msgCb, errCb) {
    try {
        // distory the old one
        if (hub) {
            hub.distory();
            hub = null;
        }
        if (interval) {
            clearInterval(interval);
        }
        hub = new IotHub(connStr);
        hub.open(function (err) {
            if (err) {
                errCb('[IoT hub Client] Connect err ' + err.message);
                return;
            }
            messageId = 0;
            interval = setInterval(function () {
                sendMessage(msgCb, errCb);
            }, 2000);
        });

    } catch (error) {
        errCb(error);
    }
}

export default run;