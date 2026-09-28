"""Original anime-tech floating district. Blender 5.1 -> GLB + poster.

No downloaded environment models, personal images, or runtime textures required.
"""
import bpy
import math
import random
from pathlib import Path
from mathutils import Vector

ROOT=Path(__file__).resolve().parents[1]
random.seed(42)
bpy.ops.object.select_all(action='SELECT');bpy.ops.object.delete(use_global=False)

def mat(name,color,metal=0,rough=.6,glow=0):
    m=bpy.data.materials.new(name);m.diffuse_color=(*color,1);m.use_nodes=True
    p=m.node_tree.nodes.get('Principled BSDF');p.inputs['Base Color'].default_value=(*color,1)
    p.inputs['Metallic'].default_value=metal;p.inputs['Roughness'].default_value=rough
    if glow:p.inputs['Emission Color'].default_value=(*color,1);p.inputs['Emission Strength'].default_value=glow
    return m

ivory=mat('Pearl ceramic',(.79,.82,.74));white=mat('Warm white',(.95,.91,.79));teal=mat('Deep teal',(.045,.16,.19));dark=mat('Ink blue',(.025,.045,.09));coral=mat('Vermilion',(.85,.20,.11));peach=mat('Terracotta',(.70,.32,.22));gold=mat('Champagne hardware',(.70,.46,.18),.4)
mint=mat('Mint glow',(.09,.81,.69),.15,.35,1.6);blue=mat('Ion blue',(.04,.54,.95),.2,.35,1.2);pink=mat('Sakura',(.93,.39,.51));pinklight=mat('Sakura light',(1,.68,.64));green=mat('Jade foliage',(.12,.41,.31));lilac=mat('Lavender ceramic',(.42,.38,.62));wood=mat('Walnut',(.23,.11,.09));glass=mat('Sky glass',(.17,.57,.63),.25,.18);soil=mat('Planter earth',(.15,.12,.13));sand=mat('Sandstone deck',(.55,.64,.60))

def empty(name):
    o=bpy.data.objects.new(name,None);bpy.context.collection.objects.link(o);return o
root=empty('SkyDistrict')
def finish(o,name,m,parent=root):
    o.name=name;o.data.materials.append(m);o.parent=parent
    return o
def cube(name,loc,size,m,bevel=.05,parent=root):
    bpy.ops.mesh.primitive_cube_add(size=1,location=loc);o=bpy.context.object;o.scale=size;bpy.ops.object.transform_apply(location=False,rotation=False,scale=True)
    if bevel:
        mod=o.modifiers.new('Rounded edges','BEVEL');mod.width=bevel;mod.segments=3;bpy.ops.object.modifier_apply(modifier=mod.name)
        for p in o.data.polygons:p.use_smooth=True
        mod=o.modifiers.new('Weighted normals','WEIGHTED_NORMAL');mod.keep_sharp=True;bpy.ops.object.modifier_apply(modifier=mod.name)
    return finish(o,name,m,parent)
def sphere(name,loc,size,m,ico=False,parent=root):
    if ico:bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=2,radius=1,location=loc)
    else:bpy.ops.mesh.primitive_uv_sphere_add(segments=16,ring_count=10,location=loc)
    o=bpy.context.object;o.scale=size
    for p in o.data.polygons:p.use_smooth=True
    return finish(o,name,m,parent)
def cylinder(name,loc,radius,depth,m,vertices=32,parent=root):
    bpy.ops.mesh.primitive_cylinder_add(vertices=vertices,radius=radius,depth=depth,location=loc);o=bpy.context.object
    mod=o.modifiers.new('Rim bevel','BEVEL');mod.width=min(.07,depth*.2);mod.segments=2;bpy.ops.object.modifier_apply(modifier=mod.name)
    for p in o.data.polygons:p.use_smooth=True
    mod=o.modifiers.new('Normals','WEIGHTED_NORMAL');bpy.ops.object.modifier_apply(modifier=mod.name)
    return finish(o,name,m,parent)
def beam(name,a,b,r,m,parent=root):
    d=Vector(b)-Vector(a);o=cylinder(name,(Vector(a)+Vector(b))/2,r,d.length,m,12,parent);o.rotation_euler=d.to_track_quat('Z','Y').to_euler();return o
