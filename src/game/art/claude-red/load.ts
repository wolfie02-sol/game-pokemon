/**
 * Load order matches Claude Red: graphics core, then the character painter,
 * the Pokémon rasterizer, the cast, then every species definition.
 */
import './boot';
import './gfx.js';
import './pal';
import './chars.js';
import './pokesprite.js';
import './cast.js';
import './mons/test.js';
import './mons/001-030.js';
import './mons/031-060.js';
import './mons/061-090.js';
import './mons/091-120.js';
import './mons/121-151.js';
