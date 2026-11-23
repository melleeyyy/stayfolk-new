/**
 * StayFolk — demo dataset.
 * Hosts, cities and reviews are static seed content. Anything a visitor does
 * (requests, messages, reviews, reports) lives in the browser store.
 */

export const CITIES = [
  { slug: 'kochi', name: 'Kochi', country: 'India', region: 'Kerala', blurb: 'Backwaters, art cafés and the oldest European church in India.' },
  { slug: 'bengaluru', name: 'Bengaluru', country: 'India', region: 'Karnataka', blurb: 'Filter coffee, startup energy and the greenest big city in India.' },
  { slug: 'goa', name: 'Goa', country: 'India', region: 'Panaji', blurb: 'Portuguese lanes, long beaches and a very slow Sunday.' },
  { slug: 'mumbai', name: 'Mumbai', country: 'India', region: 'Maharashtra', blurb: 'Late trains, vada pav and the Arabian Sea at the end of the street.' },
  { slug: 'jaipur', name: 'Jaipur', country: 'India', region: 'Rajasthan', blurb: 'Pink walls, block printing and rooftops full of kites.' },
  { slug: 'lisbon', name: 'Lisbon', country: 'Portugal', region: 'Lisboa', blurb: 'Seven hills, tiled façades and the best light in Europe.' },
  { slug: 'barcelona', name: 'Barcelona', country: 'Spain', region: 'Catalonia', blurb: 'Late dinners, modernist roofs and the sea ten minutes away.' },
  { slug: 'berlin', name: 'Berlin', country: 'Germany', region: 'Berlin', blurb: 'Cheap studios, long nights and a lake in the middle of the city.' },
  { slug: 'paris', name: 'Paris', country: 'France', region: 'Île-de-France', blurb: 'Bread at seven, wine at nine, museums in between.' },
  { slug: 'prague', name: 'Prague', country: 'Czechia', region: 'Bohemia', blurb: 'Cobblestones, cheap beer and a castle that never ends.' },
  { slug: 'istanbul', name: 'Istanbul', country: 'Türkiye', region: 'Marmara', blurb: 'Two continents, ferries at dawn and tea on every corner.' },
  { slug: 'dubai', name: 'Dubai', country: 'UAE', region: 'Dubai', blurb: 'Desert quiet ten minutes from the loudest skyline on earth.' },
  { slug: 'tokyo', name: 'Tokyo', country: 'Japan', region: 'Kantō', blurb: 'Convenience stores, tiny bars and trains that never run late.' },
  { slug: 'seoul', name: 'Seoul', country: 'South Korea', region: 'Seoul', blurb: 'Mountains inside the city, food open at 3am.' },
  { slug: 'bangkok', name: 'Bangkok', country: 'Thailand', region: 'Bangkok', blurb: 'Street food, river boats and heat you can taste.' },
  { slug: 'mexico-city', name: 'Mexico City', country: 'Mexico', region: 'CDMX', blurb: 'Markets, murals and the best tacos at 11pm.' },
  { slug: 'cape-town', name: 'Cape Town', country: 'South Africa', region: 'Western Cape', blurb: 'A mountain in the middle and two oceans outside.' },
  { slug: 'buenos-aires', name: 'Buenos Aires', country: 'Argentina', region: 'CABA', blurb: 'Bookshops in theatres, mate in the park, dinner at midnight.' },
];

export const LANGUAGES = [
  'English', 'Malayalam', 'Hindi', 'Tamil', 'French', 'Spanish', 'German',
  'Portuguese', 'Russian', 'Arabic', 'Korean', 'Japanese',
];

