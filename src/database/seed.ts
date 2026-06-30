import { initDb } from './connection';
import { initializeSchema } from './schema';
import { queryOne, executeInsert } from './helpers';

const categories = [
  { name_ar: 'القرآن الكريم', name_en: 'Quran' },
  { name_ar: 'التفسير', name_en: 'Tafsir' },
  { name_ar: 'الحديث النبوي', name_en: 'Hadith' },
  { name_ar: 'السيرة النبوية', name_en: 'Seerah' },
  { name_ar: 'الأنبياء', name_en: 'Prophets' },
  { name_ar: 'الصحابة', name_en: 'Companions' },
  { name_ar: 'التاريخ الإسلامي', name_en: 'IslamicHistory' },
  { name_ar: 'الفقه', name_en: 'Fiqh' },
  { name_ar: 'العقيدة', name_en: 'Aqeedah' },
  { name_ar: 'الآداب الإسلامية', name_en: 'IslamicManners' },
  { name_ar: 'رمضان', name_en: 'Ramadan' },
  { name_ar: 'الحج والعمرة', name_en: 'HajjAndUmrah' },
];

const questions: {
  categoryName: string;
  question_ar: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  correct_answer: 'A' | 'B' | 'C' | 'D';
  difficulty: number;
  source?: string;
}[] = [
  // ====== القرآن الكريم ======
  { categoryName: 'القرآن الكريم', question_ar: 'كم عدد سور القرآن الكريم؟', option_a: '110', option_b: '114', option_c: '120', option_d: '124', correct_answer: 'B', difficulty: 1 },
  { categoryName: 'القرآن الكريم', question_ar: 'ما هي أطول سورة في القرآن؟', option_a: 'سورة آل عمران', option_b: 'سورة النساء', option_c: 'سورة البقرة', option_d: 'سورة الأعراف', correct_answer: 'C', difficulty: 1 },
  { categoryName: 'القرآن الكريم', question_ar: 'ما هي أقصر سورة في القرآن؟', option_a: 'سورة الناس', option_b: 'سورة الفلق', option_c: 'سورة الإخلاص', option_d: 'سورة الكوثر', correct_answer: 'D', difficulty: 1 },
  { categoryName: 'القرآن الكريم', question_ar: 'كم عدد آيات القرآن الكريم؟', option_a: '6236', option_b: '6000', option_c: '6348', option_d: '6200', correct_answer: 'A', difficulty: 2 },
  { categoryName: 'القرآن الكريم', question_ar: 'ما هي السورة التي تسمى قلب القرآن؟', option_a: 'سورة البقرة', option_b: 'سورة يس', option_c: 'سورة الرحمن', option_d: 'سورة الواقعة', correct_answer: 'B', difficulty: 2 },
  { categoryName: 'القرآن الكريم', question_ar: 'ما هي السورة التي تسمى عروس القرآن؟', option_a: 'سورة طه', option_b: 'سورة الكهف', option_c: 'سورة مريم', option_d: 'سورة الرحمن', correct_answer: 'D', difficulty: 3 },
  { categoryName: 'القرآن الكريم', question_ar: 'ما هي السورة التي تبدأ بـ "الم"؟', option_a: 'سورة البقرة', option_b: 'سورة آل عمران', option_c: 'سورة العنكبوت', option_d: 'جميع ما سبق', correct_answer: 'D', difficulty: 2 },
  { categoryName: 'القرآن الكريم', question_ar: 'في أي سورة وردت آية الكرسي؟', option_a: 'سورة آل عمران', option_b: 'سورة البقرة', option_c: 'سورة النساء', option_d: 'سورة المائدة', correct_answer: 'B', difficulty: 1 },
  { categoryName: 'القرآن الكريم', question_ar: 'ما هي السورة التي تسمى سنام القرآن؟', option_a: 'سورة البقرة', option_b: 'سورة يس', option_c: 'سورة الملك', option_d: 'سورة الرحمن', correct_answer: 'A', difficulty: 3 },
  { categoryName: 'القرآن الكريم', question_ar: 'كم عدد أجزاء القرآن الكريم؟', option_a: '20', option_b: '25', option_c: '30', option_d: '35', correct_answer: 'C', difficulty: 1 },
  { categoryName: 'القرآن الكريم', question_ar: 'ما هي السورة التي تسمى السبع المثاني؟', option_a: 'سورة البقرة', option_b: 'سورة الفاتحة', option_c: 'سورة الإخلاص', option_d: 'سورة الناس', correct_answer: 'B', difficulty: 2 },
  { categoryName: 'القرآن الكريم', question_ar: 'في أي سورة وردت قصة أصحاب الكهف؟', option_a: 'سورة الكهف', option_b: 'سورة الإسراء', option_c: 'سورة مريم', option_d: 'سورة طه', correct_answer: 'A', difficulty: 1 },
  { categoryName: 'القرآن الكريم', question_ar: 'ما هي السورة التي لا تبدأ بالبسملة؟', option_a: 'سورة الفاتحة', option_b: 'سورة التوبة', option_c: 'سورة النمل', option_d: 'سورة هود', correct_answer: 'B', difficulty: 2 },
  { categoryName: 'القرآن الكريم', question_ar: 'كم مرة ذكرت كلمة "الجنة" في القرآن؟', option_a: '66', option_b: '77', option_c: '88', option_d: '99', correct_answer: 'A', difficulty: 4 },
  { categoryName: 'القرآن الكريم', question_ar: 'ما هي السورة التي تسمى سورة النساء الصغرى؟', option_a: 'سورة الطلاق', option_b: 'سورة الممتحنة', option_c: 'سورة المجادلة', option_d: 'سورة الحجرات', correct_answer: 'A', difficulty: 4 },

  // ====== التفسير ======
  { categoryName: 'التفسير', question_ar: 'ما معنى "الفلق" في سورة الفلق؟', option_a: 'الليل', option_b: 'الصبح', option_c: 'الخير', option_d: 'النور', correct_answer: 'B', difficulty: 2, source: 'تفسير ابن كثير' },
  { categoryName: 'التفسير', question_ar: 'ما تفسير "الم" في بداية سورة البقرة؟', option_a: 'اسم من أسماء الله', option_b: 'حروف مقطعة لا يعلم تأويلها إلا الله', option_c: 'اختصار لكلمات', option_d: 'قسم من الله', correct_answer: 'B', difficulty: 2 },
  { categoryName: 'التفسير', question_ar: 'ما معنى "الصراط المستقيم"؟', option_a: 'طريق الجنة', option_b: 'طريق الحق والإسلام', option_c: 'طريق الأنبياء', option_d: 'طريق العلم', correct_answer: 'B', difficulty: 2 },
  { categoryName: 'التفسير', question_ar: 'ما معنى "الغاسق إذا وقب"؟', option_a: 'النهار إذا أضاء', option_b: 'الليل إذا دخل', option_c: 'القمر إذا خسف', option_d: 'النجم إذا سقط', correct_answer: 'B', difficulty: 3 },
  { categoryName: 'التفسير', question_ar: 'ما تفسير "النفاثات في العقد"؟', option_a: 'الساحرات', option_b: 'المؤمنات', option_c: 'المشركات', option_d: 'المنافقات', correct_answer: 'A', difficulty: 3 },
  { categoryName: 'التفسير', question_ar: 'ما معنى "الحمد لله رب العالمين"؟', option_a: 'الشكر لله خالق كل شيء', option_b: 'الثناء على الله رب الخلق أجمعين', option_c: 'تمجيد الله وحده', option_d: 'الدعاء لله', correct_answer: 'B', difficulty: 1 },
  { categoryName: 'التفسير', question_ar: 'ما تفسير قوله تعالى "والتين والزيتون"؟', option_a: 'فاكهتان', option_b: 'جبلان', option_c: 'شجرتان مباركتان', option_d: 'بلدان', correct_answer: 'B', difficulty: 3 },
  { categoryName: 'التفسير', question_ar: 'ما معنى "الكوثر"؟', option_a: 'نهر في الجنة', option_b: 'الخير الكثير', option_c: 'شجرة في الجنة', option_d: 'باب من أبواب الجنة', correct_answer: 'B', difficulty: 2 },
  { categoryName: 'التفسير', question_ar: 'ما تفسير "سورة الإخلاص"؟', option_a: 'توحيد الله وإخلاص العبادة له', option_b: 'قصة الأنبياء', option_c: 'أحكام الصلاة', option_d: 'فضل الصدقة', correct_answer: 'A', difficulty: 1 },
  { categoryName: 'التفسير', question_ar: 'ما معنى "الهاوية" في سورة القارعة؟', option_a: 'جبل في النار', option_b: 'النار', option_c: 'بئر في جهنم', option_d: 'واد في جهنم', correct_answer: 'C', difficulty: 4 },
  { categoryName: 'التفسير', question_ar: 'ما تفسير قوله "وعسى أن تكرهوا شيئاً وهو خير لكم"؟', option_a: 'ابتلاء من الله', option_b: 'حكمة الله في الأقدار', option_c: 'اختبار للإيمان', option_d: 'كل ما سبق', correct_answer: 'D', difficulty: 2 },
  { categoryName: 'التفسير', question_ar: 'ما معنى "سجين" في سورة المطففين؟', option_a: 'مكان في الجنة', option_b: 'كتاب الفجار', option_c: 'سجن في الأرض', option_d: 'جبل في النار', correct_answer: 'B', difficulty: 3 },
  { categoryName: 'التفسير', question_ar: 'ما تفسير "الطارق"؟', option_a: 'الملاك', option_b: 'النجم الثاقب', option_c: 'الصبح', option_d: 'الذي يطرق ليلاً', correct_answer: 'B', difficulty: 2 },
  { categoryName: 'التفسير', question_ar: 'ما معنى "الحاقة"؟', option_a: 'يوم القيامة', option_b: 'الحق الثابت', option_c: 'الساعة', option_d: 'أسماء يوم القيامة', correct_answer: 'D', difficulty: 3 },
  { categoryName: 'التفسير', question_ar: 'ما تفسير "الملائكة" في سورة فاطر؟', option_a: 'رسل الله', option_b: 'خلق من نور', option_c: 'لهم أجنحة', option_d: 'جميع ما سبق', correct_answer: 'D', difficulty: 1 },

  // ====== الحديث النبوي ======
  { categoryName: 'الحديث النبوي', question_ar: 'ما هو أول حديث في صحيح البخاري؟', option_a: 'حديث إنما الأعمال بالنيات', option_b: 'حديث الدين النصيحة', option_c: 'حديث بني الإسلام على خمس', option_d: 'حديث من يرد الله به خيرا', correct_answer: 'A', difficulty: 3 },
  { categoryName: 'الحديث النبوي', question_ar: 'من صلى الفجر في جماعة فكأنما صلى ...', option_a: 'نصف الليل', option_b: 'الليل كله', option_c: 'قيام ليلة', option_d: 'صلاة ليلة القدر', correct_answer: 'B', difficulty: 2 },
  { categoryName: 'الحديث النبوي', question_ar: 'قال النبي ﷺ: "بني الإسلام على خمس" ما هي؟', option_a: 'الصلاة والزكاة والصوم والحج والشهادتان', option_b: 'الصلاة والصدقة والصوم والحج والعمرة', option_c: 'الإيمان والصلاة والزكاة والحج والجهاد', option_d: 'الشهادتان والصلاة والزكاة والصوم والحج', correct_answer: 'D', difficulty: 1 },
  { categoryName: 'الحديث النبوي', question_ar: 'ما هو الحديث الذي يسمى "أم السنن"؟', option_a: 'حديث إنما الأعمال بالنيات', option_b: 'حديث الدين النصيحة', option_c: 'حديث الحلال بين والحرام بين', option_d: 'حديث من حسن إسلام المرء تركه ما لا يعنيه', correct_answer: 'A', difficulty: 3 },
  { categoryName: 'الحديث النبوي', question_ar: 'من يشفع لأمتي يوم القيامة كما ورد في الحديث؟', option_a: 'أبو بكر الصديق', option_b: 'النبي ﷺ', option_c: 'جبرائيل', option_d: 'الملائكة', correct_answer: 'B', difficulty: 1 },
  { categoryName: 'الحديث النبوي', question_ar: 'ما معنى "من يرد الله به خيرا يفقهه في الدين"؟', option_a: 'يعطيه مالاً', option_b: 'يفهمه الدين', option_c: 'يرزقه الصحة', option_d: 'يكرمه في الدنيا', correct_answer: 'B', difficulty: 2 },
  { categoryName: 'الحديث النبوي', question_ar: 'قال النبي ﷺ: "لا يؤمن أحدكم حتى يحب لأخيه..."', option_a: 'ما يحب لأبيه', option_b: 'ما يحب لنفسه', option_c: 'الخير كله', option_d: 'الجنة', correct_answer: 'B', difficulty: 1 },
  { categoryName: 'الحديث النبوي', question_ar: 'من أول مصنف في الحديث النبوي؟', option_a: 'الإمام البخاري', option_b: 'الإمام مسلم', option_c: 'ابن ماجه', option_d: 'الإمام مالك في الموطأ', correct_answer: 'D', difficulty: 4 },
  { categoryName: 'الحديث النبوي', question_ar: 'كم عدد أحاديث صحيح البخاري تقريباً؟', option_a: '6000', option_b: '7263', option_c: '5000', option_d: '9000', correct_answer: 'B', difficulty: 3 },
  { categoryName: 'الحديث النبوي', question_ar: 'ما معنى "الحديث القدسي"؟', option_a: 'حديث صحابي عن النبي', option_b: 'حديث يرويه النبي عن ربه', option_c: 'حديث ضعيف', option_d: 'حديث متواتر', correct_answer: 'B', difficulty: 2 },
  { categoryName: 'الحديث النبوي', question_ar: 'من روى أكثر الأحاديث عن النبي ﷺ؟', option_a: 'عائشة', option_b: 'أبو هريرة', option_c: 'ابن عباس', option_d: 'أنس بن مالك', correct_answer: 'B', difficulty: 1 },
  { categoryName: 'الحديث النبوي', question_ar: 'ما حكم العمل بالحديث الضعيف؟', option_a: 'يجوز مطلقاً', option_b: 'لا يجوز', option_c: 'يجوز في فضائل الأعمال بشروط', option_d: 'يكره', correct_answer: 'C', difficulty: 3 },
  { categoryName: 'الحديث النبوي', question_ar: 'قال النبي ﷺ: "اتق الله حيثما كنت وأتبع السيئة الحسنة..."', option_a: 'تكن من المتقين', option_b: 'تمحها', option_c: 'وخالق الناس بخلق حسن', option_d: 'تدخل الجنة', correct_answer: 'C', difficulty: 2 },
  { categoryName: 'الحديث النبوي', question_ar: 'أي من صحاح الحديث يعتبر ثاني أصح كتاب بعد القرآن؟', option_a: 'صحيح البخاري', option_b: 'صحيح مسلم', option_c: 'سنن الترمذي', option_d: 'سنن أبي داود', correct_answer: 'A', difficulty: 1 },
  { categoryName: 'الحديث النبوي', question_ar: 'ما هو "الإسناد" في الحديث؟', option_a: 'نص الحديث', option_b: 'سلسلة الرواة', option_c: 'حكم الحديث', option_d: 'الجرح والتعديل', correct_answer: 'B', difficulty: 2 },

  // ====== السيرة النبوية ======
  { categoryName: 'السيرة النبوية', question_ar: 'في أي عام ولد النبي محمد ﷺ؟', option_a: '568م', option_b: '570م', option_c: '571م', option_d: '572م', correct_answer: 'C', difficulty: 2 },
  { categoryName: 'السيرة النبوية', question_ar: 'أين ولد النبي محمد ﷺ؟', option_a: 'المدينة المنورة', option_b: 'مكة المكرمة', option_c: 'الطائف', option_d: 'تبوك', correct_answer: 'B', difficulty: 1 },
  { categoryName: 'السيرة النبوية', question_ar: 'كم كان عمر النبي ﷺ عندما نزل عليه الوحي؟', option_a: '30 سنة', option_b: '35 سنة', option_c: '40 سنة', option_d: '45 سنة', correct_answer: 'C', difficulty: 1 },
  { categoryName: 'السيرة النبوية', question_ar: 'من هو الملك الذي نزل بالوحي على النبي ﷺ؟', option_a: 'ميكائيل', option_b: 'إسرافيل', option_c: 'جبرائيل', option_d: 'مالك', correct_answer: 'C', difficulty: 1 },
  { categoryName: 'السيرة النبوية', question_ar: 'في أي غار نزل الوحي أول مرة؟', option_a: 'غار ثور', option_b: 'غار حراء', option_c: 'غار جبل النور', option_d: 'غار أبي قبيس', correct_answer: 'B', difficulty: 1 },
  { categoryName: 'السيرة النبوية', question_ar: 'كم سنة مكث النبي ﷺ في الدعوة في مكة؟', option_a: '10 سنوات', option_b: '13 سنة', option_c: '15 سنة', option_d: '20 سنة', correct_answer: 'B', difficulty: 2 },
  { categoryName: 'السيرة النبوية', question_ar: 'ما اسم أول هجرة في الإسلام؟', option_a: 'الهجرة إلى المدينة', option_b: 'الهجرة إلى الحبشة', option_c: 'الهجرة إلى الطائف', option_d: 'الهجرة إلى الشام', correct_answer: 'B', difficulty: 2 },
  { categoryName: 'السيرة النبوية', question_ar: 'من هو أول من آمن من الصبيان؟', option_a: 'عبد الله بن عمر', option_b: 'علي بن أبي طالب', option_c: 'أسامة بن زيد', option_d: 'الحسن بن علي', correct_answer: 'B', difficulty: 2 },
  { categoryName: 'السيرة النبوية', question_ar: 'ما اسم العام الذي ولد فيه النبي ﷺ؟', option_a: 'عام الفيل', option_b: 'عام الحزن', option_c: 'عام الوفود', option_d: 'عام الفتح', correct_answer: 'A', difficulty: 2 },
  { categoryName: 'السيرة النبوية', question_ar: 'كم كان عمر النبي ﷺ عندما توفيت أمه آمنة؟', option_a: '4 سنوات', option_b: '6 سنوات', option_c: '8 سنوات', option_d: '10 سنوات', correct_answer: 'B', difficulty: 2 },
  { categoryName: 'السيرة النبوية', question_ar: 'من هي مرضعة النبي ﷺ؟', option_a: 'أم أيمن', option_b: 'حليمة السعدية', option_c: 'ثويبة', option_d: 'سلمى', correct_answer: 'B', difficulty: 2 },
  { categoryName: 'السيرة النبوية', question_ar: 'في أي سنة كانت غزوة بدر؟', option_a: '1 هـ', option_b: '2 هـ', option_c: '3 هـ', option_d: '4 هـ', correct_answer: 'B', difficulty: 1 },
  { categoryName: 'السيرة النبوية', question_ar: 'كم عدد المسلمين في غزوة بدر؟', option_a: '500', option_b: '313', option_c: '1000', option_d: '700', correct_answer: 'B', difficulty: 2 },
  { categoryName: 'السيرة النبوية', question_ar: 'في أي عام توفي النبي ﷺ؟', option_a: '10 هـ', option_b: '11 هـ', option_c: '12 هـ', option_d: '13 هـ', correct_answer: 'B', difficulty: 1 },
  { categoryName: 'السيرة النبوية', question_ar: 'أين دفن النبي محمد ﷺ؟', option_a: 'البقيع', option_b: 'المسجد الحرام', option_c: 'حجرة عائشة في المسجد النبوي', option_d: 'مسجد قباء', correct_answer: 'C', difficulty: 1 },
  { categoryName: 'السيرة النبوية', question_ar: 'ما اسم الرحلة التي قام بها النبي ﷺ من مكة إلى القدس؟', option_a: 'الإسراء', option_b: 'المعراج', option_c: 'الهجرة', option_d: 'العمرة', correct_answer: 'A', difficulty: 2 },

  // ====== الأنبياء ======
  { categoryName: 'الأنبياء', question_ar: 'كم لبث نوح عليه السلام يدعو قومه؟', option_a: '500 سنة', option_b: '950 سنة', option_c: '800 سنة', option_d: '700 سنة', correct_answer: 'B', difficulty: 2 },
  { categoryName: 'الأنبياء', question_ar: 'من هو أول الأنبياء؟', option_a: 'نوح', option_b: 'آدم', option_c: 'إدريس', option_d: 'إبراهيم', correct_answer: 'B', difficulty: 1 },
  { categoryName: 'الأنبياء', question_ar: 'من هو النبي الذي ابتلعه الحوت؟', option_a: 'موسى', option_b: 'هارون', option_c: 'يونس', option_d: 'يوسف', correct_answer: 'C', difficulty: 1 },
  { categoryName: 'الأنبياء', question_ar: 'من هو النبي الذي شق الله له البحر؟', option_a: 'إبراهيم', option_b: 'موسى', option_c: 'عيسى', option_d: 'يوسف', correct_answer: 'B', difficulty: 1 },
  { categoryName: 'الأنبياء', question_ar: 'من هو النبي الذي ألقي في النار فلم تحرقه؟', option_a: 'إسحاق', option_b: 'إبراهيم', option_c: 'إسماعيل', option_d: 'يعقوب', correct_answer: 'B', difficulty: 1 },
  { categoryName: 'الأنبياء', question_ar: 'من هو النبي الذي آتاه الله ملكاً عظيماً؟', option_a: 'داود', option_b: 'سليمان', option_c: 'يوسف', option_d: 'محمد', correct_answer: 'B', difficulty: 1 },
  { categoryName: 'الأنبياء', question_ar: 'من هو النبي الذي كان يعرف بتفسير الأحلام؟', option_a: 'يعقوب', option_b: 'يوسف', option_c: 'إبراهيم', option_d: 'إسحاق', correct_answer: 'B', difficulty: 1 },
  { categoryName: 'الأنبياء', question_ar: 'من هو النبي الذي بنى السفينة؟', option_a: 'إبراهيم', option_b: 'موسى', option_c: 'نوح', option_d: 'هود', correct_answer: 'C', difficulty: 1 },
  { categoryName: 'الأنبياء', question_ar: 'من هو النبي الذي كان يعمل حداداً؟', option_a: 'داود', option_b: 'سليمان', option_c: 'أيوب', option_d: 'زكريا', correct_answer: 'A', difficulty: 3 },
  { categoryName: 'الأنبياء', question_ar: 'كم عدد الأنبياء والرسل المذكورين في القرآن؟', option_a: '25', option_b: '30', option_c: '20', option_d: '35', correct_answer: 'A', difficulty: 2 },
  { categoryName: 'الأنبياء', question_ar: 'من هو النبي الذي كان يخاطب قومه باللغة العربية؟', option_a: 'موسى', option_b: 'عيسى', option_c: 'صالح', option_d: 'هود', correct_answer: 'D', difficulty: 3 },
  { categoryName: 'الأنبياء', question_ar: 'من هو النبي الذي آتاه الله آية الناقة؟', option_a: 'شعيب', option_b: 'صالح', option_c: 'لوط', option_d: 'هود', correct_answer: 'B', difficulty: 2 },
  { categoryName: 'الأنبياء', question_ar: 'من هو النبي الذي دعا على قومه فقال "رب لا تذر على الأرض من الكافرين دياراً"؟', option_a: 'هود', option_b: 'نوح', option_c: 'صالح', option_d: 'شعيب', correct_answer: 'B', difficulty: 3 },
  { categoryName: 'الأنبياء', question_ar: 'من هو النبي الذي أيده الله بروح القدس؟', option_a: 'موسى', option_b: 'إبراهيم', option_c: 'عيسى', option_d: 'يحيى', correct_answer: 'C', difficulty: 2 },
  { categoryName: 'الأنبياء', question_ar: 'من هو النبي الذي قال له الله "وَاصْبِرْ عَلَىٰ مَا أَصَابَكَ"؟', option_a: 'أيوب', option_b: 'محمد', option_c: 'نوح', option_d: 'لقمان', correct_answer: 'A', difficulty: 2 },
  { categoryName: 'الأنبياء', question_ar: 'من هو النبي الذي كان كليم الله؟', option_a: 'إبراهيم', option_b: 'موسى', option_c: 'محمد', option_d: 'عيسى', correct_answer: 'B', difficulty: 2 },

  // ====== الصحابة ======
  { categoryName: 'الصحابة', question_ar: 'من هو أول من آمن من الرجال؟', option_a: 'عمر بن الخطاب', option_b: 'أبو بكر الصديق', option_c: 'علي بن أبي طالب', option_d: 'عثمان بن عفان', correct_answer: 'B', difficulty: 1 },
  { categoryName: 'الصحابة', question_ar: 'من هو أول من آمن من النساء؟', option_a: 'فاطمة الزهراء', option_b: 'خديجة بنت خويلد', option_c: 'عائشة', option_d: 'أم سلمة', correct_answer: 'B', difficulty: 1 },
  { categoryName: 'الصحابة', question_ar: 'من هو أول من آمن من الصبيان؟', option_a: 'الحسن بن علي', option_b: 'علي بن أبي طالب', option_c: 'عبد الله بن الزبير', option_d: 'أسامة بن زيد', correct_answer: 'B', difficulty: 2 },
  { categoryName: 'الصحابة', question_ar: 'من هو الخليفة الراشد الأول؟', option_a: 'عمر بن الخطاب', option_b: 'أبو بكر الصديق', option_c: 'عثمان بن عفان', option_d: 'علي بن أبي طالب', correct_answer: 'B', difficulty: 1 },
  { categoryName: 'الصحابة', question_ar: 'من هو الفاروق؟', option_a: 'عثمان بن عفان', option_b: 'عمر بن الخطاب', option_c: 'علي بن أبي طالب', option_d: 'أبو بكر الصديق', correct_answer: 'B', difficulty: 1 },
  { categoryName: 'الصحابة', question_ar: 'من هو ذو النورين؟', option_a: 'علي بن أبي طالب', option_b: 'عثمان بن عفان', option_c: 'عمر بن الخطاب', option_d: 'أبو بكر الصديق', correct_answer: 'B', difficulty: 2 },
  { categoryName: 'الصحابة', question_ar: 'من هو أسد الله؟', option_a: 'عمر بن الخطاب', option_b: 'حمزة بن عبد المطلب', option_c: 'خالد بن الوليد', option_d: 'علي بن أبي طالب', correct_answer: 'B', difficulty: 2 },
  { categoryName: 'الصحابة', question_ar: 'من هو سيد الشهداء؟', option_a: 'خالد بن الوليد', option_b: 'حمزة بن عبد المطلب', option_c: 'عمر بن الخطاب', option_d: 'جعفر بن أبي طالب', correct_answer: 'B', difficulty: 2 },
  { categoryName: 'الصحابة', question_ar: 'من هو الصحابي الذي لقب بـ "الطيار في الجنة"؟', option_a: 'عبد الله بن رواحة', option_b: 'جعفر بن أبي طالب', option_c: 'زيد بن حارثة', option_d: 'خالد بن الوليد', correct_answer: 'B', difficulty: 2 },
  { categoryName: 'الصحابة', question_ar: 'من هو الصحابي الجليل الذي كان يسمى "سيف الله المسلول"؟', option_a: 'خالد بن الوليد', option_b: 'سعد بن أبي وقاص', option_c: 'الزبير بن العوام', option_d: 'أبو عبيدة بن الجراح', correct_answer: 'A', difficulty: 2 },
  { categoryName: 'الصحابة', question_ar: 'من هو الصحابي الذي اهتز لموته عرش الرحمن؟', option_a: 'عمر بن الخطاب', option_b: 'سعد بن معاذ', option_c: 'حمزة بن عبد المطلب', option_d: 'مصعب بن عمير', correct_answer: 'B', difficulty: 3 },
  { categoryName: 'الصحابة', question_ar: 'من هو آخر من توفي من الصحابة؟', option_a: 'أنس بن مالك', option_b: 'أبو الطفيل', option_c: 'جابر بن عبد الله', option_d: 'عبد الله بن عمر', correct_answer: 'B', difficulty: 4 },
  { categoryName: 'الصحابة', question_ar: 'من هي الملقبة بـ "الحوراء"؟', option_a: 'عائشة', option_b: 'فاطمة الزهراء', option_c: 'خديجة', option_d: 'مريم', correct_answer: 'B', difficulty: 3 },
  { categoryName: 'الصحابة', question_ar: 'من كان كاتب الوحي للنبي ﷺ؟', option_a: 'أبو بكر الصديق', option_b: 'زيد بن ثابت', option_c: 'علي بن أبي طالب', option_d: 'عبد الله بن مسعود', correct_answer: 'B', difficulty: 2 },
  { categoryName: 'الصحابة', question_ar: 'من هو الصحابي الذي جمع القرآن في مصحف واحد؟', option_a: 'أبو بكر الصديق', option_b: 'عمر بن الخطاب', option_c: 'زيد بن ثابت', option_d: 'عثمان بن عفان', correct_answer: 'C', difficulty: 2 },

  // ====== التاريخ الإسلامي ======
  { categoryName: 'التاريخ الإسلامي', question_ar: 'في أي سنة كانت غزوة أحد؟', option_a: '2 هـ', option_b: '3 هـ', option_c: '4 هـ', option_d: '5 هـ', correct_answer: 'B', difficulty: 2 },
  { categoryName: 'التاريخ الإسلامي', question_ar: 'في أي سنة كانت غزوة الخندق؟', option_a: '3 هـ', option_b: '4 هـ', option_c: '5 هـ', option_d: '6 هـ', correct_answer: 'C', difficulty: 2 },
  { categoryName: 'التاريخ الإسلامي', question_ar: 'في أي سنة تم فتح مكة؟', option_a: '6 هـ', option_b: '7 هـ', option_c: '8 هـ', option_d: '9 هـ', correct_answer: 'C', difficulty: 2 },
  { categoryName: 'التاريخ الإسلامي', question_ar: 'من هو مؤسس الدولة الأموية؟', option_a: 'عبد الملك بن مروان', option_b: 'معاوية بن أبي سفيان', option_c: 'الوليد بن عبد الملك', option_d: 'عمر بن عبد العزيز', correct_answer: 'B', difficulty: 2 },
  { categoryName: 'التاريخ الإسلامي', question_ar: 'في أي عام كانت معركة حطين؟', option_a: '583 هـ', option_b: '584 هـ', option_c: '585 هـ', option_d: '583 هـ', correct_answer: 'A', difficulty: 4 },
  { categoryName: 'التاريخ الإسلامي', question_ar: 'من هو القائد الذي فتح الأندلس؟', option_a: 'طارق بن زياد', option_b: 'موسى بن نصير', option_c: 'عبد الرحمن الداخل', option_d: 'الحجاج بن يوسف', correct_answer: 'A', difficulty: 2 },
  { categoryName: 'التاريخ الإسلامي', question_ar: 'من هو الخليفة العباسي الأول؟', option_a: 'أبو جعفر المنصور', option_b: 'أبو العباس السفاح', option_c: 'هارون الرشيد', option_d: 'المأمون', correct_answer: 'B', difficulty: 3 },
  { categoryName: 'التاريخ الإسلامي', question_ar: 'في أي عام سقطت الأندلس؟', option_a: '897 هـ', option_b: '898 هـ', option_c: '899 هـ', option_d: '900 هـ', correct_answer: 'A', difficulty: 4 },
  { categoryName: 'التاريخ الإسلامي', question_ar: 'من هو القائد الذي فتح القدس في العصر الإسلامي الأول؟', option_a: 'صلاح الدين الأيوبي', option_b: 'عمر بن الخطاب', option_c: 'خالد بن الوليد', option_d: 'أبو عبيدة بن الجراح', correct_answer: 'B', difficulty: 2 },
  { categoryName: 'التاريخ الإسلامي', question_ar: 'من هو صلاح الدين الأيوبي؟', option_a: 'خليفة عباسي', option_b: 'قائد أموي', option_c: 'قائد أيوبي حرر القدس', option_d: 'والي من قبل الفاطميين', correct_answer: 'C', difficulty: 1 },
  { categoryName: 'التاريخ الإسلامي', question_ar: 'في أي عام كانت معركة القادسية؟', option_a: '14 هـ', option_b: '15 هـ', option_c: '16 هـ', option_d: '18 هـ', correct_answer: 'A', difficulty: 3 },
  { categoryName: 'التاريخ الإسلامي', question_ar: 'من هو قائد معركة القادسية؟', option_a: 'خالد بن الوليد', option_b: 'سعد بن أبي وقاص', option_c: 'أبو عبيدة بن الجراح', option_d: 'القعقاع بن عمرو', correct_answer: 'B', difficulty: 3 },
  { categoryName: 'التاريخ الإسلامي', question_ar: 'ما هي أول عاصمة للدولة الإسلامية بعد الهجرة؟', option_a: 'مكة', option_b: 'المدينة المنورة', option_c: 'دمشق', option_d: 'بغداد', correct_answer: 'B', difficulty: 1 },
  { categoryName: 'التاريخ الإسلامي', question_ar: 'في أي عام هاجر النبي ﷺ إلى المدينة؟', option_a: '620م', option_b: '621م', option_c: '622م', option_d: '623م', correct_answer: 'C', difficulty: 2 },
  { categoryName: 'التاريخ الإسلامي', question_ar: 'من هو الخليفة الذي أمر ببناء قبة الصخرة؟', option_a: 'معاوية بن أبي سفيان', option_b: 'عبد الملك بن مروان', option_c: 'الوليد بن عبد الملك', option_d: 'عمر بن عبد العزيز', correct_answer: 'B', difficulty: 4 },

  // ====== الفقه ======
  { categoryName: 'الفقه', question_ar: 'ما حكم أكل لحم الخنزير في الإسلام؟', option_a: 'مكروه', option_b: 'حرام', option_c: 'حلال', option_d: 'مباح', correct_answer: 'B', difficulty: 1 },
  { categoryName: 'الفقه', question_ar: 'كم عدد أركان الصلاة؟', option_a: '12', option_b: '14', option_c: '17', option_d: '13', correct_answer: 'B', difficulty: 3 },
  { categoryName: 'الفقه', question_ar: 'ما هي شروط صحة الصلاة؟', option_a: 'الوضوء والوقت والقبلة والنية', option_b: 'الطهارة والنية والوقت والقبلة', option_c: 'الإيمان والوضوء والوقت', option_d: 'النية والطهارة فقط', correct_answer: 'B', difficulty: 2 },
  { categoryName: 'الفقه', question_ar: 'ما حكم شرب الخمر في الإسلام؟', option_a: 'مكروه', option_b: 'حرام', option_c: 'حلال بقلة', option_d: 'مباح', correct_answer: 'B', difficulty: 1 },
  { categoryName: 'الفقه', question_ar: 'ما مقدار زكاة المال؟', option_a: '5%', option_b: '10%', option_c: '2.5%', option_d: '1%', correct_answer: 'C', difficulty: 2 },
  { categoryName: 'الفقه', question_ar: 'من هم الذين تجب عليهم الزكاة؟', option_a: 'الفقراء فقط', option_b: 'الأغنياء الذين يملكون النصاب', option_c: 'كل المسلمين', option_d: 'الرجال فقط', correct_answer: 'B', difficulty: 2 },
  { categoryName: 'الفقه', question_ar: 'ما حكم صلاة الجمعة؟', option_a: 'سنة', option_b: 'فرض عين', option_c: 'فرض كفاية', option_d: 'مستحبة', correct_answer: 'B', difficulty: 1 },
  { categoryName: 'الفقه', question_ar: 'ما هي مبطلات الصيام؟', option_a: 'الأكل والشرب والجماع عمداً', option_b: 'النوم', option_c: 'السفر', option_d: 'المرض', correct_answer: 'A', difficulty: 2 },
  { categoryName: 'الفقه', question_ar: 'ما حكم الربا في الإسلام؟', option_a: 'مكروه', option_b: 'حرام', option_c: 'حلال', option_d: 'مباح بشروط', correct_answer: 'B', difficulty: 1 },
  { categoryName: 'الفقه', question_ar: 'كم عدد ركعات صلاة الفجر؟', option_a: 'ركعتان', option_b: 'ثلاث', option_c: 'أربع', option_d: 'واحدة', correct_answer: 'A', difficulty: 1 },
  { categoryName: 'الفقه', question_ar: 'ما حكم التيمم؟', option_a: 'بديل عن الوضوء عند فقد الماء', option_b: 'سنة فقط', option_c: 'واجب عند كل صلاة', option_d: 'لا يجوز إلا في السفر', correct_answer: 'A', difficulty: 2 },
  { categoryName: 'الفقه', question_ar: 'ما هي عدد الطواف حول الكعبة؟', option_a: '5 أشواط', option_b: '7 أشواط', option_c: '8 أشواط', option_d: '6 أشواط', correct_answer: 'B', difficulty: 1 },
  { categoryName: 'الفقه', question_ar: 'ما هو الحد الأدنى للنصاب في زكاة الذهب؟', option_a: '85 جراماً', option_b: '100 جرام', option_c: '50 جراماً', option_d: '200 جرام', correct_answer: 'A', difficulty: 3 },
  { categoryName: 'الفقه', question_ar: 'هل يجوز الجمع بين الصلاتين في السفر؟', option_a: 'نعم يجوز', option_b: 'لا يجوز', option_c: 'مكروه', option_d: 'حرام', correct_answer: 'A', difficulty: 2 },
  { categoryName: 'الفقه', question_ar: 'ما هي شروط الحجاب الشرعي؟', option_a: 'تغطية العورة وعدم الزينة', option_b: 'تغطية الوجه فقط', option_c: 'لبس الأسود فقط', option_d: 'تغطية الرأس مع كشف الوجه والكفين', correct_answer: 'D', difficulty: 3 },

  // ====== العقيدة ======
  { categoryName: 'العقيدة', question_ar: 'ما هو أول واجب على المكلف؟', option_a: 'الصلاة', option_b: 'الشهادتان', option_c: 'الصوم', option_d: 'الحج', correct_answer: 'B', difficulty: 2 },
  { categoryName: 'العقيدة', question_ar: 'كم عدد أركان الإيمان؟', option_a: '5', option_b: '6', option_c: '7', option_d: '4', correct_answer: 'B', difficulty: 1 },
  { categoryName: 'العقيدة', question_ar: 'كم عدد أركان الإسلام؟', option_a: '5', option_b: '6', option_c: '7', option_d: '4', correct_answer: 'A', difficulty: 1 },
  { categoryName: 'العقيدة', question_ar: 'ما هو الإحسان؟', option_a: 'فعل الخيرات', option_b: 'أن تعبد الله كأنك تراه', option_c: 'الإخلاص في العمل', option_d: 'بر الوالدين', correct_answer: 'B', difficulty: 2 },
  { categoryName: 'العقيدة', question_ar: 'من أول من سجد من الملائكة لآدم؟', option_a: 'ميكائيل', option_b: 'إبليس', option_c: 'جبرائيل', option_d: 'جميع الملائكة', correct_answer: 'D', difficulty: 2 },
  { categoryName: 'العقيدة', question_ar: 'ما هو الشرك بالله؟', option_a: 'الكفر بالله', option_b: 'صرف العبادة لغير الله', option_c: 'النفاق', option_d: 'ترك الصلاة', correct_answer: 'B', difficulty: 2 },
  { categoryName: 'العقيدة', question_ar: 'ما هي أعظم آية في القرآن؟', option_a: 'آية الكرسي', option_b: 'آخر آية من البقرة', option_c: 'أول آية من آل عمران', option_d: 'آية النور', correct_answer: 'A', difficulty: 1 },
  { categoryName: 'العقيدة', question_ar: 'من هو أول الرسل؟', option_a: 'نوح', option_b: 'إبراهيم', option_c: 'آدم', option_d: 'محمد', correct_answer: 'A', difficulty: 2 },
  { categoryName: 'العقيدة', question_ar: 'ما معنى "لا إله إلا الله"؟', option_a: 'لا خالق إلا الله', option_b: 'لا معبود بحق إلا الله', option_c: 'لا رازق إلا الله', option_d: 'لا رب إلا الله', correct_answer: 'B', difficulty: 1 },
  { categoryName: 'العقيدة', question_ar: 'ما هو القدر؟', option_a: 'علم الله المسبق بما سيكون', option_b: 'ما يكتبه الله للإنسان', option_c: 'تقدير الله لمقادير الخلق', option_d: 'جميع ما سبق', correct_answer: 'D', difficulty: 2 },
  { categoryName: 'العقيدة', question_ar: 'ما هي الصراط؟', option_a: 'جسر في الجنة', option_b: 'جسر على جهنم', option_c: 'جسر على النار إلى الجنة', option_d: 'باب الجنة', correct_answer: 'C', difficulty: 2 },
  { categoryName: 'العقيدة', question_ar: 'كم عدد أسماء الله الحسنى؟', option_a: '100', option_b: '99', option_c: '90', option_d: '1000', correct_answer: 'B', difficulty: 1 },
  { categoryName: 'العقيدة', question_ar: 'من هو النبي الخاتم؟', option_a: 'عيسى', option_b: 'موسى', option_c: 'محمد ﷺ', option_d: 'إبراهيم', correct_answer: 'C', difficulty: 1 },
  { categoryName: 'العقيدة', question_ar: 'ما هو الميزان يوم القيامة؟', option_a: 'ميزان حسنات وسيئات', option_b: 'ميزان حقيقي', option_c: 'ميزان الأعمال', option_d: 'ميزان العدل', correct_answer: 'C', difficulty: 2 },
  { categoryName: 'العقيدة', question_ar: 'أين يكون المسلمون يوم القيامة؟', option_a: 'في أرض المحشر', option_b: 'في الجنة', option_c: 'في النار', option_d: 'في البرزخ', correct_answer: 'A', difficulty: 2 },

  // ====== الآداب الإسلامية ======
  { categoryName: 'الآداب الإسلامية', question_ar: 'ماذا نقول إذا عطس أحد؟', option_a: 'بارك الله فيك', option_b: 'يرحمكم الله', option_c: 'الحمد لله', option_d: 'شفاك الله', correct_answer: 'B', difficulty: 1 },
  { categoryName: 'الآداب الإسلامية', question_ar: 'ما هو دعاء دخول المنزل؟', option_a: 'بسم الله ولجنا وبسم الله خرجنا', option_b: 'اللهم افتح لي أبواب رحمتك', option_c: 'رب أدخلني مدخل صدق', option_d: 'الحمد لله الذي عافاني', correct_answer: 'A', difficulty: 2 },
  { categoryName: 'الآداب الإسلامية', question_ar: 'ماذا نقول عند رؤية من ابتلي بمصيبة؟', option_a: 'لا حول ولا قوة إلا بالله', option_b: 'الحمد لله الذي عافاني مما ابتلاك به', option_c: 'إنا لله وإنا إليه راجعون', option_d: 'سبحان الله', correct_answer: 'B', difficulty: 3 },
  { categoryName: 'الآداب الإسلامية', question_ar: 'ما حكم الغيبة في الإسلام؟', option_a: 'مباحة', option_b: 'مكروهة', option_c: 'حرام', option_d: 'مباحة بين الأصدقاء', correct_answer: 'C', difficulty: 1 },
  { categoryName: 'الآداب الإسلامية', question_ar: 'ماذا نقول عند دخول الخلاء؟', option_a: 'اللهم إني أعوذ بك من الخبث والخبائث', option_b: 'بسم الله', option_c: 'الحمد لله', option_d: 'لا إله إلا الله', correct_answer: 'A', difficulty: 2 },
  { categoryName: 'الآداب الإسلامية', question_ar: 'ماذا نقول عند الخروج من الخلاء؟', option_a: 'بسم الله', option_b: 'غفرانك', option_c: 'الحمد لله الذي أذهب عني الأذى وعافاني', option_d: 'لا إله إلا الله', correct_answer: 'C', difficulty: 2 },
  { categoryName: 'الآداب الإسلامية', question_ar: 'ما هو حكم الكذب في الإسلام؟', option_a: 'مباح للمزاح', option_b: 'حرام إلا في حالات محددة', option_c: 'مكروه', option_d: 'مباح', correct_answer: 'B', difficulty: 2 },
  { categoryName: 'الآداب الإسلامية', question_ar: 'ماذا يقول المسلم عند المصيبة؟', option_a: 'لا حول ولا قوة إلا بالله', option_b: 'إنا لله وإنا إليه راجعون', option_c: 'الحمد لله على كل حال', option_d: 'اللهم أجرني في مصيبتي', correct_answer: 'B', difficulty: 1 },
  { categoryName: 'الآداب الإسلامية', question_ar: 'ما حكم سب الدين أو المقدسات؟', option_a: 'ذنب كبير', option_b: 'كفر', option_c: 'معصية', option_d: 'مكروه', correct_answer: 'B', difficulty: 2 },
  { categoryName: 'الآداب الإسلامية', question_ar: 'ماذا نقول عند النوم؟', option_a: 'باسمك ربي وضعت جنبي وبك أرفعه', option_b: 'اللهم إني أعوذ بك من عذاب القبر', option_c: 'سبحان الله 33 مرة', option_d: 'لا إله إلا الله', correct_answer: 'A', difficulty: 2 },
  { categoryName: 'الآداب الإسلامية', question_ar: 'ما هو حكم التبذير والإسراف؟', option_a: 'مباح', option_b: 'حرام', option_c: 'مكروه', option_d: 'سنة', correct_answer: 'B', difficulty: 1 },
  { categoryName: 'الآداب الإسلامية', question_ar: 'من هم الجيران الذين أوصى بهم النبي ﷺ؟', option_a: 'الجار القريب', option_b: 'الجار البعيد', option_c: 'الجار المسلم والكافر', option_d: 'الجار المسلم فقط', correct_answer: 'C', difficulty: 2 },
  { categoryName: 'الآداب الإسلامية', question_ar: 'ما حكم قطع الرحم؟', option_a: 'مباح', option_b: 'حرام وكبيرة من الكبائر', option_c: 'مكروه', option_d: 'مباح إذا أساء الأقارب', correct_answer: 'B', difficulty: 2 },
  { categoryName: 'الآداب الإسلامية', question_ar: 'ماذا نقول عند الأكل؟', option_a: 'الحمد لله', option_b: 'بسم الله', option_c: 'بسم الله الرحمن الرحيم', option_d: 'اللهم بارك لنا فيه', correct_answer: 'B', difficulty: 1 },
  { categoryName: 'الآداب الإسلامية', question_ar: 'ماذا نقول بعد الفراغ من الأكل؟', option_a: 'بسم الله', option_b: 'الحمد لله الذي أطعمني وسقاني', option_c: 'شكراً لله', option_d: 'اللهم زدنا', correct_answer: 'B', difficulty: 2 },

  // ====== رمضان ======
  { categoryName: 'رمضان', question_ar: 'كم يوماً يصوم المسلم في رمضان؟', option_a: '28 يوماً', option_b: '30 يوماً', option_c: '29 أو 30 يوماً', option_d: '31 يوماً', correct_answer: 'C', difficulty: 1 },
  { categoryName: 'رمضان', question_ar: 'في أي سنة فرض صيام رمضان؟', option_a: '1 هـ', option_b: '2 هـ', option_c: '3 هـ', option_d: '4 هـ', correct_answer: 'B', difficulty: 2 },
  { categoryName: 'رمضان', question_ar: 'ما هي ليلة القدر؟', option_a: 'ليلة في رمضان', option_b: 'أفضل من ألف شهر', option_c: 'ليلة يغفر فيها الذنوب', option_d: 'جميع ما سبق', correct_answer: 'D', difficulty: 1 },
  { categoryName: 'رمضان', question_ar: 'في أي العشر الأواخر من رمضان تطلب ليلة القدر؟', option_a: 'العشر الأوائل', option_b: 'العشر الأواخر', option_c: 'العشر الأوسط', option_d: 'الأيام البيض', correct_answer: 'B', difficulty: 1 },
  { categoryName: 'رمضان', question_ar: 'ما هي صلاة القيام في رمضان؟', option_a: 'صلاة التراويح', option_b: 'صلاة التهجد', option_c: 'صلاة الليل', option_d: 'جميع ما سبق', correct_answer: 'A', difficulty: 2 },
  { categoryName: 'رمضان', question_ar: 'ما حكم الإفطار في رمضان بدون عذر؟', option_a: 'مكروه', option_b: 'حرام وكبيرة من الكبائر', option_c: 'مباح', option_d: 'مباح مع القضاء', correct_answer: 'B', difficulty: 1 },
  { categoryName: 'رمضان', question_ar: 'ما هو حكم السحور؟', option_a: 'فرض', option_b: 'سنة مؤكدة', option_c: 'مستحب', option_d: 'مباح', correct_answer: 'B', difficulty: 2 },
  { categoryName: 'رمضان', question_ar: 'متى يبدأ وقت الصيام؟', option_a: 'طلوع الشمس', option_b: 'الفجر الصادق', option_c: 'الفجر الكاذب', option_d: 'شروق الشمس', correct_answer: 'B', difficulty: 1 },
  { categoryName: 'رمضان', question_ar: 'ما هي زكاة الفطر؟', option_a: 'صدقة في رمضان', option_b: 'واجبة على كل مسلم', option_c: 'صاع من طعام', option_d: 'جميع ما سبق', correct_answer: 'D', difficulty: 2 },
  { categoryName: 'رمضان', question_ar: 'متى تخرج زكاة الفطر؟', option_a: 'أول رمضان', option_b: 'قبل صلاة العيد', option_c: 'بعد العيد', option_d: 'في أي وقت', correct_answer: 'B', difficulty: 2 },
  { categoryName: 'رمضان', question_ar: 'ما مقدار زكاة الفطر؟', option_a: 'نصف صاع', option_b: 'صاع من الطعام', option_c: 'كيلو جرام', option_d: 'مد واحد', correct_answer: 'B', difficulty: 2 },
  { categoryName: 'رمضان', question_ar: 'ما حكم صلاة التراويح؟', option_a: 'فرض', option_b: 'سنة مؤكدة', option_c: 'مستحبة', option_d: 'واجبة', correct_answer: 'B', difficulty: 2 },
  { categoryName: 'رمضان', question_ar: 'كم عدد ركعات صلاة التراويح عادة؟', option_a: '8 ركعات', option_b: '20 ركعة', option_c: '11 أو 13 ركعة', option_d: 'جميع ما سبق جائز', correct_answer: 'D', difficulty: 3 },
  { categoryName: 'رمضان', question_ar: 'ما هو دعاء الإفطار؟', option_a: 'اللهم لك صمت', option_b: 'ذهب الظمأ وابتلت العروق وثبت الأجر إن شاء الله', option_c: 'بسم الله', option_d: 'الحمد لله', correct_answer: 'B', difficulty: 2 },
  { categoryName: 'رمضان', question_ar: 'من هم الذين رخص لهم الإفطار في رمضان؟', option_a: 'المسافر والمريض', option_b: 'الحائض والنفساء', option_c: 'كبير السن الذي لا يطيق', option_d: 'جميع ما سبق', correct_answer: 'D', difficulty: 2 },

  // ====== الحج والعمرة ======
  { categoryName: 'الحج والعمرة', question_ar: 'ما هو الركن الأعظم في الحج؟', option_a: 'طواف الإفاضة', option_b: 'الوقوف بعرفة', option_c: 'السعي بين الصفا والمروة', option_d: 'رمي الجمرات', correct_answer: 'B', difficulty: 2 },
  { categoryName: 'الحج والعمرة', question_ar: 'كم مرة فرض الحج على المسلم؟', option_a: 'مرة واحدة في العمر', option_b: 'كل عام', option_c: 'مرة كل خمس سنوات', option_d: 'مرتين في العمر', correct_answer: 'A', difficulty: 1 },
  { categoryName: 'الحج والعمرة', question_ar: 'ما هو الإحرام؟', option_a: 'نية الدخول في الحج أو العمرة', option_b: 'لبس ملابس خاصة', option_c: 'التلبية', option_d: 'الغسل', correct_answer: 'A', difficulty: 2 },
  { categoryName: 'الحج والعمرة', question_ar: 'ما هو الطواف؟', option_a: 'المشي بين الصفا والمروة', option_b: 'الدوران حول الكعبة', option_c: 'الوقوف بعرفة', option_d: 'رمي الجمرات', correct_answer: 'B', difficulty: 1 },
  { categoryName: 'الحج والعمرة', question_ar: 'ما هو السعي؟', option_a: 'الدوران حول الكعبة', option_b: 'المشي بين الصفا والمروة', option_c: 'الذهاب إلى منى', option_d: 'الوقوف بعرفة', correct_answer: 'B', difficulty: 1 },
  { categoryName: 'الحج والعمرة', question_ar: 'ما هي الجمرات الثلاث؟', option_a: 'جمرة العقبة والوسطى والصغرى', option_b: 'جمرة الكبرى والوسطى والصغرى', option_c: 'جمرة منى وعرفة ومزدلفة', option_d: 'جمرة العقبة فقط', correct_answer: 'A', difficulty: 2 },
  { categoryName: 'الحج والعمرة', question_ar: 'ما هو يوم عرفة؟', option_a: 'اليوم التاسع من ذي الحجة', option_b: 'اليوم العاشر من ذي الحجة', option_c: 'اليوم الثامن من ذي الحجة', option_d: 'اليوم الحادي عشر', correct_answer: 'A', difficulty: 1 },
  { categoryName: 'الحج والعمرة', question_ar: 'ما معنى التلبية؟', option_a: 'دعاء خاص', option_b: 'قول لبيك اللهم لبيك', option_c: 'ذكر الله', option_d: 'الصلاة على النبي', correct_answer: 'B', difficulty: 2 },
  { categoryName: 'الحج والعمرة', question_ar: 'ما هو الحجر الأسود؟', option_a: 'حجر من الجنة', option_b: 'حجر كريم', option_c: 'حجر عادي', option_d: 'حجر منزل من السماء', correct_answer: 'A', difficulty: 2 },
  { categoryName: 'الحج والعمرة', question_ar: 'ما هي مزدلفة؟', option_a: 'مكان في منى', option_b: 'مكان بين عرفة ومنى', option_c: 'مكان في مكة', option_d: 'مكان في المدينة', correct_answer: 'B', difficulty: 2 },
  { categoryName: 'الحج والعمرة', question_ar: 'كم عدد أيام الحج؟', option_a: '4 أيام', option_b: '5 أيام', option_c: '6 أيام', option_d: '7 أيام', correct_answer: 'C', difficulty: 3 },
  { categoryName: 'الحج والعمرة', question_ar: 'ما هو يوم النحر؟', option_a: 'يوم عرفة', option_b: 'اليوم العاشر من ذي الحجة', option_c: 'اليوم الحادي عشر', option_d: 'اليوم الثاني عشر', correct_answer: 'B', difficulty: 2 },
  { categoryName: 'الحج والعمرة', question_ar: 'ما هي أيام التشريق؟', option_a: '8 و 9 و 10 ذي الحجة', option_b: '11 و 12 و 13 ذي الحجة', option_c: '10 و 11 و 12 ذي الحجة', option_d: '9 و 10 و 11 ذي الحجة', correct_answer: 'B', difficulty: 3 },
  { categoryName: 'الحج والعمرة', question_ar: 'ما حكم العمرة؟', option_a: 'فرض', option_b: 'سنة مؤكدة', option_c: 'واجبة', option_d: 'مستحبة', correct_answer: 'B', difficulty: 2 },
  { categoryName: 'الحج والعمرة', question_ar: 'ما هو طواف الوداع؟', option_a: 'طواف العمرة', option_b: 'طواف آخر الحج', option_c: 'طواف القدوم', option_d: 'طواف الإفاضة', correct_answer: 'B', difficulty: 2 },
  { categoryName: 'الحج والعمرة', question_ar: 'من أول من بنى الكعبة؟', option_a: 'النبي محمد ﷺ', option_b: 'إبراهيم عليه السلام', option_c: 'إسماعيل عليه السلام', option_d: 'آدم عليه السلام', correct_answer: 'D', difficulty: 3 },
];

