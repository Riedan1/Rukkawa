/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export const WIZARD_STEP_ADVICES: Record<number, string[]> = {
  1: [
    "I suggest keeping your product title clean and descriptive so your buyers immediately understand your beautiful work. Detail your personal story, the local heritage you preserve, and the unique details of your craft. Sharing these genuine human elements builds deep trust and lets buyers connect with you personally.",
    "Every creation carries a soul. When describing your piece, share what inspired its creation and how it reflects your time-honored traditions. Buyers aren't just acquiring an object; they are investing in your journey and honoring your devotion to craftsmanship.",
    "Give your piece a clear, distinctive name that highlights its authentic character. Describe the texture, the raw materials, and the feeling it brings into a home. When you speak candidly about your process, you transform casual visitors into lifelong patrons.",
    "Be proud of your roots and let your craft's regional identity shine through. Mention the specific hands that shaped the piece and the cultural legacy behind it. Authentic storytelling is the greatest differentiator in a world filled with mass production.",
    "Clarity and passion create the strongest impression. Outline what makes your technique special, whether it is hand-dyeing, meticulous chiseling, or heirloom stitching. When buyers read your heartfelt words, they feel the warmth of the artisan behind the screen."
  ],
  2: [
    "I highly recommend showcasing your creations with consistent, well-lit photos against a simple background. If you can, upload short video clips showing your hands in action. When buyers see the care and process behind your work, they feel an authentic personal connection and trust you completely.",
    "Natural, soft daylight brings out the true colors and textures of your materials. Capture close-up angles showing intricate joints, stitches, or hand-painted details. When buyers can zoom in and inspect fine workmanship, doubts vanish and admiration grows.",
    "A short video of your workshop and your tools at work is worth a thousand words. Seeing the rhythm of your hands shaping raw materials proves authenticity and invites buyers behind the scenes of an artisan’s private studio.",
    "Place your product in a warm, relatable setting so buyers can easily visualize it in their daily lives. Pair lifestyle shots with clean, neutral studio photos to provide both aesthetic inspiration and complete visual clarity.",
    "Honesty in imagery creates delighted customers. Capture different perspectives, accurate scale, and authentic textures without heavy filters. When what arrives at their doorstep matches or exceeds their visual expectations, glowing reviews naturally follow."
  ],
  3: [
    "I recommend selecting the most accurate category and filling in complete specifications, dimensions, and variant shades. Providing rich, precise details helps buyers find your items effortlessly and builds genuine confidence in your craftsmanship.",
    "Precision in your specifications removes every hesitation. Clearly note exact measurements, weight, materials, and care recommendations. Thoughtful details answer buyers' questions before they even have to ask, making their decision easy and confident.",
    "Choosing the right category and tagging relevant attributes ensures your work appears in targeted searches across states and abroad. Highlight special variants like custom color palettes or tailored sizes to cater to every buyer's unique preference.",
    "Transparent material sourcing speaks volumes about your integrity. Specify whether your wool is hand-spun, your wood is seasoned cedar, or your clay is locally sourced. Conscientious buyers cherish ethical materials and deliberate technique.",
    "Think like a collector seeking a treasured piece. By listing clear dimension ranges, finish options, and variant availability, you demonstrate professional mastery and make browsing your catalog an effortless, satisfying experience."
  ],
  4: [
    "Let me guide you to price your work transparently. Standardizing your shipping rates with verified logistics partners ensures your buyers face zero surprises, dramatically reducing abandoned checkouts worldwide. Offering a slight introductory discount is also a wonderful way to reward your early supporters!",
    "Price your work with dignity and fair reflection of your time, labor, and heritage. Customers who value genuine craftsmanship respect transparent, honest pricing far more than artificial markups or confusing checkout surprises.",
    "Fast, reliable delivery is the final bridge between your hands and your buyer's home. Clearly setting expectations for packaging, handling times, and carrier tracking across all cities builds reassuring peace of mind from order to unboxing.",
    "A small courtesy discount or complimentary shipping tier for larger orders turns interested browsers into excited buyers. Pair this with reliable cash-on-delivery or secure payment options to build lasting commercial credibility.",
    "Package each shipment with the same love you poured into making it. When shipping rates are upfront and handling is secure, buyers remember the seamless arrival just as fondly as the craft itself, paving the way for repeat orders."
  ],
  5: [
    "Take a moment to review all your product details, shipping options, and media presentation before publishing. A carefully crafted, complete showcase creates a memorable buyer experience and boosts your store's reputation worldwide.",
    "Step back and view your listing through the eyes of someone discovering your craft for the first time. Checking every photo, title, and specification now ensures that your debut makes an unforgettable, polished impression.",
    "Use the Split Preview mode to experience your live showcase exactly as a mobile or desktop buyer will. When your presentation looks cohesive and dignified, your brand stands proudly alongside top international studios.",
    "Publishing a new piece is a celebration of your creativity. Ensure your inventory counts are accurate, your customer communication is ready, and your enthusiasm shows. You are sharing something truly irreplaceable with the world.",
    "Your showcase is live proof of your commitment to excellence. Before you hit publish, double-check your tags and terms. A flawless launch sets the stage for organic word-of-mouth praise and long-term artisan success."
  ]
};

export function getRandomStepAdvice(step: number): string {
  const list = WIZARD_STEP_ADVICES[step] || WIZARD_STEP_ADVICES[1];
  const index = Math.floor(Math.random() * list.length);
  return list[index];
}
