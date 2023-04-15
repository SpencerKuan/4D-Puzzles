precision lowp float;

uniform vec2 u_res;
uniform float u_time;

uniform mat4 u_rot;
uniform vec2 u_mouse;
uniform vec4 u_player;

const int maxBoxes = 50;



//	Simplex 4D Noise 
//	by Ian McEwan, Ashima Arts

vec4 permute(vec4 x){return mod(((x*34.0)+1.0)*x, 289.0);}
float permute(float x){return floor(mod(((x*34.0)+1.0)*x, 289.0));}
vec4 taylorInvSqrt(vec4 r){return 1.79284291400159 - 0.85373472095314 * r;}
float taylorInvSqrt(float r){return 1.79284291400159 - 0.85373472095314 * r;}

vec4 grad4(float j, vec4 ip){
    const vec4 ones = vec4(1.0, 1.0, 1.0, -1.0);
    vec4 p,s;

    p.xyz = floor( fract (vec3(j) * ip.xyz) * 7.0) * ip.z - 1.0;
    p.w = 1.5 - dot(abs(p.xyz), ones.xyz);
    s = vec4(lessThan(p, vec4(0.0)));
    p.xyz = p.xyz + (s.xyz*2.0 - 1.0) * s.www; 

    return p;
}

float snoise(vec4 v){
    const vec2  C = vec2( 0.138196601125010504,  // (5 - sqrt(5))/20  G4
                        0.309016994374947451); // (sqrt(5) - 1)/4   F4
    // First corner
    vec4 i  = floor(v + dot(v, C.yyyy) );
    vec4 x0 = v -   i + dot(i, C.xxxx);

    // Other corners

    // Rank sorting originally contributed by Bill Licea-Kane, AMD (formerly ATI)
    vec4 i0;

    vec3 isX = step( x0.yzw, x0.xxx );
    vec3 isYZ = step( x0.zww, x0.yyz );
    //  i0.x = dot( isX, vec3( 1.0 ) );
    i0.x = isX.x + isX.y + isX.z;
    i0.yzw = 1.0 - isX;

    //  i0.y += dot( isYZ.xy, vec2( 1.0 ) );
    i0.y += isYZ.x + isYZ.y;
    i0.zw += 1.0 - isYZ.xy;

    i0.z += isYZ.z;
    i0.w += 1.0 - isYZ.z;

    // i0 now contains the unique values 0,1,2,3 in each channel
    vec4 i3 = clamp( i0, 0.0, 1.0 );
    vec4 i2 = clamp( i0-1.0, 0.0, 1.0 );
    vec4 i1 = clamp( i0-2.0, 0.0, 1.0 );

    //  x0 = x0 - 0.0 + 0.0 * C 
    vec4 x1 = x0 - i1 + 1.0 * C.xxxx;
    vec4 x2 = x0 - i2 + 2.0 * C.xxxx;
    vec4 x3 = x0 - i3 + 3.0 * C.xxxx;
    vec4 x4 = x0 - 1.0 + 4.0 * C.xxxx;

    // Permutations
    i = mod(i, 289.0); 
    float j0 = permute( permute( permute( permute(i.w) + i.z) + i.y) + i.x);
    vec4 j1 = permute( permute( permute( permute (
                i.w + vec4(i1.w, i2.w, i3.w, 1.0 ))
            + i.z + vec4(i1.z, i2.z, i3.z, 1.0 ))
            + i.y + vec4(i1.y, i2.y, i3.y, 1.0 ))
            + i.x + vec4(i1.x, i2.x, i3.x, 1.0 ));
    // Gradients
    // ( 7*7*6 points uniformly over a cube, mapped onto a 4-octahedron.)
    // 7*7*6 = 294, which is close to the ring size 17*17 = 289.

    vec4 ip = vec4(1.0/294.0, 1.0/49.0, 1.0/7.0, 0.0) ;

    vec4 p0 = grad4(j0,   ip);
    vec4 p1 = grad4(j1.x, ip);
    vec4 p2 = grad4(j1.y, ip);
    vec4 p3 = grad4(j1.z, ip);
    vec4 p4 = grad4(j1.w, ip);

    // Normalise gradients
    vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2, p2), dot(p3,p3)));
    p0 *= norm.x;
    p1 *= norm.y;
    p2 *= norm.z;
    p3 *= norm.w;
    p4 *= taylorInvSqrt(dot(p4,p4));

    // Mix contributions from the five corners
    vec3 m0 = max(0.6 - vec3(dot(x0,x0), dot(x1,x1), dot(x2,x2)), 0.0);
    vec2 m1 = max(0.6 - vec2(dot(x3,x3), dot(x4,x4)            ), 0.0);
    m0 = m0 * m0;
    m1 = m1 * m1;
    return 49.0 * ( dot(m0*m0, vec3( dot( p0, x0 ), dot( p1, x1 ), dot( p2, x2 )))
            + dot(m1*m1, vec2( dot( p3, x3 ), dot( p4, x4 ) ) ) ) ;
            
}






