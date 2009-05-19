// http://www.usamimi.info/~geko/arch_acade/elf021_matrix/ver010g.html

var Matrix = Class.create({
  initialize: function(ary, _col, _row){
    this._class = Matrix
    this._class_name = "Matrix"

	this.val = new Array()
	var _isE = false
	if(!ary || !ary.length){
	  this.col = 2
	  this.row = 2
	  _isE = true
	}else {
	  _isE = false
	  this.col = ary.length
	  this.row = ary[0].length
	}
	if(_col){
	  this.col = _col
	  this.row = _col
	}
	if(_row){
      this.row = _row
    }
	this.isSqu = (this.col==this.row)
	for(var i=0; i<this.col; i++){
	  this.val[i] = new Array()
	  for(var j=0; j<this.row; j++){
		if( !_isE ){
		  this.val[i][j] = ary[i][j]
		}else{
		  this.val[i][j] = (i==j) ? 1 : 0
		}
	  }
	}
  },
  mul: function(m2){
    var m1 = this
    if(m1.row != m2.col){
      return undefined
    }
    var m3 = new this._class([], m1.col, m2.row)
    var i,j,k,tmp;
    for(i=0; i<m1.col; i++){
      for(j=0; j<m2.row; j++){
        tmp = 0;
        for(k=0; k<m2.col; k++){
          tmp += m1.val[i][k] * m2.val[k][j]
        }
        m3.val[i][j] = tmp
      }
    }
    return m3
  },
  log: function(label){
    console.group("Matrix["+label+"]")
    for(i=0; i<this.col; i++){
      var l = ""
      for(j=0; j<this.row; j++){
        var v = this.val[i][j]
        v = v.toFixed(3)
        l += (v+",")
      }
      console.log(l)
    }
    console.groupEnd()
  }
})

var Mat2D = Class.create(Matrix, {
  initialize: function($super, ary, _col, _row){
    if(ary){
      $super(ary, _col, _row)
    }else{
      $super([],3,3)
    }
    this._class = Mat2D
    this._class_name = "Mat2D"
  },
  zoom: function(zx,zy){
    return new Mat2D([
      [zx, 0, 0],
      [ 0,zy, 0],
      [ 0, 0, 1],
    ]).mul(this)
  },
  rotate: function(r){
    return new Mat2D([
      [ Math.cos(r), -Math.sin(r), 0],
      [ Math.sin(r),  Math.cos(r), 0],
      [           0,            0, 1],
    ]).mul(this)
  },
  transrate: function(dx,dy){
    return new Mat2D([
      [ 1, 0, dx],
      [ 0, 1, dy],
      [ 0, 0,  1],
    ]).mul(this)
  },
  x: function(m2){
    return m2.mul(this)
  }
})
Mat2D.zoom      = function(zx,zy){ return new Mat2D().zoom(zx,zy) }
Mat2D.rotate    = function(r    ){ return new Mat2D().rotate(r) }
Mat2D.transrate = function(dx,dy){ return new Mat2D().transrate(dx,dy) }

Array.prototype.transform = function(mat){
  var x = this[0]
  var y = this[1]
  var result = mat.mul(new Matrix([[x],[y],[1]]))
  return [result.val[0][0], result.val[1][0]]
}
Array.prototype.x = Array.prototype.transform
Array.prototype.zoom = function(zx,zy){
  return this.transform( Mat2D.zoom(zx,zy) )
}
Array.prototype.rotate = function(r){
  return this.transform( Mat2D.rotate(r) )
}
Array.prototype.transrate = function(zx,zy){
  return this.transform( Mat2D.transrate(zx,zy) )
}

Mat2D.test = function(){
/*
m1 = new Matrix([
  [1,0,1],
  [0,1,1],
  [0,0,1],
])
m1.log()
m2 = new Matrix([
  [100],
  [100],
  [  1],
])
m2.log()
m1.mul(m2).log()

//log( [100,100].transform(new Mat2D().zoom(2,3)) )              // [200, 300]
//log( [100,100].transform(new Mat2D().rotate(90/180*Math.PI)) ) // [-100, 100]
//log( [100,100].transform(new Mat2D().rotate(45/180*Math.PI)) ) // [0, 141.4....]
//log( [100,100].transform(new Mat2D().transrate(20,30)) )       // [120, 130]

log("A",  [100,100].transform(new Mat2D().zoom(2,3)) )
log("B",  [100,100].transform(new Mat2D().zoom(2,3).rotate(90/180*Math.PI)) )
log("C1", [100,100].transform(new Mat2D().zoom(2,3).rotate(90/180*Math.PI).transrate(20,30)) )
log("C2", [100,100].transform(Mat2D.zoom(2,3).rotate(90/180*Math.PI).transrate(20,30)) )
log("C3", [100,100].zoom(2,3).rotate(90/180*Math.PI).transrate(20,30) )
*/

  var x  = 100
  var y  = 200
  var zx = 3
  var zy = 4
  var dx = 50
  var dy = 60
  var r  = 90/180*Math.PI

  var mat1    = Mat2D.zoom(zx,zy)
  mat1.log("mat1")
  var mat2    = Mat2D.rotate(r)
  mat2.log("mat2")
  var mat3    = Mat2D.transrate(dx,dy)
  mat3.log("mat3")

  var mat123a = mat1.x(mat2).x(mat3)
  mat123a.log("mat123a")

  var mat123b = Mat2D.zoom(zx,zy).rotate(r).transrate(dx,dy)
  mat123b.log("mat123b")

  var mat12 = mat1.x(mat2)
  mat12.log("mat12")

  var mat23 = mat2.x(mat3)
  mat23.log("mat23")

  log( [x,y].transform(mat123a) )
  log( [x,y].transform(mat123b) )
  log( [x,y].zoom(zx,zy).rotate(r).transrate(dx,dy) )
  log( [x,y].transform(mat12).transform(mat3) )
  log( [x,y].transform(mat12).transrate(dx,dy) )
  log( [x,y].transform(mat1).transform(mat23) )
  log( [x,y].zoom(zx,zy).transform(mat23) )

  log( [x,y].x(mat1).x(mat23) )
  log( [x,y].x(mat1).x(mat2.x(mat3)) )
  log( [x,y].x(mat1).x(mat2).x(mat3) )
  log( [x,y].x(mat1.x(mat2)).x(mat3) )
  log( [x,y].x(mat1.x(mat2).x(mat3)) )
}
