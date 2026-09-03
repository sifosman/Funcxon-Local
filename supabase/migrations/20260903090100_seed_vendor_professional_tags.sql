-- Seed vendor & professional tag groups from "09.01.2026_Categories tags etc.xlsx"
-- (Vendor & Professional Tags tab: 38 groups, cleaned spelling).
-- Parent row per group, leaf row per tag. Leaf slugs are namespaced with the group
-- slug ('{group}--{tag}') because tag_categories.slug is globally unique.
-- Idempotent: re-running inserts nothing new.

-- Group: Venues
insert into public.tag_categories (name, slug, vendor_type, parent_category_id, display_order, is_active)
values
  ('Venues', 'venues', 'venue', null, 30, true)
on conflict (slug) do nothing;

insert into public.tag_categories (name, slug, vendor_type, parent_category_id, display_order, is_active)
select t.name, t.slug, t.vt, p.id, t.ord, true
from (values
  ('Indoor', 'venues--indoor', 'venue', 1),
  ('Outdoor', 'venues--outdoor', 'venue', 2),
  ('Tables', 'venues--tables', 'venue', 3),
  ('Chairs', 'venues--chairs', 'venue', 4),
  ('Parking', 'venues--parking', 'venue', 5),
  ('Disabled access', 'venues--disabled-access', 'venue', 6),
  ('WiFi', 'venues--wifi', 'venue', 7),
  ('Air conditioning', 'venues--air-conditioning', 'venue', 8),
  ('Heating', 'venues--heating', 'venue', 9),
  ('Scenic view', 'venues--scenic-view', 'venue', 10),
  ('Water Features/Fountains', 'venues--water-features-fountains', 'venue', 11),
  ('Accommodation', 'venues--accommodation', 'venue', 12),
  ('Alcohol allowed', 'venues--alcohol-allowed', 'venue', 13),
  ('No alcohol', 'venues--no-alcohol', 'venue', 14),
  ('Halaal friendly kitchen', 'venues--halaal-friendly-kitchen', 'venue', 15),
  ('Outside catering allowed', 'venues--outside-catering-allowed', 'venue', 16),
  ('AV available', 'venues--av-available', 'venue', 17),
  ('Stage', 'venues--stage', 'venue', 18),
  ('Generator', 'venues--generator', 'venue', 19),
  ('Ablution Facilities', 'venues--ablution-facilities', 'venue', 20),
  ('Salaah Room', 'venues--salaah-room', 'venue', 21),
  ('Chapel', 'venues--chapel', 'venue', 22),
  ('Minimum Guests 10', 'venues--minimum-guests-10', 'venue', 23)
  ) as t(name, slug, vt, ord)
join public.tag_categories p on p.slug = 'venues' and p.parent_category_id is null
on conflict (slug) do nothing;

-- Group: Catering (Food)
insert into public.tag_categories (name, slug, vendor_type, parent_category_id, display_order, is_active)
values
  ('Catering (Food)', 'catering-food', 'service_provider', null, 30, true)
on conflict (slug) do nothing;

insert into public.tag_categories (name, slug, vendor_type, parent_category_id, display_order, is_active)
select t.name, t.slug, t.vt, p.id, t.ord, true
from (values
  ('Halaal', 'catering-food--halaal', 'service_provider', 1),
  ('Vegetarian', 'catering-food--vegetarian', 'service_provider', 2),
  ('Vegan', 'catering-food--vegan', 'service_provider', 3),
  ('Gluten free', 'catering-food--gluten-free', 'service_provider', 4),
  ('Non alcohol', 'catering-food--non-alcohol', 'service_provider', 5),
  ('Alcohol', 'catering-food--alcohol', 'service_provider', 6),
  ('On Site Prep', 'catering-food--on-site-prep', 'service_provider', 7),
  ('Remote Prep Only', 'catering-food--remote-prep-only', 'service_provider', 8),
  ('Buffet', 'catering-food--buffet', 'service_provider', 9),
  ('Plated', 'catering-food--plated', 'service_provider', 10),
  ('Finger food', 'catering-food--finger-food', 'service_provider', 11),
  ('Full service', 'catering-food--full-service', 'service_provider', 12),
  ('Delivery only', 'catering-food--delivery-only', 'service_provider', 13),
  ('Custom menu', 'catering-food--custom-menu', 'service_provider', 14),
  ('Braai', 'catering-food--braai', 'service_provider', 15)
  ) as t(name, slug, vt, ord)
join public.tag_categories p on p.slug = 'catering-food' and p.parent_category_id is null
on conflict (slug) do nothing;

-- Group: Bar & Beverage Services
insert into public.tag_categories (name, slug, vendor_type, parent_category_id, display_order, is_active)
values
  ('Bar & Beverage Services', 'bar-beverage-services', 'service_provider', null, 40, true)
on conflict (slug) do nothing;

insert into public.tag_categories (name, slug, vendor_type, parent_category_id, display_order, is_active)
select t.name, t.slug, t.vt, p.id, t.ord, true
from (values
  ('Alcohol', 'bar-beverage-services--alcohol', 'service_provider', 1),
  ('Non alcohol', 'bar-beverage-services--non-alcohol', 'service_provider', 2),
  ('Mocktails', 'bar-beverage-services--mocktails', 'service_provider', 3),
  ('Licensed', 'bar-beverage-services--licensed', 'service_provider', 4),
  ('Unlicensed', 'bar-beverage-services--unlicensed', 'service_provider', 5),
  ('Cash bar', 'bar-beverage-services--cash-bar', 'service_provider', 6),
  ('Open bar', 'bar-beverage-services--open-bar', 'service_provider', 7),
  ('Halaal friendly', 'bar-beverage-services--halaal-friendly', 'service_provider', 8),
  ('Glassware included', 'bar-beverage-services--glassware-included', 'service_provider', 9),
  ('Staff included', 'bar-beverage-services--staff-included', 'service_provider', 10)
  ) as t(name, slug, vt, ord)
