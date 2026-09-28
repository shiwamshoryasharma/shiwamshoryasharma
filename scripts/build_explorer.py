"""Author the original Wayfarer character in Blender, export GLB and a fallback render.

Run: blender --background --python scripts/build_explorer.py
No external models, textures, add-ons or personal photographs are used.
"""
import bpy
import math
from pathlib import Path
from mathutils import Vector

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'assets'
SOURCE = ROOT / 'art'
OUT.mkdir(exist_ok=True)
SOURCE.mkdir(exist_ok=True)
bpy.ops.object.select_all(action='SELECT')
bpy.ops.object.delete(use_global=False)

def material(name, color, metallic=0, roughness=.65, emission=0):
    m = bpy.data.materials.new(name)
    m.diffuse_color = (*color, 1)
    m.use_nodes = True
    p = m.node_tree.nodes.get('Principled BSDF')
    p.inputs['Base Color'].default_value = (*color, 1)
    p.inputs['Metallic'].default_value = metallic
    p.inputs['Roughness'].default_value = roughness
    if emission:
        p.inputs['Emission Color'].default_value = (*color, 1)
        p.inputs['Emission Strength'].default_value = emission
    return m

navy = material('Midnight fabric', (.027, .044, .073))
slate = material('Blue grey panels', (.105, .16, .21))
dark = material('Ink', (.009, .017, .024), .05)
orange = material('Saffron nylon', (.95, .29, .035))
lightorange = material('Warm seam', (1, .55, .12))
skin = material('Warm porcelain skin', (.72, .43, .30))
skinlight = material('Nose', (.80, .49, .34))
silver = material('Moon silver hair', (.69, .79, .79), .1, .45)
hairshade = material('Hair underlayers', (.31, .45, .5))
white = material('Ceramic shell', (.86, .89, .84), .15, .35)
cyan = material('Ion cyan', (.035, .72, .78), .15, .3, 1.4)
gold = material('Brass hardware', (.65, .37, .12), .7, .28)

def empty(name, loc=(0,0,0), parent=None):
    o = bpy.data.objects.new(name, None)
    bpy.context.collection.objects.link(o)
    o.location = loc
    o.parent = parent
    return o

root = empty('Wayfarer')
head = empty('Head', (0,0,3.7), root)
robot = empty('Companion', (1.15,-.05,3.25))

def finish(o, name, mat, parent, smooth=True):
    o.name = name
    o.data.materials.append(mat)
    o.parent = parent
    if smooth:
        for p in o.data.polygons: p.use_smooth=True
    return o

def sphere(name, loc, scale, mat, parent=root, segments=24, rings=16):
    bpy.ops.mesh.primitive_uv_sphere_add(segments=segments, ring_count=rings, location=loc)
    o=bpy.context.object
    o.scale=scale
    return finish(o,name,mat,parent)

def box(name, loc, scale, mat, bevel=.07, parent=root):
    bpy.ops.mesh.primitive_cube_add(size=1, location=loc)
    o=bpy.context.object
    o.scale=scale
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    if bevel:
        mod=o.modifiers.new('Soft sewn edges','BEVEL');mod.width=bevel;mod.segments=3
        bpy.ops.object.modifier_apply(modifier=mod.name)
        for p in o.data.polygons:p.use_smooth=True
        mod=o.modifiers.new('Weighted normals','WEIGHTED_NORMAL');mod.keep_sharp=True;bpy.ops.object.modifier_apply(modifier=mod.name)
    return finish(o,name,mat,parent)

def tube(name, points, radius, mat, parent=root):
    curve=bpy.data.curves.new(name,'CURVE');curve.dimensions='3D';curve.resolution_u=12
    curve.bevel_depth=radius;curve.bevel_resolution=2
    spline=curve.splines.new('BEZIER');spline.bezier_points.add(len(points)-1)
    for b,p in zip(spline.bezier_points,points):
        b.co=p;b.handle_left_type='AUTO';b.handle_right_type='AUTO'
    o=bpy.data.objects.new(name,curve);bpy.context.collection.objects.link(o)
    bpy.context.view_layer.objects.active=o;o.select_set(True)
    bpy.ops.object.convert(target='MESH');o.select_set(False)
    return finish(o,name,mat,parent)

