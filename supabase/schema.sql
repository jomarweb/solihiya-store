-- Solihiya demo store: schema, security rules, order function and catalog.
-- Safe to run more than once.

create table if not exists public.products (
  id            bigint generated always as identity primary key,
  slug          text unique not null,
  name          text not null,
  category      text not null check (category in ('Seating','Tables','Beds','Storage','Lighting','Decor')),
  material      text not null,
  material_group text not null,
  price         integer not null check (price > 0),
  compare_at    integer,
  stock         integer not null default 0 check (stock >= 0),
  featured      boolean not null default false,
  image         text not null,
  blurb         text not null,
  description   text not null,
  dimensions    text not null,
  care          text not null,
  created_at    timestamptz not null default now()
);

create table if not exists public.orders (
  id             uuid primary key default gen_random_uuid(),
  order_no       text unique not null,
  user_id        uuid not null references auth.users(id) on delete cascade,
  status         text not null default 'Received',
  subtotal       integer not null,
  shipping_fee   integer not null,
  total          integer not null,
  payment_method text not null,
  ship_name      text not null,
  ship_phone     text not null,
  ship_address   text not null,
  ship_city      text not null,
  ship_province  text not null,
  ship_postal    text not null,
  notes          text,
  created_at     timestamptz not null default now()
);

create table if not exists public.order_items (
  id          bigint generated always as identity primary key,
  order_id    uuid not null references public.orders(id) on delete cascade,
  product_id  bigint references public.products(id),
  name        text not null,
  image       text not null,
  unit_price  integer not null,
  qty         integer not null check (qty > 0)
);
create index if not exists orders_user_idx on public.orders(user_id, created_at desc);
create index if not exists order_items_order_idx on public.order_items(order_id);

alter table public.products    enable row level security;
alter table public.orders      enable row level security;
alter table public.order_items enable row level security;

drop policy if exists "Anyone can read products" on public.products;
create policy "Anyone can read products" on public.products for select using (true);

drop policy if exists "Customers read their own orders" on public.orders;
create policy "Customers read their own orders" on public.orders
  for select to authenticated using (user_id = auth.uid());

drop policy if exists "Customers read their own order items" on public.order_items;
create policy "Customers read their own order items" on public.order_items
  for select to authenticated using (
    exists (select 1 from public.orders o where o.id = order_id and o.user_id = auth.uid())
  );
-- No insert/update/delete policies: orders are only written through place_order().

create sequence if not exists public.order_no_seq start 1001;

