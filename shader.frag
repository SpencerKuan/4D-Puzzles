precision lowp float;

uniform vec2 u_res;
uniform float u_time;

uniform mat4 u_rot;
uniform vec2 u_mouse;
uniform vec4 u_player;

const int maxBoxes = 50;


struct Box {
    vec4 pos;
    vec4 size;
    vec4 color;
};


uniform Box u_boxes[maxBoxes];
uniform int u_numBoxes;


// based on the 3D equivalent by IQ 
float sdBox( vec4 p, vec4 b ){
    vec4 q = abs(p) - b * 0.5;
    return length(max(q,0.0)) + min(max(q.w, max(q.x,max(q.y,q.z))),0.0);
}

float sdObject (vec4 p, vec4 b){
    return sdBox(p, b);
}

// the 4D SDF for the scene
float map(vec4 p){
    float d = 1000.0;

    for (int i = 0; i < maxBoxes; i ++) {
        if (i >= u_numBoxes) break;

        Box box = u_boxes[i];
        d = min(d, sdObject(p - box.pos, box.size));
    }
    
    return d - 0.1;
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
    const float eps = 0.01;

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
    const int maxIts = 200;
    
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
    vec3 col = ((dir.xzw) * 0.5 + 0.5) * (dir.y  * 0.5 + 0.5);
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
   
    // background for no collisions
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