def strand(name, points, widths, mat, parent=head):
    vertices=[];faces=[]
    for (x,y,z),w in zip(points,widths):
        for j in range(8):
            a=j*math.tau/8;vertices.append((x+math.cos(a)*w,y+math.sin(a)*w*.44,z))
    for i in range(len(points)-1):
        for j in range(8):
            a=i*8+j;b=i*8+(j+1)%8;faces.append((a,b,b+8,a+8))
    faces.extend([tuple(reversed(range(8))),tuple(range(len(vertices)-8,len(vertices)))])
    mesh=bpy.data.meshes.new(name);mesh.from_pydata(vertices,[],faces);mesh.update()
    o=bpy.data.objects.new(name,mesh);bpy.context.collection.objects.link(o)
    return finish(o,name,mat,parent)

# Grounded, slightly asymmetrical explorer stance.
for s in [-1,1]:
    x=s*.235
    sphere('Trouser leg', (x,.03,1.05),(.22,.23,.73),navy)
    box('Knee guard',(x,-.205,1.05),(.30,.09,.35),slate,.065)
    tube('Knee stitching',[(x-.1,-.259,1.16),(x,-.27,1.2),(x+.1,-.259,1.16)],.012,lightorange)
    box('Boot',(x,-.095,.32),(.45,.67,.55),navy,.13)
    box('Boot sole',(x,-.115,.085),(.48,.70,.14),white,.055)
    box('Boot toe',(x,-.36,.25),(.38,.20,.20),slate,.06)
    for z in [.38,.49]:box('Boot clasp',(x,-.365,z),(.3,.045,.045),orange,.015)
    box('Sole stripe',(x,-.467,.1),(.24,.018,.04),cyan,.008)

sphere('Inner tunic',(0,0,2.25),(.44,.27,.67),slate)
box('Jacket body',(0,.015,2.31),(.99,.59,1.1),navy,.20)
# Split front lapels, long coat tails and bright interior.
for s in [-1,1]:
    tail=box('Coat tail',(s*.30,.13,1.56),(.49,.49,.78),navy,.09)
    tail.rotation_euler.y=s*-.10
    box('Coat lining',(s*.30,-.125,1.53),(.37,.04,.64),orange,.04)
    box('Jacket front',(s*.27,-.31,2.30),(.43,.075,.9),slate,.055)
    tube('Jacket piping',[(s*.47,-.31,2.62),(s*.47,-.33,2.05),(s*.46,-.14,1.24)],.015,lightorange)
box('Zipper',(0,-.369,2.3),(.025,.018,.82),gold,.004)
box('Utility belt',(0,-.01,1.89),(1.02,.63,.16),dark,.05)
box('Belt buckle',(.03,-.35,1.89),(.18,.045,.13),gold,.022)
box('Field pouch',(-.33,-.41,1.78),(.27,.19,.31),orange,.04)
box('Pouch flap',(-.33,-.52,1.88),(.28,.035,.10),lightorange,.02)
box('Chest badge',(.24,-.367,2.52),(.20,.023,.12),orange,.015)
for x in [.18,.23,.28]:box('Badge bars',(x,-.383,2.52),(.018,.01,.06),white,.002)

# Backpack with a rolled blanket and antenna.
box('Backpack',(0,.47,2.30),(.73,.43,.92),orange,.13)
box('Backpack outer',(0,.73,2.22),(.56,.18,.52),slate,.07)
bed=sphere('Bedroll',(0,.52,2.92),(.48,.18,.18),white)
for s in [-1,1]:
    tube('Harness',[(s*.29,.52,2.94),(s*.36,-.42,2.84),(s*.34,-.42,2.07)],.045,navy)
tube('Radio aerial',[(.31,.62,2.67),(.37,.65,3.2),(.40,.65,3.38)],.018,dark)
sphere('Radio light',(.40,.65,3.39),(.04,.04,.04),cyan)

# Arms are separately pivoted to support a wave in the browser.
for s in [-1,1]:
    arm=empty('ArmL' if s<0 else 'ArmR',(s*.56,0,2.68),root)
    sphere('Shoulder',(0,0,-.08),(.245,.27,.28),orange,arm)
    sleeve=sphere('Sleeve',(s*.10,-.015,-.36),(.205,.215,.37),navy,arm)
    sleeve.rotation_euler.y=s*-.16
    box('Sleeve armor',(s*.15,-.20,-.32),(.25,.08,.24),slate,.04,arm)
    sphere('Cuff',(s*.19,-.03,-.69),(.185,.19,.14),white,arm)
    sphere('Glove',(s*.20,-.04,-.85),(.155,.155,.22),dark,arm)
    sphere('Thumb',(s*.07,-.12,-.82),(.085,.10,.14),dark,arm)
    box('Glove light',(s*.20,-.183,-.83),(.12,.02,.07),cyan,.015,arm)

