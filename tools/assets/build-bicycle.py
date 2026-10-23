"""Build original bicycle/rider artwork in an isolated Blender 5.1 process.
Run: blender.exe --background --factory-startup --python tools/assets/build-bicycle.py
Uses Blender's bundled glTF exporter; no downloaded model, image or font.
"""
import bpy, math, json, hashlib
from pathlib import Path
from mathutils import Vector
ROOT=Path(__file__).resolve().parents[2]
SOURCE=ROOT/'assets/source/bicycle'; OUT=ROOT/'public/assets/models'
SOURCE.mkdir(parents=True,exist_ok=True);OUT.mkdir(parents=True,exist_ok=True)
bpy.context.preferences.filepaths.save_version=0
bpy.ops.object.select_all(action='SELECT');bpy.ops.object.delete(use_global=False)
# Model authored in game coordinates (X right,Y up,Z backward); convert to Blender Z-up.
def cv(p):return Vector((p[0],-p[2],p[1]))
def linear(hexcode):
 rgb=[((hexcode>>shift)&255)/255 for shift in (16,8,0)]
 return tuple(v/12.92 if v<=.04045 else ((v+.055)/1.055)**2.4 for v in rgb)+(1,)
def material(name,metal,rough):
 m=bpy.data.materials.new(name);m.use_nodes=True
 bsdf=m.node_tree.nodes.get('Principled BSDF');bsdf.inputs['Metallic'].default_value=metal;bsdf.inputs['Roughness'].default_value=rough
 color=m.node_tree.nodes.new('ShaderNodeVertexColor');color.layer_name='Color';m.node_tree.links.new(color.outputs['Color'],bsdf.inputs['Base Color']);return m
METAL=material('worn-metal-pbr',.72,.41);SOFT=material('textile-rubber-pbr',0,.78)
STEEL=0x9EA8A7;PAINT=0x215C58;RUBBER=0x20282A;GLOVE=0x333C3D;CLOTH=0x813F39;STITCH=0xA36B5E;ACCENT=0xC29B49

def empty(name,parent=None,at=(0,0,0)):
 ob=bpy.data.objects.new(name,None);bpy.context.collection.objects.link(ob);ob.parent=parent;ob.location=cv(at);ob.empty_display_size=.035;return ob
root=empty('bicycle');steering=empty('steering-pivot',root)
front=empty('front-wheel',steering,(0,-.82,-.57));rear=empty('rear-wheel',root,(0,-.82,1.05));pedals=empty('pedal-pivot',root,(0,-.75,.55))

def mesh(name,vertices,faces,color,mat=SOFT,parent=steering,variation=0):
 data=bpy.data.meshes.new(name);data.from_pydata([cv(v) for v in vertices],[],faces);data.update()
 for p in data.polygons:p.use_smooth=True
 colors=data.color_attributes.new(name='Color',type='FLOAT_COLOR',domain='POINT');base=linear(color)
 for i,item in enumerate(colors.data):
  f=1+variation*math.sin(i*1.731);item.color=tuple(min(1,max(0,c*f)) for c in base[:3])+(1,)
 ob=bpy.data.objects.new(name,data);bpy.context.collection.objects.link(ob);ob.parent=parent;ob.data.materials.append(mat);return ob

def sweep(name,points,radii,color,mat=SOFT,parent=steering,sides=8,oval=1,variation=0):
 pts=[Vector(p) for p in points];verts=[];faces=[]
 for i,p in enumerate(pts):
  direction=(pts[min(i+1,len(pts)-1)]-pts[max(i-1,0)]).normalized()
  cross=direction.cross(Vector((1,0,0)))
  if cross.length<.1:cross=direction.cross(Vector((0,1,0)))
  cross.normalize();other=direction.cross(cross).normalized();radius=radii[i] if isinstance(radii,list) else radii
  for j in range(sides):
   a=j*2*math.pi/sides;v=p+cross*math.cos(a)*radius+other*math.sin(a)*radius*oval;verts.append(tuple(v))
 for i in range(len(pts)-1):
  for j in range(sides):faces.append((i*sides+j,i*sides+(j+1)%sides,(i+1)*sides+(j+1)%sides,(i+1)*sides+j))
 faces.append(tuple(range(sides-1,-1,-1)));faces.append(tuple((len(pts)-1)*sides+j for j in range(sides)))
 return mesh(name,verts,faces,color,mat,parent,variation)

