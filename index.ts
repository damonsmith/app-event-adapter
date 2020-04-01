/**
 * (c) Damon Smith damon@lry.io
 * See LICENSE.html - GPLv3.
 */

 /**
  * This class adapts native browser events into more useful user interactions that you can easily subscribe to.
  * 
  * It gives you the basic native events like mouseup and mousedown, it also gives you derived events that you
  * can't get from the browser directly, like pinch for pinch-zoom, drag distance, tap events (that work for either mouse or touch) 
  * twist, and page hide and resize, which are available but annoying to use directly.
  * 
  * It has been designed mainly for use on a canvas object and not really tested on anything else.
  * It passes your handler the native browser event that the interaction was derived from as well as a Position argument which
  * is a bit easier to use than the offsetX / pageX / screenX / whatever arguments that the various native events give you back.
  * 
  * Use it like this:
  * 
  * import {AppEventAdapter, Position, PinchEvent} from "app-event-adapter"
  * 
  * const eventAdapter = new AppEventAdapter(document.querySelector("#myCanvasId"));
  * 
  * eventAdapter.interactions.tap.subscribe((event: Event, pos: Position) => {...do something at pos...})
  * 
  * eventAdapter.interactions.pinch.subscribe((event: PinchEvent, pos: Position) => {...maybe do a pinch zoom?...})
  * 
  */

 interface Position {
	x: number
	y: number
}

export interface PinchEvent extends TouchEvent {
	dl: number
	l: number
}

interface HandlerFunction<T extends Event> { (event: T, pos?: Position): void }

class SubscriptionTracker<T extends Event> {
	handlers: Function[] = []

	subscribe(handler: HandlerFunction<T>) {
		this.handlers.push(handler);
	}

	unsubscribe(handler: HandlerFunction<T>): boolean {
	   for (let i=0; i<this.handlers.length; i++) {
		   const sub = this.handlers[i];
		   if (sub === handler) {
			   this.handlers.splice(i,1);
			   return true;
		   }
	   }
	   return false;
	}

   callSubscribers(arg1: Event, pos?: Position) {
	   
	   var i, eventHandled = false; //key events use eventHandled to decide whether to preventDefault on key presses.
	   
	   this.handlers.map(handler => {
		   handler.apply(arg1);
		   eventHandled = true;
	   })
	   return eventHandled;
   };
	
}

export class AppEventAdapter {
   
   canvas: HTMLCanvasElement

   //number of pixels a mouse or touch can move
   //before it's no longer considered a "tap"
   tapDragTolerance: number = 5;

   doubleTapThreshold: number = 100;

   //This is used to record the number of fingers that hit the screen during a tap.
   numberOfTouches: number = 0;
   
   lastTapTime: number = 0;

   browserEventListeners = {};

   interactions = {
	   //Events based on standard browser events
	   resize: new SubscriptionTracker<UIEvent>(),
	   mousewheel: new SubscriptionTracker<MouseEvent>(),
	   mousedown: new SubscriptionTracker<MouseEvent>(),
	   mouseup: new SubscriptionTracker<MouseEvent>(),
	   mouseleave: new SubscriptionTracker<MouseEvent>(),
	   mousemove: new SubscriptionTracker<MouseEvent>(),
	   touchstart: new SubscriptionTracker<TouchEvent>(),
	   touchend: new SubscriptionTracker<TouchEvent>(),
	   touchleave: new SubscriptionTracker<TouchEvent>(),
	   touchmove: new SubscriptionTracker<TouchEvent>(),
	   touchcancel: new SubscriptionTracker<TouchEvent>(),
	   contextmenu: new SubscriptionTracker<MouseEvent>(),
	   keydown: new SubscriptionTracker<KeyboardEvent>(),
	   keyup: new SubscriptionTracker<KeyboardEvent>(),
	   keypress: new SubscriptionTracker<KeyboardEvent>(),
	   visibilitychange: new SubscriptionTracker<UIEvent>(),

	   //Derived events
	   dragstart: new SubscriptionTracker<Event>(),
	   drag: new SubscriptionTracker<Event>(),
	   dragstop: new SubscriptionTracker<Event>(),
	   tap: new SubscriptionTracker<Event>(),
	   tapdown: new SubscriptionTracker<Event>(),
	   tapup: new SubscriptionTracker<Event>(),
	   doubletap: new SubscriptionTracker<Event>(),
	   pinch: new SubscriptionTracker<PinchEvent>(),
	   scroll: new SubscriptionTracker<Event>(),
	   twist: new SubscriptionTracker<Event>()
   }

