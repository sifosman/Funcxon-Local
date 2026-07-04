require('dotenv').config();

const HUBSPOT_TOKEN = process.env.EXPO_PUBLIC_HUBSPOT_ACCESS_TOKEN || '';
const CONTENT_GROUP_ID = '415358901449';
const BASE_URL = 'https://api.hubapi.com/cms/blogs/2026-03/posts';

const posts = [
  {
    name: 'Budget-Friendly Event Ideas That Look Expensive',
    slug: 'budget-friendly-event-ideas',
    postSummary: 'Create stunning events without breaking the bank with these clever tips.',
    featuredImage: 'https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?w=800',
    authorName: 'David Park',
    metaDescription: 'Create stunning events without breaking the bank with these clever tips.',
    publishDate: '2026-05-02T16:06:36Z',
    content: `You do not need a massive budget to create an impressive event. Here is how to maximize impact while minimizing costs:

Strategic Splurges
Identify 2-3 elements that will have the biggest visual impact and invest there - maybe lighting and florals.

DIY Where It Counts
Simple centerpieces, handwritten place cards, and curated playlists can be done yourself with great results.

Off-Peak Savings
Consider hosting your event on a weekday or during off-season for significant venue and vendor discounts.

Digital Invitations
Beautiful e-invites can be just as elegant as paper ones while saving on printing and postage.

Repurpose and Reuse
Work with vendors who have inventory you can borrow or rent at lower costs.

The Power of Lighting
Good lighting can transform any space. Even simple uplighting or string lights can create ambiance on a budget.

Remember, guests remember how an event made them feel, not how much it cost.`
  },
  {
    name: 'The Ultimate Guide to Event Catering',
    slug: 'ultimate-guide-event-catering',
    postSummary: 'Everything you need to know about planning the perfect menu for your event.',
    featuredImage: 'https://images.unsplash.com/photo-1555244162-803834f70033?w=800',
    blogAuthorId: '415403813053',
    metaDescription: 'Everything you need to know about planning the perfect menu for your event.',
    publishDate: '2026-05-01T16:06:36Z',
    content: `Food is often the most remembered aspect of any event. Here is your complete guide to event catering success:

Know Your Audience
Consider dietary restrictions, cultural preferences, and the formality level expected by your guests.

Choose the Right Service Style
- Plated dinners for formal events
- Buffet for casual gatherings
- Food stations for interactive experiences
- Cocktail style for networking events

Timing is Everything
Coordinate with your caterer to ensure food is served at optimal times and temperatures.

Do Not Skimp on Quality
It is better to have fewer high-quality options than an overwhelming spread of mediocre choices.

Beverage Planning
Offer a thoughtful selection of alcoholic and non-alcoholic options that complement your menu.

The Sweet Finale
Dessert can be a memorable highlight - consider unique options like dessert bars or late-night sweet treats.`
  },
  {
    name: 'Corporate Events That Actually Engage Employees',
    slug: 'corporate-events-engage-employees',
    postSummary: 'Move beyond boring meetings with these innovative corporate event ideas.',
    featuredImage: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800',
    authorName: 'Michael Chen',
    metaDescription: 'Move beyond boring meetings with these innovative corporate event ideas.',
    publishDate: '2026-04-30T16:06:36Z',
    content: `Corporate events do not have to be dull. Here is how to create engaging experiences that your team will actually look forward to:

Interactive Workshops
Replace standard presentations with hands-on workshops where employees can learn new skills together.

Team Building Adventures
Think escape rooms, cooking competitions, or outdoor challenges that bring teams closer.

Wellness-Focused Events
Meditation sessions, fitness classes, or health screenings show you care about employee wellbeing.

Celebration of Achievements
Regular recognition events keep morale high and motivate continued excellence.

Community Service Days
Give back together through volunteer opportunities that build team spirit while making a difference.

The key is to create events that feel authentic to your company culture while providing genuine value to attendees.`
  },
  {
    name: 'How to Create a Memorable Wedding Experience',
    slug: 'memorable-wedding-experience',
    postSummary: 'Transform your special day into an unforgettable celebration with these expert tips.',
    featuredImage: 'https://images.unsplash.com/photo-1519741497674-611481863552?w=800',
    blogAuthorId: '415403813053',
    metaDescription: 'Transform your special day into an unforgettable celebration with these expert tips.',
    publishDate: '2026-04-29T16:06:36Z',
    content: `Your wedding day should be as unique as your love story. Here is how to create an experience that your guests will remember for years to come:

Personalize Every Detail
From custom cocktails named after your favorite memories to a playlist that tells your story, personal touches make all the difference.

Think About the Guest Experience
Consider your guests comfort throughout the event. Provide clear directions, comfortable seating, and thoughtful amenities like a coat check or transportation options.

Create Multiple Moments
Instead of one big moment, create several memorable experiences throughout the day - a surprise first dance, a midnight snack station, or a farewell brunch.

Work with Professionals
Experienced vendors know how to bring your vision to life while handling the logistics seamlessly.

Do Not Forget the Small Details
It is often the little things - handwritten notes, custom favors, or a photo guestbook - that leave the biggest impression.`
  },
  {
    name: 'Top 10 Venue Selection Tips for Your Next Event',
    slug: 'top-10-venue-selection-tips',
    postSummary: 'Discover the key factors to consider when choosing the perfect venue for your event.',
    featuredImage: 'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?w=800',
    authorName: 'James Cooper',
    metaDescription: 'Discover the key factors to consider when choosing the perfect venue for your event.',
    publishDate: '2026-04-27T16:06:36Z',
    content: `Choosing the right venue is one of the most critical decisions in event planning. Here are our top 10 tips to help you make the best choice:

1. Capacity Matters: Ensure the venue can comfortably accommodate your expected guest count.
2. Location Accessibility: Choose a venue that is easy to reach with adequate parking or public transport.
3. Budget Alignment: Make sure the venue cost fits within your overall budget.
4. Amenities Check: Verify what is included - tables, chairs, AV equipment, catering kitchen.
5. Weather Contingency: For outdoor events, always have a backup plan.
6. Vendor Flexibility: Some venues require specific vendors - check restrictions early.
7. Acoustics: Good sound quality is essential for speeches and entertainment.
8. Lighting: Proper lighting can transform the atmosphere of any space.
9. Restroom Facilities: Ensure adequate facilities for your guest count.
10. Contract Terms: Read the fine print carefully before signing.

Take your time visiting multiple venues before making your final decision.`
  },
  {
    name: 'Getting Started with Event Planning: A Beginner Guide',
    slug: 'getting-started-event-planning',
    postSummary: 'Learn the fundamentals of event planning and how to create memorable experiences for your guests.',
    featuredImage: 'https://images.unsplash.com/photo-1511578314322-379afb476865?w=800',
    blogAuthorId: '415403813053',
    metaDescription: 'Learn the fundamentals of event planning and how to create memorable experiences for your guests.',
    publishDate: '2026-04-25T16:06:36Z',
    content: `Event planning can seem overwhelming at first, but with the right approach, anyone can create successful and memorable events. In this comprehensive guide, we will walk you through the essential steps to get started.

Step 1: Define Your Event Purpose
Every great event starts with a clear purpose. Ask yourself: What do you want to achieve? Is it a celebration, a networking opportunity, or an educational experience?

Step 2: Set Your Budget
Budgeting is crucial to event success. Determine how much you can spend and allocate funds to different categories like venue, catering, entertainment, and decorations.

Step 3: Choose the Right Venue
The venue sets the tone for your entire event. Consider factors like capacity, location, amenities, and ambiance when making your selection.

Step 4: Create a Timeline
Develop a detailed timeline leading up to the event. Include milestones for booking vendors, sending invitations, and finalizing details.

Step 5: Build Your Vendor Team
Work with reliable professionals who understand your vision. From caterers to decorators, your vendor team can make or break your event.

Remember, the key to successful event planning is organization, communication, and attention to detail.`
  }
];