struct Box {
    vec4 pos;
    vec4 size;
    vec4 color;
};

struct Mat {
    float d;
    vec4 col;
};

uniform Box u_boxes[maxBoxes];
uniform int u_numBoxes;


// based on the 3D equivalent by IQ 
float sdBox( vec4 p, vec4 b ){
    vec4 q = abs(p) - b;
    return length(max(q,0.0)) + min(max(q.w, max(q.x,max(q.y,q.z))),0.0);
}


// the 4D SDF for the scene
float map(vec4 p){
    float d = 1000.0;

    for (int i = 0; i < maxBoxes; i ++) {
        if (i >= u_numBoxes) break;

        Box box = u_boxes[i];

        vec4 bPos = box.pos;
        vec4 bSize = box.size * 0.5;

        d = min(d, sdBox(p - bPos, bSize));
    }
    
    return d;
}

// in: a point in 4D space
// out: the normal of the surface using a central difference method on the 4D SDF
vec4 normal(vec4 p){
    vec2 e = vec2(0.001, 0);
    float v = map(p);
    
    return normalize(vec4(
        map(p + e.xyyy) - v,
        map(p + e.yxyy) - v,
        map(p + e.yyxy) - v,
        map(p + e.yyyx) - v
    ));
}

// soft shadow calculation
float shadowCast (vec4 pos, vec4 lightDir){
    const float maxD = 50.0;
    const int maxIts = 100;
    const float eps = 0.001;

    float total = 0.0;
    float res = 1.0;
    
    for(int i = 0; i < maxIts; i ++){
        float d = map(pos);
        
        if (d < eps) return 0.0;
        
        total = total + d;
        pos += lightDir * d;

        res = min(res, d / total * 128.0);
        
        if (total > maxD) return res;
    }
    
    return res;
}


// https://www.csh.rit.edu/~gman/PersonalWebpage/ao.html
float ao(vec4 pos, vec4 norm)
{
    const float steps = 10.0;

    float res = 0.0;
    for(float i = 1.0; i < 10.0; i += 1.0){
        vec4 sample = pos + norm * (i / steps);
        res += pow(2.0, -i) * (i / steps - map(sample));
    }

    return 1.0 - res;
}


// finds the intersection between a ray starting at a 
// start position and a point on the 4D scene
// out: distance to the intersection 
float intersect (vec4 start, vec4 dir){
    // minimum distance for a intersection
    float eps = 0.001;
    
    // max constraints 
    const float maxD = 100.0;
    const int maxIts = 500;
    
    // total distance traveled so far
    float total = 0.0;
    
    // current position
    vec4 pos = start;
    
    // current distance to a object
    float d = 0.0;
    
    for(int i = 0; i < maxIts; i ++){
        d = map(pos);

        if (d < eps) return total;

        total = total + d;
        pos += dir * d;
        
       
        if (total > maxD) return -1.0;
    }
    
    return -1.0;
}


// returns the color contributions of a light on a surface
vec3 shade (vec3 col, vec4 p, vec4 n, vec4 dir){
    // float occlusion = shadowCast(p + dir * 0.01, dir);
    float occlusion = 1.0;

    return col * max(dot(n, dir), 0.0) * occlusion;
}