export const HOSTS = [
  {
    id: 'h1', name: 'Ananya Menon', citySlug: 'kochi', verified: true, womenOnly: false,
    rating: 4.9, reviewCount: 38, responseRate: 96, joined: '2019-03',
    languages: ['English', 'Malayalam', 'Hindi'], maxGuests: 2,
    space: 'Private room · Fort Kochi', tags: ['Backwaters', 'Cooking', 'Carnatic music'],
    bio: 'I grew up two streets from the Chinese fishing nets and I still walk to the harbour every evening. There is a spare room with a ceiling fan, a bookshelf and a lot of light. I cook a proper Kerala breakfast — puttu, kadala, the works — and I am happy to take you to the fish market if you are not squeamish about choosing your own dinner.',
    rules: ['Vegetarian kitchen on weekdays', 'No smoking indoors', 'Quiet after 10pm'],
  },
  {
    id: 'h2', name: 'Rahul Nair', citySlug: 'bengaluru', verified: true, womenOnly: false,
    rating: 4.7, reviewCount: 24, responseRate: 88, joined: '2020-07',
    languages: ['English', 'Malayalam', 'Kannada'], maxGuests: 1,
    space: 'Couch · Indiranagar', tags: ['Cycling', 'Craft beer', 'Live music'],
    bio: 'Product designer, weekend cyclist, and someone who will absolutely drag you to a 6am ride around Ulsoor lake. The couch is a proper one, in the living room, with a screen for privacy. I work from home so the flat is quiet during the day and quite the opposite after nine.',
    rules: ['Shoes off at the door', 'No guests after 11pm'],
  },
  {
    id: 'h3', name: 'Meera Iyer', citySlug: 'bengaluru', verified: true, womenOnly: true,
    rating: 5.0, reviewCount: 51, responseRate: 99, joined: '2018-11',
    languages: ['English', 'Tamil', 'Hindi'], maxGuests: 2,
    space: 'Guest room · Malleswaram', tags: ['Carnatic music', 'Temple food', 'Yoga'],
    bio: 'I host women and couples only — my mother lives downstairs and the house is a shared one. There is a proper guest room with an attached bathroom. I teach yoga at six in the morning and you are welcome to join, or to sleep through it.',
    rules: ['Women and couples only', 'No smoking', 'Please call before arriving'],
  },
  {
    id: 'h4', name: 'Diogo Ferreira', citySlug: 'lisbon', verified: true, womenOnly: false,
    rating: 4.8, reviewCount: 63, responseRate: 92, joined: '2017-05',
    languages: ['Portuguese', 'English', 'Spanish'], maxGuests: 3,
    space: 'Spare room · Alfama', tags: ['Fado', 'Surfing', 'Tiles'],
    bio: 'My flat is on the fourth floor with no lift, which is the price you pay for a view of the river from the kitchen window. I surf most mornings in Costa da Caparica and there is usually a spare board. I will make you a very strong coffee and tell you which tram to avoid.',
    rules: ['No smoking indoors', 'Kitchen closed after midnight'],
  },
  {
    id: 'h5', name: 'Lucía Romero', citySlug: 'barcelona', verified: true, womenOnly: false,
    rating: 4.6, reviewCount: 19, responseRate: 81, joined: '2021-02',
    languages: ['Spanish', 'Catalan', 'English'], maxGuests: 2,
    space: 'Sofa bed · Gràcia', tags: ['Vermouth', 'Architecture', 'Markets'],
    bio: 'Architect, night owl, and a Gràcia local since before the neighbourhood got expensive. The sofa bed is in the studio, which means you will wake up surrounded by half-finished models. I make a decent vermouth hour on Fridays and I know where the good vermuterias are.',
    rules: ['No smoking', 'Keep the studio door locked'],
  },
  {
    id: 'h6', name: 'Jonas Weber', citySlug: 'berlin', verified: false, womenOnly: false,
    rating: 4.4, reviewCount: 11, responseRate: 74, joined: '2022-09',
    languages: ['German', 'English'], maxGuests: 2,
    space: 'Couch · Neukölln', tags: ['Techno', 'Flea markets', 'Bike repair'],
    bio: 'I fix bicycles for a living and I have a couch that has hosted more nationalities than I can count. The flat is loud on weekends and quiet on Mondays. If you need a bike while you are here, take mine — just bring it back with air in the tyres.',
    rules: ['No smoking indoors', 'Bikes in the hallway, not the kitchen'],
  },
  {
    id: 'h7', name: 'Camille Dubois', citySlug: 'paris', verified: true, womenOnly: false,
    rating: 4.9, reviewCount: 44, responseRate: 94, joined: '2016-04',
    languages: ['French', 'English', 'Italian'], maxGuests: 2,
    space: 'Guest room · Belleville', tags: ['Baking', 'Cinema', 'Wine'],
    bio: 'I bake for a small pâtisserie in the 11th and I am useless before seven in the morning, which is exactly when I start work. The guest room looks onto a courtyard, so it is genuinely quiet. I will take you to the market on Sunday if you are awake.',
    rules: ['No smoking', 'Please be out of the bathroom before 6:30am'],
  },
  {
    id: 'h8', name: 'Tomáš Novák', citySlug: 'prague', verified: true, womenOnly: false,
    rating: 4.5, reviewCount: 27, responseRate: 85, joined: '2019-08',
    languages: ['Czech', 'English', 'German'], maxGuests: 3,
    space: 'Spare room · Vinohrady', tags: ['Beer', 'Hiking', 'Chess'],
    bio: 'I work in a bookshop and play chess badly but enthusiastically. The flat is a five-minute walk from the park and twenty from the centre. I can point you to the pubs where nobody speaks English, which is usually what people actually want.',
    rules: ['No smoking', 'Quiet after 11pm'],
  },
  {
    id: 'h9', name: 'Elif Yılmaz', citySlug: 'istanbul', verified: true, womenOnly: true,
    rating: 4.8, reviewCount: 36, responseRate: 91, joined: '2018-06',
    languages: ['Turkish', 'English', 'Arabic'], maxGuests: 2,
    space: 'Guest room · Kadıköy', tags: ['Ferries', 'Breakfast', 'Ceramics'],
    bio: 'I run a small ceramics studio on the Asian side and host women only. Breakfast here is a serious business — cheese, olives, tomatoes, bread, tea, and no rush. The ferry to the old city takes twenty minutes and is the best commute in the world.',
    rules: ['Women only', 'No smoking indoors', 'Shoes off'],
  },
  {
    id: 'h10', name: 'Aisha Al Mansoori', citySlug: 'dubai', verified: true, womenOnly: true,
    rating: 4.7, reviewCount: 15, responseRate: 87, joined: '2021-10',
    languages: ['Arabic', 'English', 'Hindi'], maxGuests: 2,
    space: 'Guest room · Jumeirah', tags: ['Desert', 'Coffee', 'Architecture'],
    bio: 'I host women travelling alone — it is simply easier for everyone here. The room is cool, quiet and has its own bathroom. I will take you for karak at the corner shop and, if the weather allows, out to the desert at sunset.',
    rules: ['Women only', 'No alcohol in the house', 'No smoking'],
  },
  {
    id: 'h11', name: 'Kenji Sato', citySlug: 'tokyo', verified: true, womenOnly: false,
    rating: 4.9, reviewCount: 58, responseRate: 95, joined: '2015-09',
    languages: ['Japanese', 'English'], maxGuests: 1,
    space: 'Tatami room · Yanaka', tags: ['Ramen', 'Vinyl', 'Temples'],
    bio: 'Yanaka is the old Tokyo — cats, temples, a shopping street that has not changed in fifty years. The room is small, tatami, with a futon. I collect records and I will absolutely make you listen to something. Please be quiet after ten; the walls are thin.',
    rules: ['Quiet after 10pm', 'No shoes on tatami', 'No smoking'],
  },
  {
    id: 'h12', name: 'Park Ji-woo', citySlug: 'seoul', verified: true, womenOnly: false,
    rating: 4.6, reviewCount: 22, responseRate: 83, joined: '2020-03',
    languages: ['Korean', 'English', 'Japanese'], maxGuests: 2,
    space: 'Couch · Hongdae', tags: ['Hiking', 'Noraebang', 'Street food'],
    bio: 'I study architecture and live five minutes from the Hongdae chaos, which is fun for exactly two nights. There is a mountain hike every Sunday at seven and I do not accept excuses. The couch folds flat and the apartment has a very good shower.',
    rules: ['No smoking', 'Remove shoes inside'],
  },
  {
    id: 'h13', name: 'Niran Chaiyaporn', citySlug: 'bangkok', verified: false, womenOnly: false,
    rating: 4.3, reviewCount: 9, responseRate: 70, joined: '2023-01',
    languages: ['Thai', 'English'], maxGuests: 2,
    space: 'Spare room · Ari', tags: ['Street food', 'Muay Thai', 'Rivers'],
    bio: 'I teach Muay Thai in the evenings and eat my way around Ari the rest of the time. The spare room is basic but clean, with a fan and a very good mattress. If you want the tourist version of Bangkok, I am the wrong host; if you want the breakfast version, I am the right one.',
    rules: ['No smoking', 'No shoes indoors'],
  },
  {
    id: 'h14', name: 'Valeria Cruz', citySlug: 'mexico-city', verified: true, womenOnly: false,
    rating: 4.8, reviewCount: 31, responseRate: 90, joined: '2019-02',
    languages: ['Spanish', 'English'], maxGuests: 3,
    space: 'Guest room · Roma Norte', tags: ['Tacos', 'Murals', 'Markets'],
    bio: 'I am a photographer and I know every market within walking distance. The guest room is at the back of the flat, away from the street, so you will actually sleep. Sunday means tamales and a long walk in Chapultepec, and you are coming.',
    rules: ['No smoking indoors', 'Please water the plants if I am away'],
  },
  {
    id: 'h15', name: 'Thandi Mokoena', citySlug: 'cape-town', verified: true, womenOnly: false,
    rating: 4.9, reviewCount: 26, responseRate: 93, joined: '2017-11',
    languages: ['English', 'Afrikaans'], maxGuests: 2,
    space: 'Guest room · Woodstock', tags: ['Hiking', 'Jazz', 'Coffee'],
    bio: 'Table Mountain is my back garden and I walk up it more often than is reasonable. The room is bright, the coffee is strong, and there is a very old dog who will pretend not to like you. I host a lot of people passing through between projects.',
    rules: ['No smoking', 'The dog decides the seating plan'],
  },
  {
    id: 'h16', name: 'Mateo Álvarez', citySlug: 'buenos-aires', verified: true, womenOnly: false,
    rating: 4.5, reviewCount: 17, responseRate: 79, joined: '2021-06',
    languages: ['Spanish', 'English', 'Portuguese'], maxGuests: 2,
    space: 'Sofa bed · San Telmo', tags: ['Tango', 'Bookshops', 'Football'],
    bio: 'San Telmo on a Sunday is the best market in South America and I live right in the middle of it. I will teach you three tango steps badly and then take you somewhere better. Dinner here starts at ten and nobody thinks that is strange.',
    rules: ['No smoking', 'Dinner is late, deal with it'],
  },
  {
    id: 'h17', name: 'Priya Sharma', citySlug: 'jaipur', verified: true, womenOnly: true,
    rating: 4.8, reviewCount: 33, responseRate: 89, joined: '2018-01',
    languages: ['Hindi', 'English', 'Rajasthani'], maxGuests: 2,
    space: 'Guest room · Old City', tags: ['Block printing', 'Kites', 'Textiles'],
    bio: 'My family has printed fabric in this lane for three generations and I run the workshop now. The guest room is on the roof floor with a view of the fort. I host women only, mostly because the house is shared with my parents. Breakfast is on the roof, always.',
    rules: ['Women only', 'No smoking', 'Family house — please dress modestly'],
  },
  {
    id: 'h18', name: 'Rohan Deshpande', citySlug: 'mumbai', verified: true, womenOnly: false,
    rating: 4.6, reviewCount: 29, responseRate: 86, joined: '2019-12',
    languages: ['Marathi', 'Hindi', 'English'], maxGuests: 1,
    space: 'Couch · Bandra', tags: ['Local trains', 'Cricket', 'Street food'],
    bio: 'Bandra is loud, the flat is small, and the couch is genuinely comfortable. I work in film production so my hours are strange, but I always leave coffee. The train from Bandra station will get you anywhere in the city for twelve rupees, and I will explain how not to get on the wrong one.',
    rules: ['No smoking indoors', 'One guest at a time'],
  },
  {
    id: 'h19', name: 'Sofia Costa', citySlug: 'goa', verified: true, womenOnly: false,
    rating: 4.7, reviewCount: 21, responseRate: 88, joined: '2020-11',
    languages: ['English', 'Portuguese', 'Konkani'], maxGuests: 3,
    space: 'Spare room · Assagao', tags: ['Beaches', 'Yoga', 'Feni'],
    bio: 'I left Mumbai for a house with too many mango trees and no regrets. The spare room is upstairs with a balcony and a fan that makes a noise. There are two dogs, a bicycle you can borrow, and a very short walk to the best bakery in north Goa.',
    rules: ['No smoking indoors', 'Dogs are friendly, please be gentle'],
  },
  {
    id: 'h20', name: 'Ivan Petrov', citySlug: 'prague', verified: false, womenOnly: false,
    rating: 4.2, reviewCount: 7, responseRate: 66, joined: '2023-05',
    languages: ['Russian', 'Czech', 'English'], maxGuests: 2,
    space: 'Couch · Žižkov', tags: ['Pubs', 'History', 'Chess'],
    bio: 'Žižkov has more pubs per square metre than anywhere in Europe and I have tested this claim personally. The couch is in the living room, the building is old, the lift works most days. I am learning Czech and failing slowly.',
    rules: ['No smoking', 'No shoes inside'],
  },
  {
    id: 'h21', name: 'Hana Kimura', citySlug: 'tokyo', verified: true, womenOnly: true,
    rating: 5.0, reviewCount: 40, responseRate: 97, joined: '2018-03',
    languages: ['Japanese', 'English'], maxGuests: 2,
    space: 'Guest room · Shimokitazawa', tags: ['Vintage', 'Theatre', 'Coffee'],
    bio: 'Shimokitazawa is small theatres, vintage shops and coffee, and I have lived here for eleven years. I host women only — the flat is small and shared. I will show you the second-hand record shops and the tiny curry place that has six seats.',
    rules: ['Women only', 'Quiet after 11pm', 'No smoking'],
  },
  {
    id: 'h22', name: 'Marco Bianchi', citySlug: 'barcelona', verified: false, womenOnly: false,
    rating: 4.1, reviewCount: 6, responseRate: 62, joined: '2023-08',
    languages: ['Italian', 'Spanish', 'English'], maxGuests: 2,
    space: 'Couch · Poblenou', tags: ['Beach', 'Running', 'Pasta'],
    bio: 'I moved here from Bologna for a job I no longer have and stayed for the sea. The couch is a good one and the beach is eight minutes away on foot. I cook pasta properly and I am not modest about it.',
    rules: ['No smoking', 'Kitchen clean after use'],
  },
  {
    id: 'h23', name: 'Fatima Zahra', citySlug: 'dubai', verified: true, womenOnly: false,
    rating: 4.8, reviewCount: 18, responseRate: 90, joined: '2020-01',
    languages: ['Arabic', 'French', 'English'], maxGuests: 3,
    space: 'Guest room · Al Barsha', tags: ['Desert', 'Museums', 'Food'],
    bio: 'I teach French and spend my weekends driving into the desert with a thermos. The guest room sleeps two comfortably, three if you are friendly. I make a very good tagine and I will not be argued with about the correct amount of cumin.',
    rules: ['No smoking', 'No alcohol in the house'],
  },
  {
    id: 'h24', name: 'Arjun Pillai', citySlug: 'kochi', verified: true, womenOnly: false,
    rating: 4.5, reviewCount: 13, responseRate: 84, joined: '2022-02',
    languages: ['Malayalam', 'English', 'Tamil'], maxGuests: 2,
    space: 'Couch · Ernakulam', tags: ['Trains', 'Football', 'Tea shops'],
    bio: 'I work nights at a hospital in Ernakulam, so I am usually asleep when you wake up and awake when you sleep. The couch is yours and so is the kitchen. There is a tea shop downstairs that opens at five and I have been going there since school.',
    rules: ['No smoking', 'Please keep noise down in the morning'],
  },
];

