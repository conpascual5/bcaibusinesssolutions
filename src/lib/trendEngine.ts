export interface TrendData {
  platform: string;
  score: number;
  trendDirection: 'up' | 'down' | 'stable';
  topHashtags: string[];
  audienceAge: string[];
  peakEngagementTime: string;
  contentType: string[];
  engagementRate: string;
  growthRate: string;
  insights: string[];
}

export interface ImageTheme {
  id: number;
  title: string;
  description: string;
  colorPalette: string[];
  mood: string;
  props: string[];
  example: string;
}

export interface CaptionIdea {
  id: number;
  text: string;
  hashtags: string[];
  bestFor: string;
  tone: string;
}

export interface VideoScript {
  id: number;
  title: string;
  duration: string;
  hook: string;
  scenes: string[];
  cta: string;
}

function cyrb128(str: string): [number, number, number, number] {
  let h1 = 1779033703, h2 = 3144134277, h3 = 1013904242, h4 = 2773480762;
  for (let i = 0; i < str.length; i++) {
    const k = str.charCodeAt(i);
    h1 = h2 ^ Math.imul(h1 ^ k, 597399067);
    h2 = h3 ^ Math.imul(h2 ^ k, 2869860233);
    h3 = h4 ^ Math.imul(h3 ^ k, 951274213);
    h4 = h1 ^ Math.imul(h4 ^ k, 2716044179);
  }
  h1 = Math.imul(h3 ^ (h1 >>> 18), 597399067);
  h2 = Math.imul(h4 ^ (h2 >>> 22), 2869860233);
  h3 = Math.imul(h1 ^ (h3 >>> 17), 951274213);
  h4 = Math.imul(h2 ^ (h4 >>> 19), 2716044179);
  return [
    (h1 ^ h2 ^ h3 ^ h4) >>> 0,
    (h2 ^ h1) >>> 0,
    (h3 ^ h1) >>> 0,
    (h4 ^ h1) >>> 0
  ];
}

function sfc32(a: number, b: number, c: number, d: number) {
  return function() {
    a >>>= 0; b >>>= 0; c >>>= 0; d >>>= 0;
    let t = (a + b) | 0;
    a = b ^ (b >>> 9);
    b = (c + (c << 3)) | 0;
    c = (c << 21) | (c >>> 11);
    d = (d + 1) | 0;
    t = (t + d) | 0;
    c = (c + t) | 0;
    return (t >>> 0) / 4294967296;
  };
}

function createSeededRandom(seed: string) {
  const hash = cyrb128(seed.toLowerCase().trim());
  return sfc32(hash[0], hash[1], hash[2], hash[3]);
}

function pick<T>(arr: T[], rand: () => number, count?: number): T[] {
  const shuffled = [...arr].sort(() => rand() - 0.5);
  return count ? shuffled.slice(0, count) : shuffled;
}

function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function detectCategory(product: string): string {
  const p = product.toLowerCase();
  if (p.match(/shoe|sneaker|boot|sandal|heel|footwear|trainer/)) return 'fashion';
  if (p.match(/shirt|dress|jean|jacket|coat|hoodie|t-shirt|pant|skirt|blazer|cloth|apparel/)) return 'fashion';
  if (p.match(/bag|purse|wallet|backpack|handbag|tote|luggage/)) return 'fashion';
  if (p.match(/watch|jewelry|necklace|ring|bracelet|earring|accessory/)) return 'fashion';
  if (p.match(/phone|laptop|headphone|speaker|camera|tablet|smartwatch|charger|cable|gadget|tech|device|earbud/)) return 'tech';
  if (p.match(/cream|serum|makeup|lipstick|perfume|skincare|hair|beauty|cosmetic|lotion|shampoo|conditioner|mask/)) return 'beauty';
  if (p.match(/food|snack|coffee|tea|chocolate|protein|supplement|vitamin|drink|beverage|wine|organic|kitchen|cook/)) return 'food';
  if (p.match(/home|furniture|lamp|decor|pillow|blanket|curtain|rug|mirror|vase|plant|shelf|chair|table|sofa|bed/)) return 'home';
  if (p.match(/toy|game|puzzle|doll|lego|board.?game|console|play|pet|baby|kid/)) return 'lifestyle';
  if (p.match(/fitness|yoga|gym|workout|dumbbell|mat|sport|run|exercise|health/)) return 'fitness';
  if (p.match(/book|novel|journal|planner|pen|notebook|stationery|art|paint|craft/)) return 'creative';
  return 'general';
}

const CATEGORY_TRENDS: Record<string, Record<string, { hashtags: string[], contentTypes: string[], insights: string[] }>> = {
  fashion: {
    facebook: {
      hashtags: ['#OOTD', '#StyleInspo', '#FashionFinds', '#WardrobeGoals', '#LookBook', '#TrendAlert'],
      contentTypes: ['Carousel posts', 'Styled flat lays', 'Video styling tips', 'User photo shares', 'Outfit transitions'],
      insights: ['Fashion videos under 60s drive 2x more saves', 'Carousel posts with 5+ images see 40% more engagement', 'User-generated content boosts trust by 70%']
    },
    instagram: {
      hashtags: ['#OOTN', '#StreetStyle', '#FashionDaily', '#InstaFashion', '#StyleGram', '#FitCheck', '#FashionReels'],
      contentTypes: ['Reels with outfit transitions', 'BTS of photoshoots', 'Mirror selfies', 'Styled flat lays', 'GRWM videos'],
      insights: ['Reels get 22% more reach than static posts', 'Stories with polls increase DM replies by 35%', 'Carousel posts with outfit details drive highest saves']
    },
    tiktok: {
      hashtags: ['#FashionTok', '#GRWM', '#OutfitCheck', '#StyleHaul', '#ThriftFlip', '#GetReadyWithMe', '#FashionHacks'],
      contentTypes: ['Quick outfit changes', 'Thrift flips', 'Style hacks', 'Get Ready With Me', 'Shopping hauls', 'POV styling'],
      insights: ['Outfit transition videos average 500K+ views', 'GRWM content drives strong comment engagement', 'Haul videos under 90s perform best']
    }
  },
  tech: {
    facebook: {
      hashtags: ['#TechReview', '#GadgetLover', '#SmartTech', '#TechFinds', '#MustHaveTech', '#Innovation'],
      contentTypes: ['Unboxing videos', 'Comparison carousels', 'Feature highlights', 'Tech tips', 'Review summaries'],
      insights: ['Unboxing videos generate 3x more shares', 'Comparison posts drive high comment rates', 'Feature highlight carousels boost saves']
    },
    instagram: {
      hashtags: ['#TechGadgets', '#InstaTech', '#GadgetGram', '#TechDaily', '#SmartLiving', '#FutureTech', '#TechReels'],
      contentTypes: ['Aesthetic desk setups', 'Unboxing Reels', 'Day in the life with tech', 'Before/after productivity', 'Feature demos'],
      insights: ['Desk setup photos drive strong save rates', 'Unboxing Reels average 300K+ views', 'Tech tips in Stories increase profile visits']
    },
    tiktok: {
      hashtags: ['#TechTok', '#GadgetReview', '#Unboxing', '#TechHacks', '#MustHave', '#AmazonFinds', '#SetupTour'],
      contentTypes: ['Unboxings', 'Desk setup tours', 'Tech hacks', 'Product demos', 'Day in life', 'POV using product'],
      insights: ['Unboxing videos under 60s go viral consistently', 'Setup tours with ASMR elements trend strongly', 'Tech hack videos average 1M+ views']
    }
  },
  beauty: {
    facebook: {
      hashtags: ['#BeautyFinds', '#SkincareRoutine', '#GlowUp', '#BeautyTips', '#MakeupLovers', '#SkinCare'],
      contentTypes: ['Routine videos', 'Before/after photos', 'Product flat lays', 'Tutorial clips', 'Ingredient explainers'],
      insights: ['Before/after posts drive highest engagement', 'Routine videos under 45s get most shares', 'Ingredient education builds trust']
    },
    instagram: {
      hashtags: ['#BeautyGram', '#SkincareAddict', '#MakeupDaily', '#GlowCheck', '#BeautyReels', '#SkinTok', '#MakeupArt'],
      contentTypes: ['GRWM Reels', 'Texture close-ups', 'Bottle aesthetics', 'Routine breakdowns', 'Transformation videos'],
      insights: ['Texture ASMR videos get 40% more saves', 'Transformation Reels drive highest shares', 'Aesthetic product shots boost discovery']
    },
    tiktok: {
      hashtags: ['#BeautyTok', '#SkincareTok', '#MakeupTutorial', '#GlamCheck', '#ProductReview', '#RoutineCheck', '#SkinCareTips'],
      contentTypes: ['Product reviews', 'Routine checks', 'Makeup tutorials', 'Glow-ups', 'Ingredient deep dives', 'Texture ASMR'],
      insights: ['Routine check videos trend weekly', 'Texture ASMR drives 2x watch time', 'Honest reviews outperform polished ads']
    }
  },
  food: {
    facebook: {
      hashtags: ['#FoodieFinds', '#RecipeShare', '#HomeCooking', '#FoodLovers', '#MustTry', '#FoodHacks'],
      contentTypes: ['Recipe videos', 'Food photography', 'Cooking hacks', 'Meal prep ideas', 'Product in action'],
      insights: ['Recipe videos under 1 min get 3x shares', 'Food photography drives strong save rates', 'Cooking hacks spark comment discussions']
    },
    instagram: {
      hashtags: ['#FoodGram', '#InstaFood', '#FoodPorn', '#RecipeReels', '#HomeCooked', '#FoodieLife', '#EatLocal'],
      contentTypes: ['Recipe Reels', 'Aesthetic food photography', 'Cooking process videos', 'Meal inspiration carousels', 'Food styling BTS'],
      insights: ['Recipe Reels drive highest saves', 'Aesthetic plating photos boost discovery', 'Behind-the-scenes cooking content builds trust']
    },
    tiktok: {
      hashtags: ['#FoodTok', '#RecipeTok', '#CookingHack', '#FoodReview', '#WhatIEat', '#MealPrep', '#Tasty'],
      contentTypes: ['Quick recipes', 'Food reviews', 'Cooking hacks', 'What I eat in a day', 'ASMR cooking', 'Meal prep'],
      insights: ['15-30s recipe videos go viral most', 'Food ASMR drives highest completion rates', 'Hack videos get 5x more shares']
    }
  },
  home: {
    facebook: {
      hashtags: ['#HomeDecor', '#InteriorInspo', '#HomeGoals', '#DecorFinds', '#LivingSpace', '#DesignInspo'],
      contentTypes: ['Room reveals', 'Before/after transformations', 'Decor hauls', 'Styling tips', 'DIY projects'],
      insights: ['Before/after transformations get 4x engagement', 'Room reveal videos drive strong saves', 'DIY content sparks comment discussions']
    },
    instagram: {
      hashtags: ['#HomeInspo', '#InteriorDesign', '#DecorDaily', '#HomeGram', '#StyledSpaces', '#DesignReels', '#RoomTour'],
      contentTypes: ['Room tours', 'Aesthetic flat lays', 'Styling Reels', 'Before/after carousels', 'Decor details'],
      insights: ['Room tour Reels average 200K+ views', 'Aesthetic detail shots drive highest saves', 'Carousel before/afters boost engagement']
    },
    tiktok: {
      hashtags: ['#HomeTok', '#DecorTok', '#RoomMakeover', '#DIYHome', '#SpaceRefresh', '#HomeHacks', '#CleanTok'],
      contentTypes: ['Room makeovers', 'Decor hauls', 'DIY hacks', 'Organization', 'Home tours', 'Shopping finds'],
      insights: ['Makeover videos under 60s trend strongly', 'Organization content drives high saves', 'Haul videos with price mentions perform best']
    }
  },
  fitness: {
    facebook: {
      hashtags: ['#FitnessMotivation', '#WorkoutRoutine', '#HealthyLife', '#GymLife', '#FitnessJourney', '#Wellness'],
      contentTypes: ['Workout demos', 'Motivation posts', 'Transformation stories', 'Routine carousels', 'Health tips'],
      insights: ['Transformation stories drive highest shares', 'Quick workout demos get 2x engagement', 'Routine carousels boost saves']
    },
    instagram: {
      hashtags: ['#FitLife', '#WorkoutReels', '#GymGram', '#FitnessDaily', '#TrainingDay', '#SweatCheck', '#FitInspo'],
      contentTypes: ['Workout Reels', 'Gym selfies', 'Progress photos', 'Exercise tutorials', 'Meal & fitness combos'],
      insights: ['Workout Reels get 35% more reach', 'Progress photo carousels drive strong engagement', 'Gym fit checks trend consistently']
    },
    tiktok: {
      hashtags: ['#FitTok', '#GymTok', '#WorkoutRoutine', '#FitnessHack', '#SweatCheck', '#ExerciseTips', '#GymMotivation'],
      contentTypes: ['Workout routines', 'Gym hacks', 'Fitness tips', 'Transformation timelines', 'Exercise demos', 'What I eat + workout'],
      insights: ['Workout routine videos trend daily', 'Gym hack videos average 800K+ views', 'Transformation timelines drive emotional engagement']
    }
  },
  lifestyle: {
    facebook: {
      hashtags: ['#LifestyleFinds', '#DailyInspo', '#LifeHacks', '#MustHave', '#TrendingNow', '#EverydayEssentials'],
      contentTypes: ['Product demos', 'Life hack videos', 'Daily routine shares', 'Review posts', 'How-to guides'],
      insights: ['Life hack videos get 3x more shares', 'Product demos in use drive trust', 'Routine content builds community engagement']
    },
    instagram: {
      hashtags: ['#InstaDaily', '#LifeGram', '#LifestyleReels', '#DailyVibes', '#Essentials', '#LivingWell', '#RoutineCheck'],
      contentTypes: ['Day in the life', 'Aesthetic routines', 'Product in use', 'Lifestyle flat lays', 'Routine Reels'],
      insights: ['Day in the life Reels drive highest saves', 'Aesthetic routine content boosts discovery', 'Product-in-use Stories increase link clicks']
    },
    tiktok: {
      hashtags: ['#LifeTok', '#DailyRoutine', '#ProductReview', '#MustHaves', '#Haul', '#ThingsYouNeed', '#AmazonFinds'],
      contentTypes: ['Daily routines', 'Product reviews', 'Hauls', 'Things you need', 'Day in life', 'POV content'],
      insights: ['Things you need videos trend weekly', 'Haul videos with honest reviews perform best', 'POV content drives strong comment engagement']
    }
  },
  creative: {
    facebook: {
      hashtags: ['#CreativeFinds', '#ArtSupplies', '#BookLovers', '#StationeryAddict', '#CreativeLife', '#MakerSpace'],
      contentTypes: ['Process videos', 'Product showcases', 'Creative tips', 'Inspiration posts', 'Review carousels'],
      insights: ['Process videos get 2.5x more engagement', 'Creative tip posts drive strong saves', 'Product showcases in use build credibility']
    },
    instagram: {
      hashtags: ['#ArtGram', '#BookGram', '#CreativeReels', '#StationeryLove', '#ProcessArt', '#AestheticReads', '#MakerGram'],
      contentTypes: ['Process Reels', 'Aesthetic flat lays', 'Shelf styling', 'Creative routines', 'Before/after art'],
      insights: ['Process Reels average 150K+ views', 'Aesthetic flat lays drive highest saves', 'Creative routine Stories boost profile visits']
    },
    tiktok: {
      hashtags: ['#ArtTok', '#BookTok', '#StationeryTok', '#CreativeProcess', '#MakerTok', '#JournalWithMe', '#StudyWithMe'],
      contentTypes: ['Process videos', 'Journal with me', 'Shelf organization', 'Creative hauls', 'Study sessions', 'Art tutorials'],
      insights: ['Process videos under 60s trend strongly', 'Journal with me content drives loyal following', 'Creative hauls with price tags perform best']
    }
  },
  general: {
    facebook: {
      hashtags: ['#MustHave', '#TrendingNow', '#DailyFinds', '#ProductReview', '#TopRated', '#Essentials'],
      contentTypes: ['Product demos', 'Review videos', 'Feature highlights', 'Comparison posts', 'How-to content'],
      insights: ['Product demo videos drive highest engagement', 'Honest reviews outperform polished ads', 'Feature highlight carousels boost saves']
    },
    instagram: {
      hashtags: ['#InstaFinds', '#DailyEssentials', '#ReelsDaily', '#ProductFeature', '#TopPicks', '#MustHave'],
      contentTypes: ['Product Reels', 'Aesthetic showcases', 'Feature demos', 'Before/after', 'Unboxing Stories'],
      insights: ['Product Reels get 28% more reach', 'Aesthetic product shots boost discovery', 'Feature demo Stories drive link clicks']
    },
    tiktok: {
      hashtags: ['#TikTokMadeMeBuyIt', '#ProductReview', '#MustHave', '#AmazonFinds', '#DailyEssential', '#HonestReview'],
      contentTypes: ['Unboxings', 'Honest reviews', 'Product demos', 'Day in life', 'Hauls', 'POV content'],
      insights: ['TikTokMadeMeBuyIt videos drive massive conversions', 'Honest 60s reviews outperform ads', 'Product demos with real use cases trend best']
    }
  }
};