   dragging = {active: false, x: 0, y: 0, hasDragged: false, tx: 0, ty: 0};

   distanceBetweenTouchPair = 0;

   // Set the name of the hidden property and the change event for visibility
   hidden: string = null;

   constructor(element: HTMLCanvasElement) {
	   this.connectToElement(element);
   }
   
   visibilityChangeEventName: string = null;
   
   connectToElement(canvas: HTMLCanvasElement) {
	   if (this.canvas != null) {
		   throw "Error, adapter is already connected to a canvas. Please remove handlers first.";
	   }
	   this.canvas = canvas;
	   var self = this;

	   window.addEventListener('resize', this.resize);
	   window.addEventListener('mousewheel', this.mouseWheel);
	   window.addEventListener('DOMMouseScroll', this.mouseWheel);
	   canvas.addEventListener('mousedown', this.mouseDown);
	   canvas.addEventListener('mouseup', this.mouseUp);
	   canvas.addEventListener('mouseleave', this.mouseLeave);
	   canvas.addEventListener('mousemove', this.mouseMove);
	   canvas.addEventListener("touchstart", this.touchStart);
	   canvas.addEventListener("touchend", this.touchEnd);
	   canvas.addEventListener("touchleave", this.touchLeave);
	   canvas.addEventListener("touchmove", this.touchMove);
	   canvas.addEventListener("touchcancel", this.touchCancel);
	   canvas.addEventListener('contextmenu', this.contextMenu);
	   window.addEventListener("keydown", this.keyDown);
	   window.addEventListener("keyup", this.keyUp);
	   window.addEventListener("keypress", this.keyPress);
	   document.addEventListener("visibilitychange", this.visibilityChange);
   }

   disconnectFromCanvas() {
	   var canvas = this.canvas;
	   window.removeEventListener('resize', this.resize);
	   window.removeEventListener('mousewheel', this.mouseWheel);
	   window.removeEventListener('DOMMouseScroll', this.mouseWheel);
	   canvas.removeEventListener('mousedown', this.mouseDown);
	   canvas.removeEventListener('mouseup', this.mouseUp);
	   canvas.removeEventListener('mouseleave', this.mouseLeave);
	   canvas.removeEventListener('mousemove', this.mouseMove);
	   canvas.removeEventListener("touchstart", this.touchStart);
	   canvas.removeEventListener("touchend", this.touchEnd);
	   canvas.removeEventListener("touchleave", this.touchLeave);
	   canvas.removeEventListener("touchmove", this.touchMove);
	   canvas.removeEventListener("touchcancel", this.touchCancel);
	   canvas.removeEventListener('contextmenu', this.contextMenu);
	   window.removeEventListener("keydown", this.keyDown);
	   window.removeEventListener("keyup", this.keyUp);
	   window.removeEventListener("keypress", this.keyPress);
	   document.removeEventListener(this.visibilityChangeEventName, this.visibilityChange);

	   this.canvas = null;
   }

   resize(event: UIEvent) {
	   this.interactions.resize.callSubscribers(event);
   }

   mouseDown = function(event: MouseEvent) {
	   if (this.hasSubscribersFor([this.interactions.mousedown, this.interactions.tapdown, this.interactions.dragstart, this.interactions.drag])) {
		   var pos = {x: event.offsetX, y: event.offsetY};
		   // event.x = event.offsetX;
		   // event.y = event.offsetY;
		   this.startDrag(pos);
		   this.interactions.tapdown.callSubscribers(pos);
		   this.interactions.mousedown.callSubscribers(event);
		   return this.preventDefault(event);
	   }
   }

