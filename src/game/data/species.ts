import type { Element } from './elements';
import { generateLearnset } from './learnsets';

export type Arch =
  | 'quad'
  | 'biped'
  | 'bird'
  | 'blob'
  | 'fish'
  | 'serpent'
  | 'moth'
  | 'ghost'
  | 'plant'
  | 'golem'
  | 'turtle'
  | 'insect'
  | 'beetle'
  | 'crab'
  | 'brute'
  | 'orb'
  | 'jelly'
  | 'wyrm'
  | 'star'
  | 'clam';

export interface ArtSpec {
  arch: Arch;
  /** main body colour */
  c1: string;
  /** accent colour */
  c2: string;
  /** belly / muzzle colour */
  c3?: string;
  /** 0.5 - 1.0: overall size inside the 48px frame */
  size: number;
  ears?: 'point' | 'round' | 'long' | 'fin' | 'none';
  tail?: 'flame' | 'leaf' | 'plain' | 'bolt' | 'fin' | 'fluff' | 'none';
  eyes?: 'round' | 'sharp' | 'sleepy' | 'big';
  extra?: string[];
}

export interface Evolution {
  to: number;
  /** level threshold, or */
  lvl?: number;
  /** an evolution shard item id */
  item?: string;
}

export interface Species {
  id: number;
  name: string;
  types: Element[];
  /** hp, atk, def, spd, spc */
  base: [number, number, number, number, number];
  catchRate: number;
  expYield: number;
  evos: Evolution[];
  /** level-up evolution, if any (kept for convenience) */
  evo?: { lvl: number; to: number };
  learn: [number, string][];
  dex: string;
  kind: string;
  art: ArtSpec;
  /** id of the family's first stage */
  base_of?: number;
  /** 0 = basic, 1 = first evolution, 2 = second */
  stage: number;
  legendary?: boolean;
}

/*
 * One line per Wildkin:
 *   Name | TYPES | hp atk def spd spc | catch | exp | evolutions | kind | dex | art | learnset override
 * evolutions: "L16>2" (level), "I:cinder>38" (shard), comma separated, or "-".
 * art: arch c1 c2 c3 size ears tail eyes extra,extra ("-" = none)
 */