const TIME_SLOTS = [
  '6:00 - 8:00 AM',
  '12:00 - 1:00 PM',
  '5:00 - 7:00 PM',
  '7:00 - 9:00 PM',
  '9:00 - 11:00 PM'
];

const AGE_GROUPS = [
  '18-24', '25-34', '35-44', '45-54', '55+'
];

export function generateTrendAnalysis(product: string): TrendData[] {
  const rand = createSeededRandom(product + '_trend_v2');
  const category = detectCategory(product);
  const data = CATEGORY_TRENDS[category];
  
  const platforms = ['facebook', 'instagram', 'tiktok'];
  
  return platforms.map(platform => {
    const platformData = data[platform];
    const baseScore = 55 + Math.floor(rand() * 40);
    const trendDir = rand() > 0.3 ? 'up' : rand() > 0.5 ? 'stable' : 'down';
    
    return {
      platform: capitalize(platform),
      score: baseScore,
      trendDirection: trendDir,
      topHashtags: pick(platformData.hashtags, rand, 4),
      audienceAge: pick(AGE_GROUPS, rand, 3),
      peakEngagementTime: pick(TIME_SLOTS, rand, 1)[0],
      contentType: pick(platformData.contentTypes, rand, 3),
      engagementRate: (1.5 + rand() * 5.5).toFixed(2) + '%',
      growthRate: (trendDir === 'up' ? '+' : trendDir === 'down' ? '-' : '') + (5 + Math.floor(rand() * 25)) + '%',
      insights: pick(platformData.insights, rand, 2)
    };
  });
}

