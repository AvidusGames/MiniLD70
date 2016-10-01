var MainMenu = null;

function StartMainMenu(callback_func) {
    GameLoopManager.stop();
    var hexgrid = new HT.Grid(800, 600);
    for(var y = 0; y < 11; y++) {
        for(var x = y%2; x < 12; x+=2) {
            h = hexgrid.GetHexById(hexgrid.GetHexId(x, y));
            h.owner = 0;           
        }
    }
    var canvasTemp = document.createElement("canvas");
    ctx = canvasTemp.getContext("2d");
    canvasTemp.width = canvas.width;
    canvasTemp.height = canvas.height;
	drawHexGrid(hexgrid);
    var bgCtx = canvasTemp.getContext("2d");
    ctx = canvas.getContext("2d");
    MultiStepLoader( [
		[ "audio", function(cb, i) {
			AudioManager.load({
				'blip'   : 'sound/blip',
				'select' : 'sound/select',
                'won' : 'sound/won',
                'lose' : 'sound/lose',
                'move' : 'sound/move'
			}, function() {
				cb(i); } ) } ],
	], function() {    
        InputManager.reset();
        MainMenu = new Menu("Hexagon Dynamics",
            [ "Singleplayer", "Multiplayer", "Tutorial" ],
            "Game created by Linus Styrén for #MiniLD70",
            70, 50, 400,
            function(numItem) {
                switch(numItem) {
                case 0:
                    callback_func(true, false); // singleplayer
                    break;
                case 1:
                    callback_func(false, false); // local multiplayer
                    break;
                case 2:
                    callback_func(false, true); // show tutorial
                    break;
                }
            }, function(e) {            
                ctx.drawImage(bgCtx.canvas, 0, 0);
            });
            GameLoopManager.run(function(elapsed) { MainMenu.Tick(elapsed); });
    } );
}

var GameLoopManager = new function() {
	this.lastTime = 0;
	this.gameTick = null;
	this.prevElapsed = 0;
	this.prevElapsed2 = 0;

	this.run = function(gameTick) {
		var prevTick = this.gameTick;
		this.gameTick = gameTick;
		if (this.lastTime == 0)
		{
			// Once started, the loop never stops.
			// But this function is called to change tick functions.
			// Avoid requesting multiple frames per frame.
			var bindThis = this;
			requestAnimationFrame(function() { bindThis.tick(); } );
			this.lastTime = 0;
		}
	}
	
	this.stop = function() {
		this.run(null);
	}

	this.tick = function () {
		if (this.gameTick != null)
		{
			var bindThis = this;
			requestAnimationFrame(function() { bindThis.tick(); } );
		}
		else
		{
			this.lastTime = 0;
			return;
		}
		var timeNow = Date.now();
		var elapsed = timeNow - this.lastTime;
		if (elapsed > 0)
		{
			if (this.lastTime != 0)
			{
				if (elapsed > 1000) // Cap max elapsed time to 1 second to avoid death spiral
					elapsed = 1000;
				// Hackish fps smoothing
				var smoothElapsed = (elapsed + this.prevElapsed + this.prevElapsed2)/3;
				this.gameTick(0.001*smoothElapsed);
				this.prevElapsed2 = this.prevElapsed;
				this.prevElapsed = elapsed;
			}
			this.lastTime = timeNow;
		}
	}
}

