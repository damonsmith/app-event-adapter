App Event Adapter
=================

Gives you app style events in your javascript.

App Event Adapter is a single js class with no dependencies. To use it, create an
instance of it, connect it to an element and add listeners to it's events.

It will give you touch, tap, drag, scroll, pinch, zoom, twist as well as
standard events like mouseUp mouseDown, but with some normalising of the event
data that you get back. (it basically adds things like .x, .y, .amount onto the
returned event object so that you can just use those in all browsers.)

How to use
==========
Use AppEventAdapter to convert the browser events received from a canvas into app
style events.

Use this class to subscribe not only to normal browser events, like mouseDown, touchEnd
but also provides some compatibility events: (tap is single click or touch) and derived events
that require some calculation, like pinch, twist and scroll.

How to connect this to a canvas and disconnect it:

var AppEventAdapter = require('app-event-adapter');

var eventAdapter = new AppEventAdapter();
eventAdapter.connectToElement(canvas);
eventAdapter.disconnectFromCanvas();

How to subscribe to an event:
eventAdapter.subscribe("mousedown", this.handleMouseDown, this);

And your event handler:
MyClass.prototype.handleMouseDown = function(event) {
	this.startDrawing();//or whatever
}
MyClass.prototype.handleDrag = function(drag) {
	//(this is called with a "drag" argument with the x,y and the dx,dy movements.
	this.moveScreen(drag.dx, drag.dy);
}

Events you can subscribe to, and what they will call:

Native events
=============
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
==============
* dragstart - mouse click and drag or single touch drag
* drag -  
* dragstop
* tap - abstraction of either a click or a touchscreen tap
* doubletap - abstraction of either a double click or a double touchscreen tap (2 in a quick succession, not two fingers at once)
* pinch - {l: number, dl: number} - l is current pinch length, dl is the change in the pinch length
* scroll - mouse wheel or two touch parallel movement
* twist - two finger touch twisting