const THEME_TEMPLATES: Record<string, ImageTheme[]> = {
  fashion: [
    { id: 1, title: 'Street Style Capture', description: 'Candid urban shots with natural lighting and city backdrops', colorPalette: ['#2D2D2D', '#E8E8E8', '#D4A574', '#8B4513'], mood: 'Edgy & Authentic', props: ['Graffiti wall', 'Coffee cup', 'Sunglasses', 'Crosswalk'], example: 'Model crossing street with wind-blown hair' },
    { id: 2, title: 'Luxe Minimalist', description: 'Clean studio shots with negative space and soft shadows', colorPalette: ['#F5F5F5', '#C0C0C0', '#FFD700', '#1A1A1A'], mood: 'Sophisticated & Clean', props: ['Marble surface', 'Gold accents', 'Single flower', 'Fabric draping'], example: 'Product on marble with gold ring accent' },
    { id: 3, title: 'Boho Lifestyle', description: 'Warm natural settings with earthy textures and soft focus', colorPalette: ['#D2B48C', '#8FBC8F', '#CD853F', '#FFF8DC'], mood: 'Free-spirited & Warm', props: ['Dried flowers', 'Woven basket', 'Linen fabric', 'Vintage books'], example: 'Outfit flat lay on woven rug with dried pampas' },
    { id: 4, title: 'Night Out Glam', description: 'Dark moody lighting with neon accents and reflective surfaces', colorPalette: ['#0D0D0D', '#FF1493', '#00FFFF', '#4B0082'], mood: 'Bold & Electric', props: ['Neon signs', 'Wet pavement', 'City lights', 'Cocktail glass'], example: 'Fashion subject under neon sign with rain reflection' },
    { id: 5, title: 'Athleisure Dynamic', description: 'Motion-captured fitness moments with energetic composition', colorPalette: ['#FF4500', '#1E90FF', '#FFFFFF', '#32CD32'], mood: 'Active & Energetic', props: ['Gym equipment', 'Sports court', 'Water bottle', 'Headphones'], example: 'Mid-jump action shot on basketball court' },
    { id: 6, title: 'Vintage Throwback', description: 'Retro color grading with film grain and nostalgic props', colorPalette: ['#F4A460', '#708090', '#FFDAB9', '#8B0000'], mood: 'Nostalgic & Romantic', props: ['Polaroid camera', 'Vinyl records', 'Retro sunglasses', 'Classic car'], example: 'Subject leaning against vintage car with film grain' },
    { id: 7, title: 'Cozy Season', description: 'Warm indoor scenes with knit textures and soft window light', colorPalette: ['#DEB887', '#F5DEB3', '#BC8F8F', '#8B7355'], mood: 'Comfortable & Intimate', props: ['Knitted blanket', 'Hot beverage', 'Candles', 'Wooden tray'], example: 'Product styled on bed with morning light streaming in' },
    { id: 8, title: 'Editorial High Fashion', description: 'Dramatic poses with bold makeup and avant-garde styling', colorPalette: ['#000000', '#FF0000', '#FFFFFF', '#C0C0C0'], mood: 'Dramatic & Artistic', props: ['Abstract backdrop', 'Statement jewelry', 'Bold lipstick', 'Feather accessory'], example: 'Close-up portrait with bold red lip and pearl headpiece' },
    { id: 9, title: 'Casual Coffee Run', description: 'Effortless everyday moments with relatable styling', colorPalette: ['#A0522D', '#F5F5DC', '#4682B4', '#D2691E'], mood: 'Relaxed & Approachable', props: ['Coffee cup', 'Crossbody bag', 'Denim jacket', 'Sidewalk cafe'], example: 'Walking out of cafe with coffee and tote bag' },
    { id: 10, title: 'Sustainable Style', description: 'Nature-integrated shots with eco-conscious messaging', colorPalette: ['#228B22', '#8FBC8F', '#F0E68C', '#6B8E23'], mood: 'Conscious & Fresh', props: ['Green plants', 'Recycled materials', 'Natural wood', 'Cotton tote'], example: 'Outfit in botanical garden with sunlight filtering through leaves' }
  ],
  tech: [
    { id: 1, title: 'Desk Setup Dreams', description: 'Clean aesthetic workspaces with mood lighting and organization', colorPalette: ['#1A1A1A', '#00CED1', '#F5F5F5', '#2F4F4F'], mood: 'Focused & Modern', props: ['LED strips', 'Monitor', 'Mechanical keyboard', 'Plant', 'Coffee'], example: 'Overhead shot of dual-monitor setup with RGB lighting' },
    { id: 2, title: 'Unboxing Experience', description: 'First-touch moments with premium packaging and satisfying peels', colorPalette: ['#FFFFFF', '#C0C0C0', '#FFD700', '#1C1C1C'], mood: 'Exciting & Premium', props: ['Branded box', 'Ribbon pull', 'Tissue paper', 'Thank you card'], example: 'Hands peeling protective film off new device' },
    { id: 3, title: 'Lifestyle In Use', description: 'Real-world product usage in authentic everyday moments', colorPalette: ['#87CEEB', '#F5F5F5', '#4682B4', '#D3D3D3'], mood: 'Natural & Relatable', props: ['Coffee shop table', 'Notebook', 'Window light', 'Street view'], example: 'Person using laptop at cafe window with blurred city behind' },
    { id: 4, title: 'Tech Noir', description: 'Dark dramatic scenes with screen glow and cyberpunk vibes', colorPalette: ['#0D0D0D', '#00FF00', '#FF00FF', '#1A1A2E'], mood: 'Mysterious & Futuristic', props: ['Smoke effects', 'Neon glow', 'Cables', 'Dark room'], example: 'Device screen illuminating face in dark room with colored lighting' },
    { id: 5, title: 'Minimal Product Hero', description: 'Single product focus with perfect lighting and zero distractions', colorPalette: ['#F8F8F8', '#E0E0E0', '#B0B0B0', '#404040'], mood: 'Pure & Professional', props: ['Gradient background', 'Soft shadow', 'Reflection surface', 'Macro lens'], example: 'Floating device with dramatic side lighting on gray gradient' },
    { id: 6, title: 'Creative Process', description: 'Behind-the-scenes of creation with multiple devices and tools', colorPalette: ['#FFE4B5', '#DEB887', '#8B4513', '#F5F5DC'], mood: 'Warm & Artisanal', props: ['Sketchbook', 'Tablet stylus', 'Reference images', 'Coffee rings'], example: 'Overhead of creative desk with tablet, sketches, and color swatches' },
    { id: 7, title: 'Morning Routine', description: 'Bright fresh starts with tech integrated into wellness', colorPalette: ['#FFFACD', '#87CEFA', '#F0F8FF', '#FFE4E1'], mood: 'Fresh & Optimistic', props: ['Bedside table', 'Sunlight', 'Plant', 'Alarm clock', 'Yoga mat'], example: 'Smartwatch and phone on bedside table with morning sun' },
    { id: 8, title: 'Gamer Aesthetic', description: 'Immersive gaming setups with RGB and competitive energy', colorPalette: ['#000000', '#00FFFF', '#FF1493', '#9400D3'], mood: 'Intense & Immersive', props: ['RGB keyboard', 'Headset', 'Energy drink', 'Posters', 'LED strips'], example: 'Hands on RGB keyboard with monitor glow and headset nearby' },
    { id: 9, title: 'Nature Meets Tech', description: 'Outdoor product shots blending technology with adventure', colorPalette: ['#228B22', '#87CEEB', '#8B4513', '#F5F5F5'], mood: 'Adventurous & Free', props: ['Mountain backdrop', 'Hiking gear', 'Sun flare', 'Rock surface'], example: 'Portable charger on mountain summit with valley view behind' },
    { id: 10, title: 'Retro Tech Vibes', description: 'Vintage technology aesthetics with modern products', colorPalette: ['#F4A460', '#CD853F', '#8B4513', '#2F4F4F'], mood: 'Nostalgic & Cool', props: ['CRT monitor', 'Floppy disks', 'Cassette tapes', 'Wood paneling'], example: 'Modern device placed on vintage TV with VHS tapes around' }
  ],
  beauty: [
    { id: 1, title: 'Shelfie Aesthetic', description: 'Curated product arrangements with soft lighting and bathroom vibes', colorPalette: ['#FFF5EE', '#FFE4E1', '#D8BFD8', '#F0F8FF'], mood: 'Clean & Curated', props: ['Marble shelf', 'Glass bottles', 'Eucalyptus', 'Cotton rounds', 'Gold tray'], example: 'Products arranged on marble shelf with eucalyptus draping' },
    { id: 2, title: 'Texture Close-up', description: 'Macro shots showing product textures, swatches, and consistency', colorPalette: ['#FFB6C1', '#F5F5F5', '#FFE4C4', '#E6E6FA'], mood: 'Tactile & Satisfying', props: ['Swatch on skin', 'Droplet', 'Cream texture', 'Brush bristles'], example: 'Macro of serum drop on skin with light catching the liquid' },
    { id: 3, title: 'Glow Up Timeline', description: 'Before and after transformation with consistent lighting', colorPalette: ['#F5F5F5', '#FFD700', '#FFF8DC', '#FFE4B5'], mood: 'Transformative & Bright', props: ['Split frame', 'Natural light', 'Clean background', 'Timestamp'], example: 'Side-by-side skin transformation with soft window light' },
    { id: 4, title: 'Ritual Moment', description: 'Self-care scenes with steam, water, and relaxing atmosphere', colorPalette: ['#E0FFFF', '#B0E0E6', '#F0F8FF', '#87CEFA'], mood: 'Calm & Indulgent', props: ['Bath tub', 'Steam', 'Candles', 'Flowers floating', 'Soft towel'], example: 'Product by bath with candles and rose petals in water' },
    { id: 5, title: 'Bold Color Pop', description: 'Vibrant makeup looks with monochromatic color blocking', colorPalette: ['#FF1493', '#00CED1', '#FFD700', '#8A2BE2'], mood: 'Bold & Playful', props: ['Colorful backdrop', 'Matching accessories', 'Neon accents', 'Graphic liner'], example: 'Colorful eyeshadow look with matching background and accessories' },
    { id: 6, title: 'Natural Beauty', description: 'Bare-faced minimalism with fresh dewy skin and soft focus', colorPalette: ['#FFE4C4', '#DEB887', '#F5DEB3', '#FFF8DC'], mood: 'Fresh & Authentic', props: ['Flower crown', 'Natural light', 'Linen robe', 'Minimal makeup'], example: 'Close-up of dewy skin with freckles and a single flower in hair' },
    { id: 7, title: 'Vintage Vanity', description: 'Old Hollywood glamour with gold accents and vintage props', colorPalette: ['#FFD700', '#8B0000', '#000000', '#C0C0C0'], mood: 'Glamorous & Timeless', props: ['Vanity mirror', 'Perfume bottles', 'Red lipstick', 'Pearl accessories'], example: 'Products on vintage vanity with round mirror and pearl necklace' },
    { id: 8, title: 'Ingredient Story', description: 'Natural ingredients with raw materials and earthy presentation', colorPalette: ['#228B22', '#D2691E', '#F4A460', '#8FBC8F'], mood: 'Organic & Trustworthy', props: ['Fresh ingredients', 'Wooden bowl', 'Glass dropper', 'Green leaves'], example: 'Serum bottle surrounded by fresh aloe and herbs on wood' },
    { id: 9, title: 'Nighttime Repair', description: 'Dark moody bedroom scenes with night routine products', colorPalette: ['#191970', '#483D8B', '#E6E6FA', '#B0C4DE'], mood: 'Restorative & Calm', props: ['Bedside table', 'Soft lamp', 'Sleep mask', 'Silk pillowcase'], example: 'Products on bedside table with warm lamp and cozy bedding' },
    { id: 10, title: 'Clean Girl Aesthetic', description: 'Slicked hair, minimal gold jewelry, and neutral tones', colorPalette: ['#F5F5DC', '#DAA520', '#F5F5F5', '#DEB887'], mood: 'Effortless & Polished', props: ['Gold hoops', 'Slicked bun', 'Neutral backdrop', 'Lip gloss'], example: 'Clean makeup look with gold jewelry and slicked-back hair' }
  ],
  food: [
    { id: 1, title: 'Overhead Feast', description: 'Tabletop spreads with multiple dishes and colorful arrangement', colorPalette: ['#FF6347', '#32CD32', '#FFD700', '#F5F5F5'], mood: 'Abundant & Inviting', props: ['Patterned tablecloth', 'Multiple plates', 'Fresh herbs', 'Wooden utensils'], example: 'Full table spread from above with hands reaching for food' },
    { id: 2, title: 'Steam & Sizzle', description: 'Hot food moments with rising steam and action shots', colorPalette: ['#FF4500', '#8B4513', '#FFD700', '#2F4F4F'], mood: 'Hot & Appetizing', props: ['Cast iron pan', 'Steam rising', 'Fresh garnish', 'Wooden board'], example: 'Pizza coming out of oven with cheese pull and steam' },
    { id: 3, title: 'Rustic Farm-to-Table', description: 'Natural settings with raw ingredients and earthy presentation', colorPalette: ['#8B4513', '#D2691E', '#228B22', '#F5DEB3'], mood: 'Wholesome & Natural', props: ['Wooden table', 'Fresh produce', 'Linen napkin', 'Mason jar'], example: 'Salad with fresh vegetables scattered on rustic wooden table' },
    { id: 4, title: 'Sweet Indulgence', description: 'Dessert focus with drips, sprinkles, and chocolate elements', colorPalette: ['#FFB6C1', '#8B4513', '#F5DEB3', '#FF69B4'], mood: 'Decadent & Playful', props: ['Chocolate drizzle', 'Sprinkles', 'Whipped cream', 'Colorful plates'], example: 'Cake slice with chocolate drip and scattered berries' },
    { id: 5, title: 'Cozy Cafe Vibes', description: 'Warm coffee shop atmosphere with latte art and pastries', colorPalette: ['#8B4513', '#D2691E', '#F5F5DC', '#A0522D'], mood: 'Warm & Comforting', props: ['Latte art', 'Croissant', 'Newspaper', 'Window seat', 'Plant'], example: 'Latte with heart art next to croissant on marble cafe table' },
    { id: 6, title: 'Fresh & Healthy', description: 'Bright smoothie bowls and salad shots with natural light', colorPalette: ['#32CD32', '#FFD700', '#FF6347', '#F0F8FF'], mood: 'Vibrant & Energizing', props: ['Smoothie bowl', 'Fresh fruit', 'Granola', 'Tropical leaves'], example: 'Colorful smoothie bowl from above with arranged fruit and seeds' },
    { id: 7, title: 'Midnight Snack', description: 'Dark moody scenes with dramatic lighting on comfort food', colorPalette: ['#1A1A1A', '#FFD700', '#FF4500', '#8B4513'], mood: 'Indulgent & Moody', props: ['Dark background', 'Single light source', 'Messy presentation', 'Comfort food'], example: 'Burger with melted cheese under dramatic single spotlight' },
    { id: 8, title: 'Cooking Process', description: 'Behind-the-scenes kitchen shots with hands in action', colorPalette: ['#DEB887', '#F5F5DC', '#8B4513', '#D2691E'], mood: 'Active & Authentic', props: ['Flour dust', 'Hands kneading', 'Steam', 'Wooden cutting board', 'Knife'], example: 'Hands kneading dough with flour explosion in motion' },
    { id: 9, title: 'Picnic Aesthetic', description: 'Outdoor settings with blankets, baskets, and natural scenery', colorPalette: ['#87CEEB', '#90EE90', '#F5DEB3', '#E6E6FA'], mood: 'Carefree & Sunny', props: ['Checkered blanket', 'Wicker basket', 'Grass field', 'Sunglasses', 'Sun hat'], example: 'Spread on checkered blanket in sunny meadow with basket' },
    { id: 10, title: 'Minimal Plate', description: 'Negative space focused single dish with elegant plating', colorPalette: ['#FFFFFF', '#F5F5F5', '#C0C0C0', '#2F4F4F'], mood: 'Elegant & Refined', props: ['White plate', 'Small garnish', 'Sauce drizzle', 'Clean backdrop'], example: 'Single perfect dish on white plate with artistic sauce design' }
  ],
  home: [
    { id: 1, title: 'Sunlit Interior', description: 'Bright rooms with natural window light and airy atmosphere', colorPalette: ['#FFF8DC', '#F5F5F5', '#DEB887', '#87CEEB'], mood: 'Bright & Airy', props: ['Sheer curtains', 'Potted plants', 'Natural wood', 'Linen textures'], example: 'Living room with morning light streaming through sheer curtains' },
    { id: 2, title: 'Cozy Corner', description: 'Intimate spaces with blankets, books, and warm lighting', colorPalette: ['#8B4513', '#D2691E', '#F5DEB3', '#CD853F'], mood: 'Warm & Intimate', props: ['Throw blanket', 'Reading lamp', 'Stack of books', 'Candle', 'Armchair'], example: 'Reading nook with blanket draped over leather chair and warm lamp' },
    { id: 3, title: 'Modern Minimal', description: 'Clean lines with neutral palette and sculptural objects', colorPalette: ['#E0E0E0', '#B0B0B0', '#404040', '#F5F5F5'], mood: 'Calm & Refined', props: ['Concrete vase', 'Single stem', 'Geometric shapes', 'Matte surfaces'], example: 'White shelf with single ceramic vase and sculptural objects' },
    { id: 4, title: 'Boho Eclectic', description: 'Layered textures with macrame, plants, and mixed patterns', colorPalette: ['#D2B48C', '#8FBC8F', '#CD853F', '#DEB887'], mood: 'Eclectic & Warm', props: ['Macrame wall hanging', 'Woven rug', 'Rattan furniture', 'Hanging plants'], example: 'Corner with layered rugs, floor cushions, and hanging macrame' },
    { id: 5, title: 'Scandi Simplicity', description: 'Functional beauty with light woods, whites, and subtle pops', colorPalette: ['#F5F5F5', '#D3D3D3', '#87CEEB', '#8B4513'], mood: 'Functional & Serene', props: ['Pine furniture', 'White walls', 'Simple lines', 'Single plant', 'Textured throw'], example: 'Minimalist bedroom with pine bed frame and crisp white bedding' },
    { id: 6, title: 'Dark & Dramatic', description: 'Moody spaces with deep colors, velvet, and statement lighting', colorPalette: ['#2F4F4F', '#4B0082', '#FFD700', '#1C1C1C'], mood: 'Dramatic & Luxurious', props: ['Velvet sofa', 'Brass lamp', 'Dark walls', 'Art deco mirror'], example: 'Dark living room with emerald velvet sofa and brass floor lamp' },
    { id: 7, title: 'Garden Oasis', description: 'Indoor-outdoor flow with plants, natural materials, and light', colorPalette: ['#228B22', '#8FBC8F', '#F5DEB3', '#87CEEB'], mood: 'Fresh & Natural', props: ['Large plants', 'Wicker furniture', 'Terracotta pots', 'Natural light'], example: 'Sunroom filled with plants and wicker furniture with garden view' },
    { id: 8, title: 'Vintage Charm', description: 'Antique pieces with patina, collected objects, and character', colorPalette: ['#F4A460', '#8B4513', '#CD853F', '#DEB887'], mood: 'Charming & Collected', props: ['Antique mirror', 'Brass objects', 'Distressed wood', 'Vintage books'], example: 'Entryway with antique console, brass objects, and vintage portrait' },
    { id: 9, title: 'Kid-Friendly Fun', description: 'Playful spaces with color, organization, and whimsy', colorPalette: ['#FFD700', '#FF69B4', '#87CEEB', '#98FB98'], mood: 'Playful & Organized', props: ['Toy storage', 'Colorful rug', 'Wall decals', 'Reading corner', 'Art display'], example: 'Bright playroom with organized toy shelves and colorful rug' },
    { id: 10, title: 'Workspace Inspo', description: 'Productive yet stylish home offices with plants and light', colorPalette: ['#F5F5F5', '#D3D3D3', '#8FBC8F', '#4682B4'], mood: 'Productive & Balanced', props: ['Standing desk', 'Ergonomic chair', 'Task lamp', 'Bulletin board', 'Plant'], example: 'Clean desk setup with task lamp, laptop, and trailing pothos plant' }
  ],
  fitness: [
    { id: 1, title: 'Gym Action', description: 'Dynamic workout shots with dramatic gym lighting and sweat', colorPalette: ['#2F4F4F', '#FF4500', '#C0C0C0', '#1A1A1A'], mood: 'Powerful & Intense', props: ['Gym equipment', 'Chalk dust', 'Water bottle', 'Weight plates', 'Gym bag'], example: 'Deadlift moment with chalk dust and dramatic gym lighting' },
    { id: 2, title: 'Outdoor Training', description: 'Natural settings with park workouts and fresh air vibes', colorPalette: ['#228B22', '#87CEEB', '#F5DEB3', '#8B4513'], mood: 'Energizing & Free', props: ['Park bench', 'Resistance bands', 'Running shoes', 'Water bottle', 'Trail'], example: 'Person doing pull-ups on park bars with sunrise behind' },
    { id: 3, title: 'Yoga Serenity', description: 'Calm practice spaces with soft light and peaceful atmosphere', colorPalette: ['#E6E6FA', '#D8BFD8', '#F5F5F5', '#B0E0E6'], mood: 'Peaceful & Centered', props: ['Yoga mat', 'Bolster', 'Candle', 'Indoor plants', 'Soft blanket'], example: 'Yoga pose on mat with morning light and plants in background' },
    { id: 4, title: 'Home Workout', description: 'Living room fitness with minimal equipment and real life', colorPalette: ['#F5F5DC', '#DEB887', '#8B4513', '#F0F8FF'], mood: 'Accessible & Real', props: ['Dumbbells', 'Yoga mat', 'Towel', 'Water bottle', 'Couch'], example: 'Push-ups on yoga mat in living room with cozy home backdrop' },
    { id: 5, title: 'Transformation Journey', description: 'Progress documentation with consistent poses and lighting', colorPalette: ['#FFD700', '#C0C0C0', '#F5F5F5', '#2F4F4F'], mood: 'Motivational & Honest', props: ['Full-length mirror', 'Consistent outfit', 'Calendar', 'Journal', 'Tape measure'], example: 'Mirror selfie series showing transformation over months' },
    { id: 6, title: 'Healthy Fuel', description: 'Meal prep and nutrition focus with fresh ingredients', colorPalette: ['#32CD32', '#FFD700', '#FF6347', '#F0F8FF'], mood: 'Nourishing & Fresh', props: ['Meal prep containers', 'Fresh vegetables', 'Protein', 'Smoothie', 'Kitchen counter'], example: 'Colorful meal prep containers on kitchen counter from above' },
    { id: 7, title: 'Beach Body', description: 'Coastal workouts with sand, water, and natural scenery', colorPalette: ['#87CEEB', '#F5DEB3', '#4682B4', '#FFD700'], mood: 'Refreshing & Strong', props: ['Sand', 'Ocean', 'Sunset', 'Workout gear', 'Beach towel'], example: 'Beach workout at sunset with ocean waves in background' },
    { id: 8, title: 'Recovery Mode', description: 'Rest and self-care moments with foam rollers and relaxation', colorPalette: ['#D8BFD8', '#E6E6FA', '#F5F5F5', '#B0C4DE'], mood: 'Restorative & Gentle', props: ['Foam roller', 'Massage ball', 'Epsom salts', 'Bath', 'Soft towel'], example: 'Recovery setup with foam roller, candles, and bath salts' },
    { id: 9, title: 'Group Energy', description: 'Class settings with community, motivation, and shared goals', colorPalette: ['#FF6347', '#FFD700', '#32CD32', '#1E90FF'], mood: 'Social & Motivated', props: ['Group of people', 'Classroom', 'Mirrors', 'Mats', 'Instructor'], example: 'Fitness class in action with instructor leading and mirrors reflecting' },
    { id: 10, title: 'Gear Close-up', description: 'Equipment and apparel detail shots with texture focus', colorPalette: ['#2F4F4F', '#C0C0C0', '#FF4500', '#1A1A1A'], mood: 'Technical & Quality', props: ['Running shoes', 'Watch', 'Resistance band texture', 'Fabric close-up'], example: 'Macro of running shoe tread with water droplets on fabric' }
  ],
  lifestyle: [
    { id: 1, title: 'Morning Routine', description: 'Early day rituals with coffee, light, and slow moments', colorPalette: ['#FFF8DC', '#DEB887', '#F5F5DC', '#87CEEB'], mood: 'Calm & Fresh', props: ['Coffee mug', 'Bedroom light', 'Newspaper', 'Slippers', 'Window view'], example: 'Coffee cup on windowsill with morning light and city view' },
    { id: 2, title: 'Desk Aesthetic', description: 'Curated workspaces with stationery, plants, and organization', colorPalette: ['#F5F5F5', '#D3D3D3', '#8FBC8F', '#DEB887'], mood: 'Organized & Inspiring', props: ['Planner', 'Pen cup', 'Small plant', 'Laptop', 'Desk lamp'], example: 'Overhead of neat desk with planner, coffee, and succulent' },
    { id: 3, title: 'Travel Moments', description: 'Adventure scenes with luggage, maps, and new destinations', colorPalette: ['#87CEEB', '#DEB887', '#F5DEB3', '#4682B4'], mood: 'Adventurous & Curious', props: ['Suitcase', 'Passport', 'Map', 'Camera', 'Train window'], example: 'Suitcase with passport and camera at train station platform' },
    { id: 4, title: 'Self-Care Sunday', description: 'Relaxing home scenes with masks, candles, and comfort', colorPalette: ['#E6E6FA', '#D8BFD8', '#F5F5F5', '#FFB6C1'], mood: 'Indulgent & Relaxing', props: ['Face mask', 'Candle', 'Robe', 'Slippers', 'Netflix remote'], example: 'Person in robe with face mask, candles, and cozy blanket' },
    { id: 5, title: 'Pet Parent Life', description: 'Candid moments with pets and products in natural settings', colorPalette: ['#F5DEB3', '#8B4513', '#D2B48C', '#FFF8DC'], mood: 'Warm & Playful', props: ['Pet bed', 'Toys', 'Treats', 'Cozy blanket', 'Natural light'], example: 'Pet playing with toy on rug with product placed nearby naturally' },
    { id: 6, title: 'Cooking Together', description: 'Shared kitchen moments with hands, ingredients, and laughter', colorPalette: ['#F5F5DC', '#DEB887', '#8B4513', '#FFD700'], mood: 'Warm & Social', props: ['Mixing bowls', 'Hands together', 'Flour dust', 'Family', 'Wooden spoons'], example: 'Hands rolling dough together with flour on wooden counter' },
    { id: 7, title: 'Reading Nook', description: 'Quiet study spaces with books, coffee, and soft light', colorPalette: ['#8B4513', '#F5DEB3', '#D2691E', '#F5F5DC'], mood: 'Quiet & Thoughtful', props: ['Stack of books', 'Reading glasses', 'Coffee', 'Blanket', 'Warm lamp'], example: 'Open book on lap with coffee cup and blanket in armchair' },
    { id: 8, title: 'Night In', description: 'Cozy evening scenes with movies, snacks, and blankets', colorPalette: ['#191970', '#483D8B', '#F5DEB3', '#B0C4DE'], mood: 'Cozy & Relaxed', props: ['TV glow', 'Popcorn', 'Blanket fort', 'String lights', 'Pillows'], example: 'Couch with blanket nest and TV glow with snacks scattered' },
    { id: 9, title: 'Creative Corner', description: 'Art and craft spaces with supplies, mess, and inspiration', colorPalette: ['#FFB6C1', '#87CEEB', '#FFD700', '#98FB98'], mood: 'Creative & Colorful', props: ['Paint tubes', 'Brushes', 'Sketchbook', 'Color swatches', 'Inspiration board'], example: 'Creative desk with paint tubes, brushes, and half-finished artwork' },
    { id: 10, title: 'Minimal Living', description: 'Decluttered spaces with essential objects and calm energy', colorPalette: ['#F5F5F5', '#E0E0E0', '#B0B0B0', '#D3D3D3'], mood: 'Peaceful & Essential', props: ['Single object', 'Clean surface', 'Natural light', 'Hidden storage', 'Plant'], example: 'Minimal shelf with single vase, one book, and small succulent' }
  ],
  creative: [
    { id: 1, title: 'Art Studio', description: 'Creative spaces with supplies, canvases, and natural light', colorPalette: ['#F5DEB3', '#D2691E', '#87CEEB', '#FFD700'], mood: 'Inspiring & Messy', props: ['Paint tubes', 'Canvas', 'Easel', 'Natural light', 'Palette'], example: 'Artist hand with brush on canvas with paint tubes scattered' },
    { id: 2, title: 'Book Flat Lay', description: 'Styled book arrangements with coffee, plants, and reading props', colorPalette: ['#8B4513', '#F5DEB3', '#D2691E', '#F5F5DC'], mood: 'Literary & Cozy', props: ['Stack of books', 'Coffee', 'Bookmark', 'Reading glasses', 'Plant'], example: 'Stack of books with coffee cup and reading glasses from above' },
    { id: 3, title: 'Writing Process', description: 'Intimate desk scenes with journals, pens, and inspiration', colorPalette: ['#F5F5DC', '#DEB887', '#8B4513', '#D3D3D3'], mood: 'Thoughtful & Quiet', props: ['Journal', 'Fountain pen', 'Ink bottle', 'Letter', 'Candle'], example: 'Hand writing in journal with fountain pen and ink nearby' },
    { id: 4, title: 'Color Study', description: 'Vibrant arrangements of supplies with rainbow organization', colorPalette: ['#FF6347', '#FFD700', '#32CD32', '#1E90FF'], mood: 'Vibrant & Organized', props: ['Color pencils', 'Paint swatches', 'Rainbow order', 'White background'], example: 'Perfect rainbow of colored pencils on white with color wheel' },
    { id: 5, title: 'Vintage Stationery', description: 'Antique writing tools with patina and historical character', colorPalette: ['#CD853F', '#8B4513', '#F4A460', '#D2B48C'], mood: 'Nostalgic & Elegant', props: ['Wax seal', 'Quill', 'Old paper', 'Brass compass', 'Leather journal'], example: 'Wax-sealed letter with quill and old paper on wooden desk' },
    { id: 6, title: 'Maker Workspace', description: 'Hands-on craft spaces with tools, materials, and works in progress', colorPalette: ['#DEB887', '#8B4513', '#A0522D', '#D2691E'], mood: 'Hands-on & Active', props: ['Tools', 'Wood shavings', 'Work in progress', 'Workbench', 'Safety glasses'], example: 'Hands carving wood with shavings scattered on workbench' },
    { id: 7, title: 'Digital Creative', description: 'Modern digital art setups with tablets, styluses, and screens', colorPalette: ['#2F4F4F', '#00CED1', '#1A1A1A', '#C0C0C0'], mood: 'Modern & Focused', props: ['Drawing tablet', 'Stylus', 'Multiple screens', 'Reference images', 'RGB keyboard'], example: 'Digital artist drawing on tablet with reference on second screen' },
    { id: 8, title: 'Library Aesthetic', description: 'Classical book settings with shelves, ladders, and soft light', colorPalette: ['#8B4513', '#F5DEB3', '#D2691E', '#CD853F'], mood: 'Scholarly & Timeless', props: ['Floor-to-ceiling shelves', 'Rolling ladder', 'Reading lamp', 'Leather chair'], example: 'Person reading in leather chair surrounded by floor-to-ceiling bookshelves' },
    { id: 9, title: 'Craft supplies', description: 'Beautifully organized materials with texture and color variety', colorPalette: ['#FFB6C1', '#E6E6FA', '#F5DEB3', '#98FB98'], mood: 'Organized & Satisfying', props: ['Thread spools', 'Fabric swatches', 'Buttons', 'Ribbon rolls', 'Storage jars'], example: 'Organized thread spools in rainbow order with fabric swatches' },
    { id: 10, title: 'Finished Piece', description: 'Completed artwork displayed with pride and proper lighting', colorPalette: ['#FFD700', '#C0C0C0', '#F5F5F5', '#2F4F4F'], mood: 'Proud & Showcase', props: ['Gallery wall', 'Spotlight', 'Frame', 'Clean backdrop', 'Signature'], example: 'Artwork in frame on clean wall with directional spotlight' }
  ],
  general: [
    { id: 1, title: 'Product Hero Shot', description: 'Single product focus with professional lighting and clean background', colorPalette: ['#F5F5F5', '#E0E0E0', '#C0C0C0', '#404040'], mood: 'Professional & Clean', props: ['Gradient backdrop', 'Soft shadow', 'Reflection surface', 'Single light source'], example: 'Product floating with soft shadow on gradient gray background' },
    { id: 2, title: 'Lifestyle In Context', description: 'Product naturally placed in everyday real-life scenarios', colorPalette: ['#DEB887', '#F5F5DC', '#8B4513', '#D3D3D3'], mood: 'Natural & Relatable', props: ['Home setting', 'Natural light', 'Everyday objects', 'Real person'], example: 'Product on kitchen counter with morning coffee and newspaper' },
    { id: 3, title: 'Unboxing Moment', description: 'The reveal experience with packaging, tissue, and first impression', colorPalette: ['#FFFFFF', '#FFD700', '#C0C0C0', '#F5F5F5'], mood: 'Exciting & Premium', props: ['Branded packaging', 'Tissue paper', 'Ribbon', 'Hands opening', 'Thank you card'], example: 'Hands pulling product from beautifully branded box with tissue' },
    { id: 4, title: 'Detail Macro', description: 'Close-up texture and material focus with dramatic lighting', colorPalette: ['#2F4F4F', '#C0C0C0', '#8B4513', '#D3D3D3'], mood: 'Detailed & Quality', props: ['Macro lens', 'Texture focus', 'Side lighting', 'Material close-up'], example: 'Macro shot of product material with side light showing texture' },
    { id: 5, title: 'Color Story', description: 'Products arranged by color with gradient or complementary palette', colorPalette: ['#FF6347', '#FFD700', '#32CD32', '#1E90FF'], mood: 'Colorful & Organized', props: ['Multiple products', 'Color gradient', 'White background', 'Rainbow order'], example: 'Products arranged in rainbow gradient on white background' },
    { id: 6, title: 'Dark & Moody', description: 'Low-key dramatic lighting with shadows and premium feel', colorPalette: ['#1A1A1A', '#2F4F4F', '#C0C0C0', '#8B4513'], mood: 'Dramatic & Luxurious', props: ['Dark background', 'Single light source', 'Smoke', 'Reflection', 'Shadows'], example: 'Product under single spotlight with dramatic shadows and smoke' },
    { id: 7, title: 'Bright & Airy', description: 'High-key lighting with white space and fresh energy', colorPalette: ['#FFFFFF', '#F5F5F5', '#E0E0E0', '#87CEEB'], mood: 'Fresh & Light', props: ['White background', 'Natural light', 'Soft shadows', 'Minimal props'], example: 'Product on white surface with soft natural light and minimal props' },
    { id: 8, title: 'Social Proof', description: 'Products with happy users, ratings, and review elements', colorPalette: ['#FFD700', '#32CD32', '#F5F5F5', '#87CEEB'], mood: 'Trustworthy & Social', props: ['Five stars', 'User photo', 'Review card', 'Smiling person', 'Badge'], example: 'Product with 5-star rating graphic and happy customer photo' },
    { id: 9, title: 'Comparison Shot', description: 'Before/after or versus layout showing transformation or choice', colorPalette: ['#F5F5F5', '#E0E0E0', '#404040', '#C0C0C0'], mood: 'Clear & Informative', props: ['Split frame', 'Before label', 'After label', 'Consistent lighting'], example: 'Split-screen showing product before and after use with labels' },
    { id: 10, title: 'Seasonal Vibe', description: 'Holiday or season-themed styling with relevant decorations', colorPalette: ['#FF6347', '#228B22', '#FFD700', '#F5F5F5'], mood: 'Festive & Timely', props: ['Seasonal decor', 'Holiday colors', 'Themed props', 'Festive lighting'], example: 'Product with seasonal decorations (e.g., pine cones for winter, flowers for spring)' }
  ]
};