   mouseUp(event: MouseEvent) {
	   if (this.hasSubscribersFor([this.interactions.mouseup, this.interactions.tapup, this.interactions.tap, this.interactions.dragstop, this.interactions.drag])) {
		   var pos = {x: event.offsetX, y: event.offsetY};
		   // event.x = event.offsetX;
		   // event.y = event.offsetY;
		   if (this.wasATap()) {
			   this.interactions.tapup.callSubscribers(event, pos);
			   this.interactions.tap.callSubscribers(event, pos);
		   }

		   if (this.dragging.active) {
			   this.stopDrag(event);
		   }

		   this.interactions.mouseup.callSubscribers(event, pos);
		   return this.preventDefault(event);
	   }
   }

   mouseMove(event: MouseEvent) {
	   if (this.hasSubscribersFor([this.interactions.mousemove, this.interactions.drag])) {
		   var pos = {
			   x: event.offsetX,
			   y: event.offsetY
		   };
		   // event.x = event.offsetX;
		   // event.y = event.offsetY;

		   if (this.dragging.active) {
			   this.drag(event, pos);
		   }
		   this.interactions.mousemove.callSubscribers(event, pos);
		   return this.preventDefault(event);
	   }
   };

   mouseLeave(event: MouseEvent) {
	   this.stopDrag(event);
	   return this.preventDefault(event);
   }

   mouseWheel(event: MouseWheelEvent) {
	   if (this.hasSubscribersFor([this.interactions.scroll])) {
		   var pos = {
				   x: event.offsetX,
				   y: event.offsetY
		   };
		   // event.x = event.offsetX;
		   // event.y = event.offsetY;

		   var amount = event.detail;
		   if (event.deltaY) {
			   amount = event.deltaY / 40;
		   }
		   // event.amount = amount;

		   this.interactions.mousewheel.callSubscribers(event, pos);
		   this.interactions.scroll.callSubscribers(event, pos);
		   return this.preventDefault(event);
	   }
   }

   contextMenu(event: MouseEvent) {
	   return this.preventDefault(event);
   }

   keyDown(event: KeyboardEvent) {
	   if (this.interactions.keydown.callSubscribers(event)) {
		   return this.preventDefault(event);
	   }
	   return true;
   }

   keyUp(event: KeyboardEvent) {
	   if (this.interactions.keyup.callSubscribers(event)) {
		   return this.preventDefault(event);
	   }
	   return true;
   }

   keyPress(event: KeyboardEvent) {
	   if (this.interactions.keypress.callSubscribers(event)) {
		   return this.preventDefault(event);
	   }
	   return true;
   }

   touchStart(event: TouchEvent) {
	   if (this.hasSubscribersFor([this.interactions.drag, this.interactions.tapdown, this.interactions.dragstart])) {
		   this.numberOfTouches = Math.max(this.numberOfTouches, event.touches.length);

		   var pos = {
			   x: event.changedTouches[0].screenX,
			   y: event.changedTouches[0].screenY
		   };

		   // prevDist = 0;
		   this.startDrag(event, pos);

		   this.interactions.tapdown.callSubscribers(event, pos);
		   this.interactions.touchstart.callSubscribers(event, pos);
		   return this.preventDefault(event);
	   }
   };

   touchMove(event: TouchEvent) {
	   if (this.hasSubscribersFor([this.interactions.drag, this.interactions.touchmove])) {
		   var pos;

		   if (event.touches.length === 1) {
			   pos = {
					   x: event.changedTouches[0].screenX,
					   y: event.changedTouches[0].screenY
			   };
			   this.drag(event, pos);
		   }
		   else if (event.touches.length === 2) {
			   this.pinch(event);
		   }
		   this.interactions.touchmove.callSubscribers(event, pos);
		   return this.preventDefault(event);
	   }
   }

