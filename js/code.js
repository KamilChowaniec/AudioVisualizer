/// <reference path="../../html projs/test php/./p5.global-mode.d.ts" />

class Shape {
    constructor(x, y, sides, incolor, size, outcolor, bordersize, dir, speed, rotation, life, shapeVariation) {
        var piece = 2 * PI / sides;
        this.c = {
            x: x,
            y: y
        };
        let randpoint = function (c, maxlen, startang, piece) {
            var len = Math.random() * shapeVariation * maxlen + (1 - shapeVariation) * maxlen;
            var ang = startang + Math.random() * piece / 2 * shapeVariation + piece / 2;
            return {
                x: len * Math.cos(ang),
                y: len * Math.sin(ang),
            };
        };
        this.pos = [];
        for (let i = 0; i < sides; i++) {
            this.pos.push(randpoint(this.c, size, i * piece, piece));
        }
        this.dir = dir;
        this.color = {
            out: outcolor,
            outa: outcolor._getAlpha(),
            in: incolor,
            ina: incolor._getAlpha()
        };
        this.speed = speed;
        this.rotation = rotation;
        this.bordersize = bordersize;
        this.life = life;
        this.maxlife = life;
        this.spawning = true;
        this.spawninglife = 0;
        this.spawningmax = life / 10;
        this.sides = sides;
        this.rotationang = this.rotation;

    }
    move() {
        cosinus = Math.cos(this.dir) * this.speed;
        sinus = Math.sin(this.dir) * this.speed;
        this.c.x += cosinus;
        this.c.y += sinus;

        if (this.spawning) {
            this.spawninglife += 0.05 * this.maxlife;
            if (this.spawninglife > this.maxlife) {
                this.spawning = false;
            }
        } else {
            this.life--;
            if (this.life < 0) {
                this.life = 0;
            }
        }
        this.rotationang += this.rotation;
    }

    show() {
        if (this.spawning) {
            this.color.in.setAlpha(map(this.spawninglife, 0, 3 * this.maxlife, 0, this.color.ina));
            this.color.out.setAlpha(map(this.spawninglife, 0, 3 * this.maxlife, 0, this.color.outa));
        } else {
            this.color.in.setAlpha(map(this.life, 0, 3 * this.maxlife, 0, this.color.ina))
            this.color.out.setAlpha(map(this.life, 0, 3 * this.maxlife, 0, this.color.outa));
        }
        stroke(this.color.out);
        strokeWeight(this.bordersize);
        fill(this.color.in);

        beginShape();
        push();
        translate(this.c.x, this.c.y);
        rotate(this.rotationang);
        for (let i = 0; i < this.sides; i++) {
            vertex(this.pos[i].x, this.pos[i].y);
        }
        endShape(CLOSE);
        pop();
    }

    isAlive() {
        return this.life > 0;
    }
}

//Specific
var modul = {
    visibleFreq: [0, 1],
    octaveBands: null,
    smooth: 0.6,
    inIntensity: 1,
    outIntensity: 1,
    DBT: false,
    threshold: 0,
    weightFreq: false

}

//Visuals
var vis = {
    general: {
        radius: 190,
        rotation: 0,
        spinSpeed: 0,
        spinang: 0,
        flipSpin: false
    },
    lines: {
        widthRange: [1, 1],
        widthChangeFreq: 1,
        lowColor: null,
        highColor: null
    },
    edges: {
        inWidth: 0,
        inColor: null,
        outWidth: 0,
        outColor: null,
        radius: 180
    },
    shapes: {
        lifeRange: [300, 500],
        rotationRange: [0, Math.Pi],
        speedRange: [10, 20],
        spawnChance: 0.001,
        sidesRange: [3, 5],
        sizeRange: [20, 45],
        borderWeightRange: [1, 4],
        fillColor: null,
        borderColor: null
    },
    bg: {
        fillColor: null,
        borderColor: null,
        useIMG: false,
        fadeUI: false
    }
}

//Controls
var slider;
var volumeSlider;

var canvas;
var lastval = 0;
var fftSmooth;
var fftlast;
var minVal = 0.0;
var maxVal = 0.0;
var firstMinDone = false;
var Shapes;
var volC1;
var volC2;
var TESTYY = false;
var errTimeout;
var soundIsLoading = false;
var defaultPreset;
var vol = 0.2;
var justToggled = false;
var justJumped = false;
var convertSpectrum;

function preload() {
    bgimg = loadImage("img/diablo-iii-hd-wallpapers-32982-583428.jpg");
    sound = loadSound('Running Away.mp3');
}



function setup() {
    imageMode(CENTER);
    volC1 = color(0, 0, 255, floor(.25 * 255));
    volC2 = color(255, 0, 0, floor(.25 * 255));
    vis.lines.lowColor = color(0, 0, 0);
    vis.lines.highColor = color(0, 0, 0);
    vis.edges.inColor = color(0, 0, 0);
    vis.edges.outColor = color(0, 0, 0);
    vis.shapes.fillColor = color(0, 0, 0);
    vis.shapes.borderColor = color(0, 0, 0);
    vis.bg.fillColor = color(0, 0, 0);
    vis.bg.borderColor = color(0, 0, 0);

    canvas = createCanvas(1530, 850, P2D);
    canvas.mouseClicked(togglePlay);
    fft = new p5.FFT();
    peaks = new p5.PeakDetect();
    sound.amp(vol);
    sound.onended(onSoundEnd);
    generateUI();
    setSoundSlider();
    $.getJSON("defaultPreset3.json", function (data) {
        defaultPreset = data;
        loadPreset(data)
    });

    fftSmooth = Array(fft.analyze().length);
    fftlast = Array(fft.analyze().length);
    for (i = 0; i < fftSmooth.length; i++) {
        fftSmooth[i] = 1;
        fftlast[i] = 1;
    }
    //sound.play();
    Shapes = [];
    modul.octaveBands = fft.getOctaveBands(30);
}

function draw() {
    if (vis.bg.useIMG) {
        clear();
        image(bgimg, width / 2, height / 2);
    }
    else background(vis.bg.fillColor);
    // clear();
    var spectrum = fft.analyze();
    spectrum = fft.logAverages(modul.octaveBands);
    peaks.update(fft);

    var weight = (width - 20) / spectrum.length;
    var maxHeight = height / 2;
    var last = 0;
    for (i = 0; i < spectrum.length; i++) {
        // Get spectrum value (using dB conversion or not, as desired)
        fftCurr = spectrum[i];
        if (fftCurr < modul.threshold)
            fftCurr *= fftCurr / modul.threshold;

        // Smooth using exponential moving average
        fftSmooth[i] = (modul.smooth) * fftSmooth[i] + ((1 - modul.smooth) * fftCurr);

        // fftSmooth[i] = spectrum[i];
        // Find max and min values ever displayed across whole spectrum
        if (fftSmooth[i] > maxVal) {
            maxVal = fftSmooth[i];
        }
        if (!firstMinDone || (fftSmooth[i] < minVal)) {
            minVal = fftSmooth[i];
        }
    }
    //maxVal = 190;
    minVal = 0;



    // Calculate the total range of smoothed spectrum; this will be used to scale all values to range 0...1
    var range = maxVal - minVal;
    var scaleFactor = range + 0.00001; // avoid div. by zero

    var toremove = [];
    for (i = 0; i < Shapes.length; i++) {
        if (Shapes[i].isAlive()) {
            Shapes[i].move();
            Shapes[i].show();
        }
        else {
            toremove.push(Shapes[i]);
        }
    }
    for (i = 0; i < toremove.length; i++) {
        Shapes.splice(Shapes.indexOf(toremove[i]), 1);
    }
    circularVisualizer(spectrum, vis.general.radius, scaleFactor);
    if (sound.isPlaying())
        updateSoundSlider();
}