export function generateImageThemes(product: string): ImageTheme[] {
  const category = detectCategory(product);
  const themes = THEME_TEMPLATES[category] || THEME_TEMPLATES.general;
  return themes.map(theme => ({
    ...theme,
    example: theme.example.replace(/product|device|item/gi, product.split(' ')[0])
  }));
}

const CAPTION_TEMPLATES: Record<string, string[]> = {
  fashion: [
    "Stepping into the week like... {product} is giving main character energy ✨",
    "Outfit complete. Confidence loading... {product} just hits different 🔥",
    "They say dress for the job you want. I'm dressing for the life I deserve 💫 {product}",
    "New {product} who dis? Weekend plans just got a major upgrade 🌟",
    "Soft girl era activated with {product}. Comfort never looked this good 🌸",
    "Obsessed doesn't even begin to cover it. {product} is THAT girl 💅",
    "When your {product} matches your energy: unmatched ⚡",
    "Monday mood: {product} on, problems off. Let's get it 💼",
    "Found my new ride or die. {product} is coming everywhere with me 👜",
    "The 'I woke up like this' but make it fashion. Thanks {product} 😌",
    "Who needs a runway when the sidewalk works just fine? {product} 💃",
    "Trends come and go but {product} is forever 🖤",
    "This {product} understood the assignment and absolutely nailed it 📸",
    "Serving looks, not excuses. {product} is the secret weapon 🔥",
    "When someone asks where you got that {product} and you just smile 😉",
    "Elevated basics = elevated life. {product} proving the point ✨",
    "Date night ready in 2 seconds thanks to {product}. Efficiency is key 💋",
    "Casual Friday just became Fashion Friday. {product} did that 👔",
    "My {product} collection is growing and my heart is full 🛍️",
    "Not to be dramatic but {product} just changed my entire aesthetic 🎨",
    "Coffee in one hand, {product} on my body, confidence at 100% ☕",
    "The best things in life aren't things... except maybe {product} 💎",
    "Proof that the right {product} can fix a bad day 🌈",
    "Small details, big impact. {product} is the detail I needed ✨",
    "Brunch ready. {product} doing all the heavy lifting while I do the eating 🥂",
    "Some things are worth the hype. {product} is one of those things 🌟",
    "On Wednesdays we wear {product}. Actually, every day. No rules 🦋",
    "Just a casual reminder that {product} exists and you need it 💌",
    "Current status: fully dressed in {product} and fully thriving 🌺",
    "The glow up is real and {product} is taking full credit ✨"
  ],
  tech: [
    "Just unboxed {product} and my setup is never going to be the same 🖥️✨",
    "Productivity level: upgraded. Thanks to {product} I'm unstoppable today ⚡",
    "My desk just got a major glow up. {product} understood the assignment 💻",
    "They said it couldn't be done. Then {product} walked in and proved them wrong 🚀",
    "Tech that actually delivers? {product} is the exception that proves the rule 🔥",
    "Morning routine: coffee, {product}, conquer. Repeat ☕💪",
    "When your {product} is so good you have to stop mid-work and appreciate it 🙌",
    "Game changer alert: {product} just entered the chat and everything's different 🎮",
    "Small device, massive impact. {product} is doing the most (in the best way) 📱",
    "Workflow optimized. Stress minimized. {product} deserves a raise 💼",
    "The future called. It wants its {product} back but I'm not sharing 🤖",
    "Finally, tech that keeps up with my brain. {product} is speed ⚡",
    "My {product} and I have a love language. It's called 'zero lag' 💙",
    "Unboxing {product} felt like Christmas morning but better 🎁",
    "From 0 to productive in 60 seconds. {product} is the shortcut I needed ⏱️",
    "Everyday I'm hustling, but with {product} I'm hustling smarter 🧠",
    "The only relationship that hasn't disappointed me: me and my {product} 💻",
    "Creatives, assemble! {product} is the tool you didn't know you needed 🎨",
    "Tried living without {product}. 0/10 would not recommend. Never again 😅",
    "My {product} setup is giving 'I have my life together' (even if I don't) 📊",
    "Tech spec sheet: impressive. Real life performance: even better. {product} 📈",
    "Just spent 3 hours with {product} and it felt like 20 minutes. Flow state unlocked 🧘",
    "If {product} was a person, it would be that friend who always has their life together 🤝",
    "New gadget day is the best day. {product} just made my week 🎉",
    "Remote work just got an upgrade. {product} is the home office MVP 🏠",
    "From meetings to content creation, {product} handles it all. Multitasking legend 🏆",
    "The 'before {product}' me would not believe the 'after {product}' me 🤯",
    "Innovation that actually makes sense. {product} gets it 🌟",
    "Charging my {product} and my ambitions. Both at 100% 🔋",
    "Siri, take note: {product} is now my favorite thing ever 📲"
  ],
  beauty: [
    "Self-care Sunday just got an upgrade. {product} is the main character today 🛁✨",
    "Skin so good thanks to {product} I might start wearing less makeup... maybe 😌",
    "Glowing and I know exactly why. Spoiler: it's {product} 🌟",
    "My {product} ritual is sacred. 10 minutes of pure bliss every morning ☀️",
    "They asked for my skincare secret. I said {product} and watched jaws drop 💎",
    "Radiance loading... {product} is working overtime and I'm here for it ✨",
    "Bad skin days? Don't know her. {product} said 'not on my watch' 🛡️",
    "Pamper mode: activated. {product} plus a face mask equals pure happiness 🧖‍♀️",
    "The glow isn't from the highlighter, it's from {product} underneath 😏",
    "Morning routine game changer found. {product} is the MVP of my vanity 🏆",
    "Invest in your skin, they said. So I invested in {product}. Best. Decision. Ever. 💰",
    "Confidence level: {product} applied. Ready for anything today 💪",
    "That post-facial glow without the facial appointment? {product} delivers ✨",
    "My skin drank {product} like it was water after a marathon. Thirst = quenched 💧",
    "Beauty sleep is real but {product} is the cheat code 😴✨",
    "Mirror mirror on the wall, who has the best skincare of all? Me, thanks to {product} 🪞",
    "Texture, tone, radiance: {product} checks every box on my list ✅",
    "From dull to dazzling in one application. {product} is pure magic ✨",
    "My {product} shelf is growing and so is my confidence 🌸",
    "Science meets self-care with {product}. My skin is basically getting a PhD 🧪",
    "The only drama I enjoy is in my lashes, not my skin. {product} keeps it smooth 🌊",
    "Applying {product} is my love language. To myself. Self-love level 100 🖤",
    "Age gracefully? I'm aging amazingly thanks to {product} 🦋",
    "No filter needed when {product} is your base layer. True story 📸",
    "Beauty is skin deep but {product} goes deeper. Cellular level gorgeous 🔬",
    "Woke up like this... after applying {product} last night. Cheat codes exist 😴💫",
    "My dermatologist asked what I'm using. I said {product}. She wrote it down ✍️",
    "Glow goals? More like glow reality. {product} made it happen 🌈",
    "Skincare is healthcare and {product} is my daily prescription 💊",
    "One does not simply walk past a mirror after using {product} without looking twice 👀"
  ],
  food: [
    "Weekend brunch just hit different with {product}. Chef's kiss 👨‍🍳💋",
    "Made with love, eaten with zero regrets. {product} is the real MVP 🍽️",
    "Food coma incoming but worth it. {product} is too good to stop 😋",
    "My kitchen just leveled up. {product} is the secret ingredient I was missing ✨",
    "Eating my feelings but make it gourmet. {product} understood the assignment 🎨",
    "From basic to basically amazing: {product} transformation complete 🔥",
    "Meal prep Sunday featuring {product}. This week is going to taste good 🥗",
    "The 'I can't cook' era is officially over. {product} made me believe 🍳",
    "Flavor explosion in 3, 2, 1... {product} delivered and then some 💥",
    "Sunday scaries don't stand a chance against {product} and good food 🍷",
    "My taste buds are throwing a party and {product} is the guest of honor 🎉",
    "Tried {product} once. Now I understand what food is supposed to taste like 🤤",
    "Cooking with {product} feels like having a professional chef whisper in your ear 👂",
    "Comfort food level: expert. {product} takes it there every single time 🏆",
    "Breakfast, lunch, or dinner: {product} doesn't discriminate. All meals welcome 🌅",
    "Foodie friends, assemble! {product} needs to be on your must-try list 📝",
    "The only thing better than {product} is more {product}. Seconds please! 🍽️",
    "Kitchen experiments: successful. {product} is the lab equipment I needed 🧪",
    "Home cooked but restaurant quality. {product} is the difference maker ⭐",
    "Eating well isn't hard when {product} is involved. Delicious decisions only 🥑",
    "My pantry has a new VIP and its name is {product}. Front shelf status 🏆",
    "Food is fuel but {product} makes it feel like a celebration 🎊",
    "Midnight snack game just got dangerous. {product} is too accessible 😅",
    "In a committed relationship with good food and {product} is our matchmaker 💕",
    "Meals without {product}? Possible. Meals worth remembering? Not without it ✨",
    "The secret family recipe just got a new secret: {product}. Don't tell grandma 🤫",
    "When {product} is on the menu, cancellation plans are not an option 📅",
    "Taste test passed with flying colors. {product} gets an A+ from my palate 🎓",
    "Cooking is love made visible, and {product} is my love language 🍝",
    "Dinner party hero status achieved. Guests asked for the recipe: it's {product} 🦸"
  ],
  home: [
    "Home is where the {product} is. My space just got a major upgrade 🏠✨",
    "Cozy level: maximum. {product} turned my house into a sanctuary 🛋️",
    "Interior glow up in progress. {product} is doing the heavy lifting 🎨",
    "This corner of my home is my favorite thanks to {product}. Pure peace ✨",
    "Coming home to {product} is the best part of my day. No contest 🌅",
    "They said make your house a home. {product} said 'hold my drink' 🍷",
    "Saturday mornings hit different with coffee and {product} in my space ☕",
    "My living room called. It said thank you for {product}. You're welcome 🛋️",
    "Small changes, massive vibes. {product} just redecorated my entire mood 🌈",
    "Homebody status: proud. Especially with {product} making it this good 📚",
    "The 'before' was fine. The 'after' with {product} is everything 🔄",
    "Nest mode: fully activated. {product} is the final piece I needed 🕊️",
    "Guests keep asking about {product}. It's called good taste, Karen 😌",
    "My home aesthetic is giving 'adulting done right' and {product} is why 🏆",
    "From house to haven: the {product} effect is real ✨",
    "Sunday reset just got an upgrade. {product} makes organizing feel like self-care 🧘",
    "That warm fuzzy feeling? It's not just the blanket, it's {product} too 🧶",
    "Home tour stop #1: the {product} corner. Yes, it has its own corner 📍",
    "Waking up in a space with {product} is how every day should start 🌞",
    "Pinterest board brought to life. {product} was the missing link 🔗",
    "Candles lit, {product} displayed, vibes immaculate. Perfect evening 🕯️",
    "My therapist: and what brings you peace? Me: *shows photo of {product}* 🖼️",
    "Decluttered the space, added {product}, and suddenly I'm a minimalist guru 🧘",
    "Home is not a place, it's a feeling. {product} delivers that feeling daily 💫",
    "Rainy days + {product} + hot tea = my definition of perfect 🌧️",
    "Hosting game: elevated. {product} has the conversation started before I do 🥂",
    "The glow up my home deserved. {product} understood the assignment 📋",
    "Working from home but make it aesthetic. {product} is the WFH MVP 💼",
    "My space finally matches my vision. {product} was the bridge to get there 🌉",
    "Invest in your nest. {product} is the best investment I've made this year 📈"
  ],
  fitness: [
    "Sweat now, shine later. {product} is making sure of it 💪✨",
    "My workout buddy doesn't cancel. {product} shows up every single day 🏋️",
    "New PR unlocked and {product} was there for every rep 🏆",
    "Gym bag essential status: achieved. {product} never gets left behind 🎒",
    "Morning grind just got better. {product} is the pre-workout motivation I need ☀️",
    "Progress, not perfection. But with {product}, the progress is noticeable 📈",
    "When {product} is part of the routine, showing up is non-negotiable 🔥",
    "Sore today, strong tomorrow. {product} is recovery done right 🧘",
    "Fitness is a journey and {product} is my favorite travel companion 🗺️",
    "That post-workout feeling amplified by {product}. Pure bliss 😌",
    "No excuses when {product} makes it this easy to stay consistent ✅",
    "The only bad workout is the one that didn't happen. {product} keeps me showing up 🎯",
    "From warmup to cooldown, {product} has my back (and my core, and my legs) 🏃",
    "Gym rats, check in! Who's crushing it today with {product}? Drop a 🔥",
    "My relationship status: committed to my goals and {product} is helping 💕",
    "Rest day just got productive. {product} is recovery, redefined 🛁",
    "Weekend warrior mode: activated. {product} is the secret weapon ⚔️",
    "Sweat is just fat crying, and {product} is making mine sob 😭💦",
    "Consistency beats intensity but with {product} I get both 💥",
    "Started from the couch, now we're here. {product} was part of the journey 🛋️➡️🏋️",
    "Fitness goals loading... {product} is the progress bar accelerator ⏩",
    "Your only competition is you. {product} makes sure you're winning 🥇",
    "Movement is medicine and {product} is my daily dose 💊",
    "Stronger than yesterday. {product} is the difference maker 📊",
    "The grind includes Friday. {product} doesn't take days off and neither do I 🔥",
    "When the playlist hits and {product} kicks in, I'm unstoppable 🎵",
    "Transformations don't happen overnight but {product} speeds up the clock ⏰",
    "Active recovery is still active. {product} makes rest feel productive 🧘",
    "Fitness isn't about being better than others. It's about being better with {product} 🌟",
    "The best project you'll ever work on is you. {product} is the tool kit 🛠️"
  ],
  lifestyle: [
    "Living my best life and {product} is definitely part of the equation ✨",
    "Small joys, big impact. {product} is today's joy multiplier 🌈",
    "Adulting is hard. {product} makes it look like I have my life together 📋",
    "Daily rituals matter. {product} is the one I never skip 🌅",
    "Finding joy in the everyday with {product}. It's the little things 💫",
    "My {product} era has begun and honestly? It suits me 🦋",
    "Weekend vibes powered by {product}. Pure contentment mode 🛋️",
    "The chaos is still there but {product} makes it manageable 🌪️➡️☀️",
    "Making ordinary moments feel special. That's the {product} effect ✨",
    "Self-care isn't selfish when {product} is involved. It's necessary 🖤",
    "Monday through Sunday, {product} is the constant I can count on 📅",
    "Simplicity is the ultimate sophistication. {product} gets it 🎯",
    "Life hack: add {product} to any situation and watch it improve 🧙",
    "My daily non-negotiables: coffee, goals, and {product}. In that order ☕",
    "Collecting moments, not things... except {product}. That's worth collecting 🎁",
    "The 'treat yourself' movement has a leader and it's {product} 💝",
    "Slow living advocate with {product} as my spokesperson. Balance achieved ⚖️",
    "Mood: {product} in hand, worries out of mind. Living the dream 🌤️",
    "Some purchases you regret. {product} is the opposite of that. Zero regrets 🚫",
    "Everyday luxury isn't a myth. {product} proves it exists ✨",
    "My comfort zone has a new address and {product} lives there 🏠",
    "Hustle culture who? I'm thriving quietly with {product} 🧘",
    "The small upgrade that changed everything: enter {product} 🎬",
    "Saturday morning energy: {product} plus nowhere to be. Perfect combo 🌞",
    "Mindful moments start with {product}. Presence, activated 🧠",
    "Productivity and peace can coexist. {product} is the proof 📖",
    "Curating a life I love and {product} made the cut. VIP status 🏆",
    "Simple pleasures are the best pleasures. {product} is Exhibit A 🏛️",
    "Today's forecast: 100% chance of good vibes with {product} 🌤️",
    "Level up your everyday. {product} is the cheat code to better days ⬆️"
  ],
  creative: [
    "Creating magic one page at a time. {product} is my wand ✨",
    "Inspiration struck and {product} caught it. New project loading... 🎨",
    "The blank page isn't scary when {product} is in your corner 📖",
    "Lost in the flow state with {product}. Time doesn't exist here ⏳",
    "Ideas become reality with the right tools. {product} is that tool 🛠️",
    "My creative process: chaos, coffee, and {product}. In that order ☕",
    "Making things with {product} is how I meditate. Pure focus 🧘",
    "Every masterpiece starts somewhere. Today it starts with {product} 🖼️",
    "The muse is fickle but {product} is always ready when she shows up 🦋",
    "Writer's block? Never heard of her. {product} keeps the words flowing ✍️",
    "Creating something from nothing is magic. {product} is my spell book 🔮",
    "My desk is messy but my ideas are clear, thanks to {product} 💡",
    "Art is not what you see but what you make others feel. {product} helps me express 🎭",
    "Sunday morning journaling with {product}. Therapy that fits in my bag 📝",
    "The best ideas come when you're not looking. {product} is always ready to catch them 🕸️",
    "From mind to page to world. {product} bridges the gap 🌉",
    "Creative energy: 100%. {product} is the outlet it needed 🔌",
    "Dream big, create bigger. {product} doesn't limit my imagination 🚀",
    "My happy place smells like coffee and looks like {product} in action ☕🎨",
    "Perfection is boring. {product} helps me embrace the beautiful mess 🎭",
    "Ideas are fragile. {product} helps me hold them gently until they're ready 🥚",
    "Making time for what matters: creating with {product} is non-negotiable 📅",
    "The world needs your art. {product} helps you put it out there 🌍",
    "Creative blocks are just detours. {product} is the GPS back to flow 🗺️",
    "Every stroke, every word, every note matters. {product} honors that ✍️",
    "My {product} collection is my treasure. Each piece holds a story 📚",
    "From sketch to final piece: {product} is there for the whole journey 🛤️",
    "Create first, doubt later (or never). {product} is the courage I need 🦁",
    "Art supplies are just potential in disguise. {product} is full of it 🎁",
    "Today's creation brought to you by caffeine and {product}. Let's make something beautiful 🌟"
  ],
  general: [
    "Just discovered {product} and my expectations have been permanently raised ✨",
    "When something works THIS well, you have to share it. {product} is that something 🔥",
    "Life hack unlocked: {product} is the shortcut I didn't know I needed 🗝️",
    "The 'before {product}' vs 'after {product}' difference is night and day 🌙➡️☀️",
    "Obsessed is an understatement. {product} just set a new standard 🏆",
    "My daily routine has a new non-negotiable and it's {product}. No regrets ✅",
    "Trying {product} was a choice. Continuing to use it was inevitable 😌",
    "The best things aren't always expensive but they feel premium. {product} proves it 💎",
    "Weekend plans: test {product}. Spoiler alert: it passed with flying colors 🎉",
    "Who knew {product} could make such a difference? Not me, until now 🤯",
    "Small product, massive impact. {product} is the definition of value 💰",
    "My trusted sidekick for literally everything: {product}. Reliable legend 🦸",
    "The glow up my routine needed. {product} delivered and then some 🌟",
    "When {product} is involved, good days become great days 📈",
    "Didn't know I needed {product} until I tried it. Now I can't go back ⏪",
    "Quality over quantity but {product} gives me both. Best of both worlds 🌎",
    "Monday motivation brought to you by {product}. Starting the week right 💪",
    "If {product} was a person, it would be that overachiever we all secretly admire 📚",
    "My {product} and I are in a committed relationship. It's going great 💕",
    "Proof that the right tools matter. {product} is the rightest of them all 🔧",
    "From skeptical to obsessed in one use. {product} converted me 🙏",
    "Daily driver status: achieved. {product} is here to stay 🚗",
    "Elevating the everyday is an art form and {product} is the brush 🖌️",
    "The difference between good and great? Often it's just {product} 📊",
    "Buying {product} was a transaction. Using it is an experience 💫",
    "Some products work. {product} works wonders. There's a difference ✨",
    "My {product} shelf is growing and so is my satisfaction. Coincidence? 🤔",
    "Problem: existed. Solution: found. It's called {product} and it's perfect ✅",
    "Not saying {product} changed my life but my life is definitely different 🔄",
    "Lasting impression status: achieved. {product} is unforgettable 💭"
  ]
};