join public.tag_categories p on p.slug = 'bar-beverage-services' and p.parent_category_id is null
on conflict (slug) do nothing;

-- Group: Decor & Styling
insert into public.tag_categories (name, slug, vendor_type, parent_category_id, display_order, is_active)
values
  ('Decor & Styling', 'decor-styling', 'service_provider', null, 50, true)
on conflict (slug) do nothing;

insert into public.tag_categories (name, slug, vendor_type, parent_category_id, display_order, is_active)
select t.name, t.slug, t.vt, p.id, t.ord, true
from (values
  ('Modern', 'decor-styling--modern', 'service_provider', 1),
  ('Traditional', 'decor-styling--traditional', 'service_provider', 2),
  ('Luxury', 'decor-styling--luxury', 'service_provider', 3),
  ('Budget', 'decor-styling--budget', 'service_provider', 4),
  ('Theme based', 'decor-styling--theme-based', 'service_provider', 5),
  ('Custom design', 'decor-styling--custom-design', 'service_provider', 6),
  ('Furniture included', 'decor-styling--furniture-included', 'service_provider', 7),
  ('Linen included', 'decor-styling--linen-included', 'service_provider', 8),
  ('Floral included', 'decor-styling--floral-included', 'service_provider', 9),
  ('Setup included', 'decor-styling--setup-included', 'service_provider', 10),
  ('Teardown included', 'decor-styling--teardown-included', 'service_provider', 11),
  ('Indoor', 'decor-styling--indoor', 'service_provider', 12),
  ('Outdoor', 'decor-styling--outdoor', 'service_provider', 13)
  ) as t(name, slug, vt, ord)
join public.tag_categories p on p.slug = 'decor-styling' and p.parent_category_id is null
on conflict (slug) do nothing;

-- Group: Florists
insert into public.tag_categories (name, slug, vendor_type, parent_category_id, display_order, is_active)
values
  ('Florists', 'florists', 'service_provider', null, 60, true)
on conflict (slug) do nothing;

insert into public.tag_categories (name, slug, vendor_type, parent_category_id, display_order, is_active)
select t.name, t.slug, t.vt, p.id, t.ord, true
from (values
  ('Fresh flowers', 'florists--fresh-flowers', 'service_provider', 1),
  ('Artificial flowers', 'florists--artificial-flowers', 'service_provider', 2),
  ('Custom arrangements', 'florists--custom-arrangements', 'service_provider', 3),
  ('Installations', 'florists--installations', 'service_provider', 4),
  ('On site Setup', 'florists--on-site-setup', 'service_provider', 5),
  ('Delivery Only', 'florists--delivery-only', 'service_provider', 6)
  ) as t(name, slug, vt, ord)
join public.tag_categories p on p.slug = 'florists' and p.parent_category_id is null
on conflict (slug) do nothing;

-- Group: Photography
insert into public.tag_categories (name, slug, vendor_type, parent_category_id, display_order, is_active)
values
  ('Photography', 'photography', 'service_provider', null, 70, true)
on conflict (slug) do nothing;

insert into public.tag_categories (name, slug, vendor_type, parent_category_id, display_order, is_active)
select t.name, t.slug, t.vt, p.id, t.ord, true
from (values
  ('Weddings', 'photography--weddings', 'service_provider', 1),
  ('Corporate', 'photography--corporate', 'service_provider', 2),
  ('Events', 'photography--events', 'service_provider', 3),
  ('Outdoor', 'photography--outdoor', 'service_provider', 4),
  ('Indoor', 'photography--indoor', 'service_provider', 5),
  ('Travel Available', 'photography--travel-available', 'service_provider', 6),
  ('Local Only', 'photography--local-only', 'service_provider', 7),
  ('Portfolio Available', 'photography--portfolio-available', 'service_provider', 8)
  ) as t(name, slug, vt, ord)
join public.tag_categories p on p.slug = 'photography' and p.parent_category_id is null
on conflict (slug) do nothing;

-- Group: Videography
insert into public.tag_categories (name, slug, vendor_type, parent_category_id, display_order, is_active)
values
  ('Videography', 'videography', 'service_provider', null, 80, true)
on conflict (slug) do nothing;

insert into public.tag_categories (name, slug, vendor_type, parent_category_id, display_order, is_active)
select t.name, t.slug, t.vt, p.id, t.ord, true
from (values
  ('Event filming', 'videography--event-filming', 'service_provider', 1),
  ('Highlights video', 'videography--highlights-video', 'service_provider', 2),
  ('Full length video', 'videography--full-length-video', 'service_provider', 3),
  ('Drone', 'videography--drone', 'service_provider', 4),
  ('Indoor', 'videography--indoor', 'service_provider', 5),
  ('Outdoor', 'videography--outdoor', 'service_provider', 6),
  ('Travel available', 'videography--travel-available', 'service_provider', 7),
  ('Edited delivery', 'videography--edited-delivery', 'service_provider', 8),
  ('Raw footage', 'videography--raw-footage', 'service_provider', 9)
  ) as t(name, slug, vt, ord)
join public.tag_categories p on p.slug = 'videography' and p.parent_category_id is null
on conflict (slug) do nothing;

-- Group: DJs
insert into public.tag_categories (name, slug, vendor_type, parent_category_id, display_order, is_active)
values
  ('DJs', 'djs', 'service_provider', null, 90, true)
on conflict (slug) do nothing;

insert into public.tag_categories (name, slug, vendor_type, parent_category_id, display_order, is_active)
select t.name, t.slug, t.vt, p.id, t.ord, true
from (values
  ('Weddings', 'djs--weddings', 'service_provider', 1),
  ('Corporate', 'djs--corporate', 'service_provider', 2),
  ('Parties', 'djs--parties', 'service_provider', 3),
  ('Family friendly', 'djs--family-friendly', 'service_provider', 4),
  ('Adult only', 'djs--adult-only', 'service_provider', 5),
  ('Equipment included', 'djs--equipment-included', 'service_provider', 6),
  ('Travel available', 'djs--travel-available', 'service_provider', 7),
  ('Backup equipment', 'djs--backup-equipment', 'service_provider', 8)
  ) as t(name, slug, vt, ord)
