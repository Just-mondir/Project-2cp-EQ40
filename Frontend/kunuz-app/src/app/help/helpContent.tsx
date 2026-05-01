"use client";

import React from "react";
import Link from "next/link";
import { Church, FileX, MessagesSquare, Search, SquarePen, UserCog } from "lucide-react";
import LeftSidebar from "@/components/LeftSidebar";
import BackButton from "@/components/BackButton";
import { useLocaleSettings } from "@/components/LocaleProvider";

type HelpLocale = "en" | "fr" | "ar";

export type HelpSection = {
  heading: string;
  steps: React.ReactNode[];
  noteTitle?: string;
  notes?: React.ReactNode[];
};

export type HelpTopic = {
  id: string;
  title: string;
  pageTitle: string;
  description: string;
  href: string;
  keywords: string[];
  icon: React.ReactNode;
  sections: HelpSection[];
};

const iconProps = { size: 34, color: "white", strokeWidth: 1.5 };

function localeKey(locale: string): HelpLocale {
  if (locale?.toLowerCase().startsWith("ar")) return "ar";
  if (locale?.toLowerCase().startsWith("fr")) return "fr";
  return "en";
}

export function helpDirection(locale: string) {
  return localeKey(locale) === "ar" ? "rtl" : "ltr";
}

export function helpTextAlign(locale: string) {
  return helpDirection(locale) === "rtl" ? "right" : "left";
}

function strong(text: string) {
  return <strong>"{text}"</strong>;
}

