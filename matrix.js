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
  inv: function(){
    if(!this.isSqu){ return undefined; }
    var _A = this.det()
    if( _A==0 ){ return 0; }
    var len = this.col;
    var i,j,k,l,k_v,l_v,tmp,flag;
    var flag_def = 1;
    var output = new Matrix([],len);
    for(i=0; i<len; i++){
      flag = flag_def;
      for(j=0; j<len; j++){
        tmp = new Matrix([],len-1);
        k_v = 0;
        for(k=0; k<len; k++){
          if( k==i ){ continue; }
          l_v = 0;
          for(l=0; l<len; l++){
            if( l==j ){ continue; }
            tmp.val[k_v][l_v] = this.val[k][l];
            l_v++;
          }
          k_v++;
        }
        output.val[j][i] = flag * tmp.det();
        flag *= -1;
      }
      flag_def *= -1;
    }
    output.scal( 1/_A )
    return output;
  },
  det: function(){
    if(!this.isSqu){ return undefined; }
    var PerList = Matrix.per(this.col);
    var dete = 0;
    var i,j,tmp,n_list
    for(i=0; i<PerList.length; i++){
      n_list = PerList[i];
      tmp = n_list[0];
      for( j=0; j<n_list[1].length; j++ ){ tmp *= this.val[j][n_list[1][j]]; }
      dete += tmp;
    }
    return dete;
  },
  scal: function(p){
    if( p=="" || typeof p != "number" ){ p = 0; }
    var i,j;
    for( i=0; i<this.col; i++ ){
      for( j=0; j<this.row; j++ ){
        this.val[i][j] *= p;
      }
    }
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

Matrix.per = function(input){
  if( Matrix.per.isCatch[input] ){
    return Matrix.per.Catch[input];
  }
  var ary = new Array();
  for( var i=0; i<input; i++ )ary[i] = new String(i);
  var list = Matrix.per.ext( "",ary,input );
  var PerL = new Array();//形式 [符号,Number,Number,Number,Number,...]
  var tmp,j;
  for( i=0; i<list.length; i++ ){
    tmp = new Array();
    for( j=0; j<list[i].length; j++ ){ tmp[j] = list[i].charAt(j); }
    var flag = Matrix.functype( tmp.Copy() );
    PerL[i] = [flag,tmp];
  }
  Matrix.per.Catch[input] = PerL;
  Matrix.per.isCatch[input] = true;
  return PerL;
}

Matrix.per.ext = function( aryout,aryin,max )
{
  if( aryout.length==max ){
    return aryout;
  }else{
    var aryco = new Array();
    var aryR = new Array();
    for(var i=0; i<aryin.length; i++){
      aryco[i] = Matrix.per.ext( aryout+aryin[i], aryin.PointDel(i), max );
    }
    if( max-aryout.length>1 ){
      for(var j=0; j<aryco.length; j++)aryR = aryR.concat(aryco[j]);
    }else{
      aryR = aryco;
    }
    return aryR;
  }
}
Matrix.per.Catch = [null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null];
Matrix.per.isCatch = [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0];

Matrix.functype = function( ary )
{
  var cnt = 0;
  var move = true;
  var i,tmp;
  while( move ){
    move = false;
    for( i=0; i<ary.length-1; i++ ){
      tmp = [ ary[i],ary[i+1] ];
      if( tmp[0]>tmp[1] ){
        ary[i] = tmp[1];
        ary[i+1] = tmp[0];
        cnt++;
        move = true;
      }
    }
  }
  if( cnt%2==0 ){
    return 1;
  }else{
    return -1;
  }
}

Array.prototype.PointDel = function( point )
{
  var first = this.slice(0,point);
  var last = this.slice(point+1,this.length);
  return first.concat(last);
}
Array.prototype.Copy = function()
{
  var new_array = new Array( this.length );
  for( var i=0 ; i<this.length ; i++ )new_array[i] = this[i];
  return new_array;
}


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
/*    return new Mat2D([
      [zx, 0, 0],
      [ 0,zy, 0],
      [ 0, 0, 1],
    ]).mul(this)*/
    return this.mul(new Mat2D([
      [zx, 0, 0],
      [ 0,zy, 0],
      [ 0, 0, 1],
    ]))
  },
  rotate: function(r){
    return this.mul(new Mat2D([
      [ Math.cos(r), -Math.sin(r), 0],
      [ Math.sin(r),  Math.cos(r), 0],
      [           0,            0, 1],
    ])) //.mul(this)
  },
  translate: function(dx,dy){
    return this.mul(new Mat2D([
      [ 1, 0, dx],
      [ 0, 1, dy],
      [ 0, 0,  1],
    ])) //.mul(this)
  },
  x: function(m2){
    //return m2.mul(this)
    return this.mul(m2)
  }
})
Mat2D.zoom      = function(zx,zy){ return new Mat2D().zoom(zx,zy) }
Mat2D.rotate    = function(r    ){ return new Mat2D().rotate(r) }
Mat2D.translate = function(dx,dy){ return new Mat2D().translate(dx,dy) }