function updateSoundSlider() {
    if (updateSoundSlider.lastval == undefined) {
        updateSoundSlider.lastval = 0;
    }
    var cTime = sound.currentTime();
    if (cTime != updateSoundSlider.lastval) {
        var $slider = $("#time");
        if (!$slider[0].sliding) {
            $slider.slider("value", cTime);
        }
    }
    updateSoundSlider.lastval = cTime;
}

function circularVisualizer(spectrum, r, scaleFactor) {
    var maxHeight = 2 * Math.min(height - 2 * r, width - 2 * r, r) / 3;

    push();
    translate(width / 2, height / 2);
    rotate(vis.general.rotation + vis.general.spinang);
    vis.general.spinang += (vis.general.flipSpin ? -1 : 1) * vis.general.spinSpeed;
    translate(-width / 2, -height / 2);

    var c = {
        x: width / 2,
        y: height / 2,
        r: r
    };

    noFill();
    strokeWeight(1);

    var p = {
        x: 0,
        y: 0
    };

    var starti = round(modul.visibleFreq[0] * spectrum.length);
    var lasti = round(modul.visibleFreq[1] * spectrum.length);
    var len = lasti - starti;
    if (len < 3) {
        while (true) {
            lasti++;
            if (lasti > spectrum.length) lasti = spectrum.length;
            len = lasti - starti;
            if (len >= 3) break;

            starti--;
            if (starti < 0) starti = 0;
            len = lasti - starti;
            if (len >= 3) break;
        }
    }


    var affected = 3;
    var arr = [];
    for (var z = -affected; z < affected; z++) {
        if (z < 0)
            arr.push(fftSmooth[lasti + z]);
        else
            arr.push(fftSmooth[starti + z]);
    }
    arr = arraysmooth(arr, 1);
    for (var z = -affected; z < affected; z++) {
        if (z < 0)
            fftSmooth[lasti + z] = arr[z + affected];
        else
            fftSmooth[starti + z] = arr[z + affected];
    }


    inc = 2 * PI / len;
    angle = 0;

    //strokeCap(SQUARE);
    angleMode(RADIANS);
    //Outer Edge with Lines
    beginShape();
    for (i = starti; i < lasti; i++) {
        cosinus = Math.cos(angle);
        sinus = Math.sin(angle);

        //point on circle circucmference
        p.x = c.x + c.r * cosinus
        p.y = c.y + c.r * sinus

        //normalize height to 1
        h = ((fftSmooth[i] - minVal) / scaleFactor);



        //actual height
        var fftSmoothDisplayOut = maxHeight * h + 1;
        var fftSmoothDisplayIn = fftSmoothDisplayOut;

        //multiply by intensity
        fftSmoothDisplayOut *= modul.outIntensity;
        fftSmoothDisplayIn *= modul.inIntensity;

        //Bigger -> Bigger, Smaller -> Smaller
        fftSmoothDisplayOut *= fftSmoothDisplayOut / maxHeight;
        fftSmoothDisplayIn *= fftSmoothDisplayIn / maxHeight;



        //Inside Line Beggining
        startp = {
            x: p.x - fftSmoothDisplayIn * cosinus,
            y: p.y - fftSmoothDisplayIn * sinus
        }

        //Save for drawing Inner Edge
        spectrum[i] = startp;

        //Outside Line End
        endp = {
            x: p.x + fftSmoothDisplayOut * cosinus,
            y: p.y + fftSmoothDisplayOut * sinus
        };
        // stroke(map(angle,0,2*PI,0,360),100,100);
        vertex(endp.x, endp.y);

        //Draw Line

        var perc = map(angle, 0, 2 * PI / vis.lines.widthChangeFreq, 0, 2) % 2;
        perc = perc > 1 ? 2 - perc : perc;
        var w = lerp(vis.lines.widthRange[0], vis.lines.widthRange[1], perc);
        var col = lerpColor(vis.lines.lowColor, vis.lines.highColor, perc);
        stroke(lerpColor(vis.lines.lowColor, vis.lines.highColor, Math.max(fftSmoothDisplayIn, fftSmoothDisplayOut) / maxHeight));
        strokeWeight(lerp(vis.lines.widthRange[0], vis.lines.widthRange[1], Math.max(fftSmoothDisplayIn, fftSmoothDisplayOut) / maxHeight));
        line(startp.x, startp.y, endp.x, endp.y);
        // gradientLine(p.x,p.y,angle,fftSmoothDisplayOut,lineWeight,color(lineColor[0], lineColor[1], lineColor[2], lineColor[3]),color(0,100,100));

        angle += inc;

        //Add Shape
        if (sound.isPlaying() && Math.random() < vis.shapes.spawnChance / len) {
            Shapes.push(
                new Shape(
                    p.x,
                    p.y,
                    random(vis.shapes.sidesRange[0], vis.shapes.sidesRange[1]),
                    color(vis.shapes.fillColor.toString()),
                    random(vis.shapes.sizeRange[0], vis.shapes.sizeRange[1]),
                    color(vis.shapes.borderColor.toString()),
                    random(vis.shapes.borderWeightRange[0], vis.shapes.borderWeightRange[1]),
                    angle,
                    random(vis.shapes.speedRange[0], vis.shapes.speedRange[1]),
                    (random() > 0.5 ? 1 : -1) * random(vis.shapes.rotationRange[0], vis.shapes.rotationRange[1]),
                    random(vis.shapes.lifeRange[0], vis.shapes.lifeRange[1]),
                    0.2
                )
            );
        }
    }
    strokeWeight(vis.edges.outWidth);
    stroke(vis.edges.outColor);
    endShape(CLOSE);

    //Inner Edge
    beginShape();
    for (i = starti; i < lasti; i++)
        vertex(spectrum[i].x, spectrum[i].y);
    strokeWeight(vis.edges.inWidth);
    stroke(vis.edges.inColor);
    endShape(CLOSE);
    //strokeCap(ROUND);

    pop();
}


function arraysmooth(arr, windowSize, getter = (value) => value, setter) {
    const get = getter
    const result = []

    for (let i = 0; i < arr.length; i += 1) {
        const leftOffeset = i - windowSize
        const from = leftOffeset >= 0 ? leftOffeset : 0
        const to = i + windowSize + 1

        let count = 0
        let sum = 0
        for (let j = from; j < to && j < arr.length; j += 1) {
            sum += get(arr[j])
            count += 1
        }

        result[i] = setter ? setter(arr[i], sum / count) : sum / count
    }

    return result
}

function onSoundEnd() {
    var shouldExit = false;
    if (justToggled) {
        justToggled = false;
        shouldExit = true;
    }
    if (justJumped) {
        justJumped = false
        shouldExit = true;
    }
    if (shouldExit) return;

    console.log("ended");
    justToggled = true;
    sound.stop();
    $("#time").slider("value", 0);
}

