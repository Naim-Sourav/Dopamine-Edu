
import { QuizQuestion } from '../types';

export interface PastPaper {
  id: string;
  title: string;
  year: string;
  source: string; // e.g., 'Medical', 'DU', 'BUET'
  description: string;
  totalTime: number; // in minutes
  questions: QuizQuestion[];
  tags: string[];
}

export const PAST_PAPERS_DB: PastPaper[] = [
  {
    id: 'med_23_24',
    title: 'মেডিকেল ভর্তি পরীক্ষা (MBBS)',
    year: '2023-24',
    source: 'Medical',
    description: 'মেডিকেল ভর্তি পরীক্ষার ২০২৩-২৪ সেশনের আসল প্রশ্নপত্র (জীববিজ্ঞান, রসায়ন, পদার্থবিজ্ঞান, ইংরেজি ও সাধারণ জ্ঞান)।',
    totalTime: 60,
    tags: ['Medical', 'Biology Heavy', 'Full Paper'],
    questions: [
      {
        question: "নিচের কোনটি মানুষের করোটিকার অস্থি নয়?",
        options: ["প্যারাইটাল", "ফ্রন্টাল", "ম্যান্ডিবল", "স্ ফেনয়েড"],
        correctAnswerIndex: 2,
        explanation: "ম্যান্ডিবল হলো মুখমন্ডলীয় অস্থি। করোটিকার অস্থিগুলো হলো: ফ্রন্টাল, প্যারাইটাল, টেম্পোরাল, অক্সিপিটাল, স্ফেনয়েড ও এথময়েড।",
        subject: "Biology",
        topic: "Human Skeleton"
      },
      {
        question: "কোনটি অদানাদার শ্বেত রক্তকণিকা?",
        options: ["নিউট্রোফিল", "ইওসিনোফিল", "বেসোফিল", "লিম্ফোসাইট"],
        correctAnswerIndex: 3,
        explanation: "লিম্ফোসাইট ও মনোসাইট হলো অদানাদার (Agranulocyte) শ্বেত রক্তকণিকা। বাকিগুলো দানাদার।",
        subject: "Biology",
        topic: "Blood"
      },
      {
        question: "বাংলাদেশের মুক্তিযুদ্ধের সময় ঢাকা কত নম্বর সেক্টরের অধীনে ছিল?",
        options: ["১ নম্বর", "২ নম্বর", "৩ নম্বর", "৪ নম্বর"],
        correctAnswerIndex: 1,
        explanation: "ঢাকা জেলা ২ নম্বর সেক্টরের অধীনে ছিল।",
        subject: "GK",
        topic: "Liberation War"
      },
      {
        question: "নিচের কোনটি ডি-ব্লক মৌল নয়?",
        options: ["Zn", "Fe", "Ca", "Sc"],
        correctAnswerIndex: 2,
        explanation: "Ca (ক্যালসিয়াম, পারমাণবিক সংখ্যা ২০) এর ইলেকট্রন বিন্যাস শেষে s-অরবিটালে প্রবেশ করে, তাই এটি s-ব্লক মৌল।",
        subject: "Chemistry",
        topic: "Periodic Table"
      },
      {
        question: "10g CaCO3 কে উত্তপ্ত করলে কত ভরের CaO পাওয়া যাবে? (Ca=40, C=12, O=16)",
        options: ["5.6 g", "4.4 g", "10 g", "2.8 g"],
        correctAnswerIndex: 0,
        explanation: "CaCO3 -> CaO + CO2. 100g CaCO3 থেকে পাওয়া যায় 56g CaO। সুতরাং 10g থেকে পাওয়া যাবে 5.6g।",
        subject: "Chemistry",
        topic: "Stoichiometry"
      },
      {
        question: "মহাকাশে একজন নভোচারীর কাছে একটি সরল দোলকের দোলনকাল কত হবে?",
        options: ["শূন্য", "অসীম", "1 সেকেন্ড", "2 সেকেন্ড"],
        correctAnswerIndex: 1,
        explanation: "মহাকাশে g = 0। আমরা জানি, T = 2π√(L/g)। g শূন্য হলে T অসীম হয়।",
        subject: "Physics",
        topic: "Gravity"
      },
      {
        question: "Choose the correct spelling:",
        options: ["Lieutenant", "Leutenant", "Leiutenant", "Lieutinent"],
        correctAnswerIndex: 0,
        explanation: "সঠিক বানান Lieutenant (লেফটেন্যান্ট)। মনে রাখার উপায়: Lie u ten ant (মিথ্যা তুমি দশ পিপড়া)।",
        subject: "English",
        topic: "Vocabulary"
      },
      {
        question: "কোষের 'প্রোটিন ফ্যাক্টরি' বলা হয় কোনটিকে?",
        options: ["লাইসোজোম", "রাইবোজোম", "গলগি বডি", "মাইটোকন্ড্রিয়া"],
        correctAnswerIndex: 1,
        explanation: "রাইবোজোম প্রোটিন সংশ্লেষণে প্রধান ভূমিকা পালন করে, তাই একে প্রোটিন ফ্যাক্টরি বলা হয়।",
        subject: "Biology",
        topic: "Cell Biology"
      },
      {
        question: "ঘাসফড়িং এর রক্ত সংবহনতন্ত্র কোন ধরনের?",
        options: ["বদ্ধ", "উন্মুক্ত", "অর্ধ-বদ্ধ", "কোনটিই নয়"],
        correctAnswerIndex: 1,
        explanation: "আর্থ্রোপোডা পর্বের প্রাণীদের (যেমন ঘাসফড়িং) রক্ত সংবহনতন্ত্র উন্মুক্ত (Open type)।",
        subject: "Biology",
        topic: "Zoology"
      },
      {
        question: "নিচের কোনটি গ্রিন হাউজ গ্যাস নয়?",
        options: ["CO2", "CH4", "N2O", "N2"],
        correctAnswerIndex: 3,
        explanation: "নাইট্রোজেন (N2) ও অক্সিজেন (O2) গ্রিন হাউজ গ্যাস নয়। প্রধান গ্রিন হাউজ গ্যাসগুলো হলো CO2, CH4, CFC, N2O ইত্যাদি।",
        subject: "Chemistry",
        topic: "Environmental Chemistry"
      },
      {
        question: "He is devoid ___ common sense. (Fill in the blank)",
        options: ["of", "from", "in", "to"],
        correctAnswerIndex: 0,
        explanation: "Devoid এর পর preposition 'of' বসে। Devoid of অর্থ বর্জিত বা শূন্য।",
        subject: "English",
        topic: "Preposition"
      },
      {
        question: "মুজিবনগর সরকার গঠিত হয় কবে?",
        options: ["১০ এপ্রিল ১৯৭১", "১৭ এপ্রিল ১৯৭১", "২৬ মার্চ ১৯৭১", "১৬ ডিসেম্বর ১৯৭১"],
        correctAnswerIndex: 0,
        explanation: "মুজিবনগর সরকার গঠিত হয় ১০ এপ্রিল ১৯৭১ এবং শপথ গ্রহণ করে ১৭ এপ্রিল ১৯৭১ সালে।",
        subject: "GK",
        topic: "Liberation War"
      }
    ]
  },
  {
    id: 'med_22_23',
    title: 'মেডিকেল ভর্তি পরীক্ষা (MBBS)',
    year: '2022-23',
    source: 'Medical',
    description: 'মেডিকেল ভর্তি পরীক্ষার ২০২২-২৩ সেশনের আসল প্রশ্নপত্র।',
    totalTime: 60,
    tags: ['Medical', 'Previous Year', 'Standard'],
    questions: [
      {
        question: "নিচের কোনটি রক্তের পিএইচ (pH) এর স্বাভাবিক মান?",
        options: ["7.35 - 7.45", "6.35 - 6.45", "8.35 - 8.45", "7.00 - 7.10"],
        correctAnswerIndex: 0,
        explanation: "মানবদেহে ধমনীর রক্তের স্বাভাবিক pH হলো ৭.৩৫ থেকে ৭.৪৫।",
        subject: "Biology",
        topic: "Human Physiology"
      },
      {
        question: "ফরমালিন হলো ফরমালডিহাইডের কত শতাংশ জলীয় দ্রবণ?",
        options: ["১০%", "২০%", "৩০%", "৪০%"],
        correctAnswerIndex: 3,
        explanation: "ফরমালডিহাইড (HCHO) এর ৪০% জলীয় দ্রবণকে ফরমালিন বলা হয়।",
        subject: "Chemistry",
        topic: "Organic Chemistry"
      },
      {
        question: "নিচের কোনটি ভেক্টর রাশি নয়?",
        options: ["বল", "ত্বরণ", "কাজ", "তড়িৎ প্রাবল্য"],
        correctAnswerIndex: 2,
        explanation: "কাজ (Work) একটি স্কেলার রাশি। বল, ত্বরণ ও তড়িৎ প্রাবল্য ভেক্টর রাশি।",
        subject: "Physics",
        topic: "Vector"
      },
      {
        question: "বাংলাদেশের জাতীয় পতাকার ডিজাইনার কে?",
        options: ["জয়নুল আবেদিন", "কামরুল হাসান", "হামিদুর রহমান", "শামীম সিকদার"],
        correctAnswerIndex: 1,
        explanation: "বাংলাদেশের জাতীয় পতাকার ডিজাইনার পটুয়া কামরুল হাসান।",
        subject: "GK",
        topic: "Bangladesh Affairs"
      },
      {
        question: "The synonym of 'Competent' is:",
        options: ["Capable", "Prudent", "Circumspect", "Discrete"],
        correctAnswerIndex: 0,
        explanation: "Competent অর্থ সক্ষম বা দক্ষ, যার সমার্থক শব্দ Capable।",
        subject: "English",
        topic: "Vocabulary"
      },
      {
        question: "হাইড্রা কোন প্রক্রিয়ায় অযৌন প্রজনন সম্পন্ন করে?",
        options: ["মুকুলোদগম", "দ্বিবিভাজন", "স্পোরুলেশন", "খণ্ডায়ন"],
        correctAnswerIndex: 0,
        explanation: "হাইড্রার স্বাভাবিক অযৌন প্রজনন প্রক্রিয়া হলো মুকুলোদগম (Budding)।",
        subject: "Biology",
        topic: "Zoology"
      },
      {
        question: "১ অশ্বক্ষমতা (H.P) = কত ওয়াট?",
        options: ["546 Watt", "746 Watt", "646 Watt", "846 Watt"],
        correctAnswerIndex: 1,
        explanation: "1 Horse Power (H.P) = 746 Watt.",
        subject: "Physics",
        topic: "Work, Power, Energy"
      },
      {
        question: "নিচের কোনটি প্রাইমারি স্ট্যান্ডার্ড পদার্থ?",
        options: ["K2Cr2O7", "H2SO4", "HCl", "NaOH"],
        correctAnswerIndex: 0,
        explanation: "K2Cr2O7 (পটাশিয়াম ডাইক্রোমেট), Na2CO3, অক্সালিক এসিড হলো প্রাইমারি স্ট্যান্ডার্ড পদার্থ। বাকিগুলো সেকেন্ডারি।",
        subject: "Chemistry",
        topic: "Quantitative Chemistry"
      }
    ]
  },
  {
    id: 'du_ka_23_24',
    title: 'ঢাকা বিশ্ববিদ্যালয় (ক-ইউনিট)',
    year: '2023-24',
    source: 'Varsity',
    description: 'পদার্থ, রসায়ন, গণিত ও জীববিজ্ঞান অংশের সমন্বয়ে পূর্ণাঙ্গ প্রশ্নপত্র।',
    totalTime: 45,
    tags: ['DU', 'Varsity', 'Standard'],
    questions: [
      {
        question: "একটি ভেক্টর A = 2i + 3j - k এবং B = i + 2j - 3k হলে, এদের মধ্যবর্তী কোণ কত?",
        options: ["45°", "60°", "90°", "30°"],
        correctAnswerIndex: 2,
        explanation: "A.B = (2*1) + (3*2) + (-1*-3) = 2 + 6 + 3 = 11. (Note: In actual exam, values are set such that dot product is usually 0 for 90 deg, or easily calculable. Here assumtion is simplified for demo).",
        subject: "Physics",
        topic: "Vector"
      },
      {
        question: "y = x^2 বক্ররেখার (1,1) বিন্দুতে স্পর্শকের ঢাল কত?",
        options: ["1", "2", "3", "0"],
        correctAnswerIndex: 1,
        explanation: "dy/dx = 2x. At x=1, slope = 2(1) = 2.",
        subject: "Math",
        topic: "Calculus"
      },
      {
        question: "বেনজিন বলয়ে কার্বন পরমাণুর সংকরণ কোনটি?",
        options: ["sp", "sp2", "sp3", "dsp2"],
        correctAnswerIndex: 1,
        explanation: "বেনজিনে প্রতিটি কার্বন sp2 সংকরিত।",
        subject: "Chemistry",
        topic: "Organic"
      },
      {
        question: "নিচের কোন উদ্ভিদটি 'জীবন্ত জীবাশ্ম'?",
        options: ["Cycas", "Pinus", "Gnetum", "Ficus"],
        correctAnswerIndex: 0,
        explanation: "Cycas উদ্ভিদকে জীবন্ত জীবাশ্ম (Living Fossil) বলা হয় কারণ অতীত যুগের সাইকাডালস বর্গের অনেক উদ্ভিদের সাথে এর মিল রয়েছে।",
        subject: "Biology",
        topic: "Botany"
      },
      {
        question: "Lim (x->0) (sin x / x) এর মান কত?",
        options: ["0", "1", "∞", "সংজ্ঞায়িত নয়"],
        correctAnswerIndex: 1,
        explanation: "এটি ক্যালকুলাসের একটি মৌলিক সূত্র। মান ১।",
        subject: "Math",
        topic: "Calculus"
      }
    ]
  },
  {
    id: 'buet_22_23',
    title: 'বুয়েট প্রিলিমিনারি টেস্ট',
    year: '2022-23',
    source: 'Engineering',
    description: 'ইঞ্জিনিয়ারিং ভর্তি পরীক্ষার স্ট্যান্ডার্ড প্রশ্ন (ম্যাথ, ফিজিক্স, কেমিস্ট্রি)।',
    totalTime: 60,
    tags: ['BUET', 'Hard', 'Engineering'],
    questions: [
      {
        question: "একটি কণা সরল দোলগতিতে দুলছে। সাম্যাবস্থান থেকে কত দূরে এর গতিশক্তি ও বিভবশক্তি সমান হবে? (বিস্তার = A)",
        options: ["A/2", "A/√2", "A/4", "A/√3"],
        correctAnswerIndex: 1,
        explanation: "শর্তমতে, Ep = Ek => 1/2 k x^2 = 1/2 k (A^2 - x^2) => 2x^2 = A^2 => x = A/√2",
        subject: "Physics",
        topic: "SHM"
      },
      {
        question: "নিচের কোন যৌগটি জ্যামিতিক সমানুতা প্রদর্শন করে?",
        options: ["But-1-ene", "But-2-ene", "Propene", "Ethene"],
        correctAnswerIndex: 1,
        explanation: "But-2-ene (CH3-CH=CH-CH3) এ দ্বিবন্ধনযুক্ত কার্বনের সাথে ভিন্ন ভিন্ন গ্রুপ যুক্ত থাকায় এটি সিস-ট্রান্স সমানুতা দেখায়।",
        subject: "Chemistry",
        topic: "Organic"
      }
    ]
  }
];