const HASHTAG_POOLS: Record<string, string[]> = {
  fashion: ['#OOTD', '#FashionFinds', '#StyleInspo', '#TrendAlert', '#WardrobeGoals', '#LookBook', '#FashionDaily', '#StreetStyle', '#InstaFashion', '#StyleGram', '#OutfitInspo', '#FashionReels', '#GetReadyWithMe', '#FashionHacks', '#StyleTips', '#MustHave', '#NewIn', '#FashionMonth', '#DailyLook', '#StyleInfluencer'],
  tech: ['#TechReview', '#GadgetLover', '#SmartTech', '#TechFinds', '#Innovation', '#TechGadgets', '#InstaTech', '#GadgetGram', '#TechDaily', '#SmartLiving', '#FutureTech', '#TechReels', '#Unboxing', '#TechHacks', '#MustHaveTech', '#ProductReview', '#TechTips', '#NewGadget', '#DigitalLife', '#TechEssentials'],
  beauty: ['#BeautyFinds', '#SkincareRoutine', '#GlowUp', '#BeautyTips', '#MakeupLovers', '#SkinCare', '#BeautyGram', '#SkincareAddict', '#MakeupDaily', '#GlowCheck', '#BeautyReels', '#SkinTok', '#MakeupArt', '#BeautyTok', '#SkincareTok', '#MakeupTutorial', '#GlamCheck', '#ProductReview', '#RoutineCheck', '#SkinCareTips'],
  food: ['#FoodieFinds', '#RecipeShare', '#HomeCooking', '#FoodLovers', '#MustTry', '#FoodHacks', '#FoodGram', '#InstaFood', '#FoodPorn', '#RecipeReels', '#HomeCooked', '#FoodieLife', '#EatLocal', '#FoodTok', '#RecipeTok', '#CookingHack', '#FoodReview', '#WhatIEat', '#MealPrep', '#Tasty'],
  home: ['#HomeDecor', '#InteriorInspo', '#HomeGoals', '#DecorFinds', '#LivingSpace', '#DesignInspo', '#HomeInspo', '#InteriorDesign', '#DecorDaily', '#HomeGram', '#StyledSpaces', '#DesignReels', '#RoomTour', '#HomeTok', '#DecorTok', '#RoomMakeover', '#DIYHome', '#SpaceRefresh', '#HomeHacks', '#CleanTok'],
  fitness: ['#FitnessMotivation', '#WorkoutRoutine', '#HealthyLife', '#GymLife', '#FitnessJourney', '#Wellness', '#FitLife', '#WorkoutReels', '#GymGram', '#FitnessDaily', '#TrainingDay', '#SweatCheck', '#FitInspo', '#FitTok', '#GymTok', '#FitnessHack', '#SweatCheck', '#ExerciseTips', '#GymMotivation', '#ActiveLife'],
  lifestyle: ['#LifestyleFinds', '#DailyInspo', '#LifeHacks', '#MustHave', '#TrendingNow', '#EverydayEssentials', '#InstaDaily', '#LifeGram', '#LifestyleReels', '#DailyVibes', '#Essentials', '#LivingWell', '#RoutineCheck', '#LifeTok', '#DailyRoutine', '#ProductReview', '#MustHaves', '#Haul', '#ThingsYouNeed', '#AmazonFinds'],
  creative: ['#CreativeFinds', '#ArtSupplies', '#BookLovers', '#StationeryAddict', '#CreativeLife', '#MakerSpace', '#ArtGram', '#BookGram', '#CreativeReels', '#StationeryLove', '#ProcessArt', '#AestheticReads', '#MakerGram', '#ArtTok', '#BookTok', '#StationeryTok', '#CreativeProcess', '#MakerTok', '#JournalWithMe', '#StudyWithMe'],
  general: ['#MustHave', '#TrendingNow', '#DailyFinds', '#ProductReview', '#TopRated', '#Essentials', '#InstaFinds', '#DailyEssentials', '#ReelsDaily', '#ProductFeature', '#TopPicks', '#TikTokMadeMeBuyIt', '#HonestReview', '#AmazonFinds', '#DailyEssential', '#NewFind', '#ProductOfTheDay', '#ReviewTime', '#WorthIt', '#TryThis']
};