join public.tag_categories p on p.slug = 'djs' and p.parent_category_id is null
on conflict (slug) do nothing;

-- Group: Live Bands / Musicians
insert into public.tag_categories (name, slug, vendor_type, parent_category_id, display_order, is_active)
values
  ('Live Bands / Musicians', 'live-bands-musicians', 'service_provider', null, 100, true)
on conflict (slug) do nothing;

insert into public.tag_categories (name, slug, vendor_type, parent_category_id, display_order, is_active)
select t.name, t.slug, t.vt, p.id, t.ord, true
from (values
  ('Acoustic', 'live-bands-musicians--acoustic', 'service_provider', 1),
  ('Full band', 'live-bands-musicians--full-band', 'service_provider', 2),
  ('Cultural', 'live-bands-musicians--cultural', 'service_provider', 3),
  ('Jazz', 'live-bands-musicians--jazz', 'service_provider', 4),
  ('Pop', 'live-bands-musicians--pop', 'service_provider', 5),
  ('Religious friendly', 'live-bands-musicians--religious-friendly', 'service_provider', 6),
  ('Indoor', 'live-bands-musicians--indoor', 'service_provider', 7),
  ('Outdoor', 'live-bands-musicians--outdoor', 'service_provider', 8)
  ) as t(name, slug, vt, ord)
join public.tag_categories p on p.slug = 'live-bands-musicians' and p.parent_category_id is null
on conflict (slug) do nothing;

-- Group: MCs / Hosts
insert into public.tag_categories (name, slug, vendor_type, parent_category_id, display_order, is_active)
values
  ('MCs / Hosts', 'mcs-hosts', 'service_provider', null, 110, true)
on conflict (slug) do nothing;

insert into public.tag_categories (name, slug, vendor_type, parent_category_id, display_order, is_active)
select t.name, t.slug, t.vt, p.id, t.ord, true
from (values
  ('Formal', 'mcs-hosts--formal', 'service_provider', 1),
  ('Casual', 'mcs-hosts--casual', 'service_provider', 2),
  ('Corporate', 'mcs-hosts--corporate', 'service_provider', 3),
  ('Wedding', 'mcs-hosts--wedding', 'service_provider', 4),
  ('Multilingual', 'mcs-hosts--multilingual', 'service_provider', 5),
  ('Family friendly', 'mcs-hosts--family-friendly', 'service_provider', 6),
  ('Comedian', 'mcs-hosts--comedian', 'service_provider', 7)
  ) as t(name, slug, vt, ord)
join public.tag_categories p on p.slug = 'mcs-hosts' and p.parent_category_id is null
on conflict (slug) do nothing;

-- Group: Hair & Makeup
insert into public.tag_categories (name, slug, vendor_type, parent_category_id, display_order, is_active)
values
  ('Hair & Makeup', 'hair-makeup', 'service_provider', null, 120, true)
on conflict (slug) do nothing;

insert into public.tag_categories (name, slug, vendor_type, parent_category_id, display_order, is_active)
select t.name, t.slug, t.vt, p.id, t.ord, true
from (values
  ('On site', 'hair-makeup--on-site', 'service_provider', 1),
  ('Salon based', 'hair-makeup--salon-based', 'service_provider', 2),
  ('Travel available', 'hair-makeup--travel-available', 'service_provider', 3),
  ('Bridal', 'hair-makeup--bridal', 'service_provider', 4),
  ('Event', 'hair-makeup--event', 'service_provider', 5),
  ('Long wear', 'hair-makeup--long-wear', 'service_provider', 6),
  ('Halaal products', 'hair-makeup--halaal-products', 'service_provider', 7),
  ('Female only', 'hair-makeup--female-only', 'service_provider', 8),
  ('Male only', 'hair-makeup--male-only', 'service_provider', 9)
  ) as t(name, slug, vt, ord)
join public.tag_categories p on p.slug = 'hair-makeup' and p.parent_category_id is null
on conflict (slug) do nothing;

-- Group: Event Planners
insert into public.tag_categories (name, slug, vendor_type, parent_category_id, display_order, is_active)
values
  ('Event Planners', 'event-planners', 'service_provider', null, 130, true)
on conflict (slug) do nothing;

insert into public.tag_categories (name, slug, vendor_type, parent_category_id, display_order, is_active)
select t.name, t.slug, t.vt, p.id, t.ord, true
from (values
  ('Full service', 'event-planners--full-service', 'service_provider', 1),
  ('Partial planning', 'event-planners--partial-planning', 'service_provider', 2),
  ('Weddings', 'event-planners--weddings', 'service_provider', 3),
  ('Corporate', 'event-planners--corporate', 'service_provider', 4),
  ('Social events', 'event-planners--social-events', 'service_provider', 5),
  ('Budget focused', 'event-planners--budget-focused', 'service_provider', 6),
  ('Luxury', 'event-planners--luxury', 'service_provider', 7),
  ('Full planning', 'event-planners--full-planning', 'service_provider', 8),
  ('On the day', 'event-planners--on-the-day', 'service_provider', 9),
  ('Cultural weddings', 'event-planners--cultural-weddings', 'service_provider', 10),
  ('Religious friendly', 'event-planners--religious-friendly', 'service_provider', 11),
  ('Vendor management', 'event-planners--vendor-management', 'service_provider', 12)
  ) as t(name, slug, vt, ord)
join public.tag_categories p on p.slug = 'event-planners' and p.parent_category_id is null
on conflict (slug) do nothing;

-- Group: Event Production / AV
insert into public.tag_categories (name, slug, vendor_type, parent_category_id, display_order, is_active)
values
  ('Event Production / AV', 'event-production-av', 'service_provider', null, 140, true)