InputManager = new function()
{    
	this.reset = function()
	{
		this.currentlyPressedKeys = {};
		this.lastKeyPressed = null;
		this.mouseDown = false;
		this.mouseClick = false;
		this.deltaX = 0;
		this.deltaY = 0;
		
		this.padState = 0;
		this.padPressed = -1;
		this.padReleased = 0;
	}
	
    this.reset();
	this.lastMouseX = 0;
	this.lastMouseY = 0;
	
	this.handleKeyDown = function (event)
	{
		this.currentlyPressedKeys[event.keyCode] = true;
		this.lastKeyPressed = event.keyCode;
		if (event.keyCode != 116 && event.keyCode != 122) // F5 and F11
		{
			event.stopPropagation();
			event.preventDefault();
		}
	}

	this.handleKeyUp = function (event)
	{
		this.currentlyPressedKeys[event.keyCode] = false;
		if (event.keyCode != 116 && event.keyCode != 122) // F5 and F11
		{
			event.stopPropagation();
			event.preventDefault();
		}
	}

	// -------------------------------------------------------
	/* Human readable keyCode index */
	// Lifted from: https://github.com/daleharvey/pacmanhttps://github.com/daleharvey/pacman
	this.KEY = {'BACKSPACE': 8, 'TAB': 9, 'NUM_PAD_CLEAR': 12,
		'ENTER': 13, 'SHIFT': 16, 'CTRL': 17, 'ALT': 18, 'PAUSE': 19, 'CAPS_LOCK': 20, 'ESCAPE': 27, 'SPACEBAR': 32,
		'PAGE_UP': 33, 'PAGE_DOWN': 34, 'END': 35, 'HOME': 36,
		'ARROW_LEFT': 37, 'ARROW_UP': 38, 'ARROW_RIGHT': 39, 'ARROW_DOWN': 40,
		'PRINT_SCREEN': 44, 'INSERT': 45, 'DELETE': 46, 'SEMICOLON': 59, 'WINDOWS_LEFT': 91, 'WINDOWS_RIGHT': 92,
		'SELECT': 93,
		'NUM_PAD_ASTERISK': 106, 'NUM_PAD_PLUS_SIGN': 107, 'NUM_PAD_HYPHEN-MINUS': 109, 'NUM_PAD_FULL_STOP': 110,
		'NUM_PAD_SOLIDUS': 111,
		'NUM_LOCK': 144, 'SCROLL_LOCK': 145, 'SEMICOLON': 186, 'EQUALS_SIGN': 187, 'COMMA': 188, 'HYPHEN-MINUS': 189,
		'FULL_STOP': 190, 'SOLIDUS': 191, 'GRAVE_ACCENT': 192, 'LEFT_SQUARE_BRACKET': 219, 'REVERSE_SOLIDUS': 220,
		'RIGHT_SQUARE_BRACKET': 221, 'APOSTROPHE': 222};

	/* 0 - 9 */
	for (var i = 48; i <= 57; i++) {
		this.KEY['' + (i - 48)] = i;
	}
	/* A - Z */
	for (i = 65; i <= 90; i++) {
		this.KEY['' + String.fromCharCode(i)] = i;
	}
	/* NUM_PAD_0 - NUM_PAD_9 */
	for (i = 96; i <= 105; i++) {
		this.KEY['NUM_PAD_' + (i - 96)] = i;
	}
	/* F1 - F12 */
	for (i = 112; i <= 123; i++) {
		this.KEY['F' + (i - 112 + 1)] = i;
	}

	// ------------------------------------------------

	this.handleMouseDown = function (event)
	{
		this.mouseDown = true;
		var newPos = GetRelativePosition(canvas, event.pageX, event.pageY);
		this.lastMouseX = newPos.x;
		this.lastMouseY = newPos.y;
	}

	this.handleMouseUp = function (event)
	{
		this.mouseDown = false;
	}

	this.handleMouseMove = function (event)
	{
		var newPos = GetRelativePosition(canvas, event.pageX, event.pageY);

		this.deltaX = newPos.x - this.lastMouseX;
		this.deltaY = newPos.y - this.lastMouseY;

		this.lastMouseX = newPos.x;
		this.lastMouseY = newPos.y;
	}

	this.handleMouseClick = function (event)
	{
		// Only used for pad emulation on iOS. TODO: Support touch events 
		// iOS emulates taps by sending mousedown then mouseup immediately.
		this.mouseClick = true;
	}

	this.connect = function(document, _canvas)
	{
        canvas = _canvas;
		var bindThis = this;
		$(document).keydown  (function(event) { bindThis.handleKeyDown.call(bindThis, event); });
		$(document).keyup    (function(event) { bindThis.handleKeyUp.call(bindThis, event); });
		$(canvas).mousedown  (function(event) { bindThis.handleMouseDown.call(bindThis, event); });
		$(canvas).click      (function(event) { bindThis.handleMouseClick.call(bindThis, event); });
		$(document).mouseup  (function(event) { bindThis.handleMouseUp.call(bindThis, event); });
		$(document).mousemove(function(event) { bindThis.handleMouseMove.call(bindThis, event); });
	}
	
	// Useful abstraction:
	
	this.PAD = { 'UP': 1, 'DOWN': 2, 'LEFT': 4, 'RIGHT': 8, 'OK': 16, 'CANCEL': 32 };
	
	this.padUpdate = function()
	{
		var state = 0;
		if (this.currentlyPressedKeys[this.KEY.ARROW_UP])  	 state = state | this.PAD.UP;
		if (this.currentlyPressedKeys[this.KEY.ARROW_DOWN])  	state = state | this.PAD.DOWN;
		if (this.currentlyPressedKeys[this.KEY.ARROW_LEFT])  	state = state | this.PAD.LEFT;
		if (this.currentlyPressedKeys[this.KEY.ARROW_RIGHT]) 	state = state | this.PAD.RIGHT;
		if (this.currentlyPressedKeys[this.KEY.SPACEBAR]) 	state = state | this.PAD.OK;
		if (this.currentlyPressedKeys[this.KEY.ENTER]) 		state = state | this.PAD.OK;
		if (this.mouseDown || this.mouseClick) 		        state = state | this.PAD.OK;
		if (this.currentlyPressedKeys[this.KEY.ESCAPE]) 	state = state | this.PAD.CANCEL;
		
		this.padPressed = state & (~this.padState);
		this.padReleased = (~state) & this.padState;
		this.padState = state;
		this.mouseClick = false;
	}
}