export const REVIEWS = [
  { hostId: 'h1', author: 'Marta K.', rating: 5, date: '2026-02', text: 'Ananya took me to the fish market at six in the morning and then taught me how to cook what we bought. I have never eaten better in India.' },
  { hostId: 'h1', author: 'Daniel O.', rating: 5, date: '2025-11', text: 'The room is simple and perfect. She is generous with her time without ever being intrusive. I stayed three nights and left with a friend.' },
  { hostId: 'h1', author: 'Sneha R.', rating: 4, date: '2025-08', text: 'Lovely house and a wonderful breakfast. Fort Kochi is walkable from here, which made everything easy.' },
  { hostId: 'h4', author: 'Ingrid S.', rating: 5, date: '2026-01', text: 'Diogo lent me a board, a wetsuit and his grandmother’s recipe for bacalhau. The four flights of stairs are worth it for that view.' },
  { hostId: 'h11', author: 'Alex M.', rating: 5, date: '2025-12', text: 'Kenji is the most considerate host I have stayed with. The tatami room is tiny and exactly right. He played me a 1970s jazz record I have since bought.' },
  { hostId: 'h7', author: 'Priya N.', rating: 5, date: '2025-10', text: 'Woke up to the smell of baking every single morning. Camille is discreet, funny and knows every cheap good restaurant in the 11th.' },
  { hostId: 'h9', author: 'Lena B.', rating: 5, date: '2026-03', text: 'As a woman travelling alone, Elif made Istanbul feel completely manageable. The breakfast alone is worth the trip.' },
  { hostId: 'h17', author: 'Chloe T.', rating: 5, date: '2025-09', text: 'Breakfast on the roof with the fort in front of you. Priya’s family taught me block printing in an afternoon.' },
  { hostId: 'h15', author: 'Jonas W.', rating: 5, date: '2025-07', text: 'Walked up Table Mountain with Thandi at 5:30am and understood why she does it every week. The dog eventually approved of me.' },
  { hostId: 'h2', author: 'Riya S.', rating: 4, date: '2025-06', text: 'Great location in Indiranagar, comfortable couch and a host who actually cycles with you. Shower pressure could be better.' },
];

