import { Trip } from './types';

let idCounter = 0;
function genId(prefix: string): string {
  return `${prefix}-${++idCounter}`;
}

export function getTenerifeTrip(): Trip {
  idCounter = 0;
  // Activities/restaurants get IDs assigned at the end of this function
  const trip = {
    id: 'tenerife-2026',
    name: 'Tenerife',
    country: 'Espagne (Canaries)',
    flag: '\uD83C\uDDEE\uD83C\uDDE8',
    startDate: '2026-06-04',
    endDate: '2026-06-11',
    createdAt: '2026-01-01T00:00:00.000Z',
    phases: [
      { id: 0, name: 'Sud \u2014 Costa Adeje', color: '#FF6B6B', days: 'Jours 1-3', icon: '\uD83C\uDF0A' },
      { id: 1, name: 'Travers\u00e9e & Nord \u2014 La Laguna', color: '#45B7D1', days: 'Jours 4-6', icon: '\uD83C\uDF3F' },
      { id: 2, name: 'Dernier jour & D\u00e9part', color: '#FFB347', days: 'Jour 7', icon: '\u2708\uFE0F' },
    ],
    destinations: [
      {
        id: 1, name: 'Costa Adeje', subtitle: 'Base sud J1-3',
        lat: 28.0816, lng: -16.7260,
        days: 'Jours 1-3 \u2014 4-6 juin', dayNums: [1, 2, 3], phase: 0,
        description: 'Base strat\u00e9gique au sud. Playa del Duque, La Caleta, sunsets face \u00e0 La Gomera. Acc\u00e8s rapide au Teide et Los Gigantes.',
        highlights: ['Playa del Duque', 'La Caleta', 'Playa Diego Hern\u00e1ndez', 'Sunsets'],
        image: 'https://images.unsplash.com/photo-1573576267585-3191e83f2280?w=300&h=200&fit=crop',
      },
      {
        id: 2, name: 'Parc National du Teide', subtitle: 'Volcan & miradors J2',
        lat: 28.2720, lng: -16.6420,
        days: 'Jour 2 \u2014 5 juin', dayNums: [2], phase: 0,
        description: 'Plus haut sommet d\'Espagne. Roques de Garc\u00eda, randonn\u00e9e Samara, Mirador La Tarta au sunset.',
        highlights: ['Roques de Garc\u00eda', 'Fen\u00eatre du Teide', 'Rando Samara', 'Mirador La Tarta'],
        image: 'https://images.unsplash.com/photo-1580674285054-bed31e145f59?w=300&h=200&fit=crop',
      },
      {
        id: 3, name: 'Los Gigantes', subtitle: 'Baleines & falaises J3',
        lat: 28.2470, lng: -16.8400,
        days: 'Jour 3 \u2014 6 juin', dayNums: [3], phase: 0,
        description: 'Falaises de 600-800 m, whale watching \u00e9co, dauphins et baleines pilotes. Quad sunset au-dessus des nuages.',
        highlights: ['Whale watching', 'Falaises', 'Playa Diego Hern\u00e1ndez', 'Quad sunset'],
        image: 'https://images.unsplash.com/photo-1559827291-bce885509e90?w=300&h=200&fit=crop',
      },
      {
        id: 4, name: 'Masca & C\u00f4te Ouest', subtitle: 'Travers\u00e9e J4',
        lat: 28.2920, lng: -16.8400,
        days: 'Jour 4 \u2014 7 juin', dayNums: [4], phase: 1,
        description: 'Punta de Teno, route l\u00e9gendaire TF-436, village de Masca, Garachico, Mariposario del Drago, La Orotava.',
        highlights: ['Punta de Teno', 'Masca', 'Garachico', 'Mariposario del Drago'],
        image: 'https://images.unsplash.com/photo-1602088113235-229c19758e9f?w=300&h=200&fit=crop',
      },
      {
        id: 5, name: 'C\u00f4te Nord', subtitle: 'Plages sauvages J5',
        lat: 28.3980, lng: -16.5100,
        days: 'Jour 5 \u2014 8 juin', dayNums: [5], phase: 1,
        description: 'Playa El Bollullo, Rambla de Castro, Mirador des 500 Escalones, piscines naturelles de Bajamar.',
        highlights: ['Playa El Bollullo', 'Rambla de Castro', '500 Escalones', 'Bajamar'],
        image: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=300&h=200&fit=crop',
      },
      {
        id: 6, name: 'Anaga', subtitle: 'For\u00eat enchant\u00e9e J6',
        lat: 28.5400, lng: -16.2600,
        days: 'Jour 6 \u2014 9 juin', dayNums: [6], phase: 1,
        description: 'For\u00eat laurif\u00e8re mill\u00e9naire, Roque de Taborno, Taganana, Mirador de Aguaide, Playa de Benijo.',
        highlights: ['Cruz del Carmen', 'Roque de Taborno', 'Taganana', 'Playa de Benijo'],
        image: 'https://images.unsplash.com/photo-1600699318462-57a9e7983ec5?w=300&h=200&fit=crop',
      },
      {
        id: 7, name: 'Las Teresitas & El M\u00e9dano', subtitle: 'Dernier jour J7',
        lat: 28.5100, lng: -16.1870,
        days: 'Jour 7 \u2014 10 juin', dayNums: [7], phase: 2,
        description: 'Playa de Las Teresitas, Bocacangrejo (village troglodyte), El M\u00e9dano, d\u00eener d\'adieu \u00e0 Los Abrigos.',
        highlights: ['Las Teresitas', 'Bocacangrejo', 'El M\u00e9dano', 'Los Abrigos'],
        image: 'https://images.unsplash.com/photo-1540390769625-2fc3f8b1d50c?w=300&h=200&fit=crop',
      },
    ],
    days: [
      // ===== JOUR 1 — Mercredi 4 juin : Arriv\u00e9e + La Caleta =====
      {
        dayNumber: 1,
        title: 'Arriv\u00e9e, Arco de Tajao & sunset La Caleta',
        description: 'Atterrissage TFS, premier arr\u00eat \u00e0 l\'arche rocheuse, installation Costa Adeje, plage et coucher de soleil face \u00e0 La Gomera.',
        date: '2026-06-04',
        activities: [
          { time: '14:40', period: 'Apr\u00e8s-midi', name: 'A\u00e9roport TFS', query: 'Tenerife South Airport', lat: 28.0445, lng: -16.5725, desc: 'Atterrissage et r\u00e9cup\u00e9ration de la voiture de location.' },
          { time: '15:15', period: 'Apr\u00e8s-midi', name: 'Arco de Tajao', query: 'Arco de Tajao Tenerife', lat: 28.0760, lng: -16.4530, desc: 'Arche rocheuse naturelle sculpt\u00e9e par l\'\u00e9rosion, en bord de mer. Moins de 5 min de marche. Premier spot photo.' },
          { time: '15:45', period: 'Apr\u00e8s-midi', name: 'Route vers Costa Adeje', query: 'Costa Adeje Tenerife', lat: 28.0816, lng: -16.7260, desc: '20 min via TF-1.' },
          { time: '16:15', period: 'Apr\u00e8s-midi', name: 'Check-in Airbnb', query: 'Playa San Juan Tenerife', lat: 28.1790, lng: -16.8100, desc: 'Installation dans le logement \u00e0 Costa Adeje / Playa San Juan.' },
          { time: '17:00', period: 'Apr\u00e8s-midi', name: 'Playa del Duque', query: 'Playa del Duque Adeje Tenerife', lat: 28.0920, lng: -16.7400, desc: 'Premier bain. Sable dor\u00e9, eau calme \u00e0 22\u00b0C. La plus belle plage du sud.' },
          { time: '19:30', period: 'Soir', name: 'Balade littorale vers La Caleta', query: 'La Caleta de Adeje Tenerife', lat: 28.1000, lng: -16.7580, desc: '20 min \u00e0 pied depuis Playa del Duque, le long du littoral.' },
          { time: '20:30', period: 'Soir', name: 'D\u00eener \u00e0 La Caleta', query: 'La Caleta de Adeje restaurant', lat: 28.1000, lng: -16.7580, desc: 'Village de p\u00eacheurs authentique. Poisson grill\u00e9, papas arrugadas con mojo.' },
          { time: '21:15', period: 'Soir', name: 'Coucher de soleil La Caleta', query: 'La Caleta de Adeje sunset', lat: 28.1000, lng: -16.7580, desc: 'La Caleta fait face plein ouest \u2014 le soleil plonge derri\u00e8re La Gomera. Top 5 sunset de l\'\u00eele.' },
        ],
        restaurants: [
          { name: 'Restaurant La Caleta', query: 'Restaurante La Caleta de Adeje Tenerife', lat: 28.1000, lng: -16.7580, cuisine: 'Poisson & fruits de mer', priceRange: '\u20AC\u20AC', desc: 'Poisson grill\u00e9 du jour, papas arrugadas con mojo, dans le village de p\u00eacheurs face au sunset.' },
        ],
      },
      // ===== JOUR 2 — Jeudi 5 juin : Le Teide + Sunset Mirador La Tarta =====
      {
        dayNumber: 2,
        title: 'Le Teide \u00e0 pied + Sunset Mirador La Tarta',
        description: 'Journ\u00e9e 100% montagne : randonn\u00e9es Roques de Garc\u00eda et Samara, spot secret Fen\u00eatre du Teide, mer de nuages, sunset volcanique.',
        date: '2026-06-05',
        activities: [
          { time: '07:00', period: 'Matin', name: 'D\u00e9part Costa Adeje', query: 'Costa Adeje Tenerife', lat: 28.0816, lng: -16.7260, desc: 'Route TF-21 via Vilaflor (1h15). Paysages lunaires progressifs.' },
          { time: '07:20', period: 'Matin', name: 'Mirador de los Azulejos', query: 'Mirador de los Azulejos Tenerife', lat: 28.1800, lng: -16.6600, desc: 'Roches hydrothermales bleu-vert en bord de route. Arr\u00eat rapide 2 min.' },
          { time: '08:30', period: 'Matin', name: 'Randonn\u00e9e Roques de Garc\u00eda', query: 'Roques de Garcia Teide Tenerife', lat: 28.2220, lng: -16.6250, desc: 'Boucle 3,5 km, 1h30, facile. Roque Cinchado ("Doigt de Dieu"), La Catedral. Paysages de Mars.' },
          { time: '10:00', period: 'Matin', name: '"Fen\u00eatre sur le Teide" \u2014 spot secret', query: 'Teide window viewpoint Tenerife', lat: 28.3262, lng: -16.4897, desc: 'Sentier n\u00b017, 15 min. Vue cadr\u00e9e du Teide \u00e0 travers une arche rocheuse naturelle. Quasi personne !' },
          { time: '10:45', period: 'Matin', name: 'Randonn\u00e9e Samara', query: 'Montaña Samara Teide Tenerife', lat: 28.2700, lng: -16.5900, desc: 'Boucle 5 km, 1h30, facile. Pins vert fluo sur sol noir volcanique, vue imprenable sur le Teide.' },
          { time: '12:30', period: 'Apr\u00e8s-midi', name: 'D\u00e9jeuner Parador', query: 'Parador de Las Cañadas del Teide', lat: 28.2240, lng: -16.6230, desc: 'Restaurant du Parador de Las Ca\u00f1adas. D\u00e9jeuner avec vue sur le volcan.' },
          { time: '13:30', period: 'Apr\u00e8s-midi', name: 'Route panoramique TF-24', query: 'TF-24 Tenerife panoramic road', lat: 28.3400, lng: -16.5200, desc: 'Travers\u00e9e de la cr\u00eate foresti\u00e8re.' },
          { time: '14:00', period: 'Apr\u00e8s-midi', name: 'Mirador de Chipeque', query: 'Mirador de Chipeque Tenerife', lat: 28.3900, lng: -16.4800, desc: 'Mer de nuages sous vos pieds, Teide derri\u00e8re. L\'un des plus beaux viewpoints d\'Europe. 1 830 m.' },
          { time: '15:00', period: 'Apr\u00e8s-midi', name: 'Retour via TF-21 sud', query: 'TF-21 Tenerife south', lat: 28.2500, lng: -16.6000, desc: 'Boucle pour se repositionner c\u00f4t\u00e9 sunset.' },
          { time: '19:30', period: 'Soir', name: 'Mirador de La Tarta', query: 'Mirador de La Tarta Tenerife', lat: 28.3500, lng: -16.5600, desc: 'Strates volcaniques multicolores fa\u00e7on "g\u00e2teau".' },
          { time: '20:45', period: 'Soir', name: 'Sunset au Mirador La Tarta', query: 'Mirador de La Tarta sunset Tenerife', lat: 28.3500, lng: -16.5600, desc: 'Le ciel s\'embrase sur les couches g\u00e9ologiques. Polaire obligatoire (~10\u00b0C \u00e0 1 800 m).' },
          { time: '21:30', period: 'Soir', name: 'Route retour Costa Adeje', query: 'Costa Adeje Tenerife', lat: 28.0816, lng: -16.7260, desc: '1h via TF-21.' },
        ],
        restaurants: [
          { name: 'Parador de Las Ca\u00f1adas', query: 'Parador de Las Cañadas del Teide restaurant', lat: 28.2240, lng: -16.6230, cuisine: 'Cuisine canarienne', priceRange: '\u20AC\u20AC', desc: 'Restaurant du Parador national, cuisine canarienne avec vue sur le Teide.' },
        ],
      },
      // ===== JOUR 3 — Vendredi 6 juin : Whale watching, plage secr\u00e8te, quad sunset =====
      {
        dayNumber: 3,
        title: 'Whale watching, plage secr\u00e8te & quad sunset',
        description: 'Baleines le matin depuis Los Gigantes, plage Diego Hern\u00e1ndez l\'apr\u00e8s-midi, quad au coucher de soleil au-dessus des nuages.',
        date: '2026-06-06',
        activities: [
          { time: '08:00', period: 'Matin', name: 'D\u00e9part vers Los Gigantes', query: 'Los Gigantes Tenerife', lat: 28.2470, lng: -16.8400, desc: 'D\u00e9part Costa Adeje \u2192 Los Gigantes (30-40 min).' },
          { time: '09:00', period: 'Matin', name: 'Whale Wise Eco Tours', query: 'Whale Wise Eco Tours Los Gigantes Tenerife', lat: 28.2470, lng: -16.8440, desc: 'Whale watching \u00e9co : bateau hybride \u00e9lectrique, max 10 passagers, biologiste marine. 2h30. Baleines pilotes + dauphins garantis. Falaises depuis la mer.' },
          { time: '12:00', period: 'Apr\u00e8s-midi', name: 'Mirador de Archipenque', query: 'Mirador de Archipenque Tenerife', lat: 28.2500, lng: -16.8450, desc: 'Meilleur point de vue terrestre sur les falaises de Los Gigantes. 5 min.' },
          { time: '12:30', period: 'Apr\u00e8s-midi', name: 'D\u00e9jeuner + Playa de los Gu\u00edos', query: 'Playa de los Guíos Los Gigantes Tenerife', lat: 28.2450, lng: -16.8420, desc: 'D\u00e9jeuner \u00e0 Los Gigantes + plage de sable noir au pied des falaises.' },
          { time: '14:00', period: 'Apr\u00e8s-midi', name: 'Retour Costa Adeje', query: 'Costa Adeje Tenerife', lat: 28.0816, lng: -16.7260, desc: 'Retour vers la base sud.' },
          { time: '14:30', period: 'Apr\u00e8s-midi', name: 'Playa Diego Hern\u00e1ndez', query: 'Playa Diego Hernández Tenerife', lat: 28.1100, lng: -16.7700, desc: 'Marche 20 min depuis La Caleta. Sable blanc, eau turquoise, vue sur La Gomera. Plage secr\u00e8te accessible uniquement \u00e0 pied.' },
          { time: '16:30', period: 'Apr\u00e8s-midi', name: 'Retour Airbnb', query: 'Costa Adeje Tenerife', lat: 28.0816, lng: -16.7260, desc: 'Pr\u00e9paration pour le quad.' },
          { time: '17:30', period: 'Soir', name: 'Pickup Tenerife First Quads', query: 'Tenerife First Quads', lat: 28.0800, lng: -16.7200, desc: 'Pickup h\u00f4tel par Tenerife First Quads.' },
          { time: '18:00', period: 'Soir', name: 'Quad Sunset Tour', query: 'Tenerife First Quads Teide sunset', lat: 28.2500, lng: -16.6500, desc: 'Quad sunset 3h. Villages canariens, for\u00eats de pins, terrain volcanique, culminant au-dessus de la mer de nuages \u00e0 ~2 400 m. Toast cava face au sunset.' },
        ],
        restaurants: [
          { name: 'Restaurant Los Gigantes', query: 'Restaurante Los Gigantes Tenerife', lat: 28.2470, lng: -16.8400, cuisine: 'Poisson frais', priceRange: '\u20AC\u20AC', desc: 'Poisson frais au pied des falaises de Los Gigantes.' },
        ],
      },
      // ===== JOUR 4 — Samedi 7 juin : Grande travers\u00e9e sud \u2192 nord =====
      {
        dayNumber: 4,
        title: 'Grande travers\u00e9e sud \u2192 nord',
        description: 'Check-out sud. Punta de Teno, route l\u00e9gendaire de Masca, Garachico, Mariposario del Drago, La Orotava, arriv\u00e9e La Laguna.',
        date: '2026-06-07',
        activities: [
          { time: '06:30', period: 'Matin', name: 'Check-out + d\u00e9part Punta de Teno', query: 'Costa Adeje Tenerife', lat: 28.0816, lng: -16.7260, desc: 'D\u00e9part t\u00f4t. Route ferm\u00e9e aux voitures apr\u00e8s 10h ! 50 min de route.' },
          { time: '07:30', period: 'Matin', name: 'Punta de Teno', query: 'Faro de Punta de Teno Tenerife', lat: 28.3470, lng: -16.9230, desc: 'Le phare au bout du monde. Route spectaculaire creus\u00e9e dans la falaise. Vagues sur les roches, impression de fin du monde. 30-45 min.' },
          { time: '08:15', period: 'Matin', name: 'Route retour Santiago del Teide', query: 'Santiago del Teide Tenerife', lat: 28.2970, lng: -16.8150, desc: '30 min de route retour.' },
          { time: '09:00', period: 'Matin', name: 'TF-436 vers Masca', query: 'TF-436 Masca road Tenerife', lat: 28.3000, lng: -16.8300, desc: 'Route l\u00e9gendaire vers Masca.' },
          { time: '09:10', period: 'Matin', name: 'Mirador de Cherfe', query: 'Mirador de Cherfe Tenerife', lat: 28.3100, lng: -16.8350, desc: 'Panorama 360\u00b0 sur les montagnes de Teno.' },
          { time: '09:35', period: 'Matin', name: 'Village de Masca', query: 'Masca village Tenerife', lat: 28.2920, lng: -16.8400, desc: '"Machu Picchu espagnol". Village perch\u00e9 dans les falaises. 30-45 min de balade.' },
          { time: '10:20', period: 'Matin', name: 'Continuation vers Buenavista', query: 'Buenavista del Norte Tenerife', lat: 28.3720, lng: -16.8610, desc: 'TF-436, 30 min.' },
          { time: '10:50', period: 'Matin', name: 'Charco Verde', query: 'Charco Verde Buenavista Tenerife', lat: 28.3800, lng: -16.8500, desc: 'Piscine naturelle secr\u00e8te, non r\u00e9f\u00e9renc\u00e9e sur Maps.' },
          { time: '11:30', period: 'Apr\u00e8s-midi', name: 'Charco de la Laja', query: 'Charco de la Laja Tenerife', lat: 28.3750, lng: -16.8100, desc: 'Piscine naturelle, bassin dans la lave noire. 5 min.' },
          { time: '12:00', period: 'Apr\u00e8s-midi', name: 'Route vers Garachico', query: 'Garachico Tenerife', lat: 28.3720, lng: -16.7640, desc: '15 min de route.' },
          { time: '12:15', period: 'Apr\u00e8s-midi', name: 'Garachico \u2014 El Calet\u00f3n', query: 'El Caletón Garachico Tenerife', lat: 28.3720, lng: -16.7640, desc: 'Piscines naturelles El Calet\u00f3n (gratuit) + centre historique. D\u00e9jeuner sur place.' },
          { time: '13:45', period: 'Apr\u00e8s-midi', name: 'Route vers Icod de los Vinos', query: 'Icod de los Vinos Tenerife', lat: 28.3670, lng: -16.7210, desc: '10 min.' },
          { time: '14:00', period: 'Apr\u00e8s-midi', name: 'Mariposario del Drago', query: 'Mariposario del Drago Icod Tenerife', lat: 28.3670, lng: -16.7210, desc: 'Jardin tropical de 800+ papillons exotiques en libert\u00e9. Naissance en direct dans le laboratoire. 30-45 min. 8,50 \u20ac/adulte. Drago Milenario visible depuis la place.' },
          { time: '14:45', period: 'Apr\u00e8s-midi', name: 'Route vers La Orotava', query: 'La Orotava Tenerife', lat: 28.3910, lng: -16.5230, desc: '30 min via TF-5.' },
          { time: '15:15', period: 'Apr\u00e8s-midi', name: 'La Orotava', query: 'La Orotava old town Tenerife', lat: 28.3910, lng: -16.5230, desc: 'Ville coloniale. Casa de los Balcones (1632, 5\u20ac), Jardines Victoria. 1h de visite.' },
          { time: '16:15', period: 'Apr\u00e8s-midi', name: 'Route vers La Laguna', query: 'San Cristóbal de La Laguna Tenerife', lat: 28.4870, lng: -16.3170, desc: '25 min.' },
          { time: '16:45', period: 'Soir', name: 'Check-in Airbnb La Laguna', query: 'La Laguna centro histórico Tenerife', lat: 28.4870, lng: -16.3170, desc: 'Installation dans le centre historique.' },
          { time: '17:30', period: 'Soir', name: 'Balade La Laguna', query: 'La Laguna UNESCO old town Tenerife', lat: 28.4870, lng: -16.3170, desc: 'Ville UNESCO. Cath\u00e9drale, Plaza del Adelantado, rues color\u00e9es.' },
          { time: '20:00', period: 'Soir', name: 'D\u00eener La Laguna', query: 'La Laguna tapas bar Tenerife', lat: 28.4870, lng: -16.3170, desc: 'Tapas dans le quartier universitaire.' },
        ],
        restaurants: [
          { name: 'Restaurant Garachico', query: 'Restaurante Garachico Tenerife', lat: 28.3720, lng: -16.7640, cuisine: 'Cuisine canarienne', priceRange: '\u20AC\u20AC', desc: 'D\u00e9jeuner \u00e0 Garachico pr\u00e8s des piscines naturelles El Calet\u00f3n.' },
          { name: 'Guachinche', query: 'Guachinche La Orotava Tenerife', lat: 28.3900, lng: -16.5300, cuisine: 'Guachinche canarien', priceRange: '\u20AC', desc: 'Taverne familiale. Vin maison, cuisine grand-m\u00e8re canarienne. Papas arrugadas, conejo en salmorejo. 8-15 \u20ac/pers. Cash uniquement.' },
          { name: 'Tapas La Laguna', query: 'Tapas bar La Laguna Tenerife', lat: 28.4870, lng: -16.3170, cuisine: 'Tapas', priceRange: '\u20AC', desc: 'Tapas dans le quartier universitaire de La Laguna. Ambiance vivante le soir.' },
        ],
      },
      // ===== JOUR 5 — Dimanche 8 juin : C\u00f4te nord =====
      {
        dayNumber: 5,
        title: 'C\u00f4te nord \u2014 plages sauvages, rando & miradors',
        description: 'Journ\u00e9e bonus : Playa El Bollullo, Rambla de Castro, Mirador des 500 Escalones, piscines de Bajamar.',
        date: '2026-06-08',
        activities: [
          { time: '08:30', period: 'Matin', name: 'D\u00e9part La Laguna', query: 'La Laguna Tenerife', lat: 28.4870, lng: -16.3170, desc: '30 min via TF-5 direction Puerto de la Cruz.' },
          { time: '09:00', period: 'Matin', name: 'Playa El Bollullo', query: 'Playa El Bollullo Tenerife', lat: 28.3980, lng: -16.5100, desc: 'Sable noir volcanique fin, falaises vertigineuses, chiringuito avec vue. Sentier raide ~15 min de descente. Ambiance sauvage.' },
          { time: '10:30', period: 'Matin', name: 'Marche vers Playa del Anc\u00f3n', query: 'Playa del Ancón Tenerife', lat: 28.3950, lng: -16.5200, desc: '20-30 min depuis El Bollullo le long de la c\u00f4te. Encore plus isol\u00e9e, quasi-d\u00e9serte.' },
          { time: '12:00', period: 'Apr\u00e8s-midi', name: 'Retour parking + route Rambla de Castro', query: 'Rambla de Castro Tenerife', lat: 28.3900, lng: -16.5300, desc: '10 min de route.' },
          { time: '12:15', period: 'Apr\u00e8s-midi', name: 'Randonn\u00e9e Rambla de Castro', query: 'Rambla de Castro hiking Tenerife', lat: 28.3900, lng: -16.5300, desc: 'Zone prot\u00e9g\u00e9e. Balade 1h30-2h : falaises, palmiers, dragonniers, ascenseur d\'eau de Gordejuela, Playa Castro avec cascade. Fort\u00edn de San Fernando.' },
          { time: '14:00', period: 'Apr\u00e8s-midi', name: 'D\u00e9jeuner Puerto de la Cruz', query: 'Puerto de la Cruz restaurant Tenerife', lat: 28.4140, lng: -16.5490, desc: 'D\u00e9jeuner dans la zone Puerto de la Cruz / Los Realejos.' },
          { time: '15:30', period: 'Apr\u00e8s-midi', name: 'Route vers Tacoronte', query: 'Tacoronte Tenerife', lat: 28.4772, lng: -16.4178, desc: '20 min.' },
          { time: '16:00', period: 'Apr\u00e8s-midi', name: 'Mirador de los 500 Escalones', query: 'Mirador 500 escalones Tacoronte Tenerife', lat: 28.4772, lng: -16.4178, desc: 'Cach\u00e9 dans un lotissement. Descente de marches dans la falaise, plateformes \u00e0 150 m au-dessus de l\'Atlantique. Vue sur toute la c\u00f4te nord et le Teide. 30-45 min.' },
          { time: '17:00', period: 'Soir', name: 'Route vers Bajamar', query: 'Bajamar Tenerife', lat: 28.5400, lng: -16.3500, desc: '15 min.' },
          { time: '17:15', period: 'Soir', name: 'Piscines naturelles de Bajamar', query: 'Piscinas naturales Bajamar Tenerife', lat: 28.5400, lng: -16.3500, desc: 'Bassins creus\u00e9s dans la roche volcanique, aliment\u00e9s par l\'oc\u00e9an. Moins touristiques que Garachico. Acc\u00e8s gratuit.' },
          { time: '18:30', period: 'Soir', name: 'Retour La Laguna', query: 'La Laguna Tenerife', lat: 28.4870, lng: -16.3170, desc: '15 min.' },
          { time: '19:30', period: 'Soir', name: 'D\u00eener La Laguna', query: 'La Laguna restaurant Tenerife', lat: 28.4870, lng: -16.3170, desc: 'D\u00eener + soir\u00e9e \u00e0 La Laguna.' },
        ],
        restaurants: [
          { name: 'Chiringuito El Bollullo', query: 'Chiringuito Playa El Bollullo Tenerife', lat: 28.3980, lng: -16.5100, cuisine: 'Bar de plage', priceRange: '\u20AC', desc: 'Caf\u00e9 ou bi\u00e8re avec vue sur la plage sauvage. Ambiance d\u00e9contract\u00e9e.' },
          { name: 'Restaurant Puerto de la Cruz', query: 'Restaurante Puerto de la Cruz Tenerife', lat: 28.4140, lng: -16.5490, cuisine: 'Cuisine canarienne', priceRange: '\u20AC\u20AC', desc: 'D\u00e9jeuner dans la zone de Puerto de la Cruz.' },
        ],
      },
      // ===== JOUR 6 — Lundi 9 juin : For\u00eat d'Anaga, Taborno & Benijo =====
      {
        dayNumber: 6,
        title: 'For\u00eat enchant\u00e9e d\'Anaga, Taborno & Benijo',
        description: 'La journ\u00e9e la plus photog\u00e9nique : for\u00eat laurif\u00e8re mill\u00e9naire, Roque de Taborno, Taganana, Playa de Benijo.',
        date: '2026-06-09',
        activities: [
          { time: '08:00', period: 'Matin', name: 'D\u00e9part La Laguna \u2192 Anaga', query: 'La Laguna Tenerife', lat: 28.4870, lng: -16.3170, desc: 'TF-12, 35-40 min.' },
          { time: '08:45', period: 'Matin', name: 'Mirador Pico del Ingl\u00e9s', query: 'Mirador Pico del Inglés Anaga Tenerife', lat: 28.5150, lng: -16.2700, desc: 'Vue 360\u00b0 : montagnes d\'Anaga, Teide en arri\u00e8re-plan.' },
          { time: '09:15', period: 'Matin', name: 'Cruz del Carmen \u2014 Sendero de los Sentidos', query: 'Cruz del Carmen Sendero de los Sentidos Tenerife', lat: 28.5100, lng: -16.2900, desc: 'Boucle 45 min dans la laurisilva mill\u00e9naire. Passerelles, ambiance de conte de f\u00e9es.' },
          { time: '10:00', period: 'Matin', name: 'Route vers Taborno', query: 'Taborno Anaga Tenerife', lat: 28.5400, lng: -16.2600, desc: '20 min.' },
          { time: '10:20', period: 'Matin', name: 'Randonn\u00e9e Roque de Taborno', query: 'Roque de Taborno hiking Tenerife', lat: 28.5400, lng: -16.2600, desc: 'Boucle 4 km, 230 m D+, 1h30-2h. D\u00e9part \u00e0 droite de l\'\u00e9glise. Rocher imposant, vue oc\u00e9an et montagnes. L\'une des plus belles randos d\'Anaga.' },
          { time: '12:30', period: 'Apr\u00e8s-midi', name: 'Route vers Taganana', query: 'Taganana Tenerife', lat: 28.5550, lng: -16.2100, desc: '20 min.' },
          { time: '13:00', period: 'Apr\u00e8s-midi', name: 'D\u00e9jeuner Taganana', query: 'Casa Africa Taganana Tenerife', lat: 28.5550, lng: -16.2100, desc: 'Poisson du jour. Casa Africa ou El Mirador de Aguaide. Menu ~12 \u20ac.' },
          { time: '14:00', period: 'Apr\u00e8s-midi', name: 'Route vers Benijo', query: 'Benijo Tenerife', lat: 28.5700, lng: -16.1900, desc: '10 min.' },
          { time: '14:05', period: 'Apr\u00e8s-midi', name: 'Mirador de Aguaide', query: 'Mirador de Aguaide Tenerife', lat: 28.5600, lng: -16.2000, desc: 'Vue spectaculaire sur les falaises d\'Anaga plongeant dans l\'Atlantique, les Roques de Anaga au loin. 10-15 min.' },
          { time: '14:15', period: 'Apr\u00e8s-midi', name: 'Playa de Benijo', query: 'Playa de Benijo Tenerife', lat: 28.5700, lng: -16.1900, desc: 'Sable noir volcanique, totalement sauvage, Roques de Anaga \u2014 deux pitons rocheux. Acc\u00e8s par 121 marches. Spot de contemplation.' },
          { time: '17:00', period: 'Soir', name: 'Retour La Laguna', query: 'La Laguna Tenerife', lat: 28.4870, lng: -16.3170, desc: '50 min.' },
          { time: '19:00', period: 'Soir', name: 'Soir\u00e9e La Laguna', query: 'La Laguna nightlife Tenerife', lat: 28.4870, lng: -16.3170, desc: 'Tapas, bi\u00e8re artisanale, barraquito.' },
        ],
        restaurants: [
          { name: 'Casa Africa', query: 'Casa Africa Taganana Tenerife', lat: 28.5550, lng: -16.2100, cuisine: 'Poisson frais', priceRange: '\u20AC', desc: 'Poisson du jour \u00e0 Taganana. Menu ~12 \u20ac. Ambiance village de p\u00eacheurs.' },
          { name: 'El Mirador de Aguaide', query: 'El Mirador de Aguaide restaurant Tenerife', lat: 28.5600, lng: -16.2050, cuisine: 'Poisson frais', priceRange: '\u20AC', desc: 'Restaurant avec vue sur les falaises d\'Anaga.' },
        ],
      },
      // ===== JOUR 7 — Mardi 10 juin : Las Teresitas, Bocacangrejo & d\u00eener d'adieu =====
      {
        dayNumber: 7,
        title: 'Las Teresitas, Bocacangrejo & d\u00eener d\'adieu',
        description: 'Dernier jour. Rythme doux, plage le matin, village troglodyte, retour vers le sud, d\u00eener d\'adieu \u00e0 Los Abrigos.',
        date: '2026-06-10',
        activities: [
          { time: '08:30', period: 'Matin', name: 'Check-out La Laguna', query: 'La Laguna Tenerife', lat: 28.4870, lng: -16.3170, desc: 'Check-out de l\'Airbnb.' },
          { time: '09:00', period: 'Matin', name: 'Mirador de Las Teresitas', query: 'Mirador de Las Teresitas Tenerife', lat: 28.5120, lng: -16.1850, desc: 'LA photo carte postale de Tenerife. Vue en hauteur sur la plage.' },
          { time: '09:30', period: 'Matin', name: 'Playa de Las Teresitas', query: 'Playa de Las Teresitas Santa Cruz Tenerife', lat: 28.5100, lng: -16.1870, desc: 'Sable dor\u00e9 du Sahara, 1,3 km, eau calme. Parking gratuit (880 places).' },
          { time: '11:30', period: 'Apr\u00e8s-midi', name: 'San Andr\u00e9s', query: 'San Andrés Tenerife', lat: 28.5060, lng: -16.1830, desc: 'Village de p\u00eacheurs, d\u00e9jeuner poisson frais.' },
          { time: '13:00', period: 'Apr\u00e8s-midi', name: 'Route vers Bocacangrejo', query: 'Bocacangrejo Tenerife', lat: 28.4400, lng: -16.2800, desc: '15 min sud.' },
          { time: '13:15', period: 'Apr\u00e8s-midi', name: 'Bocacangrejo', query: 'Bocacangrejo cave village Tenerife', lat: 28.4400, lng: -16.2800, desc: 'Village troglodyte, maisons-cavernes dans la lave noire. 30-45 min de visite.' },
          { time: '14:30', period: 'Apr\u00e8s-midi', name: 'Route vers le sud', query: 'El Médano Tenerife', lat: 28.0450, lng: -16.5350, desc: 'TF-1, 50 min.' },
          { time: '15:30', period: 'Apr\u00e8s-midi', name: 'Check-in dernier Airbnb (El M\u00e9dano)', query: 'El Médano Tenerife', lat: 28.0450, lng: -16.5350, desc: 'Logement pr\u00e8s de l\'a\u00e9roport TFS.' },
          { time: '16:00', period: 'Apr\u00e8s-midi', name: 'Playa del M\u00e9dano', query: 'Playa del Médano Tenerife', lat: 28.0450, lng: -16.5350, desc: 'Ambiance surf/kite, locale.' },
          { time: '19:30', period: 'Soir', name: 'D\u00eener d\'adieu \u2014 Los Abrigos', query: 'Los Abrigos Tenerife restaurant', lat: 28.0800, lng: -16.4700, desc: 'Village de p\u00eacheurs, 15 min de TFS. Poisson frais sur le front de mer.' },
          { time: '21:15', period: 'Soir', name: 'Dernier coucher de soleil', query: 'Los Abrigos sunset Tenerife', lat: 28.0800, lng: -16.4700, desc: 'Dernier sunset du voyage.' },
          { time: '22:00', period: 'Soir', name: 'Retour logement', query: 'El Médano Tenerife', lat: 28.0450, lng: -16.5350, desc: 'Valises pr\u00eates. R\u00e9veil 3h30 pour le vol du 11 juin \u00e0 6h.' },
        ],
        restaurants: [
          { name: 'Restaurant San Andr\u00e9s', query: 'Restaurante San Andrés Tenerife', lat: 28.5060, lng: -16.1830, cuisine: 'Poisson frais', priceRange: '\u20AC\u20AC', desc: 'Poisson frais dans le village de p\u00eacheurs de San Andr\u00e9s.' },
          { name: 'Restaurant Los Abrigos', query: 'Restaurante Los Abrigos Tenerife', lat: 28.0800, lng: -16.4700, cuisine: 'Poisson & fruits de mer', priceRange: '\u20AC\u20AC', desc: 'D\u00eener d\'adieu. Poisson frais sur le front de mer. Village de p\u00eacheurs \u00e0 15 min de l\'a\u00e9roport.' },
        ],
      },
    ],
  };

  // Auto-assign IDs to all activities and restaurants
  for (const day of (trip as any).days) { // eslint-disable-line
    day.activities = day.activities.map((a: any) => ({ ...a, id: a.id || genId('act') }));
    if (day.restaurants) {
      day.restaurants = day.restaurants.map((r: any) => ({ ...r, id: r.id || genId('rst') }));
    }
    if (day.tabelogRestaurants) {
      day.tabelogRestaurants = day.tabelogRestaurants.map((r: any) => ({ ...r, id: r.id || genId('trst') }));
    }
  }

  return trip as Trip;
}