function isDef(v) 			{ return v !== undefined; }
function isNull(v) 			{ return v === null; }
function isDefAndNotNull(v) { return vl != null; }

// Helper to provides requestAnimationFrame in a cross browser way.
// http://paulirish.com/2011/requestanimationframe-for-smart-animating/
if ( !window.requestAnimationFrame ) {
	window.requestAnimationFrame = ( function() {
		return window.webkitRequestAnimationFrame ||
		window.mozRequestAnimationFrame ||
		window.oRequestAnimationFrame ||
		window.msRequestAnimationFrame ||
		function( /* function FrameRequestCallback */ callback, /* DOMElement Element */ element ) {
			window.setTimeout( callback, 1000 / 60 );
		};
	} )();
}

// Async Image loader
// from http://www.html5canvastutorials.com/tutorials/html5-canvas-image-loader/
function LoadImages(images, sources, callback) {
    var loadedImages = 0;
    var numImages = 0;
    for (var src in sources)
		++numImages;
    for (var src in sources) {
        images[src] = new Image();
		// Set up a callback to track how many images have been loaded
        images[src].onload = function(){
            if (++loadedImages >= numImages) {
                callback();
            }
        };
		images[src].onerror = images[src].onload; // Not a terribly sophisticated error handler. :)
		images[src].onabort = images[src].onload; 

        images[src].src = sources[src]; // Trigger the image load
    }
}

// Async loader
function MultiStepLoader(loadSteps, finale)
{
	if (loadSteps.length == 0)
	{
		finale();
		return;
	}
	var startTime = Date.now()
	var stepsCompleted = 0;
	for (var i = 0; i < loadSteps.length; ++i)
	{
		var stepFunc = loadSteps[i][1];
		stepFunc(LoaderInternalCallback, i);
	}
	
	function LoaderInternalCallback(i)
	{
		window.console && window.console.log("Load step completed: " + loadSteps[i][0] + " in " + (Date.now() - startTime).toString() + " ms" );
		++stepsCompleted;
		if (stepsCompleted >= loadSteps.length)
		{
			finale();
		}
	}	
}

// http://stackoverflow.com/questions/1114465/getting-mouse-location-in-canvas/6551032#6551032
function GetRelativePosition(target, x,y) {
	//this section is from http://www.quirksmode.org/js/events_properties.html
	// jQuery normalizes the pageX and pageY
	// pageX,Y are the mouse positions relative to the document
	// offset() returns the position of the element relative to the document
	var offset = $(target).offset();
	var x = x - offset.left;
	var y = y - offset.top;

	return {"x": x, "y": y};
}

var textStartColor = { r: 116, g: 175, b: 173 };
var textEndColor = { r: 217, g: 133, b: 59 };
lerp = function(a,b,u) {
    return (1-u) * a + u * b;
};

// Simple menu class

Menu = function(title, items, footer, y, size, width, callback, backgroundCallback)
{
	this.title = title;
	this.items = items;
	this.footer = footer;
	this.selectedItem = 0;
	this.callback = callback;
	this.y = y;
	this.size = size;
	this.width = width;
    this.v = -0.5;
	this.backgroundCallback = backgroundCallback;
}

Menu.prototype.constructor = Menu;

Menu.prototype.Render = function(elapsed)
{
	if (this.backgroundCallback)
		this.backgroundCallback(elapsed);
	else
	{
		var lingrad = ctx.createLinearGradient(0,0,0,canvas.height);
		lingrad.addColorStop(0, '#000');
		lingrad.addColorStop(1, '#023');
		ctx.fillStyle = lingrad;
		ctx.fillRect(0,0,canvas.width, canvas.height);
	}
	
	ctx.textAlign = "center";
    ctx.strokeStyle = "#74AFAD";
    ctx.lineWidth = 2;
	ctx.fillStyle = "#558C89";

	var y = this.y;
	if (this.title)
	{
		ctx.font = Math.floor(this.size*1.3).toString() + "px Times New Roman";
		ctx.fillText(this.title, canvas.width/2, y);
        ctx.strokeText(this.title, canvas.width/2, y);
		y += this.size;
	}
    ctx.lineWidth = 1;
	for (var i = 0; i < this.items.length; ++i)
	{
		var size = Math.floor(this.size*0.8);
		if (i == this.selectedItem)
		{        
			this.v = Math.max(0, Math.min(1, this.v + elapsed));
            //console.log(lastTime);
            var r = parseInt(lerp(textStartColor.r, textEndColor.r, this.v));
            var g = parseInt(lerp(textStartColor.g, textEndColor.g, this.v));
            var b = parseInt(lerp(textStartColor.b, textEndColor.b, this.v));
			ctx.fillStyle = 'rgb('+r+','+g+','+b+')';
            size = this.size;            
		}
		ctx.font = size.toString() + "px Times New Roman";
		y += this.size;
		ctx.fillText(this.items[i], canvas.width/2, y);
        ctx.strokeText(this.items[i], canvas.width/2, y);
		ctx.fillStyle = "#74AFAD";
	}
	if (this.footer)
	{      
        ctx.lineWidth = 0.5;
        ctx.strokeStyle = "#ECECEA";
        ctx.fillStyle = "black";  
		ctx.textAlign = "right";
		ctx.font = "14px Times New Roman";
		ctx.fillText(this.footer, canvas.width-1, canvas.height-3);
        ctx.strokeText(this.footer, canvas.width-1, canvas.height-3);
	}
}	