const HELP_COPY: Record<HelpLocale, { heroTitle: string; heroSubtitle: string; searchPlaceholder: string; viewFullPage: string; welcome: string; topics: Omit<HelpTopic, "icon">[] }> = {
  en: {
    heroTitle: "Help & User Guide",
    heroSubtitle: "Navigate and contribute to preserving Algeria's architectural legacy",
    searchPlaceholder: "Search help topics ...",
    viewFullPage: "View full page →",
    welcome: "Welcome to the help page!",
    topics: [
      {
        id: "account",
        title: "Account Management",
        pageTitle: "Account Management",
        description: "login, signup, profile edit.",
        href: "/help/Account-management",
        keywords: ["sign up", "signup", "register", "create account", "login", "password", "remember me", "edit profile", "profile picture", "username", "email"],
        sections: [
          { heading: "How to Sign Up", steps: [<>Click {strong("Sign Up")}</>, "Fill your email, password and confirm it.", <>Click {strong("Next")}</>, <>If you already have an account, click {strong("Login")}</>] },
          { heading: "How to Login", steps: [<>If you already have an account, click {strong("Login")}.</>, "Enter your username.", "Enter your password.", <>Check {strong("Remember Me")} to stay logged in.</>, <>Click {strong("Login")} to access your account.</>], noteTitle: "Forgot Your Password?", notes: [<>Click {strong("Forgot Password?")}.</>, <>Select {strong("Reset")}.</>, "Follow the instructions sent to your email to create a new password.", <>You can log in instantly using <strong>Google</strong>, or create a new account with {strong("Sign Up")}.</>] },
          { heading: "How to Edit Your Profile?", steps: ["Go to your Profile page.", <>Click on {strong("Edit Profile")}.</>, "Update your personal information.", "Change your profile picture if needed.", <>Click {strong("Done")}.</>] },
        ],
      },
      {
        id: "creating",
        title: "Creating Posts",
        pageTitle: "Creating a Publication!",
        description: "posting, tagging, photos, and visibility.",
        href: "/help/Creating-posts",
        keywords: ["create post", "publication", "add post", "title", "description", "upload", "image", "historical period", "region", "visibility"],
        sections: [{ heading: "How to Create a Publication?", steps: ["After logging in, go to your Home Page.", <>Click on the {strong("Create Publication")} button.</>, "Enter a clear title for your post.", "Write a detailed description explaining the monument or topic.", "Upload relevant images to illustrate your publication.", "Add a short picture description if required.", "Choose the appropriate labels: Post Type, Historical Period, Monument Type, Region.", "Add the location of the monument.", "Select the visibility settings, public or private.", <>Click {strong("Done")} to share your post.</>] }],
      },
      {
        id: "interaction",
        title: "Interaction with posts",
        pageTitle: "Interaction with Posts!",
        description: "like, comment, report.",
        href: "/help/Interaction-withe-posts",
        keywords: ["like", "gem", "comment", "share", "repost", "report post", "reason", "review"],
        sections: [
          { heading: "How to Interact with a Post?", steps: ["Browse the News Feed to view publications shared by other users.", <>Click the {strong("Gem")} button to show your appreciation.</>, <>Click {strong("Comment")} to write and share your opinion.</>, <>Click {strong("Share")} to repost the publication on your profile.</>] },
          { heading: "How to Report a Post?", steps: [<>Click on the {strong("Report")} option if you find inappropriate content.</>, "Select the reason for reporting.", "Submit your report for review by the administration team."] },
        ],
      },
      {
        id: "danger",
        title: "Monuments in Danger",
        pageTitle: "Monuments in Danger!",
        description: "how to report endangered monuments.",
        href: "/help/Monuments-in-danger",
        keywords: ["monument in danger", "endangered", "report monument", "damage", "urgency", "photo", "submit report"],
        sections: [{ heading: "How to Report a Monument in Danger?", steps: [<>Go to the {strong("Monuments in Danger")} section from the menu.</>, <>Click on {strong("Report a Monument")}.</>, "Enter the name of the monument.", "Add the location, city or exact address.", "Select the urgency level: low, medium, or high.", "Upload clear photos showing the damage.", "Provide a short description explaining the situation.", <>Click {strong("Submit Report")} to send your request.</>] }],
      },
      {
        id: "reporting",
        title: "Reporting Content",
        pageTitle: "Reporting Content!",
        description: "moderation and review process.",
        href: "/help/Reporting-content",
        keywords: ["report content", "inappropriate content", "spam", "false information", "moderation", "review", "submit"],
        sections: [{ heading: "How to Report Inappropriate Content?", steps: [<>Click on the {strong("Report")} option, usually available in the post menu.</>, "Select the reason for reporting: spam, inappropriate content, false information, etc.", "Provide additional details if required.", <>Click {strong("Submit")} to send your request.</>] }],
      },
      {
        id: "search",
        title: "Search & Filters",
        pageTitle: "Search by Filter!",
        description: "how to filter by region, period.",
        href: "/help/Searche-by-filter",
        keywords: ["search", "filter", "region", "period", "historical period", "monument type", "post type", "apply filters"],
        sections: [{ heading: "How to Search Using Filters?", steps: ["Go to the News Feed page.", "Use the Search Bar to type keywords related to a monument or topic.", "Click on the Filter option to refine your search.", "Select the desired Historical Period.", "Choose the appropriate Monument Type.", "Select the Region.", "Choose the Post Type if needed.", <>Click {strong("Apply Filters")} to display the results.</>] }],
      },
    ],
  },
  fr: {
    heroTitle: "Aide et guide utilisateur",
    heroSubtitle: "Naviguez et contribuez à préserver l'héritage architectural de l'Algérie",
    searchPlaceholder: "Rechercher dans l'aide ...",
    viewFullPage: "Voir la page complète →",
    welcome: "Bienvenue sur la page d'aide !",
    topics: [
      { id: "account", title: "Gestion du compte", pageTitle: "Gestion du compte", description: "connexion, inscription, modification du profil.", href: "/help/Account-management", keywords: ["inscription", "connexion", "mot de passe", "profil", "email"], sections: [
        { heading: "Comment s'inscrire", steps: [<>Cliquez sur {strong("Sign Up")}</>, "Renseignez votre email, votre mot de passe et confirmez-le.", <>Cliquez sur {strong("Next")}</>, <>Si vous avez déjà un compte, cliquez sur {strong("Login")}</>] },
        { heading: "Comment se connecter", steps: [<>Si vous avez déjà un compte, cliquez sur {strong("Login")}.</>, "Entrez votre nom d'utilisateur.", "Entrez votre mot de passe.", <>Cochez {strong("Remember Me")} pour rester connecté.</>, <>Cliquez sur {strong("Login")} pour accéder à votre compte.</>], noteTitle: "Mot de passe oublié ?", notes: [<>Cliquez sur {strong("Forgot Password?")}.</>, <>Sélectionnez {strong("Reset")}.</>, "Suivez les instructions envoyées par email pour créer un nouveau mot de passe.", <>Vous pouvez vous connecter avec <strong>Google</strong> ou créer un compte avec {strong("Sign Up")}.</>] },
        { heading: "Comment modifier votre profil ?", steps: ["Accédez à votre page de profil.", <>Cliquez sur {strong("Edit Profile")}.</>, "Mettez à jour vos informations personnelles.", "Changez votre photo de profil si nécessaire.", <>Cliquez sur {strong("Done")}.</>] },
      ] },
      { id: "creating", title: "Création de publications", pageTitle: "Créer une publication !", description: "publication, tags, photos et visibilité.", href: "/help/Creating-posts", keywords: ["publication", "ajouter", "titre", "description", "image", "visibilité"], sections: [{ heading: "Comment créer une publication ?", steps: ["Après connexion, allez à la page d'accueil.", <>Cliquez sur le bouton {strong("Create Publication")}.</>, "Entrez un titre clair.", "Rédigez une description détaillée du monument ou du sujet.", "Téléversez des images pertinentes.", "Ajoutez une courte description de l'image si nécessaire.", "Choisissez les labels adaptés : type de publication, période historique, type de monument, région.", "Ajoutez la localisation du monument.", "Sélectionnez la visibilité, publique ou privée.", <>Cliquez sur {strong("Done")} pour partager.</>] }] },
      { id: "interaction", title: "Interaction avec les publications", pageTitle: "Interaction avec les publications !", description: "gemme, commentaire, signalement.", href: "/help/Interaction-withe-posts", keywords: ["gemme", "commentaire", "partager", "signaler"], sections: [{ heading: "Comment interagir avec une publication ?", steps: ["Parcourez le fil d'actualité.", <>Cliquez sur {strong("Gemme")} pour montrer votre appréciation.</>, <>Cliquez sur {strong("Comment")} pour donner votre avis.</>, <>Cliquez sur {strong("Share")} pour republier sur votre profil.</>] }, { heading: "Comment signaler une publication ?", steps: [<>Cliquez sur {strong("Report")} si le contenu est inapproprié.</>, "Sélectionnez la raison du signalement.", "Envoyez le signalement pour examen par l'équipe d'administration."] }] },
      { id: "danger", title: "Monuments en danger", pageTitle: "Monuments en danger !", description: "comment signaler les monuments menacés.", href: "/help/Monuments-in-danger", keywords: ["danger", "monument", "urgence", "dommage", "photo"], sections: [{ heading: "Comment signaler un monument en danger ?", steps: [<>Allez dans la section {strong("Monuments in Danger")} depuis le menu.</>, <>Cliquez sur {strong("Report a Monument")}.</>, "Entrez le nom du monument.", "Ajoutez la localisation, ville ou adresse exacte.", "Sélectionnez le niveau d'urgence : faible, moyen ou élevé.", "Téléversez des photos claires des dégâts.", "Ajoutez une courte description de la situation.", <>Cliquez sur {strong("Submit Report")} pour envoyer.</>] }] },
      { id: "reporting", title: "Signalement de contenu", pageTitle: "Signalement de contenu !", description: "modération et processus d'examen.", href: "/help/Reporting-content", keywords: ["signaler", "spam", "modération", "examen"], sections: [{ heading: "Comment signaler un contenu inapproprié ?", steps: [<>Cliquez sur l'option {strong("Report")}, généralement disponible dans le menu de la publication.</>, "Sélectionnez la raison : spam, contenu inapproprié, fausse information, etc.", "Ajoutez des détails si nécessaire.", <>Cliquez sur {strong("Submit")} pour envoyer.</>] }] },
      { id: "search", title: "Recherche et filtres", pageTitle: "Recherche par filtre !", description: "filtrer par région, période.", href: "/help/Searche-by-filter", keywords: ["recherche", "filtre", "région", "période"], sections: [{ heading: "Comment rechercher avec les filtres ?", steps: ["Allez au fil d'actualité.", "Utilisez la barre de recherche pour saisir des mots-clés.", "Cliquez sur l'option de filtre pour affiner la recherche.", "Sélectionnez la période historique souhaitée.", "Choisissez le type de monument.", "Sélectionnez la région.", "Choisissez le type de publication si nécessaire.", <>Cliquez sur {strong("Apply Filters")} pour afficher les résultats.</>] }] },
    ],
  },
  ar: {
    heroTitle: "المساعدة ودليل المستخدم",
    heroSubtitle: "تصفح وساهم في الحفاظ على الإرث المعماري للجزائر",
    searchPlaceholder: "ابحث في مواضيع المساعدة ...",
    viewFullPage: "عرض الصفحة الكاملة ←",
    welcome: "مرحباً بك في صفحة المساعدة!",
    topics: [
      { id: "account", title: "إدارة الحساب", pageTitle: "إدارة الحساب", description: "تسجيل الدخول، إنشاء الحساب، تعديل الملف الشخصي.", href: "/help/Account-management", keywords: ["حساب", "تسجيل", "دخول", "كلمة المرور", "الملف"], sections: [{ heading: "كيفية إنشاء حساب", steps: [<>اضغط على {strong("Sign Up")}</>, "أدخل بريدك الإلكتروني وكلمة المرور وقم بتأكيدها.", <>اضغط على {strong("Next")}</>, <>إذا كان لديك حساب، اضغط على {strong("Login")}</>] }, { heading: "كيفية تسجيل الدخول", steps: [<>إذا كان لديك حساب، اضغط على {strong("Login")}.</>, "أدخل اسم المستخدم.", "أدخل كلمة المرور.", <>فعّل {strong("Remember Me")} للبقاء متصلاً.</>, <>اضغط على {strong("Login")} للدخول إلى حسابك.</>], noteTitle: "هل نسيت كلمة المرور؟", notes: [<>اضغط على {strong("Forgot Password?")}.</>, <>اختر {strong("Reset")}.</>, "اتبع التعليمات المرسلة إلى بريدك لإنشاء كلمة مرور جديدة.", <>يمكنك الدخول عبر <strong>Google</strong> أو إنشاء حساب من {strong("Sign Up")}.</>] }, { heading: "كيفية تعديل ملفك الشخصي؟", steps: ["اذهب إلى صفحة ملفك الشخصي.", <>اضغط على {strong("Edit Profile")}.</>, "حدّث معلوماتك الشخصية.", "غيّر صورة الملف الشخصي إذا لزم الأمر.", <>اضغط على {strong("Done")}.</>] }] },
      { id: "creating", title: "إنشاء المنشورات", pageTitle: "إنشاء منشور!", description: "النشر، الوسوم، الصور، والظهور.", href: "/help/Creating-posts", keywords: ["منشور", "صورة", "عنوان", "وصف", "ظهور"], sections: [{ heading: "كيفية إنشاء منشور؟", steps: ["بعد تسجيل الدخول، انتقل إلى الصفحة الرئيسية.", <>اضغط على زر {strong("Create Publication")}.</>, "أدخل عنواناً واضحاً للمنشور.", "اكتب وصفاً مفصلاً يشرح المعلم أو الموضوع.", "ارفع صوراً مناسبة لتوضيح المنشور.", "أضف وصفاً قصيراً للصورة إذا لزم الأمر.", "اختر التصنيفات المناسبة: نوع المنشور، الفترة التاريخية، نوع المعلم، المنطقة.", "أضف موقع المعلم.", "اختر إعدادات الظهور، عام أو خاص.", <>اضغط على {strong("Done")} للمشاركة.</>] }] },
      { id: "interaction", title: "التفاعل مع المنشورات", pageTitle: "التفاعل مع المنشورات!", description: "جوهرة، تعليق، إبلاغ.", href: "/help/Interaction-withe-posts", keywords: ["جوهرة", "تعليق", "مشاركة", "إبلاغ"], sections: [{ heading: "كيف تتفاعل مع منشور؟", steps: ["تصفح آخر الأخبار لرؤية منشورات المستخدمين.", <>اضغط على {strong("جوهرة")} لإظهار تقديرك.</>, <>اضغط على {strong("Comment")} لكتابة رأيك.</>, <>اضغط على {strong("Share")} لإعادة نشره على ملفك.</>] }, { heading: "كيفية الإبلاغ عن منشور؟", steps: [<>اضغط على {strong("Report")} إذا وجدت محتوى غير مناسب.</>, "اختر سبب الإبلاغ.", "أرسل البلاغ ليتم مراجعته من طرف فريق الإدارة."] }] },
      { id: "danger", title: "المعالم المهددة", pageTitle: "المعالم المهددة!", description: "كيفية الإبلاغ عن المعالم المعرضة للخطر.", href: "/help/Monuments-in-danger", keywords: ["خطر", "معلم", "ضرر", "صورة"], sections: [{ heading: "كيفية الإبلاغ عن معلم في خطر؟", steps: [<>اذهب إلى قسم {strong("Monuments in Danger")} من القائمة.</>, <>اضغط على {strong("Report a Monument")}.</>, "أدخل اسم المعلم.", "أضف الموقع، المدينة أو العنوان الدقيق.", "حدد مستوى الخطورة: منخفض، متوسط أو عالٍ.", "ارفع صوراً واضحة تظهر الضرر.", "قدم وصفاً قصيراً يشرح الوضع.", <>اضغط على {strong("Submit Report")} للإرسال.</>] }] },
      { id: "reporting", title: "الإبلاغ عن المحتوى", pageTitle: "الإبلاغ عن المحتوى!", description: "المراجعة وعملية الإشراف.", href: "/help/Reporting-content", keywords: ["إبلاغ", "محتوى", "إشراف", "سبام"], sections: [{ heading: "كيفية الإبلاغ عن محتوى غير مناسب؟", steps: [<>اضغط على خيار {strong("Report")} الموجود غالباً في قائمة المنشور.</>, "اختر سبب الإبلاغ: سبام، محتوى غير مناسب، معلومات خاطئة، إلخ.", "أضف تفاصيل إضافية إذا لزم الأمر.", <>اضغط على {strong("Submit")} للإرسال.</>] }] },
      { id: "search", title: "البحث والفلاتر", pageTitle: "البحث بالفلاتر!", description: "التصفية حسب المنطقة والفترة.", href: "/help/Searche-by-filter", keywords: ["بحث", "فلتر", "منطقة", "فترة"], sections: [{ heading: "كيفية البحث باستخدام الفلاتر؟", steps: ["اذهب إلى صفحة آخر الأخبار.", "استخدم شريط البحث لكتابة كلمات مرتبطة بمعلم أو موضوع.", "اضغط على خيار الفلتر لتحسين البحث.", "اختر الفترة التاريخية المطلوبة.", "اختر نوع المعلم المناسب.", "حدد المنطقة.", "اختر نوع المنشور إذا لزم الأمر.", <>اضغط على {strong("Apply Filters")} لعرض النتائج.</>] }] },
    ],
  },
};

function attachIcons(topic: Omit<HelpTopic, "icon">): HelpTopic {
  const icons: Record<string, React.ReactNode> = {
    account: <UserCog {...iconProps} />,
    creating: <SquarePen {...iconProps} />,
    interaction: <MessagesSquare {...iconProps} />,
    danger: <Church {...iconProps} />,
    reporting: <FileX {...iconProps} />,
    search: <Search {...iconProps} />,
  };
  return { ...topic, icon: icons[topic.id] ?? <Search {...iconProps} /> };
}

export function getHelpContent(locale: string) {
  const copy = HELP_COPY[localeKey(locale)];
  return { ...copy, topics: copy.topics.map(attachIcons) };
}

export function TopicContent({ topic, locale, compact = false }: { topic: HelpTopic; locale: string; compact?: boolean }) {
  const direction = helpDirection(locale);
  const textAlign = helpTextAlign(locale);
  return (
    <div dir={direction} style={{ display: "flex", flexDirection: "column", gap: compact ? "24px" : "28px", textAlign }}>
      {topic.sections.map((section) => (
        <div key={section.heading} style={compact ? undefined : { backgroundColor: "rgba(67, 40, 23, 0.10)", border: "2px solid #432817", borderRadius: "10px", padding: "36px 46px" }}>
          <p style={{ color: "#432817", fontFamily: "var(--font-lato), 'Lato', sans-serif", fontWeight: 600, fontSize: compact ? "22px" : "35px", marginBottom: "16px", textAlign }}>
            {section.heading}
          </p>
          <ol style={{ color: "#000000", fontFamily: "var(--font-lato), 'Lato', sans-serif", fontWeight: 400, fontSize: compact ? "16px" : "20px", lineHeight: compact ? "28px" : "30px", paddingInlineStart: "24px", listStyleType: "decimal", textAlign }}>
            {section.steps.map((step, index) => <li key={index}>{step}</li>)}
          </ol>
          {section.noteTitle && (
            <div style={{ marginTop: "14px" }}>
              <p style={{ color: "#000000", fontWeight: 700, fontSize: compact ? "16px" : "20px", marginBottom: "6px", textAlign }}>{section.noteTitle}</p>
              <ul style={{ color: "#000000", fontSize: compact ? "16px" : "20px", lineHeight: compact ? "28px" : "30px", paddingInlineStart: "24px", listStyleType: "disc", textAlign }}>
                {section.notes?.map((note, index) => <li key={index}>{note}</li>)}
              </ul>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

export function HelpTopicDetailPage({ topicId }: { topicId: string }) {
  const { locale } = useLocaleSettings();
  const content = getHelpContent(locale);
  const topic = content.topics.find((item) => item.id === topicId) ?? content.topics[0];
  const direction = helpDirection(locale);
  const textAlign = helpTextAlign(locale);

  return (
    <div className="flex h-[100dvh] overflow-hidden" style={{ backgroundColor: "#FFF8E2" }}>
      <LeftSidebar activePage="help" />
      <div className="flex flex-col flex-1 overflow-y-auto md:ml-[68px]">
        <div className="px-4 md:px-8 pt-6">
          <BackButton bgColor="#FFF8E2" />
        </div>
        <div className="text-center py-6 md:py-10 px-4" dir={direction}>
          <p className="text-2xl md:text-[45px] font-normal leading-tight" style={{ color: "#000000", fontFamily: "var(--font-lato), 'Lato', sans-serif", textAlign: "center" }}>
            {content.welcome}
          </p>
          <p className="text-xl md:text-[40px] font-normal mt-2" style={{ color: "#000000", fontFamily: "var(--font-lato), 'Lato', sans-serif", textAlign: "center" }}>
            {topic.pageTitle}
          </p>
        </div>
        <div className="flex flex-col gap-7 px-4 md:px-16 pb-10" style={{ textAlign }}>
          <TopicContent topic={topic} locale={locale} />
        </div>
      </div>
    </div>
  );
}