export async function seedDatabase(): Promise<void> {
  await initDb();
  initializeSchema();

  const row = queryOne('SELECT COUNT(*) as count FROM categories');
  if (row && (row.count as number) > 0) {
    console.log('✅ قاعدة البيانات تحتوي بالفعل على بيانات. تخطي البذر.');
    return;
  }

  const categoryIds: Record<string, number> = {};

  for (const cat of categories) {
    const id = executeInsert('INSERT INTO categories (name_ar, name_en) VALUES (?, ?)', [cat.name_ar, cat.name_en]);
    categoryIds[cat.name_ar] = id;
  }

  let count = 0;
  for (const q of questions) {
    const catId = categoryIds[q.categoryName];
    if (catId) {
      executeInsert(
        'INSERT INTO questions (category_id, question_ar, option_a, option_b, option_c, option_d, correct_answer, difficulty, source) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [catId, q.question_ar, q.option_a, q.option_b, q.option_c, q.option_d, q.correct_answer, q.difficulty, q.source || null],
      );
      count++;
    }
  }

  console.log(`✅ تم بذر قاعدة البيانات بنجاح! ${count} سؤال في ${Object.keys(categoryIds).length} تصنيف.`);
}

if (require.main === module) {
  (async () => {
    await initDb();
    seedDatabase();
  })();
}
