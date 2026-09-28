import bpy,json,math
from pathlib import Path
from mathutils import Vector,Quaternion
ROOT=Path(__file__).resolve().parents[1]
bpy.ops.object.select_all(action='SELECT');bpy.ops.object.delete(use_global=False)
bpy.ops.import_scene.gltf(filepath=str(ROOT/'.tmp/character-source/anime-base.glb'))
bpy.ops.object.select_all(action='DESELECT')
rig=next(o for o in bpy.context.scene.objects if o.type=='ARMATURE')
for im in bpy.data.images:
 if im.size[0]>1024 or im.size[1]>1024:im.scale(min(im.size[0],1024),min(im.size[1],1024));im.pack()
# Preserve base artwork. Pose shoulder rotation in armature space, then convert locally.
for side in ['L','R']:
 b=rig.pose.bones.get(f'J_Bip_{side}_UpperArm')
 if b:
  axis=Vector((0,1,0));localaxis=b.bone.matrix_local.to_quaternion().inverted()@axis
  b.rotation_mode='QUATERNION';b.rotation_quaternion=Quaternion(localaxis,math.radians(70)*(1 if b.head.x>0 else -1))
bpy.context.view_layer.update()

# Custom explorer equipment fitted around the licensed detailed character.
rig.name='ExplorerRig'
face=bpy.data.objects.get('Face')
if face and face.data.shape_keys and face.data.shape_keys.key_blocks.get('target_10'):face.data.shape_keys.key_blocks['target_10'].name='Blink'
root=bpy.data.objects.new('AnimeExplorer',None);bpy.context.collection.objects.link(root);rig.parent=root
rig.rotation_mode='XYZ';rig.rotation_euler.z=math.pi
# Bone-space accessories follow the chest while the limbs retain the artist's skin weights.
def material(name,color,metal=0,glow=0):
 m=bpy.data.materials.new(name);m.diffuse_color=(*color,1);m.use_nodes=True;p=m.node_tree.nodes.get('Principled BSDF');p.inputs['Base Color'].default_value=(*color,1);p.inputs['Roughness'].default_value=.65;p.inputs['Metallic'].default_value=metal
 if glow:p.inputs['Emission Color'].default_value=(*color,1);p.inputs['Emission Strength'].default_value=glow
 return m
coat=material('Deep jade expedition mantle',(.014,.085,.10));lining=material('Indigo inner weave',(.09,.06,.18));gold=material('Brushed champagne trim',(.66,.48,.23),.55);cyan=material('Ion insignia',(.035,.61,.62),.3,.7)
bpy.context.view_layer.update()
def attach(o,bone='J_Bip_C_Chest'):
 # Authored in rig coordinates, with weight one on its attachment bone.
 o.parent=rig;group=o.vertex_groups.new(name=bone);group.add(list(range(len(o.data.vertices))),1,'REPLACE');mod=o.modifiers.new('Equipment binding','ARMATURE');mod.object=rig
 return o
def cloth(name,verts,faces,mat,bone='J_Bip_C_Chest'):
 data=bpy.data.meshes.new(name);data.from_pydata(verts,[],faces);data.update();o=bpy.data.objects.new(name,data);bpy.context.collection.objects.link(o);o.data.materials.append(mat)
 for poly in data.polygons:poly.use_smooth=True
 attach(o,bone);mod=o.modifiers.new('Cloth thickness','SOLIDIFY');mod.thickness=.003
 return o
def cord(name,points,r,mat,bone='J_Bip_C_Chest'):
 curve=bpy.data.curves.new(name,'CURVE');curve.dimensions='3D';curve.bevel_depth=r;curve.bevel_resolution=2;spline=curve.splines.new('BEZIER');spline.bezier_points.add(len(points)-1)
 for p,co in zip(spline.bezier_points,points):p.co=co;p.handle_left_type='AUTO';p.handle_right_type='AUTO'
 o=bpy.data.objects.new(name,curve);bpy.context.collection.objects.link(o);bpy.ops.object.select_all(action='DESELECT');bpy.context.view_layer.objects.active=o;o.select_set(True);bpy.ops.object.convert(target='MESH');o.select_set(False);o.data.materials.append(mat);return attach(o,bone)
