import { seededRandom, pick, pickN } from './randomUtils';

export interface ImageCaption {
  text: string;
  hashtags: string[];
  platform: 'facebook' | 'instagram' | 'tiktok';
}

const facebookCaptions = [
  "Hindi mo na kailangang maghintay pa! Ang {product} ay dito na para gawing mas madali ang araw mo. Worth every peso!",
  "Sino ang gusto ng upgrade? I-try ang {product} at feel the difference! Premium quality na abot-kaya.",
  "Tired of the same old? Switch to {product} and experience something better. Your daily routine deserves this upgrade!",
  "Nagbabago ang game with {product}! Perfect para sa busy lifestyle mo. Order now bago maubos!",
  "Ang sikreto ng mga successful people? They invest in quality. Kaya {product} ang pinili nila. #investinquality",
  "Pangarap mo rin bang gawing effortless? With {product}, possible na! Available na ngayon.",
  "Minsan lang mag-invest sa sarili. Gawin mong worth it with {product}! You deserve the best.",
  "Alam mo bang marami nang nag-switch? Join the {product} family today!",
  "Simpleng bagay, malaking impact. Yan ang {product}. Try it to believe it!",
  "Walang hassle, pure convenience. Yan ang promise ng {product} sa'yo everyday. #hasslefree",
];

const instagramCaptions = [
  "that {product} glow up moment sinong gusto ng glow up rin? #aesthetic #lifestyle",
  "morning routine essential: {product} starting the day right! #morningvibes #selfcare",
  "POV: you finally found the perfect {product} Link in bio! #fyp #musthave",
  "quiet luxury is choosing {product} minimal pero impactful #quietluxury #aesthetic",
  "weekend plans: unboxing my new {product} so excited! #unboxing #newin",
  "soft life era with {product} pangarap mo rin ba ang soft life? #softlife",
  "oOTD? more like essentials of the day featuring {product} #ootd #dailyessentials",
  "before & after using {product} the difference is real! #transformation",
  "coffee + {product} = perfect morning sinong relate? #coffee #morningroutine",
  "new fave alert! {product} is now part of my daily essentials #favefind",
];

const tiktokCaptions = [
  "Tell me you have {product} without telling me you have {product} I'll go first...",
  "that one friend who always recommends {product} tag mo sila! #fyp #relatable",
  "day 1 of using {product} day 30: can't live without it! glow up is real",
  "things I didn't know I needed until I tried {product} #lifehack #fyp",
  "when the {product} hits different sinong gets? comment below! #viral",
  "girls who use {product} have their life together period. #thatgirl #glowup",
  "my honest review of {product} after 1 month spoiler: worth it! #review",
  "yung feeling na may {product} ka ang sarap sa feeling! #satisfying",
  "wait for the glow up... {product} changed the game! #glowup #viral",
  "everyone's talking about {product} so I tried it... here's what happened #fyp",
];

const hashtagPool = [
  "#trending", "#viral", "#musthave", "#fyp", "#foryou", "#aesthetic", "#lifestyle",
  "#selfcare", "#dailyessentials", "#upgrade", "#newin", "#favefind", "#review",
  "#glowup", "#lifechanging", "#worthit", "#quality", "#premium", "#budolfinds",
  "#shopeefinds", "#supportlocal", "#pinoymade", "#smallbusiness", "#shoplocal",
  "#sustainable", "#minimalist", "#luxury", "#ecofriendly", "#handmade",
];

export function generateImageCaptions(description: string, _imageDataUrl: string): ImageCaption[] {
  const seed = description.toLowerCase().trim() + "_" + (_imageDataUrl.length % 10000);
  const rng = seededRandom(seed);
  const product = description.trim() || 'this product';

  const captions: ImageCaption[] = [];

  const fbTemplate = pick(facebookCaptions, rng);
  captions.push({
    text: fbTemplate.replace(/{product}/g, product),
    hashtags: pickN(hashtagPool, 5, rng),
    platform: 'facebook',
  });

  const igTemplate = pick(instagramCaptions, rng);
  captions.push({
    text: igTemplate.replace(/{product}/g, product),
    hashtags: pickN(hashtagPool, 5, rng),
    platform: 'instagram',
  });

  const ttTemplate = pick(tiktokCaptions, rng);
  captions.push({
    text: ttTemplate.replace(/{product}/g, product),
    hashtags: pickN(hashtagPool, 5, rng),
    platform: 'tiktok',
  });

  return captions;
}
