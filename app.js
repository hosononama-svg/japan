const { createApp, ref, computed } = Vue;

// ===== ルーティング =====
function parseRoute() {
  const hash = window.location.hash.slice(1);
  if (hash.startsWith('era-')) return { view: 'era', eraId: hash.slice(4) };
  return { view: 'overview', eraId: null };
}

// ===== ユーティリティ =====
function formatYear(year) {
  if (year === null) return '現在';
  if (year < 0) return `紀元前${Math.abs(year)}年`;
  return `${year}年`;
}

function formatYearRange(start, end) {
  const s = formatYear(start);
  const e = end === null ? '現在' : formatYear(end);
  return `${s} 〜 ${e}`;
}

function formatLifespan(person) {
  const birth = formatYear(person.birthYear);
  const death = person.deathYear === null ? '現在' : person.deathYear ? `${person.deathYear}年` : '没年不詳';
  return `${birth} 〜 ${death}`;
}

// ===== 時代データ =====
const ERAS = [
  {
    id: 'jomon', name: '縄文時代', shortName: '縄文',
    startYear: -14000, endYear: -300,
    color: '#2d6a4f',
    gradient: 'linear-gradient(135deg, #1b4332 0%, #2d6a4f 60%, #52b788 100%)',
    icon: '🌿', flexValue: 117,
    description: '旧石器時代後、土器を持つ縄文人が列島に広がった。狩猟・採集・漁労を主な生業とし、定住型集落を形成した時代。',
  },
  {
    id: 'yayoi', name: '弥生時代', shortName: '弥生',
    startYear: -300, endYear: 250,
    color: '#52b788',
    gradient: 'linear-gradient(135deg, #2d6a4f 0%, #52b788 100%)',
    icon: '🌾', flexValue: 24,
    description: '大陸から稲作と金属器が伝わり農耕社会が成立。邪馬台国の卑弥呼など、クニ（国）が形成され始めた。',
  },
  {
    id: 'kofun', name: '古墳時代', shortName: '古墳',
    startYear: 250, endYear: 593,
    color: '#774936',
    gradient: 'linear-gradient(135deg, #4a2c1a 0%, #774936 60%, #a4643c 100%)',
    icon: '⛰️', flexValue: 19,
    description: '大型の前方後円墳が各地に建設され、ヤマト政権が勢力を拡大した時代。大陸文化が盛んに流入した。',
  },
  {
    id: 'asuka', name: '飛鳥時代', shortName: '飛鳥',
    startYear: 593, endYear: 710,
    color: '#6b35b8',
    gradient: 'linear-gradient(135deg, #3a0ca3 0%, #6b35b8 60%, #9d4edd 100%)',
    icon: '🏛️', flexValue: 11,
    description: '聖徳太子による政治改革と仏教普及。大化の改新で中央集権化が進み、律令国家の礎が築かれた。',
  },
  {
    id: 'nara', name: '奈良時代', shortName: '奈良',
    startYear: 710, endYear: 794,
    color: '#1a6b9a',
    gradient: 'linear-gradient(135deg, #03045e 0%, #1a6b9a 60%, #4096c8 100%)',
    icon: '🦌', flexValue: 10,
    description: '平城京を都として律令国家が完成。古事記・日本書紀・万葉集が編纂され、仏教文化が花開いた。',
  },
  {
    id: 'heian', name: '平安時代', shortName: '平安',
    startYear: 794, endYear: 1185,
    color: '#9d4edd',
    gradient: 'linear-gradient(135deg, #5a189a 0%, #9d4edd 60%, #c77dff 100%)',
    icon: '🌸', flexValue: 20,
    description: '京都（平安京）を中心に貴族文化が隆盛。仮名文字で源氏物語・枕草子など独自の文学が生まれた。',
  },
  {
    id: 'kamakura', name: '鎌倉時代', shortName: '鎌倉',
    startYear: 1185, endYear: 1336,
    color: '#c1121f',
    gradient: 'linear-gradient(135deg, #7b0d1e 0%, #c1121f 60%, #e63946 100%)',
    icon: '⚔️', flexValue: 12,
    description: '源頼朝が鎌倉に幕府を開き、武士が初めて政権を握る。元寇（モンゴル襲来）を撃退した時代。',
  },
  {
    id: 'muromachi', name: '室町時代', shortName: '室町',
    startYear: 1336, endYear: 1573,
    color: '#7f4f24',
    gradient: 'linear-gradient(135deg, #4a2a0a 0%, #7f4f24 60%, #b07d3e 100%)',
    icon: '🏮', flexValue: 15,
    description: '足利将軍家が治めるも次第に衰退。応仁の乱から戦国時代へ。能・茶道・水墨画など文化も栄えた。',
  },
  {
    id: 'azuchi', name: '安土桃山時代', shortName: '桃山',
    startYear: 1573, endYear: 1603,
    color: '#e76f51',
    gradient: 'linear-gradient(135deg, #ae2012 0%, #e76f51 60%, #f4a261 100%)',
    icon: '🔥', flexValue: 8,
    description: '織田信長・豊臣秀吉が天下統一を推進。南蛮文化の流入、城郭建築、茶の湯文化が最盛期を迎えた。',
  },
  {
    id: 'edo', name: '江戸時代', shortName: '江戸',
    startYear: 1603, endYear: 1868,
    color: '#168aad',
    gradient: 'linear-gradient(135deg, #0a4f6b 0%, #168aad 60%, #34a8c8 100%)',
    icon: '🏙️', flexValue: 16,
    description: '徳川家康が江戸幕府を開き260年の平和が続いた。鎖国下でも独自の文化（浮世絵・歌舞伎・俳句）が発展。',
  },
  {
    id: 'meiji', name: '明治時代', shortName: '明治',
    startYear: 1868, endYear: 1912,
    color: '#023e8a',
    gradient: 'linear-gradient(135deg, #03045e 0%, #023e8a 60%, #0077b6 100%)',
    icon: '⚙️', flexValue: 8,
    description: '西洋文明を積極導入し近代国家へ急速に変貌。鉄道・電信・学校制度が整備され列強と並ぶ国力を獲得した。',
  },
  {
    id: 'taisho', name: '大正時代', shortName: '大正',
    startYear: 1912, endYear: 1926,
    color: '#b5830a',
    gradient: 'linear-gradient(135deg, #7a5200 0%, #b5830a 60%, #e9c46a 100%)',
    icon: '🎭', flexValue: 8,
    description: '大正デモクラシーが花開き市民文化が成熟。映画・ラジオ・雑誌が普及したが関東大震災も経験した。',
  },
  {
    id: 'showa', name: '昭和時代', shortName: '昭和',
    startYear: 1926, endYear: 1989,
    color: '#343a40',
    gradient: 'linear-gradient(135deg, #111 0%, #343a40 60%, #6c757d 100%)',
    icon: '🕊️', flexValue: 8,
    description: '戦争と復興と高度経済成長。太平洋戦争の敗戦から奇跡的な経済復興を遂げ、世界第2位の経済大国になった。',
  },
  {
    id: 'heisei', name: '平成時代', shortName: '平成',
    startYear: 1989, endYear: 2019,
    color: '#4895ef',
    gradient: 'linear-gradient(135deg, #0077b6 0%, #4895ef 60%, #90e0ef 100%)',
    icon: '💻', flexValue: 8,
    description: 'バブル崩壊から「失われた30年」と呼ばれる経済停滞。インターネット普及・スマホ時代の幕開けも経験した。',
  },
  {
    id: 'reiwa', name: '令和時代', shortName: '令和',
    startYear: 2019, endYear: null,
    color: '#d1477a',
    gradient: 'linear-gradient(135deg, #9b1d5e 0%, #d1477a 60%, #f06fa4 100%)',
    icon: '🌸', flexValue: 8,
    description: '令和改元とともにコロナパンデミック・デジタル化・AI革命と大きな変化の時代が始まった。',
  },
];