function textToHtml(text) {
  return text
    .split(/\n\n+/)
    .map(p => `<p>${p.trim().replace(/\n/g, '<br/>')}</p>`)
    .join('\n');
}

async function createPost(post) {
  const body = {
    name: post.name,
    slug: post.slug,
    postBody: textToHtml(post.content),
    postSummary: post.postSummary,
    featuredImage: post.featuredImage,
    blogAuthorId: post.blogAuthorId,
    authorName: 'Julie Bhyat',
    metaDescription: post.metaDescription,
    publishDate: post.publishDate,
    contentGroupId: CONTENT_GROUP_ID,
    state: 'PUBLISHED',
    publishImmediately: true,
  };

  const response = await fetch(BASE_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${HUBSPOT_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`HTTP ${response.status}: ${errorText}`);
  }

  return response.json();
}

async function main() {
  console.log('Migrating 6 blog posts from Supabase to HubSpot...\n');

  for (const post of posts) {
    try {
      const result = await createPost(post);
      console.log(`Created: ${result.name}`);
      console.log(`  URL: ${result.url}`);
      console.log(`  ID: ${result.id}\n`);
    } catch (err) {
      console.error(`Failed: ${post.name}`);
      console.error(`  Error: ${err.message}\n`);
    }
  }

  console.log('Migration complete!');
}

main();
