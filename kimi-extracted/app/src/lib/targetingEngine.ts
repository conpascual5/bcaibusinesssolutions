import { seededRandom, pick, pickN } from './randomUtils';

// Facebook Ads Targeting Generator Engine
// Uses seeded random for deterministic output from product name

// Lateral thinking keyword pools — organized by category
const keywordPools: Record<string, string[]> = {
  lifestyle: [
    "Organic food", "Farmers markets", "Yoga", "Meditation", "Mindfulness",
    "Sustainable living", "Minimalism", "Digital nomad", "Remote work",
    "Freelancing", "Entrepreneurship", "Side hustle", "Personal development",
    "Self-improvement", "Morning routines", "Productivity hacks",
    "Work-life balance", "Wellness", "Holistic health", "Clean eating",
    "Meal prepping", "Fitness apps", "Home workouts", "Running",
    "Cycling", "Hiking", "Outdoor activities", "Travel", "Weekend getaways",
    "Staycations", "Airbnb", "Experience gifts", "DIY projects",
    "Home renovation", "Interior design", "Smart home", "Gardening",
    "Plant parenting", "Pet owners", "Dog lovers", "Cat lovers",
    "Coffee culture", "Craft beer", "Wine tasting", "Foodie",
    "Food photography", "Cooking shows", "Baking", "Meal kits",
  ],
  shopping: [
    "Online shopping", "Amazon Prime", "Shopee", "Lazada", "Flash sales",
    "Couponing", "Cashback apps", "Buy now pay later", "Installment payments",
    "Premium brands", "Designer labels", "Fast fashion", "Sustainable fashion",
    "Thrift shopping", "Vintage finds", "Luxury goods", "Beauty products",
    "Skincare routines", "K-beauty", "Sephora", "Ulta Beauty",
    "Subscription boxes", "Monthly deliveries", "Auto-replenish",
    "Gift shopping", "Holiday deals", "Black Friday", "Prime Day",
    "Free shipping", "Same-day delivery", "Buy online pickup in store",
  ],
  tech: [
    "iPhone users", "Android users", "Apple ecosystem", "Samsung",
    "Gadget enthusiasts", "Tech early adopters", "Smartphone photography",
    "Mobile gaming", "Streaming services", "Netflix", "Spotify",
    "Podcast listeners", "Audiobooks", "YouTube", "TikTok",
    "Instagram", "Facebook", "Twitter/X", "LinkedIn", "Discord",
    "Online learning", "E-learning platforms", "Skillshare", "Udemy",
    "Coding", "Web development", "No-code tools", "AI tools",
    "ChatGPT", "Virtual assistants", "Smart speakers", "Wearable tech",
    "Fitness trackers", "Smartwatches", "Wireless earbuds", "Bluetooth",
  ],
  family: [
    "New parents", "First-time moms", "Millennial parents", "Gen Z parents",
    "Working moms", "Stay-at-home parents", "Homeschooling", "Montessori",
    "STEM education", "Kids activities", "Family outings", "Playdate planning",
    "Children's nutrition", "Baby products", "Maternity", "Parenting tips",
    "Child development", "Toddler life", "Teen parenting", "Empty nesters",
    "Grandparents", "Multigenerational living", "Family traditions",
    "Birthday planning", "Family photography", "Kids fashion",
  ],
  interests: [
    "Photography", "Videography", "Content creation", "Influencer marketing",
    "Social media marketing", "Digital marketing", "E-commerce",
    "Dropshipping", "Amazon FBA", "Small business", "Startup culture",
    "Venture capital", "Investing", "Stock market", "Cryptocurrency",
    "Personal finance", "Budgeting", "Saving money", "Financial independence",
    "Real estate", "Home buying", "Renting", "Interior decorating",
    "Furniture shopping", "Home organization", "Decluttering", "Marie Kondo",
    "Reading", "Book clubs", "Fiction", "Non-fiction", "Self-help books",
    " Audiobook listeners", "Podcast addicts", "True crime podcasts",
    "Comedy podcasts", "Business podcasts", "Health podcasts",
    "Music lovers", "Concert goers", "Festival culture", "K-pop",
    "Hip hop", "Indie music", "Classical music", "Jazz",
    "Art", "Museums", "Gallery openings", "Street art", "Calligraphy",
    "Crafting", "Knitting", "Crochet", "Sewing", "Pottery",
    "Board games", "Puzzles", "Escape rooms", "Trivia nights",
  ],
};

