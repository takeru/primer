var log = console.log

function definePrimer($) {

  var Primer = Class.create({
    initialize : function(opts){
      this.container          = opts.container
      this.width              = opts.width
      this.height             = opts.height
      this.useGlobalMouseMove = opts.useGlobalMouseMove

      this.context = null
      this.text_div = null
      this.actions = []

      $("html head").append("<style>.primer_text { position: absolute; margin: 0; padding: 0; line-height: normal; z-index: 0;}</style>")

      var container = $(this.container).eq(0)
      container.append('<div id="primer_text_div"></div>')

      var text_div = $("#primer_text_div", container).eq(0)
      text_div.css("position", "relative")
      this.text_div = text_div

      var canvas_el = document.createElement('canvas')
      canvas_el.width  = this.width
      canvas_el.height = this.height
      canvas_el.style.zIndex= '0'
      canvas_el.style.border = '1px black solid'
      if (canvas_el.getContext) {
        container.append(canvas_el);
      } else {
        // if ExplorerCanvas (adds canvas support to IE) is available, use its G_vmlCanvasManager to initialize the canvas element.
        if (window.G_vmlCanvasManager) {
          window.G_vmlCanvasManager.initElement( $(canvas_el).appendTo(container).get(0) )
        }
      }
      var canvas = $('canvas', container)

      this.context = canvas_el.getContext('2d')
      //this.context = new Object()
      //Object.extend(this.context.prototype, canvas_el.getContext('2d'))
      this.root = new Primer.Layer()

      this.setupExt()
      var primer = this
      if (this.useGlobalMouseMove) {
        $('body').bind("mousemove", function(e) {
          if ($(e.target).parents().find(this.container)) {
            var $target = $(canvas_el)
            var bounds = $target.offset()
            e.localX = e.pageX - bounds.left
            e.localY = e.pageY - bounds.top
            primer.onMouseMove(e)
          } else {
            primer.outOfBounds();
          }
        })
      } else {
        canvas.bind("mousemove", function(e){
          var bounds = $(e.currentTarget).offset()
          e.localX = e.pageX - bounds.left
          e.localY = e.pageY - bounds.top
          primer.onMouseMove(e)
        })
        canvas.bind("click", function(e){
          var bounds = $(e.currentTarget).offset()
          e.localX = e.pageX - bounds.left
          e.localY = e.pageY - bounds.top
          primer.onClick(e)
        })
      }
    },

    redraw: function() {
      this.context.clearRect(0, 0, this.width, this.height)
      $(".primer_text", this.text_div).remove()
      this.setupExt()
      this.root._draw(this)
    },

    onMouseMove: function(e) {
      this.root.onMouseMove(this, e)
      this.actions.each(function(action){
        action[0](action[1])
      })
      this.actions = []
    },

    onClick: function(e) {
      this.root.onClick(this, e)
      this.actions.each(function(action){
        action[0](action[1])
      })
      this.actions = []
    },

    outOfBounds: function() {
      // Do nothing by default
    },

    setupExt: function() {
      this.context.ext = {
        textAlign: "left",
        font: "10px sans-serif"
      }
    },
  }) // class Primer

  Primer.Layer = Class.create({
    initialize : function(){
      this.draw = null
      this.children = []
      this.calls = []
      this.x = 0
      this.y = 0
      this.visible = true
      this.mouseoverVal = function() { }
      this.mouseoutVal = function() { }

      this.mouseWithin = false
    },

    setXY : function(x, y){
      this.x = x
      this.y = y
    },

    /* global x and y getters */
    globalX: function() {
      return this.x + this.parent.globalX()
    },
    globalY: function() {
      return this.y + this.parent.globalY()
    },

    /* children */
    addChild: function(child) {
      this.children.push(child)
    },
    removeChild: function(child) {
      var newChildren = []
      this.children.each(function(c){
        if (c != child) {
          newChildren.push(c)
        }
      })
      this.children = newChildren
    },

    /* events */
    mouseover: function(fn) {
      this.mouseoverVal = fn
    },
    mouseout: function(fn) {
      this.mouseoutVal = fn
    },

    /* canvas api */
    setFillStyle: function(a) {
      this.calls.push(["fillStyle", a])
    },
    setStrokeStyle: function(a) {
      this.calls.push(["strokeStyle", a])
    },
    setLineWidth: function(a) {
      this.calls.push(["lineWidth", a])
    },
    beginPath: function() {
      this.calls.push(["beginPath"])
    },
    moveTo: function(a, b) {
      this.calls.push(["moveTo", a, b])
    },
    lineTo: function(a, b) {
      this.calls.push(["lineTo", a, b])
    },
    quadraticCurveTo: function(a, b, c, d) {
      this.calls.push(["quadraticCurveTo", a, b, c, d])
    },
    arc: function(a, b, c, d, e, f) {
      this.calls.push(["arc", a, b, c, d, e, f])
    },
    fill: function() {
      this.calls.push(["fill"])
    },
    stroke: function() {
      this.calls.push(["stroke"])
    },
    fillRect: function(a, b, c, d) {
      this.calls.push(["fillRect", a, b, c, d])
    },
    fillText: function(a, b, c, d, e) {
      this.calls.push(["fillText", a, b, c, d, e])
    },
    setTextAlign: function(a) {
      this.calls.push(["textAlign", a])
    },
    setFont: function(a) {
      this.calls.push(["font", a])
    },

    /* meta canvas api */
    rect: function(x, y, w, h) {
      this.beginPath()
      this.moveTo(x  , y  )
      this.lineTo(x+w, y  )
      this.lineTo(x+w, y+h)
      this.lineTo(x  , y+h)
      this.lineTo(x  , y)
    },
    roundedRect: function(x, y, w, h, rad) {
      this.beginPath()
      this.moveTo(x, y + rad);
      this.lineTo(x, y + h - rad);
      this.quadraticCurveTo(x, y + h, x + rad, y + h);
      this.lineTo(x + w - rad, y + h);
      this.quadraticCurveTo(x + w, y + h, x + w, y + h - rad);
      this.lineTo(x + w, y + rad);
      this.quadraticCurveTo(x + w, y, x + w - rad, y);
      this.lineTo(x + rad, y);
      this.quadraticCurveTo(x, y, x, y + rad);
    },
    fillRoundedRect: function(x, y, w, h, rad) {
      this.roundedRect(x, y, w, h, rad)
      this.fill()
    },

    /* draw */
    _draw: function(primer) {
      if(!this.visible){ return }
      primer.context.save()

      primer.context.translate(this.x, this.y)
      primer.context.rotate(10 * Math.PI / 180);

//      var backup_calls = this.calls.concat([])
      if(this.draw){ this.draw(primer.context) }
/*
      this.calls.each(function(call){
        switch(call[0]) {
          case "strokeStyle":      primer.context.strokeStyle = call[1]; break
          case "lineWidth":        primer.context.lineWidth = call[1]; break
          case "fillStyle":        primer.context.fillStyle = call[1]; break
          case "fillRect":         primer.context.fillRect(call[1], call[2], call[3], call[4]); break
          case "beginPath":        primer.context.beginPath(); break
          case "moveTo":           primer.context.moveTo(call[1], call[2]); break
          case "lineTo":           primer.context.lineTo(call[1], call[2]); break
          case "quadraticCurveTo": primer.context.quadraticCurveTo(call[1], call[2], call[3], call[4]); break
          case "arc":              primer.context.arc(call[1], call[2], call[3], call[4], call[5], call[6]); break
          case "fill":             primer.context.fill(); break
          case "stroke":           primer.context.stroke(); break
          //-----------
          case "fillText":         primer.extFillText(call[1], call[2], call[3], call[4], call[5]); break
          case "textAlign":        primer.context.ext.textAlign = call[1]
          case "font":             primer.context.ext.font = call[1]
        }
      })
      this.calls = backup_calls
*/
      this.children.each(function(child){
        child._draw(primer)
      })
      primer.context.restore()
    },

    /* canvas extensions */
    extFillText: function(text, x, y, width, className) {
      var styles = ''
      styles += 'left: ' + (this.getGlobalX() + x) + 'px;'
      styles += 'top: ' + (this.getGlobalY() + y) + 'px;'
      styles += 'width: ' + width + 'px;'
      styles += 'text-align: ' + this.context.ext.textAlign + ';'
      styles += 'color: ' + this.context.fillStyle + ';'
      styles += 'font: ' + this.context.ext.font + ';'
      this.text_div.append('<p class="primer_text ' + className + '" style="' + styles + '">' + text + '</p>')
    },

    /* onMouseMove */
    onMouseMove: function(primer, e) {
      if(!this.visible) { return }
      primer.context.save()
      primer.context.translate(this.x, this.y)
      var backup_calls = this.calls.concat([])
      if(this.draw){ this.draw(this) }
      var _this = this
      this.calls.each(function(call){
        switch(call[0]){
          case "fillRect":         _this._hitDetect_fillRect(primer, e, call[1], call[2], call[3], call[4]); break
          case "beginPath":        primer.context.beginPath(); break
          case "moveTo":           primer.context.moveTo(call[1], call[2]); break
          case "lineTo":           primer.context.lineTo(call[1], call[2]); break
          case "quadraticCurveTo": primer.context.quadraticCurveTo(call[1], call[2], call[3], call[4]); break
          case "arc":              primer.context.arc(call[1], call[2], call[3], call[4], call[5], call[6]); break
          case "fill":             _this._hitDetect_fill(primer, e); break
        }
      })
      this.calls = backup_calls

      if (!jQuery.browser.safari) {
        e.localX -= this.x
        e.localY -= this.y
      }
      this.children.each(function(child){
        child.onMouseMove(primer, e)
      })
      if (!jQuery.browser.safari) {
        e.localX += this.x
        e.localY += this.y
      }

      primer.context.restore()
    },

    _hitDetect_detect: function(primer, e) {
      if (!jQuery.browser.safari) {
        testX = e.localX - this.x
        testY = e.localY - this.y
      } else {
        testX = e.localX
        testY = e.localY
      }
      if(primer.context.isPointInPath(testX, testY)) {
        if(!this.mouseWithin) {
          primer.actions.push([this.mouseoverVal, e])
        }
        this.mouseWithin = true
      } else {
        if(this.mouseWithin) {
          primer.actions.push([this.mouseoutVal, e])
        }
        this.mouseWithin = false
      }
    },

    _hitDetect_fillRect: function(primer, e, x, y, w, h) {
      primer.context.beginPath()
      primer.context.moveTo(x  , y  )
      primer.context.lineTo(x+w, y  )
      primer.context.lineTo(x+w, y+h)
      primer.context.lineTo(x  , y+h)
      primer.context.lineTo(x  , y  )
      this._hitDetect_detect(primer, e)
    },

    _hitDetect_fill: function(primer, e) {
      this._hitDetect_detect(primer, e)
    }
  }) // class Primer.Layer

  return Primer
}

var Primer = definePrimer(jQuery)
