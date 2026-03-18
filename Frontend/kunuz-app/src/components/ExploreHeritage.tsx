import { Lato } from "next/font/google";

const lato = Lato({
  subsets: ["latin"],
  weight: ["400", "700"],
});

interface PostImage {
  id: string;
  image: string;
  uploaded_at: string;
}

interface Post {
  id: string;
  title: string;
  images: PostImage[];
}

interface HeritageImage {
  id: string;
  src: string;
  alt: string;
  title: string;
}

const fallbackImages: HeritageImage[] = [
  { id: "1", src: "/Picture 1(1).jpg", alt: "Heritage", title: "Minaret" },
  { id: "2", src: "/download 2.jpg", alt: "Heritage", title: "Moorish Facade" },
  { id: "3", src: "/Picture 5.jpg", alt: "Heritage", title: "Stone Bridge" },
  { id: "4", src: "/Picture 2.jpg", alt: "Heritage", title: "Roman Ruins" },
  { id: "5", src: "/about-3.jpg", alt: "Heritage", title: "Courtyard" },
  { id: "6", src: "/Picture 6.jpg", alt: "Heritage", title: "Islamic Corridor" },
];

async function getHeritageImages(): Promise<HeritageImage[]> {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/posts/`, {
      next: { revalidate: 60 },
    });
    if (!res.ok) return fallbackImages;
    const data = await res.json();
    const posts: Post[] = data.results;
    const postsWithImages = posts
      .filter((post) => post.images?.[0]?.image)
      .slice(0, 6)
      .map((post) => ({
        id: post.id,
        src: `${process.env.NEXT_PUBLIC_API_URL}${post.images[0].image}`,
        alt: post.title,
        title: post.title,
      }));
    return postsWithImages.length > 0 ? postsWithImages : fallbackImages;
  } catch {
    return fallbackImages;
  }
}

function ImageCard({ img, height }: { img: HeritageImage | undefined; height: string }) {
  if (!img) return <div className={`w-full ${height} rounded-2xl bg-gray-200`} />;
  return (
    <div
      className={`w-full ${height} rounded-2xl overflow-hidden relative group cursor-pointer transition-transform duration-300 ease-out hover:scale-105`}
    >
      <img
        src={img.src}
        alt={img.alt}
        className="w-full h-full object-cover rounded-2xl transition-transform duration-300 ease-out group-hover:scale-110 group-hover:blur-[1px]"
      />
      <div className="absolute inset-0 bg-black/40 flex items-center justify-center px-2 text-center text-white text-sm font-semibold opacity-0 group-hover:opacity-100 transition-opacity duration-300">
        {img.title}
      </div>
    </div>
  );
}

export default async function ExploreHeritage() {
  const images = await getHeritageImages();
  const leftImages = images.slice(0, 3);
  const rightImages = images.slice(3, 6);
  return (
    <section
      id="explore"
      className="w-full py-20 px-8 lg:px-24 xl:px-32 scroll-mt-24"
      style={{ backgroundColor: "#FFF8E2" }}
    >
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row-reverse items-center justify-center gap-12 lg:gap-20">
        <div className="flex-1 flex flex-col justify-center items-start text-left">
          <h2
            className="font-bold text-[32px] md:text-[36px] lg:text-[44px] leading-tight text-[#2C1A0E] mb-8"
            style={{ fontFamily: 'var(--font-lato), system-ui, sans-serif' }}
          >
            Discover Our Heritage &amp; <br />
            Community
          </h2>
          <p
            className="text-lg md:text-xl lg:text-2xl leading-[1.85] text-[#2C1A0E]"
            style={{ fontFamily: 'var(--font-lato), system-ui, sans-serif' }}
          >
            Discover reflections, personal experiences, historical insights, and
            cultural discoveries shared by heritage enthusiasts from across the
            community. Through every post, members document forgotten landmarks,
            highlight monuments at risk, and celebrate the traditions that shape
            our identity. Explore recent contributions and become part of a
            growing movement dedicated to preserving and passing on our cultural
            legacy to future generations.
          </p>
        </div>
        <div className="flex flex-row gap-3 shrink-0 w-full max-w-[340px] md:w-[400px] lg:w-[460px] justify-center mx-auto md:mx-0">
          <div className="flex flex-col gap-3 w-1/2">
            <ImageCard img={leftImages[0]} height="h-[200px] md:h-[230px] lg:h-[260px]" />
            <ImageCard img={leftImages[1]} height="h-[185px] md:h-[210px] lg:h-[240px]" />
            <ImageCard img={leftImages[2]} height="h-[160px] md:h-[185px] lg:h-[210px]" />
          </div>
          <div className="flex flex-col gap-3 w-1/2">
            <ImageCard img={rightImages[0]} height="h-[155px] md:h-[180px] lg:h-[200px]" />
            <ImageCard img={rightImages[1]} height="h-[210px] md:h-[240px] lg:h-[270px]" />
            <ImageCard img={rightImages[2]} height="h-[195px] md:h-[220px] lg:h-[250px]" />
          </div>
        </div>
      </div>
    </section>
  );
}