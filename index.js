/**
 * (c) Damon Smith damon@larrymite.com.au
 * See LICENSE.html - GPLv3.
 */

var AppEventAdapter = function(element) {

	//number of pixels a mouse or touch can move
	//before it's no longer considered a "tap"
	this.tapDragTolerance = 5;

	//This is used to record the number of fingers that hit the screen during a tap.
	this.numberOfTouches = 0;

	this.lastTapTime = 0;

	this.browserEventListeners = {};

	this.subscribers = {
			//Native browser events
			resize: [],
			mousewheel: [],
			mousedown: [],
			mouseup: [],
			mouseleave: [],
			mousemove: [],
			touchstart: [],
			touchend: [],
			touchleave: [],
			touchmove: [],
			touchcancel: [],
			contextmenu: [],
			keydown: [],
			keyup: [],
			keypress: [],
			visibilitychange: [],

			//Derived events
			dragstart: [],
			drag: [],
			dragstop: [],
			tap: [],
			tapdown: [],
			tapup: [],
			doubletap: [],
			pinch: [],
			scroll: [],
			twist: []
	};

	this.dragging = {active: false, x: 0, y: 0, hasDragged: false, tx: 0, ty: 0};

	this.distanceBetweenTouchPair = 0;

	// Set the name of the hidden property and the change event for visibility
	this.hidden = null;
	this.visibilityChangeEventName = null;
	if (typeof document.hidden !== "undefined") { // Opera 12.10 and Firefox 18 and later support
		this.hidden = "hidden";
		this.visibilityChangeEventName = "visibilitychange";
	} else if (typeof document.mozHidden !== "undefined") {
		this.hidden = "mozHidden";
		this.visibilityChangeEventName = "mozvisibilitychange";
	} else if (typeof document.msHidden !== "undefined") {
		this.hidden = "msHidden";
		this.visibilityChangeEventName = "msvisibilitychange";
	} else if (typeof document.webkitHidden !== "undefined") {
		this.hidden = "webkitHidden";
		this.visibilityChangeEventName = "webkitvisibilitychange";
	}
	if (element) {
		this.connectToElement(element);
	}
};

AppEventAdapter.prototype.connectToElement = function(canvas) {
	if (this.canvas != null) {
		throw "Error, adapter is already connected to a canvas. Please remove handlers first.";
	}
	this.canvas = canvas;
	var self = this;

	this.browserEventListeners.handleResize = function(event) {self.resize(event);};
	this.browserEventListeners.handleMouseWheel = function(event) {self.mouseWheel(event);};
	this.browserEventListeners.handleMouseDown = function(event) {self.mouseDown(event);};
	this.browserEventListeners.handleMouseUp = function(event) {self.mouseUp(event);};
	this.browserEventListeners.handleMouseLeave = function(event) {self.mouseLeave(event);};
	this.browserEventListeners.handleMouseMove = function(event) {self.mouseMove(event);};
	this.browserEventListeners.handleTouchStart = function(event) {self.touchStart(event);};
	this.browserEventListeners.handleTouchEnd = function(event) {self.touchEnd(event);};
	this.browserEventListeners.handleTouchLeave = function(event) {self.touchLeave(event);};
	this.browserEventListeners.handleTouchMove = function(event) {self.touchMove(event);};
	this.browserEventListeners.handleTouchCancel = function(event) {self.touchCancel(event);};
	this.browserEventListeners.handleContextMenu = function(event) {self.contextMenu(event);};
	this.browserEventListeners.handleKeyDown = function(event) {self.keyDown(event);};
	this.browserEventListeners.handleKeyUp = function(event) {self.keyUp(event);};
	this.browserEventListeners.handleKeyPress = function(event) {self.keyPress(event);};
	this.browserEventListeners.handleVisibilityChange = function(event) {self.visibilityChange(event);};

	window.addEventListener('resize', this.browserEventListeners.handleResize);
	window.addEventListener('mousewheel', this.browserEventListeners.handleMouseWheel);
	window.addEventListener('DOMMouseScroll', this.browserEventListeners.handleMouseWheel);
	canvas.addEventListener('mousedown', this.browserEventListeners.handleMouseDown);
	canvas.addEventListener('mouseup', this.browserEventListeners.handleMouseUp);
	canvas.addEventListener('mouseleave', this.browserEventListeners.handleMouseLeave);
	canvas.addEventListener('mousemove', this.browserEventListeners.handleMouseMove);
	canvas.addEventListener("touchstart", this.browserEventListeners.handleTouchStart);
	canvas.addEventListener("touchend", this.browserEventListeners.handleTouchEnd);
	canvas.addEventListener("touchleave", this.browserEventListeners.handleTouchLeave);
	canvas.addEventListener("touchmove", this.browserEventListeners.handleTouchMove);
	canvas.addEventListener("touchcancel", this.browserEventListeners.handleTouchCancel);
	canvas.addEventListener('contextmenu', this.browserEventListeners.handleContextMenu);
	window.addEventListener("keydown", this.browserEventListeners.handleKeyDown);
	window.addEventListener("keyup", this.browserEventListeners.handleKeyUp);
	window.addEventListener("keypress", this.browserEventListeners.handleKeyPress);
	document.addEventListener(this.visibilityChangeEventName, this.browserEventListeners.handleVisibilityChange);
};