on conflict (slug) do nothing;

insert into public.tag_categories (name, slug, vendor_type, parent_category_id, display_order, is_active)
select t.name, t.slug, t.vt, p.id, t.ord, true
from (values
  ('Sound', 'event-production-av--sound', 'service_provider', 1),
  ('Lighting', 'event-production-av--lighting', 'service_provider', 2),
  ('Screens', 'event-production-av--screens', 'service_provider', 3),
  ('Projectors', 'event-production-av--projectors', 'service_provider', 4),
  ('Stage', 'event-production-av--stage', 'service_provider', 5),
  ('Podium', 'event-production-av--podium', 'service_provider', 6),
  ('Indoor', 'event-production-av--indoor', 'service_provider', 7),
  ('Outdoor', 'event-production-av--outdoor', 'service_provider', 8),
  ('Setup included', 'event-production-av--setup-included', 'service_provider', 9),
  ('Generator', 'event-production-av--generator', 'service_provider', 10)
  ) as t(name, slug, vt, ord)
join public.tag_categories p on p.slug = 'event-production-av' and p.parent_category_id is null
on conflict (slug) do nothing;

-- Group: Rentals (Furniture & Equipment)
insert into public.tag_categories (name, slug, vendor_type, parent_category_id, display_order, is_active)
values
  ('Rentals (Furniture & Equipment)', 'rentals-furniture-equipment', 'service_provider', null, 150, true)
on conflict (slug) do nothing;

insert into public.tag_categories (name, slug, vendor_type, parent_category_id, display_order, is_active)
select t.name, t.slug, t.vt, p.id, t.ord, true
from (values
  ('Tables', 'rentals-furniture-equipment--tables', 'service_provider', 1),
  ('Chairs', 'rentals-furniture-equipment--chairs', 'service_provider', 2),
  ('Tents', 'rentals-furniture-equipment--tents', 'service_provider', 3),
  ('Marquees', 'rentals-furniture-equipment--marquees', 'service_provider', 4),
  ('Crockery', 'rentals-furniture-equipment--crockery', 'service_provider', 5),
  ('Glassware', 'rentals-furniture-equipment--glassware', 'service_provider', 6),
  ('Linen', 'rentals-furniture-equipment--linen', 'service_provider', 7),
  ('Delivery included', 'rentals-furniture-equipment--delivery-included', 'service_provider', 8),
  ('Setup included', 'rentals-furniture-equipment--setup-included', 'service_provider', 9)
  ) as t(name, slug, vt, ord)
join public.tag_categories p on p.slug = 'rentals-furniture-equipment' and p.parent_category_id is null
on conflict (slug) do nothing;

-- Group: Photo Booths
insert into public.tag_categories (name, slug, vendor_type, parent_category_id, display_order, is_active)
values
  ('Photo Booths', 'photo-booths', 'service_provider', null, 160, true)
on conflict (slug) do nothing;

insert into public.tag_categories (name, slug, vendor_type, parent_category_id, display_order, is_active)
select t.name, t.slug, t.vt, p.id, t.ord, true
from (values
  ('Digital', 'photo-booths--digital', 'service_provider', 1),
  ('Printed', 'photo-booths--printed', 'service_provider', 2),
  ('Props included', 'photo-booths--props-included', 'service_provider', 3),
  ('Custom branding', 'photo-booths--custom-branding', 'service_provider', 4),
  ('Instant sharing', 'photo-booths--instant-sharing', 'service_provider', 5),
  ('Setup included', 'photo-booths--setup-included', 'service_provider', 6)
  ) as t(name, slug, vt, ord)
join public.tag_categories p on p.slug = 'photo-booths' and p.parent_category_id is null
on conflict (slug) do nothing;

-- Group: Security Services
insert into public.tag_categories (name, slug, vendor_type, parent_category_id, display_order, is_active)
values
  ('Security Services', 'security-services', 'service_provider', null, 170, true)
on conflict (slug) do nothing;

insert into public.tag_categories (name, slug, vendor_type, parent_category_id, display_order, is_active)
select t.name, t.slug, t.vt, p.id, t.ord, true
from (values
  ('Event security', 'security-services--event-security', 'service_provider', 1),
  ('Crowd control', 'security-services--crowd-control', 'service_provider', 2),
  ('Armed', 'security-services--armed', 'service_provider', 3),
  ('Unarmed', 'security-services--unarmed', 'service_provider', 4),
  ('Indoor', 'security-services--indoor', 'service_provider', 5),
  ('Outdoor', 'security-services--outdoor', 'service_provider', 6),
  ('Licensed', 'security-services--licensed', 'service_provider', 7)
  ) as t(name, slug, vt, ord)
join public.tag_categories p on p.slug = 'security-services' and p.parent_category_id is null
on conflict (slug) do nothing;

-- Group: Staffing (Waiters / Bar / Crew)
insert into public.tag_categories (name, slug, vendor_type, parent_category_id, display_order, is_active)
values
  ('Staffing (Waiters / Bar / Crew)', 'staffing-waiters-bar-crew', 'service_provider', null, 180, true)
on conflict (slug) do nothing;

insert into public.tag_categories (name, slug, vendor_type, parent_category_id, display_order, is_active)
select t.name, t.slug, t.vt, p.id, t.ord, true
from (values
  ('Trained staff', 'staffing-waiters-bar-crew--trained-staff', 'service_provider', 1),
  ('Halaal compliant', 'staffing-waiters-bar-crew--halaal-compliant', 'service_provider', 2),
  ('Uniformed', 'staffing-waiters-bar-crew--uniformed', 'service_provider', 3),
  ('Short shift', 'staffing-waiters-bar-crew--short-shift', 'service_provider', 4),
  ('Full day', 'staffing-waiters-bar-crew--full-day', 'service_provider', 5),
  ('Travel available', 'staffing-waiters-bar-crew--travel-available', 'service_provider', 6)
  ) as t(name, slug, vt, ord)
