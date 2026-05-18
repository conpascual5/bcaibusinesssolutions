#!/usr/bin/env python3
"""Fix the corrupted Landing.tsx file - replace literal \n and \" with actual newlines and quotes."""

with open('src/pages/Landing.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# The corrupted section has literal backslash-n and backslash-quote characters
# We need to find the exact corrupted block and replace it

# Find the start of corruption
marker = "          {/* Standalone Add-ons */}"
idx = content.find(marker)
if idx == -1:
    print("ERROR: Could not find the marker")
    exit(1)

# Find the end of corruption - look for the next proper JSX line
# After the corrupted block, there should be a proper line starting with:
end_marker = "\n          {/* What Happens Next"
# But the corrupted version has literal \n before it
# Let's find where the corruption ends by looking for the proper JSX after

# The corrupted text starts right after the marker
# Let's find the next occurrence of proper JSX after the corrupted block
rest = content[idx + len(marker):]

# The corrupted block ends with literal: \n\n          {/* What Happens Next — 1-2-3 Steps */}
# And then the proper JSX continues
# Let's find where the proper JSX resumes

# Look for the pattern where proper JSX starts again
# After the corrupted block, there should be:
# \n          <AnimatedSection delay={500} direction="up">
# But the corrupted block has literal \n before it

# Let's find the position where proper code resumes
# Search for the first occurrence of actual newline followed by <AnimatedSection delay={500}
# that comes AFTER the corrupted block

search_from = idx + len(marker)
# The corrupted block ends with literal \n\n          {/* What Happens Next — 1-2-3 Steps */}\n
# Then proper JSX continues

# Let's find the transition point
# After the corrupted block, the next proper line should be:
proper_start = "\n          <AnimatedSection delay={500} direction=\"up\">"
proper_pos = content.find(proper_start, search_from)

if proper_pos == -1:
    print("ERROR: Could not find the proper JSX continuation")
    # Let's see what's around there
    print(f"Context around search_from ({search_from}):")
    print(repr(content[search_from:search_from+500]))
    exit(1)

print(f"Found proper JSX at position {proper_pos}")

# The corrupted block is from idx to proper_pos
corrupted_block = content[idx:proper_pos]
print(f"Corrupted block length: {len(corrupted_block)}")
print(f"First 100 chars of corrupted block: {repr(corrupted_block[:100])}")

# Now we need to replace the literal \n and \" with actual characters
# The corrupted block has literal backslash-n and backslash-quote
# We need to unescape them

# First, let's see what the actual bytes look like
# The file has literal \n (two chars: backslash + n) and \" (two chars: backslash + quote)
# We need to replace them with actual newline and actual quote

fixed_block = corrupted_block
# Replace literal \" with actual "
fixed_block = fixed_block.replace('\\"', '"')
# Replace literal \\n with actual newline
fixed_block = fixed_block.replace('\\n', '\n')
# Replace literal \\ with actual backslash (for any remaining)
# But be careful not to double-replace

print(f"Fixed block first 100 chars: {repr(fixed_block[:100])}")

# Now replace in content
new_content = content[:idx] + fixed_block + content[proper_pos:]

with open('src/pages/Landing.tsx', 'w', encoding='utf-8') as f:
    f.write(new_content)

print("File fixed successfully!")
