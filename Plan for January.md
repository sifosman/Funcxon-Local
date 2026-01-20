Plan to Implement Client Updates
From the note, the core requirement is:
Use the existing Replit app as the single source of truth for:

Layout and flow
Tabs/pages
Subscriber profiles and their portfolio tabs
4-page subscriber application form
Plus, we must prepare for extra data the client will later supply.

Below is a concrete implementation plan tailored to that.

Phase 1 – Understand and Capture the Replit Reference
[P1.1] Review Replit project thoroughly (High)
Log into Replit with the provided credentials.
Click through all major areas:
Profile
Subscriber Suite
Portfolio Profile
The full 4-page subscriber application form
Document:
Each tab/page name
Navigation flow (what leads to what)
Any conditional behavior (e.g. fields that only show based on choices)
Data captured by each of the 4 form pages
[P1.2] Create a simple flow map (High)
Sketch (even in a text file in the repo) the screen hierarchy and routes:
Example: Home -> Profile -> Subscriber Suite -> Portfolio Profile -> Application Step 1/2/3/4.
List all subscriber-facing tabs within their “portfolio” pages.
Phase 2 – Map Replit to the Local FUNXONS Codebase
[P2.1] Audit current local app structure (High)
Identify:
Existing routes/screens/pages.
Current navigation system (e.g. React Router, Flutter navigator, etc.).
Any existing subscriber/profile-related components.
[P2.2] Map gaps and overlaps (High)
For each Replit screen/flow from Phase 1, map to:
Existing local equivalent (if any), or
Mark as “New screen needed”.
Note required refactors:
Renaming routes or components to align with client naming.
Restructuring navigation if it doesn’t reflect Replit’s flow.
[P2.3] Decide routing/navigation architecture (High)
Confirm:
Route names/paths.
Tab structures (e.g. bottom tabs, side menu, nested tabs).
Define where “Profile → Subscriber Suite → Portfolio Profile” sits in that structure.
Phase 3 – Implement Layout, Navigation, and Screens
[P3.1] Implement/adjust main navigation to match Replit (High)
Create or update:
Main navigation shell (tabs/menus).
Routes for Profile, Subscriber Suite, Portfolio Profile, etc.
Ensure you can reach the subscriber application exactly as:
Profile → Subscriber Suite → Portfolio Profile.
[P3.2] Implement subscriber profile & portfolio tabs (High)
Create components/screens that represent:
Subscriber profile overview.
Tabs inside a subscriber’s portfolio (as seen on Replit).
Wire dummy or existing local data so UI is functional even before final datasets.
Phase 4 – Implement 4-Page Subscriber Application Form
[P4.1] Recreate the form steps (High)
Create 4 distinct steps/pages that mirror Replit:
Same sections, field groupings, and order.
Implement navigation:
Next/Back between steps.
Progress indicator (steps 1–4).
[P4.2] Implement validation & data model (High)
Define a form data model that captures all fields.
Add validations that behave like (or improve upon) Replit:
Required fields.
Format checks (email, phone, etc.).
[P4.3] Implement test login / access flow (Medium–High)
Match the “use any email and password” test behavior in dev:
For local/dev: simplified login that accepts any credentials.
Keep in mind future replacement with real auth.
Phase 5 – Prepare for Additional Client Data
The client will still provide:

Full venue type list
Full service professionals type list
Full service professionals subcategory list
Graphics
Subscription pricing and features
Plan:

[P5.1] Define placeholder structures (Medium)
Create:
Config or JSON-like structures for:
venueTypes
serviceProfessionals
serviceProfessionalsSubcategories
subscriptionPlans with features
Wire UI to read from these structures so swapping in real data is easy.
[P5.2] Prepare placeholder graphics/icons (Low–Medium)
Use simple placeholders or generic icons with clear naming so real graphics can be dropped in later without code changes.
Phase 6 – QA Against Replit Reference
[P6.1] Walkthrough comparison (High)
With Replit app on one side and local app on the other, verify:
Tabs/pages present and named correctly.
Navigation paths and back flows match.
Subscriber portfolio tabs behave like the reference.
The full 4-page subscriber application matches, including validations.
[P6.2] Collect questions & edge cases (Medium)
Note any unclear behavior or missing copy.
Prepare a small list of clarifications to send to client.
Compact TODO-Style List
[TODO] Review Replit project and document all screens, flows, and 4-page form.
[TODO] Map Replit screens/flows to current FUNXONS codebase and identify gaps/refactors.
[TODO] Finalize navigation & routing design to mirror Replit.
[TODO] Implement/adjust navigation and screens (Profile, Subscriber Suite, Portfolio Profile, etc.).
[TODO] Implement subscriber portfolio tabs and subscriber profile views.
[TODO] Implement 4-step subscriber application form including navigation and validations.
[TODO] Implement a dev/test login flow that mimics “any email and password”.
[TODO] Add placeholder data structures for venue types, service professionals, subcategories, and subscription plans/features.
[TODO] Add placeholder graphics/hooks for final client assets.
[TODO] Perform side-by-side QA against Replit and create a short list of questions for the client.