join public.tag_categories p on p.slug = 'staffing-waiters-bar-crew' and p.parent_category_id is null
on conflict (slug) do nothing;

-- Group: Transport & Parking
insert into public.tag_categories (name, slug, vendor_type, parent_category_id, display_order, is_active)
values
  ('Transport & Parking', 'transport-parking', 'service_provider', null, 190, true)
on conflict (slug) do nothing;

insert into public.tag_categories (name, slug, vendor_type, parent_category_id, display_order, is_active)
select t.name, t.slug, t.vt, p.id, t.ord, true
from (values
  ('Shuttle', 'transport-parking--shuttle', 'service_provider', 1),
  ('Guest transport', 'transport-parking--guest-transport', 'service_provider', 2),
  ('VIP transport', 'transport-parking--vip-transport', 'service_provider', 3),
  ('Valet', 'transport-parking--valet', 'service_provider', 4),
  ('Secure parking', 'transport-parking--secure-parking', 'service_provider', 5),
  ('Accessible vehicles', 'transport-parking--accessible-vehicles', 'service_provider', 6)
  ) as t(name, slug, vt, ord)
join public.tag_categories p on p.slug = 'transport-parking' and p.parent_category_id is null
on conflict (slug) do nothing;

-- Group: Support & Compliance
insert into public.tag_categories (name, slug, vendor_type, parent_category_id, display_order, is_active)
values
  ('Support & Compliance', 'support-compliance', 'service_provider', null, 200, true)
on conflict (slug) do nothing;

insert into public.tag_categories (name, slug, vendor_type, parent_category_id, display_order, is_active)
select t.name, t.slug, t.vt, p.id, t.ord, true
from (values
  ('Insured', 'support-compliance--insured', 'service_provider', 1),
  ('Registered business', 'support-compliance--registered-business', 'service_provider', 2),
  ('Flexible cancellation', 'support-compliance--flexible-cancellation', 'service_provider', 3),
  ('Last minute available', 'support-compliance--last-minute-available', 'service_provider', 4),
  ('Weekday discounts', 'support-compliance--weekday-discounts', 'service_provider', 5)
  ) as t(name, slug, vt, ord)
join public.tag_categories p on p.slug = 'support-compliance' and p.parent_category_id is null
on conflict (slug) do nothing;

-- Group: Cakes & Desserts
insert into public.tag_categories (name, slug, vendor_type, parent_category_id, display_order, is_active)
values
  ('Cakes & Desserts', 'cakes-desserts', 'service_provider', null, 210, true)
on conflict (slug) do nothing;

insert into public.tag_categories (name, slug, vendor_type, parent_category_id, display_order, is_active)
select t.name, t.slug, t.vt, p.id, t.ord, true
from (values
  ('Halaal', 'cakes-desserts--halaal', 'service_provider', 1),
  ('Custom design', 'cakes-desserts--custom-design', 'service_provider', 2),
  ('Cupcakes', 'cakes-desserts--cupcakes', 'service_provider', 3),
  ('Wedding cakes', 'cakes-desserts--wedding-cakes', 'service_provider', 4),
  ('Birthday cakes', 'cakes-desserts--birthday-cakes', 'service_provider', 5),
  ('Dessert tables', 'cakes-desserts--dessert-tables', 'service_provider', 6),
  ('Delivery available', 'cakes-desserts--delivery-available', 'service_provider', 7),
  ('Setup included', 'cakes-desserts--setup-included', 'service_provider', 8)
  ) as t(name, slug, vt, ord)
join public.tag_categories p on p.slug = 'cakes-desserts' and p.parent_category_id is null
on conflict (slug) do nothing;

-- Group: Kids Entertainment
insert into public.tag_categories (name, slug, vendor_type, parent_category_id, display_order, is_active)
values
  ('Kids Entertainment', 'kids-entertainment', 'service_provider', null, 220, true)
on conflict (slug) do nothing;

insert into public.tag_categories (name, slug, vendor_type, parent_category_id, display_order, is_active)
select t.name, t.slug, t.vt, p.id, t.ord, true
from (values
  ('Face painting', 'kids-entertainment--face-painting', 'service_provider', 1),
  ('Jumping castles', 'kids-entertainment--jumping-castles', 'service_provider', 2),
  ('Clowns', 'kids-entertainment--clowns', 'service_provider', 3),
  ('Magicians', 'kids-entertainment--magicians', 'service_provider', 4),
  ('Mascots', 'kids-entertainment--mascots', 'service_provider', 5),
  ('Party hosts', 'kids-entertainment--party-hosts', 'service_provider', 6),
  ('Age specific', 'kids-entertainment--age-specific', 'service_provider', 7),
  ('Indoor', 'kids-entertainment--indoor', 'service_provider', 8),
  ('Outdoor', 'kids-entertainment--outdoor', 'service_provider', 9),
  ('Supervised', 'kids-entertainment--supervised', 'service_provider', 10)
  ) as t(name, slug, vt, ord)
join public.tag_categories p on p.slug = 'kids-entertainment' and p.parent_category_id is null
on conflict (slug) do nothing;

-- Group: Cultural Performers
insert into public.tag_categories (name, slug, vendor_type, parent_category_id, display_order, is_active)
values
  ('Cultural Performers', 'cultural-performers', 'service_provider', null, 230, true)
on conflict (slug) do nothing;

insert into public.tag_categories (name, slug, vendor_type, parent_category_id, display_order, is_active)
select t.name, t.slug, t.vt, p.id, t.ord, true
from (values
  ('Traditional dance', 'cultural-performers--traditional-dance', 'service_provider', 1),
  ('Cultural music', 'cultural-performers--cultural-music', 'service_provider', 2),
  ('Weddings', 'cultural-performers--weddings', 'service_provider', 3),
  ('Indoor', 'cultural-performers--indoor', 'service_provider', 4),
  ('Outdoor', 'cultural-performers--outdoor', 'service_provider', 5)
  ) as t(name, slug, vt, ord)