const DATA = `
Sproutle|LEAF|45 49 49 45 65|45|64|L16>2|Seedling|The bud on its head drinks sunlight. It hops through meadows at dawn and naps in warm soil.|biped #68c058 #f080a0 #f0f8d0 0.6 long - big leafhead
Bramblebun|LEAF|60 62 63 60 80|45|141|L32>3|Thicket Hare|Thorny vines wrap its ears. It guards the forest edge with a stomp that shakes the ferns.|biped #48a848 #e86090 #e0f0c0 0.8 long - round leafhead,collar
Thornhare|LEAF BRAWL|80 92 83 80 95|45|236|-|Bloom Sage|Flowers bloom where it lands a kick. Old tales say it guards the very first seed.|brute #389040 #f070b0 #f0f8e0 1 long - sharp leafhead,gem
Emberkit|FLAME|39 52 43 65 55|45|62|L16>5|Kindle Cub|Its tail flame flickers brighter when it is happy. It naps curled up in warm ash.|quad #f08038 #ffd040 #fff0c8 0.62 point flame big -
Blazelynx|FLAME|58 66 58 82 70|45|142|L36>6|Ember Lynx|Tufts of fire crown its ears. It stalks prey across scorched ridges without a sound.|quad #e86030 #ffc838 #fff0c8 0.8 point flame sharp cheeks
Pyrolion|FLAME EARTH|80 90 80 100 92|45|230|-|Magma King|Its mane is molten rock. A single roar can melt a boulder into glowing slag.|quad #d04828 #ffb030 #f8d8a0 1 round flame sharp mane
Splashel|TIDE|44 48 65 43 50|45|63|L16>8|Puddle Shell|It hides in its soft shell when startled, then squirts water at whoever woke it.|turtle #58a8f0 #c89858 #f8f0c0 0.6 - plain big -
Currentle|TIDE|59 63 80 58 65|45|142|L36>9|Current Shell|Fins on its shell let it glide through rapids faster than any canoe.|turtle #3c88e0 #a87840 #f0e8b8 0.8 - fin round fins
Abyshell|TIDE STONE|80 84 102 76 88|45|232|-|Deep Fortress|Coral spires grow from its shell. It guards ancient sea trenches no light can reach.|turtle #2c68c0 #808898 #e8e0b0 1 - fin sharp spikes,fins
Fluffin|BEAST GALE|40 45 40 56 35|255|50|L18>11|Puffball Bird|It is mostly fluff. On windy days it simply lets the breeze carry it home.|bird #f0e0c0 #f0a040 #fff8e8 0.55 - fluff big -
Skyroost|BEAST GALE|63 60 55 71 50|120|113|L36>12|Cliff Hawk|It nests on high cliffs and dives at speeds that make the air whistle.|bird #c89860 #e04838 #f8e8c8 0.78 - fluff sharp crest
Tempestrel|BEAST GALE|83 80 75 101 70|45|172|-|Storm Raptor|Its wingbeats summon gusts that flatten tall grass for a mile around.|bird #a87848 #f8d040 #f8e8c8 1 - fluff sharp crest,wings
Nibbit|BEAST|30 56 35 72 25|255|51|L20>14|Nibbler|It gnaws on anything, signposts included. Its front teeth never stop growing.|quad #a07850 #e8c8a0 #f0e0c8 0.55 round plain round whiskers,teeth
Gnawlord|BEAST|55 81 60 97 50|127|116|-|Burrow Boss|It rules tunnel towns that stretch for miles beneath quiet farmland.|quad #806040 #e0b880 #f0d8b0 0.78 round plain sharp whiskers,teeth,stripes
Larvule|SWARM|45 30 35 45 20|255|53|L7>16|Leaf Larva|It munches leaves from dawn to dusk. Its stubby feet grip any branch.|insect #88c848 #f8d040 #e8f8c0 0.5 - - big antenna
Cocoonix|SWARM|50 20 55 30 25|120|72|L10>17|Silk Pod|It hangs from a silk thread, perfectly still, while it remakes itself inside.|blob #a8b858 #f0f0d0 #e0e8b0 0.6 - - sleepy silk
Glimmoth|SWARM MIND|60 45 50 70 80|45|160|-|Lamp Moth|Its wing dust sparkles like starlight. Lost travelers follow its gentle glow home.|moth #f0d0e8 #f8f080 #fff8ff 0.85 - - big gem
Thornet|SWARM TOXIN|40 35 30 50 20|255|52|L7>19|Briar Grub|It hides among rose bushes. The stinger on its tail looks exactly like a thorn.|insect #c8a040 #a050b8 #f0e0b0 0.5 - - sharp stinger
Hivecap|SWARM TOXIN|45 25 50 35 25|120|71|L10>20|Hive Shell|Its papery shell hardens in a day. It waits inside, humming a single note.|blob #d8b858 #8a5aa0 #f0e0b0 0.6 - - sleepy stripes
Vespire|SWARM TOXIN|65 85 40 75 45|45|159|-|Thorn Wasp|Swarms of Vespire guard wild orchards and chase off any greedy picker.|moth #70a838 #8838a8 #d8e8a0 0.88 - - sharp stinger,stripes
Pecklet|BEAST GALE|40 60 30 70 31|255|52|L20>22|Pecking Finch|Small but feisty. It pecks at anything shiny, then flees shrieking.|bird #b88050 #f05040 #f0d8b8 0.52 - fluff sharp -
Lancebeak|BEAST GALE|65 90 65 100 61|90|155|-|Spear Bird|Its long beak can spear a fish from high above the water in one dive.|bird #a06838 #f0c040 #f0d8b8 0.9 - fluff sharp crest,beak
Coilkit|TOXIN|35 60 44 55 40|255|58|L22>24|Coil Snake|It coils in sunny grass, rattling its tail tip to warn away larger Wildkin.|serpent #a868c0 #f0d040 #e8d8f0 0.55 - - round -
Venomaw|TOXIN|60 85 69 80 65|90|147|-|Fang Cobra|The pattern on its hood shifts when it is angry. Its glare freezes prey solid.|serpent #8040a8 #f0c030 #e0c8f0 0.9 - - sharp fins
Zapling|VOLT|35 55 30 90 50|190|82|L26>26|Spark Pup|Static builds up in its fur. Petting it is a truly shocking experience.|quad #f0d040 #384870 #fff4c0 0.56 point bolt big cheeks
Stormane|VOLT|60 90 55 110 90|75|168|-|Storm Wolf|Thunderheads gather above a pack of Stormane right before they hunt.|quad #e8c030 #2c3860 #fff0b0 0.88 point bolt sharp mane
Dunemole|EARTH|30 55 35 75 35|255|60|L26>28|Sand Mole|It surfaces only to sniff the air. Farmers welcome it for loosening hard soil.|quad #c89868 #f0a0a0 #f0e0c8 0.5 round none sleepy claws
Quarrymole|EARTH|55 85 55 105 55|90|150|-|Dig Mole|A family of Quarrymole can carve a tunnel through a hill overnight.|quad #a07848 #f09090 #e8d8b8 0.82 round none sharp claws,stripes
Thistlet|TOXIN|50 47 52 41 40|235|59|L16>30|Spine Cub|The poison barbs on its back stand up whenever it feels threatened.|quad #88b8d8 #6058a8 #e0f0f8 0.52 point plain round spikes
Brambrisk|TOXIN|70 62 67 56 55|120|117|I:dusk>31|Spine Hound|Its barbs grow back stronger each time they break. It is gentle with friends.|quad #6898c0 #4840a0 #d8e8f0 0.76 point plain sharp spikes
Thornmarch|TOXIN EARTH|90 82 87 76 75|45|194|-|Spine Monarch|Heavy armored plates cover its back. Its tail swing can topple a tree.|brute #4878a8 #383088 #d0e0f0 1 point - sharp spikes,horns
Clodcalf|EARTH|60 70 65 35 30|200|65|L28>33|Mud Calf|It loves wallowing in mud. A thick coat of dried clay keeps it cool.|quad #b08860 #e0d0b0 #e8d8c0 0.6 round plain round horns
Rhinoxen|EARTH|85 95 90 45 40|90|155|L42>34|Plains Rhino|It charges in a straight line and cannot turn until it hits something.|quad #988068 #f0e8d0 #d8c8b0 0.84 round plain sharp horns,tusks
Ironox|EARTH STONE|105 125 115 50 45|45|215|-|Iron Bull|Its horns are harder than steel. Miners follow its trail to find ore veins.|quad #787088 #e0d0a0 #a8a0b8 1 round plain sharp horns,tusks,spikes
Puffmote|BEAST|70 45 48 35 60|150|68|I:dusk>36|Moon Mote|It floats down from the hills on full-moon nights to dance in the meadows.|blob #f8d0e0 #b8a0f0 #fff0f8 0.55 - - big halo
Lunapuff|BEAST|95 70 73 60 85|25|129|-|Moon Dancer|It is said to sing to the moon. Those who hear it sleep without bad dreams.|biped #f0b8d8 #a088e8 #fff0f8 0.82 round fluff sleepy halo
Emberfen|FLAME|38 41 40 65 60|190|63|I:cinder>38|Ember Fox|It is born with one tail. Each flame on its tail flickers with a different color.|quad #e89048 #fff070 #fff0d0 0.55 point flame big -
Solfennec|FLAME|73 76 75 100 100|75|178|-|Sun Fox|Its many flame tails light up the night desert like a lantern parade.|quad #f0b050 #ff7030 #fff4d8 0.9 point flame sharp mane
Hummaloon|BEAST|115 45 20 20 25|170|76|I:dusk>40|Song Balloon|It puffs up and hums a soft tune. If you hum back, it bobs along happily.|orb #f8b0c8 #f8f0f8 #fff0f4 0.55 - - big cheeks
Choralloon|BEAST|140 70 45 45 50|50|109|-|Choir Balloon|Its voice can fill a valley. A whole meadow of Wildkin naps when it sings.|orb #f090b0 #fff0f8 #fff0f4 0.85 round - sleepy cheeks,halo
Duskbat|TOXIN GALE|40 45 35 55 40|255|54|L22>42|Cave Bat|It has no eyes and finds its way by squeaks too high for people to hear.|ghost #7868b8 #58c8e0 #a898d8 0.55 point - sleepy wings,teeth
Nocturne|TOXIN GALE|75 80 70 90 75|90|171|-|Night Bat|It drinks nectar by night and guards caves by day. Its screech can crack glass.|ghost #604898 #f05878 #9080c8 0.9 point - sharp wings,teeth
Budling|LEAF TOXIN|45 50 55 30 75|255|78|L21>44|Bulb Sprout|By day it buries itself to the neck. At night it wanders, scattering seeds.|plant #78c858 #5890d8 #e8f8d0 0.5 - - round flower
Wiltbloom|LEAF TOXIN|60 65 70 40 85|120|132|I:sprout>45|Drool Bloom|Its petals ooze a sweet, sticky nectar that smells sour from up close.|plant #68a848 #d06080 #e0f0c8 0.75 - - sleepy flower,spots
Rafflare|LEAF TOXIN|75 80 85 50 100|45|184|-|Giant Bloom|Its petals are huge. When they open, pollen drifts for a mile downwind.|plant #589840 #f04848 #e0f0c8 0.98 - - sharp flower,spots
Sporekin|SWARM LEAF|35 70 55 25 55|190|70|L24>47|Mushroom Bug|Mushrooms sprout from its back. It puffs drowsy spores when it gets nervous.|beetle #e8a050 #f0e0c8 #fff0e0 0.52 - - sleepy cap,spots
Fungrave|SWARM LEAF|60 95 80 30 80|75|128|-|Spore Bug|The mushroom on its back has taken over. It drifts toward damp, dark places.|beetle #d07838 #f8e8d0 #fff0e0 0.86 - - sleepy cap,spots
Fuzzmoth|SWARM TOXIN|60 55 50 45 40|190|75|L31>49|Fuzz Bug|Its huge eyes see in the dark. Fine hairs on its body sting if you touch them.|insect #8858c0 #f05878 #d8c8f0 0.55 - - big antenna,spots
Lunamoth|SWARM TOXIN|70 65 60 90 90|75|138|-|Moon Moth|It only flies under the moon, scattering silvery scales that make foes dizzy.|moth #c8b8f0 #a050c8 #f8f0ff 0.92 - - round antenna
Cindrip|FLAME|42 52 36 55 62|190|62|L28>51|Lava Drop|A blob of living lava. It leaves little scorch marks wherever it naps.|blob #e85030 #ffd040 #ffb070 0.52 - - round flamehead
Magmole|FLAME EARTH|76 92 76 60 80|75|162|-|Magma Mole|It tunnels through volcano walls, leaving glowing burrows behind it.|quad #6c4848 #ff8830 #ffc070 0.86 round none sleepy spikes,claws
Pursy|BEAST|40 45 35 90 40|255|58|L28>53|Coin Cat|It collects shiny pebbles and hides them under porches all over town.|quad #f0e0b0 #d8a040 #fff8e0 0.55 point plain sharp whiskers,gem
Purrloft|BEAST|65 70 60 115 65|90|154|-|Rooftop Cat|It walks rooftops with perfect balance and naps on chimneys in winter.|quad #c8b8a0 #f0c040 #f0e8d8 0.82 point plain sharp whiskers,gem
Quackle|TIDE|50 52 48 55 50|190|64|L33>55|Fret Duck|It always seems to have a headache. When the throbbing peaks, odd things happen.|bird #f0d048 #70b0e0 #fff8d0 0.58 - fluff sleepy -
Mallarch|TIDE MIND|80 82 78 85 80|75|175|-|Seer Duck|It swims in still lakes and calms the water with a glance of its red eyes.|bird #3878c8 #f05850 #d8e8f8 0.9 - fluff sharp crest
Scrapape|BRAWL|40 80 35 70 35|190|74|L28>57|Scrap Monkey|It is always angry about something. It swings from branch to branch, scolding.|biped #e8d8c0 #b08860 #fff8f0 0.55 round plain sharp -
Furyape|BRAWL|65 105 60 95 60|75|149|-|Fury Ape|Once it starts brawling it will not stop, even if it has to chase foes for days.|brute #d8c8b0 #a07050 #f8f0e8 0.88 round - sharp beard
Pyropup|FLAME|55 70 45 60 50|190|91|I:cinder>59|Ember Puppy|Loyal and brave. It barks smoke rings at strangers until they leave its yard.|quad #f08840 #2a2238 #f8e8c8 0.6 round fluff big stripes
Pyrehound|FLAME|90 110 80 95 80|75|213|-|Blaze Hound|An ancient breed that runs so fast its paws leave little burning prints.|quad #e86830 #2a2238 #f8e8c8 0.95 round fluff sharp stripes,mane
Pondlet|TIDE|40 50 40 90 40|255|77|L25>61|Pond Tadpole|Its thin skin shows the shadow of its insides. Its round tail is a strong kick.|fish #6888e0 #f8f8f8 #e0e8ff 0.52 - - big -
Croakard|TIDE|65 65 65 90 50|120|131|I:ripple>62|Pond Frog|It can live on land or water. It croaks a deep note that ripples ponds.|biped #5878d0 #f8f8f8 #e0e8ff 0.75 - - round -
Bulwfrog|TIDE BRAWL|90 85 95 70 70|45|185|-|Brawl Frog|A swimmer with mighty arms. It can paddle across an entire lake without rest.|brute #4060b8 #f8f8f8 #e0e8ff 0.95 - - sharp -
Psyquill|MIND|25 20 15 90 105|200|73|L16>64|Seer Chick|It stares at a spot on the wall for hours. Some say it watches tomorrow.|bird #58c8b8 #f070a0 #e8fff8 0.56 - fluff big crest
Augurowl|MIND|40 35 30 105 120|100|145|L36>65|Seer Owl|Its eyes glow when it predicts something. It is never wrong about the weather.|bird #48a8a0 #f060a0 #e0f8f0 0.8 - fluff sleepy crest,gem
Oracleon|MIND|55 50 45 120 135|50|186|-|Oracle|It speaks in riddles that always come true. Scholars travel far to listen.|biped #3c9890 #f060a0 #e0f8f0 0.95 fin - sleepy gem,collar
Grapplet|BRAWL|70 80 50 35 35|180|88|L28>67|Grip Kid|It trains all day by lifting stones bigger than itself. It never skips a day.|brute #a8b0c8 #e05848 #e8ecf8 0.58 - - round -
Brawnox|BRAWL|80 100 70 45 50|90|146|L40>68|Power Lifter|It wears a belt to hold back its strength. Taking it off is a bad sign.|brute #9098b8 #f0c040 #e0e4f4 0.82 - - sharp -
Titanox|BRAWL|90 130 80 55 65|45|193|-|Titan|Four arms, each able to toss a boulder. It moves with surprising grace.|brute #7880a8 #f0c040 #d8dcf0 1 - - sharp horns
Vinelet|LEAF TOXIN|50 75 35 40 70|255|84|L21>70|Vine Sprout|A thin plant with a gaping mouth. It snatches bugs out of the air.|plant #b8d850 #f07858 #f0f8d0 0.5 - - big flower
Snaptrap|LEAF TOXIN|65 90 50 55 85|120|151|I:sprout>71|Snap Flower|It hangs from branches and waits. Its leaves snap shut like a trap.|plant #a8c840 #e85848 #e8f0c8 0.75 - - sharp flower,teeth
Gulpvine|LEAF TOXIN|80 105 65 70 100|45|191|-|Gulp Flower|Its sweet scent lures prey into its wide mouth. It lives deep in old jungles.|plant #88b030 #d04040 #e0e8c0 0.98 - - sharp flower,teeth,spots
Jellune|TIDE TOXIN|40 40 35 70 100|190|105|L30>73|Drift Jelly|It drifts in warm shallows. Its dangling tentacles carry a stinging venom.|jelly #a8d8f8 #f05878 #e8f8ff 0.55 - - round -
Medusail|TIDE TOXIN|80 70 65 100 120|60|205|-|Sail Jelly|Dozens of tentacles trail behind it. A swarm can turn the sea pink at dusk.|jelly #78b8f0 #e83858 #d8f0ff 0.92 - - sharp gem
Pebbit|STONE EARTH|40 80 100 20 30|255|86|L25>75|Pebble|Often mistaken for an ordinary rock, at least until somebody trips over it.|golem #9890a0 #706878 #c8c0c8 0.55 - - round -
Bouldrake|STONE EARTH|55 95 115 35 45|120|134|L40>76|Boulder|It rolls down mountain slopes on purpose. Avalanches seem to follow its moods.|golem #888098 #c09050 #b8b0c0 0.8 - - sharp spikes
Megalith|STONE EARTH|80 115 130 45 55|45|177|-|Megalith|Its body is a hill of fused stone. It sheds an old rock skin once a year.|golem #787088 #d0a050 #a8a0b8 1 - - sharp spikes,horns
Embercolt|FLAME|50 85 55 90 65|190|152|L40>78|Ember Colt|It can barely walk at birth, but it chases its parents within an hour.|quad #f8e0b0 #f87030 #fff8e8 0.66 point flame big mane
Blazesteed|FLAME|65 100 70 105 80|60|192|-|Blaze Steed|Its fiery mane streams behind it. It gallops faster than a bullet train.|quad #f0d098 #f05028 #fff4e0 0.98 point flame sharp mane,horns
Drowsel|TIDE MIND|90 65 65 15 40|190|99|L37>80|Doze Pup|Incredibly slow. It takes a whole second to notice it has been bitten.|quad #f8a8c0 #f8e8d0 #fff0f4 0.58 round plain sleepy -
Dozelord|TIDE MIND|95 75 110 30 80|75|164|-|Shell Dozer|A shell clamped to its tail keeps it from waking up. It has never minded.|turtle #f090b0 #c8c0d0 #fff0f4 0.92 round plain sleepy spikes
Coilorb|VOLT|25 35 70 45 95|190|89|L30>82|Coil Orb|It floats using electric fields. It is drawn to power lines and old batteries.|orb #b8c0d0 #f0d040 #e8ecf4 0.5 - - round bolt
Dynacoil|VOLT|50 60 95 70 120|60|161|-|Dyna Orb|Three linked orbs that hum together. Their field can stop a compass dead.|orb #98a0b8 #f0c830 #e0e4f0 0.85 - - sharp bolt,gem
Bladewing|BEAST GALE|52 65 55 60 58|45|94|-|Reed Knight|It carries a sharp reed it uses like a sword. It never parts with its blade.|bird #b89868 #68a848 #f0e0c8 0.7 - fluff sharp crest,club
Dashbird|BEAST GALE|35 85 45 75 35|190|96|L31>85|Runner Bird|It cannot fly, but its legs are strong enough to outrun a galloping horse.|bird #c89860 #e05048 #f0e0c8 0.58 - - big -
Galesprint|BEAST GALE|60 110 70 100 60|45|158|-|Gale Runner|It sprints across grassland so fast that its feet barely touch the ground.|bird #b07848 #d83838 #f0e0c8 0.92 - fluff sharp crest
Sealpup|TIDE|65 45 55 45 70|190|100|L34>87|Seal Pup|A horn of ice grows on its brow. It loves to sunbathe on frozen floes.|fish #e8f0f8 #a8c8e8 #ffffff 0.56 - - big horns
Glacieal|TIDE FROST|90 70 80 70 95|75|176|-|Glacier Seal|It sings an eerie song beneath the ice. Sailors swear it guides lost ships.|fish #d8e8f8 #6898d8 #ffffff 0.92 - - sharp horns,fins
Oozle|TOXIN|80 80 50 25 40|190|90|L38>89|Sludge|It was born from runoff near the old factories. It loves the smell of rust.|blob #a878c8 #68d048 #d8c8e8 0.58 - - round -
Sludgemaw|TOXIN|105 105 75 50 65|75|157|-|Sludge Mass|Wherever it oozes, plants wilt. It is strangely affectionate, though.|blob #8858b0 #58c038 #c8b8e0 0.95 - - sleepy teeth
Clamlet|TIDE|30 65 100 40 45|190|97|I:ripple>91|Spike Clam|Its shell is harder than diamond. It sticks out its tongue to tease foes.|clam #9878c8 #f0d0e0 #f8f0ff 0.55 - - big -
Pearlfort|TIDE FROST|50 95 180 70 85|60|203|-|Pearl Fort|A fortress of a shell. Inside it hides a pearl that glows in the deep sea.|clam #7058b0 #d8e8f8 #f8f0ff 0.95 - - sharp spikes,gem
Wispet|SHADE TOXIN|30 35 30 80 100|190|95|L25>93|Wisp|A puff of shadow that giggles in empty halls. Harmless, mostly.|ghost #8068c0 #f0e060 #b0a0e0 0.55 - - big -
Phantail|SHADE TOXIN|45 50 45 95 115|90|126|L40>94|Specter|Its long tail fades into smoke. It slips through walls to play pranks.|ghost #5c48a0 #f04878 #9080d0 0.8 - - sharp horns
Duskwraith|SHADE TOXIN|60 65 60 110 130|45|190|-|Wraith|On moonless nights it hides in shadows and steals the warmth of passersby.|ghost #483890 #f04070 #8070c0 1 point - sharp horns,teeth
Graniteel|STONE EARTH|35 45 160 70 30|45|108|-|Stone Eel|A chain of boulders that tunnels through rock at the speed of a train.|serpent #908898 #686078 #c0b8c8 1 - - sharp spikes
Dreamtap|MIND|60 48 45 42 90|190|102|L26>97|Dream Tapir|It sniffs out good dreams and nibbles them. Nightmares give it a stomach ache.|quad #f0d070 #8a6aa8 #fff4d0 0.6 round plain sleepy -
Hypnotapir|MIND|85 73 70 67 115|75|165|-|Trance Tapir|It sways a glowing tail tip back and forth. Watching it makes you drowsy.|biped #e8c058 #7a5aa0 #fff0c8 0.92 round plain sleepy gem
Pinchet|TIDE|30 105 90 50 25|225|115|L28>99|Pinch Crab|It digs into beach sand. If it loses a claw, a new one grows back in a week.|crab #e86848 #f0d0a0 #f8e8d8 0.55 - - big -
Clawlord|TIDE|55 130 115 75 50|60|206|-|Big Claw|One claw is huge. It weighs more than the rest of the crab put together.|crab #d84838 #f0c890 #f8e0d0 0.92 - - sharp spikes
Zappod|VOLT|40 30 50 100 55|190|103|L30>101|Spark Pod|It looks like a seed pod but bursts with sparks if anyone squeezes it.|orb #e85848 #f8f8f8 #fff0f0 0.5 - - sharp bolt
Thunderpod|VOLT|60 50 70 140 80|60|150|-|Storm Pod|It stores lightning in its shell and rolls around crackling with energy.|orb #f8f8f8 #e04848 #fff0f0 0.8 - - sharp bolt,teeth
Nutlet|LEAF MIND|60 40 80 40 60|90|98|I:sprout>103|Nut Cluster|A cluster of nuts that talk among themselves. They decide everything together.|blob #f0e0c8 #88b858 #fff8f0 0.55 - - round leafhead
Coconsage|LEAF MIND|95 95 85 55 125|45|212|-|Palm Sage|A walking palm. Its three heads argue, but it always acts as one.|plant #f0d8a8 #58a848 #fff8f0 1 - - sleepy leafhead,gem
Fossipup|EARTH|50 50 95 35 40|190|87|L28>105|Fossil Pup|It wears the skull of an ancient Wildkin. It howls at the moon for its lost kin.|quad #c8b8a0 #f0f0e8 #f0e8d8 0.56 round plain round mask
Bonehound|EARTH|60 80 110 45 50|75|124|-|Bone Hound|It carries a bone club. Years of grief have made it tough and fearless.|brute #b0a088 #f0f0e8 #e8e0d0 0.86 round - sharp mask,club
Kickwell|BRAWL|50 120 53 87 35|45|139|-|Kick Master|Its legs stretch like springs. It can deliver a kick from across a room.|brute #c8a070 #e84838 #f0e0c8 0.85 - - sharp -
Jabster|BRAWL|50 105 79 76 35|45|140|-|Jab Master|Its fists move faster than the eye can follow. It practices on falling leaves.|brute #a88868 #4870d0 #f0e0c8 0.85 - - sharp -
Lazyloth|BEAST|90 55 75 30 60|45|127|-|Lazy Sloth|It dangles from branches all day, eating whatever drifts within reach.|biped #c8b088 #f0e0c0 #f8f0e0 0.82 round - sleepy claws
Smogpuff|TOXIN|40 65 95 35 60|190|114|L35>110|Smog Cloud|A floating ball of fumes. It drifts toward kitchens and chimney smoke.|orb #a088c0 #f0d050 #d8c8e8 0.58 - - round cloud
Smogcloud|TOXIN|65 90 120 60 85|60|173|-|Twin Smog|Two clouds merged into one. The fumes inside grow thicker on still days.|orb #806898 #f0c040 #c8b8d8 0.92 - - sharp cloud,teeth
Armadil|EARTH STONE|80 85 95 25 30|120|135|L42>112|Rock Armadillo|It rolls into an armored ball and bowls straight through anything in its way.|beetle #a89880 #706858 #d8d0c0 0.62 - - round spikes
Armadrill|EARTH STONE|105 130 120 40 45|60|204|-|Drill Armadillo|A drill grows on its snout. It bores through solid bedrock in seconds.|beetle #908068 #c0a060 #c8c0b0 1 - - sharp spikes,horns
Mendlamb|BEAST|250 5 5 50 105|30|255|-|Mend Lamb|Its soft wool soothes wounds. A HAVEN that has one never runs out of smiles.|blob #fff4f8 #f8a0c0 #ffffff 0.7 round - big halo
Tanglewick|LEAF|65 55 115 60 100|45|166|-|Vine Tangle|A knot of blue vines. Nobody has ever found out what is inside.|plant #4878c8 #e84868 #c8d8f0 0.82 - - sharp vines
Pouchroo|BEAST|105 95 80 90 40|45|175|-|Pouch Roo|It carries its baby in a belly pouch and boxes anyone who comes too close.|brute #b88858 #f0d8a8 #f0e0c8 0.92 long - sharp -
Seasprig|TIDE|30 40 70 60 70|225|83|L32>117|Reef Sprite|It anchors itself to coral with its curled tail and spits ink at intruders.|serpent #58a8e8 #f8e070 #e0f0ff 0.5 - - big fins
Tidesteed|TIDE|55 65 95 85 95|75|155|-|Reef Steed|Its sharp fins cut through currents. Its spines can pierce a diving suit.|serpent #3888d8 #f8d050 #d8ecff 0.88 - - sharp fins,spikes
Finnet|TIDE|45 67 60 63 50|225|111|L33>119|Ribbon Fish|Its tail fin waves like a ribbon. In spring, schools of Finnet sparkle upstream.|fish #f8f8f8 #f07040 #fff8f0 0.55 - - round horns
Crownfin|TIDE|80 92 65 68 80|60|170|-|Crown Fish|The horn on its head is a sign of the river's king. It defends its nest fiercely.|fish #f8e8e0 #e85030 #fff8f0 0.88 - - sharp horns,fins
Starlet|TIDE|30 45 55 85 70|225|106|I:ripple>121|Star Sprite|A tiny star that washes up on beaches. Its core blinks in the dark.|star #e0b070 #f04858 #fff0e0 0.55 - - - gem
Starmind|TIDE MIND|60 75 85 115 100|60|207|-|Star Sage|Its core glows in seven colors. Some call it a messenger from the sky.|star #9070c0 #f04858 #f0e8ff 0.9 - - - gem
Mimeon|MIND|40 45 65 90 100|45|136|-|Mime|It mimes invisible walls so well that they actually start to exist.|biped #f0b0c8 #5878d8 #fff8fc 0.82 round - round cheeks
Scythid|SWARM GALE|70 110 80 105 55|45|187|-|Blade Mantis|Its scythes are sharp enough to cut a falling leaf in two before it lands.|insect #68c048 #e8f0d0 #e0f0c0 0.9 - - sharp wings,claws
Frostwaltz|FROST MIND|65 50 35 95 95|45|137|-|Frost Dancer|It glides across frozen lakes in slow spirals. Snow follows its steps.|biped #c8a8e8 #78d0f0 #f8f0ff 0.85 long - sleepy gem
Voltboxer|VOLT|65 83 57 105 85|45|156|-|Volt Boxer|It hangs around power stations and punches the air until sparks fly.|brute #f0d048 #383848 #fff4c8 0.88 point - sharp bolt
Magmaw|FLAME|65 95 57 93 85|45|167|-|Magma Imp|Born in a volcano's heart, it burns at a heat that melts iron.|brute #f06838 #ffd040 #ffe0a8 0.88 point - sharp flamehead
Pincerbeet|SWARM|65 125 100 85 55|45|200|-|Pincer Beetle|Its horns can lift a log twice its weight. It brawls for the best tree sap.|beetle #a88060 #e8e0d0 #d8c8b8 0.88 - - sharp horns
Wildbull|BEAST|75 100 95 110 70|45|211|-|Wild Bull|Bulls of this kind whip their three tails before a charge. Herds rumble at dawn.|quad #a07040 #4a3020 #d8b890 0.95 round plain sharp horns
Mudgill|TIDE|20 10 55 80 20|255|20|L20>130|Mud Fish|It flops around weakly in shallow water. Nearly everyone underestimates it.|fish #d07848 #f8e060 #f8e0c8 0.52 - - big whiskers
Swamplash|TIDE WYRM|95 125 79 81 100|45|214|-|Bog Serpent|It rises from the swamp in a rage that can flatten a whole village.|serpent #3868a8 #f0d040 #d8e0f0 1 - - sharp fins,horns,teeth
Glidelyn|TIDE FROST|130 85 80 60 95|45|219|-|Ferry Lyn|It carries travelers across the sea on its back. It loves to sing to the moon.|turtle #58a0e0 #d8d0c8 #f0f8ff 0.95 round fin round horns
Gloopy|BEAST|48 48 48 48 48|35|61|-|Goop|A blob that copies the shape of anything it sees, but never quite gets it right.|blob #c8a0e8 #f8f0ff #f0e8ff 0.55 - - sleepy -
Kitmote|BEAST|55 55 50 55 65|45|92|I:cinder>134,I:ripple>135,I:spark>136|Change Kit|Its unstable makeup lets it adapt to many places. Shards change it for good.|quad #c89868 #f8f0e0 #f8f0e0 0.58 long fluff big collar
Flarekit|FLAME|65 130 60 65 110|45|198|-|Flame Kit|It stores heat in its fluffy collar. Its body can reach the heat of a forge.|quad #f07838 #fff0a0 #fff4d8 0.86 long fluff sharp collar,mane
Ripplekit|TIDE|130 65 60 65 110|45|196|-|Ripple Kit|Its cells are like water. When it dives into a lake it all but disappears.|quad #58a8e8 #f8f0e0 #e8f4ff 0.86 long fin round collar,fins
Sparkit|VOLT|65 65 60 130 110|45|197|-|Spark Kit|Its fur stands up in needles that crackle with charge when it is angry.|quad #f0d040 #fff8e0 #fff8e0 0.86 long bolt sharp collar,spikes
Pixelon|BEAST|65 60 70 40 75|45|130|-|Pixel Form|A Wildkin built from light by curious scientists. It can live inside screens.|golem #f070a0 #58c0e8 #f8e8f0 0.8 - - round gem
Spiralith|STONE TIDE|35 40 100 35 90|45|120|L40>139|Spiral Fossil|A revived ancient Wildkin. It swam in shallow seas long, long ago.|clam #b8a888 #58a0d8 #e8e0d0 0.58 - - big spiral
Spiralord|STONE TIDE|70 60 125 55 115|45|199|-|Spiral Lord|Its heavy shell made it slow, and that may be why it vanished from the seas.|clam #a09070 #3880c8 #e0d8c8 0.95 - - sharp spiral,spikes
Shellith|STONE TIDE|30 80 90 55 45|45|119|L40>141|Shell Fossil|A revived ancient Wildkin. It hid on the sea floor, peering up from its shell.|crab #a89878 #e8b060 #e0d8c8 0.55 - - big -
Shellord|STONE TIDE|60 115 105 80 70|45|201|-|Shell Lord|It swam with great speed and slashed prey with sickle claws.|crab #908060 #e0a050 #d8d0c0 0.95 - - sharp spikes
Pterolith|STONE GALE|80 105 65 130 60|45|202|-|Amber Wing|Revived from amber. It soars with a shrill cry, its jaws full of jagged teeth.|wyrm #9888a0 #b8a0d0 #e0d8e8 0.95 - - sharp wings,teeth
Slumbear|BEAST|160 110 65 30 65|25|154|-|Sleeper|It eats a whole orchard in a sitting, then naps for days in the middle of the road.|blob #586878 #f0e0c0 #f0e8d8 1 round - sleepy teeth
Galecrest|FROST GALE|90 85 100 85 125|3|215|-|Frost Raptor|A legend of the northern isles. Its wingbeats chill the air into falling snow.|bird #88b8e8 #f8f8ff #e0f0ff 1 - fluff sharp crest,wings
Voltwing|VOLT GALE|90 90 85 100 125|3|216|-|Storm Raptor|A legend of the storms. Lightning flashes around it whenever it takes flight.|bird #f0d040 #383848 #fff4c0 1 - bolt sharp crest,wings
Solmara|FLAME GALE|90 100 90 90 125|3|217|-|Dawn Phoenix|Legends say its first flight lit the very first sunrise over Varrow.|bird #ff9838 #fff070 #ffe8c0 1 - flame sharp crest,gem,flamehead
Wyrmlet|WYRM|41 64 45 50 50|45|67|L30>148|Wyrm Hatchling|Long thought a myth. It sheds its skin as it grows and lives in hidden lakes.|serpent #6888e8 #f8f8f8 #e0e8ff 0.55 - - big fins
Dragonet|WYRM|61 84 65 70 70|45|144|L55>149|Wyrm|It glides through the air with a mystic aura that can change the weather.|serpent #4870e0 #f8f8f8 #d8e0ff 0.85 fin - round fins,gem
Skywyrm|WYRM GALE|91 134 95 80 100|45|218|-|Sky Wyrm|It can circle the world in hours. It guides lost ships home through storms.|wyrm #e8a040 #68b048 #f8e0b0 1 - - sharp wings,horns
Nullmind|MIND|106 110 90 130 154|3|220|-|Rift Mind|A primordial Wildkin sealed beyond the rift. Its mind is vast and very lonely.|biped #b8a8d8 #6848a8 #e8e0f4 1 point plain sharp gem,halo
Origen|MIND|100 100 100 100 100|45|64|-|First Spark|Said to carry the essence of every Wildkin. It appears only to true researchers.|blob #f8c8e8 #a0d8f8 #fff4fc 0.6 long plain big halo,gem
`;

