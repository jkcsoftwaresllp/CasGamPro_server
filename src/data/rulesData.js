// This file contains all the rules in different languages and types.

import { ROLES } from "../database/schema.js";

const type = ROLES[3];
const lnEng = "ENG";
const lnHin = "HIN";

export const rulesData = [
  // English Rules
  {
    rule_code: "RULE_001_ENG",
    type: type,
    language: lnEng,
    rule: " Please give a few minutes to understand rules of CasGamPro here, as best as you can.",
  },
  {
    rule_code: "RULE_002_ENG",
    type: type,
    language: lnEng,
    rule: "Change your password after you log in.",
  },
  {
    rule_code: "RULE_003_ENG",
    type: type,
    language: lnEng,
    rule: "All the advance bets will be accepted after the toss.",
  },
  {
    rule_code: "RULE_004_ENG",
    type: type,
    language: lnEng,
    rule: "For every Match 0/- coins will be charged.",
  },
  {
    rule_code: "RULE_005_ENG",
    type: type,
    language: lnEng,
    rule: "0/- coins will be charged if user will not play any Market bet or Session bet in a match.",
  },
  {
    rule_code: "RULE_006_ENG",
    type: type,
    language: lnEng,
    rule: "If game is cancelled or tie then all the deals will be cancelled and the transactions will be done on session and fancy which are completed.",
  },
  {
    rule_code: "RULE_007_ENG",
    type: type,
    language: lnEng,
    rule: "The deal of the match is at least 2000.0 and maximum 1000000.0 and the deal of session is at least 1000.0 and maximun 50000.0.",
  },
  {
    rule_code: "RULE_008_ENG",
    type: type,
    language: lnEng,
    rule: "Live draw is settled on TV score, rate is never changed This is good chance for users.",
  },
  {
    rule_code: "RULE_009_ENG",
    type: type,
    language: lnEng,
    rule: "During the match, please bet only after confirming the deal. Once the deal is confirmed, it cannot be changed or removed Responsibility of every deal is yours.",
  },
  {
    rule_code: "RULE_010_ENG",
    type: type,
    language: lnEng,
    rule: "All transactions will be validated from ledger only.",
  },
  {
    rule_code: "RULE_011_ENG",
    type: type,
    language: lnEng,
    rule: "Transactions will be canceled in case the result is stuck in the casino.",
  },
  {
    rule_code: "RULE_012_ENG",
    type: type,
    language: lnEng,
    rule: "In an inside-out game 25% will be paid out when the first card is opened.",
  },
  {
    rule_code: "RULE_013_ENG",
    type: type,
    language: lnEng,
    rule: "Also read the casino rules before playing the game.",
  },
  {
    rule_code: "RULE_014_ENG",
    type: type,
    language: lnEng,
    rule: "Arguments of any kind will not be accepted in the casino.",
  },
  {
    rule_code: "RULE_015_ENG",
    type: type,
    language: lnEng,
    rule: "It'll be user's responsibility for internet connection problem.",
  },
  {
    rule_code: "RULE_016_ENG",
    type: type,
    language: lnEng,
    rule: "Winnings will be allocated according to the final winning side and categories shown on the screen at the end of each round.",
  },

  // HINdi Rules
  {
    rule_code: "RULE_001_HIN",
    type: type,
    language: lnHin,
    rule: "कृपया CasGamPro के नियमों को समझने के लिए यहां कुछ मिनट दें, और अपने अनुसार समझ लें। लॉग इन करने के बाद अपना पासवर्ड बदल लें.",
  },
  {
    rule_code: "RULE_002_HIN",
    type: type,
    language: lnHin,
    rule: "लॉग इन करने के बाद अपना पासवर्ड बदल लें।",
  },
  {
    rule_code: "RULE_003_HIN",
    type: type,
    language: lnHin,
    rule: "प्रत्येक गेम के लिए 0/- कॉइन्स चार्ज रहेगा।",
  },
  {
    rule_code: "RULE_004_HIN",
    type: type,
    language: lnHin,
    rule: "यदि आप मेच या सेशन का एक भी सोदा नहीं करते हो, ऐसे में आपसे 0/- कॉइन्स का चार्ज लिया जायेगा।",
  },
  {
    rule_code: "RULE_005_HIN",
    type: type,
    language: lnHin,
    rule: "सभी एडवांस सौदे टॉस के बाद लिए जाएंगे।",
  },
  {
    rule_code: "RULE_006_HIN",
    type: type,
    language: lnHin,
    rule: "खेल रद्द या टाई होने पर सभी सौदे रद्द कर दिए जाएंगे और लेनदेन सेशन और फैंसी जो पूरा हो गया है उस पर किया जाएगा।",
  },
  {
    rule_code: "RULE_007_HIN",
    type: type,
    language: lnHin,
    rule: "मैच का सौदा कम से कम 2000.0 और अधिकतम 1000000.0 हे और सेशन का सोदा कम से कम 1000.0 और अधिकतम 50000.0 है।",
  },
  {
    rule_code: "RULE_008_HIN",
    type: type,
    language: lnHin,
    rule: "लाइव ड्रा टीवी स्कोर पर निर्भर है। दर कभी नहीं बदली जाती है। यह यूजर के लिए अच्छा मौका है।",
  },
  {
    rule_code: "RULE_009_HIN",
    type: type,
    language: lnHin,
    rule: "मैच के दौरान भाव को देख और समझ कर ही सौदा करें। किये गए किसी भी सौदे को हटाया या बदला नहीं जायेगा। सभी सौदे के लिए आप स्वयं जिम्मेवार हैं।",
  },
  {
    rule_code: "RULE_010_HIN",
    type: type,
    language: lnHin,
    rule: "यहाँ सभी सोदे लेजर से मान्य किये जायेंगे।",
  },
  {
    rule_code: "RULE_011_HIN",
    type: type,
    language: lnHin,
    rule: "कैसीनो में परिणाम फंसने की स्थिति में लेनदेन रद्द कर दिया जाएगा|",
  },
  {
    rule_code: "RULE_012_HIN",
    type: type,
    language: lnHin,
    rule: "इनसाइड आउट गेम में पहला कार्ड खोले जाने पर 25% का भुगतान किया जाएगा।",
  },
  {
    rule_code: "RULE_013_HIN",
    type: type,
    language: lnHin,
    rule: "गेम खेलने से पहले कैसीनो के नियम भी पढ़ें।",
  },
  {
    rule_code: "RULE_014_HIN",
    type: type,
    language: lnHin,
    rule: "कैसीनों में किसी भी प्रकार के तर्क स्वीकार नहीं किए जाएंगे।",
  },
  {
    rule_code: "RULE_015_HIN",
    type: type,
    language: lnHin,
    rule: "इंटरनेट कनेक्शन प्रॉब्लम की जिम्मेवारी आपकी रहेगी।",
  },
  {
    rule_code: "RULE_016_HIN",
    type: type,
    language: lnHin,
    rule: "हर राउंड के अंत में स्क्रीन पर दिखाए गए अंतिम विजेता और श्रेणियों के आधार पर जीत का वितरण किया जाएगा।",
  },
];