const demographicProfiles = [
  { ageRange: "18-24", gender: "All", income: "Entry-level / Students", description: "Young adults exploring new products and building habits" },
  { ageRange: "25-34", gender: "All", income: "Young Professionals", description: "Career-focused, willing to spend on quality and convenience" },
  { ageRange: "25-44", gender: "Women", income: "Middle to Upper-Middle", description: "Primary household purchasers, value-driven but brand-loyal" },
  { ageRange: "30-45", gender: "All", income: "Mid-Career Professionals", description: "Established earners seeking premium solutions" },
  { ageRange: "35-54", gender: "All", income: "Established Professionals", description: "Highest disposable income, quality over price" },
  { ageRange: "25-40", gender: "Men", income: "Tech / Professional", description: "Early adopters, research-heavy buyers" },
  { ageRange: "22-35", gender: "Women", income: "Young Professionals", description: "Trend-aware, influenced by social media and reviews" },
  { ageRange: "40-60", gender: "All", income: "High Earners", description: "Value longevity and premium customer experience" },
  { ageRange: "18-30", gender: "All", income: "Students / Early Career", description: "Price-sensitive but influenced by trends and peers" },
  { ageRange: "28-45", gender: "Women", income: "Working Professionals", description: "Busy lifestyle, prioritizes convenience and efficiency" },
];

const personaTemplates = [
  {
    name: "The Conscious Consumer",
    description: "Values sustainability, quality, and ethical production. Researches before buying and shares positive experiences with their network.",
    lateralKeywords: ["Sustainable living", "Organic food", "Minimalism", "Premium brands", "Personal development"],
  },
  {
    name: "The Ambitious Professional",
    description: "Time-poor but quality-driven. Seeks products that save time, boost productivity, or enhance their professional image.",
    lateralKeywords: ["Productivity hacks", "Remote work", "Personal finance", "Fitness apps", "Smart home"],
  },
  {
    name: "The Trendsetting Millennial",
    description: "Social media active, influenced by aesthetics and peer recommendations. Loves discovering new brands before they go mainstream.",
    lateralKeywords: ["Instagram", "Content creation", "Coffee culture", "Experience gifts", "K-beauty"],
  },
  {
    name: "The Practical Parent",
    description: "Makes purchase decisions based on family needs. Values durability, safety, and products that simplify daily routines.",
    lateralKeywords: ["Parenting tips", "Meal prepping", "Home organization", "Family outings", "Kids activities"],
  },
  {
    name: "The Wellness Enthusiast",
    description: "Invests in physical and mental well-being. Follows health trends and prioritizes self-care as a lifestyle.",
    lateralKeywords: ["Yoga", "Meditation", "Clean eating", "Wellness", "Fitness trackers"],
  },
  {
    name: "The Tech-Savvy Early Adopter",
    description: "Always first to try new gadgets and digital solutions. Makes decisions based on specs, reviews, and innovation.",
    lateralKeywords: ["Tech early adopters", "AI tools", "Smart speakers", "Online learning", "Gadget enthusiasts"],
  },
  {
    name: "The Style-Conscious Shopper",
    description: "Appearance and brand image matter. Follows fashion trends and invests in products that enhance personal style.",
    lateralKeywords: ["Fashion", "Beauty products", "Skincare routines", "Luxury goods", "Instagram"],
  },
  {
    name: "The Homebody Creator",
    description: "Loves staying home and making their space beautiful and functional. Invests in home, decor, and creative hobbies.",
    lateralKeywords: ["Interior design", "DIY projects", "Gardening", "Baking", "Crafting"],
  },
  {
    name: "The Budget-Savvy Maximizer",
    description: "Seeks the best value for money. Hunts deals, reads reviews extensively, and loves products with multiple use cases.",
    lateralKeywords: ["Couponing", "Online shopping", "Cashback apps", "Personal finance", "Budgeting"],
  },
  {
    name: "The Experience Seeker",
    description: "Prefers experiences over possessions. Invests in travel, learning, activities, and memory-making moments.",
    lateralKeywords: ["Travel", "Weekend getaways", "Airbnb", "Foodie", "Outdoor activities"],
  },
];

