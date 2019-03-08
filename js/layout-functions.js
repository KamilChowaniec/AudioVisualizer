var cPickerOn = false;

function makeTabsFoundation() {
    if (typeof makeTabsFoundation.counter == 'undefined')
        makeTabsFoundation.counter = 0;
    makeTabsFoundation.counter++;
    var nametag = `tabs${makeTabsFoundation.counter}`;
    var div = $(`<div id='${nametag}' class='tab'></div>`);
    div.append(`<ul id='${nametag}list'></ul>`);
    return div;

}

function addTab($list, name, divid) {
    $list.append(`<li><a href='#${divid}'><span>${name}</span></a>`);
    var div = $(`<div id=${divid}></div>`);
    var innerDiv = $("<div></div>");
    div.append(innerDiv);
    $list.parent().append(div);
    return innerDiv;
}


function makeSlider(name = "", options = {}, id = "", style = "", fieldset = "", css_class = "") {
    if (typeof makeSlider.counter == 'undefined')
        makeSlider.counter = 0;
    makeSlider.counter++;
    var nametag = `slider${makeCheckbox.counter}`;
    if (fieldset != "") {
        var $main = $(`<fieldset class='sliderfield'><legend><b>${name}</b></legend></fieldset>`);
    } else {
        var $main = $("<div></div>");
    }
    var $slider = $(`<div id='${id}' name='${nametag}' class='${css_class}' style='${style}'></div>`).slider(options);

    if (options.mousemove != "undefined") {
        $slider.mousemove(options.mousemove);
    }

    if (options.mouseout != "undefined") {
        $slider.mouseout(options.mouseout);
    }

    if (options.mouseleave != "undefined") {
        $slider.mouseleave(options.mouseleave);
    }

    $main.append($slider);
    return $main;
}
function makeCheckbox(name, options = { icon: false }, id = "") {
    if (options.icon == undefined)
        $.extend(options, { icon: false });
    if (typeof makeCheckbox.counter == undefined)
        makeCheckbox.counter = 0;
    makeCheckbox.counter++;
    var nametag = `cbx${makeCheckbox.counter}`;
    if (id == "") id = nametag;
    var div = $("<div></div>").append($(`<label for="${id}">${name}</label>`));
    var checkbox = $(`<input type="checkbox" name="${nametag}" id="${id}">`);
    if (options.change != undefined)
        checkbox.change(options.change);
    div.append(checkbox);
    checkbox.checkboxradio(options);
    return div;
}

function makeColorPicker(name, options = {}, id = '') {
    var $fset = $(`<fieldset id='${id}' class="cpicker"><legend><b>${name}</b></legend><div></div></fieldset>`);

    var $div = $("<div></div>").draggable();
    var $cpicker = $fset.find(`div`);

    //OPTIONS CHANGIN
    $.extend(options, { appendTo: $div });
    if (options.move == undefined) {
        $.extend(options, {
            move: function (color) {
                $fset.css("box-shadow", `inset 20px 20px 20px 20px rgba(${color._r}, ${color._g}, ${color._b}, ${color._a})`);
            }
        });
    }
    else {
        var mov = options.move;
        $.extend(options, {
            move: function (color) {
                $fset.css("box-shadow", `inset 20px 20px 20px 20px rgba(${color._r}, ${color._g}, ${color._b}, ${color._a})`);
                mov(color);
            }
        });
    }

    if (options.change == undefined) {
        $.extend(options, {
            change: function (color) {
                $fset.css("box-shadow", `inset 20px 20px 20px 20px rgba(${color._r}, ${color._g}, ${color._b}, ${color._a})`);
            }
        });
    }
    else {
        var chang = options.change;
        $.extend(options, {
            change: function (color) {
                $fset.css("box-shadow", `inset 20px 20px 20px 20px rgba(${color._r}, ${color._g}, ${color._b}, ${color._a})`);
                chang(color);
            }
        });
    }

    if (options.hide == undefined) {
        $.extend(options, {
            hide: function (color) {
                cPickerOn = false;
            }
        });
    }
    else {
        var hid = options.hide;
        $.extend(options, {
            hide: function (color) {
                cPickerOn = false;
                hid(color);
            }
        });
    }

    $(document.body).append($div);
    $fset.spectrum(options);
    $fset.on("click", function () {
        cPickerOn = true;
        $cpicker.spectrum("toggle");
        return false;
    });

    return $fset;
}


function setMaxWidth($tab) {
    var mw = 0;
    var oInd = $tab.tabs("option", "active");
    var i = 0;
    $tab.find("> .ui-tabs-panel").each(function (ind, el) { i++; })
    $tab.heightArray = Array(i);
    $tab.find("> .ui-tabs-panel").each(function (ind, el) {
        $tab.tabs("option", "active", ind);
        $tab.heightArray[ind] = $tab.height()
        if ($(this).width() > mw) {
            mw = $(this).width();
        }
    });
    $tab.tabs("option", "active", oInd);

    $tab.children("div").each(function () {
        $(this).css("width", mw + "px");
    });

    return mw;
}