function setSoundSlider() {
    $("#time").slider("option", "max", sound.duration());
    $("#showTime").html(HMSToString(sToHMS(round(sound.duration()))));
    $("#time").slider("value", 0);
}

function keyPressed() {
    console.log($("#specConverter"))
    $("#specConverter").spectrum("set", "rgba(255,0,120,0.8)");
    console.log($("#specConverter").spectrum("get"));
}

function download(content, fileName, contentType) {
    var a = document.createElement("a");
    var file = new Blob([content], { type: contentType });
    a.href = URL.createObjectURL(file);
    a.download = fileName;
    a.click();
}

function gradientLine(x, y, angle, len, w, c1, c2) {
    push();
    translate(x, y);
    rotate(angle);
    strokeWeight(15);
    strokeCap(SQUARE);
    for (var i = 0; i <= len; i += 15) {
        var inter = map(i, 0, len, 0, 1);
        var c = lerpColor(c1, c2, inter);
        stroke(c);
        line(i, 0, i, w);
    }
    pop();
}

function togglePlay() {
    if (cPickerOn || soundIsLoading) return;
    justToggled = true;
    if (sound.isPlaying()) {
        sound.pause();
    } else {
        sound.play();
        if ($("#time")[0].timeChanged) {
            sound.jump($("#time").slider("value"));
            $("#time")[0].timeChanged = false;
        }
        $("#time")[0].sliding = true;
        setTimeout(function () { $("#time")[0].sliding = false; }, 15);
    }
}

function dB(x) {
    if (x == 0) {
        return 0;
    }
    else {
        return 10. * Math.log10(x * x * x * x);
    }
}

function makePreset() {
    return {
        //Modulation
        visibleFreq: $("#visibleFreq").slider("option", "values"),
        octaves: $("#octaves").slider("option", "value"),
        smooth: $("#smooth").slider("option", "value"),
        inIntensity: $("#inIntensity").slider("option", "value"),
        outIntensity: $("#outIntensity").slider("option", "value"),
        DBT: $("#DBT").prop("checked"),
        weightFreq: $("#weightFreq").prop("checked"),

        //Visualisation
        //General
        radius: $("#radius").slider("option", "value"),
        rotation: $("#rotation").slider("option", "value"),
        spinSpeed: $("#spinSpeed").slider("option", "value"),
        flipSpin: $("#flipSpin").prop("checked"),

        //Lines
        lWRange: $("#lWRange").slider("option", "values"),
        lWChangeFreq: $("#lWChangeFreq").slider("option", "value"),
        lLowColor: tcToRGBAString($("#lLowColor").spectrum("get")),
        lHighColor: tcToRGBAString($("#lHighColor").spectrum("get")),

        //Edges
        IEWidth: $("#IEWidth").slider("option", "value"),
        IEColor: tcToRGBAString($("#IEColor").spectrum("get")),
        OEWidth: $("#OEWidth").slider("option", "value"),
        OEColor: tcToRGBAString($("#OEColor").spectrum("get")),

        //Shapes
        //Logic
        lifeRange: $("#lifeRange").slider("option", "values"),
        rotationRange: $("#rotationRange").slider("option", "values"),
        speedRange: $("#speedRange").slider("option", "values"),
        spawnChance: $("#spawnChance").slider("option", "value"),
        //Visuals
        sidesRange: $("#sidesRange").slider("option", "values"),
        sizeRange: $("#sizeRange").slider("option", "values"),
        borderWeightRange: $("#borderWeightRange").slider("option", "values"),
        sFillColor: tcToRGBAString($("#sFillColor").spectrum("get")),
        sBorderColor: tcToRGBAString($("#sBorderColor").spectrum("get")),

        //Background    
        bgBorderColor: tcToRGBAString($("#bgBorderColor").spectrum("get")),
        bgFillColor: tcToRGBAString($("#bgFillColor").spectrum("get")),
        useIMG: $("#useIMG").prop("checked"),
        UIFade: $("#UIFade").prop("checked"),

    };
}

function loadPreset(preset) {
    //Modulation
    setSlider("visibleFreq", "values", preset.visibleFreq);
    setSlider("octaves", "value", preset.octaves);
    setSlider("smooth", "value", preset.smooth);
    setSlider("inIntensity", "value", preset.inIntensity);
    setSlider("outIntensity", "value", preset.outIntensity);
    setCheckbox("DBT", preset.DBT);
    setCheckbox("weightFreq", preset.weightFreq);

    //Visualisation
    //General
    setSlider("radius", "value", preset.radius);
    setSlider("rotation", "value", preset.rotation)
    setSlider("spinSpeed", "value", preset.spinSpeed)
    setCheckbox("flipSpin", preset.flipSpin);

    //Lines
    setSlider("lWRange", "values", preset.lWRange);
    setSlider("lWChangeFreq", "value", preset.lWChangeFreq);
    setSpectrum("lLowColor", preset.lLowColor);
    setSpectrum("lHighColor", preset.lHighColor);

    //Edges
    setSlider("IEWidth", "value", preset.IEWidth);
    setSpectrum("IEColor", preset.IEColor);
    setSlider("OEWidth", "value", preset.OEWidth);
    setSpectrum("OEColor", preset.OEColor);

    //Shapes
    //Logic
    setSlider("lifeRange", "values", preset.lifeRange);
    setSlider("rotationRange", "values", preset.rotationRange);
    setSlider("speedRange", "values", preset.speedRange);
    setSlider("spawnChance", "value", preset.spawnChance);
    //Visuals
    setSlider("sidesRange", "values", preset.sidesRange);
    setSlider("sizeRange", "values", preset.sizeRange);
    setSlider("borderWeightRange", "values", preset.borderWeightRange);
    setSpectrum("sFillColor", preset.sFillColor);
    setSpectrum("sBorderColor", preset.sBorderColor);

    //Background    
    setSpectrum("bgBorderColor", preset.bgBorderColor);
    setSpectrum("bgFillColor", preset.bgFillColor);
    setCheckbox("useIMG", preset.useIMG);
    setCheckbox("UIFade", preset.UIFade);
}

function setSlider(id, option, val) {
    var hs = $(`#${id}`);
    hs.slider('option', option, val);
    hs.slider('option', 'slide')
        .call(hs, null, { handle: $('.ui-slider-handle', hs), [option]: val });
}

function setCheckbox(id, checked) {
    var chck = $(`#${id}`);
    chck.prop('checked', checked).checkboxradio("refresh");
    chck.change();
}

function setSpectrum(id, c) {
    var sp = $(`#${id}`);
    sp.spectrum("set", c);
    sp.spectrum("option", "move")(sp.spectrum("get"));
}

function tcToRGBAString(tc) {
    return `rgba(${Math.round(tc._r)},${Math.round(tc._g)},${Math.round(tc._b)},${tc._a})`;
}

function tcToP5Color(tc) {
    return color(round(tc._r), round(tc._g), round(tc._b), round(map(tc._a, 0, 1, 0, 255)));
}