function parseArt(s: string): ArtSpec {
  const [arch, c1, c2, c3, size, ears, tail, eyes, extra] = s.trim().split(/\s+/);
  const opt = <T extends string>(v: string | undefined) => (v && v !== '-' ? (v as T) : undefined);
  return {
    arch: arch as Arch,
    c1,
    c2,
    c3,
    size: parseFloat(size),
    ears: opt(ears),
    tail: opt(tail),
    eyes: opt(eyes),
    extra: extra && extra !== '-' ? extra.split(',') : [],
  };
}

function parseEvos(s: string): Evolution[] {
  if (s.trim() === '-') return [];
  return s.split(',').map((t) => {
    const [cond, to] = t.split('>');
    if (cond.startsWith('L')) return { to: parseInt(to), lvl: parseInt(cond.slice(1)) };
    return { to: parseInt(to), item: cond.slice(2) };
  });
}

const S: Species[] = DATA.trim()
  .split('\n')
  .map((line, i) => {
    const f = line.split('|');
    const base = f[2].split(' ').map(Number) as Species['base'];
    const evos = parseEvos(f[5]);
    const lv = evos.find((e) => e.lvl);
    return {
      id: i + 1,
      name: f[0],
      types: f[1].split(' ') as Element[],
      base,
      catchRate: parseInt(f[3]),
      expYield: parseInt(f[4]),
      evos,
      evo: lv ? { lvl: lv.lvl!, to: lv.to } : undefined,
      kind: f[6],
      dex: f[7],
      art: parseArt(f[8]),
      learn: [],
      stage: 0,
      legendary: parseInt(f[3]) <= 3,
    };
  });

