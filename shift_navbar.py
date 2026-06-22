import re

with open("nirvi-elevated-style/src/components/Navbar.jsx", "r", encoding="utf-8") as f:
    text = f.read()

# Make profile visible on mobile by removing 'hidden sm:block' 
text = text.replace('className="relative hidden sm:block"\n              onMouseEnter={openProfileMenu}', 'className="relative"\n              onMouseEnter={openProfileMenu}')

# Match Cart block
cart_block_match = re.search(r'          <Link to="/cart".*?</Link>\n', text, re.DOTALL)
if cart_block_match:
    cart_block = cart_block_match.group(0)
    # Remove cart block from its current position
    text = text.replace(cart_block, "")
    
    # Insert cart block BEFORE the auth block
    auth_block_start = text.find('          {isAuthenticated ? (')
    text = text[:auth_block_start] + cart_block + text[auth_block_start:]

with open("nirvi-elevated-style/src/components/Navbar.jsx", "w", encoding="utf-8") as f:
    f.write(text)

print("Replacement Complete")
