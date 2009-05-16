var log = console.log

function definePrimer($) {

  var Primer = Class.create({
    initialize : function(opts){
      this.container          = opts.container
      this.useGlobalMouseMove = opts.useGlobalMouseMove
      this.debug              = opts.debug
      this.context            = null
      this.actions            = []
      this.width              = $(this.container).width()
      this.height             = $(this.container).height()

      $("html head").append("<style>.primer_text {position:absolute; margin:0; padding:0; line-height:normal;}</style>")

      var container = $(this.container).eq(0)

      // <canvas>, this.context
      var canvas_el = document.createElement('canvas')
      canvas_el.width    = this.width
      canvas_el.height   = this.height
      canvas_el.style.position = 'absolute'
      if(this.debug){
        canvas_el.style.border   = '5px blue solid'
      }
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
      this.extendContext()

      // this.context.text_layer
      var text_layer_el = document.createElement('div')
      text_layer_el.id             = "primer_text_layer"
      text_layer_el.style.position = 'absolute'
      text_layer_el.style.overflow = "hidden"
      if(this.debug){
        text_layer_el.style.border   = '2px red solid'
      }
      text_layer_el.style.width    = this.width+"px"
      text_layer_el.style.height   = this.height+"px"
      container.append(text_layer_el)
      this.context.text_layer = $("#primer_text_layer", container)

      this.root = new Primer.Layer()
      var _this = this
      this.context.text_layer.bind("mousemove", function(e){
        var bounds = $(e.currentTarget).offset()
        e.localX = e.pageX - bounds.left
        e.localY = e.pageY - bounds.top
        _this.onMouseMove(e)
      })
      this.context.text_layer.bind("click", function(e){
        var bounds = $(e.currentTarget).offset()
        e.localX = e.pageX - bounds.left
        e.localY = e.pageY - bounds.top
        _this.onClick(e)
      })
    },

    redraw: function() {
      this.context.clearRect(0, 0, this.width, this.height)
      this.context.resetTextLayer()
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

    /* canvas extensions */
    extendContext: function() {
      Object.extend(this.context, {
        initExt: function(){
          this.stateStack = [{x:0, y:0}]
        },

        fillText: function(text, x, y, width, className) {
          var ctx = this
          var cs = this.currentState()
          var styles = ''
          styles += 'position:absolute;'
          styles += 'left: '       + (cs.x+x) + 'px;'
          styles += 'top: '        + (cs.y+y) + 'px;'
          styles += 'width: '      + width + 'px;'
          styles += 'text-align: ' + ctx.ext.textAlign + ';'
          styles += 'color: '      + ctx.fillStyle + ';'
          styles += 'font: '       + ctx.ext.font + ';'
          ctx.text_layer.append('<p class="primer_text ' + className + '" style="' + styles + '">' + text + '</p>')
        },

        resetTextLayer: function(){
          var ctx = this
          ctx.ext = {
            textAlign: "left",
            font: "10px sans-serif"
          }
          $(".primer_text", ctx.text_layer).remove()
        },

        orig_translate: this.context.translate,
        translate: function(x, y){
          var cs = this.currentState()
          cs.x += x
          cs.y += y
//log("translate", x ,y)
          this.orig_translate(x, y)
        },

        orig_save: this.context.save,
        save: function(){
          this.orig_save()
//log(this.currentState())
          var newState = Object.clone(this.currentState())
          this.stateStack.unshift(newState)
//log("save:"+this.stateStack.length)
        },

        orig_restore: this.context.restore,
        restore: function(){
          if(2<=this.stateStack.length){
            this.stateStack.shift()
          }
//log("restore:"+this.stateStack.length)
          this.orig_restore()
        },

        currentState: function(){
          return this.stateStack[0]
        },
      })
      this.context.initExt()
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
//    primer.context.rotate(10 * Math.PI / 180);

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
