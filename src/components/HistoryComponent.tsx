import { prisma } from "@/lib/db";
import { Clock, CopyCheck, Edit2 } from "lucide-react";
import Link from "next/link";
import React from "react";

type Props = {
  limit: number;
  userId: string;
};

const HistoryComponent = async ({ limit, userId }: Props) => {
  const games = await prisma.game.findMany({
    take: limit,
    where: {
      userId,
    },
    orderBy: {
      timeStarted: "desc",
    },
  });
  return (
    <div className="space-y-8">
      {games.map((game) => {
        return (
          <div className="flex items-center justify-between" key={game.id}>
            <div className="flex items-center">
              <div className="ml-4 space-y-1">
                <Link
                  className="text-base font-bold leading-none"
                  href={`/statistics/${game.id}`}
                >
                  {game.topic}
                </Link>
                <p className="flex items-center px-2 py-1 text-xs text-gray-500 rounded-lg w-fit">
                  <Clock className="w-4 h-4 mr-1" />
                  {new Date(game.timeEnded ?? 0).toLocaleDateString()}
                </p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default HistoryComponent;
