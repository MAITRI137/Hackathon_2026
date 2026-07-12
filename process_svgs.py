import base64
import os
import re
from PIL import Image
from io import BytesIO

def process_image(img_path, output_svg_path, name_shift=10):
    # Resize image
    img = Image.open(img_path)
    # crop to square
    min_dim = min(img.width, img.height)
    left = (img.width - min_dim) / 2
    top = (img.height - min_dim) / 2
    img = img.crop((left, top, left + min_dim, top + min_dim))
    img = img.resize((150, 150), Image.Resampling.LANCZOS)
    
    # Save to buffer and base64 encode
    buffer = BytesIO()
    # Save as PNG
    img.save(buffer, format="PNG", optimize=True)
    b64_str = base64.b64encode(buffer.getvalue()).decode("utf-8")
    data_uri = f"data:image/png;base64,{b64_str}"
    
    # Read the SVG
    with open(output_svg_path, "r", encoding="utf-8") as f:
        svg_content = f.read()
    
    # Original cx=112, cy=118
    clip_cx = 112
    clip_cy = 118
    # Original inner r=41, +20% = 49
    clip_r = 49
    # Original outer r=47, +20% = 56
    stroke_r = 56
    
    image_size = clip_r * 2
    image_x = clip_cx - clip_r
    image_y = clip_cy - clip_r
    
    replacement = f'''<clipPath id="avatar-clip">
      <circle cx="{clip_cx}" cy="{clip_cy}" r="{clip_r}" />
    </clipPath>
    <circle cx="{clip_cx}" cy="{clip_cy}" r="{stroke_r}" fill="none" stroke="url(#ringM)" stroke-width="3"/>
    <image x="{image_x}" y="{image_y}" width="{image_size}" height="{image_size}" href="{data_uri}" clip-path="url(#avatar-clip)" preserveAspectRatio="xMidYMid slice" />'''
    
    # Replace the original stroke circle
    svg_content = re.sub(r'<circle cx="\d+" cy="\d+" r="47" fill="none" stroke="url\(#ringM\)" stroke-width="3"/>', '', svg_content)
    # Same for vyas ring
    svg_content = re.sub(r'<circle cx="\d+" cy="\d+" r="47" fill="none" stroke="url\(#ringV\)" stroke-width="3"/>', '', svg_content)
    
    # Find the placeholder inner circle
    pattern_circle = r'<circle cx="\d+" cy="\d+" r="41" fill="#[^"]+"/>'
    # The SVG contains `<text x="112" y="118" text-anchor="middle" ...>MD</text>` (or VD)
    pattern_text = r'<text x="\d+" y="\d+" text-anchor="middle"[^>]*>.*?</text>'
    
    if re.search(pattern_circle, svg_content):
        if 'card-vyas.svg' in output_svg_path:
            replacement = replacement.replace('#ringM', '#ringV')
        
        svg_content = re.sub(pattern_circle, replacement, svg_content)
        svg_content = re.sub(pattern_text, "", svg_content, count=1)
        
    # Shift the name and role chip by name_shift
    # Original: x="192" for name, x="192" for role rect, x="263" / "267" for role text
    def shift_x(match):
        val = int(match.group(1)) + name_shift
        return f'x="{val}"'
        
    svg_content = re.sub(r'x="(192)"', shift_x, svg_content)
    svg_content = re.sub(r'x="(263)"', shift_x, svg_content)
    svg_content = re.sub(r'x="(267)"', shift_x, svg_content)
    
    with open(output_svg_path, "w", encoding="utf-8") as f:
        f.write(svg_content)
    
    print(f"Updated {output_svg_path}")

# Run for Maitri
process_image(
    r"C:\Users\Dev\.gemini\antigravity-ide\brain\582b9558-f264-4d56-b4de-795d5e1f91ed\media__1783836654125.png",
    r"c:\Users\Dev\Documents\Hackathon_2026_clean_tailnet\Hackathon_2026\assets\card-maitri.svg",
    name_shift=12
)

# Run for Vyas (using new png)
process_image(
    r"C:\Users\Dev\.gemini\antigravity-ide\brain\582b9558-f264-4d56-b4de-795d5e1f91ed\media__1783837224974.png",
    r"c:\Users\Dev\Documents\Hackathon_2026_clean_tailnet\Hackathon_2026\assets\card-vyas.svg",
    name_shift=12
)