join public.tag_categories p on p.slug = 'cultural-performers' and p.parent_category_id is null
on conflict (slug) do nothing;

-- Group: Sound Engineers
insert into public.tag_categories (name, slug, vendor_type, parent_category_id, display_order, is_active)
values
  ('Sound Engineers', 'sound-engineers', 'service_provider', null, 240, true)
on conflict (slug) do nothing;

insert into public.tag_categories (name, slug, vendor_type, parent_category_id, display_order, is_active)
select t.name, t.slug, t.vt, p.id, t.ord, true
from (values
  ('Live sound', 'sound-engineers--live-sound', 'service_provider', 1),
  ('DJ support', 'sound-engineers--dj-support', 'service_provider', 2),
  ('Band support', 'sound-engineers--band-support', 'service_provider', 3),
  ('Indoor', 'sound-engineers--indoor', 'service_provider', 4),
  ('Outdoor', 'sound-engineers--outdoor', 'service_provider', 5),
  ('Equipment included', 'sound-engineers--equipment-included', 'service_provider', 6),
  ('Backup gear', 'sound-engineers--backup-gear', 'service_provider', 7)
  ) as t(name, slug, vt, ord)
join public.tag_categories p on p.slug = 'sound-engineers' and p.parent_category_id is null
on conflict (slug) do nothing;

-- Group: Lighting Specialists
insert into public.tag_categories (name, slug, vendor_type, parent_category_id, display_order, is_active)
values
  ('Lighting Specialists', 'lighting-specialists', 'service_provider', null, 250, true)
on conflict (slug) do nothing;

insert into public.tag_categories (name, slug, vendor_type, parent_category_id, display_order, is_active)
select t.name, t.slug, t.vt, p.id, t.ord, true
from (values
  ('Ambient lighting', 'lighting-specialists--ambient-lighting', 'service_provider', 1),
  ('Stage lighting', 'lighting-specialists--stage-lighting', 'service_provider', 2),
  ('Mood lighting', 'lighting-specialists--mood-lighting', 'service_provider', 3),
  ('Outdoor', 'lighting-specialists--outdoor', 'service_provider', 4),
  ('Indoor', 'lighting-specialists--indoor', 'service_provider', 5),
  ('Generator compatible', 'lighting-specialists--generator-compatible', 'service_provider', 6)
  ) as t(name, slug, vt, ord)
join public.tag_categories p on p.slug = 'lighting-specialists' and p.parent_category_id is null
on conflict (slug) do nothing;

-- Group: Staging & Rigging
insert into public.tag_categories (name, slug, vendor_type, parent_category_id, display_order, is_active)
values
  ('Staging & Rigging', 'staging-rigging', 'service_provider', null, 260, true)
on conflict (slug) do nothing;

insert into public.tag_categories (name, slug, vendor_type, parent_category_id, display_order, is_active)
select t.name, t.slug, t.vt, p.id, t.ord, true
from (values
  ('Stage build', 'staging-rigging--stage-build', 'service_provider', 1),
  ('Truss', 'staging-rigging--truss', 'service_provider', 2),
  ('Podium', 'staging-rigging--podium', 'service_provider', 3),
  ('Indoor', 'staging-rigging--indoor', 'service_provider', 4),
  ('Outdoor', 'staging-rigging--outdoor', 'service_provider', 5),
  ('Safety certified', 'staging-rigging--safety-certified', 'service_provider', 6),
  ('Setup included', 'staging-rigging--setup-included', 'service_provider', 7)
  ) as t(name, slug, vt, ord)
join public.tag_categories p on p.slug = 'staging-rigging' and p.parent_category_id is null
on conflict (slug) do nothing;

-- Group: Tents & Marquees
insert into public.tag_categories (name, slug, vendor_type, parent_category_id, display_order, is_active)
values
  ('Tents & Marquees', 'tents-marquees', 'service_provider', null, 270, true)
on conflict (slug) do nothing;

insert into public.tag_categories (name, slug, vendor_type, parent_category_id, display_order, is_active)
select t.name, t.slug, t.vt, p.id, t.ord, true
from (values
  ('Frame tents', 'tents-marquees--frame-tents', 'service_provider', 1),
  ('Peg and pole', 'tents-marquees--peg-and-pole', 'service_provider', 2),
  ('Clear roof', 'tents-marquees--clear-roof', 'service_provider', 3),
  ('Flooring included', 'tents-marquees--flooring-included', 'service_provider', 4),
  ('Sidewalls', 'tents-marquees--sidewalls', 'service_provider', 5)
  ) as t(name, slug, vt, ord)
join public.tag_categories p on p.slug = 'tents-marquees' and p.parent_category_id is null
on conflict (slug) do nothing;

-- Group: Furniture Hire
insert into public.tag_categories (name, slug, vendor_type, parent_category_id, display_order, is_active)
values
  ('Furniture Hire', 'furniture-hire', 'service_provider', null, 280, true)
on conflict (slug) do nothing;

insert into public.tag_categories (name, slug, vendor_type, parent_category_id, display_order, is_active)
select t.name, t.slug, t.vt, p.id, t.ord, true
from (values
  ('Lounge furniture', 'furniture-hire--lounge-furniture', 'service_provider', 1),
  ('Cocktail tables', 'furniture-hire--cocktail-tables', 'service_provider', 2),
  ('Dining tables', 'furniture-hire--dining-tables', 'service_provider', 3),
  ('Chairs', 'furniture-hire--chairs', 'service_provider', 4),
  ('Delivery included', 'furniture-hire--delivery-included', 'service_provider', 5),
  ('Setup included', 'furniture-hire--setup-included', 'service_provider', 6)
  ) as t(name, slug, vt, ord)
join public.tag_categories p on p.slug = 'furniture-hire' and p.parent_category_id is null
on conflict (slug) do nothing;

