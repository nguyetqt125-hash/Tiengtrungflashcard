import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Grid, Trophy, Sparkles, Volume2, RefreshCw } from 'lucide-react';
import { Flashcard } from '../../types';
import { speakChinese } from '../../utils/speech';
import { recordCardReview } from '../../utils/srs';
import { GameCustomSettings } from './GameSettingsModal';

interface Tile {
  id: string;
  cardId: string;
  type: 'term' | 'meaning';
  text: string;
  subtext?: string;
  isMatched: boolean;
  isSelected: boolean;
  isWrong: boolean;
}

interface TileMatchGameProps {
  cards: Flashcard[];
  settings: GameCustomSettings;
  onFinish: (score: number, seconds: number) => void;
}

export const TileMatchGame: React.FC<TileMatchGameProps> = ({
  cards,
  settings,
  onFinish,
}) => {
  const [tiles, setTiles] = useState<Tile[]>([]);
  const [selectedTile, setSelectedTile] = useState<Tile | null>(null);
  const [matchesCount, setMatchesCount] = useState(0);
  const [score, setScore] = useState(0);
  const [seconds, setSeconds] = useState(0);
  const [totalPairs, setTotalPairs] = useState(8);

  useEffect(() => {
    const pairCount = Math.min(cards.length, settings.questionCount);
    setTotalPairs(pairCount);
    const selectedCards = [...cards].sort(() => 0.5 - Math.random()).slice(0, pairCount);

    const generatedTiles: Tile[] = [];
    selectedCards.forEach((card, idx) => {
      generatedTiles.push({
        id: `tile-term-${idx}-${card.id}`,
        cardId: card.id,
        type: 'term',
        text: card.term,
        subtext: card.pinyin,
        isMatched: false,
        isSelected: false,
        isWrong: false,
      });

      generatedTiles.push({
        id: `tile-meaning-${idx}-${card.id}`,
        cardId: card.id,
        type: 'meaning',
        text: card.definition,
        isMatched: false,
        isSelected: false,
        isWrong: false,
      });
    });

    setTiles(generatedTiles.sort(() => 0.5 - Math.random()));
    setMatchesCount(0);
    setSelectedTile(null);
    setScore(0);
    setSeconds(0);
  }, [cards, settings]);

  useEffect(() => {
    const timer = setInterval(() => {
      setSeconds((s) => s + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleTileClick = (clickedTile: Tile) => {
    if (clickedTile.isMatched || clickedTile.isSelected || clickedTile.isWrong) return;

    if (settings.soundEnabled && clickedTile.type === 'term') {
      speakChinese(clickedTile.text);
    }

    if (!selectedTile) {
      setSelectedTile(clickedTile);
      setTiles((prev) =>
        prev.map((t) => (t.id === clickedTile.id ? { ...t, isSelected: true } : t))
      );
      return;
    }

    if (selectedTile.id === clickedTile.id) return;

    if (selectedTile.cardId === clickedTile.cardId) {
      // Match found!
      setTiles((prev) =>
        prev.map((t) =>
          t.cardId === clickedTile.cardId ? { ...t, isMatched: true, isSelected: false } : t
        )
      );
      setSelectedTile(null);
      recordCardReview(clickedTile.cardId, true);
      setScore((s) => s + 100);

      setMatchesCount((prev) => {
        const nextCount = prev + 1;
        if (nextCount >= totalPairs) {
          setTimeout(() => onFinish(score + 100, seconds), 400);
        }
        return nextCount;
      });
    } else {
      // Wrong match
      setTiles((prev) =>
        prev.map((t) =>
          t.id === clickedTile.id || t.id === selectedTile.id
            ? { ...t, isSelected: true, isWrong: true }
            : t
        )
      );
      recordCardReview(clickedTile.cardId, false);
      recordCardReview(selectedTile.cardId, false);

      setTimeout(() => {
        setTiles((prev) =>
          prev.map((t) =>
            t.id === clickedTile.id || t.id === selectedTile.id
              ? { ...t, isSelected: false, isWrong: false }
              : t
          )
        );
        setSelectedTile(null);
      }, 700);
    }
  };

  return (
    <div className="relative w-full h-[78vh] min-h-[500px] bg-slate-950 rounded-3xl border border-slate-800 p-4 flex flex-col justify-between overflow-hidden select-none">
      {/* Top Bar Header */}
      <div className="z-10 bg-slate-900/90 border border-slate-800 backdrop-blur p-4 rounded-2xl flex items-center justify-between shadow-xl">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 rounded-xl">
            <Grid className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-indigo-300 uppercase tracking-wider block">
              Ghép Thẻ Nối Từ (Ghép {matchesCount}/{totalPairs} cặp)
            </span>
            <h2 className="text-base font-bold text-white">Chạm 2 thẻ tương ứng để hoàn thành cặp từ</h2>
          </div>
        </div>

        <div className="bg-slate-950 border border-slate-800 px-3.5 py-1.5 rounded-xl text-slate-300 font-bold text-xs flex items-center gap-2">
          <Trophy className="w-4 h-4 text-amber-400" />
          <span>{score} điểm</span>
        </div>
      </div>

      {/* Grid Canvas */}
      <div className="flex-1 my-3 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 overflow-y-auto p-1">
        {tiles.map((tile) => (
          <motion.div
            key={tile.id}
            whileHover={{ scale: tile.isMatched ? 1 : 1.03 }}
            whileTap={{ scale: tile.isMatched ? 1 : 0.95 }}
            onClick={() => handleTileClick(tile)}
            className={`p-4 rounded-2xl border-2 transition-all flex flex-col items-center justify-center text-center cursor-pointer min-h-[90px] shadow-md ${
              tile.isMatched
                ? 'bg-slate-900/40 border-slate-800 text-slate-600 opacity-30 pointer-events-none'
                : tile.isWrong
                ? 'bg-red-950 border-red-500 text-red-200 animate-shake'
                : tile.isSelected
                ? 'bg-indigo-900/80 border-indigo-400 text-white shadow-indigo-500/30'
                : 'bg-slate-900 border-slate-800 hover:border-slate-600 text-slate-200'
            }`}
          >
            <span
              className={`font-bold ${
                tile.type === 'term' ? 'text-lg font-serif text-amber-300' : 'text-xs text-white'
              }`}
            >
              {tile.text}
            </span>
            {tile.subtext && tile.type === 'term' && (
              <span className="text-[10px] text-slate-400 font-mono mt-0.5">{tile.subtext}</span>
            )}
          </motion.div>
        ))}
      </div>
    </div>
  );
};
