var log = console.log

function definePrimer($) {

  var Primer = Class.create({
    initialize : function(opts){
      this.container          = opts.container
      this.useGlobalMouseMove = opts.useGlobalMouseMove
      this.debug              = opts.debug
      this.context            = null
      this.width              = $(this.container).width()
      this.height             = $(this.container).height()
      this.mousestate         = {}

      $("html head").append("<style>.primer_text {position:absolute; margin:0; padding:0; line-height:normal;}</style>")

      var container = $(this.container).eq(0)

      // <canvas>, this.context
      var canvas_el = document.createElement('canvas')
      canvas_el.width    = this.width
      canvas_el.height   = this.height
      canvas_el.style.position = 'absolute'
      if(this.debug){
        canvas_el.style.border   = '0.1px blue solid'
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
        text_layer_el.style.border   = '0.1px red solid'
      }
      text_layer_el.style.width    = this.width+"px"
      text_layer_el.style.height   = this.height+"px"
      container.append(text_layer_el)
      this.context.text_layer = $("#primer_text_layer", container)

      this.root = new Primer.Layer()

      var mouse_event_callback = this._mouse_event_callback.bind(this)
      this.context.text_layer.bind("mousemove", {next: this._next_mousemove.bind(this)}, mouse_event_callback)
      this.context.text_layer.bind("mousedown", {next: this._next_mousedown.bind(this)}, mouse_event_callback)
      this.context.text_layer.bind("mouseup",   {next: this._next_mouseup.bind(this)},   mouse_event_callback)
      this.context.text_layer.bind("click",     {next: this._next_click.bind(this)},     mouse_event_callback)
    },

    _mouse_event_callback: function(e){
      var next = e.data.next
      var bounds = $(e.currentTarget).offset()
      e.localX = e.pageX - bounds.left
      e.localY = e.pageY - bounds.top
      if (this.root.x!=0 || this.root.y!=0) {
        log("WARN x/y is not 0", this.root.x, this.root.y)
      }
      var hits = this.root._hit(this, e)
      this._fire_event(e.type, hits)
      if(next){
        next(e,hits)
      }
      return true
    },

    _fire_event: function(event_name, hits, pars){
      var results = []
      hits.each(function(hit){
        var layer = hit.layer
        if(layer[event_name]){
          var result = layer[event_name](hit, pars)
          if(result){
            results.push({hit:hit, result:result})
          }
        }
      })
      return results
    },

    _next_mousedown: function(e,hits){
//      log("_next_mousedown", this)
      this.mousestate.down = {x:e.localX, y:e.localY, hits:hits}
    },
    _next_mouseup: function(e,hits){
//      log("_next_mouseup")
      this.mousestate.down = undefined

      if(this.mousestate.drag){
        this.mousestate.drag.end = {x:e.localX, y:e.localY}
//log("dragEnd", this.mousestate.drag)
        var dropAcceptResults = this._fire_event("dropAccept", hits, this.mousestate.drag)
        var dropTarget = null
        for(var i=0; i<dropAcceptResults.length; i++){
          var r = dropAcceptResults[i]
          if(r.result){
            dropTarget = r.hit
          }
        }
//log("dropTarget", dropTarget)
        this.mousestate.drag.dropTarget = dropTarget
        if(dropTarget){
          var droppedResults = this._fire_event("dropped", [dropTarget], this.mousestate.drag)
        }
        if(this.mousestate.drag.dragTarget){
          var dragEndResults = this._fire_event("dragEnd", [this.mousestate.drag.dragTarget], this.mousestate.drag)
        }
      }
      this.mousestate.drag = undefined
    },
    _next_mousemove: function(e,hits){
      //log("mousemove")
      if(this.mousestate.drag){
        // draging
        var drag = this.mousestate.drag
        drag.current = {x:e.localX, y:e.localY}
//log("dragging", drag)
        if(drag.dragTarget){
          var draggingResults = this._fire_event("dragging", [drag.dragTarget])
        }
        var dropAcceptResults = this._fire_event("dropAccept", hits, this.mousestate.drag)
      }else{
        var down = this.mousestate.down
        if(down){
          var d = Primer.distance(down.x, down.y, e.localX, e.localY)
          if(5<d){
            var results = this._fire_event("dragAccept", down.hits)
            var dragTarget = null
            for(var i=0; i<results.length; i++){
              var r = results[i]
              if(r.result){
                dragTarget = r.hit
              }
            }
            this.mousestate.drag = {begin:{x:down.x,y:down.y}, dragTarget:dragTarget}
//log("dragBegin", this.mousestate.drag, results)
            if(dragTarget){
              var dragBeginResults = this._fire_event("dragBegin", [dragTarget])
            }
          }
        }
      }
    },
    _next_click: function(e,hits){
//      log("_next_click")
    },

    redraw: function() {
//log("redraw---------------------")
      this.context.clearRect(0, 0, this.width, this.height)
      this.context.resetTextLayer()
      this.root._draw(this)
    },

    outOfBounds: function() {
      // Do nothing by default
    },

    /* canvas extensions */
    extendContext: function() {
      Object.extend(this.context, {
        initExt: function(){
          this.stateStack = [{mat2d:new Mat2D()}]
          this.hitDetect = false;
        },

        fillText: function(text, x, y, width, className, _hitKey) {
          if(!this.hitDetect){
            var ctx = this
            var cs = this.currentState()
            var xy = [x,y].transform(cs.mat2d)
            var styles = ''
            styles += 'position:absolute;'
            styles += 'left: '       + (xy[0]) + 'px;'
            styles += 'top: '        + (xy[1]) + 'px;'
            styles += 'width: '      + width + 'px;'
            styles += 'text-align: ' + ctx.ext.textAlign + ';'
            styles += 'color: '      + ctx.fillStyle + ';'
            styles += 'font: '       + ctx.ext.font + ';'
            ctx.text_layer.append('<p class="primer_text ' + className + '" style="' + styles + '">' + text + '</p>')
          }else{
            var w = width
            var h = 10 //TODO
            this.beginPath()
            this.moveTo(x  , y  )
            this.lineTo(x+w, y  )
            this.lineTo(x+w, y+h)
            this.lineTo(x  , y+h)
            this.lineTo(x  , y  )
            this.testHit(_hitKey)
          }
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
          cs.mat2d = cs.mat2d.translate(x,y) //Mat2D.translate(x, y).x(cs.mat2d)
          this.orig_translate(x, y)
        },

        orig_rotate: this.context.rotate,
        rotate: function(r){
          var cs = this.currentState()
          cs.mat2d = cs.mat2d.rotate(r) //Mat2D.rotate(r).x(cs.mat2d)
          this.orig_rotate(r)
        },
// TODO save states as 'transform matrix' http://www.html5.jp/canvas/ref/method/transform.html

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

        orig_fillRect: this.context.fillRect,
        fillRect: function(x, y, w, h, _hitKey){
          if(!this.hitDetect){
            this.orig_fillRect(x, y, w, h)
          }else{
            this.beginPath()
            this.moveTo(x  , y  )
            this.lineTo(x+w, y  )
            this.lineTo(x+w, y+h)
            this.lineTo(x  , y+h)
            this.lineTo(x  , y  )
            this.testHit(_hitKey)
          }
        },

        orig_fill: this.context.fill,
        fill: function(_hitKey){
          if(!this.hitDetect){
            this.orig_fill()
          }else{
            this.testHit(_hitKey)
          }
        },

        orig_stroke: this.context.stroke,
        stroke: function(){
          if(!this.hitDetect){
            this.orig_stroke()
          }
        },

        orig_strokeRect: this.context.strokeRect,
        strokeRect: function(x, y, w, h){
          if(!this.hitDetect){
            this.orig_strokeRect(x, y, w, h)
          }
        },

        testHit: function(hitKey) {
          var cs = this.currentState()
          var testXY = [this.hitDetect.event.localX, this.hitDetect.event.localY].transform(cs.mat2d.inv())
          this.hitDetect.testX = testXY[0]
          this.hitDetect.testY = testXY[1]
          if(this.isPointInPath(this.hitDetect.testX, this.hitDetect.testY)) {
            this.hitDetect.hit = true
            this.hitDetect.hitKeys.push(hitKey)
          }
        },
/*
          case "fillRect":         _this._hitDetect_fillRect(primer, e, call[1], call[2], call[3], call[4]); break
          case "fill":             _this._hitDetect_fill(primer, e); break
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
*/
      })
      this.context.initExt()
    },
  }) // class Primer

  Primer.distance = function(x0, y0, x1, y1){
    return Math.sqrt( (x0-x1)*(x0-x1) + (y0-y1)*(y0-y1) )
  }

  Primer.Layer = Class.create({
    initialize : function(init){
      this.name = "none"
      this.x = 0
      this.y = 0
      this.rotation = 0 // 10*Math.PI/180
      this.visible = true
      this.draw = null
      if(init){
        Object.extend(this, init)
      }

      this.parent = null
      this.children = []
      //this.mouseoverVal = function() { }
      //this.mouseoutVal = function() { }
      //this.mouseWithin = false
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
    createChild: function(init){
      var child = new Primer.Layer(init)
      this.addChild(child)
      return child
    },
    addChild: function(child) {
      if(child.parent){
        child.parent.removeChild(child)
      }
      child.parent = this
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
      child.parent = null
    },

    /* events */
    mouseover: function(fn) {
      this.mouseoverVal = fn
    },
    mouseout: function(fn) {
      this.mouseoutVal = fn
    },

/*
    fillText: function(a, b, c, d, e) {
      this.calls.push(["fillText", a, b, c, d, e])
    },
    setTextAlign: function(a) {
      this.calls.push(["textAlign", a])
    },
    setFont: function(a) {
      this.calls.push(["font", a])
    },
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
*/

    /* draw */
    _draw: function(primer) {
      if(!this.visible){ return }
      primer.context.hitDetect = null
      primer.context.save()
      primer.context.translate(this.x, this.y)
      primer.context.rotate(this.rotation)
      if(this.draw){
        this.draw(primer.context)
      }
      this.children.each(function(child){
        child._draw(primer)
      })
      primer.context.restore()
    },

    /* hit */
    _hit: function(primer, e) {
      if(!this.visible) { return [] }
//log(this.name, e.localX, e.localY)
      var hits = []
      primer.context.hitDetect = {layer:this, hit:false, event:e,
                                  testX:undefined, testY:undefined, hitKeys:[]}
      primer.context.save()
      primer.context.translate(this.x, this.y)
      primer.context.rotate(this.rotation)
      if(this.draw){
        this.draw(primer.context)
        if(primer.context.hitDetect.hit){
          hits.push(primer.context.hitDetect)
        }
      }
      this.children.each(function(child){
        hits = hits.concat(child._hit(primer, e))
      })
      primer.context.restore()
      return hits
    },
  }) // class Primer.Layer

  return Primer
}

var Primer = definePrimer(jQuery)
