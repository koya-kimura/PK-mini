attribute vec4 aPosition;
attribute vec2 aTexCoord;

varying vec2 vTexCoord;

// プログラムの処理
void main(){
    vTexCoord=aTexCoord;
    vTexCoord.y=vTexCoord.y*-1.+1.;

    vec4 position=aPosition*2.-1.;

    gl_Position=position;
}