   touchEnd(event: TouchEvent) {
	   if (this.hasSubscribersFor([this.interactions.tap, this.interactions.drag, this.interactions.touchend, this.interactions.dragstop])) {
		   var time;
		   var pos = {
			   x: event.changedTouches[0].screenX,
			   y: event.changedTouches[0].screenY
		   };

		   if (event.touches.length === 0 && this.wasATap()) {
			   this.interactions.tap.callSubscribers(event, pos);
			   this.checkAndDoubleTap(event, pos);
		   }
		   if (event.touches.length === 0) {
			   this.numberOfTouches = 0;
		   }
		   this.stopDrag(event);
		   this.interactions.tapup.callSubscribers(event, pos);
		   this.interactions.touchend.callSubscribers(event, pos);
		   return this.preventDefault(event);
	   }
   }

   checkAndDoubleTap(event: TouchEvent, pos: Position) {
	   const time = (new Date()).getTime();
	   if (time - this.lastTapTime < this.doubleTapThreshold) {
		   this.interactions.doubletap.callSubscribers(event, pos);
	   }
	   this.lastTapTime = time;
   }

   touchLeave(event: TouchEvent) {
	   var pos = {
		   x: event.changedTouches[0].screenX,
		   y: event.changedTouches[0].screenY
	   };
	   this.stopDrag(event);
	   this.interactions.touchleave.callSubscribers(event, pos);
	   return this.preventDefault(event);
   }

   touchCancel(event: TouchEvent) {
	   this.stopDrag(event);
	   this.interactions.touchcancel.callSubscribers(event);
	   return this.preventDefault(event);
   }

   //Checks that the mouse or touch didn't move more than the tap drag tolerance.
   wasATap(): boolean {
	   if (!this.dragging.hasDragged) {
		   return true;
	   }
	   else {
		   return (Math.abs(this.dragging.tx) < this.tapDragTolerance) && (Math.abs(this.dragging.ty) < this.tapDragTolerance);
	   }
   }

   pinch(event: TouchEvent) {
	   var dx2 = Math.pow(event.touches[0].screenX - event.touches[1].screenX,2);
	   var dy2 = Math.pow(event.touches[0].screenY - event.touches[1].screenY,2);
	   var dist = Math.sqrt(dx2 + dy2);

	   const pos = {x: event.touches[0].screenX, y: event.touches[0].screenY}

	   var pinch = {
		   l: dist,
		   dl: this.distanceBetweenTouchPair - dist,
		   
	   };
	   this.distanceBetweenTouchPair = pinch.l;
	   const pinchEvent = event as PinchEvent;
	   pinchEvent.l = dist;
	   pinchEvent.dl = this.distanceBetweenTouchPair - dist
	   
	   this.interactions.pinch.callSubscribers(pinchEvent, pos);
	   return this.preventDefault(event);
   }

   startDrag(event: Event, pos: Position) {
	   if (!this.dragging.active) {
		   this.dragging.active = true;
		   this.dragging.x = pos.x;
		   this.dragging.y = pos.y;
		   this.dragging.tx = 0;
		   this.dragging.ty = 0;
		   this.dragging.hasDragged = false;
		   this.interactions.dragstart.callSubscribers(event, pos);
	   }
   };

   drag(event: Event, pos: Position) {

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
	   this.interactions.drag.callSubscribers(event, pos);
   }

   stopDrag(event: Event) {
	   this.dragging.active = false;
	   this.interactions.dragstop.callSubscribers(event);
   }

   visibilityChange(event: UIEvent) {
	   this.interactions.visibilitychange.callSubscribers(event);
   };

   hasSubscribersFor(subs: SubscriptionTracker<Event>[]) {
	   var i;
	   for ( i = 0; i < subs.length; i++) {
		   if (subs[i].handlers.length > 0) {
			   return true;
		   }
	   }
	   return false;
   }

   preventDefault = function(event: Event) {
	   if (event.preventDefault) {
		   event.preventDefault();
	   }
	   return false;
   }
   
   destroy() {
	   this.disconnectFromCanvas();
   }
}