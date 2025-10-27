import { observer } from "mobx-react-lite";
import { useState, useEffect } from 'react';
import { SceneCardList } from '@/components/scene/SceneCardList';
import ScenePlayerModal from '@/components/scene/ScenePlayerModal';
import { MediaItem } from '@/types/media';
import { TabBar } from '@/components/layout/TabBar';
import { Footer } from '@/components/layout/Footer';
import { FloatingChatButton } from '@/components/chatbot/FloatingChatButton';
import { ChatbotInterface } from '@/components/chatbot/ChatbotInterface';
import { api } from '@/api/api';
import { SceneMediaInfo } from '@/api/schema.g';

const CATEGORIES = ['Conflict', 'Daily', 'Danger', 'Dive', 'Movement', 'Performance', 'Reaction', 'Romance', 'Sports'];
const PAGE_SIZE = 4;

const ScenePage = observer(() => {
  const [selectedGenre, setSelectedGenre] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [selectedMedia, setSelectedMedia] = useState<MediaItem | null>(null);
  const [scenes, setScenes] = useState<SceneMediaInfo[]>([]);

  const [chatOpen, setChatOpen] = useState(false);
  const [chatbotCategory, setChatbotCategory] = useState<string | null>(null);
  const [chatbotActorName, setChatbotActorName] = useState<string | null>(null);

  useEffect(() => {
    if (chatbotCategory !== null || chatbotActorName !== null) {

      api.sceneChatbotFilter({ category: chatbotCategory, actorName: chatbotActorName }).then((res) => {
        if (res) {
          setScenes(res.scenes);
        }
      });
    } else {

      api.sceneList({ category: selectedGenre }).then((res) => {
        if (res) {
          setScenes(res.scenes);
        }
      });
    }
  }, [selectedGenre, chatbotCategory, chatbotActorName]);

  const mediaItems: MediaItem[] = scenes.map((scene) => ({
    pk: scene.pk,
    title: scene.title,
    posterUrl: scene.thumbnailUrl || undefined,
    videoUrl: scene.videoUrl,
    genres: scene.categories,
    actors: scene.actors.map(actor => ({
      name: actor.name,
      imageUrl: actor.imageUrl ?? undefined
    })),
  }));

  const pagedItems = mediaItems.slice(0, page * PAGE_SIZE);

  return (
    <div className="text-white">

      <div className="fixed inset-0 z-0 w-screen h-screen">
        <div
          className="absolute inset-0 bg-cover bg-center opacity-80"
          style={{backgroundImage: "url('/bg-cinema.png')"}}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/30 to-black/60"/>
      </div>

      <div className="relative z-10 h-screen overflow-y-scroll scrollbar-hide bg-transparent backdrop-blur-sm">
        <TabBar/>

        <details className="max-w-[1920px] mx-auto px-6 mt-6 mb-4">
          <summary className="text-lg font-semibold cursor-pointer text-gray-200 hover:text-white transition">
            🎬 장르 선택 ▾
          </summary>
          <div className="mt-4 flex gap-2 flex-wrap">
            {CATEGORIES.map((genre) => {
              const isSelected = selectedGenre === genre;

              return (
                <button
                  key={genre}
                  onClick={() => {
                    setSelectedGenre(isSelected ? null : genre);
                    setPage(1);
                  }}
                  className={`px-3 py-1 rounded-full text-xs transition font-semibold backdrop-blur-sm ${
                    isSelected
                      ? 'bg-indigo-500/60 text-indigo-100'
                      : 'bg-indigo-500/20 text-white border border-white/20 hover:backdrop-brightness-110'
                  }`}
                >
                  {genre}
                </button>
              );
            })}
          </div>
        </details>

        <section className="max-w-[1920px] mx-auto px-6 pb-24 space-y-10">
          <SceneCardList
            items={pagedItems}
            onSelect={(media) => setSelectedMedia(media)}
          />

          {mediaItems.length > pagedItems.length && (
            <div className="flex justify-center">
              <button
                onClick={() => setPage((p) => p + 1)}
                className="px-6 py-2 rounded-full border border-white text-white hover:bg-white/10 transition"
              >
                더 보기
              </button>
            </div>
          )}
        </section>

        <Footer/>
      </div>

      {selectedMedia && (
        <ScenePlayerModal
          media={selectedMedia}
          onClose={() => setSelectedMedia(null)}
        />
      )}

      <FloatingChatButton onClick={() => setChatOpen(true)}/>

      {chatOpen && (
        <ChatbotInterface
          onClose={() => setChatOpen(false)}
          onFilter={(category, actorName) => {

            setSelectedGenre(null);
            setChatbotCategory(category);
            setChatbotActorName(actorName);
            setPage(1);
          }}
        />
      )}
    </div>
  );
});

export default ScenePage;