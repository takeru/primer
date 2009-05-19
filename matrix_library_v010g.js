// http://www.usamimi.info/~geko/arch_acade/elf021_matrix/matrix_library_v010g.js
/* -------------------------------------------------------------------------- */
/*
 |       matrix_library_v010g.js
 |       Var.0.1.0 -g
 */
/* -------------------------------------------------------------------------- */
/*
 * 2007/05/13 Object,add,sub,mul実装
 * 2007/09/01 [Ver.0.1]完成
 *
*/


/*
 * Ver.0.1.0 -g はMatrixオブジェクトの値をグローバルに参照できるタイプです。
*/


/*********************************************/
/*                Matrix                     */
/*********************************************/
/*
 *aryは2次配列を入力。2次配列の1次目が行であり、2次目が列となる。
 *col,rowは指定しなくても可能。配列の行と列を設定できる。
 *入力パターンは次の3種類が可能である。
 * new Matrix( ary );       //入力された2次配列から行列objectを生成
 * new Matrix( [],col,row );//入力されたサイズの単位行列を生成
 * new Matrix( [],col );    //入力されたサイズの単位正方行列を生成
 * new Matrix();            //何の指定もない場合、強制的に2次の正方単位行列を生成
 * 但し、入力された2次配列が不均一であった場合、単位行列をベースとした値で補完される。
*/
Matrix = function( ary,_col,_row )
{
	this.col;
	this.row;
	this.isSqu;
	this.val = new Array();
	
	var _isE;
	if( !ary||!ary.length )
	{
		this.col = 2;
		this.row = 2;
		_isE = true;
	}else {
		_isE = false;
		this.col = ary.length;
		this.row = ary[0].length;
	}
	if( _col )
	{
		this.col = _col;
		this.row = _col;
	}
	if( _row )this.row = _row;
	
	this.isSqu = (this.col==this.row);
	var i,j;
	for( i=0; i<this.col; i++ )
	{
		this.val[i] = new Array();
		for( j=0; j<this.row; j++ )
			if( !_isE )this.val[i][j] = ary[i][j];
			else if( i==j )this.val[i][j] = 1;
				else this.val[i][j] = 0;
	}
	delete i;
	delete j;
	delete _col;
	delete _row;
	delete ary;
	delete _isE
}


/*********************************************/
/*                Scal                       */
/*********************************************/
/*
 *プロトタイプ関数として使用。与えられた行列式をスカラー倍する。
*/
Matrix.prototype.Scal = function( p )
{
	if( p=="" || typeof p != "number" )p = 0;
	var i,j;
	for( i=0; i<this.col; i++ )
		for( j=0; j<this.row; j++ )
			this.val[i][j] *= p;
}


/*********************************************/
/*                Add                        */
/*********************************************/
/*
 *引数に2つの行列式を指定し、加算する。col,rowの値が異なる場合、計算不可。
*/
Matrix.Add = function( M1,M2 )
{
	if( !(M1.col==M2.col&&M1.row==M2.row) )return undefined;
	
	var col = M1.col;
	var row = M1.row;
	var M3 = new Matrix( [],col,row );
	var i,j;
	for( i=0; i<col; i++ )
		for( j=0; j<row; j++ )
			M3.val[i][j] = M1.val[i][j] + M2.val[i][j];
	return M3;
}


/*********************************************/
/*                Sub                        */
/*********************************************/
/*
 *引数に2つの行列式を指定し、減算する。col,rowの値が異なる場合、計算不可でundefinedを出力。
*/
Matrix.Sub = function( M1,M2 )
{
	if( !(M1.col==M2.col&&M1.row==M2.row) )return undefined;
	
	var M3 = new Matrix( [],M1.col,M1.row );
	var i,j;
	for( i=0; i<M1.col; i++ )
		for( j=0; j<M1.row; j++ )
			M3.val[i][j] = M1.val[i][j] - M2.val[i][j];
	return M3;
}


/*********************************************/
/*                Mul                        */
/*********************************************/
/*
 *引数に2つの行列式を指定し、乗算する。M1の列,M2の行が等しい時のみ可能。
*/
Matrix.Mul = function( M1,M2 )
{
	if( M1.row!=M2.col )return undefined;
	
	var M3 = new Matrix( [],M1.col,M2.row );
	var i,j,k,tmp;
	for( i=0; i<M1.col; i++ )
		for( j=0; j<M2.row; j++ )
		{
			tmp = 0;
			for( k=0; k<M2.col; k++ )tmp += M1.val[i][k] * M2.val[k][j];
			M3.val[i][j] = tmp;
		}
	return M3;
}


/*********************************************/
/*                Squ                        */
/*********************************************/
/*
 *行列を2乗する。正方行列のみ有効で、それ以外ではundefinedを返す。
*/
Matrix.prototype.Squ = function()
{
	if( !this.isSqu )return undefined;
	
	var MX = new Matrix( [],this.col,this.row );
	var i,j,k,tmp;
	for( i=0; i<this.col; i++ )
		for( j=0; j<this.row; j++ )
		{
			tmp = 0;
			for( k=0; k<this.col; k++ )tmp += this.val[i][k] * this.val[k][j];
			MX.val[i][j] = tmp;
		}
	return MX;
}


