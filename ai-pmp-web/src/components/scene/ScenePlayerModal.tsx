'use client';

import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';
import Image from 'next/image';
import { MediaItem } from '@/types/media';
import { api } from '@/api/api';
import { SceneTimestampInfo } from '@/api/schema.g';

interface Props {
  media: MediaItem;
  onClose: () => void;
}

export default function ScenePlayerModal({ media, onClose }: Props) {
  const [mounted, setMounted] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [timestamps, setTimestamps] = useState<SceneTimestampInfo[]>([]);

  useEffect(() => {
    setMounted(true);
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose]);

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
    }
  };

  useEffect(() => {
    api.sceneDetail({ sceneMediaPk: media.pk }).then((res) => {
      if (res) {
        setTimestamps(res.timestamps);
      }
    });
  }, [media.pk]);

  if (!mounted) return null;

  const handleSeekTo = (timestamp: string) => {
    if (videoRef.current) {

      const parts = timestamp.split(':');
      const hours = parseInt(parts[0] ?? '0');
      const minutes = parseInt(parts[1] ?? '0');
      const seconds = parseFloat(parts[2] ?? '0');
      const totalSeconds = hours * 3600 + minutes * 60 + seconds;

      videoRef.current.currentTime = totalSeconds;
      videoRef.current.play();
    }
  };

  return createPortal(
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <motion.div
          className="relative w-full max-w-6xl h-[90vh] rounded-3xl overflow-hidden shadow-2xl border border-yellow-800/30 bg-gradient-to-b from-zinc-900 via-black to-zinc-900"
          initial={{ scale: 0.95 }}
          animate={{ scale: 1 }}
          exit={{ scale: 0.95 }}
          onClick={(e) => e.stopPropagation()}
        >

          <div className="absolute top-4 right-4 z-50">
            <button
              onClick={onClose}
              className="bg-yellow-900/20 hover:bg-yellow-600/30 p-2 rounded-full shadow backdrop-blur"
            >
              <X size={20} className="text-yellow-300" />
            </button>
          </div>

          <div className="flex-1 px-6 pt-6 pb-3 flex items-center justify-center">
            <div className="w-full h-full rounded-xl overflow-hidden border border-yellow-800/30 shadow-inner bg-black">
              <video
                ref={videoRef}
                controls
                poster={media.posterUrl}
                className="w-full h-full object-contain"
                src={media.videoUrl}
                autoPlay
                muted
                onTimeUpdate={handleTimeUpdate}
              />
            </div>
          </div>

          <div className="relative px-6 pb-6 pt-4 bg-black border-t border-yellow-900/30">
            <div className="absolute inset-0">
              <Image
                src="/scene-strip-bg.png"
                alt="Scene Background"
                fill
                className="object-cover opacity-30"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black/30" />
            </div>

            <div className="relative flex gap-6 overflow-x-auto snap-x snap-mandatory scrollbar-thin scrollbar-thumb-yellow-600/50 scrollbar-track-yellow-900/20 py-3 px-2">
              {timestamps.map((ts) => {

                const startSeconds = timestampToSeconds(ts.startTimestamp);
                const endSeconds = timestampToSeconds(ts.endTimestamp);
                const isActive = currentTime >= startSeconds && currentTime < endSeconds;

                return (
                  <div
                    key={ts.pk}
                    onClick={() => handleSeekTo(ts.startTimestamp)}
                    className={`cursor-pointer flex-shrink-0 rounded-xl overflow-hidden transition-all transform group border snap-start
                      ${
                        isActive
                          ? 'border-yellow-400/80 bg-yellow-900/20 scale-105 shadow-xl shadow-yellow-300/30'
                          : 'border-yellow-500/30 hover:border-yellow-500/60 bg-white/5 hover:bg-white/10'
                      }
                      w-[180px] sm:w-[200px] md:w-[220px] xl:w-[240px]`}
                  >
                    <div className="relative h-[130px] w-full">
                      <Image
                        src={ts.thumbnailUrl ?? '/no-thumb.jpg'}
                        alt={`Scene ${ts.sceneId}`}
                        fill
                        className="object-cover"
                      />
                      <div className="absolute inset-0 bg-black/30 group-hover:bg-black/20" />
                    </div>
                    <div className="px-3 py-3 text-center space-y-1.5">
                      <div className="text-sm font-bold text-[#d4af37] truncate">
                        {ts.displayClass}
                      </div>
                      <div className="text-xs text-[#c2a95a] truncate">
                        {ts.majorityClass}
                      </div>
                      <div className="text-xs text-gray-400 truncate">
                        {ts.category}
                      </div>
                      <div className="text-xs text-[#c2a95a] font-mono">
                        {ts.startTimestamp.substring(0, 8)}
                      </div>
                      {ts.actors && ts.actors.length > 0 && (
                        <div className="mt-2 border-t border-yellow-500/20 pt-2 flex flex-wrap items-center justify-center gap-2">
                          {ts.actors.map((actor, actorIdx) => (
                            <div key={actorIdx} className="flex items-center gap-1.5">
                              {actor.imageUrl && (
                                <div className="relative w-6 h-6 rounded-full overflow-hidden border border-emerald-400/40">
                                  <Image
                                    src={actor.imageUrl}
                                    alt={actor.name}
                                    fill
                                    className="object-cover"
                                  />
                                </div>
                              )}
                              <div className="text-xs text-emerald-400 font-semibold truncate">
                                {actor.name}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>,
    document.body
  );
}

function timestampToSeconds(timestamp: string): number {
  const parts = timestamp.split(':');
  const hours = parseInt(parts[0] ?? '0');
  const minutes = parseInt(parts[1] ?? '0');
  const seconds = parseFloat(parts[2] ?? '0');
  return hours * 3600 + minutes * 60 + seconds;
}