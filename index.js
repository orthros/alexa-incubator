'use strict';
var Alexa = require('alexa-sdk');
var request = require('request');

var APP_ID = undefined; //OPTIONAL: replace with "amzn1.echo-sdk-ams.app.[your-unique-value-here]";
var SKILL_NAME = 'Incubator Solver';

var SERVER_ADDRESS = "http://lb.115b45c1.svc.dockerapp.io:80/solve";

var states = {
    START: "_START",
    DISTANCE: "_DISTANCE",
    EGG: "_EGG",
    DONE: "_DONE"
};

// This is the intial welcome message
var welcomeMessage = "Welcome to the Egg Solver. Do you want to go on a walk?";

// This is the message that is repeated if the response to the initial welcome message is not heard
var repeatWelcomeMessage = "Say yes to start or no to quit";


exports.handler = function(event, context, callback) {
    var alexa = Alexa.handler(event, context);
    alexa.APP_ID = APP_ID;
    alexa.registerHandlers(newSessionHandler, distanceHandlers, eggHandlers);
    alexa.execute();
};

var newSessionHandler = {
  'LaunchRequest': function () {
    this.handler.state = states.DISTANCE;
    this.emit(':ask', welcomeMessage, repeatWelcomeMessage);
    },
  'Unhandled': function () {
    this.emit(':ask',
      "I\'m sorry, but I\'m not sure what you asked me.");
  }
};

var distanceHandlers = Alexa.CreateStateHandler(states.DISTANCE, {
    'TellDistanceIntent': function () {
        //We get the distance from the passed data
        this.handler.state = states.EGG;

        var dist = parseInt(this.event.request.intent.slots.DistanceItem.value)

        this.attributes["distance"] = dist;

        console.log(this.attributes);

        this.emit(':ask', "How far is your egg?", "Say 2km, 5km 10km or Done");
    },
    'AMAZON.NoIntent': function() {
        this.emit(':tellWithCard', "Goodbye");
    },
    'Unhandled': function () {
      this.emit(':ask',
        "I\'m sorry, but I\'m not sure what you asked me. Please tell me how far you want to walk.");
    }
});

var eggHandlers = Alexa.CreateStateHandler(states.EGG, {
    'TellEggIntent': function() {
        //Get the egg's distance from the data and
        //save it to the state
        if(this.attributes["eggs"] === undefined){
            this.attributes["eggs"] = [];
        }

        var eggDist = parseInt(this.event.request.intent.slots.EggItem.value)

        this.attributes["eggs"].push(eggDist);

        this.emit(':ask', "How far is your egg?", "Say 2km, 5km 10km or No more Eggs");
    },
    'AMAZON.NoIntent': function() {
        //Get the data out of the state
        //If it is valid, make the server request and emit
        var me = this;

        if(me.attributes["eggs"] == undefined ||
           me.attributes["eggs"].length == 0 ||
           me.attributes["distance"] == undefined) {
               me.emit(':tellWithCard', 'Done');
           }
        var appendString = "/distance/" +
                           me.attributes["distance"] +
                           "/eggs/" +
                            me.attributes["eggs"].join("-");

        console.log(SERVER_ADDRESS);
        console.log(appendString);

        request(SERVER_ADDRESS + appendString, function(error, response, body){
            // Create speech output

            if(error || response.statusCode != 200) {
                me.emit(':tellWithCard', "We hit an error while optimizing.", SKILL_NAME);
            }

            var bodyJson = JSON.parse(body);

            var unfeasableDist = bodyJson.unfeasableDistances;
            var infinateDistances = bodyJson.infinateDistances;
            var incubatorsAndDistances = bodyJson.incubatorsAndDistances;

            var speechOutput = "";

            if(infinateDistances.length == 0 && incubatorsAndDistances.length == 0) {
                speechOutput = "You will be unable to hatch any eggs on this walk";
            }
            else {
                speechOutput = "You will need " + incubatorsAndDistances.length +
                               " incubators for your walk";

                if(infinateDistances.length > 0) {
                    speechOutput = speechOutput + " and you will need to put the " +
                    infinateDistances.toString() + " eggs in the Infinate Incubator.";
                }

                if(unfeasableDist.length > 0) {
                    speechOutput = speechOutput + " You will be unable to hatch " + unfeasableDist.length + " eggs";
                }
            }

            me.emit(':tellWithCard', speechOutput, SKILL_NAME, speechOutput);
        });

        // this.emit(':tell', "Goodbye");
    },
    'Unhandled': function () {
      this.emit(':ask',
        `I\'m sorry, but I\'m not sure what you asked me.`);
    }
});