function animatePresetChange(preset, ms) {
    var converter = $("#specConverter");
    var conv = function (color) {
        converter.spectrum("set", color);
        return tcToP5Color(converter.spectrum("get"));
    };
    preset.lLowColor = conv(preset.lLowColor);
    preset.lHighColor = conv(preset.lHighColor);
    preset.IEColor = conv(preset.IEColor);
    preset.OEColor = conv(preset.OEColor);
    preset.OEColor = conv(preset.OEColor);
    preset.sFillColor = conv(preset.sFillColor);
    preset.sBorderColor = conv(preset.sBorderColor);
    preset.bgBorderColor = conv(preset.bgBorderColor);
    preset.bgFillColor = conv(preset.bgFillColor);
    var startoctaves = $("#octaves").slider("option", "value");
    var intervals = round(ms / 20);
    var intervalPreset = {
        visibleFreq: [Array(intervals), Array(intervals)],
        octaves: Array(intervals),
        smooth: Array(intervals),
        inIntensity: Array(intervals),
        outIntensity: Array(intervals),
        DBT: preset.DBT,
        weightFreq: preset.weightFreq,

        //Visualisation
        //General
        radius: Array(intervals),
        rotation: Array(intervals),
        spinSpeed: Array(intervals),
        flipSpin: preset.flipSpin,

        //Lines
        lWRange: [Array(intervals), Array(intervals)],
        lWChangeFreq: Array(intervals),
        lLowColor: Array(intervals),
        lHighColor: Array(intervals),

        //Edges
        IEWidth: Array(intervals),
        IEColor: Array(intervals),
        OEWidth: Array(intervals),
        OEColor: Array(intervals),

        //Shapes
        //Logic
        lifeRange: [Array(intervals), Array(intervals)],
        rotationRange: [Array(intervals), Array(intervals)],
        speedRange: [Array(intervals), Array(intervals)],
        spawnChance: Array(intervals),
        //Visuals
        sidesRange: [Array(intervals), Array(intervals)],
        sizeRange: [Array(intervals), Array(intervals)],
        borderWeightRange: [Array(intervals), Array(intervals)],
        sFillColor: Array(intervals),
        sBorderColor: Array(intervals),

        //Background    
        bgBorderColor: Array(intervals),
        bgFillColor: Array(intervals),
        useIMG: preset.useIMG,
        UIFade: preset.UIFade,
    }
    for (var i = 0; i < intervals; i++) {
        var perc = i / (intervals - 1);
        intervalPreset.visibleFreq[0][i] = lerp(modul.visibleFreq[0], preset.visibleFreq[0], perc);
        intervalPreset.visibleFreq[1][i] = lerp(modul.visibleFreq[1], preset.visibleFreq[1], perc);
        intervalPreset.octaves[i] = fft.getOctaveBands(round(lerp(startoctaves, preset.octaves, perc)));
        intervalPreset.smooth[i] = lerp(modul.smooth, preset.smooth, perc);
        intervalPreset.inIntensity[i] = lerp(modul.inIntensity, preset.inIntensity, perc);
        intervalPreset.outIntensity[i] = lerp(modul.outIntensity, preset.outIntensity, perc);
        intervalPreset.radius[i] = lerp(vis.general.radius, preset.radius, perc);
        intervalPreset.rotation[i] = lerp(vis.general.rotation, preset.rotation, perc);
        intervalPreset.spinSpeed[i] = lerp(vis.general.spinSpeed, preset.spinSpeed, perc);
        intervalPreset.lWRange[0][i] = lerp(vis.lines.widthRange[0], preset.lWRange[0], perc);
        intervalPreset.lWRange[1][i] = lerp(vis.lines.widthRange[1], preset.lWRange[1], perc);
        intervalPreset.lWChangeFreq[i] = lerp(vis.lines.widthChangeFreq, preset.lWChangeFreq, perc);
        intervalPreset.lLowColor[i] = lerpColor(vis.lines.lowColor, preset.lLowColor, perc);
        intervalPreset.lHighColor[i] = lerpColor(vis.lines.highColor, preset.lHighColor, perc);
        intervalPreset.IEWidth[i] = lerp(vis.edges.inWidth, preset.IEWidth, perc);
        intervalPreset.IEColor[i] = lerpColor(vis.edges.inColor, preset.IEColor, perc);
        intervalPreset.OEWidth[i] = lerp(vis.edges.outWidth, preset.OEWidth, perc);
        intervalPreset.OEColor[i] = lerpColor(vis.edges.outColor, preset.OEColor, perc);
        intervalPreset.lifeRange[0][i] = lerp(vis.shapes.lifeRange[0], preset.lifeRange[0], perc);
        intervalPreset.lifeRange[1][i] = lerp(vis.shapes.lifeRange[1], preset.lifeRange[1], perc);
        intervalPreset.rotationRange[0][i] = lerp(vis.shapes.rotationRange[0], preset.rotationRange[0], perc);
        intervalPreset.rotationRange[1][i] = lerp(vis.shapes.rotationRange[1], preset.rotationRange[1], perc);
        intervalPreset.speedRange[0][i] = lerp(vis.shapes.speedRange[0], preset.speedRange[0], perc);
        intervalPreset.speedRange[1][i] = lerp(vis.shapes.speedRange[1], preset.speedRange[1], perc);
        intervalPreset.spawnChance[i] = lerp(vis.shapes.spawnChance, preset.spawnChance, perc);
        intervalPreset.sidesRange[0][i] = lerp(vis.shapes.sidesRange[0], preset.sidesRange[0], perc);
        intervalPreset.sidesRange[1][i] = lerp(vis.shapes.sidesRange[1], preset.sidesRange[1], perc);
        intervalPreset.sizeRange[0][i] = lerp(vis.shapes.sizeRange[0], preset.sizeRange[0], perc);
        intervalPreset.sizeRange[1][i] = lerp(vis.shapes.sizeRange[1], preset.sizeRange[1], perc);
        intervalPreset.borderWeightRange[0][i] = lerp(vis.shapes.borderWeightRange[0], preset.borderWeightRange[0], perc);
        intervalPreset.borderWeightRange[1][i] = lerp(vis.shapes.borderWeightRange[1], preset.borderWeightRange[1], perc);
        intervalPreset.sFillColor[i] = lerpColor(vis.shapes.fillColor, preset.sFillColor, perc);
        intervalPreset.sBorderColor[i] = lerpColor(vis.shapes.borderColor, preset.sBorderColor, perc);
        intervalPreset.bgBorderColor[i] = lerpColor(vis.bg.borderColor, preset.bgBorderColor, perc);
        intervalPreset.bgFillColor[i] = lerpColor(vis.bg.fillColor, preset.bgFillColor, perc);
    }



    function changeToInterval(i) {
        //Modulation
        modul.visibleFreq = [intervalPreset.visibleFreq[0][i], intervalPreset.visibleFreq[1][i]];
        modul.octaveBands = intervalPreset.octaves[i];
        modul.smooth = intervalPreset.smooth[i];
        modul.inIntensity = intervalPreset.inIntensity[i];
        modul.outIntensity = intervalPreset.outIntensity[i];

        //Visuals
        vis.general.radius = intervalPreset.radius[i];
        vis.general.rotation = intervalPreset.rotation[i];
        vis.general.spinSpeed = intervalPreset.spinSpeed[i];
        vis.lines.widthRange = [intervalPreset.lWRange[0][i], intervalPreset.lWRange[1][i]];
        vis.lines.widthChangeFreq = intervalPreset.lWChangeFreq[i];
        vis.lines.lowColor = intervalPreset.lLowColor[i];
        vis.lines.highColor = intervalPreset.lHighColor[i];
        vis.edges.inWidth = intervalPreset.IEWidth[i];
        vis.edges.inColor = intervalPreset.IEColor[i];
        vis.edges.outWidth = intervalPreset.OEWidth[i];
        vis.edges.outColor = intervalPreset.OEColor[i];
        vis.shapes.lifeRange = [intervalPreset.lifeRange[0][i], intervalPreset.lifeRange[1][i]];
        vis.shapes.rotationRange = [intervalPreset.rotationRange[0][i], intervalPreset.rotationRange[1][i]];
        vis.shapes.speedRange = [intervalPreset.speedRange[0][i], intervalPreset.speedRange[1][i]];
        vis.shapes.spawnChance = intervalPreset.spawnChance[i];
        vis.shapes.sidesRange = [intervalPreset.sidesRange[0][i], intervalPreset.sidesRange[1][i]];
        vis.shapes.sizeRange = [intervalPreset.sizeRange[0][i], intervalPreset.sizeRange[1][i]];
        vis.shapes.borderWeightRange = [intervalPreset.borderWeightRange[0][i], intervalPreset.borderWeightRange[1][i]];
        vis.shapes.fillColor = intervalPreset.sFillColor[i];
        vis.shapes.borderColor = intervalPreset.sBorderColor[i];
        vis.bg.fillColor = intervalPreset.bgFillColor[i];
        vis.bg.borderColor = intervalPreset.bgBorderColor[i];
        if (i + 1 < intervals)
            setTimeout(function () { changeToInterval(i + 1) }, 20);
    }
    changeToInterval(1);
}

