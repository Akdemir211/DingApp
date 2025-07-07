import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SafeContainer } from '@/components/UI/SafeContainer';
import { Colors, Spacing, FontSizes, BorderRadius, Shadows } from '@/constants/Theme';
import { useTheme } from '@/context/ThemeContext';
import { router } from 'expo-router';
import { ArrowLeft, Trophy, DollarSign, Heart, Clock, RotateCcw } from 'lucide-react-native';
import { FloatingBubbleBackground } from '@/components/UI/FloatingBubble';
import { Button } from '@/components/UI/Button';
import { GradientCard } from '@/components/UI/GradientBackground';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withTiming, 
  withSequence,
  FadeIn,
  SlideInDown,
  ZoomIn
} from 'react-native-reanimated';

interface Question {
  id: number;
  question: string;
  options: string[];
  correctAnswer: number;
  difficulty: 'easy' | 'medium' | 'hard';
  prize: string;
}

// Soru havuzu - Her oyunda rastgele seçilecek (Prize değerleri PRIZE_LADDER'dan atanacak)
const QUESTION_POOL: Question[] = [
  // KOLAY SORULAR (Genel Kültür & Temel Bilgiler)
  {
    id: 1,
    question: "Türkiye'nin başkenti neresidir?",
    options: ["İstanbul", "Ankara", "İzmir", "Bursa"],
    correctAnswer: 1,
    difficulty: 'easy',
    prize: ""
  },
  {
    id: 2,
    question: "Hangi gezegen Güneş'e en yakındır?",
    options: ["Venüs", "Mars", "Merkür", "Dünya"],
    correctAnswer: 2,
    difficulty: 'easy',
    prize: ""
  },
  {
    id: 3,
    question: "Bir yılda kaç ay vardır?",
    options: ["10", "11", "12", "13"],
    correctAnswer: 2,
    difficulty: 'easy',
    prize: ""
  },
  {
    id: 4,
    question: "İstanbul hangi iki kıtayı birbirine bağlar?",
    options: ["Avrupa-Afrika", "Avrupa-Asya", "Asya-Afrika", "Avrupa-Amerika"],
    correctAnswer: 1,
    difficulty: 'easy',
    prize: ""
  },
  {
    id: 5,
    question: "Dünyanın en büyük okyanusu hangisidir?",
    options: ["Atlantik", "Hint", "Pasifik", "Arktik"],
    correctAnswer: 2,
    difficulty: 'easy',
    prize: ""
  },
  {
    id: 6,
    question: "Kaç dakika bir saatte vardır?",
    options: ["50", "60", "70", "80"],
    correctAnswer: 1,
    difficulty: 'easy',
    prize: ""
  },
  {
    id: 7,
    question: "Futbolda bir takımda kaç oyuncu sahada yer alır?",
    options: ["10", "11", "12", "13"],
    correctAnswer: 1,
    difficulty: 'easy',
    prize: ""
  },
  {
    id: 8,
    question: "Hangi renk kırmızı ve sarının karışımından oluşur?",
    options: ["Mor", "Turuncu", "Yeşil", "Pembe"],
    correctAnswer: 1,
    difficulty: 'easy',
    prize: ""
  },
  {
    id: 9,
    question: "Dünyanın en yüksek dağı hangisidir?",
    options: ["K2", "Everest", "Annapurna", "Kilimanjaro"],
    correctAnswer: 1,
    difficulty: 'easy',
    prize: ""
  },
  {
    id: 10,
    question: "2 + 2 x 3 işleminin sonucu kaçtır?",
    options: ["8", "10", "12", "14"],
    correctAnswer: 0,
    difficulty: 'easy',
    prize: ""
  },
  {
    id: 11,
    question: "Hangi hayvan süt verir?",
    options: ["Tavuk", "Balık", "İnek", "Kedi"],
    correctAnswer: 2,
    difficulty: 'easy',
    prize: ""
  },
  {
    id: 12,
    question: "Bir haftada kaç gün vardır?",
    options: ["5", "6", "7", "8"],
    correctAnswer: 2,
    difficulty: 'easy',
    prize: ""
  },

  // ORTA SORULAR (Bilim & Teknoloji)
  {
    id: 13,
    question: "Python hangi tür bir yazılım dilidir?",
    options: ["Düşük seviye", "Makine dili", "Yüksek seviye", "Assembly"],
    correctAnswer: 2,
    difficulty: 'medium',
    prize: ""
  },
  {
    id: 14,
    question: "Hangi element periyodik tabloda 'Au' sembolü ile gösterilir?",
    options: ["Gümüş", "Altın", "Alüminyum", "Arsenik"],
    correctAnswer: 1,
    difficulty: 'medium',
    prize: ""
  },
  {
    id: 15,
    question: "HTTP protokolünde 'S' harfi neyi ifade eder?",
    options: ["Server", "Secure", "System", "Simple"],
    correctAnswer: 1,
    difficulty: 'medium',
    prize: ""
  },
  {
    id: 16,
    question: "İnsan beyninde yaklaşık kaç nöron vardır?",
    options: ["100 milyon", "1 milyar", "100 milyar", "1 trilyon"],
    correctAnswer: 2,
    difficulty: 'medium',
    prize: ""
  },
  {
    id: 17,
    question: "Işık hızı saniyede kaç kilometre yapar?",
    options: ["150.000 km", "300.000 km", "450.000 km", "600.000 km"],
    correctAnswer: 1,
    difficulty: 'medium',
    prize: ""
  },
  {
    id: 18,
    question: "Hangi vitamin güneş ışığından sentezlenir?",
    options: ["Vitamin A", "Vitamin B", "Vitamin C", "Vitamin D"],
    correctAnswer: 3,
    difficulty: 'medium',
    prize: ""
  },
  {
    id: 19,
    question: "DNA'nın açılımı nedir?",
    options: ["Deoksiribonükleik asit", "Dualribonükleik asit", "Deoksiribonükleit asit", "Deokleroribonükleik asit"],
    correctAnswer: 0,
    difficulty: 'medium',
    prize: ""
  },
  {
    id: 20,
    question: "E=mc² formülü kime aittir?",
    options: ["Newton", "Einstein", "Galileo", "Tesla"],
    correctAnswer: 1,
    difficulty: 'medium',
    prize: ""
  },

  // ORTA SORULAR (Tarih & Edebiyat)
  {
    id: 21,
    question: "Osmanlı İmparatorluğu hangi yılda kurulmuştur?",
    options: ["1299", "1453", "1326", "1389"],
    correctAnswer: 0,
    difficulty: 'medium',
    prize: ""
  },
  {
    id: 22,
    question: "'Safahat' eseri kime aittir?",
    options: ["Yahya Kemal", "Mehmet Akif Ersoy", "Necip Fazıl", "Ahmet Hamdi Tanpınar"],
    correctAnswer: 1,
    difficulty: 'medium',
    prize: ""
  },
  {
    id: 23,
    question: "İkinci Dünya Savaşı hangi yıl sona ermiştir?",
    options: ["1944", "1945", "1946", "1947"],
    correctAnswer: 1,
    difficulty: 'medium',
    prize: ""
  },
  {
    id: 24,
    question: "Atatürk'ün doğum yılı hangisidir?",
    options: ["1880", "1881", "1882", "1883"],
    correctAnswer: 1,
    difficulty: 'medium',
    prize: ""
  },
  {
    id: 25,
    question: "'Kürk Mantolu Madonna' romanının yazarı kimdir?",
    options: ["Orhan Pamuk", "Sabahattin Ali", "Peyami Safa", "Refik Halit Karay"],
    correctAnswer: 1,
    difficulty: 'medium',
    prize: ""
  },
  {
    id: 26,
    question: "Cumhuriyet Dönemi'nin ilk başbakanı kimdir?",
    options: ["İsmet İnönü", "Fevzi Çakmak", "Kazım Karabekir", "Ali Fethi Okyar"],
    correctAnswer: 0,
    difficulty: 'medium',
    prize: ""
  },

  // ORTA SORULAR (Coğrafya & Sanat)
  {
    id: 27,
    question: "Hangi ülke en fazla saat dilimine sahiptir?",
    options: ["ABD", "Rusya", "Çin", "Kanada"],
    correctAnswer: 1,
    difficulty: 'medium',
    prize: ""
  },
  {
    id: 28,
    question: "Mona Lisa tablosunu kim yapmıştır?",
    options: ["Michelangelo", "Leonardo da Vinci", "Picasso", "Van Gogh"],
    correctAnswer: 1,
    difficulty: 'medium',
    prize: ""
  },
  {
    id: 29,
    question: "Dünyada en çok konuşulan dil hangisidir?",
    options: ["İngilizce", "Mandarin Çincesi", "İspanyolca", "Hintçe"],
    correctAnswer: 1,
    difficulty: 'medium',
    prize: ""
  },
  {
    id: 30,
    question: "Beethoven'ın 9. Senfonisi hangi şehirde seslendirilmiştir?",
    options: ["Viyana", "Berlin", "Paris", "Londra"],
    correctAnswer: 0,
    difficulty: 'medium',
    prize: ""
  },
  {
    id: 31,
    question: "Hangi ülke Afrika'nın en büyük ülkesidir?",
    options: ["Libya", "Cezayir", "Sudan", "Demokratik Kongo Cumhuriyeti"],
    correctAnswer: 1,
    difficulty: 'medium',
    prize: ""
  },
  {
    id: 32,
    question: "π (pi) sayısının yaklaşık değeri nedir?",
    options: ["3.14", "3.41", "2.71", "1.41"],
    correctAnswer: 0,
    difficulty: 'medium',
    prize: ""
  },

  // ZOR SORULAR (İleri Bilim)
  {
    id: 33,
    question: "Quantum fiziğinde 'belirsizlik ilkesi' kime aittir?",
    options: ["Einstein", "Bohr", "Heisenberg", "Schrödinger"],
    correctAnswer: 2,
    difficulty: 'hard',
    prize: ""
  },
  {
    id: 34,
    question: "DNA'nın çift sarmal yapısını kim keşfetmiştir?",
    options: ["Watson & Crick", "Mendel", "Darwin", "Fleming"],
    correctAnswer: 0,
    difficulty: 'hard',
    prize: ""
  },
  {
    id: 35,
    question: "Hangi matematikçi 'Fermat'ın Son Teoremi'ni çözmüştür?",
    options: ["Gauss", "Euler", "Andrew Wiles", "Riemann"],
    correctAnswer: 2,
    difficulty: 'hard',
    prize: ""
  },
  {
    id: 36,
    question: "CRISPR-Cas9 teknolojisi neyle ilgilidir?",
    options: ["Yapay zeka", "Gen düzenleme", "Kuantum hesaplama", "Roket bilimi"],
    correctAnswer: 1,
    difficulty: 'hard',
    prize: ""
  },
  {
    id: 37,
    question: "Higgs bozonu hangi alanda önemli bir keşiftir?",
    options: ["Biyoloji", "Kimya", "Parçacık fiziği", "Astronomi"],
    correctAnswer: 2,
    difficulty: 'hard',
    prize: ""
  },
  {
    id: 38,
    question: "Schrödinger denklemi hangi alanda kullanılır?",
    options: ["Klasik mekanik", "Kuantum mekaniği", "Termodinamik", "Elektromanyetizma"],
    correctAnswer: 1,
    difficulty: 'hard',
    prize: ""
  },
  {
    id: 39,
    question: "Hawking radyasyonu neyle ilgilidir?",
    options: ["Nötron yıldızları", "Kara delikler", "Quasarlar", "Süpernovalar"],
    correctAnswer: 1,
    difficulty: 'hard',
    prize: ""
  },
  {
    id: 40,
    question: "P vs NP problemi hangi alanda önemli bir sorundur?",
    options: ["Fizik", "Kimya", "Bilgisayar bilimi", "Biyoloji"],
    correctAnswer: 2,
    difficulty: 'hard',
    prize: ""
  },
  {
    id: 41,
    question: "LHC (Large Hadron Collider) hangi organizasyon tarafından işletilir?",
    options: ["NASA", "CERN", "MIT", "Stanford"],
    correctAnswer: 1,
    difficulty: 'hard',
    prize: ""
  },
  {
    id: 42,
    question: "Riemann hipotezi hangi matematik alanıyla ilgilidir?",
    options: ["Cebir", "Geometri", "Sayılar teorisi", "Topoloji"],
    correctAnswer: 2,
    difficulty: 'hard',
    prize: ""
  },

  // ZOR SORULAR (Teknoloji & Felsefe)
  {
    id: 43,
    question: "Blockchain teknolojisinin temelini atan ilk kripto para nedir?",
    options: ["Ethereum", "Bitcoin", "Litecoin", "Ripple"],
    correctAnswer: 1,
    difficulty: 'hard',
    prize: ""
  },
  {
    id: 44,
    question: "Hangi felsefi akım 'Cogito ergo sum' (Düşünüyorum, öyleyse varım) sözüyle bilinir?",
    options: ["Empirizm", "Rasyonalizm", "Fenomenoloji", "Egzistansiyalizm"],
    correctAnswer: 1,
    difficulty: 'hard',
    prize: ""
  },
  {
    id: 45,
    question: "Machine Learning'de 'overfitting' ne anlama gelir?",
    options: ["Veri eksikliği", "Aşırı uyum", "Hızlı öğrenme", "Veri fazlalığı"],
    correctAnswer: 1,
    difficulty: 'hard',
    prize: ""
  },
  {
    id: 46,
    question: "Gödel'in Eksiklik Teoremi hangi alanla ilgilidir?",
    options: ["Fizik", "Matematik", "Biyoloji", "Kimya"],
    correctAnswer: 1,
    difficulty: 'hard',
    prize: ""
  },
  {
    id: 47,
    question: "Turing testi neyi ölçer?",
    options: ["Bilgisayar hızı", "Yapay zeka", "Ağ güvenliği", "Veri depolama"],
    correctAnswer: 1,
    difficulty: 'hard',
    prize: ""
  },
  {
    id: 48,
    question: "Blockchain teknolojisinde 'consensus' algoritması ne işe yarar?",
    options: ["Veri şifreleme", "Ağ güvenliği", "Mutabakat sağlama", "Hız artırma"],
    correctAnswer: 2,
    difficulty: 'hard',
    prize: ""
  },
  {
    id: 49,
    question: "Nietzsche'nin 'Übermensch' kavramı neyi ifade eder?",
    options: ["Süper güç", "Üst insan", "İlahi varlık", "Evrimsel aşama"],
    correctAnswer: 1,
    difficulty: 'hard',
    prize: ""
  },
  {
    id: 50,
    question: "Kant'ın 'kategorik imperatif' kavramı hangi alanla ilgilidir?",
    options: ["Metafizik", "Epistemoloji", "Etik", "Estetik"],
    correctAnswer: 2,
    difficulty: 'hard',
    prize: ""
  },

  // ZOR SORULAR (İleri Matematik & Fizik)
  {
    id: 51,
    question: "Özel görelilik teorisinde Lorentz dönüşümü neyi açıklar?",
    options: ["Kütle artışı", "Zaman genişlemesi", "Uzay büzülmesi", "Hepsini"],
    correctAnswer: 3,
    difficulty: 'hard',
    prize: ""
  },
  {
    id: 52,
    question: "Navier-Stokes denklemleri hangi alanda kullanılır?",
    options: ["Akışkanlar mekaniği", "Kuantum mekaniği", "Termodinamik", "Elektromanyetizma"],
    correctAnswer: 0,
    difficulty: 'hard',
    prize: ""
  },
  {
    id: 53,
    question: "Standard Model'de kaç temel parçacık vardır?",
    options: ["12", "17", "24", "36"],
    correctAnswer: 1,
    difficulty: 'hard',
    prize: ""
  },
  {
    id: 54,
    question: "Penrose döşemesi hangi matematik alanında önemlidir?",
    options: ["Cebirsel topoloji", "Fraktal geometri", "Quasicrystal yapıları", "Grup teorisi"],
    correctAnswer: 2,
    difficulty: 'hard',
    prize: ""
  },
  {
    id: 55,
    question: "Popper'ın yanlışlanabilirlik kuramı neyi savunur?",
    options: ["Bilimsel teorilerin doğrulanması", "Bilimsel teorilerin test edilebilirliği", "Matematiksel ispatların geçerliliği", "Mantıksal çıkarımların kesinliği"],
    correctAnswer: 1,
    difficulty: 'hard',
    prize: ""
  },
  {
    id: 56,
    question: "Wittgenstein'ın 'dil oyunları' teorisi neyi ifade eder?",
    options: ["Dilin sosyal bağlamı", "Matematiksel mantık", "Sembolik mantık", "Formal sistemler"],
    correctAnswer: 0,
    difficulty: 'hard',
    prize: ""
  },
  {
    id: 57,
    question: "Thomas Kuhn'un 'paradigma değişimi' kavramı bilim tarihinde neyi açıklar?",
    options: ["Bilimsel devrimleri", "Teknolojik gelişmeleri", "Sosyal değişimleri", "Kültürel dönüşümleri"],
    correctAnswer: 0,
    difficulty: 'hard',
    prize: ""
  },
  {
    id: 58,
    question: "Hilbert'in 23 problemi hangi alanda önem taşır?",
    options: ["20. yüzyıl fiziği", "20. yüzyıl matematiği", "20. yüzyıl felsefesi", "20. yüzyıl kimyası"],
    correctAnswer: 1,
    difficulty: 'hard',
    prize: ""
  },
  {
    id: 59,
    question: "Chaos teorisinde 'kelebek etkisi' neyi ifade eder?",
    options: ["Doğrusal değişim", "Hassas başlangıç koşulları", "Simetrik dönüşümler", "Periyodik davranış"],
    correctAnswer: 1,
    difficulty: 'hard',
    prize: ""
  },
  {
    id: 60,
    question: "Mandelbrot kümesi hangi matematik alanında önemlidir?",
    options: ["Lineer cebir", "Diferansiyel denklemler", "Fraktal geometri", "Sayı teorisi"],
    correctAnswer: 2,
    difficulty: 'hard',
    prize: ""
  }
];