AppEventAdapter.prototype.disconnectFromCanvas = function() {
	var canvas = this.canvas;
	window.removeEventListener('resize', this.browserEventListeners.handleResize);
	window.removeEventListener('mousewheel', this.browserEventListeners.handleMouseWheel);
	window.removeEventListener('DOMMouseScroll', this.browserEventListeners.handleMouseWheel);
	canvas.removeEventListener('mousedown', this.browserEventListeners.handleMouseDown);
	canvas.removeEventListener('mouseup', this.browserEventListeners.handleMouseUp);
	canvas.removeEventListener('mouseleave', this.browserEventListeners.handleMouseLeave);
	canvas.removeEventListener('mousemove', this.browserEventListeners.handleMouseMove);
	canvas.removeEventListener("touchstart", this.browserEventListeners.handleTouchStart);
	canvas.removeEventListener("touchend", this.browserEventListeners.handleTouchEnd);
	canvas.removeEventListener("touchleave", this.browserEventListeners.handleTouchLeave);
	canvas.removeEventListener("touchmove", this.browserEventListeners.handleTouchMove);
	canvas.removeEventListener("touchcancel", this.browserEventListeners.handleTouchCancel);
	canvas.removeEventListener('contextmenu', this.browserEventListeners.handleContextMenu);
	window.removeEventListener("keydown", this.browserEventListeners.handleKeyDown);
	window.removeEventListener("keyup", this.browserEventListeners.handleKeyUp);
	window.removeEventListener("keypress", this.browserEventListeners.handleKeyPress);
	document.removeEventListener(this.visibilityChangeEventName, this.browserEventListeners.handleVisibilityChange);

	this.canvas = null;
};

AppEventAdapter.prototype.resize = function(event) {
	this.callSubscribers("resize", [event]);
};


AppEventAdapter.prototype.mouseDown = function(event) {
	if (this.hasSubscribersForEventList(["mousedown", "tapdown", "dragstart", "drag"])) {
		var pos = {x: event.offsetX, y: event.offsetY};
		event.x = event.offsetX;
		event.y = event.offsetY;
		this.startDrag(pos);
		this.callSubscribers("tapdown", [pos]);
		this.callSubscribers("mousedown", [event]);

		return this.preventDefault(event);
	}
};

AppEventAdapter.prototype.mouseUp = function(event) {
	if (this.hasSubscribersForEventList(["mouseup", "tapup", "tap", "dragend", "drag"])) {
		var pos = {x: event.offsetX, y: event.offsetY};
		event.x = event.offsetX;
		event.y = event.offsetY;
		if (this.wasATap()) {
			this.callSubscribers("tapup", [event]);
			this.callSubscribers("tap", [event]);
		}

		if (this.dragging.active) {
			this.stopDrag();
		}

		this.callSubscribers("mouseup", [event]);
		return this.preventDefault(event);
	}
};