# Fitted shoulder cape, swept back with a split hem and curved folds.
verts=[];faces=[]
for i in range(11):
 u=i/10
 for j in range(17):
  a=.22+(math.pi-.44)*j/16
  width=.19+.16*u
  verts.append((math.cos(a)*width,-.025-math.sin(a)*(.085+.10*u)-math.sin(j*.85)*.008*u,1.56-u*(.64+.09*math.sin(a))))
for i in range(10):
 for j in range(16):
  v=i*17+j;faces.append((v,v+1,v+18,v+17))
cloth('Wind mantle',verts,faces,coat)
cord('Mantle lower gold hem',verts[-17:],.004,gold)
for j in [0,16]:cord('Mantle side piping',[verts[i*17+j] for i in range(11)],.003,gold)
# Raised collar wrapping behind the neck, open at the front.
collar=[]
for z in [1.55,1.63]:
 for j in range(17):
  a=-.3+(math.pi+.6)*j/16;collar.append((.10*math.cos(a),-.016-.071*math.sin(a),z))
cloth('Raised expedition collar',collar,[(j,j+1,j+18,j+17) for j in range(16)],coat)
cord('Collar edge',collar[17:],.0035,gold)
# Front harness and a prismatic navigation brooch.
cord('Shoulder harness',[(-.15,.06,1.52),(-.10,.107,1.40),(.0,.12,1.28),(.12,.07,1.14)],.016,coat)
cord('Harness stitch',[(-.15,.078,1.52),(-.10,.125,1.40),(.0,.138,1.28),(.12,.088,1.14)],.0025,gold)
cloth('Navigation prism',[(-.022,.139,1.48),(.022,.139,1.48),(.034,.145,1.45),(0,.16,1.39),(-.034,.145,1.45)],[(0,1,2,3,4)],cyan)
for x in [-.08,.08]:cord('Collar clasp',[(x,.055,1.57),(x*.72,.105,1.53)],.006,gold)
# Original Pixel companion from the earlier Blender source, kept independently animated.
before=set(bpy.context.scene.objects);bpy.ops.import_scene.gltf(filepath=str(ROOT/'assets/wayfarer.glb'));new=set(bpy.context.scene.objects)-before
robot=next(o for o in new if o.name=='Companion');keep={robot,*robot.children_recursive}
for o in new-keep:bpy.data.objects.remove(o,do_unlink=True)
robot.location=(.45,-.08,1.43);robot.scale=(.33,)*3
# Export the skinned model and its textures without lights, cameras or bone-display helpers.
bpy.ops.object.select_all(action='DESELECT')
for o in {root,rig,*root.children_recursive,*keep}:
 if o.name in bpy.context.view_layer.objects:o.select_set(True)
export_args=dict(filepath=str(ROOT/'assets/anime-explorer.glb'),export_format='GLB',use_selection=True,export_animations=False,export_cameras=False,export_lights=False)
if 'export_rest_position_armature' in bpy.ops.export_scene.gltf.get_rna_type().properties:export_args['export_rest_position_armature']=False
bpy.ops.export_scene.gltf(**export_args)
# Studio view shows the actual detailed asset with neutral lighting.

scene=bpy.context.scene;scene.render.engine='CYCLES';scene.cycles.samples=32;scene.cycles.use_denoising=True
scene.render.resolution_x=1000;scene.render.resolution_y=1300;scene.render.resolution_percentage=100;scene.render.film_transparent=True
scene.world.color=(.25,.25,.25)
for name,loc,energy,color,size in [('Key',(2,-4,5),350,(.82,.91,1),5),('Fill',(-3,-2,2),160,(1,.85,.72),4)]:
 bpy.ops.object.light_add(type='AREA',location=loc);o=bpy.context.object;o.name=name;o.data.energy=energy;o.data.color=color;o.data.shape='DISK';o.data.size=size;o.rotation_euler=(Vector((0,0,1))-o.location).to_track_quat('-Z','Y').to_euler()
bpy.ops.object.camera_add(location=(.7,-3.5,1.8));cam=bpy.context.object;cam.rotation_euler=(Vector((0,0,.95))-cam.location).to_track_quat('-Z','Y').to_euler();cam.data.type='ORTHO';cam.data.ortho_scale=2.2;scene.camera=cam
scene.view_settings.view_transform='Standard';scene.render.image_settings.file_format='PNG';scene.render.filepath=str(ROOT/'assets/anime-explorer-poster.png');bpy.ops.render.render(write_still=True)
bpy.ops.wm.save_as_mainfile(filepath=str(ROOT/'art/anime-explorer.blend'),compress=True)