def ring(name,loc,r,thick,m,rotation=(0,0,0),parent=root):
    bpy.ops.mesh.primitive_torus_add(major_radius=r,minor_radius=thick,major_segments=48,minor_segments=8,location=loc,rotation=rotation);o=bpy.context.object
    for p in o.data.polygons:p.use_smooth=True
    return finish(o,name,m,parent)
def text(name,content,loc,size,m,rotation=(math.pi/2,0,0),parent=root):
    curve=bpy.data.curves.new(name,'FONT');curve.body=content;curve.size=size;curve.extrude=.001;curve.align_x='CENTER';curve.align_y='CENTER'
    o=bpy.data.objects.new(name,curve);bpy.context.collection.objects.link(o);o.location=loc;o.rotation_euler=rotation
    bpy.context.view_layer.objects.active=o;bpy.ops.object.select_all(action='DESELECT');o.select_set(True);bpy.ops.object.convert(target='MESH')
    return finish(o,name,m,parent)

# Main platform is layered, with exposed machinery beneath a polished plaza.
cylinder('Main hull',(0,0,-.26),5.7,.65,teal,64)
cylinder('Ceramic rim',(0,0,.03),5.79,.18,ivory,64)
cylinder('Plaza surface',(0,0,.16),5.60,.13,sand,64)
ring('Hull light',(0,0,-.16),5.71,.035,mint)
for i in range(16):
    a=i*math.tau/16;x,y=5.72*math.cos(a),5.72*math.sin(a)
    panel=cube('Hull panel',(x,y,-.25),(.65,.14,.34),ivory,.025);panel.rotation_euler.z=a+math.pi/2
for x,y in [(-3,-2.4),(3,-2.4),(-2.3,3),(2.3,3)]:
    cylinder('Maglev socket',(x,y,-.62),.63,.3,dark)
    cylinder('Levitation core',(x,y,-.83),.39,.20,blue)
    ring('Thruster halo',(x,y,-.94),.39,.025,mint)

# A terracotta-roofed, open-front research pavilion.
cube('Lab foundation',(-1.7,1.3,.42),(4.9,3.35,.44),ivory,.18)
cube('Lab floor',(-1.7,1.3,.67),(4.65,3.1,.08),white,.08)
cube('Back wall',(-1.7,2.83,2.14),(4.8,.22,2.95),ivory,.07)
cube('Side wall',(-4.02,1.65,1.87),(.18,2.3,2.42),ivory,.07)
for x in [-3.98,.59]:
    for y in [-.15,2.78]:
        cube('Pavilion pillar',(x,y,2.14),(.19,.19,2.97),teal,.035)
        cube('Pillar inset',(x,y-.105,2.12),(.045,.025,2.4),mint,.01)
cube('Front lintel',(-1.7,-.13,3.65),(4.95,.28,.28),teal,.07)
cube('Roof lower',(-1.7,1.3,3.88),(5.35,3.76,.27),coral,.12)
cube('Roof upper',(-1.7,1.3,4.07),(4.98,3.38,.17),peach,.09)
for x in [-4.28,.88]:
    edge=cube('Swept roof edge',(x,1.3,4.02),(.20,3.9,.27),coral,.06);edge.rotation_euler.y=-.14 if x<0 else .14
for i in range(18):
    cube('Roof ribs',(-4.05+i*.275,1.3,4.17),(.045,3.40,.025),gold,.01)
cube('Lab sign',(-1.7,-.32,3.60),(2.50,.08,.42),dark,.06)
text('Lab title','S H I W A M  /  LAB 01',(-1.7,-.369,3.61),.13,white)
cube('Window',(-1.4,2.69,2.32),(2.42,.09,1.81),teal,.14)
cube('Window glass',(-1.4,2.627,2.32),(2.23,.025,1.62),glass,.08)
for x in [-2.15,-1.4,-.65]:cube('Window mullion',(x,2.59,2.32),(.035,.03,1.65),ivory,.01)
cube('Window crossbar',(-1.4,2.59,2.32),(2.25,.04,.035),ivory,.01)

