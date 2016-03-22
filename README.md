App Event Adapter
=================

App Event Adapter is a single js class with no dependencies. To use it, create an
instance of it, connect it to an element and add listeners to it's events.

It will give you touch, tap, drag, scroll, pinch, zoom, twist as well as
standard events like mouseUp mouseDown, but with some normalising of the event
data that you get back. (it basically adds things like .x, .y, .amount onto the
returned event object so that you can just use those in all browsers.)