function changeSong(filename, file) {
    if (soundIsLoading) {
        setTimeout(function () { changeSong(filename, song) }, 200);
        return;
    }
    var res = filename.split(".");
    res = res.slice(0, res.length - 1);
    var songname = '';
    for (var i = 0; i < res.length; i++) {
        songname += res[i];
        if (i < res.length - 1) songname += '.';
    }
    if (sound.isPlaying())
        sound.pause();

    soundIsLoading = true;
    load = loadSound(file,
        function () {
            //Success
            sound = load;
            $("#songTitle").html(songname);
            setSoundSlider();
            sound.amp(vol);
            soundIsLoading = false;
        },
        function (err) {
            //error
            $("#songInput").val('');
            showError(`Error<br>Couldn't decode audio data from: <em><strong style="color:white;">${filename}</strong></em>`);
            soundIsLoading = false;
        });

}

function loadImgFromFile(filename, file) {
    load = loadImage(file,
        function () {
            //success
            bgimg = load;
            //TODO: set drawing position and resize to fit
            var cw = canvas.width;
            var ch = canvas.height;
            var iw = bgimg.width;
            var ih = bgimg.height;
            var scale = max(cw / iw, ch / ih);
            bgimg.resize(scale * iw, scale * ih);

        },
        function () {
            //error
            $("#imgInput").val('');
            showError(`Error<br>Couldn't read image data from: <em><strong style="color:white;">${filename}</strong></em>`);
        }
    );
}

function loadPresetFromFile(filename, file) {
    $.getJSON(file, function (data) {
        if (compareKeys(data, defaultPreset))
            loadPreset(data)
        else {
            $("#presetInput").val('');
            showError(`Error<br>Couldn't read preset data from: <em><strong style="color:white;">${filename}</strong></em>`);
        }

    });
}

function compareKeys(a, b) {
    var aKeys = Object.keys(a).sort();
    var bKeys = Object.keys(b).sort();
    return JSON.stringify(aKeys) === JSON.stringify(bKeys);
}

function showError(err) {
    err = `<div style='border-radius: 10px; box-shadow: 0px 0px 2px 2px rgba(0,0,0,0.2); padding:0 3px;'>${err}</div>`;
    var $box = $("#errorBox");
    clearTimeout(errTimeout);
    $box.stop(true, true);
    var html = $("#errorBox div p").html();

    if (html != '')
        $("#errorBox div p").html(html + '<div style="height:7px;"></div>' + err);
    else
        $("#errorBox div p").html(err);

    $box.show({
        duration: 400,
        effect: "slide",
        direction: "up"
    });
    errTimeout = setTimeout(hideErrorBox, 6400);
}

function hideErrorBox() {
    $("#errorBox").hide({
        duration: 400,
        effect: "slide",
        direction: "up",
        complete: function () { $("#errorBox div p").html(''); }
    });
}