Array.prototype.transform = function(mat){
  var x = this[0]
  var y = this[1]
  var result = mat.mul(new Matrix([[x],[y],[1]]))
  return [result.val[0][0], result.val[1][0]]
}
Array.prototype.x = Array.prototype.transform
Array.prototype.zoom0 = function(zx,zy){
  return this.transform( Mat2D.zoom(zx,zy) )
}
Array.prototype.rotate0 = function(r){
  return this.transform( Mat2D.rotate(r) )
}
Array.prototype.translate0 = function(zx,zy){
  return this.transform( Mat2D.translate(zx,zy) )
}

Mat2D.test = function(){
/*
  var x  = 50
  var y  =  0

  var dx = 100
  var dy =   0
  var r  = 45/180*Math.PI
  var zx = 1.0
  var zy = 1.0

  var mat1    = Mat2D.translate(dx,dy)
  mat1.log("mat1")
  var mat2    = Mat2D.zoom(zx,zy)
  mat2.log("mat2")
  var mat3    = Mat2D.rotate(r)
  mat3.log("mat3")
  var mat123a = mat1.x(mat2).x(mat3)
  mat123a.log("mat123a")
  var mat123b = Mat2D.translate(dx,dy).zoom(zx,zy).rotate(r)
  mat123b.log("mat123b")

  var mat12 = mat1.x(mat2)
  mat12.log("mat12")

  var mat23 = mat2.x(mat3)
  mat23.log("mat23")

  log("a", [x,y].transform(mat123a))
  log("b", [x,y].transform(mat123b))
  log("c", [x,y].rotate0(r).zoom0(zx,zy).translate0(dx,dy))
  log("d", [x,y].transform(mat3).transform(mat12))
  log("e", [x,y].x(mat12.rotate(r)))
  log("f", [x,y].transform(mat1.x(mat23)))
  log("g", [x,y].x(mat3).x(mat2).x(mat1))
  log("h", [x,y].rotate0(r).zoom0(zx,zy).translate0(dx,dy))
  log("i", [x,y].x(mat1.x(mat2).x(mat3)))
  log("j", [x,y].x(  mat1  .x(mat2)  .x(mat3) ) )
  log("k", [x,y].x(  mat1  .x((mat2).x(mat3)) ) )
  log("l", [x,y].x( (mat1.x(mat2))  .x(mat3)  ) )

  log("-------------------")
  var inv = mat123a.inv()
  inv.log("inv")
  var xy = [x,y].transform(mat123a);
  log(xy.transform(inv))
  log("-------------------")

  var mats = [
    Mat2D.translate(100,0),
    Mat2D.rotate(90/180*Math.PI),
    Mat2D.translate(100,0).rotate(90/180*Math.PI),
    Mat2D.rotate(90/180*Math.PI).translate(100,0),
    Mat2D.translate(100,0).rotate(30/180*Math.PI),
    Mat2D.rotate(30/180*Math.PI).translate(100,0)
  ]
  mats.each(function(mat){
    log("----")
    mat.log("mat")
    var inv = mat.inv()
    var xy0 = [20,30]
    var xy1 = xy0.transform(mat)
    var xy2 = xy1.transform(inv)
    log(xy0, xy1, xy2)
  })
*/

  var a = Mat2D.translate(20,30)
  var b = Mat2D.translate(10,10).rotate(30)
  var c = Mat2D.translate(20,10).rotate(30)

  //var xy = [5,5].transform( a.x(b).x(c) )
  //log( xy )
  //log( [5,5].transform( a.x(b).x(c).x(c.inv()) ) )
  //log( [5,5].transform( a.x(b)                 ) )
  //log( xy.transform(c.inv()) )
  var xy = [5,5].x(a).x(b).x(c)
  log( xy )
  log( [5,5].x(a).x(b).x(c).x(c.inv()) )
  log( [5,5].x(a).x(b)                 )
  log( xy.x( c.inv() )                 )
}