// Behavioral targeting options — the "pro" layer for Facebook Ads
const behavioralOptions = [
  { name: "Engaged Shoppers", description: "People who have clicked the 'Shop Now' button in the past week. Essential for e-commerce conversions." },
  { name: "Facebook Payments Users", description: "People who have made purchases through Facebook/Instagram checkout." },
  { name: "Expats", description: "People living abroad who shop online for familiar products. Great for global brands." },
  { name: "Mobile Device Users", description: "People who primarily access Facebook on mobile — where most shopping happens." },
  { name: "Small Business Owners", description: "Entrepreneurs who invest in tools and products for their business." },
  { name: "Frequent Travelers", description: "People who travel often and buy products for convenience and portability." },
  { name: "Technology Early Adopters", description: "First to try new tech — high engagement with innovative product ads." },
  { name: "Online Buyers", description: "People who actively purchase products online. Broader but effective reach." },
];

const whyTemplates = [
  "This audience was chosen because they prioritize {value} and are actively seeking solutions like {product} in their daily routine.",
  "These personas represent the intersection of {interest} enthusiasts and practical buyers who regularly invest in {category}.",
  "This targeting leverages lateral interests in {interest} to reach {product} buyers who don't self-identify with the product category.",
  "The chosen demographics align with peak purchasing behavior for {category}, especially among those interested in {interest}.",
  "This audience was selected because lateral data shows strong overlap between {interest} engagement and {product} purchase intent.",
  "These personas were identified through behavioral patterns: they engage with {interest} content and show high conversion on {category} ads.",
  "The targeting reaches beyond direct product interest to capture {interest} audiences who have the same lifestyle needs as {product} buyers.",
];

export interface Persona {
  name: string;
  description: string;
  keywords: string[];
}

export interface Demographics {
  ageRange: string;
  gender: string;
  income: string;
  description: string;
}

export interface BehavioralLayer {
  primary: { name: string; description: string };
  secondary: { name: string; description: string };
  proTip: string;
}

export interface Caption {
  text: string;
  hashtags: string[];
  platform: string;
}

export interface VisualPrompt {
  scene: string;
  prompt: string;
}

export interface VideoScript {
  title: string;
  hook: string;
  scene1: string;
  scene2: string;
  scene3: string;
  cta: string;
  duration: string;
  visualPrompts: VisualPrompt[];
}

export interface TargetingResult {
  product: string;
  personas: Persona[];
  keywords: string[];
  demographics: Demographics;
  behavioralLayer: BehavioralLayer;
  captions: Caption[];
  videoScripts: VideoScript[];
  why: string;
}