AppEventAdapter.prototype.mouseMove = function(event) {
	if (this.hasSubscribersForEventList(["mousemove", "drag"])) {
		var pos = {
			x: event.offsetX,
			y: event.offsetY
		};
		event.x = event.offsetX;
		event.y = event.offsetY;

		if (this.dragging.active) {
			this.drag(pos);
		}
		this.callSubscribers("mousemove", [event]);
		return this.preventDefault(event);
	}
};

AppEventAdapter.prototype.mouseLeave = function(event) {
	this.stopDrag();
	return this.preventDefault(event);
};

AppEventAdapter.prototype.mouseWheel = function(event) {
	if (this.hasSubscribersForEventList(["scroll"])) {
		var pos = {
				x: event.offsetX,
				y: event.offsetY
		};
		event.x = event.offsetX;
		event.y = event.offsetY;

		var amount = event.detail;
		if (event.wheelDelta) {
			amount = event.wheelDelta / 40;
		}
		event.amount = amount;

		this.callSubscribers("mousewheel", [event]);
		this.callSubscribers("scroll", [event]);
		return this.preventDefault(event);
	}
};

AppEventAdapter.prototype.contextMenu = function(event) {
	return this.preventDefault(event);
};

AppEventAdapter.prototype.keyDown = function(event) {
	if (this.callSubscribers("keydown", [event])) {
		return this.preventDefault(event);
	}
	return true;
};

AppEventAdapter.prototype.keyUp = function(event) {
	if (this.callSubscribers("keyup", [event])) {
		return this.preventDefault(event);
	}
	return true;
};

AppEventAdapter.prototype.keyPress = function(event) {
	if (this.callSubscribers("keypress", [event])) {
		return this.preventDefault(event);
	}
	return true;
};

AppEventAdapter.prototype.touchStart = function(event) {
	if (this.hasSubscribersForEventList(["drag", "tapdown", "dragstart"])) {
		this.numberOfTouches = Math.max(this.numberOfTouches, event.touches.length);

		var pos = {
			x: event.changedTouches[0].offsetX,
			y: event.changedTouches[0].offsetY
		};

		prevDist = 0;
		this.startDrag(pos);

		this.callSubscribers("tapdown", [pos]);
		this.callSubscribers("touchstart", [pos]);
		return this.preventDefault(event);
	}
};

AppEventAdapter.prototype.touchMove = function(event) {
	if (this.hasSubscribersForEventList(["drag", "touchmove"])) {
		var pos;

		if (event.touches.length === 1) {
			pos = {
					x: event.changedTouches[0].offsetX,
					y: event.changedTouches[0].offsetY
			};
			this.drag(pos);
		}
		else if (event.touches.length === 2) {
			this.pinch(event);
		}
		this.callSubscribers("touchmove", [event]);
		return this.preventDefault(event);
	}
};

AppEventAdapter.prototype.touchEnd = function(event) {
	if (this.hasSubscribersForEventList(["tap", "drag", "touchend", "dragend"])) {
		var time;
		var pos = {
			x: event.changedTouches[0].offsetX,
			y: event.changedTouches[0].offsetY
		};

		if (event.touches.length === 0 && this.wasATap()) {
			this.callSubscribers("tap", [pos, this.numberOfTouches]);
			this.checkAndDoubleTap(pos);
		}
		if (event.touches.length === 0) {
			this.numberOfTouches = 0;
		}
		this.stopDrag();
		this.callSubscribers("tapup", [pos]);
		this.callSubscribers("touchend", [pos]);
		return this.preventDefault(event);
	}
};

AppEventAdapter.prototype.checkAndDoubleTap = function(pos) {
	time = (new Date()).getTime();
	if (time - this.lastTapTime < this.doubleTapThreshold) {
		this.callSubscribers("doubletap", [pos]);
	}
	this.lastTapTime = time;
};

AppEventAdapter.prototype.touchLeave = function(event) {

	this.stopDrag();
	this.callSubscribers("touchleave", []);
	return this.preventDefault(event);
};

AppEventAdapter.prototype.touchCancel = function(event) {

	this.stopDrag();
	this.callSubscribers("touchcancel", []);
	return this.preventDefault(event);
};