// ===== 人物データ =====
const PEOPLE = {
  jomon: [],   // 記録に残る固有名詞の人物がいない時代

  yayoi: [
    {
      id: 'p_y1', birthYear: 170, deathYear: 248,
      name: '卑弥呼', title: '邪馬台国の女王', icon: '👑',
      category: '政治・宗教', wikipediaTitle: '卑弥呼',
      description: '倭国（日本）の女王として30余国を統合した人物。「鬼道（まじない）」で民衆を統治し、239年に中国の魏に使者を送り「親魏倭王」の称号を授かった。',
      connectionToNow: '卑弥呼の実在と邪馬台国の所在（九州説・近畿説）は今も解明されておらず、日本最大の歴史の謎として考古学・歴史学を刺激し続けています。「女性リーダー」の原点とも言える存在です。',
    },
    {
      id: 'p_y2', birthYear: 176, deathYear: null,
      name: '台与（とよ）', title: '邪馬台国の女王（卑弥呼の後継）', icon: '✨',
      category: '政治', wikipediaTitle: '台与',
      description: '卑弥呼の死後、13歳で女王に擁立された人物。卑弥呼死後の内乱を収め、266年に晋（中国）に使者を送った記録がある。',
      connectionToNow: '若くして国を治めた台与の存在は、リーダーシップに年齢・性別は関係ないというメッセージを1800年以上前に体現しています。現代の若手リーダー論と重なる存在です。',
    },
  ],

  kofun: [
    {
      id: 'p_k1', birthYear: null, deathYear: 427,
      name: '仁徳天皇', title: '第16代天皇', icon: '🏛️',
      category: '政治', wikipediaTitle: '仁徳天皇',
      description: '「民のかまど」の伝説で知られる慈悲深い天皇。大阪府堺市の大仙陵古墳（仁徳天皇陵）は全長486mと世界最大級の墓を持つ。',
      connectionToNow: '大仙陵古墳は2019年に世界遺産登録。「民の苦しみを見て課税を止めた」という仁徳天皇の逸話は、現代でも「良い指導者の条件」として語り継がれています。',
    },
    {
      id: 'p_k2', birthYear: null, deathYear: null,
      name: 'ヤマトタケル', title: '伝説の英雄皇子', icon: '⚔️',
      category: '英雄・伝説', wikipediaTitle: 'ヤマトタケル',
      description: '日本武尊（やまとたけるのみこと）。古事記・日本書紀に登場する英雄的皇子。東征・西征を行い大和朝廷の版図を広げたとされる半神話的人物。',
      connectionToNow: 'ヤマトタケルは日本最初の「英雄譚」の主人公です。現代のアニメ・漫画・ゲームの「強くて孤独な英雄」というキャラクター類型は、この神話に起源を持つとも言えます。',
    },
  ],

  asuka: [
    {
      id: 'p_a1', birthYear: 574, deathYear: 622,
      name: '聖徳太子', title: '推古天皇摂政・政治改革者', icon: '🏛️',
      category: '政治・宗教', wikipediaTitle: '聖徳太子',
      description: '推古天皇の摂政として十七条憲法制定・冠位十二階制定・遣隋使派遣を推進。「和を以て貴しとなす」の精神で国家基盤を築いた。',
      connectionToNow: '「和をもって貴しとなす」は現代日本のビジネス・政治スタイルの精神的原点です。また聖徳太子は1万円札・5000円札の顔として近年まで現代日本に存在し続けました。',
    },
    {
      id: 'p_a2', birthYear: 614, deathYear: 669,
      name: '藤原鎌足', title: '大化の改新の立役者・藤原氏の祖', icon: '🗡️',
      category: '政治', wikipediaTitle: '藤原鎌足',
      description: '中大兄皇子（後の天智天皇）と共謀して蘇我入鹿を暗殺し大化の改新を断行。死の直前に「藤原」の姓を賜り、その後1000年続く藤原氏の始祖となった。',
      connectionToNow: '藤原氏は平安時代に摂関政治で最盛期を迎え、1000年以上日本の政治・文化に影響を与え続けました。鎌足はその全てのスタートです。「政治的盟友」という関係性の古典的モデルでもあります。',
    },
    {
      id: 'p_a3', birthYear: 626, deathYear: 672,
      name: '天智天皇', title: '第38代天皇・大化の改新を主導', icon: '👑',
      category: '政治', wikipediaTitle: '天智天皇',
      description: '中大兄皇子として大化の改新を主導し、即位後は近江令・庚午年籍（日本初の全国戸籍）を作成。日本の律令国家建設を推進した。',
      connectionToNow: '天智天皇が始めた全国戸籍制度は、現代の住民基本台帳・マイナンバー制度の遠い祖先です。国民全員を把握して課税・徴兵する「国家の基盤」はここから始まりました。',
    },
  ],

  nara: [
    {
      id: 'p_n1', birthYear: 701, deathYear: 756,
      name: '聖武天皇', title: '第45代天皇・東大寺建立者', icon: '🦌',
      category: '政治・宗教', wikipediaTitle: '聖武天皇',
      description: '「仏の力で国を守る（鎮護国家）」という理念で国分寺・国分尼寺を全国に建立し、東大寺の大仏造営を命じた天皇。政治的混乱に悩み続けた人間的な一面も持つ。',
      connectionToNow: '聖武天皇が建立した東大寺・奈良の大仏は現在も年間100万人以上が訪れる観光地です。また「国家プロジェクトで文化を守る」という発想は、現代のユネスコ文化遺産保護にも通じます。',
    },
    {
      id: 'p_n2', birthYear: 668, deathYear: 749,
      name: '行基', title: '民衆に寄り添った仏教僧', icon: '🙏',
      category: '宗教・社会', wikipediaTitle: '行基',
      description: '民衆の中に入り橋・溜池・道路などのインフラを整備しながら仏教を広めた。当初は朝廷に禁圧されたが、後に大仏建立の協力者として「大僧正」に任じられた。',
      connectionToNow: '「宗教者が社会インフラを整備する」という行基のアプローチは、現代のNPO・ソーシャルイノベーションの原型とも言えます。民衆の声を聞き現場で課題解決するボトムアップ型の活動の先駆けです。',
    },
    {
      id: 'p_n3', birthYear: 700, deathYear: 770,
      name: '阿倍仲麻呂', title: '唐（中国）で活躍した国際人', icon: '🌏',
      category: '外交・文化', wikipediaTitle: '阿倍仲麻呂',
      description: '遣唐使として中国に渡り、唐の官吏として最高位まで昇り詰めた国際人。李白・王維ら詩人とも交流したが、帰国叶わず唐で生涯を終えた。',
      connectionToNow: '「海外で活躍する日本人」の元祖とも言える仲麻呂。現代の海外留学・グローバルキャリアという概念を1300年前に体現した人物です。望郷の気持ちを詠んだ百人一首の歌は今も広く親しまれています。',
    },
  ],

  heian: [
    {
      id: 'p_h1', birthYear: 966, deathYear: 1028,
      name: '藤原道長', title: '摂政・関白・平安最大の権力者', icon: '🌙',
      category: '政治', wikipediaTitle: '藤原道長',
      description: '「この世をば我が世とぞ思ふ望月の欠けたることもなしと思へば」と詠んだ絶頂期の権力者。4人の娘を天皇に嫁がせ、摂関政治の頂点に君臨した。',
      connectionToNow: '道長が体現した「縁故・コネクション重視の政治」は現代日本にも「政治とカネ」問題として続く宿痾です。一方で文化的パトロンとして紫式部らを支えたことで、世界文学に貢献しました。2024年の大河ドラマ「光る君へ」で再注目。',
    },
    {
      id: 'p_h2', birthYear: 973, deathYear: 1014,
      name: '紫式部', title: '「源氏物語」作者・世界最古の長編小説家', icon: '📖',
      category: '文学・文化', wikipediaTitle: '紫式部',
      description: '藤原道長の娘・彰子に仕えた女房。世界最古の長編小説と言われる「源氏物語」（54帖・約百万字）を著した。当時の宮廷文化・心理描写の深さは現代でも高く評価される。',
      connectionToNow: '源氏物語は1000年後の現在も世界50カ国以上で翻訳・読まれており、世界最古の長編小説として文学史に刻まれています。2024年大河ドラマの主人公として改めてフェミニズム・創作論の観点から再評価されています。',
    },
    {
      id: 'p_h3', birthYear: 966, deathYear: 1025,
      name: '清少納言', title: '「枕草子」作者・機知の女房', icon: '✍️',
      category: '文学・文化', wikipediaTitle: '清少納言',
      description: '一条天皇の后・定子に仕えた女房。「春はあけぼの」で始まる随筆「枕草子」を著した。知性的・批評的な文章で宮廷生活を鮮やかに描き、紫式部とは犬猿の仲とも伝わる。',
      connectionToNow: '「春はあけぼの、夏は夜…」という冒頭は現代の日本語教育の定番です。清少納言の「好きなものリスト」的な文体は、現代のSNS・ブログ文化の遠い祖先とも言えます。エッセイというジャンルの原点。',
    },
    {
      id: 'p_h4', birthYear: 845, deathYear: 903,
      name: '菅原道真', title: '学問の神様・左遷された天才官僚', icon: '⚡',
      category: '政治・学問', wikipediaTitle: '菅原道真',
      description: '類まれな学才で右大臣まで昇り詰めたが、藤原時平の謀略で大宰府に左遷され憤死。死後に天変地異が続いたため「祟り」として恐れられ、北野天満宮に「学問の神様」として祀られた。',
      connectionToNow: '全国約12,000社の天満宮・天神社で「学問の神様」として今も多くの受験生が合格祈願をしています。左遷・冤罪という理不尽な体験が「神格化」につながった日本独特の歴史です。',
    },
    {
      id: 'p_h5', birthYear: 1118, deathYear: 1181,
      name: '平清盛', title: '平氏政権の確立者・初の武家太政大臣', icon: '⚓',
      category: '政治・軍事', wikipediaTitle: '平清盛',
      description: '武士として初めて太政大臣（最高位）に就き、日宋貿易を推進して経済的にも国際的にも大きな影響を与えた。「平家にあらずんば人にあらず」と言わしめた権力の頂点に立った。',
      connectionToNow: '清盛が開いた日宋貿易は中国との経済関係の先駆けです。また「武士が公家を超える」という清盛の台頭は、以後700年続く武家政権時代の幕開けでした。大河ドラマで何度も描かれる人気の歴史的人物。',
    },
  ],

  kamakura: [
    {
      id: 'p_ka1', birthYear: 1147, deathYear: 1199,
      name: '源頼朝', title: '鎌倉幕府初代将軍', icon: '⚔️',
      category: '政治・軍事', wikipediaTitle: '源頼朝',
      description: '平治の乱で父を失い伊豆に流された後、挙兵して平家を倒し1192年に征夷大将軍となる。京都から離れた鎌倉に幕府を置き、武家政権という新しい統治モデルを確立した。',
      connectionToNow: '頼朝が作った「幕府（将軍を中心とした武家政権）」というシステムは明治維新まで約700年続きます。「失敗からの再起」という頼朝の人生は現代のビジネス書でも語られる「復活のモデル」です。',
    },
    {
      id: 'p_ka2', birthYear: 1157, deathYear: 1225,
      name: '北条政子', title: '「尼将軍」・鎌倉幕府の実権者', icon: '👩',
      category: '政治', wikipediaTitle: '北条政子',
      description: '源頼朝の妻。頼朝死後、息子たちを将軍に立てながら幕府の実権を握った「尼将軍」。承久の乱では武士団の結束を呼びかける演説で幕府軍を鼓舞し勝利に導いた。',
      connectionToNow: '政子は日本史上最も権力を持った女性の一人として評価されています。「夫の影から出て自ら政治を動かした女性」として、現代のジェンダー論・女性リーダーシップの文脈でも再評価されています。',
    },
    {
      id: 'p_ka3', birthYear: 1159, deathYear: 1189,
      name: '源義経', title: '天才軍師・悲劇の英雄', icon: '🏇',
      category: '軍事・悲劇', wikipediaTitle: '源義経',
      description: '兄・頼朝の命を受けて平家を一ノ谷・屋島・壇ノ浦で撃破した天才的武将。しかし功績を恐れた頼朝に追われ、奥州平泉で31歳の短い生涯を終えた。',
      connectionToNow: '義経は「判官びいき（追われる者・弱者への共感）」という日本人の感情の象徴です。この心理傾向は現代のスポーツ観戦・応援文化にも深く影響しており、「挑戦者を応援する」という日本的価値観の根源です。',
    },
    {
      id: 'p_ka4', birthYear: 1222, deathYear: 1282,
      name: '日蓮', title: '日蓮宗の開祖・法華経の伝道者', icon: '🌶️',
      category: '宗教', wikipediaTitle: '日蓮',
      description: '法華経のみが正しいと主張し「南無妙法蓮華経」を広めた。元寇を予言するなど政治にも積極的に介入し、幕府に危険視されて流罪に処された激烈な僧侶。',
      connectionToNow: '日蓮宗は現代でも数百万人の信者を持ち、創価学会・立正佼成会など現代の宗教団体にも影響を与えています。「信念のために権力に立ち向かう」という日蓮の姿勢は現代の社会運動家にも共鳴されています。',
    },
  ],

  muromachi: [
    {
      id: 'p_m1', birthYear: 1358, deathYear: 1408,
      name: '足利義満', title: '室町幕府3代将軍・金閣建立者', icon: '🥇',
      category: '政治・文化', wikipediaTitle: '足利義満',
      description: '南北朝を統一し将軍権力の絶頂を実現。北山に金閣寺を建立し「北山文化」を花開かせ、明（中国）との勘合貿易で巨富を得た。「日本国王」を自称した異色の将軍。',
      connectionToNow: '義満が建立した金閣寺は現在年間500万人以上が訪れる日本最大級の観光地です。また勘合貿易を通じた日中経済交流は現代の貿易関係の先駆けとも言えます。',
    },
    {
      id: 'p_m2', birthYear: 1363, deathYear: 1443,
      name: '世阿弥', title: '能楽の大成者・「花伝書」著者', icon: '🎭',
      category: '芸術・文化', wikipediaTitle: '世阿弥',
      description: '父・観阿弥と共に猿楽を芸術的な「能」へと高めた人物。「花伝書（風姿花伝）」で芸の本質「花」を論じ、芸術論・演技論として現代でも読み継がれる。',
      connectionToNow: '世阿弥の「花」の概念——瞬間的な輝きと意外性——は現代の舞台芸術・パフォーマンス論に通じます。また「初心忘るべからず」という言葉は彼の著作から生まれた格言で、現代のビジネス・スポーツで広く使われています。',
    },
    {
      id: 'p_m3', birthYear: 1394, deathYear: 1481,
      name: '一休宗純（一休さん）', title: '臨済宗の禅僧・奇僧', icon: '☯️',
      category: '宗教・文化', wikipediaTitle: '一休宗純',
      description: '天皇の落胤とも言われる臨済宗の禅僧。既成の権威に囚われない奇行で知られ、「このはしわたるべからず（真ん中を歩けばいい）」などの頓知話で民衆に親しまれた。',
      connectionToNow: 'アニメ「一休さん」として現代の子供たちにも親しまれている一休。「固定観念を壊して本質を見る」という禅の思想は現代のデザイン思考・イノベーション論にも通じる発想法です。',
    },
    {
      id: 'p_m4', birthYear: 1420, deathYear: 1506,
      name: '雪舟', title: '水墨画の巨匠・日本画の基礎を作った画家', icon: '🖌️',
      category: '芸術', wikipediaTitle: '雪舟',
      description: '足利将軍家に仕え、明（中国）に渡って本場の水墨画を学んだ画僧。帰国後に「秋冬山水図」など日本独自の水墨画様式を確立した日本美術史上最大の画家の一人。',
      connectionToNow: '雪舟の水墨画は現在も国宝・重要文化財に指定されています。「余白の美」「線の力」という日本的美意識の形成に貢献し、現代のグラフィックデザイン・イラストにも影響を与えています。',
    },
  ],

  azuchi: [
    {
      id: 'p_az1', birthYear: 1534, deathYear: 1582,
      name: '織田信長', title: '天下統一を目指した革命的武将', icon: '🔥',
      category: '政治・軍事', wikipediaTitle: '織田信長',
      description: '楽市楽座（自由市場）・鉄砲の戦略的活用・既成権威の否定など革命的な政策を推進した戦国最大の革新者。「是非に及ばず」と言って本能寺の変で死去した。',
      connectionToNow: '楽市楽座（規制緩和・自由競争）の発想は現代の市場経済・競争政策に通じます。信長の「革新で既存勢力を打ち破る」という姿勢はスタートアップ・イノベーターの精神的先祖として現代でも語られます。',
    },
    {
      id: 'p_az2', birthYear: 1537, deathYear: 1598,
      name: '豊臣秀吉', title: '農民から天下人へ・天下統一完成', icon: '🎩',
      category: '政治・軍事', wikipediaTitle: '豊臣秀吉',
      description: '農民の子から信長に仕え、本能寺の変後に主導権を握って天下統一を完成させた。太閤検地・刀狩りで社会制度を変え、朝鮮出兵（文禄・慶長の役）も断行した。',
      connectionToNow: '「百姓から天下人へ」という秀吉の出世は、身分・出自ではなく能力・努力で成功できるというメッセージです。現代の「成り上がり」「努力型成功物語」の日本最大の原点として今も語り継がれています。',
    },
    {
      id: 'p_az3', birthYear: 1543, deathYear: 1616,
      name: '徳川家康', title: '江戸幕府初代将軍・天下人', icon: '🐢',
      category: '政治・軍事', wikipediaTitle: '徳川家康',
      description: '「鳴かぬなら鳴くまで待とうホトトギス」で知られる忍耐の人。関ヶ原の勝利後に江戸幕府を開き260年の平和の礎を築いた。75歳まで生きた当時としては異例の長命。',
      connectionToNow: '家康の「待つ・耐える・長期戦略」は現代の長期経営・持久戦略の教科書として経営書でも頻繁に引用されます。また家康が確立した江戸の都市設計は現在の東京の原型です。',
    },
    {
      id: 'p_az4', birthYear: 1522, deathYear: 1591,
      name: '千利休', title: '茶の湯の大成者・わび茶の創始者', icon: '🍵',
      category: '文化・芸術', wikipediaTitle: '千利休',
      description: '信長・秀吉に茶頭として仕えながら「わび茶」の美学を完成させた。「一期一会（その出会いは二度と来ない）」の精神を茶道に込め、70歳で秀吉に切腹を命じられた。',
      connectionToNow: '千利休の「わび・さび」の美意識は現代の日本デザイン・ミニマリズムの源泉です。「無駄を削ぎ落とした中に美を見出す」という思想はAppleのプロダクトデザインや北欧家具にも影響を与えています。',
    },
    {
      id: 'p_az5', birthYear: 1528, deathYear: 1582,
      name: '明智光秀', title: '本能寺の変の主犯・謎多き武将', icon: '🌙',
      category: '政治・軍事', wikipediaTitle: '明智光秀',
      description: '信長に重用されながら突然謀反を起こした本能寺の変（1582年）の主犯。「三日天下」に終わり山崎の戦いで敗死。なぜ謀反を起こしたか——動機は今も歴史最大の謎の一つ。',
      connectionToNow: '光秀の謀反の動機（怨恨説・野望説・黒幕説等）は現代でも研究が続く歴史の謎です。2020年の大河ドラマ「麒麟がくる」で主人公となり、「忠臣か謀反人か」という問いが現代的な組織論・倫理論として再解釈されました。',
    },
  ],

  edo: [
    {
      id: 'p_e1', birthYear: 1644, deathYear: 1694,
      name: '松尾芭蕉', title: '俳聖・「奥の細道」の旅人', icon: '🍃',
      category: '文学・芸術', wikipediaTitle: '松尾芭蕉',
      description: '「古池や蛙飛びこむ水の音」など俳句を芸術の域に高めた俳聖。晩年には「奥の細道」として東北・北陸を2400kmにわたって旅し、旅と詩の記録を残した。',
      connectionToNow: '「奥の細道」の旅のルートは現代の観光地として多くの人が訪れています。芭蕉の「5・7・5の俳句」という形式は現代のSNS文化（短文・瞬間の切り取り）と親和性があり、英語圏でも「HAIKU」として世界中に広まっています。',
    },
    {
      id: 'p_e2', birthYear: 1760, deathYear: 1849,
      name: '葛飾北斎', title: '浮世絵師・「富嶽三十六景」作者', icon: '🌊',
      category: '芸術', wikipediaTitle: '葛飾北斎',
      description: '「神奈川沖浪裏」（波の絵）など「富嶽三十六景」で世界的に知られる浮世絵師。90歳まで創作を続け「画狂老人」と称した。引越しを93回した奇人でもある。',
      connectionToNow: '北斎の「波」はモネ・ゴッホ・クリムトら印象派に多大な影響（ジャポニスム）を与えました。その逆輸入として現代の日本美術が世界で評価される流れの原点です。また「生涯現役・挑戦し続ける」という姿勢はアクティブエイジングの象徴です。',
    },
    {
      id: 'p_e3', birthYear: 1733, deathYear: 1817,
      name: '杉田玄白', title: '「解体新書」翻訳者・蘭学の父', icon: '🔬',
      category: '科学・医学', wikipediaTitle: '杉田玄白',
      description: 'オランダ語の解剖書「ターヘル・アナトミア」を翻訳し「解体新書」（1774年）として出版。実際に腑分け（解剖）を行いながら翻訳した科学的実証精神の先駆者。',
      connectionToNow: '解体新書の翻訳は西洋医学の日本への本格導入のスタートです。現代日本が世界屈指の長寿社会・医療水準を誇る基盤はここから始まりました。また「外国語の壁を乗り越えて知識を輸入する」という姿勢は現代の翻訳・通訳文化にも通じます。',
    },
    {
      id: 'p_e4', birthYear: 1836, deathYear: 1867,
      name: '坂本龍馬', title: '明治維新の先駆者・薩長同盟の立役者', icon: '🌟',
      category: '政治・思想', wikipediaTitle: '坂本龍馬',
      description: '土佐藩脱藩後、薩長同盟を仲介して明治維新の流れを決定づけた。「船中八策」で議会制民主主義を構想し、日本最初の商社「亀山社中」を設立した先進的人物。31歳で暗殺された。',
      connectionToNow: '龍馬は現代日本で最も人気のある歴史上の人物の一人で、大河ドラマ・小説・映画で繰り返し描かれます。「既存の枠にとらわれない革新的発想」と「橋渡し役としての調整力」は現代の起業家・イノベーターに共鳴される資質です。',
    },
  ],

  meiji: [
    {
      id: 'p_me1', birthYear: 1841, deathYear: 1909,
      name: '伊藤博文', title: '初代内閣総理大臣・明治憲法の父', icon: '⚙️',
      category: '政治', wikipediaTitle: '伊藤博文',
      description: '大日本帝国憲法の起草を主導し、初代内閣総理大臣に就任。「近代日本の設計者」として教育・法律・政治制度を体系的に整備した。1909年、安重根に暗殺された。',
      connectionToNow: '伊藤が設計した明治の法制度・官僚制度は現代日本の行政システムの直接の起源です。また彼の暗殺をめぐる歴史認識は現在も日韓関係の難問の一つとして残っています。',
    },
    {
      id: 'p_me2', birthYear: 1835, deathYear: 1901,
      name: '福沢諭吉', title: '慶応義塾創設者・「学問のすすめ」著者', icon: '📚',
      category: '教育・思想', wikipediaTitle: '福沢諭吉',
      description: '「天は人の上に人を造らず、人の下に人を造らず」という言葉で知られる啓蒙思想家。慶応義塾（現・慶應大学）を創設し、西洋の自由・平等思想を日本に広めた。',
      connectionToNow: '福沢の「実学重視」「独立自尊」の精神は現代の日本教育の理念に生きています。慶応義塾は現在も日本トップの大学の一つです。また長年1万円札の顔として「経済・教育の重要性」を象徴してきました。',
    },
    {
      id: 'p_me3', birthYear: 1867, deathYear: 1916,
      name: '夏目漱石', title: '「坊っちゃん」「吾輩は猫である」著者', icon: '📗',
      category: '文学', wikipediaTitle: '夏目漱石',
      description: '「坊っちゃん」「吾輩は猫である」「こころ」など近代日本文学の礎を作った国民的作家。英国留学で神経症に苦しみながらも西洋と日本の間で独自の文学世界を構築した。',
      connectionToNow: '漱石は現代でも最も読まれる明治の作家の一人です。「近代化の孤独・人間の利己心」というテーマは現代の格差・孤立社会にも共鳴します。また1000円札の顔として長年親しまれました。',
    },
    {
      id: 'p_me4', birthYear: 1872, deathYear: 1896,
      name: '樋口一葉', title: '「たけくらべ」著者・日本初の職業的女性作家', icon: '🌸',
      category: '文学', wikipediaTitle: '樋口一葉',
      description: '貧しい生活の中で独学で古典を習得し、「たけくらべ」「にごりえ」など下層社会を描いた傑作を24歳の短命の中に残した。日本初の職業的女性作家とされる。',
      connectionToNow: '樋口一葉は現在5000円札の顔として現代日本に存在しています。「女性が経済的自立のために書く」という彼女の姿は、現代のワーキングウーマン・クリエイターの先駆けとして再評価されています。',
    },
  ],

  taisho: [
    {
      id: 'p_ta1', birthYear: 1892, deathYear: 1927,
      name: '芥川龍之介', title: '「羅生門」「藪の中」著者・近代短編文学の旗手', icon: '🕯️',
      category: '文学', wikipediaTitle: '芥川龍之介',
      description: '「羅生門」「藪の中」「蜘蛛の糸」など人間の利己と悪を鋭く描いた短編作家。「人生は一箱のマッチに似ている」などの言葉でも知られ、35歳で自ら命を絶った。',
      connectionToNow: '芥川賞（日本最高峰の文学賞）は彼の名を冠し、現在も年2回発表されます。「真実はひとつではない」という「藪の中」の相対主義的視点は現代の情報社会・フェイクニュース問題を先取りした思想として再評価されています。',
    },
    {
      id: 'p_ta2', birthYear: 1896, deathYear: 1933,
      name: '宮沢賢治', title: '「銀河鉄道の夜」著者・詩人・農業指導者', icon: '🌌',
      category: '文学・農業', wikipediaTitle: '宮沢賢治',
      description: '「銀河鉄道の夜」「注文の多い料理店」「雨ニモマケズ」など独自の世界観を持つ詩人・童話作家。農業技師として貧しい農民の生活改善にも尽力し37歳で夭折した。',
      connectionToNow: '宮沢賢治の作品は現代でも映画・アニメ・音楽に翻案され続けています。「農業と芸術を両立させた」という生き方は、現代の「農業×クリエイティブ」「地方創生×アート」の先駆けとも言えます。',
    },
    {
      id: 'p_ta3', birthYear: 1878, deathYear: 1942,
      name: '与謝野晶子', title: '「みだれ髪」著者・反戦の歌人', icon: '✍️',
      category: '文学・社会', wikipediaTitle: '与謝野晶子',
      description: '「柔肌の熱き血潮に触れも見で寂しからずや道を説く君」で知られる情熱的な歌人。日露戦争中に「君死にたまふことなかれ」と反戦を訴え、社会的バッシングを受けながら主張を曲げなかった。',
      connectionToNow: '与謝野晶子の「表現の自由と反戦」の姿勢は現代のSNSでの政治的発言・表現者の社会責任という問題に直結します。また源氏物語の現代語訳など古典普及にも貢献しました。',
    },
  ],

  showa: [
    {
      id: 'p_sh1', birthYear: 1928, deathYear: 1989,
      name: '手塚治虫', title: '「マンガの神様」・アニメ・マンガの基礎を作った', icon: '🖊️',
      category: '芸術・文化', wikipediaTitle: '手塚治虫',
      description: '「鉄腕アトム」「ブラック・ジャック」「火の鳥」など日本のマンガを「映画的表現」のある芸術に昇華させた。のべ15万ページを超える作品を生み出したマンガ界の革命家。',
      connectionToNow: '手塚治虫が作った「ストーリーマンガ」の文法は現代の日本マンガ・アニメの基礎であり、世界中のクリエイターに影響を与えています。「鉄腕アトム」はAI・ロボット工学の夢として現代にも生き続けています。',
    },
    {
      id: 'p_sh2', birthYear: 1907, deathYear: 1981,
      name: '湯川秀樹', title: '日本初のノーベル賞受賞者・素粒子物理学者', icon: '⚛️',
      category: '科学', wikipediaTitle: '湯川秀樹',
      description: '1935年に中間子理論を発表し、1949年に日本初のノーベル物理学賞を受賞。敗戦後の日本人に大きな希望と誇りを与えた。晩年は核廃絶運動にも尽力した。',
      connectionToNow: '湯川の受賞は戦後日本の科学立国への道を切り開きました。現在まで日本人ノーベル賞受賞者は28人（2024年現在）に上り、この系譜は今も続いています。「平和のための科学」という彼の信念は現代にも引き継がれています。',
    },
    {
      id: 'p_sh3', birthYear: 1910, deathYear: 1998,
      name: '黒澤明', title: '「羅生門」「七人の侍」監督・映画の神様', icon: '🎬',
      category: '芸術・映画', wikipediaTitle: '黒澤明',
      description: '「羅生門」でヴェネチア映画祭グランプリを受賞し日本映画を世界に知らしめた映画監督。「七人の侍」「生きる」など85歳まで30本の作品を残した。スピルバーグ・コッポラにも多大な影響を与えた。',
      connectionToNow: '「七人の侍」はハリウッドで「荒野の七人」としてリメイクされ、その構造は現代のアベンジャーズ的チームムービーの原型です。黒澤の映像文法はスターウォーズ・マトリックスなど現代の多くの映画に受け継がれています。',
    },
    {
      id: 'p_sh4', birthYear: 1894, deathYear: 1989,
      name: '松下幸之助', title: 'パナソニック創業者・「経営の神様」', icon: '💡',
      category: '経済・産業', wikipediaTitle: '松下幸之助',
      description: '小学校中退から大阪で独立し、パナソニック（旧・松下電器産業）を世界的企業に育てた「経営の神様」。PHP研究所設立など精神文化への貢献も大きい。',
      connectionToNow: 'パナソニックは現在も世界的家電メーカーとして存続しています。松下の「社員は家族」という経営哲学は日本型雇用（終身雇用・年功序列）の精神的支柱でした。その変容は現代の日本企業の転換期と重なります。',
    },
  ],

  heisei: [
    {
      id: 'p_he1', birthYear: 1970, deathYear: null,
      name: '羽生善治', title: '将棋棋士・史上初の永世七冠', icon: '♟️',
      category: 'スポーツ・文化', wikipediaTitle: '羽生善治',
      description: '将棋の全7タイトルを制覇した「永世七冠」唯一の棋士。AIが台頭する中でも第一線で活躍し続け、「直感×論理」の融合を体現した天才。著書は経営書としても読まれる。',
      connectionToNow: '羽生が直面したAIとの対決（将棋AIの進化）は、現代のAI×人間の協働という問題の縮図です。「AIに勝てない人間の価値とは何か」という問いに正面から向き合い続けた姿は現代社会への問いかけです。',
    },
    {
      id: 'p_he2', birthYear: 1973, deathYear: null,
      name: 'イチロー（鈴木一朗）', title: 'MLB通算3089安打・世界的野球選手', icon: '⚾',
      category: 'スポーツ', wikipediaTitle: 'イチロー',
      description: 'オリックスで7年連続首位打者後、MLBシアトル・マリナーズに移籍。10年連続200安打・シーズン最多安打記録（262本）など前人未到の記録を樹立した「野球の哲学者」。',
      connectionToNow: 'イチローの「小さな努力の積み重ね」「毎日を大切にする哲学」は現代の自己啓発・スポーツ哲学に多大な影響を与えています。「日本人でも世界トップで活躍できる」という証明は後続の大谷翔平らへの道を開きました。',
    },
    {
      id: 'p_he3', birthYear: 1949, deathYear: null,
      name: '村上春樹', title: '「ノルウェイの森」著者・世界的作家', icon: '📕',
      category: '文学', wikipediaTitle: '村上春樹',
      description: '「ノルウェイの森」「海辺のカフカ」「1Q84」など世界50カ国以上で翻訳・読まれる国際的作家。毎年ノーベル文学賞候補として話題になり、独自のスタイルで世界文学の一角を占める。',
      connectionToNow: '村上作品の翻訳出版は日本文学の世界的普及の最大の牽引力です。「グローバルに読まれる日本語文学」という存在として、現代の日本のソフトパワー・文化外交において重要な役割を担っています。',
    },
  ],

  reiwa: [
    {
      id: 'p_r1', birthYear: 1994, deathYear: null,
      name: '大谷翔平', title: 'MLB・投打「二刀流」の世界的プレイヤー', icon: '⚾',
      category: 'スポーツ', wikipediaTitle: '大谷翔平',
      description: 'ロサンゼルス・ドジャースに所属するMLB選手。「投手」と「打者」を同時にこなす「二刀流」でMLBの常識を覆し、MVP・ホームラン王など数々の記録を更新し続けている。',
      connectionToNow: '大谷は現在地球上で最も有名なアスリートの一人です。「不可能と言われたことに挑戦する」という姿勢は日本・世界中の若者に夢と勇気を与えています。また日本発のスポーツ選手が世界のトップに立つという事実は日本の「ソフトパワー」そのものです。',
    },
    {
      id: 'p_r2', birthYear: 2002, deathYear: null,
      name: '藤井聡太', title: '将棋・史上最年少で全8冠達成', icon: '♟️',
      category: '文化・スポーツ', wikipediaTitle: '藤井聡太',
      description: '14歳でデビューし、史上最多の公式戦連勝記録（29連勝）を樹立。21歳という史上最年少で将棋全8冠を制覇した天才棋士。AIを活用した独自の研究スタイルでも知られる。',
      connectionToNow: '藤井聡太はAIを「敵」ではなく「学習ツール」として活用することで頂点に立ちました。「AIとの共存・協働」という現代の最重要テーマを、将棋という伝統文化の中で体現したロールモデルです。',
    },
  ],
};