function generateUI() {
    //Generating basic html layout
    var $cnv = $(canvas.elt).css("position", "absolute");
    var $mainDiv = $("<div id='mainDiv' style=' position:absolute;'></div>");
    $(document.body).append($mainDiv);
    $mainDiv.prepend($cnv);
    $mainDiv.css("width", $cnv.width()).css("height", $cnv.height());
    var $mainSpan = $("<span id='mainSpan'></span>");
    var $upperSpan = $("<span id='upperSpan'></span>");
    var $middleSpan = $("<span id='middleSpan'></span>");
    var $bottomSpan = $("<span id='bottomSpan'></span>");
    $mainSpan.append($upperSpan);
    $mainSpan.append($middleSpan);
    $mainSpan.append($bottomSpan);
    $mainDiv.append($mainSpan);

    convertSpectrum = $("<div id='specConverter'></div>").spectrum({
        showAlpha: true,
        theme: "sp-dark",
        showInitial: 1,
        showInput: 1,
        format: "rgba",
        showButtons: 0,
    });

    $mainDiv.append(convertSpectrum);

    var $uploadPanel = $("<div id='uploadPanel'></div>");
    var $uploadPanelContainer = $("<div id='uploadPanelContainer'></div>").append($uploadPanel);
    $uploadPanelContainer.append(`
    <button id='slideleftbtn' class='slidebtn' style='margin:0px; padding:0px;'>
    <img src='img/arrow-simple-left.png' style='width:20px; height:50px;'>
    </button>
    `);
    $uploadPanelContainer.find("button").on("click", function () {
        if ($uploadPanel[0].toggling == undefined) $uploadPanel[0].toggling = false;
        if (!$uploadPanel[0].toggling) {
            $uploadPanel.animate({
                'margin-left': "-190px",
            }, 400);
            $(this).html(`<img src='img/arrow-simple-right.png' style='width:20px; height:50px;'></img>`);
        }
        else {
            $uploadPanel.animate({
                'margin-left': "0px",
            }, 400);
            $(this).html(`<img src='img/arrow-simple-left.png' style='width:20px; height:50px;'></img>`);
        }
        $uploadPanel[0].toggling = !$uploadPanel[0].toggling;

    });
    $mainDiv.append($uploadPanelContainer);
    $uploadPanel
        .append($("<label class='fileInput' for='songInput'>Change Song</label><input id='songInput' type='file'>")
            .on('change', function (e) {
                var target = e.currentTarget;
                var file = target.files[0];
                if (target.files && file) {
                    var reader = new FileReader();
                    reader.onload = function (e) {
                        changeSong(file.name, e.target.result);
                    }
                    reader.readAsDataURL(file);
                }
            })
        )
        .append($("<label class='fileInput' for='imgInput'>Change Image</label><input id='imgInput' type='file'>")
            .on('change', function (e) {
                var target = e.currentTarget;
                var file = target.files[0];
                if (target.files && file) {
                    var reader = new FileReader();
                    reader.onload = function (e) {
                        loadImgFromFile(file.name, e.target.result);
                    }
                    reader.readAsDataURL(file);
                }
            })
        )
        .append($("<label class='fileInput' for='presetInput'>Change Preset</label><input id='presetInput' type='file'>")
            .on('change', function (e) {
                var target = e.currentTarget;
                var file = target.files[0];
                var ext = file.name.split('.');
                if (ext[ext.length - 1] != 'json') {
                    showError(`Error<br><em><strong style="color:white;">${file.name}</strong></em> is not a <em>.json</em> file`);
                }
                else if (target.files && file) {
                    var reader = new FileReader();
                    reader.onload = function (e) {
                        loadPresetFromFile(file.name, e.target.result);
                    }
                    reader.readAsDataURL(file);
                }
            })
        )
        ;


    var $errorBox = $("<div id='errorBox' style='z-index:500;'></div>").hide(0);
    var inside = $(`
    <div style='display:inline-flex; justify-content:center; align-items:center; flex-direction:column;'>
    <p id='errorText'></p>
    <button id='slideupbtn' class='slidebtn'>
    <img src='img/arrow-simple-up.png' style='width:50px; height:20px; margin-bottom:-5px; '>
    </button>
    </div>`);
    inside.find("button").on("click", function () {
        clearTimeout(errTimeout);
        hideErrorBox();
    });
    $errorBox.append(inside);
    $($mainDiv).prepend($("<div style='position:absolute; width:100%; display:inline-flex; justify-content:center;'></div>").append($errorBox));

    var $shbut = $("<button id='shbut'><div style='transform: rotate(90deg);'>Hide</div></button>");
    $mainDiv.append($shbut);

    $shbut.disabled = false;

    $shbut.on("click", function () {
        if ($shbut.disabled) return;
        $shbut.disabled = true;
        $upperSpan.toggle({
            duration: 500,
            effect: "fade",
        });
        if (!$uploadPanel[0].toggling) {
            $uploadPanelContainer.find("button").click();
        }

        var div = $(this).find("div");
        div.toggle({

            duration: 250,
            effect: "fade",
            complete: function () {
                div.toggle({
                    duration: 250,
                    effect: "fade",
                    complete: function () { $shbut.disabled = false; }
                });
                if (div.html() == "Hide") {
                    div.html("Show");
                } else {
                    div.html("Hide");
                }
            }
        });
    });


    //Upper Span
    //Modulation tab
    var $tab = makeTabsFoundation();
    $upperSpan.append($tab);
    var $list = $tab.find("ul");
    addTab($list, "Modulation", "t11")
        .css("padding", "5px 5px 0px 5px")
        .append(makeSlider("Visible Frequency Range", {
            range: true,
            min: 0,
            max: 1,
            values: [0, 1],
            step: 0.001,
            slide: function (e, ui) { modul.visibleFreq = ui.values }
        }, "visibleFreq", "", true))
        .append(makeSlider("Octaves", {
            range: "min",
            min: 1,
            max: 90,
            value: 35,
            slide: function (e, ui) {
                modul.octaveBands = fft.getOctaveBands(ui.value);
                for (var i = 0; i < fftSmooth.length; i++) if (isNaN(fftSmooth[i])) fftSmooth[i] = 1;
            },
            stop: function (e, ui) { for (var i = 0; i < fftSmooth.length; i++) if (isNaN(fftSmooth[i])) fftSmooth[i] = 1; }
        }, "octaves", "", true))
        .append(makeSlider("Smooth", {
            range: "min",
            min: 0,
            max: 1,
            value: 0.6,
            step: 0.001,
            slide: function (e, ui) { modul.smooth = ui.value }
        }, "smooth", "", true))
        .append(makeSlider("Inner Intensity", {
            range: "min",
            min: 0,
            max: 2,
            value: 1,
            step: 0.001,
            slide: function (e, ui) { modul.inIntensity = ui.value }
        }, "inIntensity", "", true))
        .append(makeSlider("Outer Intensity", {
            range: "min",
            min: 0,
            max: 2,
            value: 1,
            step: 0.001,
            slide: function (e, ui) { modul.outIntensity = ui.value }
        }, "outIntensity", "", true))
        .append(makeSlider("Threshold", {
            range: "min",
            min: 0,
            max: 255,
            value: 0,
            step: 0.001,
            slide: function (e, ui) { modul.threshold = ui.value }
        }, "threshold", "", true))
        .append($('<div style="display:flex; justify-content:space-between;"></div>')
            .append(makeCheckbox("DB Transform", {
                change: function () { modul.DBT = $(this).prop("checked") }
            }, 'DBT'))
            .append(makeCheckbox("Weighted Frequencies", {
                change: function () { modul.weightFreq = $(this).prop("checked") }
            }, "weightFreq"))
        );

    $tab.tabs({
        heightStyle: "auto",
        active: 0,
    });

    setMaxWidth($tab);
    $tab.tabs("option", "hide", true);
    $tab.tabs("option", "show", true);


    //Visuals tab
    var $tab = makeTabsFoundation().css("overflow", "hidden");
    $upperSpan.append($tab);
    var $list = $tab.find("ul");

    //General Panel
    addTab($list, "General", "t20")
        .css("padding", "5px 5px 0px 5px")
        .append(makeSlider("Radius", {
            range: "min",
            min: 10,
            max: Math.min($cnv.width(), $cnv.height()) / 2,
            value: 5,
            step: 0.001,
            slide: function (e, ui) { vis.general.radius = ui.value }
        }, "radius", "", true))
        .append(makeSlider("Rotation", {
            range: "min",
            min: 0,
            max: 2 * PI,
            value: PI / 2,
            step: 0.001,
            slide: function (e, ui) { vis.general.rotation = ui.value }
        }, "rotation", "", true))
        .append(makeSlider("Spin Speed", {
            range: "min",
            min: 0,
            max: PI / 100,
            value: PI / 160,
            step: 0.00001,
            slide: function (e, ui) { vis.general.spinSpeed = ui.value }
        }, "spinSpeed", "", true))
        .append($("<div style='display:flex; justify-content:flex-end;'></div>")
            .append(makeCheckbox("Flip Spin", {
                change: function () { vis.general.flipSpin = $(this).prop("checked") }
            }, "flipSpin"))
        )
        ;

    //Lines Panel
    addTab($list, "Lines", "t21")
        .css("padding", "5px 5px 0px 5px")
        .append(makeSlider("Width Range", {
            range: true,
            min: 0,
            max: 15,
            values: [1, 12],
            step: 0.001,
            slide: function (e, ui) { vis.lines.widthRange = ui.values }
        }, "lWRange", "", true))
        .append(makeSlider("Width Change Freq", {
            range: "min",
            min: 1,
            max: 30,
            value: 2,
            step: 1,
            slide: function (e, ui) { vis.lines.widthChangeFreq = ui.value }
        }, "lWChangeFreq", "", true))
        .append($('<div class="flexdiv"></div>')
            .append(makeColorPicker("Low Color", {
                showAlpha: true,
                theme: "sp-dark",
                showInitial: 1,
                showInput: 1,
                format: "rgba",
                showButtons: 0,
                move: function (color) { vis.lines.lowColor = tcToP5Color(color) }
            }, "lLowColor"))
            .append(makeColorPicker("High Color", {
                showAlpha: true,
                theme: "sp-dark",
                showInitial: 1,
                showInput: 1,
                format: "rgba",
                showButtons: 0,
                move: function (color) { vis.lines.highColor = tcToP5Color(color) }
            }, "lHighColor"))
        );

    var $innerTab = makeTabsFoundation().css("background", "transparent").css("border", "none");
    var $innerList = $innerTab.find("ul");

    //Inner Edge Panel
    addTab($innerList, "Inner", "t22i1")
        .css("padding", "5px 5px 0px 5px")
        .append(makeSlider("Width", {
            range: "min",
            min: 0,
            max: 15,
            values: 1,
            step: 0.001,
            slide: function (e, ui) { vis.edges.inWidth = ui.value }
        }, "IEWidth", "", true))
        .append(makeColorPicker("Color", {
            showAlpha: true,
            theme: "sp-dark",
            showInitial: 1,
            showInput: 1,
            format: "rgba",
            showButtons: 0,
            move: function (color) { vis.edges.inColor = tcToP5Color(color) }
        }, "IEColor"));

    //Outer Edge Panel
    addTab($innerList, "Outer", "t22i2")
        .css("padding", "5px 5px 0px 5px")
        .append(makeSlider("Width", {
            range: "min",
            min: 0,
            max: 15,
            values: 1,
            step: 0.001,
            slide: function (e, ui) { vis.edges.outWidth = ui.value }
        }, "OEWidth", "", true))
        .append(makeColorPicker("Color", {
            showAlpha: true,
            theme: "sp-dark",
            showInitial: 1,
            showInput: 1,
            format: "rgba",
            showButtons: 0,
            move: function (color) { vis.edges.outColor = tcToP5Color(color) }
        }, "OEColor"));

    //Edges Panel
    addTab($list, "Edges", "t22")
        .append($innerTab)
        ;

    $innerTab.tabs({
        heightStyle: "auto",
        active: 0,
    });

    $innerTab.tabs("option", "hide", {
        duration: 270,
        effect: 'fadeOut'
    });
    $innerTab.tabs("option", "show", {
        duration: 270,
        effect: 'fadeIn'
    });

    var $innerTab = makeTabsFoundation().css("background", "transparent").css("border", "none");
    var $innerList = $innerTab.find("ul");

    //Shapes Logic panel
    addTab($innerList, "Logic", "t23i1")
        .css("padding", "5px 5px 0px 5px")
        .append(makeSlider("Life Range", {
            range: true,
            min: 10,
            max: 2000,
            values: [100, 500],
            step: 0.001,
            slide: function (e, ui) { vis.shapes.lifeRange = ui.values }
        }, "lifeRange", "", true))
        .append(makeSlider("Rotation Range", {
            range: true,
            min: 0,
            max: PI / 20,
            values: [0, PI / 20],
            step: 0.0001,
            slide: function (e, ui) { vis.shapes.rotationRange = ui.values }
        }, "rotationRange", "", true))
        .append(makeSlider("Speed Range", {
            range: true,
            min: 1,
            max: 30,
            values: [1, 8],
            step: 0.001,
            slide: function (e, ui) { vis.shapes.speedRange = ui.values }
        }, "speedRange", "", true))
        .append(makeSlider("Spawn Chance", {
            range: "min",
            min: 0,
            max: 1,
            values: 0.1,
            step: 0.001,
            slide: function (e, ui) { vis.shapes.spawnChance = ui.value }
        }, "spawnChance", "", true));

    //Shapes Visuals Panel
    addTab($innerList, "Visuals", "t23i2")
        .css("padding", "5px 5px 0px 5px")
        .append(makeSlider("Sides Range", {
            range: true,
            min: 3,
            max: 20,
            values: [3, 5],
            step: 1,
            slide: function (e, ui) { vis.shapes.sidesRange = ui.values }
        }, "sidesRange", "", true))
        .append(makeSlider("Size Range", {
            range: true,
            min: 2,
            max: 200,
            values: [5, 7],
            step: 0.001,
            slide: function (e, ui) { vis.shapes.sizeRange = ui.values }
        }, "sizeRange", "", true))
        .append(makeSlider("Border Weight Range", {
            range: true,
            min: 0,
            max: 15,
            values: [1, 7],
            step: 0.001,
            slide: function (e, ui) { vis.shapes.borderWeightRange = ui.values }
        }, "borderWeightRange", "", true))
        .append($("<div class='flexdiv'></div>")
            .append(makeColorPicker("Fill Color", {
                showAlpha: true,
                theme: "sp-dark",
                showInitial: 1,
                showInput: 1,
                format: "rgba",
                showButtons: 0,
                move: function (color) { vis.shapes.fillColor = tcToP5Color(color) }
            }, "sFillColor"))
            .append(makeColorPicker("Border Color", {
                showAlpha: true,
                theme: "sp-dark",
                showInitial: 1,
                showInput: 1,
                format: "rgba",
                showButtons: 0,
                move: function (color) { vis.shapes.borderColor = tcToP5Color(color) }
            }, "sBorderColor"))
        );

    //Shapes Panel
    addTab($list, "Shapes", "t23")
        .append($innerTab);

    $innerTab.tabs({
        heightStyle: "auto",
        active: 0,
    });

    $innerTab.tabs("option", "hide", {
        duration: 270,
        effect: 'fadeOut'
    });
    $innerTab.tabs("option", "show", {
        duration: 270,
        effect: 'fadeIn'
    });


    //Background Panel
    addTab($list, "Bg", "t24")
        .css("padding", "5px 5px 0px 5px")
        .append($("<div class='flexdiv'</div>")
            .append(makeColorPicker("Border Color", {
                showAlpha: true,
                theme: "sp-dark",
                showInitial: 1,
                showInput: 1,
                format: "rgba",
                showButtons: 0,
                move: function (color) { vis.bg.borderColor = tcToP5Color(color) }
            }, "bgBorderColor"))
            .append(makeColorPicker("Fill Color", {
                showAlpha: true,
                theme: "sp-dark",
                showInitial: 1,
                showInput: 1,
                format: "rgba",
                showButtons: 0,
                move: function (color) { vis.bg.fillColor = tcToP5Color(color) }
            }, "bgFillColor"))
        )
        .append($("<div class='flexdiv' style='justify-content:flex-end'</div>")
            .append($("<div class='flexdiv' style='padding-top:10px;'></div>")
                .append(makeCheckbox("Use Img", {
                    change: function () { vis.bg.useIMG = $(this).prop("checked") }
                }, "useIMG"))
                .append(makeCheckbox("UI Fading", {
                    change: function () { vis.bg.fadeUI = $(this).prop("checked") }
                }, "UIFade")))
        );

    //Change height animation on tab change
    $tab.tabs({
        active: 0,
        beforeActivate: function (e, ui) {
            var h = $tab.heightArray[ui.newPanel.index() - 1];
            $tab.animate({
                height: h
            }, 150).dequeue();
        },
    });
    setMaxWidth($tab);

    $tab.tabs("option", "hide", {
        duration: 270,
        effect: 'fadeOut'
    });
    $tab.tabs("option", "show", {
        duration: 270,
        effect: 'fadeIn'
    });

    //Bottom Span
    var $hoverBox = $("<div id='hoverBox' style='z-index=2; position:absolute'></div>").appendTo($(document.body)).hide(0);

    $bottomSpan
        .append($("<div id='playerDiv' style='display:flex; justify-content:space-around; align-items:flex-end; width:100%'>")
            .append($("<div id='playerDiv'></div>")
                .append($("<div id='songTitle'>Running Away<div>"))
                .append($("<div id='showTime'>6:03<div>"))
                .append(
                    makeSlider('', {
                        create: function (e, ui) { this.sliding = false },
                        range: "min",
                        min: 0,
                        max: 600,
                        value: 0,
                        step: 0.0001,
                        start: function (e, ui) { this.sliding = true },
                        slide: function (e, ui) {

                            //Hover

                            var width = $(this).width();
                            var offset = $(this).offset();
                            var options = $(this).slider('option');
                            var value = Math.round(((e.clientX - offset.left) / width) *
                                (options.max - options.min)) + options.min;
                            if (value < options.min) {
                                value = Math.round(options.min);
                            }
                            if (value > options.max) {
                                value = Math.round(options.max);
                            }
                            var x = (e.clientX - offset.left);
                            if (x > width) x = width;
                            else if (x < 0) x = 0;
                            var rect = $(this)[0].getBoundingClientRect();
                            var pos = {
                                left: rect.left + window.scrollX + x,
                                top: rect.top + window.scrollY
                            }
                            showHover(pos, value);

                        },
                        stop: function (e, ui) {
                            this.timeChanged = true;
                            var a = this;
                            setTimeout(function () { a.sliding = false; }, 15);
                            if (sound.isPlaying()) {
                                justJumped = true;
                                sound.jump(ui.value);
                            }

                            setTimeout(clearHover, 200);
                        },
                        mousemove: function (e) {
                            if ($(this).is(":animated")) return;
                            var width = $(this).width();
                            var offset = $(this).offset();
                            var options = $(this).slider('option');


                            var value = Math.round(((e.clientX - offset.left) / width) *
                                (options.max - options.min)) + options.min;
                            if (value < options.min) {
                                value = Math.round(options.min);
                            }
                            if (value > options.max) {
                                value = Math.round(options.max);
                            }

                            var rect = $(this)[0].getBoundingClientRect();
                            var pos = {
                                left: rect.left + window.scrollX + (e.clientX - offset.left),
                                top: rect.top + window.scrollY
                            }
                            showHover(pos, value);
                        },

                        mouseleave: function (event) {
                            //if(event.relatedTarget == document.body){
                            setTimeout(clearHover, 200);
                            //}
                        }

                    }, "time")
                        .addClass("progress")
                        .css("width", '' + Math.floor($mainDiv.width() * 0.75))
                        .css("padding-bottom", "20px")
                        .css("clear", "both")
                )
            )
            .append(makeSlider('', {
                create: function (e, ui) {
                    var options = $(this).slider("option");
                    var percent = ((options.value - options.min) / (options.max - options.min));
                    var c = lerpColor(volC1, volC2, percent);
                    $(this).find('.ui-slider-range').css(`background`, `linear-gradient(to right,${volC1.toString()},${c.toString()}`);
                },
                range: "min",
                min: 0,
                max: 1,
                value: 0.2,
                step: 0.0001,
                slide: function (e, ui) {
                    vol = ui.value;
                    sound.amp(ui.value)
                    var options = $(this).slider("option");
                    var percent = ((ui.value - options.min) / (options.max - options.min));
                    var c = lerpColor(volC1, volC2, percent);
                    $(this).find('.ui-slider-range').css(`background`, `linear-gradient(to right,${volC1.toString()},${c.toString()}`);
                }
            }, "volume")
                .css("width", '' + Math.floor($mainDiv.width() * 0.15))
                .addClass("progress")
                .css("padding-bottom", "20px")
            ))
        ;


    var wasInit = false;
    function showHover(pos, val) {
        $hoverBox.css({ 'top': pos.top - $hoverBox.height() - 5, 'left': pos.left - $hoverBox.width() / 2, 'position': 'absolute' }).html('' + HMSToString(sToHMS(val)));
        if (!wasInit) {
            $hoverBox.stop();
            $hoverBox.css("display", "block");
            $hoverBox.animate({
                opacity: 1
            }, 300, function () { });
        }
        wasInit = true;
    }

    function clearHover() {
        $hoverBox.stop();
        $hoverBox.animate({
            opacity: 0
        }, 300, function () { $hoverBox.css("display", "none"); });
        wasInit = false;
    }


    //Hide if no mouse movement
    var clicked = false;
    var hidden = false;
    var inMainDiv = false;
    var h;

    $(document.body).mousedown(function () {
        clicked = true;
    });

    $(document).mouseup(function () {
        clicked = false;
    });

    $(document.body).mouseleave(function (event) {
        inMainDiv = false;
        clearTimeout(h);
        h = setTimeout(hideUi, 400);
    });

    $(document.body).mouseenter(function (event) {
        inMainDiv = true;
        clearTimeout(h);
        if (hidden)
            showUi();
    });

    function showUi() {
        hidden = false;
        $mainSpan.stop(true, true);
        $mainSpan.show({
            duration: 400,
            effect: 'fade'
        });


        $bottomSpan.children("div").each(function () {
            $(this).stop(true, true);
            $(this).show({
                duration: 400,
                effect: "slide",
                direction: "down"
            });
        });

        $shbut.stop(true, true);
        $shbut.show({
            duration: 400,
            effect: "slide",
            direction: 'right'
        });

        $uploadPanelContainer.stop(true, true);
        $uploadPanelContainer.show({
            duration: 400,
            effect: "slide",
            direction: 'left'
        });
    }

    function hideUi() {
        if (clicked || cPickerOn) {
            clearTimeout(h);
            setTimeout(hideUi, 400);
            return;
        };
        if (inMainDiv) return;

        hidden = true;
        $mainSpan.stop(true, true);
        $mainSpan.hide({
            duration: 400,
            effect: 'fade'
        });

        $bottomSpan.children("div").each(function () {
            $(this).stop(true, true);
            $(this).hide({
                duration: 400,
                effect: "slide",
                direction: "down"
            });
        });

        $shbut.stop(true, true);
        $shbut.hide({
            duration: 400,
            effect: "slide",
            direction: 'right'
        });
        $uploadPanelContainer.stop(true, true);
        $uploadPanelContainer.hide({
            duration: 400,
            effect: "slide",
            direction: 'left',
            complete: function () {
                if (!$uploadPanel[0].toggling) {
                    $uploadPanelContainer.find("button").click()
                    $uploadPanel.stop(true, true);
                }
            }
        });
    }
}

function sToHMS(s) {
    return {
        hours: ((s - s % 3600) / 3600) % 60,
        minutes: ((s - s % 60) / 60) % 60,
        seconds: s % 60
    }
}

function HMSToString(HMS) {
    var retstr = '';
    if (HMS.hours > 0) {
        retstr += HMS.hours + ':';
        if (HMS.minutes < 10)
            retstr += '0';
        retstr += HMS.minutes + ':';
        if (HMS.seconds < 10)
            retstr += '0';
        retstr += HMS.seconds;
    }
    else {
        retstr += HMS.minutes + ':'
        if (HMS.seconds < 10)
            retstr += '0';
        retstr += HMS.seconds;
    }
    return retstr;
}