// Sabit ödül listesi - Kim Milyoner Olmak İster tarzı
const PRIZE_LADDER = [
  "1.000 TL",      // Soru 1
  "2.000 TL",      // Soru 2  
  "3.000 TL",      // Soru 3
  "5.000 TL",      // Soru 4
  "10.000 TL",     // Soru 5
  "20.000 TL",     // Soru 6
  "40.000 TL",     // Soru 7
  "80.000 TL",     // Soru 8
  "160.000 TL",    // Soru 9
  "1.000.000 TL"   // Soru 10 (Büyük Ödül)
];

// Her oyunda farklı sorular seçmek için rastgele soru seçici
const getRandomQuestions = (prizeLadder: string[]): Question[] => {
  const easyQuestions = QUESTION_POOL.filter(q => q.difficulty === 'easy');
  const mediumQuestions = QUESTION_POOL.filter(q => q.difficulty === 'medium');
  const hardQuestions = QUESTION_POOL.filter(q => q.difficulty === 'hard');

  const shuffleArray = (array: Question[]) => {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  };

  // Her zorluk seviyesinden rastgele seç
  const selectedEasy = shuffleArray(easyQuestions).slice(0, 3);     // Soru 1-3: Kolay
  const selectedMedium = shuffleArray(mediumQuestions).slice(0, 4);  // Soru 4-7: Orta  
  const selectedHard = shuffleArray(hardQuestions).slice(0, 3);     // Soru 8-10: Zor

  // Soruları birleştir ve sabit ödülleri ata
  const finalQuestions = [...selectedEasy, ...selectedMedium, ...selectedHard];
  
  finalQuestions.forEach((question, index) => {
    question.prize = prizeLadder[index];  // Sabit ödül sistemi
    question.id = index + 1;
  });

  return finalQuestions;
};

