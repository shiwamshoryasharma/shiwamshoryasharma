"""Build the original vector skill deck and an illustrative robot-motion GIF."""
import math
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont
from update_profile import BG, PANEL, LINE, FG, MUTED, MINT, LILAC, BLUE, rect, text, svg

ROOT = Path(__file__).resolve().parents[1]


def skill_deck():
    body = text(36,48,'SKILL MODULES',13,MINT,700)+text(36,89,'A toolkit across the stack.',30,FG,650)
    cards = [
        ('01','Robotics & simulation',MINT,['ROS 2 / MoveIt 2','Isaac Sim / Isaac Lab / Omniverse','URDF / XRDF / Digital twins']),
        ('02','AI & perception',LILAC,['PyTorch / OpenCV / CUDA','LLMs / RAG / Agentic workflows','Hugging Face / Ollama / MCP']),
        ('03','Full-stack & 3D',BLUE,['React / TypeScript / Vite','FastAPI / Flask / WebSockets','Three.js / Electron / OpenCascade']),
        ('04','Cloud & edge', '#ffc99c',['AWS / Task orchestration','Linux / WSL 2 / SQL','Arduino / Raspberry Pi']),
    ]
    for i,(n,title,color,lines) in enumerate(cards):
        x,y = 28+(i%2)*546,128+(i//2)*231
        body += rect(x,y,518,211,PANEL,28,LINE)
        body += rect(x+22,y+22,48,34,color,17)
        body += text(x+46,y+45,n,15,BG,750,'middle')
        body += text(x+88,y+47,title,23,FG,650)
        for j,line in enumerate(lines):
            body += text(x+25,y+96+j*30,line,18,MUTED)
        body += f'<circle cx="{x+475}" cy="{y+171}" r="15" fill="none" stroke="{color}" stroke-width="2"/>'
        body += f'<path d="M {x+468} {y+171} h14 M{x+475} {y+164} v14" stroke="{color}" stroke-width="2"/>'
    body += text(36, 632, 'Python · TypeScript · JavaScript · C++ · C# · SQL',18,MUTED)
    (ROOT/'assets/skill-modules.svg').write_text(svg(664,'Engineering toolkit','Skills grouped by the systems I build.',body),encoding='utf-8')


def font(size, bold=False):
    candidates = [Path('C:/Windows/Fonts/'+('segoeuib.ttf' if bold else 'segoeui.ttf')),
                  Path('/usr/share/fonts/truetype/dejavu/DejaVuSans'+('-Bold' if bold else '')+'.ttf')]
    for candidate in candidates:
        if candidate.exists():
            return ImageFont.truetype(str(candidate),size)
    return ImageFont.load_default(size=size)


def robot_loop():
    frames=[]
    for frame in range(72):
        t=frame/72*2*math.pi
        image=Image.new('RGB',(1120,320),BG)
        d=ImageDraw.Draw(image)
        d.rounded_rectangle((1,1,1118,318),radius=30,outline=LINE,width=2)
        d.text((36,31),'ROBOTICS / MOTION STUDY',font=font(14,True),fill=MINT)
        d.text((36,77),'Sense. Plan. Move.',font=font(33,True),fill=FG)
        d.text((36,130),'Small motions. Endless experiments.',font=font(19),fill=MUTED)
        for i,(label,color) in enumerate([('PERCEPTION',BLUE),('SIMULATION',LILAC),('CONTROL',MINT)]):
            x=36+i*143
            d.rounded_rectangle((x,194,x+132,230),radius=18,fill=PANEL,outline=LINE)
            d.text((x+12,204),label,font=font(12,True),fill=color)
        d.text((36,274),'A two-joint arm, one continuous loop.',font=font(14),fill=MUTED)
        d.rounded_rectangle((533,20,1095,299),radius=25,fill=PANEL)
        for x in range(555,1080,36):
            d.line((x,45,x,278),fill='#223047')
        for y in range(53,280,36):
            d.line((551,y,1076,y),fill='#223047')
        base=(748,261)
        target=(890+52*math.sin(t),124+35*math.cos(t))
        dx,dy=target[0]-base[0],target[1]-base[1]
        l1,l2=131,122
        a2=-math.acos(max(-1,min(1,(dx*dx+dy*dy-l1*l1-l2*l2)/(2*l1*l2))))
        a1=math.atan2(dy,dx)-math.atan2(l2*math.sin(a2),l1+l2*math.cos(a2))
        elbow=(base[0]+l1*math.cos(a1),base[1]+l1*math.sin(a1))
        path=[(890+52*math.sin(v/72*2*math.pi),124+35*math.cos(v/72*2*math.pi)) for v in range(73)]
        d.line(path,fill='#40576c',width=2)
        d.rounded_rectangle((699,258,797,277),radius=9,fill='#3e4b66')
        d.line([base,elbow,target],fill='#475b79',width=26)
        d.line([base,elbow],fill=LILAC,width=15)
        d.line([elbow,target],fill=BLUE,width=15)
        for point,color in [(base,MINT),(elbow,LILAC),(target,BLUE)]:
            x,y=point
            d.ellipse((x-14,y-14,x+14,y+14),fill=BG,outline=color,width=4)
            d.ellipse((x-4,y-4,x+4,y+4),fill=color)
        x,y=target
        d.line([(x-10,y+7),(x-14,y+27),(x-6,y+31)],fill=MINT,width=4)
        d.line([(x+10,y+7),(x+14,y+27),(x+6,y+31)],fill=MINT,width=4)
        d.rounded_rectangle((x-5,y+25,x+5,y+36),radius=2,fill=MINT)
        frames.append(image)
    palette=frames[0].quantize(colors=128)
    converted=[f.quantize(palette=palette,dither=Image.Dither.NONE) for f in frames]
    converted[0].save(ROOT/'assets/robotics-loop.gif',save_all=True,append_images=converted[1:],duration=55,loop=0,optimize=True,disposal=2)
    (ROOT/'.preview').mkdir(exist_ok=True)
    frames[18].save(ROOT/'.preview/robotics-frame.png')


if __name__=='__main__':
    skill_deck()
    robot_loop()
    print('Created skill modules and 72-frame original robot animation.')