const BEST_FOR_POOLS: Record<string, string[]> = {
  fashion: ['Stories', 'Reels', 'Feed posts', 'Carousels'],
  tech: ['Reels', 'TikTok', 'Stories', 'Review posts'],
  beauty: ['Reels', 'Stories', 'Before/After posts', 'Tutorials'],
  food: ['Reels', 'TikTok', 'Stories', 'Carousels'],
  home: ['Carousels', 'Reels', 'Stories', 'Before/After'],
  fitness: ['Reels', 'TikTok', 'Stories', 'Progress posts'],
  lifestyle: ['Stories', 'Reels', 'TikTok', 'Daily posts'],
  creative: ['Carousels', 'Reels', 'Stories', 'Process posts'],
  general: ['Reels', 'Stories', 'Feed', 'TikTok']
};

const TONE_POOLS: Record<string, string[]> = {
  fashion: ['Confident', 'Playful', 'Trendy', 'Bold', 'Chic'],
  tech: ['Informative', 'Excited', 'Curious', 'Professional', 'Innovative'],
  beauty: ['Empowering', 'Relatable', 'Glowing', 'Honest', 'Indulgent'],
  food: ['Appetizing', 'Warm', 'Fun', 'Tempting', 'Comforting'],
  home: ['Cozy', 'Inspiring', 'Calm', 'Proud', 'Aspirational'],
  fitness: ['Motivational', 'Determined', 'Energetic', 'Honest', 'Proud'],
  lifestyle: ['Relatable', 'Easygoing', 'Mindful', 'Joyful', 'Authentic'],
  creative: ['Inspiring', 'Thoughtful', 'Playful', 'Passionate', 'Dreamy'],
  general: ['Enthusiastic', 'Honest', 'Relatable', 'Helpful', 'Excited']
};

