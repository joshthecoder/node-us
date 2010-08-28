function Renderer(context, successCallback) {
    var that = this;
    this.context = context;
    this.mapImage = new Image();
    this.mapImage.onload = successCallback;
    this.mapImage.src = "small_map.png";
    this.maxEmberSize = 6;
    this.youngEmberColor = [255, 255, 255, 1.0];
    this.oldEmberColor = [200, 200, 200, 0.0];
    this.emberColorDifference = [
        this.oldEmberColor[0] - this.youngEmberColor[0],
        this.oldEmberColor[1] - this.youngEmberColor[1],
        this.oldEmberColor[2] - this.youngEmberColor[2],
        this.oldEmberColor[3] - this.youngEmberColor[3]
    ];

    function drawEmber(ember) {
        that.context.fillStyle = 'rgba(' +
            Math.floor(that.youngEmberColor[0] + (that.emberColorDifference[0] * ember.age)) + ',' +
            Math.floor(that.youngEmberColor[1] + (that.emberColorDifference[1] * ember.age)) + ',' +
            Math.floor(that.youngEmberColor[2] + (that.emberColorDifference[2] * ember.age)) + ',' +
            (that.youngEmberColor[3] + (that.emberColorDifference[3] * ember.age)) + ')';
        var size = (1.0 - ember.age) * that.maxEmberSize;
        var offset = size / 2;
        context.fillRect(ember.x - offset, ember.y - offset, size, size);
    }

    this.paint = function(embers) {
        this.context.drawImage(this.mapImage, 0, 0);
        for (var i = 0; i < embers.length; i++) {
            drawEmber(embers[i]);
        }
    }
}
