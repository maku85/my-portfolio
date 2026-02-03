"use client";

import type React from "react";
import { useState } from "react";

type CardComponentType = React.ComponentType;

interface CardMasonryProps {
  cards: CardComponentType[];
  shuffleLabel?: string;
}

function reorder<T>(list: T[], startIndex: number, endIndex: number): T[] {
  const result = Array.from(list);
  const [removed] = result.splice(startIndex, 1);
  result.splice(endIndex, 0, removed);
  return result;
}

function shuffle<T>(array: T[]): T[] {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

const shakeStyle = `
@keyframes shake {
  0% { transform: translateX(0); }
  15% { transform: translateX(-8px); }
  30% { transform: translateX(8px); }
  45% { transform: translateX(-6px); }
  60% { transform: translateX(6px); }
  75% { transform: translateX(-4px); }
  90% { transform: translateX(4px); }
  100% { transform: translateX(0); }
}
.shake {
  animation: shake 0.5s cubic-bezier(.36,.07,.19,.97) both;
}
`;

const CardMasonry: React.FC<CardMasonryProps> = ({ cards, shuffleLabel }) => {
  const [cardList, setCardList] = useState(cards);
  const [draggedIdx, setDraggedIdx] = useState<number | null>(null);
  const [shake, setShake] = useState(false);

  const handleDragStart = (idx: number) => setDraggedIdx(idx);
  const handleDragOver = (e: React.DragEvent<HTMLLIElement>, idx: number) => {
    e.preventDefault();
    if (draggedIdx === null || draggedIdx === idx) return;
    setCardList(reorder(cardList, draggedIdx, idx));
    setDraggedIdx(idx);
  };
  const handleDragEnd = () => setDraggedIdx(null);

  const handleShuffle = () => {
    setCardList(shuffle(cardList));
    setShake(true);
    setTimeout(() => setShake(false), 500);
  };

  return (
    <div>
      {shuffleLabel && (
        <>
          <style>{shakeStyle}</style>
          <div className="max-w-6xl mx-auto flex justify-end mb-6">
            {cardList.length > 1 && (
              <button
                type="button"
                onClick={handleShuffle}
                className="px-4 py-2 bg-primary text-white rounded-md font-semibold hover:bg-primary-dark transition"
              >
                {shuffleLabel}
              </button>
            )}
          </div>
        </>
      )}
      <div className="max-w-6xl mx-auto columns-1 sm:columns-2 lg:columns-3 gap-6 [column-fill:_balance]">
        <ul>
          {cardList.map((CardComponent, idx) => (
            <li
              key={idx}
              draggable
              onDragStart={() => handleDragStart(idx)}
              onDragOver={(e) => handleDragOver(e, idx)}
              onDragEnd={handleDragEnd}
              className={`mb-6 break-inside-avoid cursor-move transition-transform ${
                draggedIdx === idx ? "scale-95 opacity-80" : ""
              } ${shake ? "shake" : ""}`}
            >
              <CardComponent />
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default CardMasonry;
