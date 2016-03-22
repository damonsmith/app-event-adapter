App Event Adapter
=================

Gives you app style events in your javascript.

App Event Adapter is a single js class with no dependencies. To use it, create an
instance of it, connect it to an element and add listeners to it's events.

It will give you touch, tap, drag, scroll, pinch, zoom, twist as well as
standard events like mouseUp mouseDown, but with some normalising of the event
data that you get back. (it basically adds things like .x, .y, .amount onto the
returned event object so that you can just use those in all browsers.)

Installation
============

via NPM:
`npm install --save 'app-event-adapter'`

or simply drop the index.js file into your project somewhere, rename it
to AppEventAdapter.js and include it locally.

How to use
==========

As a way to handle events on a canvas:

An example in the style of inline handlers
------------------------------------------

```javascript
var AppEventAdapter = require('app-event-adapter');

function defineHandlers() {

	var canvas = document.getElementById("myCanvas");

	var eventAdapter = new AppEventAdapter();
	eventAdapter.connectToElement(canvas);

	eventAdapter.subscribe("mousedown", function(event) {
		console.log('mouse down at: ', event.x, event.y);
	});

	eventAdapter.subscribe("drag", function(drag) {
		console.log('drag (mouse or touch) went: ', drag.dx, drag.dx, 'starting at', drag.x, drag.y);
	});

	//and all the other marvellous events that AppEventAdapter can give you!!...
}
```

An example in posh fancy ES5 class style
----------------------------------------

```javascript

var AppEventAdapter = require('app-event-adapter');

function MyActionGameClass() {

	var canvas = document.getElementById("myCanvas");

	var eventAdapter = new AppEventAdapter();
	eventAdapter.connectToElement(canvas);

	eventAdapter.subscribe('mousedown', this.handleMouseDown, this);
	eventAdapter.subscribe('twist', this.handleTwist, this);
	eventAdapter.subscribe('tap', this.handleTap, this);

}

MyActionGameClass.prototype.handleMouseDown = function(event) {
	//Do something specific to mouses here, as opposed to the tap event.
}

MyActionGameClass.prototype.handleTwist = function(event) {
	//Do something fancy with two-fingered twist action, like rotate map
}

MyActionGameClass.prototype.handleTap = function(event) {
	//Do something generic for all taps or clicks
}
```

Events you can subscribe to, and what they pass you
===================================================

Native events
-------------
* resize - event
* mousewheel - amount
* mousedown - event.button, pos: {x: number, y: number}, event
* mouseup - event.button, pos: {x: number, y: number}, event
* mouseleave -
* mousemove - pos: {x: number, y: number}
* touchstart -
* touchend -
* touchleave -
* touchmove -
* touchcancel -
* contextmenu -
* keydown -
* keyup -
* keypress -
* visibilitychange -  

Derived events
--------------
* dragstart - mouse click and drag or single touch drag
* drag -  
* dragstop
* tap - abstraction of either a click or a touchscreen tap
* doubletap - abstraction of either a double click or a double touchscreen tap (2 in a quick succession, not two fingers at once)
* pinch - {l: number, dl: number} - l is current pinch length, dl is the change in the pinch length
* scroll - mouse wheel or two touch parallel movement
* twist - two finger touch twisting