Menu.prototype.Input = function(elapsed)
{
	InputManager.padUpdate();
	if (InputManager.padPressed & InputManager.PAD.OK)
	{
		AudioManager.play("select");
		this.callback(this.selectedItem);
		return;
	}
	if (InputManager.padPressed & InputManager.PAD.CANCEL)
	{
		this.callback(-1);
		return;
	}
	var prevSelected = this.selectedItem;
	if (InputManager.padPressed & InputManager.PAD.UP)
		this.selectedItem = (this.selectedItem + this.items.length - 1) % this.items.length;
	if (InputManager.padPressed & InputManager.PAD.DOWN)
		this.selectedItem = (this.selectedItem + 1) % this.items.length;

	var leftx = (canvas.width - this.width)/2;
	if (InputManager.lastMouseX >= leftx && InputManager.lastMouseX < leftx+this.width)
	{
		var y = this.y + this.size*0.2; // Adjust for baseline
		if (this.title)
			y += this.size;
		if (InputManager.lastMouseY >= y && InputManager.lastMouseY < (y + this.size*this.items.length))
			this.selectedItem = Math.floor((InputManager.lastMouseY - y)/this.size);
	}
	if (prevSelected != this.selectedItem)
	{
        this.v = -0.5;
		AudioManager.play("blip");
	}
}	

Menu.prototype.Tick = function(elapsed)
{
	//fps.update(elapsed);
	this.Input(elapsed);
	this.Render(elapsed);
}

var AudioManager = new function () {
	this.load_queue = [];
	this.loading_sounds = 0;
	this.sounds = {};

    var tempAudio = new Audio();
    this.fileExtension = tempAudio.canPlayType('audio/ogg; codecs="vorbis"')? ".ogg" : ".mp3";
	delete tempAudio;
	
	var channel_max = 10;
	this.channels = new Array();
	for (a = 0; a < channel_max; a++) {
		this.channels[a] = new Audio();
		this.channels[a].timeFinished = -1;
	}
	
	this.load = function (files, callback) {
		var audioCallback = function (evt) {
			AudioManager._loadFinished(callback);
			evt.target.removeEventListener('canplaythrough', audioCallback, false);
			evt.target.removeEventListener('load', audioCallback, false);
			evt.target.removeEventListener('error', audioCallback, false);
		}
		var numLoaded = 0;
		this.loading_sounds = 0;
		if (!navigator.userAgent.match(/like Mac OS X/i)) // iOS browsers don't do any Audio without user interaction
			for (name in files) {
				if (this.sounds[name])
					continue;
				++numLoaded;
				this.loading_sounds++;
				var snd = new Audio();
				snd.timeFinished = -1;
				var filename = files[name] + this.fileExtension;
				this.sounds[name] = snd;
				snd.addEventListener('canplaythrough', audioCallback, false);
				snd.addEventListener('load', audioCallback, false);
				snd.addEventListener('error', audioCallback, false);
				snd.src = filename;
				snd.load();
			}
		// No sounds to load? Fire callback directly
		if (numLoaded == 0)
		{
			callback();
		}
	}
	
	this._loadFinished = function (callback) {
		console.log("Audio Load Callback " + this.loading_sounds);
		this.loading_sounds--;
		if (this.loading_sounds == 0) {
			callback();
		}
	}
	
	this.play = function (s) {
		ss = this.sounds[s];
		if (!ss)
			return;
		// First try playing the original sound to avoid lag on some browsers
		var thistime = new Date().getTime();
		if (ss.timeFinished < thistime) {
			ss.timeFinished = thistime + ss.duration * 1000;
			ss.play();
		} else {
			// Failing that, load a copy of that sound in a channel and play it
			for (a = 0; a < this.channels.length; a++) {
				var c = this.channels[a];
				if (c.timeFinished < thistime) {
					c.timeFinished = thistime + ss.duration * 1000;
					c.src = ss.src;
					c.load();
					c.play();
					break;
				}
			}
		}
	}
}