def tube(name,a,b,r,color,mat=METAL,parent=steering,sides=8):return sweep(name,[a,b],r,color,mat,parent,sides)
def torus(name,radius,minor,color,mat=SOFT,parent=steering,axis='X',at=(0,0,0),major=32,small=6):
 vertices=[];faces=[]
 for i in range(major):
  a=i*2*math.pi/major
  for j in range(small):
   b=j*2*math.pi/small;v=(math.sin(b)*minor,math.cos(a)*(radius+math.cos(b)*minor),math.sin(a)*(radius+math.cos(b)*minor))
   if axis=='Y':v=(v[1],v[0],v[2])
   vertices.append(tuple(v[k]+at[k] for k in range(3)))
 for i in range(major):
  for j in range(small):faces.append((i*small+j,((i+1)%major)*small+j,((i+1)%major)*small+(j+1)%small,i*small+(j+1)%small))
 return mesh(name,vertices,faces,color,mat,parent)

def patch(name,points,color,mat=SOFT,parent=steering):return mesh(name,points,[(0,1,2,3)],color,mat,parent)
# Curved swept handlebar, stem clamp and independent brake levers.
empty('handlebar',steering)
sweep('handlebar-metal',[(-.565,.058,.11),(-.49,.05,.075),(-.38,.033,.018),(-.28,.03,0),(0,.03,0),(.28,.03,0),(.38,.033,.018),(.49,.05,.075),(.565,.058,.11)],.028,STEEL,METAL,sides=12)
tube('stem-column',(0,-.28,.22),(0,.015,.015),.032,STEEL,sides=12)
tube('stem-extension',(0,.015,.015),(0,.015,-.075),.03,STEEL,sides=10)
for sx in (-.035,.035):
 for sz in (-.02,.035):tube('stem-bolt',(sx,.045,sz),(sx,.055,sz),.007,0xCDD3CF,sides=6)
# Scratches in small locations of use, not a blanket noise texture.
for i in range(14):
 x=-.27+i*.04
 patch('metal-scuff',[(x,.052,-.009),(x+.013,.053,-.008),(x+.014,.053,-.004),(x+.001,.052,-.005)],0xC7CECA,METAL)
