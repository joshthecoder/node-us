function Renderer(successCallback) {
    var that = this;
    this.width = 1000;
    this.height = 507;
    this.xOffset = -25;

    this.background = document.body.appendChild(document.createElement("div"));
    this.background.style.textAlign = "center";
    this.background.style.margin = "0 auto";
    this.background.style.width = this.width + "px";
    this.background.style.height = this.height + "px";
    this.background.style.backgroundImage = "url(pixel_map.png)"

    this.canvas = this.background.appendChild(document.createElement("canvas"));
    this.canvas.width = this.width;
    this.canvas.height = this.height;
    this.canvas.addEventListener("mousemove", mouseMoved, false);
    this.context = this.canvas.getContext('2d');

    this.tweetBox = document.body.appendChild(document.createElement("div"));
    this.tweetBox.id = 'tweet';
    this.tweetBox.style.fontFamily = 'OhFourBeeOhThree';
    this.tweetBox.style.fontSize = '20pt';
    this.tweetBox.style.color = 'white';

    this.maxEmberSize = 6;
    this.youngEmberColor = [255, 255, 255, 1.0];
    this.oldEmberColor = [200, 200, 200, 0.0];
    this.emberColorDifference = [
        this.oldEmberColor[0] - this.youngEmberColor[0],
        this.oldEmberColor[1] - this.youngEmberColor[1],
        this.oldEmberColor[2] - this.youngEmberColor[2],
        this.oldEmberColor[3] - this.youngEmberColor[3]
    ];

    this.currentEmber = null; 
    function nearEmber(ember) {
        return Math.abs(that.currentX - ember.x) < 5 && Math.abs(that.currentY - ember.y) < 5;
    }

    function drawEmber(ember) {
        that.context.fillStyle = 'rgba(' +
            Math.floor(that.youngEmberColor[0] + (that.emberColorDifference[0] * ember.age)) + ',' +
            Math.floor(that.youngEmberColor[1] + (that.emberColorDifference[1] * ember.age)) + ',' +
            Math.floor(that.youngEmberColor[2] + (that.emberColorDifference[2] * ember.age)) + ',' +
            (that.youngEmberColor[3] + (that.emberColorDifference[3] * ember.age)) + ')';

        if (nearEmber(ember)) {
            that.context.fillStyle = "rgb(255, 0, 0);";
            that.tweetBox.innerHTML = ember.text;
        }

        var size = (1.0 - ember.age) * that.maxEmberSize;
        var offset = size / 2;
        that.context.fillRect(ember.x - offset, ember.y - offset, size, size);
    }

    this.paint = function(embers) {
        this.context.clearRect(0, 0, this.width, this.height);
        var showEmber = null;
        for (var i = 0; i < embers.length; i++) {
            drawEmber(embers[i]);
        }
    }

    function mouseMoved(ev) {
        var x, y;
        // Get the mouse position relative to the canvas element.
        if (ev.offsetX || ev.offsetX == 0) { // Opera & WebKit
          x = ev.offsetX;
          y = ev.offsetY;
        } else if (ev.layerX || ev.layerX == 0) { // Firefox
          x = ev.layerX - that.canvas.offsetLeft;
          y = ev.layerY - that.canvas.offsetTop;
        }

        if (that.currentX != x || that.currentY != y) {
            that.currentX = x;
            that.currentY = y;
        }
    }

    return this;
}
