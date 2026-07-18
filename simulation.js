/* ============================================================================
   Exoplanet Transit Simulator — HTML5 port of transitSimulator017.swf (AS1).
   Behavior (constants, formulas, tables, text, number formatting) is ported
   VERBATIM from the decompiled ActionScript; presentation follows the KL-UNL
   foundation and WCAG 2.1 AA.

   Source mapping:
     - "Lightcurve Component II.as"  -> Lightcurve object below
     - "Transit Visualization.as"    -> Visualization object below
     - "Slider Logic Class v6.as"    -> SliderLogic class below
     - "Standard Slider v6.as"       -> SimSlider component below (behavior)
     - DefineSprite_214 frame script -> main controller at the bottom
   ============================================================================ */

(function () {
  'use strict';

  var PI = 3.141592653589793;
  var TWO_PI = 6.283185307179586;
  var LN10 = 2.302585092994046;

  /* ==========================================================================
     Number formatting — ported from "Number Functions.as" and the main script.
     The AS toFixed polyfill (Math.round(x * 10^f)) is reproduced exactly so
     every on-screen number matches the original character for character.
     ========================================================================== */

  // Number.prototype.toFixed polyfill from "Number Functions.as"
  function asToFixed(x, fractionDigits) {
    var f = fractionDigits | 0;
    if (f < 0 || f > 20) { return 'Range Error'; }
    if (isNaN(x)) { return 'NaN'; }
    var s = '';
    if (x < 0) { s = '-'; x = -x; }
    var m = '';
    if (x < 1e21) {
      var n = Math.round(x * Math.pow(10, f));
      if (n === 0) { m = '0'; } else { m = n.toString(); }
      if (f > 0) {
        var k = m.length;
        if (k <= f) {
          var z = '';
          for (var i = 0; i < f + 1 - k; i++) { z += '0'; }
          m = z + m;
          k = f + 1;
        }
        m = m.substr(0, k - f) + '.' + m.substr(k - f);
      }
    } else {
      m = x.toString();
    }
    return s + m;
  }

  // Math.toSigDigits from "Number Functions.as"
  function toSigDigits(num0, digits0) {
    var num = parseFloat(num0);
    var digs = Math.abs(parseInt(digits0, 10));
    if (!isFinite(digs) || !isFinite(num)) { return NaN; }
    if (num === 0 || digs === 0) { return 0; }
    if (digs > 15) { digs = 15; }
    var sign = 1;
    if (num < 0) { sign = -1; num = Math.abs(num); }
    var tmp = Math.floor(Math.log(num) / LN10);
    var fact = Math.pow(10, digs - (1 + tmp));
    return sign * (Math.round(fact * num) / fact);
  }

  // formatNumber from DefineSprite_214 frame script
  function formatNumber(num, digits) {
    var L = Math.floor(Math.log(num) / LN10) - (digits - 1);
    if (L >= 0) {
      var M = Math.pow(10, L);
      return String(M * Math.round(num / M));
    }
    return asToFixed(num, -L);
  }

  // getFormattedNumber from DefineSprite_214 frame script
  function getFormattedNumber(x, digits, kLimit) {
    var m = Math.floor(Math.log(x) / LN10);
    var k = digits - 1 - m;
    if (k <= 0) { return String(toSigDigits(x, digits)); }
    if (k > kLimit) { k = kLimit; }
    return asToFixed(x, k);
  }

  // getTimeString from DefineSprite_214 frame script (time in seconds)
  function getTimeString(time) {
    var str;
    if (time > 47335104)   { time /= 31556736; str = ' year';   }
    else if (time > 86400) { time /= 86400;    str = ' day';    }
    else if (time > 5400)  { time /= 3600;     str = ' hour';   }
    else if (time > 60)    { time /= 60;       str = ' minute'; }
    else                   {                   str = ' second'; }
    return formatNumber(time, 3) + str;
  }

  /* ==========================================================================
     Star physics — ported verbatim from DefineSprite_214 DoAction.as
     ========================================================================== */

  function getLuminosityFromMass(mass) {
    if (mass < 0.43) {
      return 0.232220431737728 * Math.pow(mass, 2.26);
    }
    return Math.pow(mass, 3.99);
  }

  function getTempFromLuminosity(lum) {
    var logL = Math.log(lum) / LN10;
    var a, b, c, d, e, f, g;
    if (logL < -1.61) {
      a = 3.76424847491303;  b = 0.140316436337353;   c = 0.0139709648834783;
      d = 0.00146257952166353; e = 0.000114203991057792; f = 0.00000534009520193973;
      g = 1.00897501873505e-7;
    } else if (logL < 0.22) {
      a = 3.76404749064937;  b = 0.139720836051662;   c = 0.0131949471107482;
      d = 0.000878016217920958; e = -0.00016087678534046; f = -0.0000718923778642037;
      g = -0.0000098430921759891;
    } else if (logL < 1.48) {
      a = 3.76404935999916;  b = 0.139700505514371;   c = 0.0132834512392025;
      d = 0.000681148684168764; e = 0.0000515647954029831; f = -0.000230931527900807;
      g = 0.0000134429776870977;
    } else if (logL < 2.61) {
      a = 3.76208682178285;  b = 0.14541668375348;    c = 0.00684584757963743;
      d = 0.00396076543835346; e = -0.000464655201610208; f = -0.000381007438333072;
      g = 0.0000623586254118745;
    } else if (logL < 3.62) {
      a = 3.7785507438146;   b = 0.129897095940252;   c = 0.00142810707728862;
      d = 0.0167045399494531; e = -0.00693250229182094; f = 0.00103845665508301;
      g = -0.000055992055857869;
    } else if (logL < 5.43) {
      a = 3.94943146036608;  b = -0.154281251321452;  c = 0.1979230342627;
      d = -0.055596100619304; e = 0.00799539610207913; f = -0.000600846748510063;
      g = 0.0000187770530697032;
    } else {
      a = 4.36797099518548;  b = -0.314871178456464;  c = 0.143399968097621;
      d = -0.0130740129137381; e = -0.00159255369850374; f = 0.000357973227398207;
      g = -0.000017804556980593;
    }
    var logT = a + logL * (b + logL * (c + logL * (d + logL * (e + logL * (f + logL * g)))));
    return Math.pow(10, logT);
  }

  function getRadiusFromTempAndLuminosity(temp, luminosity) {
    // radius in solar radii
    return 33736108.2311059 * Math.sqrt(luminosity) / (temp * temp);
  }

  var spectralTypesAndTemps = {
    v: [{type:7,teff:38000},{type:9,teff:33200},{type:9.5,teff:31450},{type:10,teff:29700},{type:11,teff:25600},{type:12,teff:22300},{type:13,teff:19000},{type:14,teff:17200},{type:15,teff:15400},{type:16,teff:14100},{type:17,teff:13000},{type:18,teff:11800},{type:19,teff:10700},{type:20,teff:9480},{type:22,teff:8810},{type:25,teff:8160},{type:27,teff:7930},{type:30,teff:7020},{type:32,teff:6750},{type:35,teff:6530},{type:37,teff:6240},{type:40,teff:5930},{type:42,teff:5830},{type:44,teff:5740},{type:46,teff:5620},{type:50,teff:5240},{type:52,teff:5010},{type:54,teff:4560},{type:55,teff:4340},{type:57,teff:4040},{type:60,teff:3800},{type:61,teff:3680},{type:62,teff:3530},{type:63,teff:3380},{type:64,teff:3180},{type:65,teff:3030},{type:66,teff:2850}],
    iii: [{type:40,teff:5910},{type:44,teff:5190},{type:46,teff:5050},{type:48,teff:4960},{type:50,teff:4810},{type:51,teff:4610},{type:52,teff:4500},{type:53,teff:4320},{type:54,teff:4080},{type:55,teff:3980},{type:60,teff:3820},{type:61,teff:3780},{type:62,teff:3710},{type:63,teff:3630},{type:64,teff:3560},{type:65,teff:3420},{type:66,teff:3250}],
    i: [{type:9,teff:32500},{type:10,teff:26000},{type:11,teff:20700},{type:12,teff:17800},{type:13,teff:15600},{type:14,teff:13900},{type:15,teff:13400},{type:16,teff:12700},{type:17,teff:12000},{type:18,teff:11200},{type:19,teff:10500},{type:20,teff:9730},{type:21,teff:9230},{type:22,teff:9080},{type:25,teff:8510},{type:30,teff:7700},{type:32,teff:7170},{type:35,teff:6640},{type:38,teff:6100},{type:40,teff:5510},{type:43,teff:4980},{type:48,teff:4590},{type:50,teff:4420},{type:51,teff:4330},{type:52,teff:4260},{type:53,teff:4130},{type:55,teff:3850},{type:60,teff:3650},{type:61,teff:3550},{type:62,teff:3450},{type:63,teff:3200},{type:64,teff:2980}]
  };

  function getSpectralTypeFromTemp(temp, cls) {
    cls = (cls === undefined || cls === '') ? 'v' : String(cls).toLowerCase();
    var aIndex = cls.indexOf('a');
    if (aIndex > 0) { cls = cls.slice(0, aIndex); }
    var bIndex = cls.indexOf('b');
    if (bIndex > 0) { cls = cls.slice(0, bIndex); }
    if (cls === 'iv') { cls = 'v'; }
    else if (cls === 'ii') { cls = 'i'; }
    else if (cls === 'iii' && temp > 6000) { cls = 'v'; }
    var typesArray = spectralTypesAndTemps[cls];
    if (typesArray === undefined) { return null; }
    var spectralType = {};
    spectralType['class'] = cls.toUpperCase();
    var len = typesArray.length;
    var i = 0;
    while (i < len) {
      if (temp > typesArray[i].teff) { break; }
      i++;
    }
    var i1, i2;
    if (i === 0) { i1 = 0; i2 = 1; }
    else if (i === len) { i1 = len - 2; i2 = len - 1; }
    else { i1 = i - 1; i2 = i; }
    var m = (typesArray[i2].type - typesArray[i1].type) / (typesArray[i2].teff - typesArray[i1].teff);
    var b = typesArray[i1].type - m * typesArray[i1].teff;
    var spectralTypeNumber = m * temp + b;
    if (!isFinite(spectralTypeNumber) || isNaN(spectralTypeNumber) || spectralTypeNumber < 0 || spectralTypeNumber >= 70) {
      return null;
    }
    var base = Math.floor(spectralTypeNumber / 10);
    var excess = spectralTypeNumber - 10 * base;
    switch (base) {
      case 0: spectralType.type = 'O'; break;
      case 1: spectralType.type = 'B'; break;
      case 2: spectralType.type = 'A'; break;
      case 3: spectralType.type = 'F'; break;
      case 4: spectralType.type = 'G'; break;
      case 5: spectralType.type = 'K'; break;
      case 6: spectralType.type = 'M'; break;
      default: return null;
    }
    spectralType.number = excess;
    spectralType.spectralTypeNumber = spectralTypeNumber;
    return spectralType;
  }

  /* ==========================================================================
     SliderLogic — verbatim port of "Slider Logic Class v6.as".
     Handles linear/logarithmic scaling and fixed-digits / significant-digits
     snapping so slider values and formatted strings match the original.
     ========================================================================== */

  function SliderLogic(initObject) {
    this._refreshEnabled = false;
    if (!this.setScalingMode(initObject.scalingMode)) { this.setScalingMode('linear'); }
    if (!this.setValueFormat(initObject.valueFormat, initObject.valueDigits)) { this.setValueFormat('fixed digits', 1); }
    if (!this.setValueAndParameterRanges(initObject.minValue, initObject.maxValue, initObject.minParameter, initObject.maxParameter)) {
      this.setValueAndParameterRanges(1, 100, 0, 1);
    }
    this._refreshEnabled = true;
    var initValue = Number(initObject.value);
    if (isFinite(initValue) && !isNaN(initValue)) {
      this.setValue(initValue);
    } else {
      this.setValue(this._minV + (this._maxV - this._minV) / 2);
    }
  }

  SliderLogic.prototype.setScalingMode = function (mode) {
    var success = false;
    if (mode === 'linear') { this._sMode = 0; success = true; }
    else if (mode === 'logarithmic') { this._sMode = 1; success = true; }
    if (success) { this.calculateScale(); this.refresh(); }
    return success;
  };

  SliderLogic.prototype.setValueFormat = function (mode, digits) {
    var success = false;
    var x;
    if (mode === 'significant digits') {
      this._pMode = 0;
      x = Math.abs(parseInt(digits, 10));
      if (!isFinite(x) || isNaN(x) || x === 0) { x = 1; }
      this._digs = x;
      this._lowerSigLimit = Math.pow(10, x - 1);
      this._upperSigLimit = Math.pow(10, x);
      this._ticksPerMag = 9 * this._lowerSigLimit;
      success = true;
    } else if (mode === 'fixed digits') {
      this._pMode = 1;
      x = parseInt(digits, 10);
      if (!isFinite(x) || isNaN(x)) { x = 1; }
      this._digs = x;
      this._minIncrement = Math.pow(10, -x);
      success = true;
    }
    if (success) { this.refresh(); }
    return success;
  };

  SliderLogic.prototype.setValueAndParameterRanges = function (minValue, maxValue, minParameter, maxParameter) {
    minValue = (minValue == null) ? this._minV : Number(minValue);
    maxValue = (maxValue == null) ? this._maxV : Number(maxValue);
    minParameter = (minParameter == null) ? this._minP : Number(minParameter);
    maxParameter = (maxParameter == null) ? this._maxP : Number(maxParameter);
    if (minValue >= maxValue || minParameter >= maxParameter ||
        isNaN(minValue) || isNaN(maxValue) || isNaN(minParameter) || isNaN(maxParameter) ||
        !isFinite(minValue) || !isFinite(maxValue) || !isFinite(minParameter) || !isFinite(maxParameter)) {
      return false;
    }
    this._minV = minValue;
    this._maxV = maxValue;
    this._minP = minParameter;
    this._maxP = maxParameter;
    this.calculateScale();
    this.refresh();
    return true;
  };

  Object.defineProperty(SliderLogic.prototype, 'parameter', {
    get: function () { return this.getParameterFromValue(this._valueObject.value); },
    set: function (parameter) { this.setValue(this.getValueFromParameter(parameter)); }
  });

  Object.defineProperty(SliderLogic.prototype, 'value', {
    get: function () { return this._valueObject.value; },
    set: function (x) { this.setValueByValueObject(this.getValueObjectFromValue(x)); }
  });

  SliderLogic.prototype.setValue = function (x) {
    this.setValueByValueObject(this.getValueObjectFromValue(x));
  };

  SliderLogic.prototype.setValueByValueObject = function (valueObj) {
    this._valueObject = valueObj;
  };

  SliderLogic.prototype.incrementValue = function (numTicks) {
    this.setValueByValueObject(this.getIncrementedValueObject(null, numTicks));
  };

  Object.defineProperty(SliderLogic.prototype, 'valueString', {
    get: function () { return this.getValueStringFromValueObject(this._valueObject); }
  });

  SliderLogic.prototype.getValueStringFromValueObject = function (valueObj) {
    var f;
    if (this._pMode === 0) { f = this._digs - valueObj.mag - 1; }
    else { f = this._digs; }
    if (f > 0) { return this.toFixed(valueObj.value, f); }
    return String(valueObj.value);
  };

  SliderLogic.prototype.getValueObjectFromValue = function (x) {
    var vObj = {};
    if (x < this._minV) { x = this._minV; }
    else if (x > this._maxV) { x = this._maxV; }
    if (this._pMode === 0) {
      var mag = Math.floor(Math.log(x) / LN10);
      var sig = Math.round(x * this._lowerSigLimit / Math.pow(10, mag));
      if (sig >= this._upperSigLimit) { sig = this._lowerSigLimit; mag++; }
      vObj.value = sig / this._lowerSigLimit * Math.pow(10, mag);
      vObj.mag = mag;
      vObj.sig = sig;
    } else {
      vObj.value = this._minIncrement * Math.round(x / this._minIncrement);
    }
    return vObj;
  };

  SliderLogic.prototype.getIncrementedValueObject = function (valueObj, numTicks) {
    if (typeof valueObj !== 'object' || valueObj === null) { valueObj = this._valueObject; }
    numTicks = Math.round(numTicks);
    var vObj = {};
    if (this._pMode === 0) {
      var fracMags = numTicks / this._ticksPerMag;
      var deltaMag, deltaSig;
      if (fracMags >= 1) {
        deltaMag = Math.floor(fracMags);
        deltaSig = numTicks - deltaMag * this._ticksPerMag;
      } else if (fracMags <= -1) {
        deltaMag = Math.ceil(fracMags);
        deltaSig = numTicks - deltaMag * this._ticksPerMag;
      } else {
        deltaMag = 0;
        deltaSig = numTicks;
      }
      var newSig = valueObj.sig + deltaSig;
      var newMag = valueObj.mag + deltaMag;
      if (newSig >= this._upperSigLimit) { newSig -= this._ticksPerMag; newMag++; }
      else if (newSig < this._lowerSigLimit) { newSig += this._ticksPerMag; newMag--; }
      vObj.value = newSig / this._lowerSigLimit * Math.pow(10, newMag);
      vObj.sig = newSig;
      vObj.mag = newMag;
    } else {
      vObj.value = this._minIncrement * Math.round(numTicks + valueObj.value / this._minIncrement);
    }
    if (vObj.value < this._minV) { vObj = this.getValueObjectFromValue(this._minV); }
    else if (vObj.value > this._maxV) { vObj = this.getValueObjectFromValue(this._maxV); }
    return vObj;
  };

  SliderLogic.prototype.calculateScale = function () {
    if (this._sMode === 0) {
      this._scale = (this._maxV - this._minV) / (this._maxP - this._minP);
    } else {
      this._logMinV = Math.log(this._minV);
      this._scale = (Math.log(this._maxV) - this._logMinV) / (this._maxP - this._minP);
    }
  };

  SliderLogic.prototype.getValueFromParameter = function (parameter) {
    if (this._sMode === 0) {
      return (parameter - this._minP) * this._scale + this._minV;
    }
    return Math.exp((parameter - this._minP) * this._scale + this._logMinV);
  };

  SliderLogic.prototype.getParameterFromValue = function (value) {
    if (this._sMode === 0) {
      return this._minP + (value - this._minV) / this._scale;
    }
    return this._minP + (Math.log(value) - this._logMinV) / this._scale;
  };

  SliderLogic.prototype.refresh = function () {
    if (this._refreshEnabled && this._valueObject) { this.setValue(this._valueObject.value); }
  };

  // toFixed from Slider Logic Class v6 (same rounding as the AS polyfill)
  SliderLogic.prototype.toFixed = function (x, f) {
    return asToFixed(x, f);
  };

  /* ==========================================================================
     SimSlider — accessible custom slider component.
     Reproduces "Standard Slider v6" behavior: draggable thumb with the same
     offset math, bar press/hold auto-repeat (500 ms delay, 0.05 ticks/ms),
     arrow keys move exactly one value tick, editable numeric field committed
     on Enter/blur. Adds Page Up/Down, Home/End, and ARIA slider semantics.
     ========================================================================== */

  var PARAM_MIN = 0;
  var PARAM_MAX = 1000;
  var CONTINUOUS_CHANGE_DELAY = 500;  // ms, from Standard Slider v6
  var CONTINUOUS_CHANGE_RATE = 0.05;  // ticks per ms, from Standard Slider v6

  // Roughly how many arrow presses should cross a slider's whole range.
  // The original moved exactly ONE internal tick per arrow press, which is
  // unusable on the high-precision sliders (inclination's tick is 0.001 deg, so
  // 0-180 would need 180,000 presses). Arrow steps are scaled to this target
  // instead; Shift+Arrow still gives the original single-tick fine control.
  var TARGET_ARROW_PRESSES = 150;

  // Round a raw step up/down to a tidy 1 / 2 / 5 x 10^n value.
  function niceStep(x) {
    if (!(x > 0) || !isFinite(x)) { return 0; }
    var mag = Math.pow(10, Math.floor(Math.log(x) / LN10));
    var norm = x / mag;
    var nice;
    if (norm < 1.5) { nice = 1; }
    else if (norm < 3.5) { nice = 2; }
    else if (norm < 7.5) { nice = 5; }
    else { nice = 10; }
    return nice * mag;
  }

  function SimSlider(mountId, opts) {
    var self = this;
    this.opts = opts;
    this.changeHandler = opts.changeHandler || null;
    this.userEnabled = (opts.userEnabled !== undefined) ? opts.userEnabled : true;

    this.controller = new SliderLogic({
      scalingMode: opts.scalingMode,
      valueFormat: opts.precisionMode,
      valueDigits: opts.precision,
      minValue: opts.minValue,
      maxValue: opts.maxValue,
      minParameter: PARAM_MIN,
      maxParameter: PARAM_MAX,
      value: opts.initValue
    });

    // Ticks moved by one arrow press (see TARGET_ARROW_PRESSES above).
    this.arrowTicks = this.computeArrowTicks();

    // --- DOM ---
    var mount = document.getElementById(mountId);
    var root = document.createElement('div');
    root.className = 'sim-slider' + (opts.showField === false ? ' sim-slider--nofield' : '');
    var fieldId = mountId + '-field';

    var label = document.createElement('label');
    label.className = 'sim-slider__label';
    label.textContent = opts.labelText;

    var field = null;
    var units = null;
    if (opts.showField !== false) {
      label.htmlFor = fieldId;
      field = document.createElement('input');
      field.className = 'sim-slider__field';
      field.type = 'text';
      field.id = fieldId;
      field.autocomplete = 'off';
      field.inputMode = 'decimal';
      field.maxLength = opts.maxChars || 8;
      field.setAttribute('aria-label', opts.ariaLabel ||
        (opts.quantityName + (opts.unitWords ? ' in ' + opts.unitWords : '')));

      units = document.createElement('span');
      units.className = 'sim-slider__units';
      units.id = mountId + '-units';
      units.setAttribute('aria-hidden', 'true');
      // Unit labels are rendered as HTML with real subscripts in the page font
      // (exactly as the original Flash drew "M<sub>jup</sub>" etc.), so they match
      // the surrounding sans-serif UI text. Screen readers get the full spoken
      // unit from the thumb/field aria-label and aria-valuetext, so this span is
      // aria-hidden and carries no accessibility weight.
      if (opts.unitsHTML) { units.innerHTML = opts.unitsHTML; }
    }

    var track = document.createElement('div');
    track.className = 'sim-slider__track';
    var bar = document.createElement('div');
    bar.className = 'sim-slider__bar';
    var thumb = document.createElement('div');
    thumb.className = 'sim-slider__thumb';
    thumb.setAttribute('role', 'slider');
    thumb.setAttribute('aria-label', opts.ariaLabel ||
      (opts.quantityName + (opts.unitWords ? ' in ' + opts.unitWords : '')));
    thumb.setAttribute('aria-valuemin', String(opts.minValue));
    thumb.setAttribute('aria-valuemax', String(opts.maxValue));
    thumb.setAttribute('aria-orientation', 'horizontal');
    track.appendChild(bar);
    track.appendChild(thumb);

    root.appendChild(label);
    if (field) { root.appendChild(field); }
    if (units) { root.appendChild(units); }
    root.appendChild(track);
    mount.appendChild(root);

    this.root = root;
    this.field = field;
    this.track = track;
    this.thumb = thumb;

    // --- pointer: thumb drag (same offset math as grabberMC.onPressFunc) ---
    var dragOffsetPx = null;
    thumb.addEventListener('pointerdown', function (e) {
      if (!self.userEnabled) { return; }
      e.preventDefault();
      thumb.focus();
      var rect = track.getBoundingClientRect();
      var thumbX = (self.controller.parameter - PARAM_MIN) / (PARAM_MAX - PARAM_MIN) * rect.width;
      dragOffsetPx = (e.clientX - rect.left) - thumbX;
      thumb.setPointerCapture(e.pointerId);
    });
    thumb.addEventListener('pointermove', function (e) {
      if (dragOffsetPx === null || !self.userEnabled) { return; }
      var rect = track.getBoundingClientRect();
      var param = ((e.clientX - rect.left) - dragOffsetPx) / rect.width * (PARAM_MAX - PARAM_MIN) + PARAM_MIN;
      var c = self.controller;
      var vObj = c.getValueObjectFromValue(c.getValueFromParameter(param));
      if (vObj.value !== c.value) {
        self.setValueByValueObject(vObj, true);
      }
    });
    function endThumbDrag() {
      if (dragOffsetPx !== null) {
        dragOffsetPx = null;
        self.announceCommit();
      }
    }
    thumb.addEventListener('pointerup', endThumbDrag);
    thumb.addEventListener('pointercancel', endThumbDrag);

    // --- pointer: bar press + hold repeat (barMC.onPressFunc / onEnterFrameFunc) ---
    var barHold = null;
    track.addEventListener('pointerdown', function (e) {
      if (e.target === thumb || !self.userEnabled) { return; }
      e.preventDefault();
      thumb.focus();
      var c = self.controller;
      var mValue = c.getValueObjectFromValue(c.getValueFromParameter(self.paramFromEvent(e))).value;
      // Nudge by one arrow step (not one raw tick) so a single click on the bar
      // is visible on the high-precision sliders too.
      if (mValue < c.value) { self.incrementValue(-self.arrowTicks, true); }
      else if (mValue > c.value) { self.incrementValue(self.arrowTicks, true); }
      track.setPointerCapture(e.pointerId);
      barHold = {
        timeLast: performance.now(),
        waitTime: performance.now() + CONTINUOUS_CHANGE_DELAY,
        clientX: e.clientX,
        raf: 0
      };
      var step = function () {
        if (!barHold) { return; }
        var timeNow = performance.now();
        if (timeNow > barHold.waitTime) {
          // Scaled by arrowTicks for the same reason: the original's flat rate
          // of 0.05 ticks/ms would crawl on the high-precision sliders.
          var ticks = CONTINUOUS_CHANGE_RATE * self.arrowTicks * (timeNow - barHold.timeLast);
          var c2 = self.controller;
          var mValueObj = c2.getValueObjectFromValue(c2.getValueFromParameter(self.paramFromClientX(barHold.clientX)));
          if (mValueObj.value < c2.value) {
            var nValueObj = c2.getIncrementedValueObject(null, -ticks);
            if (nValueObj.value <= mValueObj.value) { self.setValueByValueObject(mValueObj, true); }
            else { self.setValueByValueObject(nValueObj, true); }
          } else if (mValueObj.value > c2.value) {
            var nValueObj2 = c2.getIncrementedValueObject(null, ticks);
            if (nValueObj2.value >= mValueObj.value) { self.setValueByValueObject(mValueObj, true); }
            else { self.setValueByValueObject(nValueObj2, true); }
          }
        }
        barHold.timeLast = timeNow;
        barHold.raf = requestAnimationFrame(step);
      };
      barHold.raf = requestAnimationFrame(step);
    });
    track.addEventListener('pointermove', function (e) {
      if (barHold) { barHold.clientX = e.clientX; }
    });
    function endBarHold() {
      if (barHold) {
        cancelAnimationFrame(barHold.raf);
        barHold = null;
        self.announceCommit();
      }
    }
    track.addEventListener('pointerup', endBarHold);
    track.addEventListener('pointercancel', endBarHold);

    // --- keyboard on thumb ---
    var keyAnnounceTimer = 0;
    thumb.addEventListener('keydown', function (e) {
      if (!self.userEnabled) { return; }
      var c = self.controller;
      var handled = true;
      // Shift+Arrow drops back to a single tick for fine adjustment.
      var step = e.shiftKey ? 1 : self.arrowTicks;
      var pageStep = self.arrowTicks * 10;
      switch (e.key) {
        case 'ArrowLeft':
        case 'ArrowDown':
          self.setValueByValueObject(c.getIncrementedValueObject(null, -step), true);
          break;
        case 'ArrowRight':
        case 'ArrowUp':
          self.setValueByValueObject(c.getIncrementedValueObject(null, step), true);
          break;
        case 'PageDown':
          self.setValueByValueObject(c.getIncrementedValueObject(null, -pageStep), true);
          break;
        case 'PageUp':
          self.setValueByValueObject(c.getIncrementedValueObject(null, pageStep), true);
          break;
        case 'Home':
          self.setValue(self.opts.minValue, true);
          break;
        case 'End':
          self.setValue(self.opts.maxValue, true);
          break;
        default:
          handled = false;
      }
      if (handled) {
        e.preventDefault();
        clearTimeout(keyAnnounceTimer);
        keyAnnounceTimer = setTimeout(function () { self.announceCommit(); }, 600);
      }
    });

    // --- numeric field (valueField behavior) ---
    if (field) {
      field.addEventListener('input', function () {
        // restrict = "0-9.Ee+\-"
        var cleaned = field.value.replace(/[^0-9.Ee+\-]/g, '');
        if (cleaned !== field.value) { field.value = cleaned; }
      });
      field.addEventListener('keydown', function (e) {
        if (e.key === 'Enter') {
          e.preventDefault();
          self.commitField();
        }
      });
      field.addEventListener('blur', function () { self.commitField(); });
    }

    this.updateSynchronization();
    this.setUserEnabled(this.userEnabled);
  }

  // How many internal ticks one arrow press should move, so that crossing the
  // full range takes about TARGET_ARROW_PRESSES presses.
  SimSlider.prototype.computeArrowTicks = function () {
    var c = this.controller;
    if (c._pMode === 1) {
      // "fixed digits": every tick is an absolute step of _minIncrement, so pick
      // a tidy value step (never finer than one tick) and convert it to ticks.
      var step = niceStep((c._maxV - c._minV) / TARGET_ARROW_PRESSES);
      if (!(step > c._minIncrement)) { step = c._minIncrement; }
      return Math.max(1, Math.round(step / c._minIncrement));
    }
    // "significant digits": steps are proportional, and one decade spans
    // _ticksPerMag ticks, so scale by how many decades the range covers.
    var decades = Math.log(c._maxV / c._minV) / LN10;
    return Math.max(1, Math.round(c._ticksPerMag * decades / TARGET_ARROW_PRESSES));
  };

  SimSlider.prototype.paramFromClientX = function (clientX) {
    var rect = this.track.getBoundingClientRect();
    return (clientX - rect.left) / rect.width * (PARAM_MAX - PARAM_MIN) + PARAM_MIN;
  };

  SimSlider.prototype.paramFromEvent = function (e) {
    return this.paramFromClientX(e.clientX);
  };

  Object.defineProperty(SimSlider.prototype, 'value', {
    get: function () { return this.controller.value; },
    set: function (arg) { this.setValue(arg, false); }
  });

  Object.defineProperty(SimSlider.prototype, 'valueString', {
    get: function () { return this.controller.valueString; }
  });

  SimSlider.prototype.setValue = function (arg, callChangeHandler) {
    if (typeof arg === 'number' && !isNaN(arg) && isFinite(arg)) {
      this.controller.value = arg;
    }
    this.updateSynchronization();
    if (callChangeHandler && this.changeHandler) { this.changeHandler(this.controller.value); }
  };

  SimSlider.prototype.incrementValue = function (ticks, callChangeHandler) {
    if (typeof ticks === 'number' && !isNaN(ticks) && isFinite(ticks)) {
      this.controller.incrementValue(ticks);
    }
    this.updateSynchronization();
    if (callChangeHandler && this.changeHandler) { this.changeHandler(this.controller.value); }
  };

  SimSlider.prototype.setValueByValueObject = function (vObj, callChangeHandler) {
    this.controller.setValueByValueObject(vObj);
    this.updateSynchronization();
    if (callChangeHandler && this.changeHandler) { this.changeHandler(this.controller.value); }
  };

  SimSlider.prototype.commitField = function () {
    if (!this.field || !this.userEnabled) { return; }
    var v = parseFloat(this.field.value);
    if (typeof v === 'number' && !isNaN(v) && isFinite(v)) {
      this.setValue(v, true);
    } else {
      this.updateSynchronization(); // resync display to current value
    }
    this.announceCommit();
  };

  SimSlider.prototype.spokenValue = function () {
    var s = this.opts.quantityName + ' ' + this.controller.valueString;
    if (this.opts.unitWords) { s += ' ' + this.opts.unitWords; }
    return s;
  };

  SimSlider.prototype.announceCommit = function () {
    if (this.opts.announce) { this.opts.announce(this); }
  };

  SimSlider.prototype.updateSynchronization = function () {
    var pct = (this.controller.parameter - PARAM_MIN) / (PARAM_MAX - PARAM_MIN) * 100;
    this.thumb.style.left = pct + '%';
    this.thumb.setAttribute('aria-valuenow', String(this.controller.value));
    this.thumb.setAttribute('aria-valuetext',
      this.controller.valueString + (this.opts.unitWords ? ' ' + this.opts.unitWords : ''));
    if (this.field) { this.field.value = this.controller.valueString; }
  };

  SimSlider.prototype.setUserEnabled = function (enabled) {
    this.userEnabled = enabled;
    this.root.classList.toggle('sim-slider--disabled', !enabled);
    this.thumb.tabIndex = enabled ? 0 : -1;
    this.thumb.setAttribute('aria-disabled', enabled ? 'false' : 'true');
    if (this.field) { this.field.disabled = !enabled; }
  };

  // matches original API: slider.userEnabled = x; slider.update();
  SimSlider.prototype.update = function () {
    this.setUserEnabled(this.userEnabled);
  };

  /* ==========================================================================
     Lightcurve — port of "Lightcurve Component II.as".
     All geometry stays in the original 400 x 220 stage coordinates; CSS
     scales the canvas. Tick labels are HTML (they zoom with the browser).
     ========================================================================== */

  var lightcurve = {
    // configuration (from the on(initialize) block for this instance)
    width: 400,
    height: 220,
    resolution: 2,
    horizontalMargin: 0.15,
    fluxMargin: 2.5,
    minFluxDifference: 0.000001,
    minFluxMarginPx: 30,
    fluxNoise: 0.1,
    numberOfMeasurements: 50,
    measurementDotSize: 4,
    // Colors: remapped from the original for WCAG 1.4.11 contrast (>= 3:1 on
    // white). Originals recorded in ACCESSIBILITY.md.
    measurementDotColor: '#767676',   // original 0x999999
    curveColor: '#5588ee',            // original 0x6699ff
    curveThickness: 1,
    axesColor: '#000000',
    backgroundColor: '#ffffff',
    phaseCursorNormalColor: '#c05050',  // original 0xee9090
    phaseCursorNormalWidth: 3,
    phaseCursorActiveColor: '#e03030',  // original 0xff5050
    phaseCursorActiveWidth: 4,
    minScreenYSpacing: 25,
    minorTickmarkExtent: 4,
    majorTickmarkExtent: 7,

    // state
    showCurve: true,
    _showMeasurements: false,
    _cPhase: 0.5,
    _phaseOffset: 0.75,   // initPhaseOffset -0.25 normalized, unused in region mode
    _regionShown: 1,      // "eclipse of body 1"
    _dataType: 0,         // "visual flux"
    cursorActive: false,
    systemIsDefined: false,
    systemPeriod: null,
    eclipseOfBody1Duration: null,
    eclipseOfBody2Duration: null,
    plottedVisualFluxDepth: null,
    _minPhase: null,
    _maxPhase: null,
    _curveParams: {
      temperature1: null, temperature2: null, radius1: null, radius2: null,
      separation: null, eccentricity: null, argument: null, inclination: null,
      mass1: null, mass2: null
    },
    _curvePoints: null,
    _measurementPoints: null,
    _ticks: null,

    canvas: null,
    ctx: null,
    yticksEl: null,
    proxyEl: null,

    phaseChangeHandler: null,   // set by main controller

    init: function () {
      this.canvas = document.getElementById('lc-canvas');
      this.ctx = this.canvas.getContext('2d');
      this.yticksEl = document.getElementById('lc-yticks');
      this.proxyEl = document.getElementById('lc-cursor-proxy');
      this.setupCanvasResolution();
      this.setupCursorInteraction();
    },

    setupCanvasResolution: function () {
      var dpr = window.devicePixelRatio || 1;
      this.canvas.width = Math.round(this.width * dpr);
      this.canvas.height = Math.round(this.height * dpr);
      this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    },

    // --- parameters / eclipse geometry (setParameters, verbatim) ---
    setParameters: function (params) {
      var cp = this._curveParams;
      if (params.separation !== undefined) { cp.separation = params.separation; }
      if (params.eccentricity !== undefined) { cp.eccentricity = params.eccentricity; }
      if (params.longitude !== undefined) { cp.argument = params.longitude * PI / 180; }
      if (params.inclination !== undefined) { cp.inclination = params.inclination * PI / 180; }
      if (params.mass1 !== undefined) { cp.mass1 = params.mass1; }
      if (params.mass2 !== undefined) { cp.mass2 = params.mass2; }
      if (params.radius1 !== undefined) { cp.radius1 = params.radius1; }
      if (params.radius2 !== undefined) { cp.radius2 = params.radius2; }
      if (params.temperature1 !== undefined) { cp.temperature1 = params.temperature1; }
      if (params.temperature2 !== undefined) { cp.temperature2 = params.temperature2; }
      this.systemIsDefined = cp.temperature1 != null && cp.temperature2 != null &&
        cp.radius1 != null && cp.radius2 != null && cp.separation != null &&
        cp.eccentricity != null && cp.argument != null && cp.inclination != null;
      this.systemPeriod = null;
      this.eclipseOfBody1Duration = null;
      this.eclipseOfBody2Duration = null;
      if (this.systemIsDefined) {
        this._curveEvents = this.getCurveEventsObject(cp);
        if (cp.mass1 != null && cp.mass2 != null) {
          var a = cp.separation;
          // P = sqrt(4 pi^2 a^3 / (G (m1 + m2))), G = 6.673e-11
          this.systemPeriod = Math.sqrt(39.47841760435743 * a * a * a / (6.673e-11 * (cp.mass1 + cp.mass2)));
          if (this._curveEvents.eclipseOfBody1.occurs) {
            this.eclipseOfBody1Duration = this.systemPeriod * this._curveEvents.eclipseOfBody1.duration.phase;
          } else {
            this.eclipseOfBody1Duration = 0;
          }
          if (this._curveEvents.eclipseOfBody2.occurs) {
            this.eclipseOfBody2Duration = this.systemPeriod * this._curveEvents.eclipseOfBody2.duration.phase;
          } else {
            this.eclipseOfBody2Duration = 0;
          }
        }
      }
    },

    // getBolometricCorrection, verbatim
    getBolometricCorrection: function (T) {
      var logTeff = Math.log(T) / LN10;
      var k;
      if (logTeff > 3.9) {
        k = { a: -100139.4991, b: 116264.1842, c: -53931.97541, d: 12495.04227, e: -1445.868048, f: 66.84924471 };
      } else if (logTeff < 3.7) {
        k = { a: -13884.14899, b: 8595.127427, c: -488.3425525, d: -627.0092238, e: 137.4608131, f: -7.549572042 };
      } else {
        k = { a: 1439.981506, b: -151.9002581, c: -995.1089203, d: 582.5176671, e: -123.3293641, f: 9.160761128 };
      }
      return k.a + logTeff * (k.b + logTeff * (k.c + logTeff * (k.d + logTeff * (k.e + k.f * logTeff))));
    },

    // getCurveEventsObject, verbatim port (root finding for eclipse start/end/depth)
    getCurveEventsObject: function (params) {
      var curveEvents = { eclipseOfBody1: { occurs: false }, eclipseOfBody2: { occurs: false } };
      var sin = Math.sin, cos = Math.cos, tan = Math.tan, atan = Math.atan;
      var a = params.separation;
      var e = params.eccentricity;
      var i = params.inclination;
      var w = params.argument;
      var r1 = params.radius1;
      var r2 = params.radius2;
      var R = (r1 + r2) / a;
      var C1 = Math.sqrt((1 + e) / (1 - e));
      var S2 = cos(i) * cos(i);
      var S1 = 1 - S2;
      var K1 = (1 - e * e) * (1 - e * e) * S1;
      var K2 = -e * e * R * R;
      var K3 = -2 * e * R * R;
      var K4 = (1 - e * e) * (1 - e * e) * S2 - R * R;
      var L1 = -K1;
      var L2 = 2 * K2;
      var L3 = K3;
      var tempList = [];
      var n = 100;
      var vStep = TWO_PI / n;
      var v = -vStep;
      var vLast = v;
      var derLast = L1 * sin(2 * (v + w)) - sin(v) * (L2 * cos(v) + L3);
      var negLast = derLast < 0;
      var b, c, d, fa, fb, fc, fd, m, counter;
      for (var j = 0; j < n; j++) {
        v = j * vStep;
        var der = L1 * sin(2 * (v + w)) - sin(v) * (L2 * cos(v) + L3);
        var neg = der < 0;
        if (neg !== negLast) {
          a = vLast;
          b = v;
          c = a;
          counter = 0;
          do {
            fa = L1 * sin(2 * (a + w)) - sin(a) * (L2 * cos(a) + L3);
            fb = L1 * sin(2 * (b + w)) - sin(b) * (L2 * cos(b) + L3);
            fc = L1 * sin(2 * (c + w)) - sin(c) * (L2 * cos(c) + L3);
            if (fa !== fc && fb !== fc) {
              d = a * fb * fc / ((fa - fb) * (fa - fc)) + b * fa * fc / ((fb - fa) * (fb - fc)) + c * fa * fb / ((fc - fa) * (fc - fb));
            } else {
              d = b - fb * ((b - a) / (fb - fa));
            }
            m = (a + b) / 2;
            if ((m < b && (d > b || d < m)) || (m > b && (d < b || d > m))) { d = m; }
            fd = L1 * sin(2 * (d + w)) - sin(d) * (L2 * cos(d) + L3);
            if (fb * fd < 0) { a = b; }
            c = b;
            b = d;
            counter++;
          } while ((fd < -5e-15 || fd > 5e-15) && counter < 200);
          var f = K1 * cos(d + w) * cos(d + w) + K2 * cos(d) * cos(d) + K3 * cos(d) + K4;
          if (f < 0) {
            tempList.push({ min: ((d + w) % TWO_PI + TWO_PI) % TWO_PI - w });
          }
        }
        negLast = neg;
        derLast = der;
        vLast = v;
      }
      if (tempList.length <= 2) {
        for (var ti = 0; ti < tempList.length; ti++) {
          tempList[ti].endPoints = [];
          var min = tempList[ti].min;
          var endsList;
          if (min + w < PI) { endsList = [-w, PI - w]; }
          else { endsList = [PI - w, TWO_PI - w]; }
          for (var ej = 0; ej < 2; ej++) {
            a = min;
            b = endsList[ej];
            c = a;
            counter = 0;
            do {
              fa = K1 * cos(a + w) * cos(a + w) + K2 * cos(a) * cos(a) + K3 * cos(a) + K4;
              fb = K1 * cos(b + w) * cos(b + w) + K2 * cos(b) * cos(b) + K3 * cos(b) + K4;
              fc = K1 * cos(c + w) * cos(c + w) + K2 * cos(c) * cos(c) + K3 * cos(c) + K4;
              if (fa !== fc && fb !== fc) {
                d = a * fb * fc / ((fa - fb) * (fa - fc)) + b * fa * fc / ((fb - fa) * (fb - fc)) + c * fa * fb / ((fc - fa) * (fc - fb));
              } else {
                d = b - fb * ((b - a) / (fb - fa));
              }
              m = (a + b) / 2;
              if ((m < b && (d > b || d < m)) || (m > b && (d < b || d > m))) { d = m; }
              fd = K1 * cos(d + w) * cos(d + w) + K2 * cos(d) * cos(d) + K3 * cos(d) + K4;
              if (fb * fd < 0) { a = b; }
              c = b;
              b = d;
              counter++;
            } while ((fd < -5e-15 || fd > 5e-15) && counter < 200);
            tempList[ti].endPoints.push(((d + w) % TWO_PI + TWO_PI) % TWO_PI - w);
          }
        }
        var getPhaseFromTrueAnomaly = function (_TA) {
          var _EA = 2 * atan(tan(0.5 * _TA) / C1);
          var _MA = _EA - e * sin(_EA);
          return (_MA / TWO_PI % 1 + 1) % 1;
        };
        for (var k = 0; k < tempList.length; k++) {
          var u = tempList[k].min + w;
          var eclipse = (u < PI) ? curveEvents.eclipseOfBody1 : curveEvents.eclipseOfBody2;
          eclipse.occurs = true;
          eclipse.start = {};
          eclipse.start.trueAnomaly = tempList[k].endPoints[0];
          eclipse.start.phase = getPhaseFromTrueAnomaly(eclipse.start.trueAnomaly);
          eclipse.end = {};
          eclipse.end.trueAnomaly = tempList[k].endPoints[1];
          eclipse.end.phase = getPhaseFromTrueAnomaly(eclipse.end.trueAnomaly);
          eclipse.duration = {};
          eclipse.duration.phase = eclipse.end.phase - eclipse.start.phase;
          if (eclipse.duration.phase < 0) { eclipse.duration.phase += 1; }
          eclipse.duration.trueAnomaly = eclipse.end.trueAnomaly - eclipse.start.trueAnomaly;
          if (eclipse.duration.trueAnomaly < 0) { eclipse.duration.trueAnomaly += TWO_PI; }
          // locate the phase of maximum eclipse depth (minimum separation)
          var vMid = eclipse.start.trueAnomaly + eclipse.duration.trueAnomaly / 2;
          var nn = 50;
          var vStep2 = PI / (2 * nn);
          counter = 0;
          v = vMid;
          var S3, S4, ff;
          do {
            v -= vStep2;
            S3 = cos(v + w);
            S4 = 1 + e * cos(v);
            ff = ((S1 * S3 * S3 + S2) * e * sin(v) / S4 - S1 * S3 * sin(v + w)) / (S4 * S4);
            counter++;
          } while (ff >= 0 && counter <= nn);
          var vLeft = v;
          counter = 0;
          v = vMid;
          do {
            v += vStep2;
            S3 = cos(v + w);
            S4 = 1 + e * cos(v);
            ff = ((S1 * S3 * S3 + S2) * e * sin(v) / S4 - S1 * S3 * sin(v + w)) / (S4 * S4);
            counter++;
          } while (ff <= 0 && counter <= nn);
          var vRight = v;
          a = vLeft;
          b = vRight;
          c = a;
          counter = 0;
          do {
            S3 = cos(a + w); S4 = 1 + e * cos(a);
            fa = ((S1 * S3 * S3 + S2) * e * sin(a) / S4 - S1 * S3 * sin(a + w)) / (S4 * S4);
            S3 = cos(b + w); S4 = 1 + e * cos(b);
            fb = ((S1 * S3 * S3 + S2) * e * sin(b) / S4 - S1 * S3 * sin(b + w)) / (S4 * S4);
            S3 = cos(c + w); S4 = 1 + e * cos(c);
            fc = ((S1 * S3 * S3 + S2) * e * sin(c) / S4 - S1 * S3 * sin(c + w)) / (S4 * S4);
            if (fa !== fc && fb !== fc) {
              d = a * fb * fc / ((fa - fb) * (fa - fc)) + b * fa * fc / ((fb - fa) * (fb - fc)) + c * fa * fb / ((fc - fa) * (fc - fb));
            } else {
              d = b - fb * ((b - a) / (fb - fa));
            }
            m = (a + b) / 2;
            if ((m < b && (d > b || d < m)) || (m > b && (d < b || d > m))) { d = m; }
            S3 = cos(d + w); S4 = 1 + e * cos(d);
            fd = ((S1 * S3 * S3 + S2) * e * sin(d) / S4 - S1 * S3 * sin(d + w)) / (S4 * S4);
            if (fb * fd < 0) { a = b; }
            c = b;
            b = d;
            counter++;
          } while ((fd < -5e-15 || fd > 5e-15) && counter < 200);
          eclipse.maxDepth = {};
          eclipse.maxDepth.trueAnomaly = ((d + w) % TWO_PI + TWO_PI) % TWO_PI - w;
          eclipse.maxDepth.phase = getPhaseFromTrueAnomaly(eclipse.maxDepth.trueAnomaly);
        }
      }
      return curveEvents;
    },

    // addVisFluxAndVisMagProperties, verbatim port
    addVisFluxAndVisMagProperties: function (pointList, params, curveEvents) {
      var cos = Math.cos, sin = Math.sin, abs = Math.abs, atan = Math.atan,
          acos = Math.acos, tan = Math.tan, sqrt = Math.sqrt, log = Math.log;
      var eclipse1 = curveEvents.eclipseOfBody1;
      var eclipse2 = curveEvents.eclipseOfBody2;
      var e = params.eccentricity;
      var i = params.inclination;
      var w = params.argument;
      var r1 = params.radius1;
      var r2 = params.radius2;
      var t1 = params.temperature1;
      var t2 = params.temperature2;
      var C1 = sqrt((1 + e) / (1 - e));
      var R12 = r1 * r1;
      var R22 = r2 * r2;
      var Z0 = 1 / (2 * r2);
      var Z1 = (R22 - R12) * Z0;
      var Z2 = 1 / (2 * r1);
      var Z3 = (R12 - R22) * Z2;
      var aSep = params.separation;
      var J0 = aSep * (1 - e * e);
      var J1 = J0 * J0 * (1 - cos(i) * cos(i));
      var J2 = J0 * J0 * cos(i) * cos(i);
      var J3 = 2 * e;
      var J4 = e * e;
      var BC1 = this.getBolometricCorrection(t1);
      var BC2 = this.getBolometricCorrection(t2);
      var H1 = 1.89553328524593e-43 * Math.pow(t1, 4) * Math.pow(10, BC1 / 2.5);
      var H2 = 1.89553328524593e-43 * Math.pow(t2, 4) * Math.pow(10, BC2 / 2.5);
      var maxVisFlux = (R12 * H1 + R22 * H2) * PI;
      var minVisMag = -18.9669559998301 - 1.0857362047581294 * log(maxVisFlux);
      var getRegion;
      if (eclipse1.occurs && eclipse2.occurs) {
        var end1 = eclipse1.end.phase, start1 = eclipse1.start.phase;
        var end2 = eclipse2.end.phase, start2 = eclipse2.start.phase;
        if (end1 < start1) {
          getRegion = function (phase) {
            if (phase < end1 || phase > start1) { return 1; }
            if (phase > start2 && phase < end2) { return 2; }
            return 0;
          };
        } else if (end2 < start2) {
          getRegion = function (phase) {
            if (phase > start1 && phase < end1) { return 1; }
            if (phase < end2 || phase > start2) { return 2; }
            return 0;
          };
        } else {
          getRegion = function (phase) {
            if (phase > start1 && phase < end1) { return 1; }
            if (phase > start2 && phase < end2) { return 2; }
            return 0;
          };
        }
      } else if (eclipse1.occurs) {
        var endA = eclipse1.end.phase, startA = eclipse1.start.phase;
        if (endA < startA) {
          getRegion = function (phase) { return (phase < endA || phase > startA) ? 1 : 0; };
        } else {
          getRegion = function (phase) { return (phase > startA && phase < endA) ? 1 : 0; };
        }
      } else if (eclipse2.occurs) {
        var endB = eclipse2.end.phase, startB = eclipse2.start.phase;
        if (endB < startB) {
          getRegion = function (phase) { return (phase < endB || phase > startB) ? 2 : 0; };
        } else {
          getRegion = function (phase) { return (phase > startB && phase < endB) ? 2 : 0; };
        }
      } else {
        getRegion = function () { return 0; };
      }
      for (var pi = 0; pi < pointList.length; pi++) {
        var pt = pointList[pi];
        var region = getRegion(pt.phase);
        if (region === 0) {
          pt.visMag = minVisMag;
          pt.visFlux = maxVisFlux;
        } else {
          var ma = pt.phase * 2 * PI;
          var ea0 = 0;
          var ea1 = ma;
          var counter = 0;
          do {
            ea0 = ea1;
            ea1 = ea0 + (ma + e * sin(ea0) - ea0) / (1 - e * cos(ea0));
            counter++;
          } while (abs(ea1 - ea0) > 0.001 && counter < 100);
          var v = 2 * atan(C1 * tan(ea1 / 2));
          var dSep = sqrt((J1 * cos(w + v) * cos(w + v) + J2) / (1 + J3 * cos(v) + J4 * cos(v) * cos(v)));
          if (dSep === 0) { dSep = 1e-8; }
          var ca = Z0 * dSep + Z1 / dSep;
          var cb = Z2 * dSep + Z3 / dSep;
          if (ca < -1) { ca = -1; } else if (ca > 1) { ca = 1; }
          if (cb < -1) { cb = -1; } else if (cb > 1) { cb = 1; }
          var alpha = acos(ca);
          var beta = acos(cb);
          var overlap = R22 * (alpha - ca * sin(alpha)) + R12 * (beta - cb * sin(beta));
          if (region === 1) {
            pt.visFlux = maxVisFlux - H1 * overlap;
          } else {
            pt.visFlux = maxVisFlux - H2 * overlap;
          }
          pt.visMag = -18.9669559998301 - 1.0857362047581294 * log(pt.visFlux);
        }
      }
    },

    // toFixed used by the tick labels (verbatim: handles f <= 0 by rounding)
    lcToFixed: function (x, f) {
      if (isNaN(x) || !isFinite(x)) { return 'error'; }
      f = f | 0;
      if (isNaN(f) || !isFinite(f)) { return 'error'; }
      if (f <= 0) {
        var k = Math.pow(10, -f);
        return String(k * Math.round(x / k));
      }
      if (f > 20) { f = 20; }
      return asToFixed(x, f);
    },

    // --- phase cursor (getCursorPhase / setCursorPhase / setCPhase, verbatim) ---
    getCursorPhase: function () {
      if (this._minPhase == null) { return null; }
      if (this._regionShown === 0) {
        return ((this._cPhase - this._phaseOffset) % 1 + 1) % 1;
      }
      var range = this._maxPhase - this._minPhase;
      if (range < 0) { range += 1; }
      return (this._minPhase + this._cPhase * range) % 1;
    },

    setCPhase: function (arg, callChangeHandler) {
      this._cPhase = (arg % 1 + 1) % 1;
      this.updateCursorPosition();
      if (callChangeHandler && this.phaseChangeHandler) {
        this.phaseChangeHandler(this.getCursorPhase());
      }
    },

    updateCursorPosition: function () {
      // reposition the focus proxy, update its ARIA state, and redraw
      if (this.proxyEl) {
        this.proxyEl.style.left = (this._cPhase * 100) + '%';
        this.proxyEl.setAttribute('aria-valuenow', asToFixed(this._cPhase, 2));
        this.proxyEl.setAttribute('aria-valuetext', 'Phase ' + asToFixed(this._cPhase, 2));
      }
      this.draw();
    },

    // --- update (region-window math, verbatim) ---
    update: function () {
      if (this.systemIsDefined) {
        if (this._regionShown === 0) {
          this.__xScale = this.width;
          this._minPhase = 0;
          this._maxPhase = 1;
        } else {
          var eclipse = this._curveEvents['eclipseOfBody' + this._regionShown];
          if (eclipse.occurs) {
            this.__xScale = this.width * (1 - 2 * this.horizontalMargin) / eclipse.duration.phase;
            this._minPhase = ((eclipse.start.phase - this.horizontalMargin * this.width / this.__xScale) % 1 + 1) % 1;
            this._maxPhase = (this._minPhase + this.width / this.__xScale) % 1;
          } else {
            var w = this._curveParams.argument;
            var e = this._curveParams.eccentricity;
            var _TA = (this._regionShown === 1) ? (1.5707963267948966 - w) : (4.71238898038469 - w);
            var _EA = 2 * Math.atan(Math.tan(0.5 * _TA) / Math.sqrt((1 + e) / (1 - e)));
            var _MA = _EA - e * Math.sin(_EA);
            var centerPhase = (_MA / TWO_PI % 1 + 1) % 1;
            var delta = 0.001;
            this._maxPhase = (centerPhase + delta) % 1;
            this._minPhase = ((centerPhase - delta) % 1 + 1) % 1;
            this.__xScale = this.width / (2 * delta);
          }
        }
      } else {
        this.__xScale = null;
        this._minPhase = null;
        this._maxPhase = null;
      }
      this.updateCurve();
      this.updateMeasurements();
      this.updateVerticalScale();
      this.draw();
    },

    // updateCurve, verbatim math; results stored for the draw pass
    updateCurve: function () {
      if (!this.systemIsDefined) {
        this._maxVisFluxNormed = null;
        this._minVisFluxNormed = null;
        this.__yScaleNormed = null;
        this.__yScale = null;
        this._yOffset = null;
        this._curvePoints = null;
        return;
      }
      var minPhase = this._minPhase;
      var maxPhase = this._maxPhase;
      var xScale = this.__xScale;
      var res = xScale / this.resolution;
      var addPhases = function (pL, eclipse) {
        if (!eclipse.occurs) { return; }
        var start = eclipse.start.phase;
        var middle = eclipse.maxDepth.phase;
        var end = eclipse.end.phase;
        var half1 = middle - start;
        if (half1 < 0) { half1 += 1; }
        var half2 = end - middle;
        if (half2 < 0) { half2 += 1; }
        var n1 = 1 + Math.ceil(half1 * res);
        var step1 = half1 / (n1 - 1);
        var n2 = 1 + Math.ceil(half2 * res);
        var step2 = half2 / (n2 - 1);
        for (var i = 0; i < n1; i++) { pL.push({ phase: (start + i * step1) % 1 }); }
        for (var j = 1; j < n2; j++) { pL.push({ phase: (middle + j * step2) % 1 }); }
      };
      var pL = [];
      if (this._regionShown === 0) {
        addPhases(pL, this._curveEvents.eclipseOfBody1);
        addPhases(pL, this._curveEvents.eclipseOfBody2);
        if (pL.length === 0) { pL.push({ phase: minPhase }); }
        pL.push({ phase: pL[0].phase + 1 });
      } else {
        pL.push({ phase: minPhase });
        addPhases(pL, this._curveEvents['eclipseOfBody' + this._regionShown]);
        pL.push({ phase: maxPhase });
      }
      this.addVisFluxAndVisMagProperties(pL, this._curveParams, this._curveEvents);
      var startPhase = pL[0].phase;
      var maxVisFlux = pL[0].visFlux;
      var minVisMag = pL[0].visMag;
      var minVisFlux = Infinity;
      var maxVisMag = -Infinity;
      for (var i = 0; i < pL.length; i++) {
        var p = pL[i];
        if (p.visFlux < minVisFlux) {
          minVisFlux = p.visFlux;
          maxVisMag = p.visMag;
        }
        if (p.phase < startPhase) { p.phase += 1; }
      }
      this._minPlottedVisMag = minVisMag;
      this._maxPlottedVisMag = maxVisMag;
      this.plottedVisualFluxDepth = (maxVisFlux - minVisFlux) / maxVisFlux;
      // dataType 0 ("visual flux") — the only mode this sim uses
      var noiseMargin = maxVisFlux * this.fluxNoise * this.fluxMargin;
      var halfVisFluxDiff = (maxVisFlux - minVisFlux) / 2;
      var centerFlux = minVisFlux + halfVisFluxDiff;
      var yScale;
      if (halfVisFluxDiff === 0 && noiseMargin === 0) {
        yScale = -this.height / (maxVisFlux * this.minFluxDifference);
      } else {
        yScale = (-this.height / 2) / (halfVisFluxDiff + noiseMargin);
      }
      if (-yScale * noiseMargin < this.minFluxMarginPx) {
        yScale = -(this.height / 2 - this.minFluxMarginPx) / halfVisFluxDiff;
      }
      if (-this.height / yScale < maxVisFlux * this.minFluxDifference) {
        yScale = -this.height / (maxVisFlux * this.minFluxDifference);
      }
      var topFlux = centerFlux - 0.5 * this.height / yScale;
      var botFlux = centerFlux + 0.5 * this.height / yScale;
      var yOffset = -yScale * topFlux;
      this.__yScale = yScale;
      this._yOffset = yOffset;
      this._maxVisFluxNormed = topFlux / maxVisFlux;
      this._minVisFluxNormed = botFlux / maxVisFlux;
      this.__yScaleNormed = this.height * maxVisFlux / (topFlux - botFlux);
      // store screen-space points for drawing
      var pts = [];
      for (var k = 0; k < pL.length; k++) {
        pts.push({
          x: xScale * (pL[k].phase - minPhase),
          y: yOffset + yScale * pL[k].visFlux
        });
      }
      this._curvePoints = pts;
    },

    // updateMeasurements, verbatim math (incl. Box-Muller pairs and the
    // original's tolerance of an odd point count)
    updateMeasurements: function () {
      if (!this.systemIsDefined) {
        this._measurementPoints = null;
        return;
      }
      var fluxNoise = this.fluxNoise;
      var n = this.numberOfMeasurements;
      var xScale = this.__xScale;
      var minPhase = this._minPhase;
      var yScale = this.__yScale;
      var yOffset = this._yOffset;
      var phaseRange = this.width / xScale;
      var rand = Math.random, log = Math.log, sqrt = Math.sqrt;
      var pL = [];
      for (var i = 0; i < n; i++) {
        pL.push({ phase: (minPhase + phaseRange * rand()) % 1 });
      }
      this.addVisFluxAndVisMagProperties(pL, this._curveParams, this._curveEvents);
      var maxVisFlux = pL[0].visFlux;
      for (var j = 0; j < n; j += 2) {
        var o = 0, x1 = 0, x2 = 0;
        do {
          x1 = 2 * rand() - 1;
          x2 = 2 * rand() - 1;
          o = x1 * x1 + x2 * x2;
        } while (o >= 1);
        o = sqrt(-2 * log(o) / o);
        var p = pL[j];
        p.visFlux = maxVisFlux * (p.visFlux / maxVisFlux + fluxNoise * x1 * o);
        p = pL[j + 1];
        if (p) {   // AS1 silently ignored the out-of-range write when n is odd
          p.visFlux = maxVisFlux * (p.visFlux / maxVisFlux + fluxNoise * x2 * o);
        }
      }
      var pts = [];
      for (var k = 0; k < n; k++) {
        var u = pL[k].phase - minPhase;
        if (u < 0) { u += 1; }
        pts.push({
          x: xScale * u,
          y: yOffset + yScale * pL[k].visFlux
        });
      }
      this._measurementPoints = pts;
    },

    // updateVerticalScale, verbatim math; output is a tick list rendered
    // into the HTML gutter (labels) and onto the canvas edge (marks)
    updateVerticalScale: function () {
      var ticks = [];
      if (this.systemIsDefined && this.__yScaleNormed != null) {
        var min = this._minVisFluxNormed;
        var max = this._maxVisFluxNormed;
        var yScale = this.__yScaleNormed;
        var yStep = -1;
        var pow = Math.pow, log = Math.log;
        var minimumSpacing = this.minScreenYSpacing / yScale;
        var majorSpacing = pow(10, Math.ceil(log(minimumSpacing) / LN10));
        var multiple;
        if (majorSpacing / 2 > minimumSpacing) {
          majorSpacing /= 2;
          multiple = 5;
        } else {
          multiple = 2;
        }
        var minorSpacing = majorSpacing / multiple;
        yStep *= minorSpacing * yScale;
        var startTickNum = Math.ceil(min / minorSpacing);
        var tickNumLimit = 1 + Math.floor(max / minorSpacing);
        var y = this.height - yScale * (minorSpacing * startTickNum - min);
        var f = -Math.floor(log(majorSpacing) / LN10);
        for (var i = startTickNum; i < tickNumLimit; i++) {
          if (i % multiple === 0) {
            ticks.push({ y: y, major: true, label: this.lcToFixed(minorSpacing * i, f) });
          } else {
            ticks.push({ y: y, major: false });
          }
          y += yStep;
        }
      }
      this._ticks = ticks;
      this.renderTickLabels();
    },

    renderTickLabels: function () {
      var el = this.yticksEl;
      el.textContent = '';
      if (!this._ticks) { return; }
      for (var i = 0; i < this._ticks.length; i++) {
        var t = this._ticks[i];
        var mark = document.createElement('span');
        mark.className = 'sim-ytick-mark' + (t.major ? ' sim-ytick-mark--major' : '');
        mark.style.top = (t.y / this.height * 100) + '%';
        el.appendChild(mark);
        if (t.major) {
          var lab = document.createElement('span');
          lab.className = 'sim-ytick';
          lab.style.top = (t.y / this.height * 100) + '%';
          lab.textContent = t.label;
          el.appendChild(lab);
        }
      }
    },

    // --- draw everything from state ---
    draw: function () {
      var ctx = this.ctx;
      if (!ctx) { return; }
      var W = this.width, H = this.height;
      ctx.clearRect(0, 0, W, H);
      // background
      ctx.fillStyle = this.backgroundColor;
      ctx.fillRect(0, 0, W, H);
      // measurements (drawn under the curve, as in the original depth order)
      if (this._showMeasurements && this._measurementPoints) {
        var r = this.measurementDotSize / 2;
        ctx.fillStyle = this.measurementDotColor;
        for (var off = 0; off >= -W; off -= W) {
          for (var i = 0; i < this._measurementPoints.length; i++) {
            var mp = this._measurementPoints[i];
            ctx.beginPath();
            ctx.arc(mp.x + off, mp.y, r, 0, TWO_PI);
            ctx.fill();
          }
        }
      }
      // theoretical curve (three tiled copies, like mc1/mc2/mc3)
      if (this.showCurve && this._curvePoints && this._curvePoints.length > 1) {
        ctx.strokeStyle = this.curveColor;
        ctx.lineWidth = this.curveThickness;
        for (var cOff = 0; cOff >= -2 * W; cOff -= W) {
          ctx.beginPath();
          ctx.moveTo(this._curvePoints[0].x + cOff, this._curvePoints[0].y);
          for (var k = 1; k < this._curvePoints.length; k++) {
            ctx.lineTo(this._curvePoints[k].x + cOff, this._curvePoints[k].y);
          }
          ctx.stroke();
        }
      }
      // phase cursor (center line plus the +/- width copies, clipped by canvas)
      var cx = this._cPhase * W;
      ctx.strokeStyle = this.cursorActive ? this.phaseCursorActiveColor : this.phaseCursorNormalColor;
      ctx.lineWidth = this.cursorActive ? this.phaseCursorActiveWidth : this.phaseCursorNormalWidth;
      [cx, cx - W, cx + W].forEach(function (x) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, H);
        ctx.stroke();
      });
      // border
      ctx.strokeStyle = this.axesColor;
      ctx.lineWidth = 1;
      ctx.strokeRect(0.5, 0.5, W - 1, H - 1);
    },

    // --- pointer interaction on the cursor proxy ---
    setupCursorInteraction: function () {
      var self = this;
      var proxy = this.proxyEl;
      var dragOffset = null;

      function stageX(e) {
        var rect = self.canvas.getBoundingClientRect();
        return (e.clientX - rect.left) * (self.width / rect.width);
      }

      proxy.addEventListener('pointerenter', function () {
        self.cursorActive = true;
        self.draw();
      });
      proxy.addEventListener('pointerleave', function () {
        if (dragOffset === null) {
          self.cursorActive = false;
          self.draw();
        }
      });
      proxy.addEventListener('pointerdown', function (e) {
        e.preventDefault();
        proxy.focus();
        dragOffset = stageX(e) - self._cPhase * self.width;
        self.cursorActive = true;
        proxy.setPointerCapture(e.pointerId);
        self.draw();
      });
      proxy.addEventListener('pointermove', function (e) {
        if (dragOffset === null) { return; }
        self.setCPhase((stageX(e) - dragOffset) / self.width, true);
      });
      function endDrag() {
        if (dragOffset !== null) {
          dragOffset = null;
          self.cursorActive = false;
          self.draw();
          if (self.onCursorCommit) { self.onCursorCommit(); }
        }
      }
      proxy.addEventListener('pointerup', endDrag);
      proxy.addEventListener('pointercancel', endDrag);

      var keyTimer = 0;
      proxy.addEventListener('keydown', function (e) {
        var handled = true;
        switch (e.key) {
          case 'ArrowLeft':
          case 'ArrowDown': self.setCPhase(Math.max(0, self._cPhase - 0.01), true); break;
          case 'ArrowRight':
          case 'ArrowUp':   self.setCPhase(Math.min(0.999999, self._cPhase + 0.01), true); break;
          case 'PageDown':  self.setCPhase(Math.max(0, self._cPhase - 0.1), true); break;
          case 'PageUp':    self.setCPhase(Math.min(0.999999, self._cPhase + 0.1), true); break;
          case 'Home':      self.setCPhase(0, true); break;
          case 'End':       self.setCPhase(0.999999, true); break;
          default: handled = false;
        }
        if (handled) {
          e.preventDefault();
          clearTimeout(keyTimer);
          keyTimer = setTimeout(function () {
            if (self.onCursorCommit) { self.onCursorCommit(); }
          }, 600);
        }
      });
    }
  };

  // exposed like the original addProperty accessors
  Object.defineProperty(lightcurve, 'cursorPhase', {
    get: function () { return this.getCursorPhase(); }
  });
  Object.defineProperty(lightcurve, 'showMeasurements', {
    get: function () { return this._showMeasurements; },
    set: function (arg) {
      this._showMeasurements = Boolean(arg);
      this.draw();
    }
  });

  /* ==========================================================================
     Visualization — port of "Transit Visualization.as".
     Original stage coordinates: 350 x 350, scale 9e-8 px per meter.
     ========================================================================== */

  var visualization = {
    // on(initialize) values
    _scale: 9e-8,
    _size: 350,
    planetColor: '#999999',
    orbitPathColor: '153,153,153',   // 0x999999 as rgb triplet
    orbitPathThickness: 1,
    orbitPathAlpha: 0.7,             // original 0.5; raised for 3:1 contrast on black
    backgroundColor: '#000000',
    borderColor: '#666666',
    borderThickness: 1,

    _c: {},
    _phase: 0,
    starColor: '#ffffff',
    arrowImg: null,
    arrowReady: false,
    canvas: null,
    ctx: null,

    init: function () {
      this.canvas = document.getElementById('vis-canvas');
      this.ctx = this.canvas.getContext('2d');
      this._centerX = this._size / 2;
      this._centerY = this._size / 2;
      this.setupCanvasResolution();
      var self = this;
      this.arrowImg = new Image();
      this.arrowImg.onload = function () {
        self.arrowReady = true;
        self.draw();
      };
      this.arrowImg.src = 'assets/shapes/171.svg';
    },

    setupCanvasResolution: function () {
      var dpr = window.devicePixelRatio || 1;
      this.canvas.width = Math.round(this._size * dpr);
      this.canvas.height = Math.round(this._size * dpr);
      this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    },

    setPhase: function (arg) {
      this._phase = arg;
      this.draw();
    },

    setParameters: function (params) {
      if (params.scale !== undefined) { this._scale = params.scale; }
      if (params.eccentricity !== undefined) { this._eccentricity = params.eccentricity; }
      if (params.separation !== undefined) { this._separation = params.separation; }
      if (params.inclination !== undefined) { this._phi = (90 - params.inclination) * PI / 180; }
      if (params.longitude !== undefined) { this._theta = (90 - params.longitude) * PI / 180; }
      if (params.mass1 !== undefined) { this._mass1 = params.mass1; }
      if (params.mass2 !== undefined) { this._mass2 = params.mass2; }
      if (params.radius1 !== undefined) { this._radius1 = params.radius1; }
      if (params.radius2 !== undefined) { this._radius2 = params.radius2; }
      if (params.temperature1 !== undefined) { this.starColor = this.getColorFromTemp(params.temperature1); }
      if (params.minPhase !== undefined) { this._minPhase = params.minPhase; }
      if (params.maxPhase !== undefined) { this._maxPhase = params.maxPhase; }
      if (params.phase !== undefined) { this._phase = params.phase; }
      this._massTotal = this._mass1 + this._mass2;
      this._a1 = this._separation * this._mass2 / this._massTotal;
      this._a2 = this._separation * this._mass1 / this._massTotal;
      this._starScale = this._scale * this._radius1;     // == star radius in px
      this._planetScale = this._scale * this._radius2;   // == planet radius in px
      this.doA();
      this.draw();
    },

    doA: function () {
      var c = this._c;
      var ct = Math.cos(this._theta);
      var st = Math.sin(this._theta);
      var cp = Math.cos(this._phi);
      var sp = Math.sin(this._phi);
      var s = this._scale;
      c.a0 = -s * st;
      c.a1 = s * ct;
      c.a2 = 0;
      c.a3 = s * ct * sp;
      c.a4 = s * st * sp;
      c.a5 = -s * cp;
      c.a6 = s * ct * cp;
      c.a7 = s * st * cp;
      c.a8 = s * sp;
    },

    // getColorFromTemp, verbatim (incl. AS bitwise truncation of components)
    getColorFromTemp: function (temp) {
      if (temp < 1000) { temp = 1000; }
      else if (temp > 40000) { temp = 40000; }
      var logT = Math.log(temp) / LN10;
      var logT2 = logT * logT;
      var logT3 = logT * logT2;
      var r = 22686.34111 - logT * 15082.52755 + logT2 * 3375.333832 - logT3 * 252.4073853;
      if (r < 0) { r = 0; } else if (r > 255) { r = 255; }
      var g;
      if (temp <= 6500) {
        g = -811.6499145 + logT * 36.97365953 + logT2 * 160.7861677 - logT3 * 25.57573664;
      } else {
        g = 13836.23586 - logT * 9069.078214 + logT2 * 2015.254756 - logT3 * 149.7766966;
      }
      var b = -11545.34298 + logT * 8529.658165 - logT2 * 2150.198586 + logT3 * 190.0306573;
      if (b < 0) { b = 0; } else if (b > 255) { b = 255; }
      var rgb = ((r | 0) << 16) | ((g | 0) << 8) | (b | 0);
      return '#' + ('00000' + rgb.toString(16)).slice(-6);
    },

    // Kepler solve for planet/star screen offsets (updatePositions, verbatim)
    getBodyOffsets: function () {
      var sin = Math.sin, cos = Math.cos, abs = Math.abs;
      var ma = this._phase * TWO_PI;
      var e = this._eccentricity;
      var ea0 = 0;
      var ea1 = ma;
      var iCount = 0;
      do {
        ea0 = ea1;
        ea1 = ea0 + (ma + e * sin(ea0) - ea0) / (1 - e * cos(ea0));
        iCount++;
      } while (abs(ea1 - ea0) > 0.001 && iCount < 100);
      var ta = 2 * Math.atan(Math.sqrt((1 + e) / (1 - e)) * Math.tan(ea1 / 2));
      var cosTa = cos(ta);
      var sinTa = sin(ta);
      var k = (1 - e * e) / (1 + e * cosTa);
      var r1 = this._a1 * k;
      var r2 = this._a2 * k;
      var wx1 = -r1 * cosTa;
      var wy1 = -r1 * sinTa;
      var wx2 = r2 * cosTa;
      var wy2 = r2 * sinTa;
      var c = this._c;
      var sx1 = wx1 * c.a0 + wy1 * c.a1;
      var sy1 = wx1 * c.a3 + wy1 * c.a4;
      var sx2 = wx2 * c.a0 + wy2 * c.a1;
      var sy2 = wx2 * c.a3 + wy2 * c.a4;
      return { x: this._centerX + sx2 - sx1, y: this._centerY + sy2 - sy1 };
    },

    // orbital path over the plotted phase window (updateOrbitalPath, verbatim)
    getOrbitPath: function () {
      var sin = Math.sin, cos = Math.cos, abs = Math.abs;
      var a1 = this._a1;
      var a2 = this._a2;
      var e = this._eccentricity;
      var cx = this._centerX;
      var cy = this._centerY;
      function solveEA(phase) {
        var ma = phase * 2 * PI;
        var ea0 = 0;
        var ea1 = ma;
        var iCount = 0;
        do {
          ea0 = ea1;
          ea1 = ea0 + (ma + e * sin(ea0) - ea0) / (1 - e * cos(ea0));
          iCount++;
        } while (abs(ea1 - ea0) > 0.001 && iCount < 100);
        return ea1;
      }
      var minEA = solveEA(this._minPhase);
      var maxEA = solveEA(this._maxPhase);
      var diffEA = maxEA - minEA;
      if (diffEA < 0) { diffEA += TWO_PI; }
      var n = 40;
      var step = diffEA / n;
      var B = Math.sqrt(1 - e * e);
      var aAngle = minEA;
      var k0 = this._c.a0;
      var k1 = this._c.a1;
      var k3 = this._c.a3;
      var k4 = this._c.a4;
      var maxD2 = 5 * this._size * this._size;
      var pts = [];
      for (var i = 0; i <= n; i++) {
        var wx = cos(aAngle) - e;
        var wy = B * sin(aAngle);
        var wx1 = -a1 * wx;
        var wy1 = -a1 * wy;
        var wx2 = a2 * wx;
        var wy2 = a2 * wy;
        var sx1 = wx1 * k0 + wy1 * k1;
        var sy1 = wx1 * k3 + wy1 * k4;
        var sx2 = wx2 * k0 + wy2 * k1;
        var sy2 = wx2 * k3 + wy2 * k4;
        var sx = cx + sx2 - sx1;
        var sy = cy + sy2 - sy1;
        pts.push({ x: sx, y: sy, inRange: (sx * sx + sy * sy <= maxD2) });
        aAngle += step;
      }
      return pts;
    },

    drawShadedDisk: function (x, y, r, color) {
      var ctx = this.ctx;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, TWO_PI);
      ctx.fillStyle = color;
      ctx.fill();
      // radial highlight, from the original beginGradientFill:
      // white at alphas 55% / 45% / 10%, ratios 0 / 170 / 255
      var grad = ctx.createRadialGradient(x, y, 0, x, y, r);
      grad.addColorStop(0, 'rgba(255,255,255,0.55)');
      grad.addColorStop(170 / 255, 'rgba(255,255,255,0.45)');
      grad.addColorStop(1, 'rgba(255,255,255,0.10)');
      ctx.beginPath();
      ctx.arc(x, y, r, 0, TWO_PI);
      ctx.fillStyle = grad;
      ctx.fill();
    },

    draw: function () {
      var ctx = this.ctx;
      if (!ctx || this._radius1 === undefined) { return; }
      var S = this._size;
      ctx.clearRect(0, 0, S, S);
      ctx.fillStyle = this.backgroundColor;
      ctx.fillRect(0, 0, S, S);

      // star (fixed at center; drawn first, like starMC at depth 1)
      var rStar = this._starScale;
      this.drawShadedDisk(this._centerX, this._centerY, rStar, this.starColor);

      // orbit path (depth 2 — drawn over the star)
      if (this._minPhase != null && this._maxPhase != null) {
        var path = this.getOrbitPath();
        ctx.strokeStyle = 'rgba(' + this.orbitPathColor + ',' + this.orbitPathAlpha + ')';
        ctx.lineWidth = this.orbitPathThickness;
        ctx.beginPath();
        var started = false;
        for (var i = 0; i < path.length; i++) {
          var p = path[i];
          if (i === 0) {
            ctx.moveTo(p.x, p.y);
            started = true;
          } else if (p.inRange) {
            ctx.lineTo(p.x, p.y);
          }
        }
        if (started) { ctx.stroke(); }
      }

      // planet (depth 3)
      var pos = this.getBodyOffsets();
      var rPlanet = this._planetScale;
      this.drawShadedDisk(pos.x, pos.y, rPlanet, this.planetColor);

      // pointer arrow for a very small planet (arrowMC, depth 5) —
      // reuses the exported vector asset shapes/171.svg
      if (rPlanet < 3 && this.arrowReady) {
        ctx.drawImage(this.arrowImg, pos.x - 8, pos.y + 5 + rPlanet, 16, 25);
      }

      // border (depth 4 in original, but drawn on top of the masked area)
      ctx.strokeStyle = this.borderColor;
      ctx.lineWidth = this.borderThickness;
      ctx.strokeRect(0.5, 0.5, S - 1, S - 1);

      this.updateDescription(pos, rStar, rPlanet);
    },

    updateDescription: function (pos, rStar, rPlanet) {
      var el = document.getElementById('vis-desc');
      if (!el) { return; }
      var dx = pos.x - this._centerX;
      var dy = pos.y - this._centerY;
      var overlapping = Math.sqrt(dx * dx + dy * dy) < (rStar + rPlanet);
      var text = 'Transit view: the star is at the center';
      text += (window.simStarSummary ? ' (' + window.simStarSummary + ')' : '');
      text += '. The planet is ' + (overlapping
        ? 'in front of or behind the star (near mid-transit the lightcurve dips).'
        : 'away from the star’s disk.');
      el.textContent = text;
    }
  };

  /* ==========================================================================
     Main controller — port of DefineSprite_214 frame scripts (DoAction_2/3)
     ========================================================================== */

  // presetsList, verbatim
  var presetsList = [
    { name: '1. Option A', planetMass: 1, planetRadius: 1, starMass: 1, separation: 1, eccentricity: 0, inclination: 90, longitude: 0 },
    { name: '2. Option B', planetMass: 0.0032, planetRadius: 0.09, starMass: 1, separation: 1, eccentricity: 0, inclination: 90, longitude: 0 },
    { name: '3. OGLE-TR-113 b', planetMass: 1.32, planetRadius: 1.09, starMass: 0.78, separation: 0.0229, eccentricity: 0, inclination: 89.4, longitude: 0 },
    { name: '4. TrES-1', planetMass: 0.61, planetRadius: 1.08, starMass: 0.87, separation: 0.0393, eccentricity: 0.135, inclination: 88.2, longitude: 0 },
    { name: '5. XO-1 b', planetMass: 0.9, planetRadius: 1.3, starMass: 1, separation: 0.0488, eccentricity: 0, inclination: 87.7, longitude: 0 },
    { name: '6. HD 209458 b', planetMass: 0.69, planetRadius: 1.32, starMass: 1.01, separation: 0.045, eccentricity: 0.07, inclination: 86.929, longitude: 83 },
    { name: '7. OGLE-TR-111 b', planetMass: 0.53, planetRadius: 1, starMass: 0.82, separation: 0.047, eccentricity: 0, inclination: 86.5, longitude: 0 },
    { name: '8. OGLE-TR-10 b', planetMass: 0.54, planetRadius: 1.16, starMass: 1.22, separation: 0.04162, eccentricity: 0, inclination: 86.46, longitude: 0 },
    { name: '9. HD 189733 b', planetMass: 1.15, planetRadius: 1.154, starMass: 0.82, separation: 0.0313, eccentricity: 0, inclination: 85.79, longitude: 0 },
    { name: '10. HD 149026 b', planetMass: 0.36, planetRadius: 0.725, starMass: 1.3, separation: 0.042, eccentricity: 0, inclination: 85.3, longitude: 0 },
    { name: '11. OGLE-TR-132 b', planetMass: 1.19, planetRadius: 1.13, starMass: 1.35, separation: 0.0306, eccentricity: 0, inclination: 85, longitude: 0 }
  ];

  var noMeasurementsNoise = 0.00001;

  var announcerEl, eclipseTimeEl, eclipseDepthEl, starInfoEl, arrowEl;
  var presetSelect, setPresetButton, showCurveCheck, showMeasurementsCheck;
  var sliders = {};

  function announce(text) {
    if (announcerEl) { announcerEl.textContent = text; }
  }

  function eclipseSummary() {
    var d = lightcurve.eclipseOfBody1Duration;
    if (d === 0 || d == null) { return 'No eclipse.'; }
    return 'Eclipse takes ' + getTimeString(d) + 's of ' + getTimeString(lightcurve.systemPeriod) +
      ' orbit. Eclipse depth ' + formatNumber(lightcurve.plottedVisualFluxDepth, 3) + '.';
  }

  function announceSlider(slider) {
    announce(slider.spokenValue() + '. ' + eclipseSummary());
  }

  // updateEclipseTimeField, verbatim strings
  function updateEclipseTimeField() {
    var duration = lightcurve.eclipseOfBody1Duration;
    if (duration === 0 || duration == null) {
      arrowEl.style.visibility = 'hidden';
      eclipseTimeEl.textContent = '(no eclipse)';
      eclipseDepthEl.textContent = '(no eclipse)';
    } else {
      arrowEl.style.visibility = 'visible';
      eclipseTimeEl.textContent = 'eclipse takes ' + getTimeString(lightcurve.eclipseOfBody1Duration) +
        's of ' + getTimeString(lightcurve.systemPeriod) + ' orbit';
      eclipseDepthEl.textContent = formatNumber(lightcurve.plottedVisualFluxDepth, 3);
    }
  }

  // displayStarInfo, verbatim string
  function displayStarInfo(starType, starTemp, starRadius) {
    var starTypeNum = Math.round(starType.number);
    if (starTypeNum === 10) { starTypeNum = 9; }
    // Text is verbatim from the original. The only forced line break is after the
    // temperature ("… 6100 K,"); the rest of the sentence wraps naturally to the
    // panel width. Values are computed numbers/letters, so innerHTML is safe here.
    starInfoEl.innerHTML = 'a main sequence star of this mass would have spectral type ' +
      starType.type + starTypeNum + 'V' + ', temperature ' + getFormattedNumber(starTemp, 3, 12) +
      '&nbsp;K' + ',<br>and radius ' + asToFixed(starRadius, 1) + ' Rsun';
    // short summary reused by the visualization's screen-reader description
    window.simStarSummary = 'spectral type ' + starType.type + starTypeNum + 'V, temperature ' +
      getFormattedNumber(starTemp, 3, 12) + ' kelvin, radius ' + asToFixed(starRadius, 1) + ' solar radii';
  }

  // updateParameters, verbatim flow
  function updateParameters() {
    var starMass = sliders.starMass.value;
    var starLum = getLuminosityFromMass(starMass);
    var starTemp = getTempFromLuminosity(starLum);
    var starRadius = getRadiusFromTempAndLuminosity(starTemp, starLum);
    var starType = getSpectralTypeFromTemp(starTemp);
    displayStarInfo(starType, starTemp, starRadius);
    var params = {};
    params.mass1 = starMass * 1.98892e+30;
    params.radius1 = starRadius * 695500000;
    params.temperature1 = starTemp;
    params.mass2 = sliders.planetMass.value * 1.8987e+27;
    params.radius2 = sliders.planetRadius.value * 71492000;
    params.temperature2 = 500;
    params.inclination = sliders.inclination.value;
    params.longitude = sliders.longitude.value;
    params.eccentricity = sliders.eccentricity.value;
    params.separation = sliders.separation.value * 149598000000;
    lightcurve.setParameters(params);
    lightcurve.update();
    params.minPhase = lightcurve._minPhase;
    params.maxPhase = lightcurve._maxPhase;
    params.phase = lightcurve.cursorPhase;
    visualization.setParameters(params);
    updateEclipseTimeField();
    setSetButtonEnabled(true);
  }

  function onPhaseChangedViaSlider() {
    lightcurve.setCPhase(sliders.phase.value);
    visualization.setPhase(lightcurve.cursorPhase);
  }

  function onPhaseChangedViaLightcurve() {
    sliders.phase.value = lightcurve._cPhase;
    visualization.setPhase(lightcurve.cursorPhase);
  }

  function onNoiseChanged() {
    lightcurve.fluxNoise = sliders.noise.value;
    lightcurve.update();
  }

  function onNumberOfMeasurementsChanged() {
    lightcurve.numberOfMeasurements = sliders.number.value;
    lightcurve.update();
  }

  function onShowCurveChanged() {
    lightcurve.showCurve = showCurveCheck.checked;
    lightcurve.draw();
    announce(showCurveCheck.checked ? 'Theoretical curve shown.' : 'Theoretical curve hidden.');
  }

  function onShowMeasurementsChanged() {
    if (showMeasurementsCheck.checked) {
      lightcurve.fluxNoise = sliders.noise.value;
      lightcurve.update();
      lightcurve.showMeasurements = true;
    } else {
      lightcurve.fluxNoise = noMeasurementsNoise;
      lightcurve.update();
      lightcurve.showMeasurements = false;
    }
    sliders.number.userEnabled = sliders.noise.userEnabled = showMeasurementsCheck.checked;
    sliders.number.update();
    sliders.noise.update();
    announce(showMeasurementsCheck.checked
      ? 'Simulated measurements shown. Noise and number sliders enabled.'
      : 'Simulated measurements hidden. Noise and number sliders disabled.');
  }

  function initializeComboBox() {
    for (var i = 0; i < presetsList.length; i++) {
      var opt = document.createElement('option');
      opt.value = String(i);
      opt.textContent = presetsList[i].name;
      presetSelect.appendChild(opt);
    }
  }

  function setSetButtonEnabled(enabled) {
    setPresetButton.disabled = !enabled;
  }

  function onPresetChanged() {
    setSetButtonEnabled(true);
  }

  function setPreset() {
    var preset = presetsList[parseInt(presetSelect.value, 10)];
    sliders.planetMass.value = preset.planetMass;
    sliders.planetRadius.value = preset.planetRadius;
    sliders.starMass.value = preset.starMass;
    sliders.separation.value = preset.separation;
    sliders.eccentricity.value = preset.eccentricity;
    sliders.inclination.value = preset.inclination;
    sliders.longitude.value = preset.longitude;
    updateParameters();
    setSetButtonEnabled(false);
    announce('Preset ' + preset.name + ' applied. ' + eclipseSummary());
  }

  // onResetClicked, verbatim flow
  function onResetClicked() {
    sliders.planetMass.value = 0.657;
    sliders.planetRadius.value = 1.32;
    sliders.starMass.value = 1.09;
    sliders.separation.value = 0.047;
    sliders.eccentricity.value = 0;
    sliders.inclination.value = 86.929;
    sliders.longitude.value = 0;
    sliders.noise.value = 0.1;
    sliders.number.value = 50;
    sliders.phase.value = 0.5;
    sliders.number.userEnabled = false;
    sliders.number.update();
    sliders.noise.userEnabled = false;
    sliders.noise.update();
    showCurveCheck.checked = true;
    showMeasurementsCheck.checked = false;
    lightcurve.showCurve = true;
    lightcurve.showMeasurements = false;
    lightcurve.numberOfMeasurements = sliders.number.value;
    lightcurve.fluxNoise = noMeasurementsNoise;
    lightcurve.setCPhase(sliders.phase.value);
    visualization.setPhase(lightcurve.cursorPhase);
    presetSelect.selectedIndex = 0;
    updateParameters();
  }

  /* ------------------------- bootstrapping ------------------------- */

  function buildSliders() {
    var mk = function (mountId, opts) {
      opts.announce = announceSlider;
      return new SimSlider(mountId, opts);
    };
    // configurations verbatim from the on(initialize) blocks
    sliders.planetMass = mk('planet-mass-slider', {
      labelText: 'mass:', unitsHTML: 'M<sub>jup</sub>', unitWords: 'Jupiter masses',
      quantityName: 'Planet mass',
      minValue: 0.001, maxValue: 100, initValue: 0.657,
      scalingMode: 'logarithmic', precisionMode: 'significant digits', precision: 3,
      maxChars: 7, changeHandler: updateParameters
    });
    sliders.planetRadius = mk('planet-radius-slider', {
      labelText: 'radius:', unitsHTML: 'R<sub>jup</sub>', unitWords: 'Jupiter radii',
      quantityName: 'Planet radius',
      minValue: 0.01, maxValue: 2, initValue: 1.32,
      scalingMode: 'logarithmic', precisionMode: 'significant digits', precision: 3,
      maxChars: 6, changeHandler: updateParameters
    });
    sliders.separation = mk('separation-slider', {
      labelText: 'semimajor axis:', unitsHTML: 'AU', unitWords: 'astronomical units',
      quantityName: 'Semimajor axis',
      minValue: 0.015, maxValue: 2, initValue: 0.047,
      scalingMode: 'logarithmic', precisionMode: 'significant digits', precision: 3,
      maxChars: 6, changeHandler: updateParameters
    });
    sliders.eccentricity = mk('eccentricity-slider', {
      labelText: 'eccentricity:', unitsHTML: '', unitWords: '',
      quantityName: 'Eccentricity',
      minValue: 0, maxValue: 0.4, initValue: 0,
      scalingMode: 'linear', precisionMode: 'fixed digits', precision: 2,
      maxChars: 5, changeHandler: updateParameters
    });
    sliders.starMass = mk('star-mass-slider', {
      labelText: 'mass:', unitsHTML: 'M<sub>sun</sub>', unitWords: 'solar masses',
      quantityName: 'Star mass',
      minValue: 0.5, maxValue: 2, initValue: 1.09,
      scalingMode: 'linear', precisionMode: 'fixed digits', precision: 2,
      maxChars: 5, changeHandler: updateParameters
    });
    sliders.inclination = mk('inclination-slider', {
      labelText: 'inclination:', unitsHTML: '°', unitWords: 'degrees',
      quantityName: 'Inclination',
      minValue: 0, maxValue: 180, initValue: 86.929,
      scalingMode: 'linear', precisionMode: 'fixed digits', precision: 3,
      maxChars: 6, changeHandler: updateParameters
    });
    sliders.longitude = mk('longitude-slider', {
      labelText: 'longitude:', unitsHTML: '°', unitWords: 'degrees',
      quantityName: 'Longitude',
      minValue: 0, maxValue: 360, initValue: 0,
      scalingMode: 'linear', precisionMode: 'fixed digits', precision: 1,
      maxChars: 6, changeHandler: updateParameters
    });
    sliders.phase = mk('phase-slider', {
      labelText: 'phase:', unitsHTML: '', unitWords: '',
      quantityName: 'Phase', showField: false,
      minValue: 0, maxValue: 1, initValue: 0.5,
      scalingMode: 'linear', precisionMode: 'fixed digits', precision: 2,
      maxChars: 5, changeHandler: onPhaseChangedViaSlider
    });
    sliders.noise = mk('noise-slider', {
      labelText: 'noise:', unitsHTML: '', unitWords: '',
      quantityName: 'Noise',
      minValue: 0.00001, maxValue: 0.2, initValue: 0.1,
      scalingMode: 'logarithmic', precisionMode: 'significant digits', precision: 2,
      maxChars: 8, changeHandler: onNoiseChanged
    });
    sliders.number = mk('number-slider', {
      labelText: 'number:', unitsHTML: '', unitWords: '',
      quantityName: 'Number of measurements', ariaLabel: 'Number of measurements',
      minValue: 5, maxValue: 250, initValue: 50,
      scalingMode: 'linear', precisionMode: 'fixed digits', precision: 0,
      maxChars: 3, changeHandler: onNumberOfMeasurementsChanged
    });
  }

  function initialize() {
    announcerEl = document.getElementById('sim-announcer');
    eclipseTimeEl = document.getElementById('eclipse-time-field');
    eclipseDepthEl = document.getElementById('eclipse-depth-field');
    starInfoEl = document.getElementById('star-info-field');
    arrowEl = document.getElementById('eclipse-arrow');
    presetSelect = document.getElementById('preset-select');
    setPresetButton = document.getElementById('set-preset-button');
    showCurveCheck = document.getElementById('show-curve-check');
    showMeasurementsCheck = document.getElementById('show-measurements-check');

    lightcurve.init();
    visualization.init();
    buildSliders();

    lightcurve.phaseChangeHandler = onPhaseChangedViaLightcurve;
    lightcurve.onCursorCommit = function () {
      announce('Phase ' + asToFixed(lightcurve._cPhase, 2) + '. ' + eclipseSummary());
    };

    showCurveCheck.addEventListener('change', onShowCurveChanged);
    showMeasurementsCheck.addEventListener('change', onShowMeasurementsChanged);
    presetSelect.addEventListener('change', onPresetChanged);
    setPresetButton.addEventListener('click', setPreset);

    // masthead Reset (bubbling, composed CustomEvent from <kl-unl-masthead>)
    document.addEventListener('sim-reset', function () {
      onResetClicked();
      announce('Simulation reset to its initial state. ' + eclipseSummary());
    });

    // keep canvas backing resolution crisp when zoom / dpr changes
    var lastDpr = window.devicePixelRatio || 1;
    window.addEventListener('resize', function () {
      var dpr = window.devicePixelRatio || 1;
      if (dpr !== lastDpr) {
        lastDpr = dpr;
        lightcurve.setupCanvasResolution();
        visualization.setupCanvasResolution();
        lightcurve.draw();
        visualization.draw();
      }
    });

    initializeComboBox();
    onResetClicked();
  }

  // The KL-UNL pipeline exposes klunlInitEqn() for MathJax-driven equations, but
  // this sim has no equations — only unit labels, which the original Flash drew as
  // plain text with <sub> tags and which are reproduced the same way (page font,
  // real subscripts) so they match the surrounding UI. Nothing to typeset here, so
  // this stays a no-op that harmlessly overrides the foundation's default.
  window.klunlInitEqn = function () {};

  initialize();
})();