// family stages
for (const s of S) for (const e of s.evos) S[e.to - 1].stage = Math.max(S[e.to - 1].stage, s.stage + 1);
for (const s of S) for (const e of s.evos) S[e.to - 1].stage = Math.max(S[e.to - 1].stage, s.stage + 1);

/** The species this one evolves from, if any. */
export function prevolution(id: number): Species | undefined {
  return S.find((s) => s.evos.some((e) => e.to === id));
}

for (const s of S) {
  const pre = prevolution(s.id);
  const preLvl = pre?.evos.find((e) => e.to === s.id)?.lvl;
  s.learn = generateLearnset(s, preLvl ?? (pre ? 25 : 0));
}

export const SPECIES: Record<number, Species> = Object.fromEntries(S.map((s) => [s.id, s]));
export const SPECIES_COUNT = S.length;
export const ALL_SPECIES = S;

export function species(id: number): Species {
  const s = SPECIES[id];
  if (!s) throw new Error('Unknown species ' + id);
  return s;
}

export function speciesByName(name: string): number {
  const s = S.find((x) => x.name.toUpperCase() === name.toUpperCase());
  if (!s) throw new Error('Unknown species name ' + name);
  return s.id;
}

/** Name-keyed ids for scripts: SP.EMBERKIT etc. */
export const SP: Record<string, number> = new Proxy({} as Record<string, number>, {
  get: (_t, k: string) => speciesByName(k),
});