# Palm volume built from anatomical cross sections; articulated finger curls wrap grips.
for side,label in [(-1,'left'),(1,'right')]:
 handpos=(side*.475,.085,.055);empty(label+'-palm-inner',steering,(handpos[0]-.095,handpos[1],handpos[2]-.015));empty(label+'-palm-outer',steering,(handpos[0]+.095,handpos[1],handpos[2]-.015));empty(label+'-hand',steering,handpos);empty(label+'-grip',steering,(side*.475,.05,.055))
 grippts=[(side*(.385+i*.015),.05,.035+i*.0033) for i in range(13)]
 sweep(label+'-ribbed-grip',grippts,[.044 if i%2==0 else .048 for i in range(13)],RUBBER,sides=12)
 # Palm rings (rounded rectangle), fingers and thumb all own sculpted geometry.
 vertices=[];faces=[]
 for z,width,height in [(-.06,.074,.03),(-.015,.095,.047),(.04,.084,.043),(.095,.052,.03)]:
  for i in range(12):
   a=i*math.pi/6;vertices.append((handpos[0]+math.cos(a)*width,handpos[1]+math.sin(a)*height,z+handpos[2]))
 for ring in range(3):
  for i in range(12):faces.append((ring*12+i,ring*12+(i+1)%12,(ring+1)*12+(i+1)%12,(ring+1)*12+i))
 faces.extend([tuple(range(11,-1,-1)),tuple(36+i for i in range(12))]);mesh(label+'-glove-palm',vertices,faces,GLOVE,variation=.025)
 for i,x in enumerate([-.065,-.022,.022,.064]):
  length=[.077,.094,.092,.072][i]
  points=[(handpos[0]+x,handpos[1]+.014,handpos[2]-.045),(handpos[0]+x,handpos[1]+.005,handpos[2]-.045-length*.5),(handpos[0]+x,handpos[1]-.03,handpos[2]-.045-length),(handpos[0]+x,handpos[1]-.068,handpos[2]-.038-length*.6),(handpos[0]+x,handpos[1]-.068,handpos[2]-.015)]
  sweep(label+f'-finger-{i}',points,[.019,.019,.017,.016,.011],GLOVE,sides=8,oval=.85)
  tube(label+'-finger-stitch',(handpos[0]+x-.008,handpos[1]+.025,handpos[2]-.049),(handpos[0]+x+.008,handpos[1]+.025,handpos[2]-.049),.0016,0x6A7471,SOFT,sides=4)
 inside=-side
 sweep(label+'-thumb',[(handpos[0]+inside*.055,handpos[1]+.01,handpos[2]+.025),(handpos[0]+inside*.105,handpos[1]-.005,handpos[2]-.005),(handpos[0]+inside*.095,handpos[1]-.038,handpos[2]-.047)],[.028,.025,.015],GLOVE,sides=10)
 # Low-profile reinforced knuckle plate, split seams retain individual fingers.
 patch(label+'-knuckle-pad',[(handpos[0]-.052,handpos[1]+.04,handpos[2]-.03),(handpos[0]+.052,handpos[1]+.04,handpos[2]-.03),(handpos[0]+.047,handpos[1]+.042,handpos[2]+.005),(handpos[0]-.047,handpos[1]+.042,handpos[2]+.005)],0x242D30)
 sleeve=[(side*.475,.045,.16),(side*.49,.025,.24),(side*.53,-.02,.34),(side*.57,-.08,.44),(side*.63,-.19,.61),(side*.71,-.33,.83),(side*.8,-.5,1.1)]
 radii=[.068,.078,.096,.09,.108,.105,.112]
 # Continuous tailored cloth mesh: fold bulges are part of the sleeve topology,
 # rather than intersecting decorative rings. This keeps silhouettes and normals clean.
 sleeve_vertices=[];sleeve_faces=[];rings=[]
 for segment in range(len(sleeve)-1):
  for subdivision in range(3):
   t=subdivision/3;center=Vector(sleeve[segment]).lerp(Vector(sleeve[segment+1]),t);radius=radii[segment]*(1-t)+radii[segment+1]*t;rings.append((center,radius))
 rings.append((Vector(sleeve[-1]),radii[-1]))
 for i,(center,radius) in enumerate(rings):
  tangent=(rings[min(i+1,len(rings)-1)][0]-rings[max(i-1,0)][0]).normalized();u=tangent.cross(Vector((1,0,0))).normalized();v=tangent.cross(u).normalized()
  for j in range(16):
   angle=j*math.pi/8;fold=1+.13*math.sin(i*1.85+math.sin(angle)*1.8);point=center+u*math.cos(angle)*radius*fold+v*math.sin(angle)*radius*.92*fold;sleeve_vertices.append(tuple(point))
 for i in range(len(rings)-1):
  for j in range(16):sleeve_faces.append((i*16+j,i*16+(j+1)%16,(i+1)*16+(j+1)%16,(i+1)*16+j))
 sleeve_faces.extend([tuple(range(15,-1,-1)),tuple((len(rings)-1)*16+j for j in range(16))]);mesh(label+'-waterproof-sleeve',sleeve_vertices,sleeve_faces,CLOTH,variation=.015)
 seam=[(p[0]+side*r*.72,p[1]+r*.7,p[2]) for p,r in zip(sleeve,radii)]
 sweep(label+'-sleeve-seam',seam,.0018,STITCH,sides=4)
 sweep(label+'-elastic-cuff',sleeve[:2],[.082,.096],0x303637,sides=12)
 empty(label+'-sleeve-cap',steering,sleeve[-1])
 patch(label+'-reflective-tab',[(side*.45,.105,.18),(side*.49,.105,.18),(side*.50,.1,.22),(side*.46,.1,.22)],0xB8C1B6)
 sweep(label+'-brake-lever',[(side*.34,.012,-.028),(side*.405,-.007,-.068),(side*.47,-.025,-.09),(side*.495,-.023,-.075)],[.014,.012,.011,.009],STEEL,METAL,sides=8,oval=.6)
 tube(label+'-lever-pivot',(side*.34,.015,-.03),(side*.34,.035,-.03),.008,0xD1D4CB,sides=8)
 cable=[(side*.34,-.005,-.03),(side*.27,-.1,-.17),(side*.12,-.24,-.19),(-side*.07,-.34,-.09),(side*.07,-.54,-.35),(side*.07,-.69,-.56)]
 sweep(label+'-brake-cable',cable,.005,RUBBER,sides=6)