export function generateCaptions(product: string): CaptionIdea[] {
  const rand = createSeededRandom(product + '_captions_v2');
  const category = detectCategory(product);
  const templates = CAPTION_TEMPLATES[category] || CAPTION_TEMPLATES.general;
  const hashtags = HASHTAG_POOLS[category] || HASHTAG_POOLS.general;
  const bestFor = BEST_FOR_POOLS[category] || BEST_FOR_POOLS.general;
  const tones = TONE_POOLS[category] || TONE_POOLS.general;
  
  const shuffledTemplates = [...templates].sort(() => rand() - 0.5);
  
  return shuffledTemplates.slice(0, 30).map((template, i) => {
    const selectedHashtags = pick(hashtags, rand, 5 + Math.floor(rand() * 5));
    return {
      id: i + 1,
      text: template.replace(/{product}/g, product),
      hashtags: selectedHashtags,
      bestFor: pick(bestFor, rand, 1)[0],
      tone: pick(tones, rand, 1)[0]
    };
  });
}

const VIDEO_SCRIPT_TEMPLATES: Record<string, VideoScript[]> = {
  fashion: [
    {
      id: 1,
      title: "3-Second Style Transformation",
      duration: "15-30 seconds",
      hook: "POV: You finally found the perfect {product}",
      scenes: [
        "0-3s: Start in pajamas/messy room, look disappointed at closet",
        "3-8s: Pull out {product} with dramatic music swell",
        "8-15s: Quick transition cut - now fully styled, walking confidently",
        "15-20s: Slow-mo spin or strut toward camera",
        "20-30s: Close-up of outfit details, product shot"
      ],
      cta: "Link in bio! Swipe up para sa discount code ✨"
    },
    {
      id: 2,
      title: "Honest Review + Try-On",
      duration: "30-45 seconds",
      hook: "Okay real talk, is {product} worth the hype?",
      scenes: [
        "0-3s: Unboxing {product} with skeptical face",
        "3-10s: First impression reaction - texture, fit, color check",
        "10-20s: Try-on montage with different styling options",
        "20-30s: Honest pros and cons while wearing it",
        "30-45s: Final verdict with thumbs up or side-eye"
      ],
      cta: "Comment 'LINK' para ma-send ko sa'yo ang shop! 💬"
    },
    {
      id: 3,
      title: "Styling Challenge",
      duration: "45-60 seconds",
      hook: "I styled {product} 5 different ways in 60 seconds - go!",
      scenes: [
        "0-5s: Show {product} alone, set the timer",
        "5-15s: Look 1 - Casual/errands (fast cuts)",
        "15-25s: Look 2 - Work/professional",
        "25-35s: Look 3 - Night out/date night",
        "35-45s: Look 4 - Comfy/loungewear",
        "45-55s: Look 5 - Unexpected/creative combo",
        "55-60s: Collage of all 5 looks, which is your favorite?"
      ],
      cta: "Which look is your fave? Comment 1-5! 👇"
    }
  ],
  tech: [
    {
      id: 1,
      title: "Unboxing + First Impression",
      duration: "30-45 seconds",
      hook: "Unboxing {product} without reading the manual (what could go wrong?)",
      scenes: [
        "0-5s: Package on table, satisfying box opening sounds",
        "5-12s: Reveal {product} - first reaction, weight check, design appreciation",
        "12-20s: Quick setup montage (speed up the boring parts)",
        "20-30s: First test - does the main feature actually work?",
        "30-40s: Compare with old version or competitor",
        "40-45s: Initial verdict - worth it or return?"
      ],
      cta: "Full review on my page! Follow for more tech finds 🔧"
    },
    {
      id: 2,
      title: "Day in the Life with {product}",
      duration: "45-60 seconds",
      hook: "A day with {product}: let's see if it survives my chaos",
      scenes: [
        "0-5s: Morning alarm, grab {product} first thing",
        "5-15s: Commute/work setup - {product} in action",
        "15-25s: Stress test - battery life, performance under pressure",
        "25-35s: Afternoon slump - does it help or hinder?",
        "35-45s: Evening wind down - final battery/performance check",
        "45-55s: Recap of what worked and what didn't",
        "55-60s: Real user moment - still functional after 12 hours?"
      ],
      cta: "Ask me anything about {product} in the comments! 💬"
    },
    {
      id: 3,
      title: "Tech Hack / Hidden Feature",
      duration: "30-45 seconds",
      hook: "Nobody told me {product} could do THIS 🤯",
      scenes: [
        "0-3s: Show {product} looking normal, innocent setup",
        "3-8s: 'So I was messing around when...'",
        "8-18s: Reveal hidden feature or hack - demo with reaction",
        "18-25s: Show 2-3 more tricks most people miss",
        "25-35s: Before/after comparison using the hacks",
        "35-45s: 'Am I the last person to know this?'"
      ],
      cta: "Save this for later! You'll thank me 📌"
    }
  ],
  beauty: [
    {
      id: 1,
      title: "Before & After Transformation",
      duration: "30-45 seconds",
      hook: "POV: You finally found a {product} that actually works",
      scenes: [
        "0-5s: Bare face/skin, natural lighting, no filter",
        "5-10s: Application process - satisfying texture/motion",
        "10-15s: Wait time montage (coffee sip, scroll phone)",
        "15-25s: Reveal shot - dramatic lighting change or side-by-side",
        "25-35s: Close-up of results - texture, glow, difference",
        "35-45s: Reaction - genuine surprise or satisfaction"
      ],
      cta: "Routine details sa caption! Check mo na 👇"
    },
    {
      id: 2,
      title: "GRWM with {product}",
      duration: "45-60 seconds",
      hook: "Get ready with me but make it a {product} review",
      scenes: [
        "0-5s: Fresh out of shower/towel hair, start with skincare",
        "5-15s: Apply {product} with commentary on feel/smell",
        "15-25s: Makeup application while talking about skin prep",
        "25-35s: Outfit selection - what works with today's glow",
        "35-45s: Final look, natural light check",
        "45-55s: How {product} held up after full routine",
        "55-60s: Final mirror moment and peace out"
      ],
      cta: "Ano'ng skincare gusto mong i-review next? Comment below! 💬"
    },
    {
      id: 3,
      title: "Honest Ingredient Breakdown",
      duration: "30-45 seconds",
      hook: "I read the {product} ingredient list so you don't have to",
      scenes: [
        "0-5s: Show product packaging, zoom to ingredient list",
        "5-12s: Highlight hero ingredient - what it actually does",
        "12-20s: Call out 1-2 controversial ingredients honestly",
        "20-28s: Who it's for vs. who should skip it",
        "28-35s: Texture/application demo on skin",
        "35-45s: Science-backed or marketing fluff? Final call"
      ],
      cta: "Ingrediente na gusto mong i-explain? Comment lang! 🧪"
    }
  ],
  food: [
    {
      id: 1,
      title: "Quick Recipe with {product}",
      duration: "30-45 seconds",
      hook: "Dinner in 15 minutes thanks to {product} 🍽️",
      scenes: [
        "0-3s: Empty pan/fridge, hungry face",
        "3-10s: Prep ingredients using {product} - quick cuts",
        "10-18s: Cooking process with sizzle sounds, ASMR",
        "18-25s: Plating - make it look restaurant quality",
        "25-35s: First bite reaction - genuine expression",
        "35-45s: Finished plate beauty shot, steam rising"
      ],
      cta: "Full recipe nasa caption! Try mo na 👨‍🍳"
    },
    {
      id: 2,
      title: "{product} Taste Test / Review",
      duration: "30-45 seconds",
      hook: "Is {product} really worth the hype? Taste test begin!",
      scenes: [
        "0-5s: Product reveal, packaging inspection",
        "5-12s: First smell/appearance check",
        "12-18s: First bite - initial reaction (no talking, just face)",
        "18-25s: Second bite with actual thoughts",
        "25-35s: Compare with similar products",
        "35-45s: Price vs. value verdict, would you buy again?"
      ],
      cta: "San mo nabili? Link ko na sa bio! 🛒"
    },
    {
      id: 3,
      title: "Kitchen Hack Using {product}",
      duration: "15-30 seconds",
      hook: "This {product} hack changed my kitchen game forever",
      scenes: [
        "0-3s: Show common kitchen problem/frustration",
        "3-8s: Introduce {product} as the unlikely solution",
        "8-15s: Demo the hack - before vs. after in real time",
        "15-20s: Show results - time saved, quality improved",
        "20-30s: Close-up of the perfect result"
      ],
      cta: "Save this hack! Malaking tulong sa kitchen 🍳"
    }
  ],
  home: [
    {
      id: 1,
      title: "Room Transformation with {product}",
      duration: "30-45 seconds",
      hook: "Transforming my space with {product} in 1 afternoon",
      scenes: [
        "0-5s: Before shot - cluttered/dull space",
        "5-15s: Process montage - adding {product}, rearranging",
        "15-25s: During transformation - things coming together",
        "25-35s: Reveal shot - dramatic after view",
        "35-45s: Detail shots of {product} styled in the space"
      ],
      cta: "Shop the look - links sa caption! 🏠"
    },
    {
      id: 2,
      title: "Home Hack / Organization",
      duration: "15-30 seconds",
      hook: "My organized space secret: it's just {product}",
      scenes: [
        "0-3s: Messy drawer/closet before",
        "3-8s: Quick {product} setup",
        "8-15s: Organizing process - satisfying before/after",
        "15-20s: Final organized space reveal",
        "20-30s: Maintenance tips - how it stays organized"
      ],
      cta: "Organize your space too! Link in bio 📦"
    },
    {
      id: 3,
      title: "Cozy Evening Routine",
      duration: "45-60 seconds",
      hook: "My evening wind-down always includes {product}",
      scenes: [
        "0-5s: Coming home, dropping bag, tired but happy",
        "5-12s: Setting the mood - lights, music, {product} placement",
        "12-20s: Making comfort food/drink with {product} nearby",
        "20-30s: Settling in - blanket, book, {product} in use",
        "30-40s: Quiet moment - enjoying the cozy atmosphere",
        "40-50s: Night prep - {product} for tomorrow",
        "50-60s: Lights out, peaceful room shot"
      ],
      cta: "Your cozy night essentials? Share mo sa comments! 🕯️"
    }
  ],
  fitness: [
    {
      id: 1,
      title: "Workout Routine with {product}",
      duration: "30-45 seconds",
      hook: "My {product} workout that actually gets results 🔥",
      scenes: [
        "0-5s: Gym/outdoor setup, {product} ready",
        "5-12s: Warm-up using {product} - dynamic movements",
        "12-20s: Main workout - 2-3 exercises with {product}",
        "20-30s: Intensity push - sweat, effort, determination",
        "30-40s: Cool down stretch with {product}",
        "40-45s: Post-workout glow, hydration break"
      ],
      cta: "Try this routine! Save mo na for later 💾"
    },
    {
      id: 2,
      title: "Honest Gear Review",
      duration: "30-45 seconds",
      hook: "Testing {product} for 30 days - honest results",
      scenes: [
        "0-5s: Day 1 - unboxing, first impressions",
        "5-12s: Week 1 - initial performance, any issues?",
        "12-20s: Week 2 - breaking in, comfort check",
        "20-30s: Week 3 - durability test, wash/wear",
        "30-40s: Week 4 - final assessment, worth it?",
        "40-45s: Summary verdict with pros/cons list"
      ],
      cta: "Ano'ng fitness gear gusto mong i-review? Comment! 🏋️"
    },
    {
      id: 3,
      title: "Quick Home Workout",
      duration: "15-30 seconds",
      hook: "No gym? No problem. {product} home workout starts NOW",
      scenes: [
        "0-3s: Living room space clear, {product} visible",
        "3-8s: Exercise 1 - form demo, 5 reps",
        "8-13s: Exercise 2 - different muscle group",
        "13-18s: Exercise 3 - core/cardio finisher",
        "18-25s: Quick circuit repeat or combo move",
        "25-30s: Done! Sweat check, satisfied smile"
      ],
      cta: "Repeat 3x for full workout! Save mo na 💪"
    }
  ],
  lifestyle: [
    {
      id: 1,
      title: "Day in the Life",
      duration: "45-60 seconds",
      hook: "A realistic day with {product} (not the aesthetic version)",
      scenes: [
        "0-5s: Morning chaos, alarm, coffee, grab {product}",
        "5-12s: Commute/errands - {product} in real world use",
        "12-20s: Work/study - does it actually help?",
        "20-30s: Lunch break - {product} during downtime",
        "30-40s: Afternoon slump - {product} to the rescue?",
        "40-50s: Evening routine - winding down with {product}",
        "50-60s: Bedtime reflection - honest day summary"
      ],
      cta: "Real talk, worth it ba? Comment your thoughts! 💬"
    },
    {
      id: 2,
      title: "Unboxing + First Week",
      duration: "30-45 seconds",
      hook: "I used {product} for a week so you don't have to guess",
      scenes: [
        "0-5s: Unboxing - packaging, first look",
        "5-10s: Day 1 setup and initial confusion",
        "10-18s: Day 2-3 - getting the hang of it",
        "18-25s: Day 4-5 - discovering favorite features",
        "25-35s: Day 6-7 - integrated into routine",
        "35-45s: Final thoughts - who needs this vs. who doesn't"
      ],
      cta: "Questions about {product}? Ask me anything! 💭"
    },
    {
      id: 3,
      title: "Problem Solved",
      duration: "15-30 seconds",
      hook: "This {product} solved a problem I didn't know I had",
      scenes: [
        "0-3s: Show the daily frustration or inconvenience",
        "3-8s: {product} enters as the solution",
        "8-15s: Before vs. after using {product}",
        "15-20s: Show how life is easier/better now",
        "20-30s: Reaction - why didn't I get this sooner?"
      ],
      cta: "Same problem? Try {product}! Link sa bio 🛒"
    }
  ],
  creative: [
    {
      id: 1,
      title: "Creative Process Reveal",
      duration: "45-60 seconds",
      hook: "From blank page to finished piece using {product}",
      scenes: [
        "0-5s: Blank canvas/page staring back",
        "5-12s: Gathering {product} and materials",
        "12-20s: Sketch/outline phase - rough beginnings",
        "20-30s: Building layers - {product} in action",
        "30-40s: Details and refinements",
        "40-50s: Almost done - stepping back to assess",
        "50-60s: Final reveal, holding up finished work"
      ],
      cta: "Process video na gusto mong makita? Suggest below! 🎨"
    },
    {
      id: 2,
      title: "{product} Review for Creatives",
      duration: "30-45 seconds",
      hook: "Is {product} actually good for artists? Let's find out",
      scenes: [
        "0-5s: Show {product} specs vs. creative needs",
        "5-12s: First test - basic use, feel and flow",
        "12-20s: Stress test - how does it handle intense use?",
        "20-30s: Compare with current favorite tool",
        "30-40s: Value check - price vs. quality for creatives",
        "40-45s: Verdict - add to toolkit or skip?"
      ],
      cta: "Creative tools na gusto mong ma-review? Comment! ✍️"
    },
    {
      id: 3,
      title: "Speed Create Challenge",
      duration: "30-45 seconds",
      hook: "Making art with {product} in 10 minutes - timer starts NOW",
      scenes: [
        "0-3s: Set timer, show {product}, look determined",
        "3-10s: Quick sketch/outline phase",
        "10-18s: Color/fill - fast decisions only",
        "18-25s: Details under pressure",
        "25-30s: Timer dings! Final touches",
        "30-40s: Show finished piece - not perfect but done",
        "40-45s: What worked and what rushed looks like"
      ],
      cta: "Gusto mo bang subukan? Save this challenge! ⏱️"
    }
  ],
  general: [
    {
      id: 1,
      title: "First Impression Unboxing",
      duration: "30-45 seconds",
      hook: "Unboxing {product} - is it worth your money?",
      scenes: [
        "0-5s: Package arrival, excitement build",
        "5-12s: Unboxing - packaging quality, first touch",
        "12-18s: Product reveal - design, build quality",
        "18-25s: First test - main feature demo",
        "25-35s: Compare with expectation vs. reality",
        "35-45s: Quick verdict - thumbs up, sideways, or down"
      ],
      cta: "Full review soon! Follow para updated ka 📲"
    },
    {
      id: 2,
      title: "{product} in Real Life",
      duration: "45-60 seconds",
      hook: "Using {product} for a week - the honest truth",
      scenes: [
        "0-5s: Day 1 - setup and first use",
        "5-12s: Day 2-3 - integration into routine",
        "12-20s: Day 4-5 - discovering quirks and wins",
        "20-30s: Day 6-7 - stress test or heavy use day",
        "30-40s: Pros list - what genuinely impressed me",
        "40-50s: Cons list - what annoyed me",
        "50-60s: Final recommendation - who should buy this"
      ],
      cta: "Questions? Sagutin ko sa comments! 💬"
    },
    {
      id: 3,
      title: "Quick Feature Demo",
      duration: "15-30 seconds",
      hook: "Watch {product} do the thing it's meant to do",
      scenes: [
        "0-3s: Product intro, what it claims to do",
        "3-8s: Setup - minimal and fast",
        "8-15s: Feature demo - the main event",
        "15-20s: Result shot - did it deliver?",
        "20-30s: Reaction and quick rating"
      ],
      cta: "Gusto mo bang bumili? Check link sa bio! 🛍️"
    }
  ]
};

export function generateVideoScripts(product: string): VideoScript[] {
  const category = detectCategory(product);
  const scripts = VIDEO_SCRIPT_TEMPLATES[category] || VIDEO_SCRIPT_TEMPLATES.general;
  return scripts.map(script => ({
    ...script,
    hook: script.hook.replace(/{product}/g, product),
    scenes: script.scenes.map(scene => scene.replace(/{product}/g, product)),
    cta: script.cta.replace(/{product}/g, product)
  }));
}