-- Group: Linen & Draping
insert into public.tag_categories (name, slug, vendor_type, parent_category_id, display_order, is_active)
values
  ('Linen & Draping', 'linen-draping', 'service_provider', null, 290, true)
on conflict (slug) do nothing;

insert into public.tag_categories (name, slug, vendor_type, parent_category_id, display_order, is_active)
select t.name, t.slug, t.vt, p.id, t.ord, true
from (values
  ('Tablecloths', 'linen-draping--tablecloths', 'service_provider', 1),
  ('Chair covers', 'linen-draping--chair-covers', 'service_provider', 2),
  ('Backdrops', 'linen-draping--backdrops', 'service_provider', 3),
  ('Ceiling draping', 'linen-draping--ceiling-draping', 'service_provider', 4),
  ('Colour options', 'linen-draping--colour-options', 'service_provider', 5),
  ('Setup included', 'linen-draping--setup-included', 'service_provider', 6)
  ) as t(name, slug, vt, ord)
join public.tag_categories p on p.slug = 'linen-draping' and p.parent_category_id is null
on conflict (slug) do nothing;

-- Group: Signage & Printing
insert into public.tag_categories (name, slug, vendor_type, parent_category_id, display_order, is_active)
values
  ('Signage & Printing', 'signage-printing', 'service_provider', null, 300, true)
on conflict (slug) do nothing;

insert into public.tag_categories (name, slug, vendor_type, parent_category_id, display_order, is_active)
select t.name, t.slug, t.vt, p.id, t.ord, true
from (values
  ('Seating charts', 'signage-printing--seating-charts', 'service_provider', 1),
  ('Welcome signs', 'signage-printing--welcome-signs', 'service_provider', 2),
  ('Banners', 'signage-printing--banners', 'service_provider', 3),
  ('Branding', 'signage-printing--branding', 'service_provider', 4),
  ('Custom design', 'signage-printing--custom-design', 'service_provider', 5),
  ('Rush orders', 'signage-printing--rush-orders', 'service_provider', 6)
  ) as t(name, slug, vt, ord)
join public.tag_categories p on p.slug = 'signage-printing' and p.parent_category_id is null
on conflict (slug) do nothing;

-- Group: Event Cleaning
insert into public.tag_categories (name, slug, vendor_type, parent_category_id, display_order, is_active)
values
  ('Event Cleaning', 'event-cleaning', 'service_provider', null, 310, true)
on conflict (slug) do nothing;

insert into public.tag_categories (name, slug, vendor_type, parent_category_id, display_order, is_active)
select t.name, t.slug, t.vt, p.id, t.ord, true
from (values
  ('Pre event', 'event-cleaning--pre-event', 'service_provider', 1),
  ('Post event', 'event-cleaning--post-event', 'service_provider', 2),
  ('During event', 'event-cleaning--during-event', 'service_provider', 3),
  ('Waste removal', 'event-cleaning--waste-removal', 'service_provider', 4),
  ('Eco friendly', 'event-cleaning--eco-friendly', 'service_provider', 5)
  ) as t(name, slug, vt, ord)
join public.tag_categories p on p.slug = 'event-cleaning' and p.parent_category_id is null
on conflict (slug) do nothing;

-- Group: Waste & Sanitation
insert into public.tag_categories (name, slug, vendor_type, parent_category_id, display_order, is_active)
values
  ('Waste & Sanitation', 'waste-sanitation', 'service_provider', null, 320, true)
on conflict (slug) do nothing;

insert into public.tag_categories (name, slug, vendor_type, parent_category_id, display_order, is_active)
select t.name, t.slug, t.vt, p.id, t.ord, true
from (values
  ('Portable toilets', 'waste-sanitation--portable-toilets', 'service_provider', 1),
  ('Luxury restrooms', 'waste-sanitation--luxury-restrooms', 'service_provider', 2),
  ('Handwash stations', 'waste-sanitation--handwash-stations', 'service_provider', 3),
  ('Servicing included', 'waste-sanitation--servicing-included', 'service_provider', 4)
  ) as t(name, slug, vt, ord)
join public.tag_categories p on p.slug = 'waste-sanitation' and p.parent_category_id is null
on conflict (slug) do nothing;

-- Group: Power & Generators
insert into public.tag_categories (name, slug, vendor_type, parent_category_id, display_order, is_active)
values
  ('Power & Generators', 'power-generators', 'service_provider', null, 330, true)
on conflict (slug) do nothing;

insert into public.tag_categories (name, slug, vendor_type, parent_category_id, display_order, is_active)
select t.name, t.slug, t.vt, p.id, t.ord, true
from (values
  ('Silent generators', 'power-generators--silent-generators', 'service_provider', 1),
  ('Backup power', 'power-generators--backup-power', 'service_provider', 2),
  ('Loadshedding ready', 'power-generators--loadshedding-ready', 'service_provider', 3),
  ('Outdoor events', 'power-generators--outdoor-events', 'service_provider', 4)
  ) as t(name, slug, vt, ord)
join public.tag_categories p on p.slug = 'power-generators' and p.parent_category_id is null
on conflict (slug) do nothing;

-- Group: Fireworks & Effects
insert into public.tag_categories (name, slug, vendor_type, parent_category_id, display_order, is_active)
values
  ('Fireworks & Effects', 'fireworks-effects', 'service_provider', null, 340, true)
on conflict (slug) do nothing;

insert into public.tag_categories (name, slug, vendor_type, parent_category_id, display_order, is_active)
select t.name, t.slug, t.vt, p.id, t.ord, true
from (values
  ('Fireworks', 'fireworks-effects--fireworks', 'service_provider', 1),
  ('Cold sparks', 'fireworks-effects--cold-sparks', 'service_provider', 2),
  ('Indoor approved', 'fireworks-effects--indoor-approved', 'service_provider', 3),
  ('Outdoor only', 'fireworks-effects--outdoor-only', 'service_provider', 4),
  ('Drone Displays', 'fireworks-effects--drone-displays', 'service_provider', 5)
  ) as t(name, slug, vt, ord)