export const REFERENCES = [
  { hostId: 'h1', author: 'Lakshmi V.', relation: 'Friend, 8 years', text: 'Ananya has hosted half our college batch at this point. She is the person you call when you land somewhere with nowhere to go.' },
  { hostId: 'h1', author: 'Tom B.', relation: 'Former guest, 2023', text: 'Stayed two nights, still get a message every Onam. That is the kind of host she is.' },
  { hostId: 'h4', author: 'Rita F.', relation: 'Sister', text: 'He will feed you, take you surfing badly, and refuse to let you pay for anything. Very annoying, very kind.' },
  { hostId: 'h11', author: 'Yuki T.', relation: 'Neighbour, 12 years', text: 'Quiet, tidy, and the only person on this street who still says hello to everyone.' },
];

export const DEMO_USERS = [
  { id: 'u_host', name: 'Ananya Menon', email: 'host@stayfolk.demo', password: 'demo1234', role: 'host', hostId: 'h1', city: 'Kochi', verified: true },
  { id: 'u_guest', name: 'Sam Thomas', email: 'guest@stayfolk.demo', password: 'demo1234', role: 'guest', hostId: null, city: 'Bengaluru', verified: false },
  { id: 'u_admin', name: 'Moderator', email: 'admin@stayfolk.demo', password: 'demo1234', role: 'admin', hostId: null, city: '—', verified: true },
];

