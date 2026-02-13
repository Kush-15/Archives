export interface Product {
  id: string;
  name: string;
  tagline: string;
  description: string;
  longDescription: string;
  price: number;
  rating: number;
  ratingCount: number;
  category: 'audio' | 'computing' | 'photography' | 'gaming' | 'television';
  era: '1950s' | '1960s' | '1970s' | '1980s' | '1990s';
  year: number;
  specs: { label: string; value: string }[];
  images: string[];
  featured: boolean;
  new: boolean;
  color: string;
}

export const products: Product[] = [
  {
    id: 'sony-walkman-tps-l2',
    name: 'Sony Walkman TPS-L2',
    tagline: 'The device that changed how we listen',
    description: 'The original Sony Walkman, released in 1979. A revolutionary portable cassette player that defined a generation.',
    longDescription: 'The Sony Walkman TPS-L2 was not merely a product; it was a cultural watershed. Introduced on July 1, 1979, this portable cassette player fundamentally transformed the relationship between humans and music. For the first time, one could carry a personal soundtrack through the urban landscape, creating an intimate bubble of sound in public spaces. The blue and silver unit, with its distinctive orange "Hotline" button for sharing music between two headphone users, remains an icon of late 20th-century industrial design.',
    price: 2400,
    rating: 4.8,
    ratingCount: 132,
    category: 'audio',
    era: '1970s',
    year: 1979,
    specs: [
      { label: 'Dimensions', value: '88 × 133.5 × 29 mm' },
      { label: 'Weight', value: '390g (with batteries)' },
      { label: 'Power', value: '2× AA batteries' },
      { label: 'Playback', value: 'Cassette tape' },
      { label: 'Condition', value: 'Restored, Excellent' },
      { label: 'Origin', value: 'Tokyo, Japan' }
    ],
    images: ['https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800'],
    featured: true,
    new: false,
    color: '#1a365d'
  },
  {
    id: 'apple-macintosh-128k',
    name: 'Apple Macintosh 128K',
    tagline: 'Hello. The computer for the rest of us',
    description: 'The original Macintosh, introduced in 1984. The first commercially successful personal computer with a graphical user interface.',
    longDescription: 'On January 24, 1984, Apple Computer introduced the Macintosh—a beige box that would forever alter the trajectory of personal computing. With its revolutionary graphical user interface, built-in 9-inch monochrome display, and mouse-driven interaction paradigm, the Macintosh democratized computing in ways previously unimaginable. This particular unit, with its distinctive "Picasso" signature on the inner case, represents the pure vision of the original design team.',
    price: 4800,
    rating: 4.9,
    ratingCount: 210,
    category: 'computing',
    era: '1980s',
    year: 1984,
    specs: [
      { label: 'Processor', value: 'Motorola 68000 @ 8MHz' },
      { label: 'Memory', value: '128KB RAM' },
      { label: 'Display', value: '9" monochrome, 512×342' },
      { label: 'Storage', value: '400KB floppy drive' },
      { label: 'Condition', value: 'Museum Quality' },
      { label: 'Origin', value: 'Cupertino, California' }
    ],
    images: ['https://images.unsplash.com/photo-1593062096033-9a26b09da705?w=800'],
    featured: true,
    new: true,
    color: '#d4a574'
  },
  {
    id: 'polaroid-sx-70',
    name: 'Polaroid SX-70',
    tagline: 'Instant magic, folded flat',
    description: 'The revolutionary folding SLR instant camera from 1972. An engineering and design masterpiece.',
    longDescription: 'The Polaroid SX-70, introduced in 1972, represents perhaps the most ambitious camera ever produced. A folding single-lens reflex camera that delivers instant photographs, the SX-70 was designed by Henry Dreyfuss Associates and engineered to tolerances previously unknown in consumer electronics. Its chrome and tan leather exterior conceals 400 moving parts and four electric motors, all collapsing into a package barely larger than the photographs it creates.',
    price: 1800,
    rating: 4.6,
    ratingCount: 88,
    category: 'photography',
    era: '1970s',
    year: 1972,
    specs: [
      { label: 'Lens', value: '116mm f/8 (4 elements)' },
      { label: 'Focus', value: '10.4" to infinity' },
      { label: 'Shutter', value: 'Electronic, 1/175 to 14s' },
      { label: 'Film', value: 'SX-70/600 Instant' },
      { label: 'Condition', value: 'Serviced, Excellent' },
      { label: 'Origin', value: 'Massachusetts, USA' }
    ],
    images: ['https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=800'],
    featured: true,
    new: false,
    color: '#8b7355'
  },
  {
    id: 'nintendo-nes',
    name: 'Nintendo Entertainment System',
    tagline: 'Now you\'re playing with power',
    description: 'The console that revived home gaming. Released 1985 in North America.',
    longDescription: 'After the video game crash of 1983, the American market had declared home consoles dead. Nintendo, a century-old playing card company from Kyoto, saw opportunity in the ashes. The Nintendo Entertainment System, with its deliberately un-game-like appearance and revolutionary game library, single-handedly resurrected the home video game industry. This particular unit, complete with original "toaster" styling and R.O.B. port, represents gaming\'s phoenix moment.',
    price: 680,
    rating: 4.4,
    ratingCount: 156,
    category: 'gaming',
    era: '1980s',
    year: 1985,
    specs: [
      { label: 'CPU', value: 'Ricoh 2A03 @ 1.79MHz' },
      { label: 'PPU', value: '52 colors, 64 sprites' },
      { label: 'Resolution', value: '256×240 pixels' },
      { label: 'Audio', value: '5 channels' },
      { label: 'Condition', value: 'Restored, Tested' },
      { label: 'Origin', value: 'Kyoto, Japan' }
    ],
    images: ['https://images.unsplash.com/photo-1531525645387-7f14be1bdbbd?w=800'],
    featured: false,
    new: true,
    color: '#6b7280'
  },
  {
    id: 'braun-t1000',
    name: 'Braun T1000 World Receiver',
    tagline: 'The world in your hands',
    description: 'Dieter Rams\' masterpiece. A multi-band portable radio from 1963.',
    longDescription: 'Designed by Dieter Rams and his team at Braun, the T1000 exemplifies the "less but better" philosophy that would influence generations of industrial designers, including Apple\'s Jony Ive. This professional-grade world receiver, with its precise aluminum controls and logical interface, remains one of the most influential objects of 20th-century design. Each dial click, each band sweep, connects the user to a world of shortwave broadcasts.',
    price: 3200,
    rating: 4.7,
    ratingCount: 67,
    category: 'audio',
    era: '1960s',
    year: 1963,
    specs: [
      { label: 'Bands', value: 'AM/FM/LW/SW (9 bands)' },
      { label: 'Power', value: 'AC/DC/Battery' },
      { label: 'Designer', value: 'Dieter Rams' },
      { label: 'Material', value: 'Aluminum, Steel' },
      { label: 'Condition', value: 'Museum Quality' },
      { label: 'Origin', value: 'Frankfurt, Germany' }
    ],
    images: ['https://images.unsplash.com/photo-1558171813-4c088753af8f?w=800'],
    featured: true,
    new: false,
    color: '#374151'
  },
  {
    id: 'sony-trinitron-kv1310',
    name: 'Sony Trinitron KV-1310',
    tagline: 'One gun. Aperture grille. Revolution.',
    description: 'The television that defined color. Sony\'s revolutionary Trinitron from 1968.',
    longDescription: 'When Sony introduced the Trinitron in 1968, television engineering had plateaued. The single-gun, aperture-grille design offered unprecedented brightness, color saturation, and sharpness compared to the shadow-mask tubes of competitors. This KV-1310, with its walnut cabinet and chrome accents, represents television\'s golden age—when the family gathered around a single screen that was as much furniture as technology.',
    price: 1400,
    rating: 4.2,
    ratingCount: 54,
    category: 'television',
    era: '1960s',
    year: 1968,
    specs: [
      { label: 'Screen', value: '13" Trinitron CRT' },
      { label: 'System', value: 'NTSC Color' },
      { label: 'Technology', value: 'Aperture Grille' },
      { label: 'Cabinet', value: 'Walnut veneer' },
      { label: 'Condition', value: 'Restored, Working' },
      { label: 'Origin', value: 'Tokyo, Japan' }
    ],
    images: ['https://images.unsplash.com/photo-1584905066893-7d5c142ba4e1?w=800'],
    featured: false,
    new: false,
    color: '#78350f'
  },
  {
    id: 'hasselblad-500c',
    name: 'Hasselblad 500C',
    tagline: 'The camera that went to the moon',
    description: 'Swedish precision. Medium format perfection. Introduced 1957.',
    longDescription: 'The Hasselblad 500C, introduced in 1957, established the standard for professional medium format photography. Its modular design—interchangeable magazines, viewfinders, and lenses—made it the choice of studios, fashion photographers, and NASA. Modified versions captured humanity\'s first steps on the moon. This particular unit, with its chrome body and Zeiss Planar lens, continues the Hasselblad tradition of uncompromising quality.',
    price: 2800,
    rating: 4.8,
    ratingCount: 121,
    category: 'photography',
    era: '1950s',
    year: 1957,
    specs: [
      { label: 'Format', value: '6×6 cm (120/220 film)' },
      { label: 'Lens', value: 'Carl Zeiss Planar 80mm f/2.8' },
      { label: 'Shutter', value: 'Compur leaf, 1s-1/500s' },
      { label: 'Mount', value: 'Hasselblad V' },
      { label: 'Condition', value: 'CLA\'d, Excellent' },
      { label: 'Origin', value: 'Gothenburg, Sweden' }
    ],
    images: ['https://images.unsplash.com/photo-1495707902641-75cac588d2e9?w=800'],
    featured: false,
    new: true,
    color: '#1f2937'
  },
  {
    id: 'ibm-model-m',
    name: 'IBM Model M Keyboard',
    tagline: 'The sound of productivity',
    description: 'Buckling spring perfection. The keyboard against which all others are measured.',
    longDescription: 'The IBM Model M, introduced in 1985, set the standard for keyboard excellence that remains unmatched. Its buckling spring mechanism provides tactile feedback and an acoustic signature that has become synonymous with serious computing. Built to industrial standards with a steel backplate and individually replaceable key switches, many Model M keyboards from the 1980s remain in daily use today.',
    price: 380,
    rating: 4.3,
    ratingCount: 74,
    category: 'computing',
    era: '1980s',
    year: 1985,
    specs: [
      { label: 'Switch', value: 'Buckling Spring' },
      { label: 'Layout', value: '101-key US ANSI' },
      { label: 'Interface', value: 'PS/2 (adapter included)' },
      { label: 'Frame', value: 'Steel backplate' },
      { label: 'Condition', value: 'Bolt-modded, Restored' },
      { label: 'Origin', value: 'Lexington, Kentucky' }
    ],
    images: ['https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=800'],
    featured: false,
    new: false,
    color: '#d1d5db'
  },
  {
    id: 'atari-2600',
    name: 'Atari 2600',
    tagline: 'Have you played Atari today?',
    description: 'The console that started it all. Woodgrain and wonder from 1977.',
    longDescription: 'The Atari Video Computer System, later known as the 2600, brought arcade games into the home. Its woodgrain panels and chunky switches gave it the appearance of serious hi-fi equipment, legitimizing video games as living room entertainment. With over 30 million units sold and a library of over 500 games, the 2600 defined an industry and a generation.',
    price: 420,
    rating: 4.1,
    ratingCount: 98,
    category: 'gaming',
    era: '1970s',
    year: 1977,
    specs: [
      { label: 'CPU', value: 'MOS 6507 @ 1.19MHz' },
      { label: 'Graphics', value: 'TIA (128 colors)' },
      { label: 'RAM', value: '128 bytes' },
      { label: 'Storage', value: 'Cartridge ROM' },
      { label: 'Condition', value: 'Restored, AV-modded' },
      { label: 'Origin', value: 'Sunnyvale, California' }
    ],
    images: ['https://images.unsplash.com/photo-1600080972464-8e5f35f63d08?w=800'],
    featured: false,
    new: false,
    color: '#92400e'
  },
  {
    id: 'technics-sl1200',
    name: 'Technics SL-1200 MK2',
    tagline: 'Direct drive. Infinite control.',
    description: 'The turntable that built hip-hop. DJ essential since 1979.',
    longDescription: 'The Technics SL-1200, introduced in its MK2 form in 1979, became the instrument of choice for DJs worldwide. Its direct-drive motor, adjustable torque, and robust construction made it capable of techniques—scratching, beat-matching, beat-juggling—that its designers never anticipated. More than a playback device, the SL-1200 enabled an entirely new form of musical expression.',
    price: 1600,
    rating: 4.9,
    ratingCount: 203,
    category: 'audio',
    era: '1970s',
    year: 1979,
    specs: [
      { label: 'Drive', value: 'Direct, quartz-locked' },
      { label: 'Speeds', value: '33⅓, 45 RPM' },
      { label: 'Wow/Flutter', value: '0.01% WRMS' },
      { label: 'Torque', value: '1.5 kg/cm' },
      { label: 'Condition', value: 'Serviced, Excellent' },
      { label: 'Origin', value: 'Osaka, Japan' }
    ],
    images: ['https://images.unsplash.com/photo-1558584673-aa8e87c8b650?w=800'],
    featured: true,
    new: true,
    color: '#111827'
  },
  {
    id: 'commodore-64',
    name: 'Commodore 64',
    tagline: 'The best-selling computer of all time',
    description: 'The people\'s computer. 64K of power, 17 million sold.',
    longDescription: 'The Commodore 64, released in 1982, democratized personal computing like no machine before or since. With 64 kilobytes of RAM, impressive graphics and sound capabilities, and an aggressive price point, the C64 found its way into millions of homes. It introduced a generation to programming, gaming, and the possibilities of the digital age.',
    price: 520,
    rating: 4.5,
    ratingCount: 142,
    category: 'computing',
    era: '1980s',
    year: 1982,
    specs: [
      { label: 'CPU', value: 'MOS 6510 @ 1.023MHz' },
      { label: 'RAM', value: '64KB' },
      { label: 'Graphics', value: 'VIC-II (16 colors)' },
      { label: 'Sound', value: 'SID 6581 (3 voices)' },
      { label: 'Condition', value: 'Recapped, Tested' },
      { label: 'Origin', value: 'West Chester, PA' }
    ],
    images: ['https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=800'],
    featured: false,
    new: false,
    color: '#a3a3a3'
  },
  {
    id: 'leica-m3',
    name: 'Leica M3',
    tagline: 'The decisive instrument',
    description: 'The camera that defined photojournalism. German precision from 1954.',
    longDescription: 'When Leica introduced the M3 in 1954, they obsoleted their own successful screw-mount cameras with something so refined that competitors simply gave up. The bright combined viewfinder/rangefinder, whisper-quiet shutter, and precise film advance created an instrument that extended the photographer\'s vision. Henri Cartier-Bresson called it "the decisive moment\'s accomplice."',
    price: 3600,
    rating: 4.7,
    ratingCount: 95,
    category: 'photography',
    era: '1950s',
    year: 1954,
    specs: [
      { label: 'Format', value: '35mm' },
      { label: 'Mount', value: 'Leica M bayonet' },
      { label: 'Finder', value: '0.91x combined RF/VF' },
      { label: 'Shutter', value: '1s-1/1000s + B' },
      { label: 'Condition', value: 'CLA\'d, Museum Quality' },
      { label: 'Origin', value: 'Wetzlar, Germany' }
    ],
    images: ['https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=800'],
    featured: true,
    new: false,
    color: '#27272a'
  }
];

export const categories = [
  { id: 'audio', name: 'Audio' },
  { id: 'computing', name: 'Computing' },
  { id: 'photography', name: 'Photography' },
  { id: 'gaming', name: 'Gaming' },
  { id: 'television', name: 'Television' }
];

export const eras = [
  { id: '1950s', name: '1950s' },
  { id: '1960s', name: '1960s' },
  { id: '1970s', name: '1970s' },
  { id: '1980s', name: '1980s' },
  { id: '1990s', name: '1990s' }
];