// Her oyunda yeni sorular seçilir

export default function QuizGameScreen() {
  const { theme } = useTheme();
  
  // Sabit ödül sistemi
  const CURRENT_PRIZE_LADDER = [
    "1.000 TL",      // Soru 1
    "2.000 TL",      // Soru 2  
    "3.000 TL",      // Soru 3
    "5.000 TL",      // Soru 4
    "10.000 TL",     // Soru 5
    "20.000 TL",     // Soru 6
    "40.000 TL",     // Soru 7
    "80.000 TL",     // Soru 8
    "160.000 TL",    // Soru 9
    "1.000.000 TL"   // Soru 10 (Büyük Ödül)
  ];
  
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [gameState, setGameState] = useState<'playing' | 'won' | 'lost' | 'start'>('start');
  const [timer, setTimer] = useState(30);
  const [lives, setLives] = useState(3);
  const [usedLifelines, setUsedLifelines] = useState({
    fiftyFifty: false,
    audience: false,
    phone: false
  });
  const [showingLifeline, setShowingLifeline] = useState<string | null>(null);
  const [totalWinnings, setTotalWinnings] = useState('0 TL');
  const [gameQuestions, setGameQuestions] = useState<Question[]>(getRandomQuestions(CURRENT_PRIZE_LADDER));

  const progressWidth = useSharedValue(0);
  const questionScale = useSharedValue(1);

  useEffect(() => {
    if (gameState === 'playing') {
      const interval = setInterval(() => {
        setTimer(prev => {
          if (prev <= 1) {
            // Zaman doldu, yanlış cevap
            handleAnswer(-1);
            return 30;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [gameState, currentQuestion]);

  useEffect(() => {
    progressWidth.value = withTiming((currentQuestion / gameQuestions.length) * 100);
  }, [currentQuestion, gameQuestions]);

  const animatedProgressStyle = useAnimatedStyle(() => ({
    width: `${progressWidth.value}%`,
  }));

  const animatedQuestionStyle = useAnimatedStyle(() => ({
    transform: [{ scale: questionScale.value }],
  }));

  const startGame = () => {
    // Her oyunda yeni sorular seç
    setGameQuestions(getRandomQuestions(CURRENT_PRIZE_LADDER));
    setGameState('playing');
    setCurrentQuestion(0);
    setSelectedAnswer(null);
    setTimer(30);
    setLives(3);
    setUsedLifelines({ fiftyFifty: false, audience: false, phone: false });
    setTotalWinnings('0 TL');
  };

  const handleAnswer = (answerIndex: number) => {
    const question = gameQuestions[currentQuestion];
    
    if (answerIndex === question.correctAnswer) {
      // Doğru cevap - CURRENT_PRIZE_LADDER'dan doğru ödülü al
      const currentPrize = CURRENT_PRIZE_LADDER[currentQuestion];
      setTotalWinnings(currentPrize);
      
      if (currentQuestion === gameQuestions.length - 1) {
        // Oyun kazanıldı
        setGameState('won');
      } else {
        // Sonraki soru
        setTimeout(() => {
          setCurrentQuestion(prev => prev + 1);
          setSelectedAnswer(null);
          setTimer(30);
          questionScale.value = withSequence(
            withTiming(0.8, { duration: 200 }),
            withTiming(1, { duration: 200 })
          );
        }, 1500);
      }
    } else {
      // Yanlış cevap
      const newLives = lives - 1;
      setLives(newLives);
      
      if (newLives <= 0) {
        setGameState('lost');
      } else {
        // Hayat hakkı kullanarak devam - kazancı koru
        Alert.alert(
          'Yanlış Cevap!',
          `Bir hayat hakkı kaybettiniz. Kalan: ${newLives}`,
          [{ text: 'Devam Et', onPress: () => setSelectedAnswer(null) }]
        );
        setTimer(30);
      }
    }
  };

  const useFiftyFifty = () => {
    if (usedLifelines.fiftyFifty) return;
    
    setUsedLifelines(prev => ({ ...prev, fiftyFifty: true }));
    setShowingLifeline('50:50 Joker kullanıldı! İki yanlış şık elendi.');
    setTimeout(() => setShowingLifeline(null), 2000);
  };

  const useAudienceHelp = () => {
    if (usedLifelines.audience) return;
    
    setUsedLifelines(prev => ({ ...prev, audience: true }));
    const question = gameQuestions[currentQuestion];
    const correctPercentage = Math.floor(Math.random() * 30) + 60; // 60-90% doğru cevap
    setShowingLifeline(`Seyirci Yardımı: ${question.options[question.correctAnswer]} - %${correctPercentage}`);
    setTimeout(() => setShowingLifeline(null), 3000);
  };

  const usePhoneHelp = () => {
    if (usedLifelines.phone) return;
    
    setUsedLifelines(prev => ({ ...prev, phone: true }));
    const question = gameQuestions[currentQuestion];
    setShowingLifeline(`Telefon Joker: "Bence cevap ${question.options[question.correctAnswer]} olmalı."`);
    setTimeout(() => setShowingLifeline(null), 3000);
  };

  const restartGame = () => {
    setGameState('start');
  };

  if (gameState === 'start') {
    return (
      <SafeContainer style={styles.container}>
        <FloatingBubbleBackground />
        <Animated.View 
          style={styles.startScreen}
          entering={FadeIn.duration(800)}
        >
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <ArrowLeft size={24} color={Colors.text.primary} />
          </TouchableOpacity>
          
          <Animated.View entering={ZoomIn.delay(300).duration(600)}>
            <Trophy size={80} color="#FFD700" style={styles.startIcon} />
          </Animated.View>
          
          <Text style={[styles.gameTitle, { color: theme.colors.text.primary }]}>
            Kim Milyoner Olmak İster?
          </Text>
          
          <Text style={[styles.gameSubtitle, { color: theme.colors.text.secondary }]}>
            10 soru, 3 hayat hakkı, 1 milyon TL ödül!
          </Text>
          
          <GradientCard 
            colors={['#FF6B6B', '#4ECDC4']} 
            style={styles.rulesCard}
          >
            <Text style={[styles.rulesTitle, { color: theme.colors.text.primary }]}>Oyun Kuralları</Text>
            <Text style={[styles.rulesText, { color: theme.colors.text.secondary }]}>
              • Her soru için 30 saniye süreniz var{'\n'}
              • 3 hayat hakkınız bulunuyor{'\n'}
              • 3 joker hakkınız var: 50:50, Seyirci, Telefon{'\n'}
              • Doğru cevap verdiğinizde para kazanırsınız
            </Text>
          </GradientCard>
          
          <Button 
            title="Oyuna Başla"
            onPress={startGame}
            variant="primary"
            style={styles.startButton}
          />
        </Animated.View>
      </SafeContainer>
    );
  }

  if (gameState === 'won' || gameState === 'lost') {
    return (
      <SafeContainer style={styles.container}>
        <FloatingBubbleBackground />
        <Animated.View 
          style={styles.endScreen}
          entering={FadeIn.duration(800)}
        >
          <Animated.View entering={ZoomIn.delay(300).duration(600)}>
            {gameState === 'won' ? (
              <Trophy size={80} color="#FFD700" style={styles.endIcon} />
            ) : (
              <Heart size={80} color="#FF6B6B" style={styles.endIcon} />
            )}
          </Animated.View>
          
          <Text style={[styles.endTitle, { color: theme.colors.text.primary }]}>
            {gameState === 'won' ? 'Tebrikler!' : 'Oyun Bitti!'}
          </Text>
          
          <Text style={[styles.endSubtitle, { color: theme.colors.text.secondary }]}>
            {gameState === 'won' 
              ? 'Milyoner oldunuz!' 
              : 'Bir dahaki sefere daha şanslı olacaksınız!'
            }
          </Text>
          
          <GradientCard 
            colors={gameState === 'won' ? ['#FFD700', '#FFA500'] : ['#FF6B6B', '#FF8E8E']} 
            style={styles.resultCard}
          >
            <DollarSign size={32} color={theme.colors.text.primary} />
            <Text style={[styles.winningsText, { color: theme.colors.text.primary }]}>
              Kazandığınız: {totalWinnings}
            </Text>
          </GradientCard>
          
          <View style={styles.endButtons}>
            <Button 
              title="Tekrar Oyna"
              onPress={restartGame}
              variant="primary"
              style={styles.endButton}
            />
            <Button 
              title="Ana Sayfa"
              onPress={() => router.back()}
              variant="secondary"
              style={styles.endButton}
            />
          </View>
        </Animated.View>
      </SafeContainer>
    );
  }

  const question = gameQuestions[currentQuestion];
  const isFiftyFiftyUsed = usedLifelines.fiftyFifty;

  return (
    <SafeContainer style={styles.container}>
      <FloatingBubbleBackground />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color={Colors.text.primary} />
        </TouchableOpacity>
        
        <View style={styles.headerInfo}>
          <Text style={[styles.questionNumber, { color: theme.colors.text.primary }]}>
            Soru {currentQuestion + 1}/10
          </Text>
          <Text style={[styles.currentPrize, { color: theme.colors.primary[400] }]}>
            {CURRENT_PRIZE_LADDER[currentQuestion]}
          </Text>
        </View>
        
        <View style={styles.livesContainer}>
          {Array.from({ length: 3 }).map((_, index) => (
            <Heart 
              key={index}
              size={20} 
              color={index < lives ? "#FF6B6B" : "#666"} 
              fill={index < lives ? "#FF6B6B" : "transparent"}
            />
          ))}
        </View>
      </View>

      {/* Progress Bar */}
      <View style={styles.progressContainer}>
        <View style={styles.progressBar}>
          <Animated.View style={[styles.progressFill, animatedProgressStyle]} />
        </View>
      </View>

      {/* Timer */}
      <View style={styles.timerContainer}>
        <Clock size={20} color={timer <= 10 ? "#FF6B6B" : theme.colors.primary[400]} />
        <Text style={[
          styles.timerText, 
          { 
            color: timer <= 10 ? "#FF6B6B" : theme.colors.primary[400]
          }
        ]}>
          {timer}s
        </Text>
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
        {/* Lifeline Notification */}
        {showingLifeline && (
          <Animated.View 
            style={styles.lifelineNotification}
            entering={SlideInDown.duration(300)}
          >
            <Text style={[styles.lifelineText, { color: theme.colors.text.primary }]}>
              {showingLifeline}
            </Text>
          </Animated.View>
        )}

        {/* Question */}
        <Animated.View 
          style={[styles.questionContainer, animatedQuestionStyle]}
          entering={FadeIn.duration(600)}
        >
          <GradientCard 
            colors={theme.colors.gradients.primary} 
            style={styles.questionCard}
          >
            <Text style={[styles.questionText, { color: theme.colors.text.primary }]}>
              {question.question}
            </Text>
          </GradientCard>
        </Animated.View>

        {/* Options */}
        <View style={styles.optionsContainer}>
          {question.options.map((option, index) => {
            const isHiddenByFiftyFifty = isFiftyFiftyUsed && 
              index !== question.correctAnswer && 
              index !== (question.correctAnswer === 0 ? 1 : 0);
            
            if (isHiddenByFiftyFifty) return null;

            return (
              <Animated.View 
                key={index}
                entering={FadeIn.delay(index * 100 + 800).duration(400)}
              >
                <TouchableOpacity
                  style={[
                    styles.optionButton,
                    { 
                      backgroundColor: selectedAnswer === index 
                        ? theme.colors.primary[500] 
                        : theme.colors.darkGray[700]
                    }
                  ]}
                  onPress={() => {
                    setSelectedAnswer(index);
                    setTimeout(() => handleAnswer(index), 500);
                  }}
                  disabled={selectedAnswer !== null}
                >
                  <Text style={[
                    styles.optionLetter, 
                    { color: theme.colors.text.primary }
                  ]}>
                    {String.fromCharCode(65 + index)}
                  </Text>
                  <Text style={[
                    styles.optionText, 
                    { color: theme.colors.text.primary }
                  ]}>
                    {option}
                  </Text>
                </TouchableOpacity>
              </Animated.View>
            );
          })}
        </View>

        {/* Lifelines */}
        <View style={styles.lifelinesContainer}>
          <TouchableOpacity
            style={[
              styles.lifelineButton,
              { opacity: usedLifelines.fiftyFifty ? 0.5 : 1 }
            ]}
            onPress={useFiftyFifty}
            disabled={usedLifelines.fiftyFifty}
          >
            <Text style={[styles.lifelineButtonText, { color: theme.colors.text.primary }]}>
              50:50
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[
              styles.lifelineButton,
              { opacity: usedLifelines.audience ? 0.5 : 1 }
            ]}
            onPress={useAudienceHelp}
            disabled={usedLifelines.audience}
          >
            <Text style={[styles.lifelineButtonText, { color: theme.colors.text.primary }]}>
              👥
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[
              styles.lifelineButton,
              { opacity: usedLifelines.phone ? 0.5 : 1 }
            ]}
            onPress={usePhoneHelp}
            disabled={usedLifelines.phone}
          >
            <Text style={[styles.lifelineButtonText, { color: theme.colors.text.primary }]}>
              📞
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background.dark,
  },
  startScreen: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
  },
  endScreen: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
  },
  backButton: {
    position: 'absolute',
    top: 8,
    left: Spacing.lg,
    width: 40,
    height: 40,
    borderRadius: BorderRadius.round,
    backgroundColor: Colors.darkGray[800],
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  startIcon: {
    marginBottom: Spacing.xl,
  },
  endIcon: {
    marginBottom: Spacing.xl,
  },
  gameTitle: {
    fontFamily: 'Inter-Bold',
    fontSize: 28,
    textAlign: 'center',
    marginBottom: Spacing.md,
  },
  gameSubtitle: {
    fontFamily: 'Inter-Regular',
    fontSize: FontSizes.lg,
    textAlign: 'center',
    marginBottom: Spacing.xl,
  },
  rulesCard: {
    padding: Spacing.lg,
    marginBottom: Spacing.xl,
    width: '100%',
  },
  rulesTitle: {
    fontFamily: 'Inter-Bold',
    fontSize: FontSizes.lg,
    marginBottom: Spacing.md,
  },
  rulesText: {
    fontFamily: 'Inter-Regular',
    fontSize: FontSizes.sm,
    lineHeight: 20,
  },
  startButton: {
    width: '100%',
    height: 56,
  },
  endTitle: {
    fontFamily: 'Inter-Bold',
    fontSize: 28,
    textAlign: 'center',
    marginBottom: Spacing.md,
  },
  endSubtitle: {
    fontFamily: 'Inter-Regular',
    fontSize: FontSizes.lg,
    textAlign: 'center',
    marginBottom: Spacing.xl,
  },
  resultCard: {
    padding: Spacing.lg,
    alignItems: 'center',
    marginBottom: Spacing.xl,
    width: '100%',
  },
  winningsText: {
    fontFamily: 'Inter-Bold',
    fontSize: FontSizes.xl,
    marginTop: Spacing.sm,
  },
  endButtons: {
    flexDirection: 'row',
    gap: Spacing.md,
    width: '100%',
  },
  endButton: {
    flex: 1,
    height: 56,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.lg,
    paddingTop: 60,
    justifyContent: 'space-between',
  },
  headerInfo: {
    alignItems: 'center',
  },
  questionNumber: {
    fontFamily: 'Inter-Bold',
    fontSize: FontSizes.md,
  },
  currentPrize: {
    fontFamily: 'Inter-Bold',
    fontSize: FontSizes.lg,
  },
  livesContainer: {
    flexDirection: 'row',
    gap: Spacing.xs,
  },
  progressContainer: {
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
  },
  progressBar: {
    height: 4,
    backgroundColor: Colors.darkGray[700],
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.primary[500],
  },
  timerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.lg,
    gap: Spacing.xs,
  },
  timerText: {
    fontFamily: 'Inter-Bold',
    fontSize: FontSizes.lg,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.lg,
  },
  lifelineNotification: {
    backgroundColor: Colors.primary[500],
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.lg,
  },
  lifelineText: {
    fontFamily: 'Inter-Medium',
    fontSize: FontSizes.md,
    textAlign: 'center',
  },
  questionContainer: {
    marginBottom: Spacing.xl,
  },
  questionCard: {
    padding: Spacing.xl,
  },
  questionText: {
    fontFamily: 'Inter-Bold',
    fontSize: FontSizes.lg,
    textAlign: 'center',
    lineHeight: 24,
  },
  optionsContainer: {
    gap: Spacing.md,
    marginBottom: Spacing.xl,
  },
  optionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
    ...Shadows.medium,
  },
  optionLetter: {
    fontFamily: 'Inter-Bold',
    fontSize: FontSizes.lg,
    width: 32,
    textAlign: 'center',
    marginRight: Spacing.md,
  },
  optionText: {
    fontFamily: 'Inter-Medium',
    fontSize: FontSizes.md,
    flex: 1,
  },
  lifelinesContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: Spacing.lg,
  },
  lifelineButton: {
    width: 60,
    height: 60,
    borderRadius: BorderRadius.round,
    backgroundColor: Colors.darkGray[700],
    justifyContent: 'center',
    alignItems: 'center',
    ...Shadows.medium,
  },
  lifelineButtonText: {
    fontFamily: 'Inter-Bold',
    fontSize: FontSizes.lg,
  },
}); 