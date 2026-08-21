with open('index.html', 'r') as f:
    lines = f.readlines()

start_idx = -1
end_idx = -1

for i, line in enumerate(lines):
    if "<!-- REEL 4: finla w -->" in line:
        if start_idx == -1: # The first occurrence is in the horizontal section
            start_idx = i
    if "<!-- SECTION B: VERTICAL REEL SECTION -->" in line:
        if start_idx != -1 and end_idx == -1:
            # We want to remove up to the end of the div that encloses the horizontal grid
            # Let's find the closing divs.
            # actually we can just look backwards from "SECTION B" to find the <!-- REEL 4 -->
            end_idx = i

if start_idx != -1 and end_idx != -1:
    # the end_idx is <!-- SECTION B ...
    # we need to keep the closing divs of horizontal section.
    # The structure was:
    #           </div>
    #         </div>
    #       </div>
    #     </section>
    #     
    #     <!-- SECTION B...
    
    # Let's just find the first "<!-- REEL 4: finla w -->" and the first "          <!-- REEL 5: garuda reel -->"
    # and remove from start_idx down to the end of REEL 5's div.
    pass

# Better approach: Just use string replace for the entire chunk we want to delete.
with open('index.html', 'r') as f:
    content = f.read()

# We know the duplicated part starts at `          <!-- REEL 4: finla w -->` and ends before `        </div>\n      </div>\n    </section>\n\n    <!-- SECTION B: VERTICAL REEL SECTION -->`
start_str = "          <!-- REEL 4: finla w -->"
end_str = "    <!-- SECTION B: VERTICAL REEL SECTION -->"

first_start = content.find(start_str)
second_start = content.find(start_str, first_start + 1)

if first_start != -1 and second_start != -1:
    # There is a duplicate. The first one is in the horizontal section.
    # We want to find the end of the first duplicate. It ends right before the closing tags of the horizontal section.
    # Since the structure is:
    # [duplicate start]
    # ...
    #           </div>
    # 
    #         </div>
    #       </div>
    #     </section>
    # 
    #     <!-- SECTION B: VERTICAL REEL SECTION -->
    
    end_pos = content.find(end_str, first_start)
    
    # we need to keep `        </div>\n      </div>\n    </section>\n\n`
    # Let's find the `        </div>\n      </div>\n    </section>` right before `end_str`
    closing_tags = "        </div>\n      </div>\n    </section>\n\n"
    closing_pos = content.rfind(closing_tags, first_start, end_pos)
    
    if closing_pos != -1:
        # We slice out from first_start up to closing_pos
        new_content = content[:first_start] + content[closing_pos:]
        with open('index.html', 'w') as f:
            f.write(new_content)
        print("Fixed duplicate.")
    else:
        print("Could not find closing tags.")

