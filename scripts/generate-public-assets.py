"""Original compact Markloom graphics; no external media or private content."""
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont
root=Path(__file__).resolve().parents[1]/'frontend/public'
root.mkdir(parents=True,exist_ok=True)
def font(size):
    for path in ['/System/Library/Fonts/HelveticaNeue.ttc','/System/Library/Fonts/Supplemental/Arial.ttf','/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf']:
        if Path(path).exists():return ImageFont.truetype(path,size)
    return ImageFont.load_default()
image=Image.new('RGB',(1200,630),'#070609');d=ImageDraw.Draw(image)
d.text((65,40),'markloom',font=font(34),fill='#eeebf4')
for y,text,color in [(145,'Ideas move.','#eeebf4'),(232,'Truth stays','#eeebf4'),(319,'connected.','#bca1ed')]:d.text((65,y),text,font=font(76),fill=color)
d.text((70,521),'EVIDENCE-LED BRAND GOVERNANCE',font=font(18),fill='#b8a4ca')
d.arc((700,145,1150,500),0,360,fill='#604174',width=2)
for index,(x,y,angle) in enumerate([(690,180,15),(820,240,-5),(965,165,-16)]):
    layer=Image.new('RGBA',(205,260),(0,0,0,0));p=ImageDraw.Draw(layer)
    p.rounded_rectangle((5,5,199,254),radius=9,fill='#17101f',outline='#a581cf' if index==0 else '#665071',width=2)
    p.text((22,29),['01 / SOURCES','02 / DRAFT','03 / DECISION'][index],font=font(13),fill='#cfb7ed')
    for line,width in enumerate([149,127,101]):p.rectangle((22,90+line*23,22+width,93+line*23),fill='#6f537f')
    p.line((22,205,178,205),fill='#4c355c',width=1);p.ellipse((22,226,28,232),fill='#b796df')
    layer=layer.rotate(angle,resample=Image.Resampling.BICUBIC,expand=True)
    image.paste(layer,(x,y),layer)
image.save(root/'social-preview.png',optimize=True,compress_level=9)
image.save(root/'social-preview.webp',quality=85,method=6)
icon=Image.new('RGB',(180,180),'#070609');p=ImageDraw.Draw(icon)
p.rounded_rectangle((43,49,110,141),radius=5,outline='#bca1ed',width=5)
p.rounded_rectangle((69,29,136,121),radius=5,outline='#80609e',width=4)
icon.save(root/'apple-touch-icon.png',optimize=True)
icon.resize((32,32),Image.Resampling.LANCZOS).save(root/'favicon-32.png',optimize=True)
print('Generated optimized violet social card and document-mark icons')
