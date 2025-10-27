import { MediaItem } from '../types/media';

export const dummySceneMediaItems: MediaItem[] = [
  {
    pk: 1,
    title: 'Pexels Nature Demo',
    videoUrl: 'https://videos.pexels.com/video-files/32249148/13754108_2560_1440_30fps.mp4',
    posterUrl: 'https://dummyimage.com/800x450/222/fff&text=Pexels+Nature',
    genres: ['감동', '테스트'],
    scenes: [
      {
        title: '초반 숲 풍경',
        description: '나뭇잎과 산책로 등장',
        seekTo: 5,
        duration: 7,
        thumbnailUrl: 'https://dummyimage.com/80x45/111/eee&text=Scene1',
      },
      {
        title: '햇살 비추는 숲',
        description: '빛이 천천히 들어오는 모습',
        seekTo: 12,
        duration: 8,
        thumbnailUrl: 'https://dummyimage.com/80x45/222/ddd&text=Scene2',
      },
      {
        title: '카메라 패닝',
        description: '부드럽게 숲을 스윽 비춤',
        seekTo: 20,
        duration: 8,
        thumbnailUrl: 'https://dummyimage.com/80x45/333/ccc&text=Scene3',
      },
      {
        title: '클로즈업',
        description: '나뭇잎 클로즈업 장면',
        seekTo: 28,
        duration: 8,
        thumbnailUrl: 'https://dummyimage.com/80x45/444/bbb&text=Scene4',
      },
      {
        title: '마무리 풍경',
        description: '잔잔한 마무리 장면',
        seekTo: 36,
        duration: 13,
        thumbnailUrl: 'https://dummyimage.com/80x45/555/aaa&text=Scene5',
      },
    ],
  },
];