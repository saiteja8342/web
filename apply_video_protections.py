import os
import re

DIR = "/Users/vutukurisaiteja/Downloads/new desing mne"

# 1. Update HTML files
html_files = ["index.html", "temp_for_sync.html"]

for html_file in html_files:
    file_path = os.path.join(DIR, html_file)
    if os.path.exists(file_path):
        with open(file_path, "r", encoding="utf-8") as f:
            content = f.read()

        # Add controlsList="nodownload" and disablePictureInPicture if not present
        # We will look for <video tags
        def replace_video_tag(match):
            tag = match.group(0)
            if 'controlsList="nodownload"' not in tag:
                # Add attributes right after <video
                tag = tag.replace('<video', '<video controlsList="nodownload" disablePictureInPicture', 1)
            elif 'disablePictureInPicture' not in tag:
                tag = tag.replace('<video', '<video disablePictureInPicture', 1)
            return tag

        new_content = re.sub(r'<video[^>]*>', replace_video_tag, content)

        if new_content != content:
            with open(file_path, "w", encoding="utf-8") as f:
                f.write(new_content)
            print(f"Updated {html_file}")
        else:
            print(f"No changes needed for {html_file} (or already updated)")

# 2. Append CSS to style.css
css_file = os.path.join(DIR, "css", "style.css")
css_code = """

/* Prevent long-press context menus on all videos */
video {
  -webkit-touch-callout: none;
  -webkit-user-select: none;
  user-select: none;
}
"""
if os.path.exists(css_file):
    with open(css_file, "r", encoding="utf-8") as f:
        content = f.read()
    if "-webkit-touch-callout: none;" not in content:
        with open(css_file, "a", encoding="utf-8") as f:
            f.write(css_code)
        print("Updated style.css")
    else:
        print("CSS already updated")

# 3. Append JS to main.js
js_file = os.path.join(DIR, "js", "main.js")
js_code = """

// Block context menus on all videos to prevent downloading
document.querySelectorAll('video').forEach(video => {
  video.addEventListener('contextmenu', e => e.preventDefault());
});
"""
if os.path.exists(js_file):
    with open(js_file, "r", encoding="utf-8") as f:
        content = f.read()
    if "contextmenu" not in content or "preventDefault()" not in content:
        with open(js_file, "a", encoding="utf-8") as f:
            f.write(js_code)
        print("Updated main.js")
    else:
        print("JS already updated")