# Sculpted hood shell: open front, with an irregular textile rim.
vertices=[];faces=[]
for i in range(13):
    phi=1.30+(math.pi-1.30)*i/12
    for j in range(33):
        theta=math.tau*j/32
        # Front direction is -Y. Shell runs from open front to pointed back.
        vertices.append((.72*math.sin(phi)*math.cos(theta),-.10-.64*math.cos(phi),.1+.82*math.sin(phi)*math.sin(theta)))
for i in range(12):
    for j in range(32):
        a=i*33+j;faces.append((a,a+1,a+34,a+33))
mesh=bpy.data.meshes.new('Hood shell');mesh.from_pydata(vertices,[],faces);mesh.update()
hood=bpy.data.objects.new('Hood',mesh);bpy.context.collection.objects.link(hood);finish(hood,'Hood',navy,head)
# A proper face opening ring sits around the hair and jaw.
rim=[]
for i in range(49):
    a=math.tau*i/48;rim.append((.665*math.cos(a),-.27,.09+.78*math.sin(a)))
tube('Hood binding',rim,.068,orange,head)
tube('Hood seam',[(x,y-.037,z) for x,y,z in rim],.012,lightorange,head)

# Jaw-tapered face, rather than a sphere with eyes pasted on.
vertices=[];faces=[]
levels=[(-.61,.06,.10),(-.54,.27,.26),(-.36,.43,.35),(-.10,.52,.42),(.18,.53,.44),(.43,.43,.36),(.56,.24,.23),(.60,.01,.01)]
for z,rx,ry in levels:
    for j in range(32):
        a=math.tau*j/32;vertices.append((rx*math.cos(a),-.045+ry*math.sin(a),z))
for i in range(len(levels)-1):
    for j in range(32):
        a=i*32+j;b=i*32+(j+1)%32;faces.append((a,b,b+32,a+32))
mesh=bpy.data.meshes.new('Face');mesh.from_pydata(vertices,[],faces);mesh.update()
o=bpy.data.objects.new('Face',mesh);bpy.context.collection.objects.link(o);finish(o,'Face',skin,head)
for s in [-1,1]:
    sphere('Ear',(s*.51,-.01,-.13),(.10,.11,.16),skin,head)
    eye=empty('EyeL' if s<0 else 'EyeR',(s*.23,-.432,.005),head)
    sphere('Eye ink',(0,0,0),(.174,.038,.114),dark,eye)
    sphere('Eye white',(0,-.019,-.004),(.148,.031,.088),white,eye)
    sphere('Iris',(s*-.012,-.047,-.003),(.061,.019,.085),cyan,eye)
    sphere('Pupil',(s*-.012,-.062,.003),(.030,.008,.064),dark,eye)
    sphere('Eye shine',(-.022,-.071,.040),(.023,.009,.024),white,eye,16,8)
    tube('Upper lash',[(-.168,-.014,.015),(-.08,-.043,.094),(.045,-.042,.10),(.168,-.012,.047)],.014,dark,eye)
    tube('Eyebrow',[(s*.10,-.425,.17),(s*.22,-.449,.20),(s*.35,-.381,.17)],.024,hairshade,head)
sphere('Nose',(0,-.462,-.17),(.05,.072,.065),skinlight,head)
tube('Mouth',[(-.095,-.402,-.34),(0,-.423,-.355),(.095,-.402,-.336)],.012,dark,head)

# Swept, tapered anime locks; shaded undercuts add silhouette depth.
sphere('Hair crown',(0,.015,.35),(.56,.44,.40),hairshade,head)
for i in range(7):
    x=-.48+i*.145
    strand('Silver fringe',[(x+.16,-.17,.63),(x+.07,-.38,.47),(x,-.46,.25),(x-.08,-.475,.08+(i%3)*.08)],[.10,.135,.105,.005],silver)