empty('brake-cables',steering)
torus('bell-base',.034,.007,STEEL,METAL,axis='Y',at=(-.16,.06,.015),major=16,small=6)
sweep('bell-dome',[(-.16,.06,.015),(-.16,.085,.015),(-.16,.092,.015)],[.038,.026,.006],ACCENT,METAL,sides=16)
# Frame, wheels and pedal hierarchy preserve the current first-person viewmodel.
for i,(a,b,r) in enumerate([((0,-.25,.17),(0,-.75,.55),.033),((0,-.75,.55),(0,-.28,.92),.033),((0,-.28,.92),(0,-.25,.17),.026),((0,-.75,.55),(0,-.82,1.05),.022),((0,-.28,.92),(0,-.82,1.05),.022)]):tube('frame-tube-'+str(i),a,b,r,PAINT,METAL,root,sides=12)
for side in (-1,1):tube('front-fork',(side*.065,-.28,.17),(side*.065,-.82,-.57),.024,STEEL,METAL,sides=10)
for wheel in (front,rear):
 torus(wheel.name+'-rubber',.34,.027,RUBBER,SOFT,wheel,major=40,small=8)
 torus(wheel.name+'-rim',.313,.011,STEEL,METAL,wheel,major=40,small=6)
 tube('hub',(-.065,0,0),(.065,0,0),.024,STEEL,METAL,wheel,sides=12)
 for i in range(16):
  a=i*math.pi/8;tube('spoke',(i%2*.05-.025,0,0),(0,math.cos(a)*.307,math.sin(a)*.307),.0024,STEEL,METAL,wheel,sides=4)
for side in (-1,1):
 tube('pedal-crank',(side*.09,0,0),(side*.09,side*.15,0),.012,STEEL,METAL,pedals,sides=8)
 tube('pedal-platform',(side*.10,side*.15,-.025),(side*.21,side*.15,-.025),.025,RUBBER,SOFT,pedals,sides=6)
# Save editable source BEFORE render batching. All custom mesh components remain separate.
root['provenance']='original-project';root['game_axes']='X right, Y up, Z backward';root['wheel_radius_m']=.34
bpy.ops.wm.save_as_mainfile(filepath=str(SOURCE/'bicycle-rider.blend'))
# Static batches preserve source anchors and independent dynamic groups.
def batch(parent,excluded=(),prefix=None):
 bpy.context.view_layer.update();inv=parent.matrix_world.inverted();parts=[]
 def walk(ob):
  if ob in excluded:return
  if ob.type=='MESH':parts.append(ob)
  for child in list(ob.children):walk(child)
 walk(parent)
 for mat in (METAL,SOFT):
  selected=[ob for ob in parts if ob.data.materials[0]==mat]
  if not selected:continue
  vertices=[];faces=[];colors=[]
  for ob in selected:
   transform=inv@ob.matrix_world;offset=len(vertices)
   vertices.extend([tuple(transform@v.co) for v in ob.data.vertices]);faces.extend([tuple(offset+i for i in p.vertices) for p in ob.data.polygons]);colors.extend([tuple(c.color) for c in ob.data.color_attributes['Color'].data])
  data=bpy.data.meshes.new(parent.name+'-batched');data.from_pydata(vertices,[],faces);data.update()
  layer=data.color_attributes.new(name='Color',type='FLOAT_COLOR',domain='POINT')
  for c,v in zip(layer.data,colors):c.color=v
  for p in data.polygons:p.use_smooth=True
  ob=bpy.data.objects.new((prefix or parent.name)+'-'+('metal' if mat==METAL else 'soft'),data);bpy.context.collection.objects.link(ob);ob.parent=parent;ob.data.materials.append(mat)
 for ob in parts:
  # Geometry now batched; preserve object names as reference anchors.
  anchor=empty(ob.name,ob.parent);anchor.matrix_local=ob.matrix_local.copy();bpy.data.objects.remove(ob,do_unlink=True)
 # Blender resolves a collision while old mesh still exists by .001: normalize anchors.
 for ob in list(bpy.data.objects):
  if ob.type=='EMPTY' and ob.name.endswith('.001') and bpy.data.objects.get(ob.name[:-4]) is None:ob.name=ob.name[:-4]