# Workbench with dual monitors, keyboard, speakers, and tools.
cube('Workbench',(-1.35,1.67,1.53),(3.22,1.02,.16),white,.10)
for x in [-2.69,-.03]:
    cube('Desk leg',(x,1.67,1.08),(.12,.75,.90),teal,.025)
for x in [-2.13,-.70]:
    cube('Monitor foot',(x,1.91,1.66),(.51,.29,.07),teal,.025)
    cube('Monitor neck',(x,2.0,1.86),(.08,.1,.46),teal,.025)
    cube('Monitor',(x,1.93,2.19),(1.30,.12,.86),dark,.06)
    cube('Monitor screen',(x,1.851,2.19),(1.15,.015,.71),teal,.015)
    for i in range(7):
        w=random.uniform(.25,.85)
        cube('Code line',(x-.47+w/2,1.835,2.44-i*.085),(w,.006,.018),[mint,blue,white,coral][i%4],.004)
cube('Keyboard',(-1.4,1.35,1.65),(1.05,.34,.06),teal,.035)
for i in range(12):
    for j in range(3):cube('Keycap',(-1.85+i*.081,1.24+j*.09,1.692),(.055,.06,.018),ivory,.006)
sphere('Mouse',(-.55,1.36,1.68),(.10,.15,.05),coral)
for x in [-2.92,.18]:
    cube('Speaker',(x,1.96,1.83),(.22,.26,.42),coral,.03)
    speaker=cylinder('Speaker cone',(x,1.817,1.85),.07,.015,dark,24);speaker.rotation_euler.x=math.pi/2
cube('Chair seat',(-1.5,.58,1.19),(.76,.70,.19),lilac,.13)
cube('Chair back',(-1.5,.25,1.61),(.8,.16,.77),lilac,.12)
cylinder('Chair column',(-1.5,.58,.89),.065,.51,teal)
for i in range(5):
    a=i*math.tau/5;beam('Chair foot',(-1.5,.58,.74),(-1.5+math.cos(a)*.43,.58+math.sin(a)*.43,.73),.03,teal)

# Wall shelf: books, a tiny robot, and a cactus.
for z in [1.65,2.65]:
    cube('Shelf',(-3.38,2.56,z),(1,.53,.08),wood,.025)
    for i in range(5):cube('Book',(-3.73+i*.13,2.61,z+.22),(.10,.25,.36+random.random()*.1),[coral,ivory,lilac,gold,teal][i],.018)

# Center circular experiment station with a moving arm added in the browser.
cylinder('Reactor pedestal',(.72,-.66,.52),.94,.62,ivory,48)
cylinder('Reactor top',(.72,-.66,.85),.88,.10,teal,48)
ring('Reactor ring',(.72,-.66,.925),.72,.025,mint)
cylinder('Hologram emitter',(.72,-.66,.99),.32,.15,dark)
for i in range(12):
    a=i*math.tau/12
    cube('Emitter tick',(.72+.64*math.cos(a),-.66+.64*math.sin(a),.94),(.055,.055,.012),white,.008)

# Project stations in a front arc. Floating content is authored by the renderer.
for i,(x,y) in enumerate([(-3.8,-1.40),(-1.65,-3.42),(1.10,-3.70),(3.50,-2.35)]):
    cylinder('Exhibit base',(x,y,.43),.73,.42,ivory,32)
    cylinder('Exhibit inset',(x,y,.67),.63,.09,teal,32)
    ring('Exhibit light',(x,y,.74),.57,.025,[blue,coral,lilac,mint][i])
    cube('Station badge',(x,y-.60,.49),(.31,.045,.16),dark,.018)
    text('Station number',f'0{i+1}',(x,y-.63,.50),.10,white)

def island(name,x,y,r):
    cylinder(name+' hull',(x,y,-.22),r,.55,teal,48)
    cylinder(name+' edge',(x,y,.07),r+.06,.15,ivory,48)
    cylinder(name+' floor',(x,y,.18),r-.05,.10,sand,48)
    ring(name+' light',(x,y,-.23),r+.015,.027,mint)
    cylinder(name+' thruster',(x,y,-.64),r*.38,.32,dark,32)
    cylinder(name+' core',(x,y,-.83),r*.28,.12,blue,32)