for s in [-1,1]:
    strand('Temple hair',[(s*.43,-.02,.41),(s*.51,-.24,.12),(s*.49,-.29,-.27),(s*.45,-.22,-.42)],[.12,.115,.08,.004],silver)
    strand('Side lock',[(s*.48,.02,.35),(s*.57,-.02,.03),(s*.60,-.03,-.17)],[.11,.09,.002],hairshade)

# Large folded scarf anchors the hood to the shoulders.
sphere('Scarf',(0,-.015,3.02),(.55,.37,.23),orange)
tube('Scarf fold',[(-.43,-.19,3.06),(0,-.375,2.94),(.42,-.20,3.04)],.035,lightorange)
scarf=box('Scarf tail',(.27,-.36,2.65),(.20,.08,.63),orange,.04);scarf.rotation_euler.y=-.18
box('Scarf end',(.32,-.407,2.38),(.20,.025,.075),lightorange,.015)

# Floating reconnaissance robot with a ceramic shell and a luminous face.
box('Robot body',(0,0,0),(.66,.48,.48),white,.19,robot)
box('Robot face',(0,-.251,.015),(.50,.075,.29),dark,.105,robot)
for s in [-1,1]:
    sphere('Robot eye',(s*.12,-.294,.037),(.041,.016,.064),cyan,robot)
    sphere('Side thruster',(s*.37,.025,-.01),(.09,.13,.14),slate,robot)
    sphere('Thruster light',(s*.395,-.054,-.025),(.048,.052,.07),cyan,robot)
tube('Robot smile',[(-.058,-.295,-.066),(0,-.30,-.086),(.058,-.295,-.066)],.008,cyan,robot)
tube('Robot antenna',[(.12,0,.21),(.16,0,.36)],.016,slate,robot)
sphere('Antenna beacon',(.16,0,.38),(.05,.05,.05),orange,robot)
sphere('Hover core',(0,0,-.25),(.12,.12,.07),cyan,robot)

# Apply transforms and merge static details within each pivot by material.
bpy.ops.object.select_all(action='DESELECT')
meshes=[o for o in bpy.context.scene.objects if o.type=='MESH']
groups={}
for o in meshes: groups.setdefault((o.parent,o.data.materials[0].name),[]).append(o)
for (parent,mat),objects in groups.items():
    if len(objects)<2:continue
    bpy.ops.object.select_all(action='DESELECT')
    for o in objects:o.select_set(True)
    bpy.context.view_layer.objects.active=objects[0]
    bpy.ops.object.join();bpy.context.object.name=f'{parent.name}_{mat}'

bpy.ops.object.select_all(action='SELECT')
bpy.ops.export_scene.gltf(filepath=str(OUT/'wayfarer.glb'),export_format='GLB',use_selection=True,export_animations=False,export_cameras=False,export_lights=False,export_yup=True)

# A studio camera provides a dependable non-WebGL fallback.
scene=bpy.context.scene
scene.render.engine='CYCLES';scene.cycles.samples=32
scene.cycles.use_denoising=True
scene.render.resolution_x=1000;scene.render.resolution_y=1100;scene.render.resolution_percentage=100
scene.render.film_transparent=True
scene.world.color=(.18,.18,.18)
def area(name,loc,energy,color,size):
    bpy.ops.object.light_add(type='AREA',location=loc)
    o=bpy.context.object;o.name=name;o.data.energy=energy;o.data.color=color;o.data.shape='DISK';o.data.size=size
    o.rotation_euler=(Vector((0,0,2.3))-o.location).to_track_quat('-Z','Y').to_euler()
area('Key',(-3,-4,7),650,(.76,.89,1),5)
area('Warm rim',(4,2,5),850,(1,.43,.16),3)
area('Face fill',(1,-4,3),180,(.6,1,1),3)
bpy.ops.object.camera_add(location=(5,-12,6.0))
camera=bpy.context.object;camera.rotation_euler=(Vector((.25,0,2.22))-camera.location).to_track_quat('-Z','Y').to_euler()
camera.data.type='ORTHO';camera.data.ortho_scale=5.4;scene.camera=camera
scene.view_settings.view_transform='AgX'
scene.render.image_settings.file_format='PNG';scene.render.filepath=str(OUT/'wayfarer-poster.png')
bpy.ops.wm.save_as_mainfile(filepath=str(SOURCE/'wayfarer.blend'))
bpy.ops.render.render(write_still=True)
print('WAYFARER_EXPORT_COMPLETE')