// --- Caption Generation ---
const captionTemplates = {
  facebook: [
    "Hindi ka na kailangang maghintay pa! Ang {product} ay dito na para gawing mas madali ang araw mo. #lifechanging",
    "Sino ang gusto ng upgrade? 🙋‍♀️ I-try ang {product} at feel the difference! Mura pero premium quality. #musthave",
    "Tired of the same old? Switch to {product} and experience something better. Your daily routine deserves this! #upgrade",
    "Nagbabago ang game with {product}! Perfect para sa busy lifestyle mo. Order now! ✨ #newfavorite",
    "Ang sikreto ng mga successful people? They invest in quality. Kaya {product} ang pinili nila. #investinquality",
    "Pangarap mo rin bang gawing effortless? With {product}, possible na! Available na sa amin. 💯 #dreambig",
    "Minsan lang mag-invest sa sarili. Gawin mong worth it with {product}! #selflove",
    "Alam mo bang marami nang nag-switch? Join the {product} family today! 👨‍👩‍👧‍👦 #trending",
    "Simpleng bagay, malaking impact. Yan ang {product}. Try it to believe it! ✨ #simplejoys",
    "Walang hassle, pure convenience. Yan ang promise ng {product} sa'yo everyday. #hasslefree",
  ],
  instagram: [
    "that {product} glow up moment ✨ sinong gusto ng glow up rin? 🙋‍♀️ #aesthetic #lifestyle",
    "morning routine essential: {product} ☕️🌿 starting the day right! #morningvibes #selfcare",
    "POV: you finally found the perfect {product} 🥹💕 link in bio! #fyp #musthave",
    "quiet luxury is choosing {product} ✨ minimal pero impactful #quietluxury #aesthetic",
    "weekend plans: unboxing my new {product} 📦✨ so excited to try this! #unboxing #newin",
    "soft life era with {product} 🌸🫧 pangarap mo rin ba ang soft life? #softlife #aesthetic",
    "oOTD? more like essentials of the day featuring {product} 💫 #ootd #dailyessentials",
    "before & after using {product} 🤯 the difference is real! swipe to see → #transformation",
    "coffee + {product} = perfect morning ☕️✨ sinong relate? #coffee #morningroutine",
    "new fave alert! 🚨 {product} is now part of my daily essentials #favefind #dailygrind",
  ],
  tiktok: [
    "Tell me you have {product} without telling me you have {product} 😏 I'll go first...",
    "that one friend who always recommends {product} 🤭🙋‍♀️ tag mo sila! #fyp #relatable",
    "day 1 of using {product} ✨ day 30: can't live without it! 💅 glow up is real",
    "things I didn't know I needed until I tried {product} 🤯 a thread: #lifehack #fyp",
    "when the {product} hits different 🥵✨ sinong gets? comment below! #viral #trending",
    "girls who use {product} have their life together 💅 period. #thatgirl #glowup",
    "my honest review of {product} after 1 month of use ⭐️ spoiler alert: worth it! #review",
    "yung feeling na may {product} ka 💆‍♀️✨ ang sarap sa feeling! #satisfying #aesthetic",
    "wait for the glow up... ⏰ {product} changed the game! before & after ↓ #glowup #viral",
    "everyone's talking about {product} so I tried it... 🤔 here's what happened 👇 #fyp",
  ],
};

const hashtagPool = [
  "#trending", "#viral", "#musthave", "#fyp", "#foryou", "#aesthetic", "#lifestyle",
  "#selfcare", "#dailyessentials", "#upgrade", "#newin", "#favefind", "#review",
  "#glowup", "#lifechanging", "#worthit", "#quality", "#premium", "#budolfinds",
  "#shopeefinds", "#lazadafinds", "#supportlocal", "#pinoymade", "#smallbusiness",
  "#shoplocal", "#ecofriendly", "#sustainable", "#minimalist", "#luxury",
];

function generateCaptions(product: string, rng: () => number): Caption[] {
  const captions: Caption[] = [];
  const platforms: Array<keyof typeof captionTemplates> = ["facebook", "instagram", "tiktok"];

  for (const platform of platforms) {
    const templates = captionTemplates[platform];
    const template = pick(templates, rng);
    const text = String(template || "").replace(/{product}/g, product);
    const hashtags = pickN(hashtagPool, 5, rng);
    captions.push({ text, hashtags, platform });
  }

  // Add 2 more Facebook captions
  for (let i = 0; i < 2; i++) {
    const template = pick(captionTemplates.facebook, rng);
    const text = String(template || "").replace(/{product}/g, product);
    const hashtags = pickN(hashtagPool, 5, rng);
    captions.push({ text, hashtags, platform: "facebook" });
  }

  // Add 2 more Instagram captions
  for (let i = 0; i < 2; i++) {
    const template = pick(captionTemplates.instagram, rng);
    const text = String(template || "").replace(/{product}/g, product);
    const hashtags = pickN(hashtagPool, 5, rng);
    captions.push({ text, hashtags, platform: "instagram" });
  }

  // Add 1 more TikTok caption
  const template = pick(captionTemplates.tiktok, rng);
  const text = String(template || "").replace(/{product}/g, product);
  const hashtags = pickN(hashtagPool, 5, rng);
  captions.push({ text, hashtags, platform: "tiktok" });

  return captions;
}