// ===== イベントデータ =====
const EVENTS = {
  jomon: [
    {
      id: 'j1', year: -14000, icon: '🏺',
      title: '縄文時代の始まり・世界最古級の土器誕生',
      description: '旧石器時代の終わりとともに縄文時代が始まる。日本列島で世界最古級の土器が作られ、縄文人は定住型の狩猟採集生活を営み始めた。',
      category: '文明の始まり', wikipediaTitle: '縄文時代',
      connectionToNow: '縄文土器は世界最古級（約1万6000年前）の土器の一つです。「ものを作る・工夫する」という精神は現代の日本の「ものづくり」文化の原点とも言えます。縄文人のDNAは現代日本人の約20〜30%に受け継がれています。',
    },
    {
      id: 'j2', year: -5000, icon: '🏠',
      title: '三内丸山遺跡：大規模集落の形成',
      description: '青森県に約1500年間継続した大規模な縄文集落が存在。六本柱の大型建物、広域交易ネットワーク、食料の備蓄体制を持つ高度な社会組織が確認されている。',
      category: '社会・集落', wikipediaTitle: '三内丸山遺跡',
      connectionToNow: '三内丸山遺跡は「縄文人は未開ではなかった」ことを証明しました。現代の考古学・縄文ブームのきっかけとなり、日本人のルーツを見直す文化的契機となっています。',
    },
    {
      id: 'j3', year: -1000, icon: '🌾',
      title: '晩期縄文：農耕の萌芽と気候変動',
      description: '縄文晩期、大陸から農耕文化の一部が伝わり始め、栗・ヒョウタンなどの栽培が見られる。気候変動による寒冷化が文明の変化を促した。',
      category: '社会変化', wikipediaTitle: '縄文農耕',
      connectionToNow: '気候変動が文明を動かすというパターンは現代にも通じます。縄文時代から人類は気候変動への適応を繰り返してきた——現代の温暖化問題を歴史的に位置づける視座を与えてくれます。',
    },
  ],
  yayoi: [
    { id: 'y1', year: -300, icon: '🌾', title: '稲作の本格的な伝来', description: '大陸（朝鮮半島経由）から水稲農耕が伝わり九州から急速に広まった。金属器も同時期に伝来し、農耕定住社会への移行が始まった。', category: '農耕・技術', wikipediaTitle: '弥生時代', connectionToNow: '稲作の伝来は日本の食文化・農村社会・「米」に根ざした文化の原点です。「瑞穂の国」という自称も、稲作がいかに日本のアイデンティティに深く刻まれているかを示します。' },
    { id: 'y2', year: -100, icon: '👑', title: '邪馬台国の台頭・卑弥呼が女王に', description: '弥生時代後期、倭国大乱の後、卑弥呼が女王として擁立され邪馬台国を中心に30余国を統合した。', category: '国家形成', wikipediaTitle: '卑弥呼', connectionToNow: '卑弥呼と邪馬台国の謎（所在地論争）は現在も解明されておらず、日本最大の歴史の謎として考古学・歴史学を発展させています。' },
    { id: 'y3', year: 239, icon: '📜', title: '卑弥呼が魏に使者を送る', description: '邪馬台国の女王・卑弥呼が中国の魏に使者を送り、「親魏倭王」の称号と金印・銅鏡100枚を賜った。', category: '外交', wikipediaTitle: '邪馬台国', connectionToNow: '日中の外交関係は約1800年前に遡ります。強大な隣国との外交という構図は、現代の日中関係・東アジアの国際秩序を考える上でも示唆的です。' },
  ],
  kofun: [
    { id: 'k1', year: 250, icon: '⛰️', title: '前方後円墳の建設始まる', description: '巨大な前方後円墳が西日本から全国に広まる。大仙陵古墳は全長486mと世界最大級の墓。ヤマト政権の権威を象徴した。', category: '建築・権力', wikipediaTitle: '前方後円墳', connectionToNow: '2019年、百舌鳥・古市古墳群がユネスコ世界遺産に登録されました。当時の巨大土木工事は現代の土木工学者も驚く規模で、高度な統治組織の証です。' },
    { id: 'k2', year: 391, icon: '⚔️', title: '好太王碑：倭が朝鮮半島に出兵', description: '高句麗の広開土王碑に、倭（日本）が朝鮮半島に出兵したことが記録。ヤマト政権が半島と深く関わっていた証拠として重要。', category: '外交・戦争', wikipediaTitle: '広開土王碑', connectionToNow: '日本・朝鮮半島・中国の三角関係は1600年以上の歴史を持ちます。現代の日韓関係・東アジアの歴史認識問題のルーツはこの時代に遡ります。' },
    { id: 'k3', year: 538, icon: '🙏', title: '仏教が日本に伝来', description: '百済（朝鮮半島）から仏像・経典が日本に伝えられた。仏教は国家統治の道具として積極的に受け入れられ、以後の日本文化の根幹となった。', category: '宗教・文化', wikipediaTitle: '日本への仏教伝来', connectionToNow: '仏教の伝来は日本の建築・美術・思想・言語を根底から変えました。「もったいない」「縁起」「悟り」など現代日本語に残る仏教用語は数百に上ります。' },
  ],
  asuka: [
    { id: 'a1', year: 593, icon: '👑', title: '聖徳太子が摂政になる', description: '推古天皇の摂政として聖徳太子が政治の中心に立つ。仏教の振興、遣隋使の派遣など積極的な改革を行った。', category: '政治', wikipediaTitle: '聖徳太子', connectionToNow: '「和をもって貴しとなす」というメッセージは1400年後の現在も日本社会に生きています。' },
    { id: 'a2', year: 604, icon: '📜', title: '十七条憲法の制定', description: '聖徳太子が日本初の成文法規「十七条憲法」を制定。「和を以て貴しとなす」など道徳的・政治的規範を示した。', category: '法律・政治', wikipediaTitle: '十七条憲法', connectionToNow: '「和をもって貴しとなす」は現代日本のビジネス・政治スタイルの精神的原点です。' },
    { id: 'a3', year: 645, icon: '⚡', title: '大化の改新', description: '中臣鎌足と中大兄皇子が蘇我氏を倒し、中央集権的な律令国家への改革を開始。「大化」は日本初の元号となった。', category: '政治・改革', wikipediaTitle: '大化の改新', connectionToNow: '「元号」制度はこの時代に始まり、令和の現代まで続く日本固有の時間認識システムです。' },
    { id: 'a4', year: 701, icon: '⚖️', title: '大宝律令の制定', description: '日本初の体系的な法律体系「大宝律令」が完成。中国の律令制を参考に、官僚制度・土地制度・刑法を整備した。', category: '法律・統治', wikipediaTitle: '大宝律令', connectionToNow: '大宝律令は現代の日本法体系の遠い祖先です。「法に基づく統治」という原則は1300年以上受け継がれています。' },
  ],
  nara: [
    { id: 'n1', year: 710, icon: '🏛️', title: '平城京遷都', description: '奈良に平城京が建設され、唐の長安を模した碁盤目状の都市計画で整備された。', category: '都市・政治', wikipediaTitle: '平城京', connectionToNow: '平城京の条坊制は現在の京都・大阪の都市構造にも影響を与えています。平城宮跡は世界遺産として保存され、現代の奈良観光の中核です。' },
    { id: 'n2', year: 712, icon: '📚', title: '古事記の完成', description: '太安万侶が編纂した日本最古の歴史書。天地創造・神々の物語・天皇家の系譜が記された。', category: '文学・歴史', wikipediaTitle: '古事記', connectionToNow: '古事記の神話はアニメ・漫画・ゲームのキャラクター造形に影響し続けています。「日本人のルーツ」を問う文化的基盤として今も機能しています。' },
    { id: 'n3', year: 752, icon: '🏛️', title: '東大寺大仏の開眼供養', description: '聖武天皇が国家の安寧を祈って建立した東大寺の大仏が完成。国際的な開眼式が行われた。', category: '宗教・文化', wikipediaTitle: '東大寺', connectionToNow: '東大寺大仏は現代でも年間100万人以上が訪れます。「国家プロジェクトで文化を守る」という発想は現代のユネスコ文化遺産保護にも通じます。' },
    { id: 'n4', year: 759, icon: '📖', title: '万葉集の編纂', description: '天皇から庶民まで4500首以上の和歌を収めた日本最古の歌集。後に「令和」の出典となった。', category: '文学・文化', wikipediaTitle: '万葉集', connectionToNow: '2019年に始まった「令和」という元号は万葉集の梅の歌から採られています。1260年前の文学が現代の元号の出典となるほど、万葉集は日本文化の根本に息づく古典です。' },
  ],
  heian: [
    { id: 'h1', year: 794, icon: '🏯', title: '平安京遷都', description: '桓武天皇が現在の京都に平安京を建設。以後、明治維新まで約1000年にわたって京都が日本の首都となった。', category: '政治・都市', wikipediaTitle: '平安京', connectionToNow: '現在の京都市は平安京を起源とし、碁盤目状の道路構造が今も残ります。京都は日本の伝統文化・観光の中心として、平安時代の遺産を1200年後も体現しています。' },
    { id: 'h2', year: 905, icon: '📜', title: '古今和歌集の完成', description: '紀貫之らが勅命で編纂した日本初の勅撰和歌集。仮名文字（ひらがな）で書かれた序文は和歌の理念を示した。', category: '文学・文化', wikipediaTitle: '古今和歌集', connectionToNow: '仮名文字の定着で生まれた独自の文学スタイルは、現代のJ文学・マンガ・ライトノベルのナラティブにも影響を与えています。' },
    { id: 'h3', year: 1000, icon: '📖', title: '紫式部「源氏物語」の執筆', description: '女房・紫式部が世界最古の長編小説と言われる「源氏物語」を著した。54帖・約百万字の大作。', category: '文学・文化', wikipediaTitle: '源氏物語', connectionToNow: '源氏物語は1000年を経た現在も世界中で読まれ、映画・マンガ・アニメに翻案され続けています。2024年の大河ドラマ「光る君へ」でも注目を集めました。' },
    { id: 'h4', year: 1086, icon: '👑', title: '白河法皇の院政開始', description: '天皇を退位した白河上皇が院政を開始。権力が天皇から上皇に移り、藤原氏の摂関政治が衰退した。', category: '政治', wikipediaTitle: '院政', connectionToNow: '現代でも「院政」という言葉は引退した実力者が権力を保持する構造を指す言葉として使われています。' },
    { id: 'h5', year: 1185, icon: '⚔️', title: '壇ノ浦の戦い：平家滅亡', description: '源義経率いる源氏軍が壇ノ浦で平家軍を破り、平家が滅亡。武家政権の時代が幕を開けた。', category: '戦争・政変', wikipediaTitle: '壇ノ浦の戦い', connectionToNow: '壇ノ浦は「盛者必衰」の象徴として日本人の無常観・侘び寂びの精神に深く刻まれています。' },
  ],
  kamakura: [
    { id: 'ka1', year: 1192, icon: '⚔️', title: '源頼朝が征夷大将軍に・鎌倉幕府成立', description: '源頼朝が朝廷から征夷大将軍に任じられ、鎌倉幕府が正式に成立。武士による初めての本格的な政権が誕生した。', category: '政治', wikipediaTitle: '源頼朝', connectionToNow: '「将軍」という称号と幕府という武家政権の形はここから明治維新まで約700年続きます。' },
    { id: 'ka2', year: 1221, icon: '🏯', title: '承久の乱：武士が朝廷に勝利', description: '後鳥羽上皇が幕府打倒のために兵を挙げたが敗北。天皇・上皇が流罪となり、武家政権の優位が確立した。', category: '政治・戦争', wikipediaTitle: '承久の乱', connectionToNow: '天皇・公家より武家が実権を握るという逆転は日本の権力構造を根本から変えました。' },
    { id: 'ka3', year: 1274, icon: '⛵', title: '文永の役：元軍の来襲', description: '元のフビライ・ハンが大軍を送り九州北部に上陸。暴風雨（神風）で元軍が撤退した。', category: '外交・戦争', wikipediaTitle: '文永の役', connectionToNow: '元寇の「神風」が「神国思想」を強め、第二次大戦の「神風特攻隊」の名の由来となりました。' },
    { id: 'ka4', year: 1333, icon: '🔥', title: '鎌倉幕府の滅亡', description: '後醍醐天皇の討幕運動と足利尊氏の離反により鎌倉幕府が滅亡。御家人の経済的困窮が積み重なった「内部崩壊」だった。', category: '政治・変革', wikipediaTitle: '鎌倉幕府', connectionToNow: '「内部崩壊によるレジームチェンジ」は現代の企業・政権崩壊にも通じる普遍的パターンです。' },
  ],
  muromachi: [
    { id: 'm1', year: 1338, icon: '🏯', title: '足利尊氏が征夷大将軍に・室町幕府開府', description: '後醍醐天皇の建武の新政が失敗し、足利尊氏が京都（室町）に幕府を開いた。南北朝の対立が約60年続いた。', category: '政治', wikipediaTitle: '足利尊氏', connectionToNow: '「正統性」と「実力」の相克という政治的テーマは時代を超えた普遍的課題です。' },
    { id: 'm2', year: 1397, icon: '🥇', title: '金閣寺建立（北山文化）', description: '3代将軍・足利義満が京都・北山に金閣を建立。北山文化（禅・能・水墨画）が花開いた。', category: '文化・建築', wikipediaTitle: '金閣寺', connectionToNow: '金閣寺は現在年間500万人以上が訪れる日本最大級の観光地です。室町時代の「禅」「侘び茶」の美意識は現代のミニマリズムデザインにも影響しています。' },
    { id: 'm3', year: 1467, icon: '🔥', title: '応仁の乱：戦国時代の始まり', description: '足利将軍家の後継問題をめぐり応仁の乱が勃発。11年の争乱で京都は焼け野原となり、戦国時代が始まった。', category: '戦争・変革', wikipediaTitle: '応仁の乱', connectionToNow: '応仁の乱後の「下克上」の精神は、現代の実力主義文化の原点の一つです。' },
    { id: 'm4', year: 1543, icon: '🔫', title: '鉄砲の伝来（種子島）', description: 'ポルトガル人を乗せた中国船が種子島に漂着し、火縄銃が日本にもたらされた。わずか10年足らずで国産化に成功した。', category: '技術・外交', wikipediaTitle: '日本への鉄砲伝来', connectionToNow: '外来技術を短期間で国産化・改良する能力は「鉄砲伝来」時代から日本の強みです。' },
  ],
  azuchi: [
    { id: 'az1', year: 1575, icon: '🔫', title: '長篠の戦い：鉄砲3000挺の斉射', description: '織田信長が武田の騎馬軍団に対して鉄砲3000挺の三段撃ちで圧倒した戦い。鉄砲が戦術の主役となった。', category: '戦争・技術', wikipediaTitle: '長篠の戦い', connectionToNow: '「技術革新が戦術を変える」という法則は現代の戦争・ビジネスにも通じます。' },
    { id: 'az2', year: 1582, icon: '🔥', title: '本能寺の変：織田信長死す', description: '天下統一を目前にした織田信長が、重臣・明智光秀の謀反によって本能寺で死去した。', category: '政治・戦争', wikipediaTitle: '本能寺の変', connectionToNow: '信長が始めた楽市楽座（自由市場・規制緩和）の発想は現代の「規制緩和」「市場競争促進」に通じます。' },
    { id: 'az3', year: 1590, icon: '👑', title: '豊臣秀吉・天下統一完成', description: '農民出身の豊臣秀吉が全国統一を完成。刀狩り・検地で兵農分離を進め、身分制度の基盤を作った。', category: '政治・統一', wikipediaTitle: '豊臣秀吉', connectionToNow: '秀吉の刀狩りは日本の「銃のない社会」の起源の一つです。現代日本が世界最低レベルの銃犯罪率を誇る背景にこの原則があります。' },
    { id: 'az4', year: 1600, icon: '⚔️', title: '関ヶ原の戦い', description: '徳川家康（東軍）と石田三成（西軍）が激突。東軍が勝利し、徳川の天下が確定した。', category: '戦争・転換', wikipediaTitle: '関ヶ原の戦い', connectionToNow: '関ヶ原の戦後処理は現代日本の地理・文化にも影響しています。' },
  ],
  edo: [
    { id: 'e1', year: 1603, icon: '🏯', title: '徳川家康が征夷大将軍に・江戸幕府成立', description: '徳川家康が朝廷から征夷大将軍に任じられ、江戸に幕府を開いた。260年の平和時代が始まった。', category: '政治・統治', wikipediaTitle: '江戸幕府', connectionToNow: '260年の平和が育んだ高い識字率・出版文化・職人技術は現代日本の強みの源泉です。' },
    { id: 'e2', year: 1635, icon: '🚶', title: '参勤交代の制度化', description: '3代将軍・徳川家光が参勤交代を義務化。大名が1年おきに江戸と国元を往復する制度が整備された。', category: '政治・社会', wikipediaTitle: '参勤交代', connectionToNow: '参勤交代が整備した東海道などの街道は現在の国道・新幹線ルートの原型です。' },
    { id: 'e3', year: 1641, icon: '🔒', title: '鎖国体制の完成', description: '長崎の出島を唯一の対外貿易窓口とし、約200年にわたって日本独自の文化が発展した。', category: '外交・政策', wikipediaTitle: '鎖国', connectionToNow: '鎖国により独自に発展した文化は現代の「日本らしさ」「クールジャパン」の源泉です。' },
    { id: 'e4', year: 1703, icon: '⚔️', title: '赤穂浪士の討ち入り（忠臣蔵）', description: '主君の仇をとるため大石内蔵助率いる47人の浪士が討ち入り。「忠義」の象徴として語り継がれる。', category: '社会・文化', wikipediaTitle: '赤穂事件', connectionToNow: '忠臣蔵は現代でも映画・ドラマ・歌舞伎で繰り返し語られる日本最大の「物語」の一つです。' },
    { id: 'e5', year: 1774, icon: '📖', title: '杉田玄白「解体新書」の出版', description: 'オランダ語の解剖学書を翻訳した「解体新書」を刊行。実証的な西洋医学が日本に根付く契機となった。', category: '科学・医学', wikipediaTitle: '解体新書', connectionToNow: '現代日本が世界屈指の長寿社会・医療水準を誇る遠い起源の一つです。' },
    { id: 'e6', year: 1853, icon: '🚢', title: '黒船来航・ペリー提督が開国を迫る', description: 'アメリカのペリー提督が4隻の黒船を率いて浦賀に来航し日本に開国を迫った。', category: '外交・変革', wikipediaTitle: '黒船来航', connectionToNow: '「外圧による変革」は現代日本にも続くパターンです。' },
  ],
  meiji: [
    { id: 'me1', year: 1868, icon: '⚙️', title: '明治維新・新政府の樹立', description: '徳川幕府が崩壊し明治新政府が樹立。急速な西洋化・近代化が始まった。', category: '政治・変革', wikipediaTitle: '明治維新', connectionToNow: '明治維新は現代日本のほぼすべての制度の直接の起源です。' },
    { id: 'me2', year: 1872, icon: '🚂', title: '鉄道開業（新橋〜横浜）', description: '日本初の鉄道が新橋〜横浜間で開業。英国技術を導入して建設された近代化の象徴。', category: '技術・交通', wikipediaTitle: '新橋駅', connectionToNow: '明治の鉄道開業は現代の新幹線ネットワーク・鉄道大国日本の出発点です。' },
    { id: 'me3', year: 1889, icon: '📜', title: '大日本帝国憲法の発布', description: '伊藤博文らが中心となりアジア初の成文憲法が発布された。', category: '法律・政治', wikipediaTitle: '大日本帝国憲法', connectionToNow: '現在も続く「憲法改正」論議はこの明治の憲法制定の延長線上にある問題です。' },
    { id: 'me4', year: 1904, icon: '⚓', title: '日露戦争', description: '満州・朝鮮の覇権をめぐりロシアと開戦。日本海海戦でロシア艦隊を撃滅した。', category: '戦争・外交', wikipediaTitle: '日露戦争', connectionToNow: 'この勝利が過度な自信と軍国主義化の遠因ともなり、太平洋戦争につながる歴史の転換点でした。' },
  ],
  taisho: [
    { id: 'ta1', year: 1918, icon: '🌾', title: '米騒動・大正デモクラシーの高まり', description: '米価高騰に起因する全国的な米騒動が発生。民衆運動が政治を動かした。', category: '社会・政治', wikipediaTitle: '米騒動', connectionToNow: '「民衆の声が政治を動かす」という経験は現代のSNSを使った社会運動の原型です。' },
    { id: 'ta2', year: 1923, icon: '🌋', title: '関東大震災', description: 'マグニチュード7.9の大地震が関東地方を襲い、死者・行方不明者約10万5000人。東京・横浜が壊滅した。', category: '災害', wikipediaTitle: '関東大震災', connectionToNow: '関東大震災の教訓は現代の耐震建築基準・防災計画の基盤となっています。' },
    { id: 'ta3', year: 1925, icon: '🗳️', title: '普通選挙法と治安維持法', description: '25歳以上の男性に選挙権を与える普通選挙法が成立。同年、治安維持法も成立し自由と弾圧が同時進行した。', category: '政治・法律', wikipediaTitle: '普通選挙法', connectionToNow: '「表現の自由と安全保障のバランス」という永遠のテーマは現代のインターネット規制問題にも通じます。' },
  ],
  showa: [
    { id: 'sh1', year: 1937, icon: '🌏', title: '日中戦争の全面化', description: '盧溝橋事件をきっかけに日本と中国の戦争が全面化。長期戦に突入した。', category: '戦争', wikipediaTitle: '日中戦争', connectionToNow: '日中戦争の歴史認識問題は現在も日中関係の火種となっています。' },
    { id: 'sh2', year: 1945, icon: '🕊️', title: '終戦：広島・長崎の原爆と敗戦', description: '1945年8月6日広島、9日長崎に原爆が投下され、15日に終戦を告げた。約310万人が戦争で命を落とした。', category: '戦争・平和', wikipediaTitle: '終戦', connectionToNow: '現在も続く安全保障論議はすべてこの歴史的決断の延長線上にあります。' },
    { id: 'sh3', year: 1964, icon: '🚄', title: '東京オリンピック・新幹線開業', description: '日本の戦後復興を世界に示した東京五輪。直前に東海道新幹線が開業した。', category: '社会・文化', wikipediaTitle: '1964年東京オリンピック', connectionToNow: '新幹線は今も世界最高水準の高速鉄道として日本の誇りです。' },
    { id: 'sh4', year: 1973, icon: '⛽', title: 'オイルショック：高度成長の終焉', description: '石油価格が急騰し「狂乱物価」が起き、日本の高度経済成長が終わりを迎えた。', category: '経済・社会', wikipediaTitle: 'オイルショック', connectionToNow: 'オイルショックを機に日本は省エネ技術で世界トップに立ちました。' },
  ],
  heisei: [
    { id: 'he1', year: 1991, icon: '📉', title: 'バブル経済の崩壊', description: '1980年代後半の不動産・株式バブルが崩壊。以後「失われた30年」と呼ばれる長期停滞に入った。', category: '経済', wikipediaTitle: 'バブル崩壊', connectionToNow: 'バブル崩壊後の問題（少子化・非正規雇用・賃金停滞）は現在進行中の課題です。' },
    { id: 'he2', year: 1995, icon: '🌋', title: '阪神淡路大震災・地下鉄サリン事件', description: '1月に阪神大震災（死者6434人）、3月に地下鉄サリン事件（死者13人）。「1995年の衝撃」。', category: '災害・事件', wikipediaTitle: '阪神・淡路大震災', connectionToNow: 'ボランティア文化・防災意識を大きく変えました。「1995年はボランティア元年」とも言われます。' },
    { id: 'he3', year: 2011, icon: '🌊', title: '東日本大震災・福島第一原発事故', description: 'マグニチュード9.0の地震と津波で死者・行方不明者約2万2000人。福島第一原発がメルトダウンした。', category: '災害・エネルギー', wikipediaTitle: '東日本大震災', connectionToNow: 'エネルギー政策の大転換をもたらし、現在の日本の原発政策論争に直結しています。' },
    { id: 'he4', year: 2019, icon: '🌸', title: '令和への改元・平成の終わり', description: '天皇陛下の生前退位により平成が終わり、令和に改元。平成は30年1ヶ月の時代だった。', category: '政治・社会', wikipediaTitle: '平成', connectionToNow: '失われた時代・デジタル革命・大震災と復興——平成の蓄積が現代の課題の基盤となっています。' },
  ],
  reiwa: [
    { id: 'r1', year: 2019, icon: '🌸', title: '令和改元', description: '元号「令和」が始まる。出典は万葉集の梅の歌。初めて漢籍でなく日本の古典から採られた元号。', category: '政治・文化', wikipediaTitle: '令和', connectionToNow: '元号は日本固有の時間認識システムとして、デジタル社会でも機能し続けています。' },
    { id: 'r2', year: 2020, icon: '😷', title: 'COVID-19パンデミック・東京五輪延期', description: '新型コロナが世界的に流行。東京五輪が史上初めて延期され、リモートワーク・デジタル化が急速に進んだ。', category: '医療・社会', wikipediaTitle: 'COVID-19パンデミック', connectionToNow: 'コロナ禍は社会のデジタル化を10年分加速させました。「デジタル庁」設立もコロナが契機です。' },
    { id: 'r3', year: 2022, icon: '🤖', title: 'ChatGPT・生成AI革命の到来', description: 'OpenAIのChatGPTが公開され、AIが急速に一般社会に普及し始めた。', category: '技術・AI', wikipediaTitle: 'ChatGPT', connectionToNow: '生成AIは日本の少子高齢化・労働人口問題の解決策として期待される一方、雇用の変化など新たな課題をもたらしています。' },
    { id: 'r4', year: 2024, icon: '📈', title: '能登半島地震・30年ぶりの賃上げ', description: '2024年元日に能登半島を最大震度7の地震が襲い200人以上が犠牲に。同年、30年以上ぶりの大幅な賃上げを経験した。', category: '災害・経済', wikipediaTitle: '令和6年能登半島地震', connectionToNow: '能登地震は過疎化・高齢化した地方での災害対応という新たな課題を提示しました。' },
  ],
};