/** Seed requests so the host dashboard has something to show on first load. */
export const SEED_REQUESTS = [
  { id: 'r1', hostId: 'h1', userId: 'u_seed_1', guestName: 'Marta Kowalska', from: '2026-12-02', to: '2026-12-05', guests: 1, status: 'pending', createdAt: '2026-11-14T09:20:00.000Z', message: 'Hi Ananya! I am a photographer from Kraków, coming to Kochi for the biennale. I would love to see the fish market and cook something with you if you have time.' },
  { id: 'r2', hostId: 'h1', userId: 'u_seed_2', guestName: 'Daniel Okafor', from: '2026-12-18', to: '2026-12-20', guests: 2, status: 'pending', createdAt: '2026-11-16T17:05:00.000Z', message: 'Hello! My partner and I are travelling through Kerala for two weeks. We are quiet, tidy and very happy to help with cooking.' },
  { id: 'r3', hostId: 'h1', userId: 'u_seed_3', guestName: 'Sneha Ramesh', from: '2026-11-22', to: '2026-11-24', guests: 1, status: 'accepted', createdAt: '2026-11-08T11:40:00.000Z', message: 'Hi! I am coming down from Bengaluru for a wedding and need a place for two nights. I grew up in Thrissur so I know the food situation.' },
];