def bridge(x1,y1,x2,y2):
    d=Vector((x2-x1,y2-y1,0));mid=((x1+x2)/2,(y1+y2)/2,.15)
    o=cube('Skybridge',mid,(d.length,1.05,.14),ivory,.06);o.rotation_euler.z=math.atan2(d.y,d.x)
    normal=Vector((-d.y,d.x,0)).normalized()
    for s in [-1,1]:
        a=Vector((x1,y1,.54))+normal*s*.48;b=Vector((x2,y2,.54))+normal*s*.48
        beam('Bridge handrail',a,b,.025,teal)
        for t in [0,.33,.66,1]:
            p=a.lerp(b,t);beam('Bridge post',(p.x,p.y,.22),p,.023,teal)
        beam('Bridge light',a+Vector((0,0,-.07)),b+Vector((0,0,-.07)),.012,mint)

island('Garden',-7,0,1.68);bridge(-5.2,0,-6.3,0)
island('Gate',6.55,1.40,1.82);bridge(4.75,1.4,5.60,1.4)

# Sakura antenna tree: natural silhouette with illuminated technological roots.
def tree(x,y,scale=1):
    cylinder('Tree planter',(x,y,.39),.56*scale,.35,ivory)
    cylinder('Earth',(x,y,.57),.48*scale,.025,soil)
    beam('Trunk',(x,y,.56),(x-.12*scale,y,2.06*scale),.10*scale,wood)
    for i in range(7):
        a=i*2.4;z=1.6*scale+(i%3)*.31*scale
        bx=x+math.cos(a)*.63*scale;by=y+math.sin(a)*.56*scale
        beam('Branch',(x-.07,y,1.4*scale),(bx,by,z),.045*scale,wood)
        sphere('Sakura canopy',(bx,by,z+.23*scale),(.58*scale,.49*scale,.43*scale),pinklight if i%2 else pink,True)
    ring('Tree root light',(x,y,.59),.50*scale,.018,mint)
tree(-7,0,.94)
tree(-3.67,3.5,.66)

# The gate leads to the preserved repository realm.
for x in [5.67,7.43]:
    cube('Gate plinth',(x,1.50,.41),(.53,.61,.40),ivory,.06)
    cube('Gate pillar',(x,1.50,1.91),(.27,.34,2.75),coral,.07)
    cube('Gate inset',(x,1.30,1.91),(.07,.024,2.4),mint,.012)
cube('Gate lintel',(6.55,1.5,3.22),(2.42,.42,.30),coral,.09)
cube('Gate crown',(6.55,1.5,3.44),(2.88,.59,.17),teal,.075)
cube('Gate nameplate',(6.55,1.24,3.08),(.85,.06,.32),dark,.035)
text('Gate title','REALM',(6.55,1.195,3.09),.16,white)
for i in range(3):cube('Gate step',(6.55,.45-i*.24,.21+i*.045),(1.65,.32,.12),ivory,.04)

# Railings, planters, landing lights, utility details.
for i in range(9):
    a=.05+i*.18
    x,y=5.30*math.cos(a),5.30*math.sin(a)
    beam('Safety rail post',(x,y,.25),(x,y,.77),.032,teal)
    if i<8:
        b=a+.18;beam('Safety rail',(x,y,.77),(5.3*math.cos(b),5.3*math.sin(b),.77),.027,teal)
for x,y in [(-4.35,-2.8),(2.5,3.7),(4.2,-.5)]:
    cube('Utility planter',(x,y,.50),(.60,.62,.50),ivory,.12)
    for i in range(5):
        a=i*math.tau/5;o=sphere('Leaf',(x+math.cos(a)*.17,y+math.sin(a)*.17,.97),(.105,.20,.40),green);o.rotation_euler=(math.sin(a)*.45,math.cos(a)*.45,a)