// --- Video Script Generation ---
const hookTemplates = [
  "Stop scrolling! Kung hinahanap mo ang best {product}, eto na...",
  "Hindi mo na kailangang mag-settle sa less. This {product} will change everything...",
  "Sinubukan ko na ang lahat, pero eto lang ang gumana. {product}...",
  "3 reasons why everyone's switching to {product} — number 2 will shock you!",
  "May sikreto akong ishishare... {product} ang game changer na hinahanap mo!",
];

const ctaTemplates = [
  "Click 'Shop Now' bago maubos ang stocks! Link in bio/comments. 🛒",
  "Comment 'INTERESTED' below at i-send namin ang details sayo! 📩",
  "Swipe up / Click link para mag-order na! Limited slots only ⏰",
  "Save this post at bumili na! Hindi ka magsisisi. 💯",
  "Share this sa friend mong kailangan din ito! Tag mo sila below 👇",
];

// Visual prompt templates for AI image generation
const visualPromptPool = [
  `Professional commercial product photography of {product} on a clean marble surface with soft studio lighting, premium feel, high-end advertising style, 8k quality`,
  `A happy young woman unboxing {product} in a bright modern living room, natural daylight, authentic excited expression, lifestyle photography, warm tones`,
  `Close-up macro shot of {product} showing premium details and texture, shallow depth of field, soft bokeh background, luxury product photography`,
  `Flat lay composition of {product} surrounded by complementary lifestyle items, clean white background, aesthetic product photography, Instagram style`,
  `A person using {product} in a cozy home setting, golden hour lighting, candid lifestyle shot, warm and inviting atmosphere, editorial quality`,
  `Split screen before and after concept with {product}, clean modern design, bright and optimistic color palette, transformation story, advertising visual`,
  `{product} on a styled desk setup with plants and coffee, morning light through window, aesthetic workspace, soft shadows, premium branding photography`,
  `Hands holding {product} against a soft pastel background, clean minimal composition, professional studio lighting, e-commerce product photography`,
  `{product} floating in mid-air with soft gradient background, dynamic angle, dramatic studio lighting, modern advertising visual, high-end commercial style`,
  `Group of diverse friends enjoying {product} together, bright colorful setting, authentic joy, lifestyle advertising, natural lighting, aspirational feel`,
];

function generateVideoScripts(product: string, rng: () => number): VideoScript[] {
  const hooks = pickN(hookTemplates, 3, rng);
  const ctas = pickN(ctaTemplates, 3, rng);

  const scenePool = [
    `Close-up shot of {product} in beautiful lighting. Text overlay: "Game changer"`,
    `Person unboxing {product} with excited reaction. Authentic emotion.`,
    `Before/after split screen showing the transformation with {product}`,
    `Quick demo: How to use {product} in 10 seconds. Fast cuts.`,
    `Testimonial style: Person holding {product}, talking to camera naturally`,
    `Lifestyle shot: {product} in everyday setting (home, office, outdoors)`,
    `Text-on-screen: Key benefit of {product} with product in background`,
    `UGC-style clip: Someone discovering {product} for the first time`,
    `Close-up of {product} details/features. Premium feel.`,
    `Transition montage: Different people using {product} in various settings`,
  ];

  const scripts: VideoScript[] = [];
  const allVisualPrompts = pickN(visualPromptPool, 9, rng);

  for (let i = 0; i < 3; i++) {
    const scenes = pickN(scenePool, 3, rng);
    const visualPrompts: VisualPrompt[] = [
      {
        scene: "Hook Shot",
        prompt: allVisualPrompts[i * 3].replace(/{product}/g, product),
      },
      {
        scene: "Product Hero Shot",
        prompt: allVisualPrompts[i * 3 + 1].replace(/{product}/g, product),
      },
      {
        scene: "Lifestyle/CTA Shot",
        prompt: allVisualPrompts[i * 3 + 2].replace(/{product}/g, product),
      },
    ];

    scripts.push({
      title: `${product} Ad Script ${i + 1} — ${["Emotional", "Demo", "UGC"][i]} Style`,
      hook: hooks[i].replace(/{product}/g, product),
      scene1: scenes[0].replace(/{product}/g, product),
      scene2: scenes[1].replace(/{product}/g, product),
      scene3: scenes[2].replace(/{product}/g, product),
      cta: ctas[i].replace(/{product}/g, product),
      duration: ["15-30s", "30-60s", "15-30s"][i],
      visualPrompts,
    });
  }
  return scripts;
}