vec3 background (vec4 dir){
    vec3 col = vec3(0);

    float n1 = snoise(dir) * 0.5 + 0.5;
    float n2 = snoise(dir + n1) * 0.5 + 0.5;
    float n3 = snoise(dir * 5.0 + n1 * 5.0) * 0.5 + 0.5 + n1 * n2;

    col += vec3(0.4, 0.3, 0.9) * n3;

    n1 = snoise(dir + 2012.312) * 0.5 + 0.5;
    n2 = snoise(dir + n1 * 2.0) * 0.5 + 0.5;
    n3 = snoise(dir * 1.0 + n1 * 5.0) * 0.5 + 0.5 + n1 * n2;

    col += vec3(0.7, 0.2, 0.0) * n3;

    vec3 col1 = vec3(58, 12, 163) / 255.0;
    vec3 col2 = vec3(0) / 255.0;
    vec3 col3 = vec3(67, 97, 238) / 255.0;

    col = col1 * n1 + col2 * n2 + col3 * n3 * 0.5 + 0.5;

    vec4 directionals = normalize(abs(dir));

    col = col * 2. * (
        directionals.x * vec3(1, 0, 0) + 
        directionals.y * vec3(0, 1, 0) + 
        directionals.z * vec3(0, 0, 1) + 
        directionals.w * vec3(0, 1, 1)
    );

    col = ((dir.xzw) * 0.5 + 0.5) * (dir.y  * 0.5 + 0.5);
    // if ( dir.y < 0.0 ) {
    //     vec3 ground = dir.xzw / dir.y;
    //     float pattern = snoise(vec4(ground * 0.5, 0)) * 0.5 + 0.5;

    //     col = mix(vec3(1), vec3(2), pattern * 0.5);
    // }



    return col * 0.2;
}


// renders a point on a 3D viewport
vec3 render3D (vec3 screen){
    // pixelate the output
    // screen = floor(screen * 50.0) / 50.0;

    // camera rotation for the scene
    mat4 rot = mat4(1.0);
    
    // animation variable for the rotation
    // float animate = (u_animate) * 0.2;
    
    rot = u_rot;

    // 4D camera position, spun2 around the axis
    vec4 cam = u_player;
    
    // 4D camera direction for that particular 3D viewport
    vec4 dir = normalize(vec4(screen, 2)) * rot;
    
    // the total distance to a intersection with the 4D scene
    float d = intersect(cam, dir);
   
    // black background for no collisions
    if (d == -1.0) return background(dir);
    
    // position and normal of the intersection in the 4D scene
    vec4 p = cam + dir * d;
    vec4 n = normal(p);
    
    // resulting output color

    vec3 albedo = vec3(1.0);
    vec3 direct = vec3(0);
    

    // shading for each of the 8 spacial directions in 4D space
    direct += albedo * shade(vec3(255, 128, 0) / 255., p, n, vec4(+1, 0, 0, 0)); // +x
    direct += albedo * shade(vec3(220, 100, 100) / 255., p, n, vec4(0, +1, 0, 0)); // +y
    direct += albedo * shade(vec3(141, 200, 100) / 255., p, n, vec4(0, 0, +1, 0)); // +z
    direct += albedo * shade(vec3(66, 0, 10) / 255., p, n, vec4(0, 0, 0, +1)); // +w
    direct += albedo * shade(vec3(8, 200, 100) / 255., p, n, vec4(-1, 0, 0, 0)); // -x
    direct += albedo * shade(vec3(89, 100, 200) / 255., p, n, vec4(0, -1, 0, 0)); // -y
    direct += albedo * shade(vec3(157, 50, 50) / 255., p, n, vec4(0, 0, -1, 0)); // -z
    direct += albedo * shade(vec3(50, 80, 200) / 255., p, n, vec4(0, 0, 0, -1)); // -w

    float ambientStrength = ao(p, n) * 0.5;
    vec3 ambientLight = ambientStrength * albedo;

    float shadow = shadowCast(p + n * 0.01, vec4(0, 1, 0, 0));
    
    vec3 col = (direct * shadow + ambientStrength * albedo) * 0.5 * exp(-d * 0.01);
    return col;
}

void main()
{

    const float split = 1.0;

    // normalized pixel coordinates (from -1 to 1)
    vec2 uvo = mod(gl_FragCoord.xy / u_res.xy, 1.0 / split) * split;

    // aspect ratio
    float aspect = u_res.x / u_res.y;
    vec2 uv = (uvo * 2.0 - 1.0) * u_res.xy / min(u_res.x, u_res.y);

    // grid position
    vec2 grid = floor(gl_FragCoord.xy / (u_res.xy / split));
    float gridIndex = (split - 1.0 - grid.x) + grid.y * split;
    float gridTotal = split * split;

    // // mouse position (from 0 to 1)
    vec2 mouse = u_mouse * 2.0 - 1.0;

    // z position of the 3D viewport (another dimension of the screen)
    float z = gridIndex / gridTotal * 2.0 - 1.0;
    if (split == 1.0) z = 0.0;
    
    // 3D screen position for the particular pixel
    vec3 screenCoord = vec3(uv, z * 0.5).xyz;
    
    // rendered color
    vec3 col = render3D(screenCoord);
    
    // gamma correction
    float gamma = 2.2;
    col = pow(col, vec3(1.0 / gamma));
    
    // output
    gl_FragColor = vec4(col, 1.0);
}