for x,y in [(-4.6,.5),(4.55,-1.5),(2.4,4.45),(-5.05,-.85)]:
    cylinder('Bollard foot',(x,y,.30),.16,.14,teal)
    cylinder('Bollard',(x,y,.69),.07,.7,teal)
    cylinder('Lantern',(x,y,1.06),.13,.23,white)
    cylinder('Lantern hat',(x,y,1.22),.18,.09,coral)
    ring('Lantern light',(x,y,1.09),.135,.012,mint)

# Helical antenna, water pipes, AC unit and hand-painted floor markings.
cube('Cooling unit',(-3.1,3.18,1.30),(1,.61,.80),white,.1)
for i in range(7):cube('Vent',(-3.1,2.857,1.04+i*.08),(.67,.018,.027),teal,.005)
beam('Mast',(-3.75,2.4,4.15),(-3.75,2.4,5.65),.04,teal)
sphere('Mast light',(-3.75,2.4,5.73),(.105,.105,.14),coral)
for z,r in [(4.7,.29),(5.05,.44),(5.4,.24)]:ring('Antenna band',(-3.75,2.4,z),r,.028,gold)
for x in [-.70,-.32,.06]:cube('Floor dash',(x,-2.20,.235),(.23,.06,.008),white,.005)
text('Floor stencil','EXPLORATION  /  01',(1.10,-1.91,.244),.18,teal,rotation=(0,0,0))

# Merge static meshes by material to keep the runtime scene small.
meshes=[o for o in bpy.context.scene.objects if o.type=='MESH']
groups={}
for o in meshes:groups.setdefault(o.data.materials[0].name,[]).append(o)
for name,objects in groups.items():
    bpy.ops.object.select_all(action='DESELECT')
    for o in objects:o.select_set(True)
    bpy.context.view_layer.objects.active=objects[0];bpy.ops.object.join();bpy.context.object.name='District_'+name
bpy.ops.object.select_all(action='SELECT')
(ROOT/'assets').mkdir(exist_ok=True);(ROOT/'art').mkdir(exist_ok=True)
bpy.ops.export_scene.gltf(filepath=str(ROOT/'assets/sky-district.glb'),export_format='GLB',use_selection=True,export_animations=False,export_cameras=False,export_lights=False)

# Poster includes the existing original explorer, for an honest static fallback.
bpy.ops.import_scene.gltf(filepath=str(ROOT/'assets/anime-explorer.glb'))
character=bpy.data.objects.get('AnimeExplorer');companion=bpy.data.objects.get('Companion')
character.scale=(1.18,)*3;character.location=(-.6,-.70,.72);character.rotation_euler.z=-.4
companion.scale=(.48,)*3;companion.location=(.95,-.1,2.45)
scene=bpy.context.scene;scene.render.engine='CYCLES';scene.cycles.samples=48;scene.cycles.use_denoising=True
scene.render.resolution_x=1600;scene.render.resolution_y=1100;scene.render.resolution_percentage=100;scene.render.film_transparent=True
scene.world.color=(.3,.3,.3)
for name,loc,energy,color,size in [('Sun',(-3,-6,13),2300,(1,.78,.58),8),('Sky',(4,2,10),1800,(.5,.8,1),7),('Fill',(-6,-4,6),900,(.8,1,1),6)]:
    bpy.ops.object.light_add(type='AREA',location=loc);o=bpy.context.object;o.name=name;o.data.energy=energy;o.data.color=color;o.data.shape='DISK';o.data.size=size;o.rotation_euler=(Vector((0,0,1))-o.location).to_track_quat('-Z','Y').to_euler()
bpy.ops.object.camera_add(location=(14,-19,15));cam=bpy.context.object;cam.rotation_euler=(Vector((0,0,1.0))-cam.location).to_track_quat('-Z','Y').to_euler();cam.data.type='ORTHO';cam.data.ortho_scale=21.5;scene.camera=cam
scene.view_settings.view_transform='AgX';scene.render.image_settings.file_format='PNG';scene.render.filepath=str(ROOT/'assets/sky-district-poster.png')
bpy.ops.wm.save_as_mainfile(filepath=str(ROOT/'art/sky-district.blend'))
bpy.ops.render.render(write_still=True)
print('SKY_DISTRICT_COMPLETE')