create or replace function public.place_order(p_items jsonb, p_shipping jsonb, p_payment text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_order uuid;
  v_item jsonb;
  v_p products%rowtype;
  v_qty int;
  v_subtotal int := 0;
  v_ship int;
begin
  if v_user is null then raise exception 'Sign in to place an order'; end if;
  if p_items is null or jsonb_array_length(p_items) = 0 then raise exception 'The cart is empty'; end if;
  if p_payment not in ('Cash on delivery','GCash on delivery','Bank transfer') then raise exception 'Unknown payment method'; end if;
  if coalesce(trim(p_shipping->>'name'),'') = '' or coalesce(trim(p_shipping->>'address'),'') = ''
     or coalesce(trim(p_shipping->>'phone'),'') = '' or coalesce(trim(p_shipping->>'city'),'') = ''
     or coalesce(trim(p_shipping->>'province'),'') = '' or coalesce(trim(p_shipping->>'postal'),'') = '' then
    raise exception 'Delivery details are incomplete';
  end if;

  -- Lock rows, check stock and price from the database (never trust client prices).
  for v_item in select * from jsonb_array_elements(p_items) loop
    v_qty := (v_item->>'qty')::int;
    if v_qty is null or v_qty < 1 or v_qty > 50 then raise exception 'Invalid quantity'; end if;
    select * into v_p from products where id = (v_item->>'product_id')::bigint for update;
    if not found then raise exception 'A product in your cart no longer exists'; end if;
    if v_p.stock < v_qty then
      raise exception 'Only % of % left in stock', v_p.stock, v_p.name;
    end if;
    v_subtotal := v_subtotal + v_p.price * v_qty;
  end loop;

  v_ship := case when v_subtotal >= 50000 then 0 else 1500 end;

  insert into orders (order_no, user_id, subtotal, shipping_fee, total, payment_method,
                      ship_name, ship_phone, ship_address, ship_city, ship_province, ship_postal, notes)
  values ('SLH-' || nextval('order_no_seq'), v_user, v_subtotal, v_ship, v_subtotal + v_ship, p_payment,
          trim(p_shipping->>'name'), trim(p_shipping->>'phone'), trim(p_shipping->>'address'),
          trim(p_shipping->>'city'), trim(p_shipping->>'province'), trim(p_shipping->>'postal'),
          nullif(trim(coalesce(p_shipping->>'notes','')), ''))
  returning id into v_order;

  for v_item in select * from jsonb_array_elements(p_items) loop
    v_qty := (v_item->>'qty')::int;
    update products set stock = stock - v_qty where id = (v_item->>'product_id')::bigint
      returning * into v_p;
    insert into order_items (order_id, product_id, name, image, unit_price, qty)
    values (v_order, v_p.id, v_p.name, v_p.image, v_p.price, v_qty);
  end loop;

  return v_order;
end;
$$;

revoke all on function public.place_order(jsonb, jsonb, text) from public, anon;
grant execute on function public.place_order(jsonb, jsonb, text) to authenticated;

-- Catalog -----------------------------------------------------------------
insert into public.products (slug, name, category, material, material_group, price, compare_at, stock, featured, image, blurb, description, dimensions, care) values
('mabini-dining-chair','Mabini dining chair','Seating','Solid narra, oil finish','Narra',8900,null,24,true,'https://images.unsplash.com/photo-1699588772787-1eed3b726e0a','A light, sturdy dining chair with a curved back that holds you upright through long dinners.','The back rail is steamed and bent from a single length of narra, then joined to the rear legs with pegged mortise-and-tenon joints. The seat is shaped so you sit in it rather than on it.','W 46 × D 50 × H 80 cm, seat height 45 cm','Wipe with a damp cloth. Re-oil once a year with the included tung oil.'),
('tagaytay-spindle-chair','Tagaytay spindle chair','Seating','Solid narra, natural finish','Narra',9800,11500,14,false,'https://images.unsplash.com/photo-1650476524564-f94dc9669067','Seven turned spindles and a saddle seat, made the slow way in Pampanga.','Each spindle is turned on a lathe and fitted dry into the seat and crest rail, so the chair tightens as the wood settles. A quiet companion for the Hapag table.','W 44 × D 49 × H 86 cm, seat height 45 cm','Wipe with a damp cloth. Keep out of direct afternoon sun.'),
('lanao-lounge-chair','Lanao lounge chair','Seating','Bouclé upholstery on narra legs','Upholstered',24500,null,8,true,'https://images.unsplash.com/photo-1580480055273-228ff5388ef8','A low, enveloping reading chair in warm grey bouclé.','The shell is built on a kiln-dried hardwood frame with high-resilience foam, wrapped in a heavy bouclé that hides wear. Four splayed narra legs set it at a relaxed angle.','W 72 × D 78 × H 82 cm, seat height 40 cm','Vacuum with a soft brush. Spot clean with mild soap and water.'),
('amihan-armchair','Amihan armchair','Seating','Cotton canvas on solid narra frame','Upholstered',18900,null,11,true,'https://images.unsplash.com/photo-1586023492125-27b2c045efd7','An open-armed chair in sunflower canvas, with an exposed narra frame.','The frame stays visible, so you can see how it is made: rails and arms are doweled and glued, the cushions sit on woven abaca webbing for give without sag.','W 68 × D 74 × H 78 cm, seat height 43 cm','Cushion covers unzip for dry cleaning. Oil the frame once a year.'),
('sampaguita-sofa','Sampaguita three-seat sofa','Seating','Velvet upholstery on narra legs','Upholstered',58000,64000,5,true,'https://images.unsplash.com/photo-1555041469-a586c61ea9bc','A deep forest-green velvet sofa with a tight back and slim narra legs.','Feather-wrapped seat cushions over pocket springs, a kiln-dried frame with corner blocks, and velvet that deepens in color where light hits it. Seats three without anyone in the gap.','W 210 × D 92 × H 82 cm, seat height 44 cm','Brush the pile in one direction. Professional clean only.'),
('boracay-linen-sofa','Boracay linen sofa','Seating','Washed linen slipcover, hardwood frame','Upholstered',52000,null,6,false,'https://images.unsplash.com/photo-1775029676739-86443af4010d','A soft, washable linen sofa for houses with children and humid summers.','The slipcover is pre-washed so it will not shrink, and comes off for the machine. Down-blend cushions keep their loft in the heat.','W 200 × D 95 × H 80 cm, seat height 45 cm','Machine wash the slipcover cold, line dry.'),
('batangas-leather-sofa','Batangas leather sofa','Seating','Vegetable-tanned leather, narra frame','Upholstered',89000,null,2,false,'https://images.unsplash.com/photo-1691480152351-4b3f2c89ccff','Tufted cognac leather that will look better in ten years than it does today.','Full-grain leather over a hand-tied spring base, with buttons pulled through by hand. The leather will darken and soften as it is used.','W 205 × D 90 × H 78 cm, seat height 43 cm','Condition twice a year with leather balm. Avoid direct sun.'),
('kapit-bar-stool','Kapit bar stool','Seating','Solid narra, oil finish','Narra',6400,null,30,false,'https://images.unsplash.com/photo-1634798245965-03669c757183','A counter-height stool with a footrest ring at just the right height.','The legs splay outward for balance and are tied together by a turned footrest. The seat is dished to stay comfortable without a cushion.','Diameter 36 cm, H 75 cm','Wipe with a damp cloth. Re-oil once a year.'),
('bangko-stool','Bangko stool','Seating','Solid acacia, white wash','Acacia',3900,4600,0,false,'https://images.unsplash.com/photo-1503602642458-232111445657','The everyday bangko, washed pale. Seat, side table, plant stand.','Acacia offcuts from our table workshop, joined with through-tenons and finished with a white limewash that lets the grain show.','W 38 × D 28 × H 46 cm','Wipe clean. The finish can be refreshed with limewax.'),
('hapag-dining-table','Hapag dining table','Tables','Solid narra top and legs','Narra',62000,null,4,true,'https://images.unsplash.com/photo-1758977403341-0104135995af','A six-seat table in book-matched narra, for the meals that go on for hours.','Two wide boards are book-matched so the grain mirrors along the center line. The legs set in from the corners so no one sits against one.','L 180 × W 90 × H 75 cm, seats 6','Use coasters for hot dishes. Re-oil the top twice a year.'),
('silangan-extension-table','Silangan extension table','Tables','Solid narra, satin lacquer','Narra',74000,82000,3,false,'https://images.unsplash.com/photo-1758977403865-f79e156415b3','Seats six every day and ten at Noche Buena.','A butterfly leaf stores under the top and unfolds in a single motion. Waxed narra runners mean it slides open without a second person.','L 160 to 220 × W 95 × H 75 cm','Wipe with a damp cloth. The lacquer resists water rings.'),
('pampanga-coffee-table','Pampanga coffee table','Tables','Reclaimed narra','Narra',27500,null,7,true,'https://images.unsplash.com/photo-1777513538143-8525eb3943f6','A long, low table from beams salvaged from old Pampanga houses.','Each table carries the nail holes and saw marks of its first life. We plane only the top, so the sides keep their history.','L 130 × W 60 × H 40 cm','Wipe clean. No two tables are alike; yours will differ from the photo.'),
('laguna-oval-coffee-table','Laguna oval coffee table','Tables','Acacia veneer, solid acacia base','Acacia',21800,null,10,false,'https://images.unsplash.com/photo-1758565811033-84d1365000c6','A soft oval that is easy to walk around in a tight living room.','A pedestal base keeps the floor clear for feet, with a lower shelf for books and the remote.','L 120 × W 65 × H 38 cm','Wipe with a damp cloth.'),
('taal-side-table','Taal low table','Tables','Solid acacia top, steel hairpin legs','Acacia',12900,null,15,false,'https://images.unsplash.com/photo-1581428982868-e410dd047a90','A thick acacia slab on black hairpin legs. Small, heavy, steady.','The top is a single 4 cm board with its edges eased by hand. Powder-coated legs screw into threaded inserts, so it travels flat.','L 90 × W 45 × H 42 cm','Wipe clean. Tighten the legs after the first month.'),
('hilom-bed','Hilom bed','Beds','Solid narra frame and headboard','Narra',68000,null,4,true,'https://images.unsplash.com/photo-1688384452844-8364c3e2fc28','A queen bed with a low headboard and narra slats that breathe in the heat.','No box spring needed: the slats flex under the mattress and let air through, which keeps the bed cool in Manila summers. Assembles with four bolts.','Queen, for 152 × 190 cm mattress. W 166 × L 205 × H 90 cm','Re-tighten bolts once a year.'),
('banig-platform-bed','Banig platform bed','Beds','Acacia with woven pandan headboard','Acacia',54000,59000,6,false,'https://images.unsplash.com/photo-1633944095397-878622ebc01c','A low platform bed with a headboard woven like a banig sleeping mat.','The headboard panel is woven from pandan leaves by a cooperative in Basey, Samar, and framed in acacia. The platform sits 25 cm off the floor.','Queen, for 152 × 190 cm mattress. W 170 × L 210 × H 85 cm','Dust the weave with a soft brush.'),
('duyan-bed','Duyan bed','Beds','Solid narra, dark oil finish','Narra',72000,null,1,false,'https://images.unsplash.com/photo-1517912158475-fb0ab8c8eed1','A king bed in dark-oiled narra with a tall, solid headboard.','Thick posts and a headboard of three wide boards, finished in a dark oil that deepens the narra to near-chocolate.','King, for 183 × 190 cm mattress. W 198 × L 208 × H 110 cm','Re-oil every two years.'),
('aparador-sideboard','Aparador sideboard','Storage','Narra with rattan cane doors','Narra',46000,null,5,true,'https://images.unsplash.com/photo-1767963758785-b9def36c13e3','A long sideboard with cane-front doors that let the room breathe.','Solihiya cane panels, woven in Cebu, are set into narra frames on soft-close hinges. Two adjustable shelves inside fit plates, records or linens.','W 160 × D 45 × H 75 cm','Dust the cane with a soft brush. Keep away from aircon vents.'),
('lamesa-media-console','Lamesa media console','Storage','Acacia and lacquered panels','Acacia',32500,36000,7,false,'https://images.unsplash.com/photo-1758974782657-e5ada4b01c3c','Open shelves and closed cupboards for everything under the television.','A cable channel runs along the back, and the open bays are tall enough for a soundbar or a stack of books.','W 180 × D 40 × H 55 cm','Wipe with a damp cloth.'),
('silay-slatted-cabinet','Silay slatted cabinet','Storage','Solid narra, ebonized','Narra',39800,null,3,false,'https://images.unsplash.com/photo-1713810958247-01dbd76b4a61','Vertical slats in ebonized narra, after the window screens of old Silay houses.','The slats are spaced so air moves through but the contents stay hidden. Inside, one fixed and two movable shelves.','W 100 × D 42 × H 120 cm','Wipe with a dry cloth. Avoid harsh cleaners on the ebonized finish.'),
('baguio-dresser','Baguio dresser','Storage','Solid narra, oil finish','Narra',42000,null,4,false,'https://images.unsplash.com/photo-1612908317776-a3afde8232fa','Six dovetailed drawers in warm narra.','Every drawer is hand-dovetailed and runs on waxed hardwood runners, the way dressers were built before metal slides.','W 140 × D 48 × H 82 cm','Wax the runners once a year if drawers start to stick.'),
('aklatan-bookcase','Aklatan bookcase','Storage','Solid acacia','Acacia',28900,null,9,false,'https://images.unsplash.com/photo-1588580000645-4562a6d2c839','A tall, deep bookcase with shelves that will not bow under hardcovers.','Shelves are 2.5 cm solid acacia, housed into the sides rather than resting on pins, so they carry a full load of books for decades.','W 90 × D 35 × H 190 cm','Anchor to the wall with the included bracket.'),
('salakot-pendant','Salakot pendant lamp','Lighting','Hand-woven rattan','Rattan',7800,null,20,true,'https://images.unsplash.com/photo-1643509877015-c90830bb8519','A woven rattan shade shaped after the salakot hat. Casts a soft, patterned light.','Woven by hand in Cebu on a mold. The open weave throws a pattern on the ceiling at night. Includes a 1.5 m cloth cord and ceiling cup.','Diameter 45 cm, H 30 cm. E27 bulb, max 60 W (LED recommended)','Dust with a soft brush.'),
('bilao-pendant','Bilao pendant lamp','Lighting','Rattan and abaca','Rattan',6200,7200,12,false,'https://images.unsplash.com/photo-1578678809569-1a8ead9cb802','A round, close-woven shade after the bilao winnowing tray.','Rattan ribs wrapped in natural abaca cord give a warm, even glow. Good over a dining table in a pair.','Diameter 40 cm, H 28 cm. E27 bulb, max 60 W','Dust with a soft brush.'),
('kalinaw-table-lamp','Kalinaw table lamp','Lighting','Woven rattan base, linen shade','Rattan',5400,null,16,false,'https://images.unsplash.com/photo-1774211654530-2d43e0fdb00c','A woven base and a linen shade for a bedside or reading corner.','The base is woven over a weighted core so it will not tip. Inline switch on a 1.8 m cord.','Diameter 30 cm, H 52 cm. E27 bulb, max 40 W','Dust the base with a soft brush.'),
('bayong-baskets','Bayong storage baskets, set of 3','Decor','Hand-woven abaca','Abaca',3600,null,40,false,'https://images.unsplash.com/photo-1601330862030-1e08c703ac04','Three nesting baskets for throws, toys or laundry.','Woven from abaca by a family workshop in Catanduanes. Sturdy enough to carry full, and they stack inside one another when empty.','Large Ø 40 × H 35 cm, medium Ø 33 × H 30 cm, small Ø 26 × H 24 cm','Spot clean. Dry in the shade if wet.'),
('palayok-vase-set','Palayok vase set','Decor','Stoneware, matte glaze','Clay',4200,null,18,false,'https://images.unsplash.com/photo-1597696929736-6d13bed8e6a8','Five small vases in sand and bone glazes, after the shapes of clay cooking pots.','Thrown by hand in a studio in Laguna. Glazed inside so they hold water for fresh stems.','Heights from 12 to 22 cm','Hand wash only.'),
('banga-floor-vase','Banga floor vase','Decor','Terracotta, unglazed','Clay',5900,6800,10,false,'https://images.unsplash.com/photo-1612196808214-b8e1d6145a8c','A tall, round-bellied vase for dried branches and pampas.','Coil-built and burnished by hand, then fired at low temperature. Unglazed, so it is for dried arrangements only.','Diameter 34 × H 48 cm','Dust with a dry cloth. Not watertight.'),
('lupa-vase-trio','Lupa vase trio','Decor','Raw stoneware','Clay',3400,null,22,false,'https://images.unsplash.com/photo-1631125915902-d8abe9225ff2','Three stoneware vessels in the color of riverbank clay.','A matching trio in three heights, left raw on the outside and glazed inside.','Heights 14, 18 and 24 cm','Hand wash only.')
on conflict (slug) do nothing;