//Checks that the mouse or touch didn't move more than the tap drag tolerance.
AppEventAdapter.prototype.wasATap = function() {
	if (!this.dragging.hasDragged) {
		return true;
	}
	else {
		return (Math.abs(this.dragging.tx) < this.tapDragTolerance) && (Math.abs(this.dragging.ty) < this.tapDragTolerance);
	}
};


AppEventAdapter.prototype.pinch = function(event) {
	var dx2 = Math.pow(event.touches[0].offsetX - event.touches[1].offsetX,2);
	var dy2 = Math.pow(event.touches[0].offsetY - event.touches[1].offsetY,2);
	var dist = Math.sqrt(dx2, dy2);

	var pinch = {
		l: dist,
		dl: this.distanceBetweenTouchPair - dist,
		pos: {x: event.touches[0].offsetX, y: event.touches[0].offsetY}
	};
	this.distanceBetweenTouchPair = pinch.l;

	this.callSubscribers("pinch", [pinch]);
	return this.preventDefault(event);
};

AppEventAdapter.prototype.startDrag = function(pos) {
	if (!this.dragging.active) {
		this.dragging.active = true;
		this.dragging.x = pos.x;
		this.dragging.y = pos.y;
		this.dragging.tx = 0;
		this.dragging.ty = 0;
		this.dragging.hasDragged = false;
		this.callSubscribers("dragstart", [pos]);
	}
};

AppEventAdapter.prototype.drag = function(pos) {

	var drag = {
			x: pos.x,
			y: pos.y,
			dx: pos.x - this.dragging.x,
			dy: pos.y - this.dragging.y
	};

	this.dragging.x = pos.x;
	this.dragging.y = pos.y;

	//keep a running total:
	this.dragging.tx += drag.dx;
	this.dragging.ty += drag.dy;

	this.dragging.hasDragged = true;
	this.callSubscribers("drag", [drag]);
};

AppEventAdapter.prototype.stopDrag = function() {
	this.dragging.active = false;
	this.callSubscribers("dragstop", []);
};

AppEventAdapter.prototype.visibilityChange = function() {
	this.callSubscribers("visibilitychange", [!document[this.hidden]]);
};

AppEventAdapter.prototype.hasSubscribersForEventList = function(eventList) {
	var i;
	for ( i = 0; i < eventList.length; i++) {
		if (this.subscribers[eventList[i]].length > 0) {
			return true;
		}
	}
	return false;
};

AppEventAdapter.prototype.preventDefault = function(event) {
	if (event.preventDefault) {
		event.preventDefault();
	}
	return false;
};

AppEventAdapter.prototype.subscribe = function(eventName, handler, scope, /*optional*/label) {
	this.subscribers[eventName].push({func: handler, scope: scope, label: label});
};

AppEventAdapter.prototype.unsubscribe = function(eventName, handler, scope) {
	var i, subscriber;
	for (i=0; i<this.subscribers[eventName].length; i++) {
		subscriber = this.subscribers[eventName][i];
		if (subscriber.func === handler && subscriber.scope === scope) {
			this.subscribers[eventName].splice(i,1);
			return;
		}
	}
	if (console && console.error) {
		console.error("Can't remove subscriber, it is not subscribed. EventName: " + eventName +
				", scope: ", scope, ", handler: " + handler);
	}
};

AppEventAdapter.prototype.callSubscribers = function(eventName, args) {
	var i, subscriber, eventHandled = false;//key events use eventHandled to decide whether to preventDefault on key presses.
	for (i=0; i<this.subscribers[eventName].length; i++) {
		subscriber = this.subscribers[eventName][i];
		try {
			eventHandled = subscriber.func.apply(subscriber.scope, args);
		}
		catch (e) {
			if (console && console.log) {
				console.log("Error calling " + eventName + " subscriber, label: " + subscriber.label + "\n" +
						"exception: ", e);
			}
		}
	}
	return eventHandled;
};

AppEventAdapter.prototype.destroy = function() {
	this.disconnectFromCanvas();
	this.browserEventListeners = null;
};

module.exports = AppEventAdapter;