export function generateTargeting(product: string): TargetingResult {
  const rng = seededRandom(product.toLowerCase().trim() + "_targeting_v3");

  // 1. Generate 3 personas
  const selectedTemplates = pickN(personaTemplates, 3, rng);
  const allKeywordPools = Object.values(keywordPools).flat();

  const personas: Persona[] = selectedTemplates.map((template) => {
    // Mix template keywords with random lateral keywords
    const extraKeywords = pickN(allKeywordPools, 5, rng);
    const uniqueKeywords = [...new Set([...template.lateralKeywords, ...extraKeywords])].slice(0, 8);

    return {
      name: template.name,
      description: template.description,
      keywords: uniqueKeywords,
    };
  });

  // 2. Generate 12-15 targeting keywords
  // Lateral thinking: mix from multiple unrelated pools
  const lateralPoolKeys = Object.keys(keywordPools);
  const selectedPools = pickN(lateralPoolKeys, 3, rng);
  let keywords: string[] = [];

  for (const poolKey of selectedPools) {
    const pool = keywordPools[poolKey];
    const count = 4 + Math.floor(rng() * 3); // 4-6 per pool
    keywords.push(...pickN(pool, count, rng));
  }

  // Add a few product-adjacent keywords
  const productAdjKeywords = [
    `${product} enthusiasts`,
    `${product} reviews`,
    `${product} alternatives`,
    `Best ${product}`,
    `${product} deals`,
  ];
  keywords.push(...pickN(productAdjKeywords, 2, rng));

  // Deduplicate and shuffle
  keywords = [...new Set(keywords)].sort(() => rng() - 0.5);

  // 3. Demographics
  const demo = pick(demographicProfiles, rng);

  // 4. Behavioral Layer (the "pro" move)
  // Primary: Engaged Shoppers — always suggested for e-commerce
  // Secondary: A complementary behavior based on product type
  const primaryBehavior = behavioralOptions[0]; // Engaged Shoppers
  const secondaryBehavior = pick(behavioralOptions.slice(1), rng);

  const proTips = [
    "Layer 'Engaged Shoppers' on top of Interests to only target people with a proven purchase history. This is the #1 conversion booster.",
    "Combine 'Engaged Shoppers' + a secondary behavior to narrow your audience to high-intent buyers only.",
    "Pro tip: Start with broad Interests + 'Engaged Shoppers', then narrow with Lookalike audiences once you have conversion data.",
    "Adding 'Engaged Shoppers' behavior typically increases CTR by 2-3x compared to Interest-only targeting.",
    "Test with and without the Behavioral layer. In most e-commerce cases, keeping it ON improves ROAS significantly.",
  ];

  // 5. The Why
  const whyTemplate = pick(whyTemplates, rng);
  const interestForWhy = keywords.length > 0 ? pick(keywords, rng) : "relevant interests";
  const valueForWhy = pick(["quality", "convenience", "value", "innovation", "style", "wellness"], rng);

  // Safety: ensure all replace values are strings
  const safeProduct = String(product || "");
  const safeCategory = (safeProduct.split(" ")[0] || "product") + " products";
  const safeInterest = String(interestForWhy || "relevant interests");
  const safeValue = String(valueForWhy || "value");

  const why = String(whyTemplate || "This audience was chosen for {product} based on their interest in {interest} and focus on {value}.")
    .replace(/{product}/g, safeProduct)
    .replace(/{category}/g, safeCategory)
    .replace(/{interest}/g, safeInterest)
    .replace(/{value}/g, safeValue);

  // Generate captions and video scripts
  const captions = generateCaptions(product, rng);
  const videoScripts = generateVideoScripts(product, rng);

  return {
    product,
    personas,
    keywords,
    demographics: demo,
    behavioralLayer: {
      primary: primaryBehavior,
      secondary: secondaryBehavior,
      proTip: pick(proTips, rng),
    },
    captions,
    videoScripts,
    why,
  };
}
