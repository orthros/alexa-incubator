'use strict';
var Alexa = require('alexa-sdk');
var request = require('request');

var APP_ID = undefined; //OPTIONAL: replace with "amzn1.echo-sdk-ams.app.[your-unique-value-here]";
var SKILL_NAME = 'Incubator Solver';



exports.handler = function(event, context, callback) {
    var alexa = Alexa.handler(event, context);
    alexa.APP_ID = APP_ID;
    alexa.registerHandlers(handlers);
    alexa.execute();
};

var handlers = {
    'LaunchRequest': function () {
        this.emit('GetFact');
    },
    'GetNewFactIntent': function () {
        this.emit('GetFact');
    },
    'GetFact': function () {
        //For now we are going to simply going to call the web service with
        //hard coded values to test connectivity between
        //Alexa and the web service.

        var me = this;

        request("http://lb.115b45c1.svc.dockerapp.io:80/solve/distance/10/eggs/2", function(error, response, body){
            // Create speech output

            if(error || response.statusCode != 200) {
                this.emit(':tellWithCard', "We hit an error optimizing.", SKILL_NAME);
            }

            var bodyJson = JSON.parse(body);

            var unfeasableDist = bodyJson.unfeasableDistances;
            var infinateDistances = bodyJson.infinateDistances;
            var incubatorsAndDistances = bodyJson.incubatorsAndDistances;

            if(infinateDistances.length == 0 && incubatorsAndDistances.length == 0) {
                speechOutput = "You will be unable to hatch any eggs on this walk";
            }
            else {
                speechOutput = "You will need " + incubatorsAndDistances.length +
                               " incubators for your walk, and you will need to put the " +
                               infinateDistances.toString() + " eggs in the Infinate Incubator.";

                if(unfeasableDist.length > 0) {
                    speechOutput = speechOutput + " You will be unable to hatch " + unfeasableDist.length + " eggs";
                }
            }

            speechOutput = "Unfeasable " + unfeasableDist.length + " Infinate " + infinateDistances.length + " Incubators " + incubatorsAndDistances.length;

            me.emit(':tellWithCard', speechOutput, SKILL_NAME, speechOutput);
        });


    },
    'AMAZON.HelpIntent': function () {
        var speechOutput = "You can say tell me a space fact, or, you can say exit... What can I help you with?";
        var reprompt = "What can I help you with?";
        this.emit(':ask', speechOutput, reprompt);
    },
    'AMAZON.CancelIntent': function () {
        this.emit(':tell', 'Goodbye!');
    },
    'AMAZON.StopIntent': function () {
        this.emit(':tell', 'Goodbye!');
    }
};
