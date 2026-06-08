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
    blogAuthorId: '415403813053',
    metaDescription: 'Create stunning events without breaking the bank with these clever tips.',
    publishDate: '2026-05-02T16:06:36Z',
    content: `You do not need a massive budget to create an impressive event. Here is how to maximize impact while minimizing costs:\n\nStrategic Splurges\nIdentify 2-3 elements that will have the biggest visual impact and invest there - maybe lighting and florals.\n\nDIY Where It Counts\nSimple centerpieces, handwritten place cards, and curated playlists can be done yourself with great results.\n\nOff-Peak Savings\nConsider hosting your event on a weekday or during off-season for significant venue and vendor discounts.\n\nDigital Invitations\nBeautiful e-invites can be just as elegant as paper ones while saving on printing and postage.\n\nRepurpose and Reuse\nWork with vendors who have inventory you can borrow or rent at lower costs.\n\nThe Power of Lighting\nGood lighting can transform any space. Even simple uplighting or string lights can create ambiance on a budget.\n\nRemember, guests remember how an event made them feel, not how much it cost.`
  },
  {
    name: 'Corporate Events That Actually Engage Employees',
    slug: 'corporate-events-engage-employees',
    postSummary: 'Move beyond boring meetings with these innovative corporate event ideas.',
    featuredImage: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800',
    blogAuthorId: '415403813053',
    metaDescription: 'Move beyond boring meetings with these innovative corporate event ideas.',
    publishDate: '2026-04-30T16:06:36Z',
    content: `Corporate events do not have to be dull. Here is how to create engaging experiences that your team will actually look forward to:\n\nInteractive Workshops\nReplace standard presentations with hands-on workshops where employees can learn new skills together.\n\nTeam Building Adventures\nThink escape rooms, cooking competitions, or outdoor challenges that bring teams closer.\n\nWellness-Focused Events\nMeditation sessions, fitness classes, or health screenings show you care about employee wellbeing.\n\nCelebration of Achievements\nRegular recognition events keep morale high and motivate continued excellence.\n\nCommunity Service Days\nGive back together through volunteer opportunities that build team spirit while making a difference.\n\nThe key is to create events that feel authentic to your company culture while providing genuine value to attendees.`
  },
  {
    name: 'Top 10 Venue Selection Tips for Your Next Event',
    slug: 'top-10-venue-selection-tips',
    postSummary: 'Discover the key factors to consider when choosing the perfect venue for your event.',
    featuredImage: 'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?w=800',
    blogAuthorId: '415403813053',
    metaDescription: 'Discover the key factors to consider when choosing the perfect venue for your event.',
    publishDate: '2026-04-27T16:06:36Z',
    content: `Choosing the right venue is one of the most critical decisions in event planning. Here are our top 10 tips to help you make the best choice:\n\n1. Capacity Matters: Ensure the venue can comfortably accommodate your expected guest count.\n2. Location Accessibility: Choose a venue that is easy to reach with adequate parking or public transport.\n3. Budget Alignment: Make sure the venue cost fits within your overall budget.\n4. Amenities Check: Verify what is included - tables, chairs, AV equipment, catering kitchen.\n5. Weather Contingency: For outdoor events, always have a backup plan.\n6. Vendor Flexibility: Some venues require specific vendors - check restrictions early.\n7. Acoustics: Good sound quality is essential for speeches and entertainment.\n8. Lighting: Proper lighting can transform the atmosphere of any space.\n9. Restroom Facilities: Ensure adequate facilities for your guest count.\n10. Contract Terms: Read the fine print carefully before signing.\n\nTake your time visiting multiple venues before making your final decision.`
  }
];

function textToHtml(text) {
  return text
    .split(/\n\n+/)
    .map(p => `<p>${p.trim().replace(/\n/g, '<br/>')}</p>`)
    .join('\n');
}

async function createDraft(post) {
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
    state: 'DRAFT',
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

async function publishPost(postId) {
  const response = await fetch(`${BASE_URL}/${postId}`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${HUBSPOT_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ state: 'PUBLISHED' }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`HTTP ${response.status}: ${errorText}`);
  }

  return response.json();
}

async function main() {
  console.log('Creating 3 remaining posts as DRAFT, then publishing...\n');

  for (const post of posts) {
    try {
      const draft = await createDraft(post);
      console.log(`Created DRAFT: ${draft.name} (ID: ${draft.id})`);

      const published = await publishPost(draft.id);
      console.log(`Published: ${published.name} → ${published.url}\n`);
    } catch (err) {
      console.error(`Failed: ${post.name}`);
      console.error(`  Error: ${err.message}\n`);
    }
  }

  console.log('Done!');
}

main();
