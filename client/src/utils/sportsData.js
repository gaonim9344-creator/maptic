// 100 Sports categorized for easy management
export const SPORTS_LIST = [
    // Ball Sports (20)
    { id: 1, name: '축구', category: 'ball', keywords: ['soccer', 'football'] },
    { id: 2, name: '농구', category: 'ball', keywords: ['basketball'] },
    { id: 3, name: '야구', category: 'ball', keywords: ['baseball'] },
    { id: 4, name: '배구', category: 'ball', keywords: ['volleyball'] },
    { id: 5, name: '핸드볼', category: 'ball', keywords: ['handball'] },
    { id: 6, name: '럭비', category: 'ball', keywords: ['rugby'] },
    { id: 7, name: '미식축구', category: 'ball', keywords: ['american football'] },
    { id: 8, name: '풋살', category: 'ball', keywords: ['futsal'] },
    { id: 9, name: '비치발리볼', category: 'ball', keywords: ['beach volleyball'] },
    { id: 10, name: '세펙타크로', category: 'ball', keywords: ['sepak takraw'] },
    { id: 11, name: '크리켓', category: 'ball', keywords: ['cricket'] },
    { id: 12, name: '소프트볼', category: 'ball', keywords: ['softball'] },
    { id: 13, name: '하키', category: 'ball', keywords: ['hockey'] },
    { id: 14, name: '플로어볼', category: 'ball', keywords: ['floorball'] },
    { id: 15, name: '킨볼', category: 'ball', keywords: ['kin-ball'] },
    { id: 16, name: '도지볼', category: 'ball', keywords: ['dodgeball'] },
    { id: 17, name: '워터폴로', category: 'ball', keywords: ['water polo'] },
    { id: 18, name: '골프', category: 'ball', keywords: ['golf'] },
    { id: 19, name: '볼링', category: 'ball', keywords: ['bowling'] },
    { id: 20, name: '당구', category: 'ball', keywords: ['billiards', 'pool'] },

    // Martial Arts (20)
    { id: 21, name: '태권도', category: 'martial', keywords: ['taekwondo'] },
    { id: 22, name: '유도', category: 'martial', keywords: ['judo'] },
    { id: 23, name: '검도', category: 'martial', keywords: ['kendo'] },
    { id: 24, name: '합기도', category: 'martial', keywords: ['hapkido'] },
    { id: 25, name: '복싱', category: 'martial', keywords: ['boxing'] },
    { id: 26, name: '킥복싱', category: 'martial', keywords: ['kickboxing'] },
    { id: 27, name: '주짓수', category: 'martial', keywords: ['jiu-jitsu', 'bjj'] },
    { id: 28, name: 'MMA', category: 'martial', keywords: ['mixed martial arts'] },
    { id: 29, name: '가라테', category: 'martial', keywords: ['karate'] },
    { id: 30, name: '우슈', category: 'martial', keywords: ['wushu'] },
    { id: 31, name: '쿵푸', category: 'martial', keywords: ['kung fu'] },
    { id: 32, name: '택견', category: 'martial', keywords: ['taekkyon'] },
    { id: 33, name: '씨름', category: 'martial', keywords: ['ssireum', 'korean wrestling'] },
    { id: 34, name: '무에타이', category: 'martial', keywords: ['muay thai'] },
    { id: 35, name: '펜싱', category: 'martial', keywords: ['fencing'] },
    { id: 36, name: '레슬링', category: 'martial', keywords: ['wrestling'] },
    { id: 37, name: '스모', category: 'martial', keywords: ['sumo'] },
    { id: 38, name: '크라브마가', category: 'martial', keywords: ['krav maga'] },
    { id: 39, name: '카포에라', category: 'martial', keywords: ['capoeira'] },
    { id: 40, name: '에스크리마', category: 'martial', keywords: ['escrima'] },

    // Racket Sports (10)
    { id: 41, name: '테니스', category: 'racket', keywords: ['tennis'] },
    { id: 42, name: '배드민턴', category: 'racket', keywords: ['badminton'] },
    { id: 43, name: '탁구', category: 'racket', keywords: ['table tennis', 'ping pong'] },
    { id: 44, name: '스쿼시', category: 'racket', keywords: ['squash'] },
    { id: 45, name: '라켓볼', category: 'racket', keywords: ['racquetball'] },
    { id: 46, name: '패들', category: 'racket', keywords: ['paddle'] },
    { id: 47, name: '피클볼', category: 'racket', keywords: ['pickleball'] },
    { id: 48, name: '비치테니스', category: 'racket', keywords: ['beach tennis'] },
    { id: 49, name: '실내테니스', category: 'racket', keywords: ['indoor tennis'] },
    { id: 50, name: '프레스코볼', category: 'racket', keywords: ['frescobol'] },

    // Water Sports (10)
    { id: 51, name: '수영', category: 'water', keywords: ['swimming'] },
    { id: 52, name: '다이빙', category: 'water', keywords: ['diving'] },
    { id: 53, name: '서핑', category: 'water', keywords: ['surfing'] },
    { id: 54, name: '카약', category: 'water', keywords: ['kayaking'] },
    { id: 55, name: '카누', category: 'water', keywords: ['canoeing'] },
    { id: 56, name: '래프팅', category: 'water', keywords: ['rafting'] },
    { id: 57, name: '요트', category: 'water', keywords: ['yachting', 'sailing'] },
    { id: 58, name: '윈드서핑', category: 'water', keywords: ['windsurfing'] },
    { id: 59, name: '웨이크보드', category: 'water', keywords: ['wakeboarding'] },
    { id: 60, name: '스쿠버다이빙', category: 'water', keywords: ['scuba diving'] },

    // Winter Sports (10)
    { id: 61, name: '스키', category: 'winter', keywords: ['skiing'] },
    { id: 62, name: '스노보드', category: 'winter', keywords: ['snowboarding'] },
    { id: 63, name: '아이스하키', category: 'winter', keywords: ['ice hockey'] },
    { id: 64, name: '피겨스케이팅', category: 'winter', keywords: ['figure skating'] },
    { id: 65, name: '스피드스케이팅', category: 'winter', keywords: ['speed skating'] },
    { id: 66, name: '쇼트트랙', category: 'winter', keywords: ['short track'] },
    { id: 67, name: '컬링', category: 'winter', keywords: ['curling'] },
    { id: 68, name: '봅슬레이', category: 'winter', keywords: ['bobsleigh'] },
    { id: 69, name: '루지', category: 'winter', keywords: ['luge'] },
    { id: 70, name: '바이애슬론', category: 'winter', keywords: ['biathlon'] },

    // Fitness & Gym (10)
    { id: 71, name: '헬스', category: 'fitness', keywords: ['gym', 'fitness', 'weight training'] },
    { id: 72, name: '요가', category: 'fitness', keywords: ['yoga'] },
    { id: 73, name: '필라테스', category: 'fitness', keywords: ['pilates'] },
    { id: 74, name: '크로스핏', category: 'fitness', keywords: ['crossfit'] },
    { id: 75, name: '에어로빅', category: 'fitness', keywords: ['aerobics'] },
    { id: 76, name: '줌바', category: 'fitness', keywords: ['zumba'] },
    { id: 77, name: 'GX', category: 'fitness', keywords: ['group exercise'] },
    { id: 78, name: '스피닝', category: 'fitness', keywords: ['spinning', 'cycling'] },
    { id: 79, name: 'TRX', category: 'fitness', keywords: ['trx', 'suspension training'] },
    { id: 80, name: '바디펌프', category: 'fitness', keywords: ['body pump'] },

    // Athletics & Track (10)
    { id: 81, name: '육상', category: 'athletics', keywords: ['track and field', 'athletics'] },
    { id: 82, name: '마라톤', category: 'athletics', keywords: ['marathon'] },
    { id: 83, name: '트레일러닝', category: 'athletics', keywords: ['trail running'] },
    { id: 84, name: '철인3종', category: 'athletics', keywords: ['triathlon'] },
    { id: 85, name: '사이클', category: 'athletics', keywords: ['cycling'] },
    { id: 86, name: '인라인스케이트', category: 'athletics', keywords: ['inline skating'] },
    { id: 87, name: '스케이트보드', category: 'athletics', keywords: ['skateboarding'] },
    { id: 88, name: 'BMX', category: 'athletics', keywords: ['bmx'] },
    { id: 89, name: '파쿠르', category: 'athletics', keywords: ['parkour'] },
    { id: 90, name: '체조', category: 'athletics', keywords: ['gymnastics'] },

    // Extreme & Others (10)
    { id: 91, name: '암벽등반', category: 'extreme', keywords: ['rock climbing'] },
    { id: 92, name: '클라이밍', category: 'extreme', keywords: ['climbing'] },
    { id: 93, name: '볼더링', category: 'extreme', keywords: ['bouldering'] },
    { id: 94, name: '번지점프', category: 'extreme', keywords: ['bungee jumping'] },
    { id: 95, name: '스카이다이빙', category: 'extreme', keywords: ['skydiving'] },
    { id: 96, name: '패러글라이딩', category: 'extreme', keywords: ['paragliding'] },
    { id: 97, name: '승마', category: 'extreme', keywords: ['horse riding'] },
    { id: 98, name: '양궁', category: 'extreme', keywords: ['archery'] },
    { id: 99, name: '사격', category: 'extreme', keywords: ['shooting'] },
    { id: 100, name: '댄스스포츠', category: 'extreme', keywords: ['dance sport'] }
];