batch(steering,(front,));batch(root,(steering,rear,pedals));batch(front,prefix='front-wheel');batch(rear,prefix='rear-wheel');batch(pedals)
# Make the front tire a named Mesh after GLTFLoader, matching bounds validation.
bpy.data.objects['front-wheel-soft'].name='front-wheel-tire';bpy.data.objects['rear-wheel-soft'].name='rear-wheel-tire'
bpy.ops.object.select_all(action='DESELECT')
def select_tree(ob):
 ob.select_set(True)
 for child in ob.children:select_tree(child)
select_tree(root)
exporter=bpy.ops.export_scene.gltf.get_rna_type().properties
print('Blender API',bpy.app.version_string,'glTF properties',len(exporter))
bpy.ops.export_scene.gltf(filepath=str(OUT/'bicycle-rider.glb'),export_format='GLB',use_selection=True,export_yup=True,export_apply=False,export_materials='EXPORT',export_vertex_color='MATERIAL',export_animations=False)
# Read the actual GLB JSON for deterministic counts, not source object estimates.
payload=(OUT/'bicycle-rider.glb').read_bytes();length=int.from_bytes(payload[12:16],'little');gltf=json.loads(payload[20:20+length])
triangles=sum(gltf['accessors'][primitive['indices']]['count']//3 for m in gltf['meshes'] for primitive in m['primitives']);calls=sum(len(m['primitives']) for m in gltf['meshes'])
manifest={'name':'bicycle-rider','provenance':'original-project','author':'Ciclovía Bogotá XR project','rights':'Original project artwork; no third-party assets','source':'assets/source/bicycle/bicycle-rider.blend','generator':'tools/assets/build-bicycle.py','blenderVersion':bpy.app.version_string,'triangles':triangles,'drawCalls':calls,'materials':len(gltf['materials']),'bytes':len(payload),'sha256':hashlib.sha256(payload).hexdigest(),'presentation':{'position':[0,-.38,-1.14],'scale':.72,'wheelRadius':.34},'licenseNotes':'Geometry, colors and materials authored for this project in Blender; no external textures, models, fonts or audio.'}
(OUT/'bicycle-rider.manifest.json').write_text(json.dumps(manifest,indent=2),encoding='utf8')
print('BICYCLE_MANIFEST',json.dumps(manifest))
assert triangles<=12000,(triangles,'triangle budget');assert calls<=12,(calls,'draw call budget')

# Optional studio preview for local art inspection; never presented as a game capture.
import sys
if '--preview' in sys.argv:
 scene=bpy.context.scene;scene.render.engine='CYCLES';scene.cycles.samples=16
 scene.render.resolution_x=1280;scene.render.resolution_y=720;scene.render.resolution_percentage=100
 scene.world.color=(.12,.14,.15)
 data=bpy.data.cameras.new('preview-camera');camera=bpy.data.objects.new('preview-camera',data);bpy.context.collection.objects.link(camera)
 camera.location=cv((0,.38/.72,1.14/.72));camera.rotation_euler=Vector((0,1,0)).to_track_quat('-Z','Y').to_euler()
 data.sensor_fit='VERTICAL';data.sensor_height=24;data.lens=24/(2*math.tan(math.radians(65)/2));scene.camera=camera
 for name,location,power,size in [('key',(-2,-3,4),600,4),('fill',(3,-1,2),350,3)]:
  light=bpy.data.lights.new(name,'AREA');light.energy=power;light.shape='DISK';light.size=size;ob=bpy.data.objects.new(name,light);bpy.context.collection.objects.link(ob);ob.location=location;ob.rotation_euler=(-ob.location).to_track_quat('-Z','Y').to_euler()
 scene.render.filepath=str(SOURCE/'studio-preview.png');bpy.ops.render.render(write_still=True)