/*********************************************/
/*                Determinant                */
/*********************************************/
/*
 *行列式を計算する。行列が正方行列ではない場合、undefinedを返す。
 *Determinantプロトタイプ関数は与えられた行列の行列式を返す。
 *Determinantプロトタイプ関数内部で実行されるPermutation関数は順列を求める。
 *また、Permutation関数では一度計算した次数の計算結果はキャッシュ化される。
*/
Matrix.prototype.Determinant = function()
{
	if( !this.isSqu )return undefined;
	var PerList = Matrix.Permutation( this.col );
	var dete = 0;
	var i,j,tmp,n_list
	for( i=0; i<PerList.length; i++ )
	{
		n_list = PerList[i];
		tmp = n_list[0];
		for( j=0; j<n_list[1].length; j++ )tmp *= this.val[j][n_list[1][j]];
		dete += tmp;
	}
	return dete;
}

/* Permutationを求める */
Matrix.Permutation = function( input )
{
	if( Matrix.Permutation.isCatch[input] )return Matrix.Permutation.Catch[input];
	var ary = new Array();
	for( var i=0; i<input; i++ )ary[i] = new String(i);
	var list = Matrix.Permutation.Ext( "",ary,input );
	var PerL = new Array();//形式 [符号,Number,Number,Number,Number,...]
	var tmp,j;
	for( i=0; i<list.length; i++ )
	{
		tmp = new Array();
		for( j=0; j<list[i].length; j++ )tmp[j] = list[i].charAt(j);
		var flag = Matrix.Functype( tmp.Copy() );
		PerL[i] = [flag,tmp];
	}
	Matrix.Permutation.Catch[input] = PerL;
	Matrix.Permutation.isCatch[input] = true;
	return PerL;
}

Matrix.Permutation.Ext = function( aryout,aryin,max )
{
	if( aryout.length==max )return aryout;
	else{
		var aryco = new Array();
		var aryR = new Array();
		for(var i=0; i<aryin.length; i++)
			aryco[i] = Matrix.Permutation.Ext( aryout+aryin[i], aryin.PointDel(i), max );
		if( max-aryout.length>1 )for(var j=0; j<aryco.length; j++)aryR = aryR.concat(aryco[j]);
		else aryR = aryco;
		return aryR;
	}
}
Matrix.Permutation.Catch = [null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null];
Matrix.Permutation.isCatch = [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0];

/* 遇関数,奇関数を判別する */
Matrix.Functype = function( ary )
{
	var cnt = 0;
	var move = true;
	var i,tmp;
	while( move )
	{
		move = false;
		for( i=0; i<ary.length-1; i++ )
		{
			tmp = [ ary[i],ary[i+1] ];
			if( tmp[0]>tmp[1] )
			{
				ary[i] = tmp[1];
				ary[i+1] = tmp[0];
				cnt++;
				move = true;
			}
		}
	}
	if( cnt%2==0 )return 1;
	else return -1;
}
/*
var r = Permutation( "",["1","2","3","4"],4 );
for(var i=0; i<r.length; i++)document.writeln(r[i]);
*/


/*********************************************/
/*                 Inverse                   */
/*********************************************/
/*
 *逆行列を計算する。行列が正方行列ではない場合、undefinedを返す。
 *Inverseプロトタイプ関数は与えられた行列の逆行列を返す。
 *Inverseプロトタイプ関数の実行には行列式を計算するDeterminantプロトタイプ関数が必要。
 *逆行列が存在しない場合には、計算不可能なundefinedとは別に0を返す。
*/
Matrix.prototype.Inverse = function()
{
	if( !this.isSqu )return undefined;
	var _A = this.Determinant();
	if( _A==0 )return 0;
	
	var len = this.col;
	var i,j,k,l,k_v,l_v,tmp,flag;
	var flag_def = 1;
	var output = new Matrix([],len);
	for(i=0; i<len; i++)
	{
		flag = flag_def;
		for(j=0; j<len; j++)
		{
			tmp = new Matrix([],len-1);
			k_v = 0;
			for(k=0; k<len; k++)
			{
				if( k==i )continue;
				l_v = 0;
				for(l=0; l<len; l++)
				{
					if( l==j )continue;
					tmp.val[k_v][l_v] = this.val[k][l];
					l_v++;
				}
				k_v++;
			}
			output.val[j][i] = flag * tmp.Determinant();
			flag *= -1;
		}
		flag_def *= -1;
	}
	output.Scal( 1/_A )
	return output;
}


/*********************************************/
/*                Print                      */
/*********************************************/
/*
 *行列式を文字列として整形する。引数にtrueをつけるとHTMLモード(\nが<br>\nになる)。
*/
Matrix.prototype.Print = function( isHTML )
{
	var br = "\n";
	switch (isHTML)
	{
		case 1 : br = "<br>\n";break;
		case 2 : br = "<br />\n";break;
		default:break;
	}
	var i,j;
	var str = new String();
	for( i=0; i<this.col; i++ )
	{
		str += "["
		for( j=0; j<this.row; j++ )
		{
			str += this.val[i][j];
			if( j+1<this.row )str += ",";
		}
		str += "]" + br;
	}
	return str;
}


/*********************************************/
/*                prototype                  */
/*********************************************/
/*
 *必要なデフォルトオブジェクトのprototype関数を定義
*/
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