// ===== Vue アプリ =====
createApp({
  setup() {
    const route = ref(parseRoute());
    const viewMode = ref('events');   // 'events' | 'people'
    const selectedEvent = ref(null);
    const wikiData = ref(null);
    const wikiLoading = ref(false);
    const wikiError = ref(false);
    const currentYear = new Date().getFullYear();
    const searchQuery = ref('');
    const selectedCategory = ref('');

    window.addEventListener('hashchange', () => {
      route.value = parseRoute();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });

    // スクロールで .reveal 要素を表示する
    const setupReveal = () => {
      const observer = new IntersectionObserver((entries) => {
        entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('visible'); observer.unobserve(e.target); } });
      }, { threshold: 0.1 });
      document.querySelectorAll('.reveal').forEach(el => observer.observe(el));
    };
    // ビュー切替後に再セットアップ
    setTimeout(setupReveal, 100);
    window.addEventListener('hashchange', () => setTimeout(setupReveal, 100));
    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && selectedEvent.value) closeModal();
    });

    const currentView = computed(() => route.value.view);

    const selectedEra = computed(() =>
      ERAS.find(e => e.id === route.value.eraId) || null
    );

    const selectedEraEvents = computed(() => {
      if (!route.value.eraId) return [];
      return (EVENTS[route.value.eraId] || []).sort((a, b) => a.year - b.year);
    });

    const selectedEraPeople = computed(() => {
      if (!route.value.eraId) return [];
      return (PEOPLE[route.value.eraId] || []).sort((a, b) => a.birthYear - b.birthYear);
    });

    const prevEra = computed(() => {
      if (!selectedEra.value) return null;
      const idx = ERAS.findIndex(e => e.id === selectedEra.value.id);
      return idx > 0 ? ERAS[idx - 1] : null;
    });

    const nextEra = computed(() => {
      if (!selectedEra.value) return null;
      const idx = ERAS.findIndex(e => e.id === selectedEra.value.id);
      return idx < ERAS.length - 1 ? ERAS[idx + 1] : null;
    });

    const totalEventCount = computed(() =>
      Object.values(EVENTS).reduce((sum, arr) => sum + arr.length, 0)
    );

    const totalPeopleCount = computed(() =>
      Object.values(PEOPLE).reduce((sum, arr) => sum + arr.length, 0)
    );

    const goToEra = (eraId) => { window.location.hash = `era-${eraId}`; };
    const goToOverview = () => { window.location.hash = ''; };

    const getDurationLabel = (era) => {
      const years = (era.endYear ?? currentYear) - era.startYear;
      if (years >= 10000) return `約${Math.round(years / 10000)}万年`;
      if (years >= 1000) return `約${(years / 1000).toFixed(1)}万年`;
      if (years >= 100) return `約${Math.round(years / 100) * 100}年間`;
      return `${years}年間`;
    };

    const getEventCount = (eraId) => (EVENTS[eraId] || []).length;
    const getPeopleCount = (eraId) => (PEOPLE[eraId] || []).length;
    const getEraTopPeople = (eraId) => (PEOPLE[eraId] || []).slice(0, 3);

    const filteredEraEvents = computed(() => {
      let list = selectedEraEvents.value;
      if (selectedCategory.value) list = list.filter(e => e.category === selectedCategory.value);
      if (searchQuery.value) {
        const q = searchQuery.value.toLowerCase();
        list = list.filter(e =>
          e.title.toLowerCase().includes(q) || e.description.toLowerCase().includes(q)
        );
      }
      return list;
    });

    const filteredEraPeople = computed(() => {
      let list = selectedEraPeople.value;
      if (selectedCategory.value) list = list.filter(p => p.category === selectedCategory.value);
      if (searchQuery.value) {
        const q = searchQuery.value.toLowerCase();
        list = list.filter(p =>
          p.name.toLowerCase().includes(q) || (p.description || '').toLowerCase().includes(q)
        );
      }
      return list;
    });

    const currentEraCategories = computed(() => {
      const source = viewMode.value === 'events' ? selectedEraEvents.value : selectedEraPeople.value;
      const counts = {};
      source.forEach(item => {
        counts[item.category] = (counts[item.category] || 0) + 1;
      });
      return Object.entries(counts).map(([name, count]) => ({ name, count }));
    });

    // Wikipedia モーダル（イベント・人物共通）
    const openModal = async (item) => {
      selectedEvent.value = item;
      wikiData.value = null;
      wikiError.value = false;
      wikiLoading.value = true;
      try {
        const title = encodeURIComponent(item.wikipediaTitle);
        const res = await fetch(
          `https://ja.wikipedia.org/api/rest_v1/page/summary/${title}`,
          { headers: { Accept: 'application/json' } }
        );
        if (res.ok) wikiData.value = await res.json();
        else wikiError.value = true;
      } catch {
        wikiError.value = true;
      } finally {
        wikiLoading.value = false;
      }
    };

    const closeModal = () => {
      selectedEvent.value = null;
      wikiData.value = null;
    };

    // モーダルのタイトルを動的に（イベント名 or 人物名）
    const modalTitle = computed(() => {
      if (!selectedEvent.value) return '';
      return selectedEvent.value.name || selectedEvent.value.title || '';
    });

    const modalSubtitle = computed(() => {
      if (!selectedEvent.value) return '';
      if (selectedEvent.value.name) {
        // 人物の場合: 生没年と肩書き
        return `${formatLifespan(selectedEvent.value)}　${selectedEvent.value.title}`;
      }
      // イベントの場合: 年
      return formatYear(selectedEvent.value.year);
    });

    return {
      eras: ERAS,
      currentView,
      viewMode,
      selectedEra,
      selectedEraEvents,
      selectedEraPeople,
      prevEra,
      nextEra,
      totalEventCount,
      totalPeopleCount,
      selectedEvent,
      wikiData,
      wikiLoading,
      wikiError,
      currentYear,
      modalTitle,
      modalSubtitle,
      goToEra,
      goToOverview,
      formatYear,
      formatYearRange,
      formatLifespan,
      getDurationLabel,
      getEventCount,
      getPeopleCount,
      getEraTopPeople,
      openModal,
      closeModal,
      searchQuery,
      selectedCategory,
      filteredEraEvents,
      filteredEraPeople,
      currentEraCategories,
    };
  },
}).mount('#app');