export const SEED_THREADS = [
  { id: 't1', hostId: 'h1', userId: 'u_seed_3', guestName: 'Sneha Ramesh', updatedAt: '2026-11-10T14:22:00.000Z' },
];

export const SEED_MESSAGES = [
  { id: 'm1', threadId: 't1', senderId: 'u_seed_3', text: 'Thank you for accepting! What time should I arrive on Saturday?', at: '2026-11-10T14:10:00.000Z' },
  { id: 'm2', threadId: 't1', senderId: 'u_host', text: 'Any time after four is perfect. I will be home from work by then — come straight up, third floor.', at: '2026-11-10T14:22:00.000Z' },
];

export const SEED_REPORTS = [
  { id: 'rp1', targetType: 'host', targetId: 'h20', targetName: 'Ivan Petrov', reason: 'Asked for money for the stay', detail: 'The host wrote that "contributions" of €20 per night were expected after accepting. That is against the rules.', status: 'open', createdAt: '2026-11-15T08:30:00.000Z' },
  { id: 'rp2', targetType: 'member', targetId: 'u_seed_9', targetName: 'Guest #4412', reason: 'Harassment in messages', detail: 'Repeated messages after being declined twice.', status: 'open', createdAt: '2026-11-16T19:12:00.000Z' },
  { id: 'rp3', targetType: 'host', targetId: 'h22', targetName: 'Marco Bianchi', reason: 'Profile photos not of the host', detail: 'Photos appear to be stock images from a rental listing.', status: 'open', createdAt: '2026-11-17T06:45:00.000Z' },
];

export const SEED_VERIFICATIONS = [
  { id: 'v1', userId: 'u_seed_11', name: 'Kavya Suresh', city: 'Kochi', submittedAt: '2026-11-17T10:02:00.000Z', status: 'pending' },
  { id: 'v2', userId: 'u_seed_12', name: 'Tobias Lind', city: 'Berlin', submittedAt: '2026-11-17T16:40:00.000Z', status: 'pending' },
  { id: 'v3', userId: 'u_seed_13', name: 'Aya Nakamura', city: 'Tokyo', submittedAt: '2026-11-18T04:15:00.000Z', status: 'pending' },
];

export const STATS = {
  hosts: 12480,
  cities: 412,
  countries: 74,
  stays: 186000,
};

export const hostById = (id) => HOSTS.find((h) => h.id === id);
export const cityBySlug = (slug) => CITIES.find((c) => c.slug === slug);
export const hostsInCity = (slug) => HOSTS.filter((h) => h.citySlug === slug);
export const reviewsFor = (id) => REVIEWS.filter((r) => r.hostId === id);
export const referencesFor = (id) => REFERENCES.filter((r) => r.hostId === id);