join public.tag_categories p on p.slug = 'fireworks-effects' and p.parent_category_id is null
on conflict (slug) do nothing;

-- Group: Audio Visual Recording
insert into public.tag_categories (name, slug, vendor_type, parent_category_id, display_order, is_active)
values
  ('Audio Visual Recording', 'audio-visual-recording', 'service_provider', null, 350, true)
on conflict (slug) do nothing;

insert into public.tag_categories (name, slug, vendor_type, parent_category_id, display_order, is_active)
select t.name, t.slug, t.vt, p.id, t.ord, true
from (values
  ('Live streaming', 'audio-visual-recording--live-streaming', 'service_provider', 1),
  ('Hybrid events', 'audio-visual-recording--hybrid-events', 'service_provider', 2),
  ('Recording only', 'audio-visual-recording--recording-only', 'service_provider', 3),
  ('Corporate ready', 'audio-visual-recording--corporate-ready', 'service_provider', 4)
  ) as t(name, slug, vt, ord)
join public.tag_categories p on p.slug = 'audio-visual-recording' and p.parent_category_id is null
on conflict (slug) do nothing;

-- Group: Digital Invitations & RSVPs
insert into public.tag_categories (name, slug, vendor_type, parent_category_id, display_order, is_active)
values
  ('Digital Invitations & RSVPs', 'digital-invitations-rsvps', 'service_provider', null, 360, true)
on conflict (slug) do nothing;

insert into public.tag_categories (name, slug, vendor_type, parent_category_id, display_order, is_active)
select t.name, t.slug, t.vt, p.id, t.ord, true
from (values
  ('Online RSVP', 'digital-invitations-rsvps--online-rsvp', 'service_provider', 1),
  ('Guest tracking', 'digital-invitations-rsvps--guest-tracking', 'service_provider', 2),
  ('Seating management', 'digital-invitations-rsvps--seating-management', 'service_provider', 3),
  ('Mobile friendly', 'digital-invitations-rsvps--mobile-friendly', 'service_provider', 4)
  ) as t(name, slug, vt, ord)
join public.tag_categories p on p.slug = 'digital-invitations-rsvps' and p.parent_category_id is null
on conflict (slug) do nothing;

-- Group: Accommodation Providers
insert into public.tag_categories (name, slug, vendor_type, parent_category_id, display_order, is_active)
values
  ('Accommodation Providers', 'accommodation-providers', 'service_provider', null, 370, true)
on conflict (slug) do nothing;

insert into public.tag_categories (name, slug, vendor_type, parent_category_id, display_order, is_active)
select t.name, t.slug, t.vt, p.id, t.ord, true
from (values
  ('Group bookings', 'accommodation-providers--group-bookings', 'service_provider', 1),
  ('Shuttle coordination', 'accommodation-providers--shuttle-coordination', 'service_provider', 2),
  ('On site Accommodation', 'accommodation-providers--on-site-accommodation', 'service_provider', 3),
  ('Nearby', 'accommodation-providers--nearby', 'service_provider', 4)
  ) as t(name, slug, vt, ord)
join public.tag_categories p on p.slug = 'accommodation-providers' and p.parent_category_id is null
on conflict (slug) do nothing;

-- Group: Event Consultants
insert into public.tag_categories (name, slug, vendor_type, parent_category_id, display_order, is_active)
values
  ('Event Consultants', 'event-consultants', 'service_provider', null, 380, true)
on conflict (slug) do nothing;

insert into public.tag_categories (name, slug, vendor_type, parent_category_id, display_order, is_active)
select t.name, t.slug, t.vt, p.id, t.ord, true
from (values
  ('Concept development', 'event-consultants--concept-development', 'service_provider', 1),
  ('Budget planning', 'event-consultants--budget-planning', 'service_provider', 2),
  ('Sourcing', 'event-consultants--sourcing', 'service_provider', 3),
  ('Timeline creation', 'event-consultants--timeline-creation', 'service_provider', 4)
  ) as t(name, slug, vt, ord)
join public.tag_categories p on p.slug = 'event-consultants' and p.parent_category_id is null
on conflict (slug) do nothing;

-- Group: Entertainment
insert into public.tag_categories (name, slug, vendor_type, parent_category_id, display_order, is_active)
values
  ('Entertainment', 'entertainment', 'service_provider', null, 390, true)
on conflict (slug) do nothing;

insert into public.tag_categories (name, slug, vendor_type, parent_category_id, display_order, is_active)
select t.name, t.slug, t.vt, p.id, t.ord, true
from (values
  ('Team Building Games', 'entertainment--team-building-games', 'service_provider', 1),
  ('Celebrity Hosts', 'entertainment--celebrity-hosts', 'service_provider', 2),
  ('Clowns', 'entertainment--clowns', 'service_provider', 3),
  ('Comedians', 'entertainment--comedians', 'service_provider', 4),
  ('Content Creators & Influencers', 'entertainment--content-creators-influencers', 'service_provider', 5),
  ('Dancers', 'entertainment--dancers', 'service_provider', 6),
  ('Impersonators', 'entertainment--impersonators', 'service_provider', 7),
  ('Instrumentalists (Violinist, Pianist)', 'entertainment--instrumentalists-violinist-pianist', 'service_provider', 8),
  ('MC''s', 'entertainment--mc-s', 'service_provider', 9),
  ('Singers & Bands', 'entertainment--singers-bands', 'service_provider', 10),
  ('Speciality Acts (Acrobats, Fire Eaters, Jugglers, Puppeteers, Ventriloquists)', 'entertainment--speciality-acts-acrobats-fire-eaters-jugglers-puppeteers-ventriloquists', 'service_provider', 11)
  ) as t(name, slug, vt, ord)
join public.tag_categories p on p.slug = 'entertainment' and p.parent_category_id is null
on conflict (slug) do nothing;