// Specific emoji mapping for individual sports
const SPECIFIC_EMOJI_MAP = {
    '축구': '⚽',
    '농구': '🏀',
    '야구': '⚾',
    '배구': '🏐',
    '럭비': '🏉',
    '미식축구': '🏈',
    '테니스': '🎾',
    '배드민턴': '🏸',
    '탁구': '🏓',
    '당구': '🎱',
    '볼링': '🎳',
    '골프': '⛳',
    '복싱': '🥊',
    '태권도': '🥋',
    '유도': '🥋',
    '수영': '🏊',
    '서핑': '🏄',
    '스키': '⛷️',
    '스노보드': '🏂',
    '자전거': '🚴',
    '승마': '🏇'
};

// Emoji mapping for map markers based on sport category (fallback)
export const EMOJI_MAP = {
    ball: '⚽',
    martial: '🥋',
    racket: '🎾',
    water: '🏊',
    winter: '⛷️',
    fitness: '💪',
    athletics: '🏃',
    extreme: '🧗'
};

// Get emoji for a specific sport
export const getSportEmoji = (sportName) => {
    // 1. Check for specific emoji first
    if (SPECIFIC_EMOJI_MAP[sportName]) {
        return SPECIFIC_EMOJI_MAP[sportName];
    }

    // 2. Fallback to category emoji
    const sport = SPORTS_LIST.find(s => s.name === sportName);
    return sport ? EMOJI_MAP[sport.category] : '🏅';
};

// Get emoji by category
export const getEmojiByCategory = (category) => {
    return EMOJI_MAP[category] || '🏅';
};
